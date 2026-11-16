/**
 * Utility bersama untuk kompres gambar di browser sebelum diupload ke Cloudinary
 * (lewat endpoint /api/upload). Semua form yang butuh gambar WAJIB lewat sini,
 * tidak ada lagi opsi paste link manual.
 */

const MAX_DIMENSION = 1600; // px, sisi terpanjang
const INITIAL_QUALITY = 0.72;
const MIN_QUALITY = 0.4;
const TARGET_MAX_BYTES = 500 * 1024; // ~500KB target akhir

/**
 * Kompres file gambar jadi JPEG dataURL dengan resize + turunkan quality
 * secara bertahap sampai ukurannya kecil, tanpa bikin gambar rusak parah.
 */
export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File bukan gambar'));
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Gagal membuat canvas untuk kompresi'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      let quality = INITIAL_QUALITY;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);

      // Turunkan quality bertahap kalau masih kegedean
      while (dataUrl.length * 0.75 > TARGET_MAX_BYTES && quality > MIN_QUALITY) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(dataUrl);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal memuat gambar untuk dikompres'));
    };

    img.src = objectUrl;
  });
}

/**
 * Kompres (kalau gambar) lalu upload ke /api/upload (Cloudinary).
 * Untuk file non-gambar (pdf/doc dll) langsung diupload tanpa kompresi.
 * Mengembalikan URL final dari Cloudinary.
 */
export async function compressAndUploadFile(
  file: File,
  fileType: 'gambar' | 'dokumen' = 'gambar'
): Promise<string> {
  const isImage = file.type.startsWith('image/');
  const dataUrl = isImage ? await compressImage(file) : await readAsDataUrl(file);

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: dataUrl,
      name: file.name,
      type: isImage ? 'gambar' : fileType,
    }),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData?.error || 'Gagal mengunggah berkas');
  }
  return resData.url as string;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Kompres (kalau gambar) lalu upload ke Uploadcare lewat /api/upload/uploadcare.
 * Dipakai khusus untuk Pusat Unduhan Berkas (Informasi) — link hasil upload
 * disimpan lewat /api/informasi/save ke tabel `informasi` di Supabase.
 */
export async function compressAndUploadToUploadcare(file: File): Promise<string> {
  const isImage = file.type.startsWith('image/');
  const dataUrl = isImage ? await compressImage(file) : await readAsDataUrl(file);

  const response = await fetch('/api/upload/uploadcare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file: dataUrl,
      name: file.name,
      type: isImage ? 'gambar' : 'dokumen',
    }),
  });

  const resData = await response.json();
  if (!response.ok) {
    throw new Error(resData?.error || 'Gagal mengunggah berkas ke Uploadcare');
  }
  return resData.url as string;
}

/** Batas ukuran lampiran form pendaftaran kegiatan (surat tugas / surat mandat dll). */
export const MAX_FORM_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
export const FORM_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';

/**
 * Upload lampiran form pendaftaran ke Cloudinary lewat /api/upload/form-file.
 * Validasi: maks 2 MB, hanya PDF / JPG / PNG / WEBP. Gambar dikompres dulu, PDF dikirim apa adanya.
 * Melempar Error berpesan Indonesia kalau tidak valid.
 */
export async function uploadFormFile(file: File): Promise<string> {
  if (file.size > MAX_FORM_FILE_BYTES) {
    throw new Error(`Ukuran berkas ${(file.size / 1024 / 1024).toFixed(2)} MB melebihi batas 2 MB.`);
  }
  const okType = file.type === 'application/pdf' || ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
  if (!okType) throw new Error('Format berkas harus PDF, JPG, PNG, atau WEBP.');

  const dataUrl = file.type.startsWith('image/') ? await compressImage(file) : await readAsDataUrl(file);
  const response = await fetch('/api/upload/form-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ file: dataUrl, name: file.name }),
  });
  const resData = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(resData?.error || 'Gagal mengunggah berkas');
  return resData.url as string;
}
