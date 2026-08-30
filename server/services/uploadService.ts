import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Local storage fallback settings
// On Vercel, process.cwd() is read-only, use /tmp instead
const isVercel = process.env.VERCEL === '1';
const DATA_DIR = isVercel ? path.join('/tmp', 'data') : path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch (e) {
  console.warn("Could not create uploads directory (might be read-only FS):", e);
}

// Lazy initialization helpers
let isCloudinaryConfigured = false;
let isUploadcareConfigured = false;
let isSupabaseConfigured = false;

function initCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    isCloudinaryConfigured = true;
  } else {
    console.warn("⚠️ Cloudinary credentials are not fully configured in environment variables. Falling back to local storage.");
  }
}

function initUploadcare() {
  if (process.env.UPLOADCARE_PUBLIC_KEY) {
    isUploadcareConfigured = true;
  } else {
    console.warn("⚠️ UPLOADCARE_PUBLIC_KEY belum di-set di environment variables. Upload berkas Pusat Unduhan akan fallback ke local storage.");
  }
}

let supabaseClient: any = null;
function initSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    isSupabaseConfigured = true;
  } else {
    console.warn("⚠️ Supabase credentials are not fully configured in environment variables. Link saving to Supabase will be bypassed.");
  }
}

// Initialize once
initCloudinary();
initUploadcare();
initSupabase();

// Simpan metadata link hasil upload (dari provider apapun) ke tabel `uploaded_assets` di Supabase
async function logAssetToSupabase(filename: string, fileUrl: string, fileType: string, provider: string) {
  if (!isSupabaseConfigured) initSupabase();
  if (!isSupabaseConfigured || !supabaseClient) return;

  try {
    console.log(`Saving ${provider} asset link to Supabase...`);
    const { error } = await supabaseClient
      .from('uploaded_assets')
      .insert([
        {
          filename: filename,
          cloudinary_url: fileUrl,
          file_type: fileType
        }
      ]);

    if (error) {
      console.error("❌ Supabase insertion error:", error.message);
      console.info("Note: Please make sure a table named 'uploaded_assets' with columns (filename, cloudinary_url, file_type) exists in your Supabase database.");
    } else {
      console.log("✅ Asset link successfully saved to Supabase.");
    }
  } catch (dbErr: any) {
    console.error("❌ Failed to communicate with Supabase:", dbErr.message);
  }
}

interface UploadResult {
  url: string;
  source: 'cloudinary' | 'uploadcare' | 'local';
}

export async function uploadFile(base64Data: string, filename: string, fileType: string): Promise<UploadResult> {
  // Ensure init runs if environment variables were updated after start
  if (!isCloudinaryConfigured) initCloudinary();

  if (isCloudinaryConfigured) {
    try {
      console.log(`Uploading ${filename} to Cloudinary...`);
      
      // Upload using base64 string
      const uploadResponse = await cloudinary.uploader.upload(base64Data, {
        folder: 'dkc_tasikmalaya',
        public_id: filename.split('.')[0],
        resource_type: 'auto',
      });

      const cloudinaryUrl = uploadResponse.secure_url;
      console.log(`Upload successful! Cloudinary URL: ${cloudinaryUrl}`);

      await logAssetToSupabase(filename, cloudinaryUrl, fileType, 'Cloudinary');

      return {
        url: cloudinaryUrl,
        source: 'cloudinary'
      };
    } catch (error: any) {
      console.error("❌ Cloudinary upload failed, falling back to local:", error.message || error);
    }
  }

  // Fallback: Local file saving
  return saveLocalFile(base64Data, filename);
}

/**
 * Upload berkas ke Uploadcare (dipakai khusus untuk Pusat Unduhan Berkas / Informasi).
 * Link CDN hasil upload disimpan ke Supabase (tabel uploaded_assets), sama seperti
 * pola upload Cloudinary di atas. Kalau UPLOADCARE_PUBLIC_KEY belum di-set,
 * fallback ke local storage biar dev tetap jalan.
 */
export async function uploadToUploadcare(base64Data: string, filename: string, fileType: string): Promise<UploadResult> {
  if (!isUploadcareConfigured) initUploadcare();

  if (isUploadcareConfigured) {
    try {
      console.log(`Uploading ${filename} to Uploadcare...`);

      const matches = base64Data.match(/^data:([A-Za-z0-9-+\/]+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : 'application/octet-stream';
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');

      const form = new FormData();
      form.append('UPLOADCARE_PUB_KEY', process.env.UPLOADCARE_PUBLIC_KEY as string);
      form.append('UPLOADCARE_STORE', '1');
      form.append('file', new Blob([buffer], { type: mimeType }), filename);

      const uploadRes = await fetch('https://upload.uploadcare.com/base/', {
        method: 'POST',
        body: form,
      });

      if (!uploadRes.ok) {
        throw new Error(`Uploadcare API error: ${uploadRes.status}`);
      }

      const resJson: any = await uploadRes.json();
      const fileUuid = resJson.file;
      if (!fileUuid) {
        throw new Error('Uploadcare tidak mengembalikan file UUID');
      }

      const uploadcareUrl = `https://ucarecdn.com/${fileUuid}/${encodeURIComponent(filename)}`;
      console.log(`Upload successful! Uploadcare URL: ${uploadcareUrl}`);

      await logAssetToSupabase(filename, uploadcareUrl, fileType, 'Uploadcare');

      return {
        url: uploadcareUrl,
        source: 'uploadcare'
      };
    } catch (error: any) {
      console.error("❌ Uploadcare upload failed, falling back to local:", error.message || error);
    }
  }

  // Fallback: Local file saving
  return saveLocalFile(base64Data, filename);
}

function saveLocalFile(base64Data: string, filename: string): UploadResult {
  console.log(`Saving ${filename} to local storage as fallback...`);
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  let buffer: Buffer;

  if (matches && matches.length === 3) {
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    // If it's already a clean base64 string without header
    buffer = Buffer.from(base64Data, 'base64');
  }

  const filepath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  return {
    url: `/uploads/${filename}`,
    source: 'local'
  };
}
