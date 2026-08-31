const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

content = content.replace(/\.insert\((.*?)\)(?!.*\bthrowOnError\b)/g, '.insert($1).throwOnError()');
content = content.replace(/\.update\((.*?)\)(?!.*\bthrowOnError\b)/g, '.update($1).throwOnError()');
content = content.replace(/\.delete\(\)(?!.*\bthrowOnError\b)/g, '.delete().throwOnError()');
content = content.replace(/\.select\((.*?)\)(?!.*\bthrowOnError\b)/g, '.select($1).throwOnError()');

// Fix the eq('kecamatan_id', data.kecamatan_id || '')
content = content.replace(/eq\('kecamatan_id',\s*data\.kecamatan_id\s*\|\|\s*''\)/g, "eq('kecamatan_id', data.kecamatan_id || null)");

fs.writeFileSync('api/index.ts', content);
console.log('Added throwOnError() and fixed UUID');
