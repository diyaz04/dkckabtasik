import express, { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('SUPABASE_URL or SUPABASE_ANON_KEY is missing. API calls to Supabase will fail.');
}

// Tanpa persist/auto-refresh: server tidak boleh "mengingat" sesi user mana pun di client bersama.
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, noSession)
  : null as any;

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, noSession)
  : null as any;

const app = express();
// CORS: app Android (Capacitor) memanggil API dari origin https://localhost / capacitor://localhost.
// Tambahan origin lewat env CORS_ORIGINS (pisahkan dengan koma).
const allowedOrigins = new Set([
  'https://localhost',
  'http://localhost',
  'capacitor://localhost',
  'http://localhost:3000',
  'http://localhost:5173',
  ...String(process.env.CORS_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean),
]);
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = String(req.headers.origin || '');
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Upload helpers (inlined to avoid cross-folder imports that break Vercel) ──
let cloudinaryInstance: any = null;
async function getCloudinary() {
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
}

async function uploadFile(base64Data: string, filename: string, _fileType: string) {
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
      throw new Error(`Cloudinary error: ${e.message}`);
    }
  }
  
  throw new Error('Cloudinary belum dikonfigurasi di Environment Variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)');
}

async function uploadToUploadcare(base64Data: string, filename: string, _fileType: string) {
  return uploadFile(base64Data, filename, _fileType);
}

// ══════════════════════════════════════════════════════════════════════
// OTORISASI TERPUSAT
// Semua request ke /api lewat sini SEBELUM route. Aturan:
//  • GET  → publik, kecuali yang terdaftar di GET_RULES (data pribadi / internal)
//  • POST/PUT/DELETE → WAJIB login. Hanya yang ada di PUBLIC_WRITES yang terbuka.
//  • Route tulis yang tidak terdaftar di mana pun → default khusus admin (aman secara default)
// Role: 'admin' (DKC), 'user' (DKR Kecamatan), 'saka'.
// ══════════════════════════════════════════════════════════════════════
type AuthCtx = { userId: string; role: 'admin' | 'user' | 'saka'; kecamatan_id: string | null; saka_id: string | null };
const authOf = (req: Request) => (req as any).auth as AuthCtx;

class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}
const deny = (msg = 'Anda tidak memiliki akses untuk tindakan ini.') => new HttpError(403, msg);

async function loadAuth(req: Request): Promise<AuthCtx> {
  if (!supabaseAdmin) throw new HttpError(500, 'Supabase belum dikonfigurasi');
  const h = String(req.headers.authorization || '');
  const token = h.startsWith('Bearer ') ? h.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Sesi login tidak ditemukan. Silakan login ulang.', 'NO_TOKEN');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Sesi login sudah berakhir. Silakan login ulang.', 'TOKEN_EXPIRED');
  const { data: profile } = await supabaseAdmin
    .from('profiles').select('role, kecamatan_id, saka_id').eq('user_id', data.user.id).maybeSingle();
  if (!profile) throw new HttpError(403, 'Akun ini belum memiliki profil pengguna.');
  return { userId: data.user.id, role: profile.role, kecamatan_id: profile.kecamatan_id || null, saka_id: profile.saka_id || null };
}

// Apakah data (payload atau baris DB) milik user ini? Admin boleh semua; baris tanpa pemilik (level DKC) hanya admin.
function ownsRow(a: AuthCtx, row: { kecamatan_id?: any; saka_id?: any } | null | undefined): boolean {
  if (!row) return false;
  if (a.role === 'admin') return true;
  if (a.role === 'user') return !!a.kecamatan_id && row.kecamatan_id === a.kecamatan_id && !row.saka_id;
  if (a.role === 'saka') return !!a.saka_id && row.saka_id === a.saka_id && !row.kecamatan_id;
  return false;
}

// Non-admin: paksa kepemilikan sesuai akunnya, apa pun yang dikirim client.
function forceOwner(a: AuthCtx, body: any) {
  if (a.role === 'user') { body.kecamatan_id = a.kecamatan_id; delete body.saka_id; }
  else if (a.role === 'saka') { body.saka_id = a.saka_id; delete body.kecamatan_id; }
}

async function assertRowOwned(a: AuthCtx, table: string, id: any) {
  if (a.role === 'admin') return;
  if (!id) throw new HttpError(400, 'ID wajib diisi');
  const { data: row } = await supabaseAdmin.from(table).select('*').eq('id', id).maybeSingle();
  if (!row) throw new HttpError(404, 'Data tidak ditemukan');
  if (!ownsRow(a, row)) throw deny('Anda tidak memiliki akses ke data ini.');
}

// Simpan (insert/update) data milik kwarran/saka: create → cek payload, update → cek baris lama.
async function guardSave(a: AuthCtx, table: string, body: any) {
  if (a.role === 'admin') return;
  if (body.id) await assertRowOwned(a, table, body.id);
  else if (!ownsRow(a, body)) throw deny('Anda hanya boleh menambah data untuk kwarran/saka Anda sendiri.');
  forceOwner(a, body);
}

type Access = 'admin' | 'user' | 'owner';
type Rule = {
  method: string;
  re: RegExp;
  access: Access;
  roles?: Array<AuthCtx['role']>;                   // untuk access 'user': role yang diizinkan
  check?: (req: Request, a: AuthCtx, m: RegExpMatchArray) => Promise<void>;
};

const PUBLIC_WRITES: Array<[string, RegExp]> = [
  ['POST', /^\/auth\/login$/],
  ['POST', /^\/auth\/refresh$/],
  ['POST', /^\/auth\/change-password$/],           // memverifikasi token sendiri
  ['POST', /^\/upload$/],                           // dipakai form pendaftaran publik (bukti bayar)
  ['POST', /^\/upload\/uploadcare$/],
  ['POST', /^\/pangkalan\/register$/],              // form pendaftaran publik
  ['POST', /^\/berita\/[^/]+\/like$/],
  ['POST', /^\/agenda\/[^/]+\/register$/],
  ['POST', /^\/agenda\/[^/]+\/register-batch$/],
];

const GET_RULES: Rule[] = [
  { method: 'GET', re: /^\/users$/, access: 'admin' },
  { method: 'GET', re: /^\/surat-dkr$/, access: 'user', roles: ['admin', 'user'] },
  { method: 'GET', re: /^\/agenda\/[^/]+\/registrants$/, access: 'user', roles: ['admin', 'user'] },
  { method: 'GET', re: /^\/tagihan_kolektif$/, access: 'user', roles: ['admin', 'user'] },
];

const ownerBody = (table: string, opts: { status?: boolean } = {}) =>
  async (req: Request, a: AuthCtx) => {
    await guardSave(a, table, req.body);
    if (opts.status && a.role !== 'admin') {
      // Non-admin tidak boleh menyetujui/menerbitkan sendiri
      req.body.status = req.body.status === 'draft' ? 'draft' : 'pending';
    }
  };
const ownerRowById = (table: string) =>
  async (req: Request, a: AuthCtx) => { await assertRowOwned(a, table, req.body?.id); };
const ownerRowByParam = (table: string) =>
  async (req: Request, a: AuthCtx, m: RegExpMatchArray) => { await assertRowOwned(a, table, m[1]); };
const ownerFromBody = (field: 'kecamatan_id' | 'saka_id') =>
  async (req: Request, a: AuthCtx) => {
    if (a.role === 'admin') return;
    if (a[field] !== req.body?.[field] || !a[field]) throw deny('Anda hanya boleh mengubah data milik Anda sendiri.');
  };

const WRITE_RULES: Rule[] = [
  // ── Khusus admin DKC ──
  ...([
    ['POST', /^\/kecamatan\/toggle-active$/], ['POST', /^\/kecamatan\/wilayah-batch$/], ['POST', /^\/saka\/toggle-active$/],
    ['POST', /^\/dkc\/update$/], ['POST', /^\/wilayah\/save$/], ['POST', /^\/berita\/status$/],
    ['POST', /^\/informasi\/save$/], ['POST', /^\/informasi\/delete$/], ['POST', /^\/site_content\/save$/],
    ['POST', /^\/users\/reset_password$/], ['POST', /^\/users\/save$/],
    ['POST', /^\/laporan_kegiatan\/process$/],
    ['POST', /^\/tagihan_kolektif\/(status|sync|upsert)$/],
    ['POST', /^\/pendaftaran\/(checkin|lunas)\/[^/]+$/],
    ['POST', /^\/agenda\/[^/]+\/config$/], ['PUT', /^\/agenda\/[^/]+\/dashboard_config$/],
    ['POST', /^\/surat-dkr\/(read|status)$/],
  ] as Array<[string, RegExp]>).map(([method, re]): Rule => ({ method, re, access: 'admin' })),

  // ── Milik kwarran / saka sendiri (atau admin) ──
  { method: 'POST', re: /^\/dkr_profile\/update$/, access: 'owner', roles: ['user'], check: async (r, a) => ownerFromBody('kecamatan_id')(r, a) },
  { method: 'POST', re: /^\/saka_profile\/update$/, access: 'owner', roles: ['saka'], check: async (r, a) => ownerFromBody('saka_id')(r, a) },

  { method: 'POST', re: /^\/personalia\/save$/, access: 'owner', roles: ['user', 'saka'], check: ownerBody('personalia') },
  { method: 'POST', re: /^\/personalia\/update$/, access: 'owner', roles: ['user', 'saka'], check: ownerRowById('personalia') },
  { method: 'POST', re: /^\/personalia\/delete$/, access: 'owner', roles: ['user', 'saka'], check: ownerRowById('personalia') },

  { method: 'POST', re: /^\/pangkalan\/save$/, access: 'owner', roles: ['user', 'saka'], check: ownerBody('pangkalan') },
  { method: 'POST', re: /^\/pangkalan\/delete$/, access: 'owner', roles: ['user', 'saka'], check: ownerRowById('pangkalan') },

  { method: 'POST', re: /^\/data_potensial\/save$/, access: 'owner', roles: ['user', 'saka'], check: ownerBody('data_potensial') },

  { method: 'POST', re: /^\/berita\/save$/, access: 'owner', roles: ['user', 'saka'], check: async (req, a) => {
      await ownerBody('berita', { status: true })(req, a);
      if (a.role !== 'admin') { req.body.author_id = a.userId; delete req.body.likes; }
    } },
  { method: 'POST', re: /^\/berita\/delete$/, access: 'owner', roles: ['user', 'saka'], check: ownerRowById('berita') },

  { method: 'POST', re: /^\/agenda\/save$/, access: 'owner', roles: ['user', 'saka'], check: ownerBody('agenda_kegiatan') },
  { method: 'POST', re: /^\/agenda\/delete$/, access: 'owner', roles: ['user', 'saka'], check: ownerRowById('agenda_kegiatan') },

  { method: 'PUT', re: /^\/registrants\/([^/]+)$/, access: 'owner', roles: ['user'], check: ownerRowByParam('pendaftaran_peserta') },
  { method: 'DELETE', re: /^\/registrants\/([^/]+)$/, access: 'owner', roles: ['user'], check: ownerRowByParam('pendaftaran_peserta') },

  // Status dipaksa 'draft'/'pending' untuk non-admin (diterima/ditolak/revisi hanya lewat /process oleh admin)
  { method: 'POST', re: /^\/laporan_kegiatan\/save$/, access: 'owner', roles: ['user'], check: ownerBody('laporan_kegiatan', { status: true }) },
  { method: 'POST', re: /^\/tagihan_kolektif\/bayar$/, access: 'owner', roles: ['user'], check: ownerRowById('tagihan_kolektif') },

  // ── Surat DKR → DKC: DKR hanya menyentuh suratnya sendiri ──
  { method: 'POST', re: /^\/surat-dkr\/(save|seen|delete)$/, access: 'owner', roles: ['user'], check: async (req, a) => {
      if (a.role === 'user') req.body.kecamatan_id = a.kecamatan_id; // paksa; handler lalu membatasi ke kecamatan ini
    } },
];

app.use('/api', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.method === 'OPTIONS' || req.method === 'HEAD') return next();
    const path = req.path;

    if (req.method === 'GET') {
      const rule = GET_RULES.find(r => r.re.test(path));
      if (!rule) return next(); // GET publik
      const a = await loadAuth(req);
      (req as any).auth = a;
      if (rule.access === 'admin' && a.role !== 'admin') throw deny();
      if (rule.roles && !rule.roles.includes(a.role)) throw deny();
      return next();
    }

    if (PUBLIC_WRITES.some(([m, re]) => m === req.method && re.test(path))) return next();

    const a = await loadAuth(req);
    (req as any).auth = a;
    if (a.role === 'admin') {
      // Admin boleh semua, tapi tetap lewat rule agar body disanitasi bila perlu (mis. surat-dkr)
      return next();
    }

    const rule = WRITE_RULES.find(r => r.method === req.method && r.re.test(path));
    if (!rule || rule.access === 'admin') throw deny();               // default: khusus admin
    if (rule.roles && !rule.roles.includes(a.role)) throw deny();
    if (rule.check) await rule.check(req, a, path.match(rule.re)!);
    next();
  } catch (e: any) {
    if (e instanceof HttpError) return res.status(e.status).json({ error: e.message, code: e.code });
    console.error('Authz error:', e);
    res.status(500).json({ error: e.message || 'Gagal memeriksa akses' });
  }
});

// ── Health ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', supabaseConfigured: !!process.env.SUPABASE_URL });
});

// ── Auth ──
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    // Login memakai client anon terpisah (bukan supabaseAdmin) supaya sesi user tidak "menempel" ke client service-role.
    const loginClient = createClient(supabaseUrl, supabaseKey, noSession);
    const { data: authData, error: authError } = await loginClient.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) {
      return res.status(401).json({ error: authError?.message || 'Email atau password salah' });
    }

    const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('user_id', authData.user.id).single();

    let kecamatan = null;
    let saka = null;
    if (profile?.kecamatan_id) {
      const { data: k } = await supabaseAdmin.from('kecamatan').select('*').eq('id', profile.kecamatan_id).single();
      kecamatan = k;
    }
    if (profile?.saka_id) {
      const { data: s } = await supabaseAdmin.from('saka').select('*').eq('id', profile.saka_id).single();
      saka = s;
    }

    res.json({
      token: authData.session?.access_token,
      refresh_token: authData.session?.refresh_token,
      user: profile,
      kecamatan,
      saka
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login gagal' });
  }
});

// Tukar refresh token dengan access token baru (access token Supabase hanya berlaku ±1 jam)
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
  try {
    const refresh_token = String(req.body?.refresh_token || '');
    if (!refresh_token) return res.status(400).json({ error: 'refresh_token wajib diisi' });
    const client = createClient(supabaseUrl, supabaseKey, noSession);
    const { data, error } = await client.auth.refreshSession({ refresh_token });
    if (error || !data.session) return res.status(401).json({ error: 'Sesi habis. Silakan login ulang.', code: 'REFRESH_FAILED' });
    res.json({ token: data.session.access_token, refresh_token: data.session.refresh_token });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/change-password', async (req: Request, res: Response) => {
  try {
    if (!supabaseAdmin) return res.status(500).json({ error: 'Supabase belum dikonfigurasi' });

    // Identitas diambil dari token login (bukan dari body) supaya tidak bisa ganti password orang lain
    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) return res.status(401).json({ error: 'Sesi login tidak ditemukan. Silakan login ulang.' });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    const authUser = userData?.user;
    if (userError || !authUser) {
      return res.status(401).json({ error: 'Sesi login sudah berakhir. Silakan login ulang.' });
    }

    const { newPassword, oldPassword } = req.body || {};
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter' });
    }

    // Kalau form mengirim password lama, wajib cocok
    if (oldPassword !== undefined && oldPassword !== null && oldPassword !== '') {
      if (!authUser.email) return res.status(400).json({ error: 'Akun tidak punya email untuk verifikasi password lama' });
      const verifier = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { error: verifyError } = await verifier.auth.signInWithPassword({ email: authUser.email, password: String(oldPassword) });
      if (verifyError) return res.status(400).json({ error: 'Password lama salah' });
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, { password: newPassword });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, message: 'Password berhasil diperbarui' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Upload ──
app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { file, name, type } = req.body;
    if (!file) return res.status(400).json({ error: 'Tidak ada file dikirim' });
    const extension = type === 'dokumen' ? 'pdf' : 'png';
    const filename = `${Date.now()}-${(name || 'file').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
    const result = await uploadFile(file, filename, type || 'gambar');
    res.json({ url: result.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload/uploadcare', async (req: Request, res: Response) => {
  try {
    const { file, name, type } = req.body;
    if (!file) return res.status(400).json({ error: 'Tidak ada file dikirim' });
    const filename = `${Date.now()}-${(name || 'berkas').replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
    const result = await uploadToUploadcare(file, filename, type || 'dokumen');
    res.json({ url: result.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Kecamatan ──
app.get('/api/kecamatan', async (_req: Request, res: Response) => {
  try {
    const { data } = await supabaseAdmin.from('kecamatan').select('*');
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/kecamatan/toggle-active', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const { data: keca } = await supabaseAdmin.from('kecamatan').select('is_dkr_aktif').eq('id', id).single();
    if (!keca) return res.status(404).json({ error: 'Kecamatan tidak ditemukan' });
    const { data } = await supabaseAdmin.from('kecamatan').update({ is_dkr_aktif: !keca.is_dkr_aktif }).eq('id', id).select().single();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/kecamatan/wilayah-batch', async (req: Request, res: Response) => {
  try {
    const { updates } = req.body; // Array of { id, wilayah }
    if (!Array.isArray(updates)) return res.status(400).json({ error: 'Invalid payload' });

    // Supabase REST doesn't support bulk update with varying values well, so we do it in a loop
    for (const u of updates) {
      await supabaseAdmin.from('kecamatan').update({ wilayah: u.wilayah }).eq('id', u.id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/kecamatan/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { data: keca } = await supabaseAdmin.from('kecamatan').select('*').eq('slug', slug).single();
    if (!keca) return res.status(404).json({ error: 'Kecamatan tidak ditemukan' });

    const [
      { data: dkrProf },
      { data: personalia },
      { data: pangkalan },
      { data: dataPotensial },
      { data: berita },
      { data: agenda }
    ] = await Promise.all([
      supabaseAdmin.from('dkr_profile').select('*').eq('kecamatan_id', keca.id).maybeSingle(),
      supabaseAdmin.from('personalia').select('*').eq('owner_type', 'dkr').eq('kecamatan_id', keca.id).order('urutan'),
      supabaseAdmin.from('pangkalan').select('*').eq('kecamatan_id', keca.id),
      supabaseAdmin.from('data_potensial').select('*').eq('kecamatan_id', keca.id).maybeSingle(),
      supabaseAdmin.from('berita').select('*').eq('kecamatan_id', keca.id).eq('status', 'approved'),
      supabaseAdmin.from('agenda_kegiatan').select('*').eq('kecamatan_id', keca.id)
    ]);

    res.json({
      kecamatan: keca,
      profile: dkrProf || { id: `dkr-${keca.id}`, kecamatan_id: keca.id, deskripsi: `DKR Kecamatan ${keca.nama_kecamatan} Gerakan Pramuka Kabupaten Tasikmalaya.` },
      personalia: personalia || [],
      pangkalan: pangkalan || [],
      data_potensial: dataPotensial || null,
      berita: berita || [],
      agenda: agenda || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dkr_profile', async (_req: Request, res: Response) => {
  try {
    const { data } = await supabaseAdmin.from('dkr_profile').select('*');
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/dkr_profile/update', async (req: Request, res: Response) => {
  try {
    const { kecamatan_id, deskripsi, logo_url, medsos_ig, medsos_yt, medsos_tk } = req.body;
    const { data: existing } = await supabaseAdmin.from('dkr_profile').select('id').eq('kecamatan_id', kecamatan_id).maybeSingle();
    
    const updatePayload: any = { deskripsi, logo_url, updated_at: new Date().toISOString() };
    if (medsos_ig !== undefined) updatePayload.medsos_ig = medsos_ig;
    if (medsos_yt !== undefined) updatePayload.medsos_yt = medsos_yt;
    if (medsos_tk !== undefined) updatePayload.medsos_tk = medsos_tk;

    if (existing) {
      await supabaseAdmin.from('dkr_profile').update(updatePayload).eq('kecamatan_id', kecamatan_id);
    } else {
      await supabaseAdmin.from('dkr_profile').insert({ kecamatan_id, ...updatePayload });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Saka ──
app.get('/api/saka', async (_req: Request, res: Response) => {
  try {
    const { data } = await supabaseAdmin.from('saka').select('*');
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/saka/toggle-active', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    const { data: item } = await supabaseAdmin.from('saka').select('is_aktif').eq('id', id).single();
    if (!item) return res.status(404).json({ error: 'Saka tidak ditemukan' });
    const { data } = await supabaseAdmin.from('saka').update({ is_aktif: !item.is_aktif }).eq('id', id).select().single();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/saka/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { data: sk } = await supabaseAdmin.from('saka').select('*').eq('slug', slug).single();
    if (!sk) return res.status(404).json({ error: 'Saka tidak ditemukan' });

    const [
      { data: sakaProf },
      { data: personalia },
      { data: pangkalan },
      { data: dataPotensial },
      { data: berita },
      { data: agenda }
    ] = await Promise.all([
      supabaseAdmin.from('saka_profile').select('*').eq('saka_id', sk.id).maybeSingle(),
      supabaseAdmin.from('personalia').select('*').eq('owner_type', 'saka').eq('saka_id', sk.id).order('urutan'),
      supabaseAdmin.from('pangkalan').select('*').eq('saka_id', sk.id),
      supabaseAdmin.from('data_potensial').select('*').eq('saka_id', sk.id).maybeSingle(),
      supabaseAdmin.from('berita').select('*').eq('saka_id', sk.id).eq('status', 'approved'),
      supabaseAdmin.from('agenda_kegiatan').select('*').eq('saka_id', sk.id)
    ]);

    res.json({
      saka: sk,
      profile: sakaProf || { id: `saka-${sk.id}`, saka_id: sk.id, deskripsi: sk.deskripsi || `Saka Tingkat Kabupaten Tasikmalaya.` },
      personalia: personalia || [],
      pangkalan: pangkalan || [],
      data_potensial: dataPotensial || null,
      berita: berita || [],
      agenda: agenda || []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/saka_profile/update', async (req: Request, res: Response) => {
  try {
    const { saka_id, deskripsi, logo_url } = req.body;
    const { data: existing } = await supabaseAdmin.from('saka_profile').select('id').eq('saka_id', saka_id).maybeSingle();
    if (existing) {
      await supabaseAdmin.from('saka_profile').update({ deskripsi, logo_url, updated_at: new Date().toISOString() }).eq('saka_id', saka_id);
    } else {
      await supabaseAdmin.from('saka_profile').insert({ saka_id, deskripsi, logo_url });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── DKC ──
app.get('/api/dkc', async (_req: Request, res: Response) => {
  try {
    const { data } = await supabaseAdmin.from('dkc_profile').select('*').maybeSingle();
    res.json(data || { visi: '', misi: '' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/dkc/update', async (req: Request, res: Response) => {
  try {
    const { visi, misi } = req.body;
    const { data: existing } = await supabaseAdmin.from('dkc_profile').select('id').eq('id', 'dkc-main').maybeSingle();
    if (existing) {
      const { data } = await supabaseAdmin.from('dkc_profile').update({ visi, misi, updated_at: new Date().toISOString() }).eq('id', 'dkc-main').select().single();
      res.json({ success: true, data });
    } else {
      const { data } = await supabaseAdmin.from('dkc_profile').insert({ id: 'dkc-main', visi, misi }).select().single();
      res.json({ success: true, data });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Surat DKR → DKC ──
const SURAT_JENIS = ['permohonan_pemateri', 'undangan', 'permohonan_lainnya', 'pemberitahuan', 'lainnya'];
const SURAT_STATUS_RESPON = ['dibaca', 'diterima', 'akan_hadir', 'diwakilkan', 'tidak_dapat_hadir', 'ditolak', 'selesai'];

// Daftar surat. Dengan ?kecamatan_id= → surat milik DKR itu; tanpa filter → semua (dashboard admin DKC)
app.get('/api/surat-dkr', async (req: Request, res: Response) => {
  try {
    const a = authOf(req);
    // DKR hanya boleh melihat surat kecamatannya sendiri (abaikan ?kecamatan_id= dari client)
    const kecamatan_id = a.role === 'user' ? a.kecamatan_id : req.query.kecamatan_id;
    let query = supabaseAdmin.from('surat_dkr').select('*').order('created_at', { ascending: false }).limit(500);
    if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id as string);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    const { data: kecs } = await supabaseAdmin.from('kecamatan').select('id, nama_kecamatan');
    const nameById = new Map<string, string>((kecs || []).map((k: any) => [k.id, k.nama_kecamatan]));
    res.json((data || []).map((row: any) => ({ ...row, kecamatan_nama: nameById.get(row.kecamatan_id) || row.kecamatan_id })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DKR mengirim surat baru
app.post('/api/surat-dkr/save', async (req: Request, res: Response) => {
  try {
    const { kecamatan_id, jenis, nomor_surat, perihal, tanggal_surat, tanggal_acara, keterangan, file_url, file_nama } = req.body;
    if (!kecamatan_id) return res.status(400).json({ error: 'Kecamatan tidak dikenali, silakan login ulang' });
    if (!perihal || !String(perihal).trim()) return res.status(400).json({ error: 'Perihal surat wajib diisi' });
    if (!file_url) return res.status(400).json({ error: 'File surat (PDF) wajib diunggah' });
    if (!SURAT_JENIS.includes(jenis)) return res.status(400).json({ error: 'Jenis surat tidak valid' });
    const { data, error } = await supabaseAdmin.from('surat_dkr').insert({
      kecamatan_id,
      jenis,
      nomor_surat: nomor_surat ? String(nomor_surat).trim() : null,
      perihal: String(perihal).trim(),
      tanggal_surat: tanggal_surat || null,
      tanggal_acara: tanggal_acara || null,
      keterangan: keterangan ? String(keterangan).trim() : null,
      file_url,
      file_nama: file_nama || null,
      status: 'terkirim',
      dilihat_dkr: true,
    }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, surat: data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin membuka surat → otomatis "sudah dibaca" (hanya jika masih 'terkirim')
app.post('/api/surat-dkr/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID wajib diisi' });
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from('surat_dkr')
      .update({ status: 'dibaca', dibaca_at: now, dilihat_dkr: false, updated_at: now })
      .eq('id', id).eq('status', 'terkirim');
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin memberi tanggapan / mengubah status
app.post('/api/surat-dkr/status', async (req: Request, res: Response) => {
  try {
    const { id, status, tanggapan, diwakili_oleh } = req.body;
    if (!id) return res.status(400).json({ error: 'ID wajib diisi' });
    if (!SURAT_STATUS_RESPON.includes(status)) return res.status(400).json({ error: 'Status tidak valid' });
    if (status === 'diwakilkan' && !(diwakili_oleh && String(diwakili_oleh).trim())) {
      return res.status(400).json({ error: 'Nama pihak yang mewakili wajib diisi' });
    }
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from('surat_dkr').update({
      status,
      tanggapan: tanggapan ? String(tanggapan).trim() : null,
      diwakili_oleh: status === 'diwakilkan' ? String(diwakili_oleh).trim() : null,
      ditanggapi_at: now,
      dilihat_dkr: false,
      updated_at: now,
    }).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DKR menandai update status sudah dilihat
app.post('/api/surat-dkr/seen', async (req: Request, res: Response) => {
  try {
    const { id, kecamatan_id } = req.body;
    if (!id || !kecamatan_id) return res.status(400).json({ error: 'ID dan kecamatan wajib diisi' });
    const { error } = await supabaseAdmin.from('surat_dkr').update({ dilihat_dkr: true }).eq('id', id).eq('kecamatan_id', kecamatan_id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Hapus surat. DKR (kirim kecamatan_id) hanya boleh menghapus surat miliknya yang BELUM dibaca; admin (tanpa kecamatan_id) bebas.
app.post('/api/surat-dkr/delete', async (req: Request, res: Response) => {
  try {
    const { id, kecamatan_id } = req.body;
    if (!id) return res.status(400).json({ error: 'ID wajib diisi' });
    let query = supabaseAdmin.from('surat_dkr').delete().eq('id', id);
    if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id).eq('status', 'terkirim');
    const { error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Personalia ──
app.get('/api/personalia', async (req: Request, res: Response) => {
  try {
    const { owner_type, kecamatan_id, saka_id } = req.query;
    let query = supabaseAdmin.from('personalia').select('*');
    if (owner_type) query = query.eq('owner_type', owner_type as string);
    if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id as string);
    if (saka_id) query = query.eq('saka_id', saka_id as string);
    const { data } = await query.order('urutan');
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/personalia/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin.from('personalia').select('*').eq('id', req.params.id).maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'Profil tidak ditemukan' });
    let owner_nama = 'DKC Kabupaten Tasikmalaya';
    let owner_slug: string | null = null;
    if (data.owner_type === 'dkr' && data.kecamatan_id) {
      const { data: keca } = await supabaseAdmin.from('kecamatan').select('nama_kecamatan, slug').eq('id', data.kecamatan_id).maybeSingle();
      owner_nama = 'DKR ' + (keca?.nama_kecamatan || '');
      owner_slug = keca?.slug || null;
    } else if (data.owner_type === 'saka') {
      owner_nama = 'SAKA';
    }
    res.json({ ...data, owner_nama, owner_slug });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/personalia/save', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.id) {
      const { error: updErr } = await supabaseAdmin.from('personalia').update(data).eq('id', data.id);
      if (updErr) return res.status(500).json({ error: updErr.message });
    } else {
      let query = supabaseAdmin.from('personalia').select('id').eq('owner_type', data.owner_type);
      if (data.kecamatan_id) query = query.eq('kecamatan_id', data.kecamatan_id);
      if (data.saka_id) query = query.eq('saka_id', data.saka_id);
      const { data: existing } = await query;
      data.urutan = data.urutan || (existing ? existing.length + 1 : 1);
      const { error: insErr } = await supabaseAdmin.from('personalia').insert(data);
      if (insErr) return res.status(500).json({ error: insErr.message });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/personalia/update', async (req: Request, res: Response) => {
  try {
    const { id, nama, jabatan, golongan, foto_url } = req.body;
    if (!id) return res.status(400).json({ error: 'ID wajib diisi' });
    const payload: Record<string, any> = { nama, jabatan, golongan, foto_url };
    for (const key of ['tentang', 'foto_background_url', 'riwayat_organisasi', 'riwayat_pendidikan', 'prestasi_akademik', 'prestasi_non_akademik']) {
      if (req.body[key] !== undefined) payload[key] = req.body[key];
    }
    const { error } = await supabaseAdmin.from('personalia').update(payload).eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/personalia/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await supabaseAdmin.from('personalia').delete().eq('id', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Pangkalan ──
app.get('/api/pangkalan', async (req: Request, res: Response) => {
  try {
    const { kecamatan_id, saka_id } = req.query;
    let query = supabaseAdmin.from('pangkalan').select('*');
    if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id as string);
    if (saka_id) query = query.eq('saka_id', saka_id as string);
    const { data } = await query;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pangkalan/save', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.id) {
      await supabaseAdmin.from('pangkalan').update(data).eq('id', data.id);
    } else {
      await supabaseAdmin.from('pangkalan').insert(data);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Form pendaftaran: user boleh menambahkan pangkalan baru secara mandiri (dedupe per kwaran)
app.post('/api/pangkalan/register', async (req: Request, res: Response) => {
  try {
    const kecamatan_id = String(req.body?.kecamatan_id || '').trim();
    const nama = String(req.body?.nama_pangkalan || '').replace(/\s+/g, ' ').trim();
    if (!kecamatan_id || !nama) {
      return res.status(400).json({ error: 'kecamatan_id dan nama_pangkalan wajib diisi' });
    }
    if (nama.length > 120) {
      return res.status(400).json({ error: 'Nama pangkalan terlalu panjang' });
    }
    const { data: existing } = await supabaseAdmin.from('pangkalan').select('*').eq('kecamatan_id', kecamatan_id);
    const found = (existing || []).find((p: any) =>
      String(p.nama_pangkalan || '').replace(/\s+/g, ' ').trim().toLowerCase() === nama.toLowerCase()
    );
    if (found) return res.json({ pangkalan: found, created: false });

    const { data, error } = await supabaseAdmin
      .from('pangkalan')
      .insert({ kecamatan_id, nama_pangkalan: nama, jenis: 'lainnya', status_aktif: true })
      .select()
      .single();
    if (error) throw error;
    res.json({ pangkalan: data, created: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pangkalan/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await supabaseAdmin.from('pangkalan').delete().eq('id', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Data Potensial ──
app.get('/api/data_potensial', async (req: Request, res: Response) => {
  try {
    const { kecamatan_id, saka_id, periode } = req.query;
    let query = supabaseAdmin.from('data_potensial').select('*');
    if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id as string);
    if (saka_id) query = query.eq('saka_id', saka_id as string);
    if (periode) query = query.eq('periode', periode as string);
    const { data } = await query;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save Wilayah Data
app.post('/api/wilayah/save', async (req: Request, res: Response) => {
  try {
    const { wilayahData } = req.body;
    // wilayahData is array of { id: string, wilayah: string }
    for (const d of wilayahData) {
      await supabaseAdmin.from('kecamatan').update({ wilayah: d.wilayah }).eq('id', d.id);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/data_potensial/save', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    let query = supabaseAdmin.from('data_potensial').select('id').eq('periode', data.periode);
    if (data.kecamatan_id) query = query.eq('kecamatan_id', data.kecamatan_id);
    if (data.saka_id) query = query.eq('saka_id', data.saka_id);

    const { data: existing } = await query.maybeSingle();
    if (existing) {
      await supabaseAdmin.from('data_potensial').update({ ...data, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabaseAdmin.from('data_potensial').insert(data);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Berita ──
app.get('/api/berita', async (req: Request, res: Response) => {
  try {
    const { status, kecamatan_id, saka_id } = req.query;
    let query = supabaseAdmin.from('berita').select('*');
    if (status) query = query.eq('status', status as string);
    if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id as string);
    if (saka_id) query = query.eq('saka_id', saka_id as string);
    const { data } = await query.order('published_at', { ascending: false });
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/berita/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { data } = await supabaseAdmin.from('berita').select('*').eq('slug', slug).maybeSingle();
    if (data) {
      res.json(data);
    } else {
      res.status(404).json({ error: 'Berita tidak ditemukan' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/berita/save', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.judul) return res.status(400).json({ error: 'Judul berita wajib diisi' });

    const baseSlug = data.judul.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    data.slug = `${baseSlug}-${Date.now()}`;

    let dbError;
    if (data.id) {
      const { error } = await supabaseAdmin.from('berita').update(data).eq('id', data.id);
      dbError = error;
    } else {
      const { error } = await supabaseAdmin.from('berita').insert(data);
      dbError = error;
    }
    if (dbError) {
      console.error('Gagal simpan berita:', dbError);
      return res.status(500).json({ error: dbError.message });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/berita/status', async (req: Request, res: Response) => {
  try {
    const { id, status } = req.body;
    const updateData: any = { status };
    if (status === 'approved') updateData.published_at = new Date().toISOString();
    await supabaseAdmin.from('berita').update(updateData).eq('id', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/berita/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await supabaseAdmin.from('berita').delete().eq('id', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/berita/:id/like', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    const { data: item } = await supabaseAdmin.from('berita').select('likes').eq('id', id).single();
    if (item) {
      const likesCount = action === 'unlike' ? Math.max(0, (item.likes || 0) - 1) : (item.likes || 0) + 1;
      await supabaseAdmin.from('berita').update({ likes: likesCount }).eq('id', id);
      res.json({ success: true, likes: likesCount });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Agenda ──
app.get('/api/agenda', async (_req: Request, res: Response) => {
  try {
    const { data } = await supabaseAdmin.from('agenda_kegiatan').select('*');
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agenda/save', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.id) {
      await supabaseAdmin.from('agenda_kegiatan').update(data).eq('id', data.id);
    } else {
      await supabaseAdmin.from('agenda_kegiatan').insert(data);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/agenda/:id/dashboard_config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { dashboard_config } = req.body;
    await supabaseAdmin.from('agenda_kegiatan').update({ dashboard_config }).eq('id', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agenda/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await supabaseAdmin.from('agenda_kegiatan').delete().eq('id', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Field inti pendaftaran & deteksi pendaftar ganda ──
// (logika sama dengan src/utils/coreFields.ts — sengaja diduplikasi agar function serverless tidak bergantung ke folder src)
const CORE_FORM_FIELDS = [
  { id: 'nama_lengkap', label: 'Nama Lengkap', type: 'text', required: true, locked: true },
  { id: 'kwarran_asal', label: 'Kwartir Ranting Asal', type: 'select', required: true, locked: true, auto: true },
  { id: 'pangkalan', label: 'Pangkalan / Gudep', type: 'pangkalan', required: true, locked: true },
  { id: 'tempat_lahir', label: 'Tempat Lahir', type: 'text', required: true, locked: true },
  { id: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date', required: true, locked: true },
];
const CORE_FORM_FIELD_IDS = CORE_FORM_FIELDS.map(f => f.id);

function ensureCoreFormFields(schema: any): any[] {
  const custom = (Array.isArray(schema) ? schema : []).filter((f: any) => f && !CORE_FORM_FIELD_IDS.includes(f.id));
  return [...CORE_FORM_FIELDS.map(f => ({ ...f })), ...custom];
}

const cleanText = (v: any) => String(v ?? '').replace(/\s+/g, ' ').trim();
const normText = (v: any) => cleanText(v).toLowerCase();

function normDate(v: any): string {
  if (v === null || v === undefined || v === '') return '';
  let y: number, m: number, d: number;
  if (typeof v === 'number' || /^\d{5}(\.\d+)?$/.test(String(v).trim())) {
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(v)) * 86400000);
    y = dt.getUTCFullYear(); m = dt.getUTCMonth() + 1; d = dt.getUTCDate();
  } else {
    const str = String(v).trim();
    let mt = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (mt) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
    else {
      mt = str.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (!mt) return '';
      d = +mt[1]; m = +mt[2]; y = +mt[3];
    }
  }
  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d || y < 1900) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const todayJakarta = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

// Kunci identitas: nama + kwaran + pangkalan + tempat lahir + tanggal lahir. Null jika ada yang kosong.
function identityKey(d: any, kecamatanId: string | null): string | null {
  if (!d || !kecamatanId) return null;
  const nama = normText(d.nama_lengkap);
  const pangkalan = normText(d.pangkalan);
  const tempat = normText(d.tempat_lahir);
  const tgl = normDate(d.tanggal_lahir);
  if (!nama || !pangkalan || !tempat || !tgl) return null;
  return [nama, kecamatanId, pangkalan, tempat, tgl].join('|');
}

// Validasi + rapikan field inti, isi kwarran_asal otomatis dari kecamatan_id
async function prepareRegistrant(raw: any, kecamatanId: string | null): Promise<{ data?: any; error?: string }> {
  if (!kecamatanId) return { error: 'Asal Kwartir Ranting wajib dipilih.' };
  if (!raw || typeof raw !== 'object') return { error: 'Data peserta tidak valid.' };
  const { data: keca } = await supabaseAdmin.from('kecamatan').select('nama_kecamatan').eq('id', kecamatanId).maybeSingle();
  if (!keca) return { error: 'Kwartir Ranting tidak ditemukan.' };

  const data: any = { ...raw };
  data.nama_lengkap = cleanText(data.nama_lengkap);
  data.pangkalan = cleanText(data.pangkalan);
  data.tempat_lahir = cleanText(data.tempat_lahir);
  data.tanggal_lahir = normDate(data.tanggal_lahir);
  data.kwarran_asal = keca.nama_kecamatan;

  if (!data.nama_lengkap) return { error: 'Nama Lengkap wajib diisi.' };
  if (!data.pangkalan) return { error: 'Pangkalan / Gudep wajib diisi.' };
  if (!data.tempat_lahir) return { error: 'Tempat Lahir wajib diisi.' };
  if (!data.tanggal_lahir) return { error: 'Tanggal Lahir wajib diisi dengan format tanggal yang valid.' };
  if (data.tanggal_lahir > todayJakarta()) return { error: 'Tanggal Lahir tidak boleh di masa depan.' };
  return { data };
}

type DupInfo = { index: number; nama: string; reason: 'sudah_terdaftar' | 'ganda_dalam_daftar'; dengan?: number };

// Cek peserta ganda terhadap data yang sudah ada di kegiatan ini + antar peserta dalam satu kiriman
async function findDuplicates(agendaId: string, kecamatanId: string, list: any[], excludeId?: string): Promise<DupInfo[]> {
  const { data: existing } = await supabaseAdmin
    .from('pendaftaran_peserta').select('id, data_peserta')
    .eq('agenda_id', agendaId).eq('kecamatan_id', kecamatanId);
  const existingKeys = new Set<string>();
  (existing || []).forEach((r: any) => {
    if (excludeId && r.id === excludeId) return;
    const k = identityKey(r.data_peserta, kecamatanId);
    if (k) existingKeys.add(k);
  });

  const seen = new Map<string, number>();
  const dups: DupInfo[] = [];
  list.forEach((item, i) => {
    const k = identityKey(item, kecamatanId);
    if (!k) return;
    if (existingKeys.has(k)) dups.push({ index: i, nama: cleanText(item.nama_lengkap), reason: 'sudah_terdaftar' });
    else if (seen.has(k)) dups.push({ index: i, nama: cleanText(item.nama_lengkap), reason: 'ganda_dalam_daftar', dengan: seen.get(k)! });
    else seen.set(k, i);
  });
  return dups;
}

function duplicateMessage(dups: DupInfo[], single: boolean): string {
  if (single) {
    return `Pendaftar ganda terdeteksi: "${dups[0].nama}" dengan Kwaran, pangkalan, tempat lahir, dan tanggal lahir yang sama sudah terdaftar di kegiatan ini. Pendaftaran ditolak.`;
  }
  const parts = dups.map(d => d.reason === 'sudah_terdaftar'
    ? `Peserta #${d.index + 1} "${d.nama}" sudah terdaftar di kegiatan ini`
    : `Peserta #${d.index + 1} "${d.nama}" dobel dengan peserta #${(d.dengan ?? 0) + 1}`);
  return `Pendaftar ganda terdeteksi, pendaftaran ditolak. ${parts.join('; ')}. Perbaiki data tersebut lalu kirim ulang.`;
}

app.get('/api/agenda/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = await supabaseAdmin.from('form_kegiatan_config').select('*').eq('agenda_id', id).maybeSingle();
    res.json(data ? { ...data, form_schema: ensureCoreFormFields(data.form_schema) } : null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agenda/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipe_pendaftaran, is_qr_validasi = true, is_qr_checkin = false } = req.body;
    const form_schema = ensureCoreFormFields(req.body.form_schema); // field inti selalu dipaksa ada
    const { data: existing } = await supabaseAdmin.from('form_kegiatan_config').select('id').eq('agenda_id', id).maybeSingle();
    if (existing) {
      await supabaseAdmin.from('form_kegiatan_config').update({ form_schema, tipe_pendaftaran, is_qr_validasi, is_qr_checkin }).eq('agenda_id', id);
    } else {
      await supabaseAdmin.from('form_kegiatan_config').insert({ agenda_id: id, form_schema, tipe_pendaftaran, is_qr_validasi, is_qr_checkin });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function updateTagihanKolektif(agenda_id: string, kecamatan_id: string) {
  if (!agenda_id || !kecamatan_id) return;
  try {
    const { data: agenda } = await supabaseAdmin.from('agenda_kegiatan').select('camp_fee, is_camp_fee_required, tipe_pendaftaran').eq('id', agenda_id).single();
    if (!agenda || !agenda.is_camp_fee_required) return;
    if (agenda.tipe_pendaftaran === 'mandiri') return; // pure mandiri doesn't have collective bill

    const { data: registrants } = await supabaseAdmin.from('pendaftaran_peserta').select('id').eq('agenda_id', agenda_id).eq('kecamatan_id', kecamatan_id);
    const count = registrants ? registrants.length : 0;
    
    if (count > 0) {
      const total_tagihan = count * (agenda.camp_fee || 0);
      
      const { data: existing } = await supabaseAdmin.from('tagihan_kolektif').select('id, status').eq('agenda_id', agenda_id).eq('kecamatan_id', kecamatan_id).maybeSingle();
      if (existing) {
        if (existing.status !== 'lunas' && existing.status !== 'menunggu_verifikasi') {
          await supabaseAdmin.from('tagihan_kolektif').update({ jumlah_peserta_terverifikasi: count, total_tagihan }).eq('id', existing.id);
        }
      } else {
        await supabaseAdmin.from('tagihan_kolektif').insert({ agenda_id, kecamatan_id, jumlah_peserta_terverifikasi: count, total_tagihan, status: 'belum_bayar' });
      }
    }
  } catch (e) {
    console.error('Error updating tagihan:', e);
  }
}

app.post('/api/agenda/:id/register', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipe, kecamatan_id, data_peserta } = req.body;
    const prep = await prepareRegistrant(data_peserta, kecamatan_id);
    if (prep.error) return res.status(400).json({ error: prep.error });
    const dups = await findDuplicates(id, kecamatan_id, [prep.data]);
    if (dups.length > 0) {
      return res.status(409).json({ code: 'DUPLICATE', error: duplicateMessage(dups, true), duplicates: dups });
    }
    const { data, error } = await supabaseAdmin.from('pendaftaran_peserta').insert({
      agenda_id: id,
      tipe,
      kecamatan_id,
      data_peserta: prep.data
    }).select('id').single();
    
    if (error) throw error;
    updateTagihanKolektif(id, kecamatan_id);
    res.json({ success: true, id: data.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/agenda/:id/registrants', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const a = authOf(req);
    let query = supabaseAdmin.from('pendaftaran_peserta').select('*').eq('agenda_id', id);
    if (a.role === 'user') query = query.eq('kecamatan_id', a.kecamatan_id); // DKR hanya data pesertanya sendiri
    const { data } = await query;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/registrants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data_peserta } = req.body;
    const { data: current } = await supabaseAdmin.from('pendaftaran_peserta')
      .select('id, agenda_id, kecamatan_id').eq('id', id).maybeSingle();
    if (!current) return res.status(404).json({ error: 'Data pendaftar tidak ditemukan' });

    let payload = data_peserta;
    if (payload && typeof payload === 'object') {
      payload = { ...payload };
      if (payload.nama_lengkap !== undefined) payload.nama_lengkap = cleanText(payload.nama_lengkap);
      if (payload.pangkalan !== undefined) payload.pangkalan = cleanText(payload.pangkalan);
      if (payload.tempat_lahir !== undefined) payload.tempat_lahir = cleanText(payload.tempat_lahir);
      if (payload.tanggal_lahir !== undefined && payload.tanggal_lahir !== '') {
        const nd = normDate(payload.tanggal_lahir);
        if (!nd) return res.status(400).json({ error: 'Format Tanggal Lahir tidak valid.' });
        if (nd > todayJakarta()) return res.status(400).json({ error: 'Tanggal Lahir tidak boleh di masa depan.' });
        payload.tanggal_lahir = nd;
      }
      if (current.kecamatan_id) {
        const dups = await findDuplicates(current.agenda_id, current.kecamatan_id, [payload], id);
        if (dups.length > 0) {
          return res.status(409).json({ code: 'DUPLICATE', error: duplicateMessage(dups, true), duplicates: dups });
        }
      }
    }
    const { data, error } = await supabaseAdmin.from('pendaftaran_peserta')
      .update({ data_peserta: payload })
      .eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/registrants/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from('pendaftaran_peserta')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Batch registration for collective (kolektif) enrollment
app.post('/api/agenda/:id/register-batch', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { peserta_list, kecamatan_id, bukti_bayar_url } = req.body;
    // peserta_list: Array<{ data_peserta: Record<string, any> }>
    
    if (!peserta_list || !Array.isArray(peserta_list) || peserta_list.length === 0) {
      return res.status(400).json({ error: 'Daftar peserta tidak boleh kosong' });
    }

    // Validasi field inti tiap peserta (+ isi kwarran_asal otomatis)
    const prepared: any[] = [];
    const prepErrors: string[] = [];
    for (let i = 0; i < peserta_list.length; i++) {
      const prep = await prepareRegistrant(peserta_list[i]?.data_peserta, kecamatan_id);
      if (prep.error) prepErrors.push(`Peserta #${i + 1}: ${prep.error}`);
      else prepared.push(prep.data);
    }
    if (prepErrors.length > 0) {
      return res.status(400).json({ error: prepErrors.slice(0, 5).join(' | ') });
    }

    // Deteksi pendaftar ganda (terhadap data existing & antar peserta dalam kiriman ini)
    const dups = await findDuplicates(id, kecamatan_id, prepared);
    if (dups.length > 0) {
      return res.status(409).json({ code: 'DUPLICATE', error: duplicateMessage(dups, false), duplicates: dups });
    }

    const rows = prepared.map((pd: any) => ({
      agenda_id: id,
      tipe: 'kolektif',
      kecamatan_id: kecamatan_id || null,
      data_peserta: {
        ...pd,
        ...(bukti_bayar_url ? { _bukti_bayar: bukti_bayar_url } : {})
      }
    }));

    const { data, error } = await supabaseAdmin
      .from('pendaftaran_peserta')
      .insert(rows)
      .select('id');

    if (error) throw error;
    updateTagihanKolektif(id, kecamatan_id);
    res.json({ success: true, ids: data?.map((d: any) => d.id) || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/pendaftaran/validate/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data: pendaftaran, error } = await supabaseAdmin
      .from('pendaftaran_peserta')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !pendaftaran) {
      return res.status(404).json({ error: 'Not found' });
    }

    const { data: agenda } = await supabaseAdmin
      .from('agenda_kegiatan')
      .select('nama_kegiatan')
      .eq('id', pendaftaran.agenda_id)
      .maybeSingle();

    res.json({ pendaftaran, agenda });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pendaftaran/checkin/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Ambil data sekarang
    const { data: current } = await supabaseAdmin
      .from('pendaftaran_peserta')
      .select('data_peserta')
      .eq('id', id)
      .maybeSingle();
      
    if (!current) {
      return res.status(404).json({ error: 'Peserta tidak ditemukan' });
    }
    
    const newData = { ...(current.data_peserta || {}), _is_hadir: true, _waktu_hadir: new Date().toISOString() };
    
    await supabaseAdmin
      .from('pendaftaran_peserta')
      .update({ data_peserta: newData })
      .eq('id', id);
      
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pendaftaran/lunas/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Ambil data sekarang
    const { data: current } = await supabaseAdmin
      .from('pendaftaran_peserta')
      .select('data_peserta')
      .eq('id', id)
      .maybeSingle();
      
    if (!current) {
      return res.status(404).json({ error: 'Peserta tidak ditemukan' });
    }
    
    const newData = { ...(current.data_peserta || {}), _is_lunas: true, _waktu_lunas: new Date().toISOString() };
    
    await supabaseAdmin
      .from('pendaftaran_peserta')
      .update({ data_peserta: newData })
      .eq('id', id);
      
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Informasi ──
app.get('/api/informasi', async (_req: Request, res: Response) => {
  try {
    const { data } = await supabaseAdmin.from('informasi').select('*').order('created_at', { ascending: false });
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/informasi/save', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.id) {
      await supabaseAdmin.from('informasi').update(data).eq('id', data.id);
    } else {
      await supabaseAdmin.from('informasi').insert(data);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/informasi/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await supabaseAdmin.from('informasi').delete().eq('id', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Site Content ──
app.get('/api/site_content', async (_req: Request, res: Response) => {
  try {
    const { data } = await supabaseAdmin.from('site_content').select('*');
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/site_content/save', async (req: Request, res: Response) => {
  try {
    const { section_key, content } = req.body;
    const { data: existing } = await supabaseAdmin.from('site_content').select('id').eq('section_key', section_key).maybeSingle();
    if (existing) {
      await supabaseAdmin.from('site_content').update({ content, updated_at: new Date().toISOString() }).eq('section_key', section_key);
    } else {
      await supabaseAdmin.from('site_content').insert({ section_key, content });
    }
    const { data } = await supabaseAdmin.from('site_content').select('*').eq('section_key', section_key).maybeSingle();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Users ──
app.get('/api/users', async (_req: Request, res: Response) => {
  try {
    const { data } = await supabaseAdmin.from('profiles').select('user_id, role, kecamatan_id, saka_id, nama');
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/reset_password', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    // Generate random 8 character alphanumeric password
    const newPassword = Math.random().toString(36).slice(-8);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
      password: newPassword,
    });

    if (error) throw error;

    res.json({ success: true, newPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/api/users/save', async (req: Request, res: Response) => {
  try {
    const { email, password, role, kecamatan_id, saka_id, nama } = req.body;
    
    if (!supabaseAdmin) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum diatur di Vercel.' });
    }

    // 1. Create User in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ error: 'Gagal membuat user di Supabase Auth' });
    }

    // 2. Insert Profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      user_id: authData.user.id,
      role,
      kecamatan_id,
      saka_id,
      nama
    });

    if (profileError) {
      // Rollback (delete auth user if profile fails)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ error: profileError.message });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Laporan Kegiatan ──
app.get('/api/laporan_kegiatan', async (_req: Request, res: Response) => {
  try {
    const { data } = await supabaseAdmin.from('laporan_kegiatan').select('*');
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/laporan_kegiatan/save', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.kecamatan_id || !data.jenis_dokumen || !data.nama_kegiatan) {
      return res.status(400).json({ error: 'Data laporan tidak lengkap' });
    }

    let updatedReport = null;
    if (data.id) {
      const { data: ret, error } = await supabaseAdmin.from('laporan_kegiatan').update({
        jenis_dokumen: data.jenis_dokumen,
        nama_kegiatan: data.nama_kegiatan,
        tanggal_pelaksanaan: data.tanggal_pelaksanaan || null,
        tempat_pelaksanaan: data.tempat_pelaksanaan,
        deskripsi_singkat: data.deskripsi_singkat,
        file_laporan_url: data.file_laporan_url || null,
        form_data: data.form_data,
        status: data.status || 'pending'
      }).eq('id', data.id).select().single();
        if (error) throw error;
      updatedReport = ret;
    } else {
      const { data: ret, error } = await supabaseAdmin.from('laporan_kegiatan').insert({
        kecamatan_id: data.kecamatan_id,
        kecamatan_nama: data.kecamatan_nama || 'Kecamatan',
        jenis_dokumen: data.jenis_dokumen,
        nama_kegiatan: data.nama_kegiatan,
        tanggal_pelaksanaan: data.tanggal_pelaksanaan || null,
        tempat_pelaksanaan: data.tempat_pelaksanaan,
        deskripsi_singkat: data.deskripsi_singkat,
        file_laporan_url: data.file_laporan_url || null,
        form_data: data.form_data,
        status: data.status || 'pending'
      }).select().single();
        if (error) throw error;
      updatedReport = ret;
    }
    res.json({ success: true, data: updatedReport });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/laporan_kegiatan/process', async (req: Request, res: Response) => {
  try {
    const { id, status, catatan_admin, point_bobot } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'ID dan status harus diisi' });

    const updateData: any = { status, catatan_admin: catatan_admin || '' };
    if (point_bobot !== undefined) updateData.point_bobot = Number(point_bobot);

    const { data } = await supabaseAdmin.from('laporan_kegiatan').update(updateData).eq('id', id).select().single();
    if (!data) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Tagihan Kolektif Kwarran ──

app.post('/api/tagihan_kolektif/sync', async (req: Request, res: Response) => {
  try {
    const { kecamatan_id } = req.body;
    if (!kecamatan_id) return res.status(400).json({error: 'kecamatan_id required'});
    
    // Ambil semua agenda yang butuh tagihan
    const { data: agendas } = await supabaseAdmin.from('agenda_kegiatan').select('*').eq('is_camp_fee_required', true).neq('tipe_pendaftaran', 'mandiri');
    
    for (const agenda of (agendas || [])) {
      await updateTagihanKolektif(agenda.id, kecamatan_id);
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/tagihan_kolektif', async (req: Request, res: Response) => {
  try {
    const a = authOf(req);
    const { agenda_id } = req.query;
    const kecamatan_id = a.role === 'user' ? a.kecamatan_id : req.query.kecamatan_id;
    let query = supabaseAdmin.from('tagihan_kolektif').select('*');
    if (agenda_id) query = query.eq('agenda_id', agenda_id as string);
    if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id as string);
    
    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tagihan_kolektif/upsert', async (req: Request, res: Response) => {
  try {
    const { agenda_id, kecamatan_id, jumlah_peserta_terverifikasi, total_tagihan } = req.body;
    
    // Check exist
    const { data: existing } = await supabaseAdmin.from('tagihan_kolektif')
      .select('id, status')
      .eq('agenda_id', agenda_id)
      .eq('kecamatan_id', kecamatan_id)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'lunas' || existing.status === 'menunggu_verifikasi') {
        // Jangan timpa nominal kalau sedang diproses
        return res.json({ success: true, id: existing.id });
      }
      const { data, error } = await supabaseAdmin.from('tagihan_kolektif')
        .update({ jumlah_peserta_terverifikasi, total_tagihan, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select().single();
      if (error) throw error;
      return res.json({ success: true, data });
    } else {
      const { data, error } = await supabaseAdmin.from('tagihan_kolektif')
        .insert({ agenda_id, kecamatan_id, jumlah_peserta_terverifikasi, total_tagihan })
        .select().single();
      if (error) throw error;
      return res.json({ success: true, data });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tagihan_kolektif/bayar', async (req: Request, res: Response) => {
  try {
    const { id, bukti_bayar_url } = req.body;
    const { data, error } = await supabaseAdmin.from('tagihan_kolektif')
      .update({ bukti_bayar_url, status: 'menunggu_verifikasi', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tagihan_kolektif/status', async (req: Request, res: Response) => {
  try {
    const { id, status, catatan } = req.body;
    const { data: tagihan, error: errTagihan } = await supabaseAdmin.from('tagihan_kolektif')
      .update({ status, catatan: catatan || null, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select().single();
      
    if (errTagihan) throw errTagihan;
    
    // Jika Lunas, lunasi juga semua pendaftar kolektif dari kecamatan ini
    if (status === 'lunas') {
      const { data: pendaftar } = await supabaseAdmin.from('pendaftaran_peserta')
        .select('id, data_peserta')
        .eq('agenda_id', tagihan.agenda_id)
        .eq('kecamatan_id', tagihan.kecamatan_id)
        .eq('tipe', 'kolektif');
        
      if (pendaftar && pendaftar.length > 0) {
        for (const p of pendaftar) {
          const newData = { ...(p.data_peserta || {}), _is_lunas: true, _waktu_lunas: new Date().toISOString() };
          await supabaseAdmin.from('pendaftaran_peserta').update({ data_peserta: newData }).eq('id', p.id);
        }
      }
    }
    
    res.json({ success: true, data: tagihan });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ── Global error handler ──
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Express Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
