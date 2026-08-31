const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

// Uploadcare CDN URL should just be the UUID with trailing slash: https://ucarecdn.com/<UUID>/
// Some docs say you can append filename with /-/inline/yes/filename.ext or /-/attachment/filename.ext
// Since it's for documents (Unduhan Berkas), we want users to download it. So we append /-/attachment/filename.ext or we can just return the raw URL and let browser handle it.
// The raw URL is \`https://ucarecdn.com/\${resJson.file}/\`
// Let's use the raw URL.

content = content.replace(
  /\`https:\/\/ucarecdn\.com\/\$\{resJson\.file\}\/\$\{encodeURIComponent\(filename\)\}\`/g,
  "\`https://ucarecdn.com/\${resJson.file}/-/inline/yes/\`" // use inline so it opens in browser if pdf
);

fs.writeFileSync('api/index.ts', content);
console.log('Fixed uploadcare URL');
