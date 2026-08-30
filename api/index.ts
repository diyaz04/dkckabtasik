import 'express-async-errors';
import express, { Request, Response } from 'express';
import { supabase } from './supabaseClient';
import { uploadFile, uploadToUploadcare } from '../server/services/uploadService';

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running', supabaseConfigured: !!process.env.SUPABASE_URL });
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) {
      return res.status(401).json({ error: authError?.message || 'Email atau password salah' });
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', authData.user.id).single();
    
    let kecamatan = null;
    let saka = null;
    if (profile?.kecamatan_id) {
      const { data: k } = await supabase.from('kecamatan').select('*').eq('id', profile.kecamatan_id).single();
      kecamatan = k;
    }
    if (profile?.saka_id) {
      const { data: s } = await supabase.from('saka').select('*').eq('id', profile.saka_id).single();
      saka = s;
    }

    res.json({
      token: authData.session?.access_token,
      user: profile,
      kecamatan,
      saka
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/change-password', async (req: Request, res: Response) => {
  const { newPassword } = req.body;
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ success: true, message: 'Password berhasil diperbarui' });
});

app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { file, name, type } = req.body;
    if (!file) return res.status(400).json({ error: 'Tidak ada file dikirim' });
    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return res.status(400).json({ error: 'Format file tidak valid' });
    const extension = type === 'dokumen' ? 'pdf' : 'png';
    const filename = `${Date.now()}-${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;
    const uploadResult = await uploadFile(file, filename, type || 'gambar');
    res.json({ url: uploadResult.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/upload/uploadcare', async (req: Request, res: Response) => {
  try {
    const { file, name, type } = req.body;
    if (!file) return res.status(400).json({ error: 'Tidak ada file dikirim' });
    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return res.status(400).json({ error: 'Format file tidak valid' });
    const filename = `${Date.now()}-${(name || 'berkas').replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;
    const uploadResult = await uploadToUploadcare(file, filename, type || 'dokumen');
    res.json({ url: uploadResult.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/kecamatan', async (req: Request, res: Response) => {
  const { data } = await supabase.from('kecamatan').select('*');
  res.json(data || []);
});

app.post('/api/kecamatan/toggle-active', async (req: Request, res: Response) => {
  const { id } = req.body;
  const { data: keca } = await supabase.from('kecamatan').select('is_dkr_aktif').eq('id', id).single();
  if (!keca) return res.status(404).json({ error: 'Kecamatan tidak ditemukan' });
  const { data } = await supabase.from('kecamatan').update({ is_dkr_aktif: !keca.is_dkr_aktif }).eq('id', id).select().single();
  res.json(data);
});

app.get('/api/kecamatan/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { data: keca } = await supabase.from('kecamatan').select('*').eq('slug', slug).single();
  if (!keca) return res.status(404).json({ error: 'Kecamatan tidak ditemukan' });

  const [
    { data: dkrProf },
    { data: personalia },
    { data: pangkalan },
    { data: dataPotensial },
    { data: berita },
    { data: agenda }
  ] = await Promise.all([
    supabase.from('dkr_profile').select('*').eq('kecamatan_id', keca.id).maybeSingle(),
    supabase.from('personalia').select('*').eq('owner_type', 'dkr').eq('kecamatan_id', keca.id).order('urutan'),
    supabase.from('pangkalan').select('*').eq('kecamatan_id', keca.id),
    supabase.from('data_potensial').select('*').eq('kecamatan_id', keca.id).maybeSingle(),
    supabase.from('berita').select('*').eq('kecamatan_id', keca.id).eq('status', 'approved'),
    supabase.from('agenda_kegiatan').select('*').eq('kecamatan_id', keca.id)
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
});

app.post('/api/dkr_profile/update', async (req: Request, res: Response) => {
  const { kecamatan_id, deskripsi, logo_url } = req.body;
  const { data: existing } = await supabase.from('dkr_profile').select('id').eq('kecamatan_id', kecamatan_id).maybeSingle();
  if (existing) {
    await supabase.from('dkr_profile').update({ deskripsi, logo_url, updated_at: new Date().toISOString() }).eq('kecamatan_id', kecamatan_id);
  } else {
    await supabase.from('dkr_profile').insert({ kecamatan_id, deskripsi, logo_url });
  }
  res.json({ success: true });
});

app.get('/api/saka', async (req: Request, res: Response) => {
  const { data } = await supabase.from('saka').select('*');
  res.json(data || []);
});

app.post('/api/saka/toggle-active', async (req: Request, res: Response) => {
  const { id } = req.body;
  const { data: item } = await supabase.from('saka').select('is_aktif').eq('id', id).single();
  if (!item) return res.status(404).json({ error: 'Saka tidak ditemukan' });
  const { data } = await supabase.from('saka').update({ is_aktif: !item.is_aktif }).eq('id', id).select().single();
  res.json(data);
});

app.get('/api/saka/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { data: sk } = await supabase.from('saka').select('*').eq('slug', slug).single();
  if (!sk) return res.status(404).json({ error: 'Saka tidak ditemukan' });

  const [
    { data: sakaProf },
    { data: personalia },
    { data: pangkalan },
    { data: dataPotensial },
    { data: berita },
    { data: agenda }
  ] = await Promise.all([
    supabase.from('saka_profile').select('*').eq('saka_id', sk.id).maybeSingle(),
    supabase.from('personalia').select('*').eq('owner_type', 'saka').eq('saka_id', sk.id).order('urutan'),
    supabase.from('pangkalan').select('*').eq('saka_id', sk.id),
    supabase.from('data_potensial').select('*').eq('saka_id', sk.id).maybeSingle(),
    supabase.from('berita').select('*').eq('saka_id', sk.id).eq('status', 'approved'),
    supabase.from('agenda_kegiatan').select('*').eq('saka_id', sk.id)
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
});

app.post('/api/saka_profile/update', async (req: Request, res: Response) => {
  const { saka_id, deskripsi, logo_url } = req.body;
  const { data: existing } = await supabase.from('saka_profile').select('id').eq('saka_id', saka_id).maybeSingle();
  if (existing) {
    await supabase.from('saka_profile').update({ deskripsi, logo_url, updated_at: new Date().toISOString() }).eq('saka_id', saka_id);
  } else {
    await supabase.from('saka_profile').insert({ saka_id, deskripsi, logo_url });
  }
  res.json({ success: true });
});

app.get('/api/dkc', async (req: Request, res: Response) => {
  const { data } = await supabase.from('dkc_profile').select('*').maybeSingle();
  res.json(data || { visi: '', misi: '' });
});

app.post('/api/dkc/update', async (req: Request, res: Response) => {
  const { visi, misi } = req.body;
  const { data: existing } = await supabase.from('dkc_profile').select('id').eq('id', 'dkc-main').maybeSingle();
  if (existing) {
    const { data } = await supabase.from('dkc_profile').update({ visi, misi, updated_at: new Date().toISOString() }).eq('id', 'dkc-main').select().single();
    res.json({ success: true, data });
  } else {
    const { data } = await supabase.from('dkc_profile').insert({ id: 'dkc-main', visi, misi }).select().single();
    res.json({ success: true, data });
  }
});

app.get('/api/personalia', async (req: Request, res: Response) => {
  const { owner_type, kecamatan_id, saka_id } = req.query;
  let query = supabase.from('personalia').select('*');
  if (owner_type) query = query.eq('owner_type', owner_type as string);
  if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id as string);
  if (saka_id) query = query.eq('saka_id', saka_id as string);
  const { data } = await query.order('urutan');
  res.json(data || []);
});

app.post('/api/personalia/save', async (req: Request, res: Response) => {
  const data = req.body;
  if (data.id) {
    await supabase.from('personalia').update(data).eq('id', data.id);
  } else {
    const { data: existing } = await supabase.from('personalia').select('id').eq('owner_type', data.owner_type).eq('kecamatan_id', data.kecamatan_id || '');
    data.urutan = data.urutan || (existing ? existing.length + 1 : 1);
    await supabase.from('personalia').insert(data);
  }
  res.json({ success: true });
});

app.post('/api/personalia/delete', async (req: Request, res: Response) => {
  const { id } = req.body;
  await supabase.from('personalia').delete().eq('id', id);
  res.json({ success: true });
});

app.get('/api/pangkalan', async (req: Request, res: Response) => {
  const { kecamatan_id, saka_id } = req.query;
  let query = supabase.from('pangkalan').select('*');
  if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id as string);
  if (saka_id) query = query.eq('saka_id', saka_id as string);
  const { data } = await query;
  res.json(data || []);
});

app.post('/api/pangkalan/save', async (req: Request, res: Response) => {
  const data = req.body;
  if (data.id) {
    await supabase.from('pangkalan').update(data).eq('id', data.id);
  } else {
    await supabase.from('pangkalan').insert(data);
  }
  res.json({ success: true });
});

app.post('/api/pangkalan/delete', async (req: Request, res: Response) => {
  const { id } = req.body;
  await supabase.from('pangkalan').delete().eq('id', id);
  res.json({ success: true });
});

app.get('/api/data_potensial', async (req: Request, res: Response) => {
  const { kecamatan_id, saka_id, periode } = req.query;
  let query = supabase.from('data_potensial').select('*');
  if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id as string);
  if (saka_id) query = query.eq('saka_id', saka_id as string);
  if (periode) query = query.eq('periode', periode as string);
  const { data } = await query;
  res.json(data || []);
});

app.post('/api/data_potensial/save', async (req: Request, res: Response) => {
  const data = req.body;
  let query = supabase.from('data_potensial').select('id').eq('periode', data.periode);
  if (data.kecamatan_id) query = query.eq('kecamatan_id', data.kecamatan_id);
  if (data.saka_id) query = query.eq('saka_id', data.saka_id);
  
  const { data: existing } = await query.maybeSingle();
  if (existing) {
    await supabase.from('data_potensial').update({ ...data, updated_at: new Date().toISOString() }).eq('id', existing.id);
  } else {
    await supabase.from('data_potensial').insert(data);
  }
  res.json({ success: true });
});

app.get('/api/berita', async (req: Request, res: Response) => {
  const { status, kecamatan_id, saka_id } = req.query;
  let query = supabase.from('berita').select('*');
  if (status) query = query.eq('status', status as string);
  if (kecamatan_id) query = query.eq('kecamatan_id', kecamatan_id as string);
  if (saka_id) query = query.eq('saka_id', saka_id as string);
  const { data } = await query.order('published_at', { ascending: false });
  res.json(data || []);
});

app.get('/api/berita/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { data } = await supabase.from('berita').select('*').eq('slug', slug).maybeSingle();
  if (data) {
    res.json(data);
  } else {
    res.status(404).json({ error: 'Berita tidak ditemukan' });
  }
});

app.post('/api/berita/save', async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.judul) return res.status(400).json({ error: 'Judul berita wajib diisi' });

  const slug = data.judul.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  data.slug = slug;

  if (data.id) {
    await supabase.from('berita').update(data).eq('id', data.id);
  } else {
    await supabase.from('berita').insert(data);
  }
  res.json({ success: true });
});

app.post('/api/berita/status', async (req: Request, res: Response) => {
  const { id, status } = req.body;
  const updateData: any = { status };
  if (status === 'approved') updateData.published_at = new Date().toISOString();
  await supabase.from('berita').update(updateData).eq('id', id);
  res.json({ success: true });
});

app.post('/api/berita/delete', async (req: Request, res: Response) => {
  const { id } = req.body;
  await supabase.from('berita').delete().eq('id', id);
  res.json({ success: true });
});

app.post('/api/berita/:id/like', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // 'like' or 'unlike'
  const { data: item } = await supabase.from('berita').select('likes').eq('id', id).single();
  if (item) {
    const likesCount = action === 'unlike' ? Math.max(0, (item.likes || 0) - 1) : (item.likes || 0) + 1;
    await supabase.from('berita').update({ likes: likesCount }).eq('id', id);
    res.json({ success: true, likes: likesCount });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.get('/api/agenda', async (req: Request, res: Response) => {
  const { data } = await supabase.from('agenda_kegiatan').select('*');
  res.json(data || []);
});

app.post('/api/agenda/save', async (req: Request, res: Response) => {
  const data = req.body;
  if (data.id) {
    await supabase.from('agenda_kegiatan').update(data).eq('id', data.id);
  } else {
    await supabase.from('agenda_kegiatan').insert(data);
  }
  res.json({ success: true });
});

app.post('/api/agenda/delete', async (req: Request, res: Response) => {
  const { id } = req.body;
  await supabase.from('agenda_kegiatan').delete().eq('id', id);
  res.json({ success: true });
});

app.get('/api/agenda/:id/config', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data } = await supabase.from('form_kegiatan_config').select('*').eq('agenda_id', id).maybeSingle();
  res.json(data || null);
});

app.post('/api/agenda/:id/config', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { form_schema, tipe_pendaftaran } = req.body;
  const { data: existing } = await supabase.from('form_kegiatan_config').select('id').eq('agenda_id', id).maybeSingle();
  if (existing) {
    await supabase.from('form_kegiatan_config').update({ form_schema, tipe_pendaftaran }).eq('agenda_id', id);
  } else {
    await supabase.from('form_kegiatan_config').insert({ agenda_id: id, form_schema, tipe_pendaftaran });
  }
  res.json({ success: true });
});

app.post('/api/agenda/:id/register', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tipe, kecamatan_id, data_peserta } = req.body;
  await supabase.from('pendaftaran_peserta').insert({
    agenda_id: id,
    tipe,
    kecamatan_id,
    data_peserta
  });
  res.json({ success: true });
});

app.get('/api/agenda/:id/registrants', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { data } = await supabase.from('pendaftaran_peserta').select('*').eq('agenda_id', id);
  res.json(data || []);
});

app.get('/api/informasi', async (req: Request, res: Response) => {
  const { data } = await supabase.from('informasi').select('*').order('created_at', { ascending: false });
  res.json(data || []);
});

app.post('/api/informasi/save', async (req: Request, res: Response) => {
  const data = req.body;
  if (data.id) {
    await supabase.from('informasi').update(data).eq('id', data.id);
  } else {
    await supabase.from('informasi').insert(data);
  }
  res.json({ success: true });
});

app.post('/api/informasi/delete', async (req: Request, res: Response) => {
  const { id } = req.body;
  await supabase.from('informasi').delete().eq('id', id);
  res.json({ success: true });
});

app.get('/api/site_content', async (req: Request, res: Response) => {
  const { data } = await supabase.from('site_content').select('*');
  res.json(data || []);
});

app.post('/api/site_content/save', async (req: Request, res: Response) => {
  const { section_key, content } = req.body;
  const { data: existing } = await supabase.from('site_content').select('id').eq('section_key', section_key).maybeSingle();
  if (existing) {
    await supabase.from('site_content').update({ content, updated_at: new Date().toISOString() }).eq('section_key', section_key);
  } else {
    await supabase.from('site_content').insert({ section_key, content });
  }
  const { data } = await supabase.from('site_content').select('*').eq('section_key', section_key).maybeSingle();
  res.json({ success: true, data });
});

app.get('/api/users', async (req: Request, res: Response) => {
  const { data } = await supabase.from('profiles').select('user_id, role, kecamatan_id, saka_id, nama');
  res.json(data || []);
});

app.post('/api/users/save', async (req: Request, res: Response) => {
  // Not fully secure/functional without edge functions for full user management but works for migration mock
  res.json({ success: true });
});

app.get('/api/laporan_kegiatan', async (req: Request, res: Response) => {
  const { data } = await supabase.from('laporan_kegiatan').select('*');
  res.json(data || []);
});

app.post('/api/laporan_kegiatan/save', async (req: Request, res: Response) => {
  const data = req.body;
  if (!data.kecamatan_id || !data.jenis_dokumen || !data.nama_kegiatan) {
    return res.status(400).json({ error: 'Data laporan tidak lengkap' });
  }

  let updatedReport = null;
  if (data.id) {
    const { data: ret } = await supabase.from('laporan_kegiatan').update({
      jenis_dokumen: data.jenis_dokumen,
      nama_kegiatan: data.nama_kegiatan,
      tanggal_pelaksanaan: data.tanggal_pelaksanaan,
      tempat_pelaksanaan: data.tempat_pelaksanaan,
      deskripsi_singkat: data.deskripsi_singkat,
      file_laporan_url: data.file_laporan_url,
      status: 'pending'
    }).eq('id', data.id).select().single();
    updatedReport = ret;
  } else {
    const { data: ret } = await supabase.from('laporan_kegiatan').insert({
      kecamatan_id: data.kecamatan_id,
      kecamatan_nama: data.kecamatan_nama || 'Kecamatan',
      jenis_dokumen: data.jenis_dokumen,
      nama_kegiatan: data.nama_kegiatan,
      tanggal_pelaksanaan: data.tanggal_pelaksanaan,
      tempat_pelaksanaan: data.tempat_pelaksanaan,
      deskripsi_singkat: data.deskripsi_singkat,
      file_laporan_url: data.file_laporan_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
      status: 'pending'
    }).select().single();
    updatedReport = ret;
  }
  res.json({ success: true, data: updatedReport });
});

app.post('/api/laporan_kegiatan/process', async (req: Request, res: Response) => {
  const { id, status, catatan_admin, point_bobot } = req.body;
  if (!id || !status) return res.status(400).json({ error: 'ID dan status harus diisi' });

  const updateData: any = { status, catatan_admin: catatan_admin || '' };
  if (point_bobot !== undefined) updateData.point_bobot = Number(point_bobot);

  const { data } = await supabase.from('laporan_kegiatan').update(updateData).eq('id', id).select().single();
  if (!data) return res.status(404).json({ error: 'Laporan tidak ditemukan' });
  res.json({ success: true, data });
});

app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Express Error:", err);
  res.status(500).json({ error: err.message || 'Server crashed' });
});

export default app;
