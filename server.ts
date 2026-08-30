import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import dbInstance from './server/db';
import { 
  Profile, Kecamatan, DkcProfile, DkrProfile, Personalia, 
  Pangkalan, DataPotensial, Berita, AgendaKegiatan, 
  FormKegiatanConfig, PendaftaranPeserta, Informasi, SiteContent,
  Saka, SakaProfile
} from './src/types';
import { uploadFile, uploadToUploadcare } from './server/services/uploadService';

const app = express();
const PORT = 3000;

// Increase payload limits for base64 file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Directories
const DATA_DIR = path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Static serve uploads folder
app.use('/uploads', express.static(UPLOADS_DIR));

// Helper for generating random IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock users authentication database
const USERS = [
  { email: 'admin@dkctasik.org', password: 'admin', role: 'admin', nama: 'Kak Fajar Ramadhan (DKC)' },
  { email: 'singaparna@dkctasik.org', password: 'user123', role: 'user', kecamatan_id: 'singaparna', nama: 'DKR Singaparna' },
  { email: 'ciawi@dkctasik.org', password: 'user123', role: 'user', kecamatan_id: 'ciawi', nama: 'DKR Ciawi' },
  { email: 'karangnunggal@dkctasik.org', password: 'user123', role: 'user', kecamatan_id: 'karangnunggal', nama: 'DKR Karangnunggal' },
  { email: 'manonjaya@dkctasik.org', password: 'user123', role: 'user', kecamatan_id: 'manonjaya', nama: 'DKR Manonjaya' },
  { email: 'taraju@dkctasik.org', password: 'user123', role: 'user', kecamatan_id: 'taraju', nama: 'DKR Taraju' },
  { email: 'bhayangkara@dkctasik.org', password: 'saka123', role: 'saka', saka_id: 'bhayangkara', nama: 'Saka Bhayangkara' },
  { email: 'baktihusada@dkctasik.org', password: 'saka123', role: 'saka', saka_id: 'baktihusada', nama: 'Saka Bakti Husada' },
  { email: 'wanabakti@dkctasik.org', password: 'saka123', role: 'saka', saka_id: 'wanabakti', nama: 'Saka Wanabakti' },
  { email: 'wirakartika@dkctasik.org', password: 'saka123', role: 'saka', saka_id: 'wirakartika', nama: 'Saka Wira Kartika' },
  { email: 'kencana@dkctasik.org', password: 'saka123', role: 'saka', saka_id: 'kencana', nama: 'Saka Kencana' },
];

// --- 1. AUTH ENDPOINTS ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  const foundUser = USERS.find(u => u.email === email && u.password === password);
  
  if (!foundUser) {
    return res.status(401).json({ error: 'Email atau password salah' });
  }

  // Find profile in database or map one
  const db = dbInstance.get();
  let profile = db.profiles.find(p => p.user_id === email);
  if (!profile) {
    profile = {
      id: generateId(),
      user_id: foundUser.email,
      role: foundUser.role as 'admin' | 'user' | 'saka',
      kecamatan_id: (foundUser as any).kecamatan_id,
      saka_id: (foundUser as any).saka_id,
      nama: foundUser.nama,
      created_at: new Date().toISOString()
    };
    dbInstance.update(d => { d.profiles.push(profile!); });
  }

  res.json({
    token: `token-${generateId()}`,
    user: profile,
    kecamatan: (foundUser as any).kecamatan_id ? db.kecamatan.find(k => k.id === (foundUser as any).kecamatan_id) : null,
    saka: (foundUser as any).saka_id ? db.saka.find(s => s.id === (foundUser as any).saka_id) : null
  });
});

app.post('/api/auth/change-password', (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  const userIdx = USERS.findIndex(u => u.email === email);
  if (userIdx !== -1) {
    USERS[userIdx].password = newPassword;
    return res.json({ success: true, message: 'Password berhasil diperbarui' });
  }
  res.status(404).json({ error: 'User tidak ditemukan' });
});

// --- 2. FILE UPLOAD ENDPOINT ---
app.post('/api/upload', async (req: Request, res: Response) => {
  try {
    const { file, name, type } = req.body; // base64 string
    if (!file) {
      return res.status(400).json({ error: 'Tidak ada file dikirim' });
    }

    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Format file tidak valid' });
    }

    const extension = type === 'dokumen' ? 'pdf' : 'png';
    const filename = `${Date.now()}-${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${extension}`;

    const uploadResult = await uploadFile(file, filename, type || 'gambar');
    res.json({ url: uploadResult.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- 2B. UPLOADCARE UPLOAD ENDPOINT (khusus Pusat Unduhan Berkas / Informasi) ---
app.post('/api/upload/uploadcare', async (req: Request, res: Response) => {
  try {
    const { file, name, type } = req.body; // base64 string
    if (!file) {
      return res.status(400).json({ error: 'Tidak ada file dikirim' });
    }

    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Format file tidak valid' });
    }

    const filename = `${Date.now()}-${(name || 'berkas').replace(/[^a-z0-9.]/gi, '_').toLowerCase()}`;

    const uploadResult = await uploadToUploadcare(file, filename, type || 'dokumen');
    res.json({ url: uploadResult.url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- 3. KECAMATAN ENDPOINTS ---
app.get('/api/kecamatan', (req: Request, res: Response) => {
  const db = dbInstance.get();
  res.json(db.kecamatan);
});

app.post('/api/kecamatan/toggle-active', (req: Request, res: Response) => {
  const { id } = req.body;
  const db = dbInstance.get();
  let updated: Kecamatan | null = null;
  dbInstance.update(d => {
    const item = d.kecamatan.find(k => k.id === id);
    if (item) {
      item.is_dkr_aktif = !item.is_dkr_aktif;
      updated = item;
    }
  });
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Kecamatan tidak ditemukan' });
  }
});

app.get('/api/kecamatan/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const db = dbInstance.get();
  const keca = db.kecamatan.find(k => k.slug === slug);
  if (!keca) {
    return res.status(404).json({ error: 'Kecamatan tidak ditemukan' });
  }

  // Get details
  const dkrProf = db.dkr_profile.find(dp => dp.kecamatan_id === keca.id) || {
    id: `dkr-${keca.id}`,
    kecamatan_id: keca.id,
    deskripsi: `DKR Kecamatan ${keca.nama_kecamatan} Gerakan Pramuka Kabupaten Tasikmalaya.`,
    updated_at: new Date().toISOString()
  };

  const personalia = db.personalia
    .filter(p => p.owner_type === 'dkr' && p.kecamatan_id === keca.id)
    .sort((a, b) => a.urutan - b.urutan);

  const pangkalan = db.pangkalan.filter(p => p.kecamatan_id === keca.id);
  const dataPotensial = db.data_potensial.find(dp => dp.kecamatan_id === keca.id);
  const berita = db.berita.filter(b => b.kecamatan_id === keca.id && b.status === 'approved');
  const agenda = db.agenda_kegiatan.filter(a => a.kecamatan_id === keca.id);

  res.json({
    kecamatan: keca,
    profile: dkrProf,
    personalia,
    pangkalan,
    data_potensial: dataPotensial,
    berita,
    agenda
  });
});

app.post('/api/dkr_profile/update', (req: Request, res: Response) => {
  const { kecamatan_id, deskripsi, logo_url } = req.body;
  dbInstance.update(d => {
    const idx = d.dkr_profile.findIndex(dp => dp.kecamatan_id === kecamatan_id);
    if (idx !== -1) {
      d.dkr_profile[idx].deskripsi = deskripsi;
      if (logo_url !== undefined) {
        d.dkr_profile[idx].logo_url = logo_url;
      }
      d.dkr_profile[idx].updated_at = new Date().toISOString();
    } else {
      d.dkr_profile.push({
        id: `dkr-${kecamatan_id}`,
        kecamatan_id,
        deskripsi,
        logo_url,
        updated_at: new Date().toISOString()
      });
    }
  });
  res.json({ success: true });
});

// --- 3B. SAKA ENDPOINTS ---
app.get('/api/saka', (req: Request, res: Response) => {
  const db = dbInstance.get();
  res.json(db.saka);
});

app.post('/api/saka/toggle-active', (req: Request, res: Response) => {
  const { id } = req.body;
  const db = dbInstance.get();
  let updated: Saka | null = null;
  dbInstance.update(d => {
    const item = d.saka.find(s => s.id === id);
    if (item) {
      item.is_aktif = !item.is_aktif;
      updated = item;
    }
  });
  if (updated) {
    res.json(updated);
  } else {
    res.status(404).json({ error: 'Saka tidak ditemukan' });
  }
});

app.get('/api/saka/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const db = dbInstance.get();
  const sk = db.saka.find(s => s.slug === slug);
  if (!sk) {
    return res.status(404).json({ error: 'Saka tidak ditemukan' });
  }

  const sakaProf = db.saka_profile.find(sp => sp.saka_id === sk.id) || {
    id: `saka-${sk.id}`,
    saka_id: sk.id,
    deskripsi: sk.deskripsi || `Saka Tingkat Kabupaten Tasikmalaya.`,
    updated_at: new Date().toISOString()
  };

  const personalia = db.personalia
    .filter(p => p.owner_type === 'saka' && p.saka_id === sk.id)
    .sort((a, b) => a.urutan - b.urutan);

  const pangkalan = db.pangkalan.filter(p => p.saka_id === sk.id);
  const dataPotensial = db.data_potensial.find(dp => dp.saka_id === sk.id);
  const berita = db.berita.filter(b => b.saka_id === sk.id && b.status === 'approved');
  const agenda = db.agenda_kegiatan.filter(a => a.saka_id === sk.id);

  res.json({
    saka: sk,
    profile: sakaProf,
    personalia,
    pangkalan,
    data_potensial: dataPotensial,
    berita,
    agenda
  });
});

app.post('/api/saka_profile/update', (req: Request, res: Response) => {
  const { saka_id, deskripsi, logo_url } = req.body;
  dbInstance.update(d => {
    const idx = d.saka_profile.findIndex(sp => sp.saka_id === saka_id);
    if (idx !== -1) {
      d.saka_profile[idx].deskripsi = deskripsi;
      if (logo_url !== undefined) {
        d.saka_profile[idx].logo_url = logo_url;
      }
      d.saka_profile[idx].updated_at = new Date().toISOString();
    } else {
      d.saka_profile.push({
        id: `saka-${saka_id}`,
        saka_id,
        deskripsi,
        logo_url,
        updated_at: new Date().toISOString()
      });
    }
  });
  res.json({ success: true });
});

// --- 4. DKC PROFILE ENDPOINTS ---
app.get('/api/dkc', (req: Request, res: Response) => {
  const db = dbInstance.get();
  res.json(db.dkc_profile[0] || { visi: '', misi: '' });
});

app.post('/api/dkc/update', (req: Request, res: Response) => {
  const { visi, misi } = req.body;
  dbInstance.update(d => {
    if (d.dkc_profile.length > 0) {
      d.dkc_profile[0].visi = visi;
      d.dkc_profile[0].misi = misi;
      d.dkc_profile[0].updated_at = new Date().toISOString();
    } else {
      d.dkc_profile.push({
        id: 'dkc-main',
        visi,
        misi,
        updated_at: new Date().toISOString()
      });
    }
  });
  res.json({ success: true, data: dbInstance.get().dkc_profile[0] });
});

// --- 5. PERSONALIA ENDPOINTS ---
app.get('/api/personalia', (req: Request, res: Response) => {
  const { owner_type, kecamatan_id, saka_id } = req.query;
  const db = dbInstance.get();
  let list = db.personalia;
  if (owner_type) {
    list = list.filter(p => p.owner_type === owner_type as any);
  }
  if (kecamatan_id) {
    list = list.filter(p => p.kecamatan_id === kecamatan_id);
  }
  if (saka_id) {
    list = list.filter(p => p.saka_id === saka_id);
  }
  res.json(list.sort((a, b) => a.urutan - b.urutan));
});

app.post('/api/personalia/save', (req: Request, res: Response) => {
  const data = req.body as Personalia;
  dbInstance.update(d => {
    if (data.id) {
      const idx = d.personalia.findIndex(p => p.id === data.id);
      if (idx !== -1) {
        d.personalia[idx] = { ...d.personalia[idx], ...data };
      }
    } else {
      d.personalia.push({
        ...data,
        id: `p-${generateId()}`,
        urutan: data.urutan || d.personalia.filter(p => p.owner_type === data.owner_type && p.kecamatan_id === data.kecamatan_id).length + 1
      });
    }
  });
  res.json({ success: true });
});

app.post('/api/personalia/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  dbInstance.update(d => {
    d.personalia = d.personalia.filter(p => p.id !== id);
  });
  res.json({ success: true });
});

// --- 6. PANGKALAN ENDPOINTS ---
app.get('/api/pangkalan', (req: Request, res: Response) => {
  const { kecamatan_id, saka_id } = req.query;
  const db = dbInstance.get();
  let list = db.pangkalan;
  if (kecamatan_id) {
    list = list.filter(p => p.kecamatan_id === kecamatan_id);
  }
  if (saka_id) {
    list = list.filter(p => p.saka_id === saka_id);
  }
  res.json(list);
});

app.post('/api/pangkalan/save', (req: Request, res: Response) => {
  const data = req.body as Pangkalan;
  dbInstance.update(d => {
    if (data.id) {
      const idx = d.pangkalan.findIndex(p => p.id === data.id);
      if (idx !== -1) {
        d.pangkalan[idx] = { ...d.pangkalan[idx], ...data };
      }
    } else {
      d.pangkalan.push({
        ...data,
        id: `pk-${generateId()}`
      });
    }
  });
  res.json({ success: true });
});

app.post('/api/pangkalan/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  dbInstance.update(d => {
    d.pangkalan = d.pangkalan.filter(p => p.id !== id);
  });
  res.json({ success: true });
});

// --- 7. DATA POTENSIAL ENDPOINTS ---
app.get('/api/data_potensial', (req: Request, res: Response) => {
  const { kecamatan_id, saka_id, periode } = req.query;
  const db = dbInstance.get();
  let list = db.data_potensial;
  if (kecamatan_id) {
    list = list.filter(p => p.kecamatan_id === kecamatan_id);
  }
  if (saka_id) {
    list = list.filter(p => p.saka_id === saka_id);
  }
  if (periode) {
    list = list.filter(p => p.periode === periode);
  }
  res.json(list);
});

app.post('/api/data_potensial/save', (req: Request, res: Response) => {
  const data = req.body as DataPotensial;
  dbInstance.update(d => {
    const idx = d.data_potensial.findIndex(dp => 
      ((data.kecamatan_id && dp.kecamatan_id === data.kecamatan_id) || (data.saka_id && dp.saka_id === data.saka_id)) && 
      dp.periode === data.periode
    );
    if (idx !== -1) {
      d.data_potensial[idx] = {
        ...d.data_potensial[idx],
        ...data,
        updated_at: new Date().toISOString()
      };
    } else {
      d.data_potensial.push({
        ...data,
        id: `dp-${generateId()}`,
        updated_at: new Date().toISOString()
      });
    }
  });
  res.json({ success: true });
});

// --- 8. BERITA ENDPOINTS ---
app.get('/api/berita', (req: Request, res: Response) => {
  const { status, kecamatan_id, saka_id } = req.query;
  const db = dbInstance.get();
  let list = db.berita;
  if (status) {
    list = list.filter(b => b.status === status);
  }
  if (kecamatan_id) {
    list = list.filter(b => b.kecamatan_id === kecamatan_id);
  }
  if (saka_id) {
    list = list.filter(b => b.saka_id === saka_id);
  }
  res.json(list.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()));
});

app.get('/api/berita/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const db = dbInstance.get();
  const article = db.berita.find(b => b.slug === slug);
  if (article) {
    res.json(article);
  } else {
    res.status(404).json({ error: 'Berita tidak ditemukan' });
  }
});

app.post('/api/berita/save', (req: Request, res: Response) => {
  const data = req.body as Berita;
  if (!data.judul) return res.status(400).json({ error: 'Judul berita wajib diisi' });

  const slug = data.judul.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  dbInstance.update(d => {
    if (data.id) {
      const idx = d.berita.findIndex(b => b.id === data.id);
      if (idx !== -1) {
        d.berita[idx] = { ...d.berita[idx], ...data, slug };
      }
    } else {
      d.berita.push({
        ...data,
        id: `b-${generateId()}`,
        slug,
        published_at: new Date().toISOString()
      });
    }
  });
  res.json({ success: true });
});

app.post('/api/berita/status', (req: Request, res: Response) => {
  const { id, status } = req.body;
  dbInstance.update(d => {
    const item = d.berita.find(b => b.id === id);
    if (item) {
      item.status = status;
      if (status === 'approved') {
        item.published_at = new Date().toISOString();
      }
    }
  });
  res.json({ success: true });
});

app.post('/api/berita/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  dbInstance.update(d => {
    d.berita = d.berita.filter(b => b.id !== id);
  });
  res.json({ success: true });
});

app.post('/api/berita/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action } = req.body; // 'like' or 'unlike'
  let likesCount = 0;
  dbInstance.update(d => {
    const item = d.berita.find(b => b.id === id);
    if (item) {
      const bObj = item as any;
      if (!bObj.likes) bObj.likes = 0;
      if (action === 'unlike') {
        bObj.likes = Math.max(0, bObj.likes - 1);
      } else {
        bObj.likes = bObj.likes + 1;
      }
      likesCount = bObj.likes;
    }
  });
  res.json({ success: true, likes: likesCount });
});

// --- 9. AGENDA ENDPOINTS ---
app.get('/api/agenda', (req: Request, res: Response) => {
  const db = dbInstance.get();
  res.json(db.agenda_kegiatan);
});

app.post('/api/agenda/save', (req: Request, res: Response) => {
  const data = req.body as AgendaKegiatan;
  dbInstance.update(d => {
    if (data.id) {
      const idx = d.agenda_kegiatan.findIndex(a => a.id === data.id);
      if (idx !== -1) {
        d.agenda_kegiatan[idx] = { ...d.agenda_kegiatan[idx], ...data };
      }
    } else {
      d.agenda_kegiatan.push({
        ...data,
        id: `a-${generateId()}`
      });
    }
  });
  res.json({ success: true });
});

app.post('/api/agenda/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  dbInstance.update(d => {
    d.agenda_kegiatan = d.agenda_kegiatan.filter(a => a.id !== id);
    d.form_kegiatan_config = d.form_kegiatan_config.filter(fc => fc.agenda_id !== id);
    d.pendaftaran_peserta = d.pendaftaran_peserta.filter(p => p.agenda_id !== id);
  });
  res.json({ success: true });
});

app.get('/api/agenda/:id/config', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = dbInstance.get();
  const config = db.form_kegiatan_config.find(fc => fc.agenda_id === id);
  res.json(config || null);
});

app.post('/api/agenda/:id/config', (req: Request, res: Response) => {
  const { id } = req.params;
  const { form_schema, tipe_pendaftaran } = req.body;
  dbInstance.update(d => {
    const idx = d.form_kegiatan_config.findIndex(fc => fc.agenda_id === id);
    if (idx !== -1) {
      d.form_kegiatan_config[idx].form_schema = form_schema;
      d.form_kegiatan_config[idx].tipe_pendaftaran = tipe_pendaftaran;
    } else {
      d.form_kegiatan_config.push({
        id: `fc-${generateId()}`,
        agenda_id: id,
        form_schema,
        tipe_pendaftaran
      });
    }
  });
  res.json({ success: true });
});

app.post('/api/agenda/:id/register', (req: Request, res: Response) => {
  const { id } = req.params;
  const { tipe, kecamatan_id, data_peserta } = req.body;
  
  dbInstance.update(d => {
    d.pendaftaran_peserta.push({
      id: `reg-${generateId()}`,
      agenda_id: id,
      tipe,
      kecamatan_id,
      data_peserta,
      created_at: new Date().toISOString()
    });
  });
  res.json({ success: true });
});

app.get('/api/agenda/:id/registrants', (req: Request, res: Response) => {
  const { id } = req.params;
  const db = dbInstance.get();
  const regs = db.pendaftaran_peserta.filter(p => p.agenda_id === id);
  res.json(regs);
});

// --- 10. INFORMASI ENDPOINTS ---
app.get('/api/informasi', (req: Request, res: Response) => {
  const db = dbInstance.get();
  res.json(db.informasi.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
});

app.post('/api/informasi/save', (req: Request, res: Response) => {
  const data = req.body as Informasi;
  dbInstance.update(d => {
    if (data.id) {
      const idx = d.informasi.findIndex(i => i.id === data.id);
      if (idx !== -1) {
        d.informasi[idx] = { ...d.informasi[idx], ...data };
      }
    } else {
      d.informasi.push({
        ...data,
        id: `info-${generateId()}`,
        created_at: new Date().toISOString()
      });
    }
  });
  res.json({ success: true });
});

app.post('/api/informasi/delete', (req: Request, res: Response) => {
  const { id } = req.body;
  dbInstance.update(d => {
    d.informasi = d.informasi.filter(i => i.id !== id);
  });
  res.json({ success: true });
});

// --- 11. SITE CONTENT ENDPOINTS ---
app.get('/api/site_content', (req: Request, res: Response) => {
  const db = dbInstance.get();
  res.json(db.site_content);
});

app.post('/api/site_content/save', (req: Request, res: Response) => {
  const { section_key, content } = req.body;
  dbInstance.update(d => {
    const idx = d.site_content.findIndex(sc => sc.section_key === section_key);
    if (idx !== -1) {
      d.site_content[idx].content = content;
      d.site_content[idx].updated_at = new Date().toISOString();
    } else {
      d.site_content.push({
        id: `sc-${generateId()}`,
        section_key,
        content,
        updated_at: new Date().toISOString()
      });
    }
  });
  res.json({ success: true, data: dbInstance.get().site_content.find(sc => sc.section_key === section_key) });
});

// --- 12. MANAGEMENT USERS ENDPOINTS (Admin only) ---
app.get('/api/users', (req: Request, res: Response) => {
  // Return the mock users lists for user management panel
  res.json(USERS.map(u => ({ email: u.email, role: u.role, kecamatan_id: (u as any).kecamatan_id, saka_id: (u as any).saka_id, nama: u.nama })));
});

app.post('/api/users/save', (req: Request, res: Response) => {
  const { email, password, role, kecamatan_id, saka_id, nama } = req.body;
  const existingIdx = USERS.findIndex(u => u.email === email);
  if (existingIdx !== -1) {
    USERS[existingIdx] = { ...USERS[existingIdx], password, role, kecamatan_id, saka_id, nama };
  } else {
    USERS.push({ email, password, role, kecamatan_id, saka_id, nama });
  }
  res.json({ success: true });
});

// --- 13. LAPORAN KEGIATAN 02GP & 01 DIKLAT ENDPOINTS ---
app.get('/api/laporan_kegiatan', (req: Request, res: Response) => {
  const db = dbInstance.get();
  res.json(db.laporan_kegiatan || []);
});

app.post('/api/laporan_kegiatan/save', (req: Request, res: Response) => {
  const { id, kecamatan_id, kecamatan_nama, jenis_dokumen, nama_kegiatan, tanggal_pelaksanaan, tempat_pelaksanaan, deskripsi_singkat, file_laporan_url } = req.body;
  
  if (!kecamatan_id || !jenis_dokumen || !nama_kegiatan) {
    return res.status(400).json({ error: 'Data laporan tidak lengkap' });
  }

  const db = dbInstance.get();
  let updatedReport: any = null;

  dbInstance.update(d => {
    if (!d.laporan_kegiatan) d.laporan_kegiatan = [];
    
    if (id) {
      // update
      const idx = d.laporan_kegiatan.findIndex(l => l.id === id);
      if (idx !== -1) {
        d.laporan_kegiatan[idx] = {
          ...d.laporan_kegiatan[idx],
          jenis_dokumen,
          nama_kegiatan,
          tanggal_pelaksanaan,
          tempat_pelaksanaan,
          deskripsi_singkat,
          file_laporan_url: file_laporan_url || d.laporan_kegiatan[idx].file_laporan_url,
          status: 'pending', // Re-verify upon revision
          created_at: new Date().toISOString()
        };
        updatedReport = d.laporan_kegiatan[idx];
      }
    } else {
      // create new
      const newReport = {
        id: `lap-${generateId()}`,
        kecamatan_id,
        kecamatan_nama: kecamatan_nama || 'Kecamatan',
        jenis_dokumen,
        nama_kegiatan,
        tanggal_pelaksanaan,
        tempat_pelaksanaan,
        deskripsi_singkat,
        file_laporan_url: file_laporan_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };
      d.laporan_kegiatan.push(newReport);
      updatedReport = newReport;
    }
  });

  res.json({ success: true, data: updatedReport });
});

app.post('/api/laporan_kegiatan/process', (req: Request, res: Response) => {
  const { id, status, catatan_admin, point_bobot } = req.body;
  if (!id || !status) {
    return res.status(400).json({ error: 'ID dan status harus diisi' });
  }

  const db = dbInstance.get();
  let updatedReport: any = null;

  dbInstance.update(d => {
    if (!d.laporan_kegiatan) d.laporan_kegiatan = [];
    const idx = d.laporan_kegiatan.findIndex(l => l.id === id);
    if (idx !== -1) {
      d.laporan_kegiatan[idx] = {
        ...d.laporan_kegiatan[idx],
        status,
        catatan_admin: catatan_admin || '',
        point_bobot: point_bobot !== undefined ? Number(point_bobot) : d.laporan_kegiatan[idx].point_bobot
      };
      updatedReport = d.laporan_kegiatan[idx];
    }
  });

  if (!updatedReport) {
    return res.status(404).json({ error: 'Laporan tidak ditemukan' });
  }

  res.json({ success: true, data: updatedReport });
});

// Mount Vite in development or static serve in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
