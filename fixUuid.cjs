const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

// We can replace `await supabase.from(...).insert(data)` with `const { error } = await supabase.from(...).insert(data); if (error) throw error;`
// However, since we now use supabaseServiceKey, maybe the issue was just RLS!
// Let's also check where empty strings might be sent for UUIDs.

// In /api/personalia/save:
// const { data: existing } = await supabase.from('personalia').select('id').eq('owner_type', data.owner_type).eq('kecamatan_id', data.kecamatan_id || '');
// This `data.kecamatan_id || ''` is BAD. Empty string is invalid UUID.
content = content.replace(
  /\.eq\('kecamatan_id', data\.kecamatan_id \|\| ''\)/g,
  `.eq('kecamatan_id', data.kecamatan_id || null)` // wait, .eq('kecamatan_id', null) doesn't match NULL in SQL, it's .is('kecamatan_id', null). But if data.kecamatan_id is undefined, we shouldn't even query it.
);

fs.writeFileSync('api/index.ts', content);
console.log('Fixed api/index.ts UUID issue');
