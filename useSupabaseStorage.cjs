const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

const oldUploadcare = `async function uploadToUploadcare(base64Data: string, filename: string, fileType: string) {
  // We're redirecting all Uploadcare traffic to Cloudinary because Cloudinary works perfectly for this user
  // and Uploadcare CDN is returning 404 (likely due to unverified free account).
  // Cloudinary resource_type 'auto' handles PDFs, DOCs, and images correctly.
  return uploadFile(base64Data, filename, fileType);
}`;

const newUploadcare = `async function uploadToUploadcare(base64Data: string, filename: string, fileType: string) {
  // Cloudinary memblokir PDF by default (HTTP 401). Kita pakai Supabase Storage saja untuk dokumen!
  try {
    const matches = base64Data.match(/^data:(.+?);base64,(.+)$/);
    if (!matches) throw new Error('Format base64 tidak valid');
    const mimeType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    // Pastikan bucket tersedia (jika belum ada, dibuat otomatis)
    await supabaseAdmin.storage.createBucket('berkas_dkc', { public: true }).catch(() => {});

    const { data, error } = await supabaseAdmin.storage
      .from('berkas_dkc')
      .upload(filename, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error) throw error;

    const { data: publicUrlData } = supabaseAdmin.storage.from('berkas_dkc').getPublicUrl(filename);
    return { url: publicUrlData.publicUrl, source: 'supabase' };
  } catch (e: any) {
    console.error('Supabase upload failed:', e.message);
    throw new Error('Gagal mengunggah dokumen ke Supabase: ' + e.message);
  }
}`;

content = content.replace(oldUploadcare, newUploadcare);
fs.writeFileSync('api/index.ts', content);
console.log('Done replacing to Supabase Storage');
