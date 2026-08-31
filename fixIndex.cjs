const fs = require('fs');
let content = fs.readFileSync('api/index.ts', 'utf-8');

// 1. Change supabase to supabaseAdmin for all queries to bypass RLS in the server
content = content.replace(/supabase\./g, 'supabaseAdmin.');
content = content.replace(/const supabaseAdminAdmin/g, 'const supabaseAdmin');
content = content.replace(/export const supabaseAdminAdmin/g, 'export const supabaseAdmin');
// wait, `export const supabase = supabaseUrl && supabaseKey ...`
// Let's just do it cleanly by replacing `supabase.from` to `supabaseAdmin.from` and `supabase.auth` to `supabaseAdmin.auth`
content = fs.readFileSync('api/index.ts', 'utf-8');
content = content.replace(/supabase\.from/g, 'supabaseAdmin.from');
content = content.replace(/supabase\.auth/g, 'supabaseAdmin.auth');

// 2. Fix the personalia query
content = content.replace(
  /const \{ data: existing \} = await supabaseAdmin\.from\('personalia'\)\.select\('id'\)\.eq\('owner_type', data\.owner_type\)\.eq\('kecamatan_id', data\.kecamatan_id \|\| ''\);/g,
  `let query = supabaseAdmin.from('personalia').select('id').eq('owner_type', data.owner_type);
      if (data.kecamatan_id) query = query.eq('kecamatan_id', data.kecamatan_id);
      if (data.saka_id) query = query.eq('saka_id', data.saka_id);
      const { data: existing } = await query;`
);

// 3. For good measure, let's also fix the data potentials fetch which might have the same issue?
// No, I checked and it uses if (data.kecamatan_id) query.eq...

fs.writeFileSync('api/index.ts', content);
console.log('Fixed api/index.ts');
