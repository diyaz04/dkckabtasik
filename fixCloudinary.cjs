const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

// 1. Add static import at the top
if (!content.includes("import { v2 as cloudinary } from 'cloudinary'")) {
  content = content.replace("import { createClient } from '@supabase/supabase-js';", "import { createClient } from '@supabase/supabase-js';\nimport { v2 as cloudinary } from 'cloudinary';");
}

// 2. Modify getCloudinary to use the static import
const oldGetCloudinary = `async function getCloudinary() {
  if (cloudinaryInstance) return cloudinaryInstance;
  try {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      const mod = await import('cloudinary');
      const cloudinary = mod.v2 || (mod as any).default?.v2;
      if (cloudinary) {
        cloudinary.config({
          cloud_name: CLOUDINARY_CLOUD_NAME,
          api_key: CLOUDINARY_API_KEY,
          api_secret: CLOUDINARY_API_SECRET,
        });
        cloudinaryInstance = cloudinary;
      }
    }
  } catch (_) { /* cloudinary not available */ }
  return cloudinaryInstance;
}`;

const newGetCloudinary = `function getCloudinary() {
  if (cloudinaryInstance) return cloudinaryInstance;
  try {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
      });
      cloudinaryInstance = cloudinary;
    }
  } catch (err) { console.error('Error configuring cloudinary:', err); }
  return cloudinaryInstance;
}`;

content = content.replace(oldGetCloudinary, newGetCloudinary);

fs.writeFileSync('api/index.ts', content);
console.log('Fixed cloudinary import');
