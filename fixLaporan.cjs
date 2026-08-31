const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

// The issue is probably the `tanggal_pelaksanaan` being empty string instead of null, similar to `kecamatan_id`.
// When they create 02GP draft, they might not have filled `tanggal_pelaksanaan`.
// If it's `''`, Postgres date type rejects it.
// Let's fix `api/index.ts` to map empty strings to null for date fields.

content = content.replace(/tanggal_pelaksanaan: data\.tanggal_pelaksanaan,/g, "tanggal_pelaksanaan: data.tanggal_pelaksanaan || null,");

// Also for file_laporan_url
content = content.replace(/file_laporan_url: data\.file_laporan_url \|\| '',/g, "file_laporan_url: data.file_laporan_url || null,");
content = content.replace(/file_laporan_url: data\.file_laporan_url,/g, "file_laporan_url: data.file_laporan_url || null,");

// Add proper error checking to `laporan_kegiatan` save
content = content.replace(
  /const { data: ret } = await supabaseAdmin\.from\('laporan_kegiatan'\)\.insert\(\{([\s\S]*?)\}\)\.select\(\)\.single\(\);/g,
  `const { data: ret, error } = await supabaseAdmin.from('laporan_kegiatan').insert({$1}).select().single();\n        if (error) throw error;`
);

content = content.replace(
  /const { data: ret } = await supabaseAdmin\.from\('laporan_kegiatan'\)\.update\(\{([\s\S]*?)\}\)\.eq\('id', data\.id\)\.select\(\)\.single\(\);/g,
  `const { data: ret, error } = await supabaseAdmin.from('laporan_kegiatan').update({$1}).eq('id', data.id).select().single();\n        if (error) throw error;`
);

fs.writeFileSync('api/index.ts', content);
console.log('Fixed laporan date/url logic and added error throw');
