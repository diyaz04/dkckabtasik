import express, { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('SUPABASE_URL or SUPABASE_ANON_KEY is missing. API calls to Supabase will fail.');
}

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null as any;

export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

const app = express();
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
    }
  }
  // If cloudinary not configured or fails, return a placeholder
  return { url: '/uploads/' + filename, source: 'local' };
}

async function uploadToUploadcare(base64Data: string, filename: string, _fileType: string) {
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
      if (!uploadRes.ok) throw new Error(`Uploadcare API error: ${uploadRes.status}`);
      const resJson: any = await uploadRes.json();
      if (!resJson.file) throw new Error('No file UUID returned');
      return { url: `https://ucarecdn.com/${resJson.file}/${encodeURIComponent(filename)}`, source: 'uploadcare' };
    } catch (e: any) {
      console.error('Uploadcare upload failed:', e.message);
    }
  }
  return { url: '/uploads/' + filename, source: 'local' };
}

// ── Health ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', supabaseConfigured: !!process.env.SUPABASE_URL });
});

// ── Auth ──
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
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
      user: profile,
      kecamatan,
      saka
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message || 'Login gagal' });
  }
});

app.post('/api/auth/change-password', async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    const { error } = await supabaseAdmin.auth.updateUser({ password: newPassword });
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

app.post('/api/dkr_profile/update', async (req: Request, res: Response) => {
  try {
    const { kecamatan_id, deskripsi, logo_url } = req.body;
    const { data: existing } = await supabaseAdmin.from('dkr_profile').select('id').eq('kecamatan_id', kecamatan_id).maybeSingle();
    if (existing) {
      await supabaseAdmin.from('dkr_profile').update({ deskripsi, logo_url, updated_at: new Date().toISOString() }).eq('kecamatan_id', kecamatan_id);
    } else {
      await supabaseAdmin.from('dkr_profile').insert({ kecamatan_id, deskripsi, logo_url });
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

app.post('/api/personalia/save', async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (data.id) {
      await supabaseAdmin.from('personalia').update(data).eq('id', data.id);
    } else {
      let query = supabaseAdmin.from('personalia').select('id').eq('owner_type', data.owner_type);
      if (data.kecamatan_id) query = query.eq('kecamatan_id', data.kecamatan_id);
      if (data.saka_id) query = query.eq('saka_id', data.saka_id);
      const { data: existing } = await query;
      data.urutan = data.urutan || (existing ? existing.length + 1 : 1);
      await supabaseAdmin.from('personalia').insert(data);
    }
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

    const slug = data.judul.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    data.slug = slug;

    if (data.id) {
      await supabaseAdmin.from('berita').update(data).eq('id', data.id);
    } else {
      await supabaseAdmin.from('berita').insert(data);
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

app.post('/api/agenda/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    await supabaseAdmin.from('agenda_kegiatan').delete().eq('id', id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/agenda/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = await supabaseAdmin.from('form_kegiatan_config').select('*').eq('agenda_id', id).maybeSingle();
    res.json(data || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agenda/:id/config', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { form_schema, tipe_pendaftaran } = req.body;
    const { data: existing } = await supabaseAdmin.from('form_kegiatan_config').select('id').eq('agenda_id', id).maybeSingle();
    if (existing) {
      await supabaseAdmin.from('form_kegiatan_config').update({ form_schema, tipe_pendaftaran }).eq('agenda_id', id);
    } else {
      await supabaseAdmin.from('form_kegiatan_config').insert({ agenda_id: id, form_schema, tipe_pendaftaran });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/agenda/:id/register', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tipe, kecamatan_id, data_peserta } = req.body;
    await supabaseAdmin.from('pendaftaran_peserta').insert({
      agenda_id: id,
      tipe,
      kecamatan_id,
      data_peserta
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/agenda/:id/registrants', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data } = await supabaseAdmin.from('pendaftaran_peserta').select('*').eq('agenda_id', id);
    res.json(data || []);
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

// ── Global error handler ──
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Express Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
