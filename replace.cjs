const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

const regex = /async function uploadToUploadcare\([\s\S]*?return \{ url: '\/uploads\/' \+ filename, source: 'local' \};\s*\}/;

content = content.replace(regex, `async function uploadToUploadcare(base64Data: string, filename: string, _fileType: string) {
  return uploadFile(base64Data, filename, _fileType);
}`);

fs.writeFileSync('api/index.ts', content);
