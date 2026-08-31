const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

const oldUploadFile = `async function uploadFile(base64Data: string, filename: string, _fileType: string) {
  const cld = await getCloudinary();
  if (cld) {
    try {
      const res = await cld.uploader.upload(base64Data, {
        folder: 'dkc_tasikmalaya',
        public_id: filename.split('.')[0],
        resource_type: 'auto',
      });
      return { url: res.secure_url, source: 'cloudinary' };
    } catch (e: any) {
      console.error('Cloudinary upload failed:', e.message);
      throw new Error(\`Cloudinary error: \${e.message}\`);
    }
  }
  
  throw new Error('Cloudinary belum dikonfigurasi di Environment Variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
}`;

const newUploadFile = `async function uploadFile(base64Data: string, filename: string, fileType: string) {
  const cld = await getCloudinary();
  if (cld) {
    try {
      const res = await cld.uploader.upload(base64Data, {
        folder: 'dkc_tasikmalaya',
        public_id: filename.split('.')[0],
        resource_type: 'auto',
      });
      return { url: res.secure_url, source: 'cloudinary' };
    } catch (e: any) {
      console.error('Cloudinary upload failed, mencoba Uploadcare:', e.message);
    }
  }
  
  // Fallback ke Uploadcare
  try {
    const res = await uploadToUploadcare(base64Data, filename, fileType);
    return res;
  } catch (e: any) {
    throw new Error('Gagal mengunggah foto/berkas. Cloudinary tidak dikonfigurasi dan fallback Uploadcare gagal.');
  }
}`;

content = content.replace(oldUploadFile, newUploadFile);
fs.writeFileSync('api/index.ts', content);
console.log('Done');
