const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

// Replace uploadToUploadcare implementation to just use Cloudinary uploadFile
const oldUploadcare = `async function uploadToUploadcare(base64Data: string, filename: string, _fileType: string) {
  const pubKey = process.env.UPLOADCARE_PUBLIC_KEY;
  if (pubKey) {
    try {
      const matches = base64Data.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
      const mimeType = matches ? matches[1] : 'application/octet-stream';
      const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(base64Data, 'base64');
      const form = new FormData();
      form.append('UPLOADCARE_PUB_KEY', pubKey);
      form.append('UPLOADCARE_STORE', '1');
      form.append('file', new Blob([buffer], { type: mimeType }), filename);
      const uploadRes = await fetch('https://upload.uploadcare.com/base/', { method: 'POST', body: form });
      if (!uploadRes.ok) throw new Error(\`Uploadcare API error: \${uploadRes.status}\`);
      const resJson: any = await uploadRes.json();
      if (!resJson.file) throw new Error('No file UUID returned');
      return { url: \`https://ucarecdn.com/\${resJson.file}/-/inline/yes/\`, source: 'uploadcare' };
    } catch (e: any) {
      console.error('Uploadcare upload failed:', e.message);
    }
  }
  return { url: '/uploads/' + filename, source: 'local' };
}`;

const newUploadcare = `async function uploadToUploadcare(base64Data: string, filename: string, fileType: string) {
  // We're redirecting all Uploadcare traffic to Cloudinary because Cloudinary works perfectly for this user
  // and Uploadcare CDN is returning 404 (likely due to unverified free account).
  // Cloudinary resource_type 'auto' handles PDFs, DOCs, and images correctly.
  return uploadFile(base64Data, filename, fileType);
}`;

content = content.replace(oldUploadcare, newUploadcare);

fs.writeFileSync('api/index.ts', content);
console.log('Redirected Uploadcare to Cloudinary');
