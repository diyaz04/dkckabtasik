import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, BarChart2, FileText, Calendar, Users, Key, Save, Plus, Trash, Check, X, Shield 
} from 'lucide-react';
import { 
  Saka, Personalia, Berita, AgendaKegiatan, 
  Pangkalan, DataPotensial, SakaProfile 
} from '../types';
import { compressAndUploadFile } from '../utils/imageUpload';

export default function PortalSaka() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'potensial' | 'pangkalan' | 'berita' | 'agenda' | 'personalia' | 'password'>('dashboard');
  
  const [user, setUser] = useState<any>(null);
  const [saka, setSaka] = useState<Saka | null>(null);

  // States
  const [profile, setProfile] = useState<SakaProfile | null>(null);
  const [deskripsi, setDeskripsi] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  const [personalia, setPersonalia] = useState<Personalia[]>([]);
  const [pangkalan, setPangkalan] = useState<Pangkalan[]>([]);
  const [potensialData, setPotensialData] = useState<DataPotensial | null>(null);
  const [berita, setBerita] = useState<Berita[]>([]);
  const [agenda, setAgenda] = useState<AgendaKegiatan[]>([]);

  // Form Inputs (Potensial)
  const [penegakL, setPenegakL] = useState(0);
  const [penegakP, setPenegakP] = useState(0);
  const [pandegaL, setPandegaL] = useState(0);
  const [pandegaP, setPandegaP] = useState(0);
  const [potensialSaving, setPotensialSaving] = useState(false);

  // Form Inputs (Pangkalan/Krida CRUD)
  const [newPangkalanNama, setNewPangkalanNama] = useState('');
  const [newPangkalanJenis, setNewPangkalanJenis] = useState<'SMA' | 'SMK' | 'MA' | 'Perguruan Tinggi' | 'lainnya'>('SMA');

  // Form Inputs (Berita Submission)
  const [beritaJudul, setBeritaJudul] = useState('');
  const [beritaGambar, setBeritaGambar] = useState('');
  const [beritaKonten, setBeritaKonten] = useState('');
  const [beritaSaving, setBeritaSaving] = useState(false);

  // Form Inputs (Local Agenda)
  const [agendaNama, setAgendaNama] = useState('');
  const [agendaTempat, setAgendaTempat] = useState('');
  const [agendaMulai, setAgendaMulai] = useState('');
  const [agendaSelesai, setAgendaSelesai] = useState('');
  const [agendaPeserta, setAgendaPeserta] = useState(50);

  // Form Inputs (Personalia CRUD)
  const [newPersonNama, setNewPersonNama] = useState('');
  const [newPersonJabatan, setNewPersonJabatan] = useState('');
  const [newPersonGolongan, setNewPersonGolongan] = useState<'penegak' | 'pandega' | 'pembina' | 'lainnya'>('pembina');
  const [newPersonFoto, setNewPersonFoto] = useState('');

  // Password Update
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);

  const checkAuth = () => {
    const token = localStorage.getItem('dkc_token');
    const userString = localStorage.getItem('dkc_user');
    const sakaString = localStorage.getItem('dkc_saka');
    
    if (!token || !userString) {
      window.location.hash = '/portal/login';
      return;
    }
    const userObj = JSON.parse(userString);
    if (userObj.role !== 'saka') {
      window.location.hash = '/portal/admin';
      return;
    }

    setUser(userObj);
    if (sakaString) {
      setSaka(JSON.parse(sakaString));
    }
  };

  const loadSakaData = async () => {
    const sakaString = localStorage.getItem('dkc_saka');
    if (!sakaString) return;
    const sakaObj = JSON.parse(sakaString) as Saka;

    try {
      const res = await fetch(`/api/saka/${sakaObj.slug}`);
      const resData = await res.json();
      
      setPersonalia(resData.personalia || []);
      setPangkalan(resData.pangkalan || []);
      setPotensialData(resData.data_potensial || null);
      setBerita(resData.berita || []);
      setAgenda(resData.agenda || []);

      setProfile(resData.profile || null);
      if (resData.profile) {
        setDeskripsi(resData.profile.deskripsi || '');
        setLogoUrl(resData.profile.logo_url || '');
      }

      if (resData.data_potensial) {
        setPenegakL(resData.data_potensial.jumlah_penegak_l);
        setPenegakP(resData.data_potensial.jumlah_penegak_p);
        setPandegaL(resData.data_potensial.jumlah_pandega_l);
        setPandegaP(resData.data_potensial.jumlah_pandega_p);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dkc_token');
    localStorage.removeItem('dkc_user');
    localStorage.removeItem('dkc_saka');
    navigate('/');
  };

  useEffect(() => {
    checkAuth();
    loadSakaData();
  }, []);

  const handleSavePotensial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saka || !user) return;
    setPotensialSaving(true);

    try {
      const res = await fetch('/api/data_potensial/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saka_id: saka.id,
          periode: '2026',
          jumlah_penegak_l: Number(penegakL),
          jumlah_penegak_p: Number(penegakP),
          jumlah_pandega_l: Number(pandegaL),
          jumlah_pandega_p: Number(pandegaP),
          updated_by: user.user_id
        })
      });

      if (res.ok) {
        alert('Data potensial keanggotaan SAKA berhasil diperbarui!');
        loadSakaData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPotensialSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'berita' | 'personalia' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await compressAndUploadFile(file, 'gambar');
      if (target === 'berita') {
        setBeritaGambar(url);
      } else if (target === 'personalia') {
        setNewPersonFoto(url);
      } else if (target === 'logo') {
        setLogoUrl(url);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah/kompres gambar. Coba lagi ya.');
    }
  };

  // Save/Update SAKA Profile Description & Logo
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saka) return;
    setProfileSaving(true);
    try {
      const res = await fetch('/api/saka_profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saka_id: saka.id,
          deskripsi,
          logo_url: logoUrl
        })
      });
      if (res.ok) {
        alert('Profil & Logo SAKA berhasil diperbarui!');
        loadSakaData();
      } else {
        alert('Gagal memperbarui profil');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui profil');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddPangkalan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saka || !newPangkalanNama) return;

    try {
      const res = await fetch('/api/pangkalan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saka_id: saka.id,
          nama_pangkalan: newPangkalanNama,
          jenis: newPangkalanJenis,
          status_aktif: true
        })
      });

      if (res.ok) {
        setNewPangkalanNama('');
        alert('Krida / Pangkalan SAKA berhasil ditambahkan!');
        loadSakaData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePangkalan = async (id: string) => {
    if (!confirm('Hapus Krida / Pangkalan ini?')) return;
    try {
      const res = await fetch('/api/pangkalan/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadSakaData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitBerita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beritaJudul || !beritaKonten || !saka || !user) return;
    setBeritaSaving(true);

    try {
      const res = await fetch('/api/berita/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: beritaJudul,
          konten: beritaKonten,
          gambar_url: beritaGambar || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
          author_id: user.user_id,
          author_name: `${saka.nama}`,
          saka_id: saka.id,
          saka_nama: saka.nama,
          status: 'pending',
          published_at: new Date().toISOString()
        })
      });

      if (res.ok) {
        setBeritaJudul('');
        setBeritaGambar('');
        setBeritaKonten('');
        alert('Pengajuan berita berhasil! Menunggu moderasi & persetujuan dari DKC.');
        loadSakaData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBeritaSaving(false);
    }
  };

  const handleDeleteBerita = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus warta kontribusi ini?')) return;
    try {
      const res = await fetch('/api/berita/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadSakaData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddLocalAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saka || !agendaNama || !agendaTempat) return;

    try {
      const res = await fetch('/api/agenda/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_kegiatan: agendaNama,
          tempat: agendaTempat,
          tanggal_mulai: agendaMulai,
          tanggal_selesai: agendaSelesai,
          estimasi_peserta: Number(agendaPeserta),
          jenis: 'mandiri',
          tingkat: 'kabupaten',
          saka_id: saka.id,
          saka_nama: saka.nama,
          status_publikasi: true,
          is_aktif_pendaftaran: false
        })
      });

      if (res.ok) {
        setAgendaNama('');
        setAgendaTempat('');
        setAgendaMulai('');
        setAgendaSelesai('');
        alert('Agenda SAKA berhasil didaftarkan!');
        loadSakaData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLocalAgenda = async (id: string) => {
    if (!confirm('Hapus agenda kegiatan lokal ini?')) return;
    try {
      const res = await fetch('/api/agenda/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadSakaData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPersonalia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saka || !newPersonNama || !newPersonJabatan) return;

    try {
      const res = await fetch('/api/personalia/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_type: 'saka',
          saka_id: saka.id,
          nama: newPersonNama,
          jabatan: newPersonJabatan,
          golongan: newPersonGolongan,
          foto_url: newPersonFoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300',
          urutan: personalia.length + 1
        })
      });

      if (res.ok) {
        setNewPersonNama('');
        setNewPersonJabatan('');
        setNewPersonFoto('');
        alert('Pengurus / Instruktur SAKA berhasil ditambahkan!');
        loadSakaData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePersonalia = async (id: string) => {
    if (!confirm('Hapus personalia pengurus ini?')) return;
    try {
      const res = await fetch('/api/personalia/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadSakaData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPassword) return;
    setPasswordSaving(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.user_id,
          newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || 'Sandi berhasil diubah');
        setOldPassword('');
        setNewPassword('');
      } else {
        alert(data.error || 'Gagal mengubah sandi');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPasswordSaving(false);
    }
  };

  if (!saka) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center font-mono text-xs">
        Memuat Otentikasi SAKA...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col lg:flex-row">
      
      {/* SIDEBAR NAVIGATION */}
      <div className="w-full lg:w-72 bg-gradient-to-b from-[#6E4B39] via-[#5C4033] to-[#3E2A20] text-white p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#4A3227] shrink-0">
        <div>
          {/* SAKA Profile Head */}
          <div className="flex items-center gap-3 border-b border-[#4A3227] pb-6 mb-6">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-orange border border-gray-150 shadow-inner">
              <Shield className="w-7 h-7 text-brand-orange" />
            </div>
            <div>
              <p className="text-[9px] text-brand-orange font-mono uppercase tracking-widest font-bold">PORTAL SAKA KABUPATEN</p>
              <h2 className="font-display font-black text-sm text-white tracking-tight leading-tight uppercase">{saka.nama}</h2>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5 text-xs font-mono">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold ${activeTab === 'dashboard' ? 'bg-brand-orange text-[#5C4033]' : 'hover:bg-white/5 text-gray-300'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard SAKA
            </button>

            <button 
              onClick={() => setActiveTab('potensial')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold ${activeTab === 'potensial' ? 'bg-brand-orange text-[#5C4033]' : 'hover:bg-white/5 text-gray-300'}`}
            >
              <BarChart2 className="w-4 h-4" /> Potensial Anggota
            </button>

            <button 
              onClick={() => setActiveTab('pangkalan')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold ${activeTab === 'pangkalan' ? 'bg-brand-orange text-[#5C4033]' : 'hover:bg-white/5 text-gray-300'}`}
            >
              <Users className="w-4 h-4" /> Krida / Pangkalan SAKA
            </button>

            <button 
              onClick={() => setActiveTab('berita')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold ${activeTab === 'berita' ? 'bg-brand-orange text-[#5C4033]' : 'hover:bg-white/5 text-gray-300'}`}
            >
              <FileText className="w-4 h-4" /> Kontribusi Warta
            </button>

            <button 
              onClick={() => setActiveTab('agenda')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold ${activeTab === 'agenda' ? 'bg-brand-orange text-[#5C4033]' : 'hover:bg-white/5 text-gray-300'}`}
            >
              <Calendar className="w-4 h-4" /> Kegiatan SAKA
            </button>

            <button 
              onClick={() => setActiveTab('personalia')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold ${activeTab === 'personalia' ? 'bg-brand-orange text-[#5C4033]' : 'hover:bg-white/5 text-gray-300'}`}
            >
              <Users className="w-4 h-4" /> Pamong & Instruktur
            </button>

            <button 
              onClick={() => setActiveTab('password')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-bold ${activeTab === 'password' ? 'bg-brand-orange text-[#5C4033]' : 'hover:bg-white/5 text-gray-300'}`}
            >
              <Key className="w-4 h-4" /> Keamanan Sandi
            </button>
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="pt-6 border-t border-[#4A3227] mt-6">
          <div className="text-[10px] text-gray-400 font-mono leading-relaxed mb-4">
            <p>Satyaku Kudarmakan,</p>
            <p>Darmaku Kubaktikan.</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full bg-[#E5DCD3]/10 hover:bg-brand-red text-white hover:text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
          >
            Keluar Portal
          </button>
        </div>
      </div>

      {/* PORTAL MAIN CONTENT CANVAS */}
      <main className="flex-1 p-6 sm:p-10 max-w-6xl overflow-y-auto">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-[#5C4033] tracking-tight">Selamat Datang di Portal Sinkron SAKA</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Kelola data potensial, keanggotaan Krida, dan kontribusi berita Saka tingkat Kabupaten Tasikmalaya.</p>
            </div>

            {/* Metrics cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
              <div className="bg-white border border-[#E5DCD3] rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Total Krida / Pangkalan</span>
                <h3 className="text-2xl font-black text-[#5C4033] mt-2">{pangkalan.length} Unit</h3>
                <p className="text-[9px] text-gray-400 mt-1">Terdaftar aktif</p>
              </div>

              <div className="bg-white border border-[#E5DCD3] rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Potensial Penegak</span>
                <h3 className="text-2xl font-black text-brand-green mt-2">{penegakL + penegakP} Orang</h3>
                <p className="text-[9px] text-gray-400 mt-1">L: {penegakL} | P: {penegakP}</p>
              </div>

              <div className="bg-white border border-[#E5DCD3] rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Berita Diajukan</span>
                <h3 className="text-2xl font-black text-brand-orange mt-2">{berita.length} Berita</h3>
                <p className="text-[9px] text-gray-400 mt-1">Pending: {berita.filter(b => b.status === 'pending').length}</p>
              </div>

              <div className="bg-white border border-[#E5DCD3] rounded-2xl p-5 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Agenda Terdaftar</span>
                <h3 className="text-2xl font-black text-blue-600 mt-2">{agenda.length} Kegiatan</h3>
                <p className="text-[9px] text-gray-400 mt-1">Rencana SAKA</p>
              </div>
            </div>

            {/* Hero SAKA Info Panel */}
            <div className="bg-gradient-to-br from-[#5C4033]/5 to-[#5C4033]/15 rounded-3xl p-6 sm:p-8 border border-[#E5DCD3] flex flex-col md:flex-row items-center gap-6">
              <div className="w-20 h-20 bg-brand-orange text-[#5C4033] rounded-3xl shrink-0 flex items-center justify-center font-black text-3xl shadow-md border-4 border-white">
                🏕️
              </div>
              <div>
                <span className="bg-[#5C4033] text-white text-[8px] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-wider">SAKA PROFIL EKSEKUTIF</span>
                <h3 className="text-lg font-extrabold text-[#5C4033] tracking-tight mt-1">{saka?.nama_saka || (saka && saka.nama)}</h3>
                <p className="text-xs text-gray-600 leading-relaxed mt-2 font-sans">
                  {deskripsi || (saka && (saka.deskripsi || "Satuan Karya Pramuka (SAKA) Tingkat Kabupaten Tasikmalaya yang mendidik kader kepramukaan dengan keterampilan profesional."))}
                </p>
              </div>
            </div>

            {/* SAKA PROFILE CONFIGURATION AND LOGO */}
            <div className="bg-white border border-[#E5DCD3] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b pb-3">
                <h3 className="font-extrabold text-base text-[#5C4033] tracking-tight">
                  Pengaturan Deskripsi & Logo SAKA
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Lengkapi profil pembinaan SAKA dan unggah logo resmi Satuan Karya Anda untuk ditampilkan di halaman publik.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold text-gray-500 uppercase">
                    Deskripsi / Profil SAKA
                  </label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-3.5 bg-gray-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#C2660B]/10 focus:border-[#C2660B] focus:bg-white transition-all duration-200 text-gray-800"
                    placeholder="Tuliskan visi, misi, krida-krida, sejarah, atau fokus kegiatan pembinaan SAKA Anda..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3">
                    <label className="block text-xs font-mono font-bold text-gray-500 uppercase">
                      Logo Resmi SAKA
                    </label>
                    
                    <div className="flex items-center gap-4">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Logo SAKA" 
                          className="w-20 h-20 object-contain rounded-2xl border border-gray-100 bg-gray-50 p-2 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-50 border border-dashed border-[#E5DCD3] rounded-2xl flex flex-col items-center justify-center text-gray-400 shrink-0">
                          <span className="text-[10px] font-mono">No Logo</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'logo')}
                          className="hidden"
                          id="saka-logo-upload-input"
                        />
                        <label
                          htmlFor="saka-logo-upload-input"
                          className="px-4 py-2 bg-brand-brown-dark hover:bg-brand-orange text-white rounded-xl text-xs font-bold font-mono tracking-wide cursor-pointer transition-all duration-200 inline-block"
                        >
                          Pilih File Logo
                        </label>
                        <p className="text-[10px] text-gray-400 leading-none">Format: PNG, JPG (Max 2MB)</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:border-l md:pl-6 space-y-1 text-xs text-gray-500">
                    <p className="font-bold text-[#5C4033]">Tampilan Publik:</p>
                    <p>Logo ini akan menghias halaman detail profil {saka?.nama_saka || 'SAKA'} tingkat Kabupaten Tasikmalaya yang aktif membina kader kepramukaan bidang keterampilan khusus.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex items-center gap-2 bg-brand-orange text-[#5C4033] hover:bg-brand-orange/95 font-mono font-bold text-xs py-3 px-6 rounded-xl uppercase tracking-wider transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{profileSaving ? 'Menyimpan...' : 'Simpan Profil & Logo'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* TAB 2: POTENSIAL DATA UPDATE */}
        {activeTab === 'potensial' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-[#5C4033] tracking-tight">Kuesioner Potensial Keanggotaan SAKA</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Laporkan data jumlah penegak dan pandega aktif yang tergabung dalam Krida SAKA Anda.</p>
            </div>

            <div className="bg-white border border-[#E5DCD3] rounded-3xl p-6 sm:p-8 shadow-sm max-w-xl">
              <form onSubmit={handleSavePotensial} className="space-y-6 text-xs font-mono">
                <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#E5DCD3] text-xs text-[#5C4033] font-bold">
                  Periode Pelaporan Aktif: Periode Tahunan 2026
                </div>

                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-[#5C4033] tracking-tight border-b pb-1 font-sans">1. Jumlah Golongan Penegak SAKA</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Penegak Putra (L)</label>
                      <input 
                        type="number" required value={penegakL} onChange={(e) => setPenegakL(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Penegak Putri (P)</label>
                      <input 
                        type="number" required value={penegakP} onChange={(e) => setPenegakP(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-extrabold text-sm text-[#5C4033] tracking-tight border-b pb-1 font-sans">2. Jumlah Golongan Pandega SAKA</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pandega Putra (L)</label>
                      <input 
                        type="number" required value={pandegaL} onChange={(e) => setPandegaL(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Pandega Putri (P)</label>
                      <input 
                        type="number" required value={pandegaP} onChange={(e) => setPandegaP(Number(e.target.value))}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" disabled={potensialSaving}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white font-extrabold px-6 py-3.5 rounded-xl uppercase tracking-wider shadow cursor-pointer transition-colors"
                >
                  {potensialSaving ? 'Menyimpan...' : 'Simpan Pembaruan Data'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: PANGKALAN / KRIDA CRUD */}
        {activeTab === 'pangkalan' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-[#5C4033] tracking-tight">Pangkalan & Krida SAKA</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Daftarkan dan hapus sub-pangkalan pendaftaran, Krida, atau ambalan khusus SAKA tingkat Kabupaten.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Form Add */}
              <div className="bg-white border border-[#E5DCD3] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-base text-[#5C4033] tracking-tight border-b pb-2">Tambah Krida Baru</h3>
                <form onSubmit={handleAddPangkalan} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Krida / Pangkalan</label>
                    <input 
                      type="text" required value={newPangkalanNama} onChange={(e) => setNewPangkalanNama(e.target.value)}
                      placeholder="Contoh: Krida Ketertiban Lantas" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Jenis Krida / Instansi</label>
                    <select 
                      value={newPangkalanJenis} onChange={(e) => setNewPangkalanJenis(e.target.value as any)}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    >
                      <option value="SMA">Saka Krida 1</option>
                      <option value="SMK">Saka Krida 2</option>
                      <option value="Perguruan Tinggi">Saka Krida Utama</option>
                      <option value="lainnya">Lainnya / Umum</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider shadow cursor-pointer"
                  >
                    Tambah Pangkalan
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="md:col-span-2 bg-white border border-[#E5DCD3] rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-[#5C4033] mb-4 border-b pb-2">Krida & Pangkalan Terdaftar</h3>
                {pangkalan.length > 0 ? (
                  <div className="space-y-3 font-mono text-xs">
                    {pangkalan.map(pk => (
                      <div key={pk.id} className="p-3 bg-[#FAF9F6] border border-[#E5DCD3] rounded-xl flex justify-between items-center">
                        <div>
                          <h4 className="font-bold text-[#5C4033]">{pk.nama_pangkalan}</h4>
                          <span className="text-[9px] bg-brand-orange/15 text-[#5C4033] px-1.5 py-0.5 rounded font-mono uppercase mt-1 inline-block font-extrabold">{pk.jenis}</span>
                        </div>
                        <button 
                          onClick={() => handleDeletePangkalan(pk.id)}
                          className="text-brand-red hover:bg-brand-red/10 p-2 rounded-xl transition-colors font-bold"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Belum ada Krida / Pangkalan yang terdaftar.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BERITA SUBMISSION */}
        {activeTab === 'berita' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-[#5C4033] tracking-tight">Kirim Kontribusi Warta SAKA</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Kirimkan rilis berita kegiatan, kemah bakti, atau latihan gabungan SAKA Anda untuk dipublikasikan di halaman depan DKC.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Form Add */}
              <div className="bg-white border border-[#E5DCD3] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-base text-[#5C4033] tracking-tight border-b pb-2">Ajukan Berita Baru</h3>
                <form onSubmit={handleSubmitBerita} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Judul Berita</label>
                    <input 
                      type="text" required value={beritaJudul} onChange={(e) => setBeritaJudul(e.target.value)}
                      placeholder="Contoh: Latihan Gabungan SAKA Bhayangkara" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Foto Sampul (Opsional)</label>
                    <input 
                      type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'berita')}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[10px] text-gray-500 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    />
                    {beritaGambar && (
                      <img src={beritaGambar} alt="preview" className="w-full h-32 object-cover rounded-xl mt-2 border border-slate-200/80" />
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Isi Konten Berita</label>
                    <textarea 
                      required rows={5} value={beritaKonten} onChange={(e) => setBeritaKonten(e.target.value)}
                      placeholder="Tuliskan berita lengkap..." className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-sans text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <button 
                    type="submit" disabled={beritaSaving}
                    className="w-full bg-brand-orange hover:bg-brand-orange/90 text-[#5C4033] font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider shadow cursor-pointer transition-colors"
                  >
                    {beritaSaving ? 'Mengirim...' : 'Kirim Pengajuan'}
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-2 bg-white border border-[#E5DCD3] rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-[#5C4033] mb-4 border-b pb-2">Daftar Kontribusi Berita</h3>
                {berita.length > 0 ? (
                  <div className="space-y-4 font-mono text-xs">
                    {berita.map(b => (
                      <div key={b.id} className="p-4 bg-[#FAF9F6] border border-[#E5DCD3] rounded-2xl flex flex-col sm:flex-row gap-4 justify-between">
                        <div className="flex gap-4">
                          <img src={b.gambar_url} alt="cover" className="w-20 h-20 object-cover rounded-xl shrink-0 border" />
                          <div>
                            <h4 className="font-bold text-sm text-[#5C4033] leading-tight">{b.judul}</h4>
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(b.published_at).toLocaleDateString('id-ID')}</p>
                            <span className={`inline-block text-[8px] font-black uppercase px-2 py-0.5 rounded mt-2 ${b.status === 'approved' ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' : b.status === 'rejected' ? 'bg-brand-red/10 text-brand-red border border-brand-red/20' : 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'}`}>
                              {b.status === 'approved' ? 'Disetujui & Terbit' : b.status === 'rejected' ? 'Ditolak' : 'Menunggu Moderasi'}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteBerita(b.id)}
                          className="text-brand-red hover:bg-brand-red/10 self-start p-2 rounded-xl"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Belum ada berita yang Anda ajukan.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LOCAL AGENDA */}
        {activeTab === 'agenda' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-[#5C4033] tracking-tight">Kelola Agenda Kegiatan SAKA</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Daftarkan kalender kegiatan internal SAKA tingkat Kabupaten Tasikmalaya yang aktif direncanakan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Form Add */}
              <div className="bg-white border border-[#E5DCD3] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-base text-[#5C4033] tracking-tight border-b pb-2">Daftarkan Rencana Agenda</h3>
                <form onSubmit={handleAddLocalAgenda} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Kegiatan SAKA</label>
                    <input 
                      type="text" required value={agendaNama} onChange={(e) => setAgendaNama(e.target.value)}
                      placeholder="Contoh: Kemah Bakti SAKA 2026" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Lokasi Kegiatan</label>
                    <input 
                      type="text" required value={agendaTempat} onChange={(e) => setAgendaTempat(e.target.value)}
                      placeholder="Contoh: Bumi Perkemahan Karangnunggal" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mulai</label>
                      <input 
                        type="date" required value={agendaMulai} onChange={(e) => setAgendaMulai(e.target.value)}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Selesai</label>
                      <input 
                        type="date" required value={agendaSelesai} onChange={(e) => setAgendaSelesai(e.target.value)}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estimasi Peserta</label>
                    <input 
                      type="number" required value={agendaPeserta} onChange={(e) => setAgendaPeserta(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider shadow cursor-pointer"
                  >
                    Daftarkan Agenda
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="md:col-span-2 bg-white border border-[#E5DCD3] rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-[#5C4033] mb-4 border-b pb-2">Kalender Rencana SAKA</h3>
                {agenda.length > 0 ? (
                  <div className="space-y-3 font-mono text-xs">
                    {agenda.map(ag => (
                      <div key={ag.id} className="p-4 bg-[#FAF9F6] border border-[#E5DCD3] rounded-2xl flex justify-between items-center">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#5C4033]">{ag.nama_kegiatan}</h4>
                          <p className="text-[10px] text-gray-500 mt-1">📍 {ag.tempat}</p>
                          <p className="text-[10px] text-gray-400 mt-1">📅 {ag.tanggal_mulai} s.d. {ag.tanggal_selesai} | 👥 {ag.estimasi_peserta} Anggota</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteLocalAgenda(ag.id)}
                          className="text-brand-red hover:bg-brand-red/10 p-2 rounded-xl"
                        >
                          Hapus
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Belum ada rencana kegiatan yang terdaftar.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PAMONG / INSTRUKTUR SAKA PERSONALIA */}
        {activeTab === 'personalia' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-[#5C4033] tracking-tight">Daftar Pamong & Instruktur SAKA</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Daftarkan dan kelola data personalia pamong SAKA, instruktur, pimpinan, maupun pengurus aktif tingkat Kabupaten.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Form Add */}
              <div className="bg-white border border-[#E5DCD3] rounded-3xl p-6 shadow-sm space-y-4">
                <h3 className="font-extrabold text-base text-[#5C4033] tracking-tight border-b pb-2">Tambah Personil Pengurus</h3>
                <form onSubmit={handleAddPersonalia} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Lengkap</label>
                    <input 
                      type="text" required value={newPersonNama} onChange={(e) => setNewPersonNama(e.target.value)}
                      placeholder="Contoh: Kak Budi Hartono" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Jabatan dalam SAKA</label>
                    <input 
                      type="text" required value={newPersonJabatan} onChange={(e) => setNewPersonJabatan(e.target.value)}
                      placeholder="Contoh: Pamong SAKA Bhayangkara" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tingkat Golongan</label>
                    <select 
                      value={newPersonGolongan} onChange={(e) => setNewPersonGolongan(e.target.value as any)}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    >
                      <option value="pembina">Pembina / Pamong</option>
                      <option value="pamong">Instruktur SAKA</option>
                      <option value="penegak">Dewan Saka (Penegak)</option>
                      <option value="pandega">Dewan Saka (Pandega)</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Foto Profil</label>
                    <input 
                      type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'personalia')}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2 text-[10px] text-gray-500 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                    />
                    {newPersonFoto && (
                      <img src={newPersonFoto} alt="preview" className="w-20 h-20 object-cover rounded-full mt-2 border border-slate-200/80 mx-auto" />
                    )}
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green/90 text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider shadow cursor-pointer"
                  >
                    Tambah Personalia
                  </button>
                </form>
              </div>

              {/* List */}
              <div className="lg:col-span-2 bg-white border border-[#E5DCD3] rounded-3xl p-6 shadow-sm">
                <h3 className="font-extrabold text-base text-[#5C4033] mb-4 border-b pb-2">Pamomg & Instruktur Aktif ({personalia.length})</h3>
                {personalia.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {personalia.map(p => (
                      <div key={p.id} className="p-3 bg-[#FAF9F6] border border-[#E5DCD3] rounded-2xl flex items-center gap-4 relative">
                        <img src={p.foto_url} alt="foto" className="w-14 h-14 object-cover rounded-full border shrink-0" />
                        <div className="font-sans">
                          <h4 className="font-bold text-xs text-[#5C4033] leading-tight">{p.nama}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">{p.jabatan}</p>
                          <span className="text-[8px] font-mono bg-brand-orange/15 text-[#5C4033] px-1.5 py-0.5 rounded uppercase mt-1.5 inline-block font-extrabold">{p.golongan}</span>
                        </div>
                        <button 
                          onClick={() => handleDeletePersonalia(p.id)}
                          className="absolute top-2 right-2 text-brand-red hover:bg-brand-red/10 p-1.5 rounded-lg text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">Belum ada pamong / instruktur yang terdaftar.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: PASSWORD MANAGEMENT */}
        {activeTab === 'password' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-[#5C4033] tracking-tight">Pengaturan Keamanan Sandi</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Perbarui kata sandi kredensial akun SAKA Anda demi keamanan database.</p>
            </div>

            <div className="bg-white border border-[#E5DCD3] rounded-3xl p-6 shadow-sm max-w-md">
              <form onSubmit={handleChangePassword} className="space-y-5 text-xs font-mono">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kata Sandi Baru</label>
                  <input 
                    type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan sandi baru..." className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#C2660B] focus:ring-2 focus:ring-[#C2660B]/10 focus:bg-white transition-all duration-200"
                  />
                </div>

                <button 
                  type="submit" disabled={passwordSaving}
                  className="bg-brand-orange hover:bg-brand-orange/90 text-white font-extrabold px-6 py-3.5 rounded-xl uppercase tracking-wider shadow cursor-pointer transition-colors"
                >
                  {passwordSaving ? 'Memproses...' : 'Simpan Sandi Baru'}
                </button>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
