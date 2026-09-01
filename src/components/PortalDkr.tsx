import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Search, Bell, Menu, BarChart2, FileText, Calendar, Users, Key, Save, Plus, Trash, Check, X, Building,
  Award, FileSpreadsheet, Edit3, Clock, ClipboardList, Printer, ChevronRight, ChevronLeft, AlertCircle, Copy
, PanelLeft } from 'lucide-react';
import { 
  Kecamatan, Personalia, Berita, AgendaKegiatan, 
  Pangkalan, DataPotensial, DkrProfile, LaporanKegiatan
} from '../types';
import { compressAndUploadFile } from '../utils/imageUpload';

import LaporanFormGenerator from './LaporanFormGenerator';
import LaporanPdfTemplate from './LaporanPdfTemplate';
import html2pdf from 'html2pdf.js';
import GreetingBanner from './GreetingBanner';

export default function PortalDkr() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'potensial' | 'pangkalan' | 'berita' | 'agenda' | 'personalia' | 'password' | 'laporan'>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [kecamatan, setKecamatan] = useState<Kecamatan | null>(null);

  // States
  const [profile, setProfile] = useState<DkrProfile | null>(null);
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

  // Form Inputs (Pangkalan CRUD)
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
  const [newPersonGolongan, setNewPersonGolongan] = useState<'penegak' | 'pandega' | 'pembina' | 'lainnya'>('penegak');
  const [newPersonFoto, setNewPersonFoto] = useState('');

  // Password Update
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  // Settings from admin
  const [showLaporanMenu, setShowLaporanMenu] = useState(true);

  // Laporan Kegiatan 02GP & 01 DIKLAT States
  const [laporanList, setLaporanList] = useState<LaporanKegiatan[]>([]);
  const [laporanLoading, setLaporanLoading] = useState(false);
  const [showLaporanForm, setShowLaporanForm] = useState(false);
  const [laporanJenis, setLaporanJenis] = useState<'02GP' | '01DIKLAT'>('02GP');
  const [laporanNamaKegiatan, setLaporanNamaKegiatan] = useState('');
  const [laporanTanggal, setLaporanTanggal] = useState('');
  const [laporanTempat, setLaporanTempat] = useState('');
  const [laporanDeskripsi, setLaporanDeskripsi] = useState('');
  const [laporanFileUrl, setLaporanFileUrl] = useState('');
  const [laporanEditingId, setLaporanEditingId] = useState<string | null>(null);
  const [laporanFormData, setLaporanFormData] = useState<any>(null);
  const [laporanSaving, setLaporanSaving] = useState(false);

  // Template Generator States
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [generatorJenis, setGeneratorJenis] = useState<'02GP' | '01DIKLAT'>('02GP');
  const [genNoSurat, setGenNoSurat] = useState('02/DKR-SGP/2026');
  const [genNamaKegiatan, setGenNamaKegiatan] = useState('');
  const [genWaktuPelaksanaan, setGenWaktuPelaksanaan] = useState('');
  const [genTempat, setGenTempat] = useState('');
  const [genKetuaDkr, setGenKetuaDkr] = useState('Kak Ahmad Ridwan');
  const [genSekretaris, setGenSekretaris] = useState('Kak Sarah Amalia');
  const [genHasilDeskripsi, setGenHasilDeskripsi] = useState('');
  const [genJumlahPeserta, setGenJumlahPeserta] = useState('45 orang');

  const checkAuth = () => {
    const token = localStorage.getItem('dkc_token');
    const userString = localStorage.getItem('dkc_user');
    const kecaString = localStorage.getItem('dkc_keca');
    
    if (!token || !userString) {
      window.location.hash = '/portal/login';
      return;
    }
    const userObj = JSON.parse(userString);
    if (userObj.role !== 'user') {
      window.location.hash = '/portal/admin';
      return;
    }

    setUser(userObj);
    if (kecaString) {
      setKecamatan(JSON.parse(kecaString));
    }
  };

  const loadDkrData = async () => {
    const kecaString = localStorage.getItem('dkc_keca');
    if (!kecaString) return;
    const kecaObj = JSON.parse(kecaString) as Kecamatan;

    try {
      // 1. Get detailed info of this kecamatan
      const res = await fetch(`/api/kecamatan/${kecaObj.slug}`);
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

      // Fetch Laporan Kegiatan
      setLaporanLoading(true);
      const lapRes = await fetch('/api/laporan_kegiatan');
      if (lapRes.ok) {
        const lapData = await lapRes.json();
        setLaporanList(lapData.filter((l: any) => l.kecamatan_id === kecaObj.id));
      }
      setLaporanLoading(false);

      // Fetch site settings
      const scRes = await fetch('/api/site_content');
      if (scRes.ok) {
        const scData = await scRes.json();
        const laporanMenu = scData.find((item: any) => item.section_key === 'laporan_menu_visibility');
        if (laporanMenu && laporanMenu.content) {
          try {
            const parsed = JSON.parse(laporanMenu.content);
            setShowLaporanMenu(parsed.show_menu !== false);
          } catch (e) {
            setShowLaporanMenu(true);
          }
        }
      }
      
    } catch (e) {
      console.error(e);
    } finally {
      setLaporanLoading(false);
    }
  };

  
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return alert('Password minimal 6 karakter');
    if (!user?.user_id) return alert('Gagal mengidentifikasi user. Silakan relogin.');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.user_id, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Password berhasil diubah!');
      setIsChangePasswordModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      alert('Gagal merubah password: ' + err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('dkc_token');
    localStorage.removeItem('dkc_user');
    localStorage.removeItem('dkc_keca');
    navigate('/');
  };

  useEffect(() => {
    checkAuth();
    loadDkrData();
  }, []);

  // Save/Update Potential T/D
  const handleSavePotensial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kecamatan || !user) return;
    setPotensialSaving(true);

    try {
      const res = await fetch('/api/data_potensial/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kecamatan_id: kecamatan.id,
          periode: '2026',
          jumlah_penegak_l: Number(penegakL),
          jumlah_penegak_p: Number(penegakP),
          jumlah_pandega_l: Number(pandegaL),
          jumlah_pandega_p: Number(pandegaP),
          updated_by: user.user_id
        })
      });

      if (res.ok) {
        alert('Data potensial keanggotaan berhasil diperbarui!');
        loadDkrData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPotensialSaving(false);
    }
  };

  const handleDownloadPdf = (laporan: LaporanKegiatan) => {
    const element = document.getElementById(`pdf-laporan-${laporan.id}`);
    if (!element) {
      alert("Template PDF belum dimuat.");
      return;
    }
    
    // Temporarily make it visible to render properly
    element.style.display = 'block';
    
    const opt = {
      margin:       0,
      filename:     `Laporan_${laporan.jenis_dokumen}_${laporan.nama_kegiatan.replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
    });
  };

  // Save / Update Laporan 02GP or 01DIKLAT
  const handleSaveLaporan = async (formData: any, isDraft?: boolean) => {
    if (!kecamatan) return;
    setLaporanSaving(true);
    try {
      const { kegiatanData, kesimpulan } = formData;
      const res = await fetch('/api/laporan_kegiatan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: laporanEditingId || undefined,
          kecamatan_id: kecamatan.id,
          kecamatan_nama: kecamatan.nama_kecamatan,
          jenis_dokumen: laporanJenis,
          nama_kegiatan: kegiatanData.nama || 'Laporan Kegiatan',
          tanggal_pelaksanaan: kegiatanData.waktu || new Date().toISOString().split('T')[0],
          tempat_pelaksanaan: kegiatanData.tempat || '-',
          deskripsi_singkat: kesimpulan || 'Deskripsi otomatis dari form',
          file_laporan_url: '', // We don't use this anymore, we generate PDF
          form_data: formData,
          status: isDraft ? 'draft' : (laporanEditingId ? undefined : 'pending') // if editing, keep current status unless draft. Wait, actually if not draft, make it pending if it was draft
        })
      });
      if (res.ok) {
        const resultData = await res.json();
        // If it was a new draft, we need to set the editing ID so the next steps update the same draft!
        if (isDraft && !laporanEditingId && resultData.data?.id) {
          setLaporanEditingId(resultData.data.id);
        }

        if (!isDraft) {
          alert(laporanEditingId ? 'Laporan berhasil direvisi/diperbarui!' : 'Laporan kegiatan berhasil dilaporkan!');
          setShowLaporanForm(false);
          setLaporanEditingId(null);
          loadDkrData();
        }
      } else {
        if (!isDraft) alert('Gagal menyimpan pelaporan kegiatan.');
        else throw new Error('Gagal auto-save');
      }
    } catch (err) {
      console.error(err);
      if (!isDraft) alert('Terjadi kesalahan.');
      else throw err; // Pass error up to form generator
    } finally {
      setLaporanSaving(false);
    }
  };

  const handleEditLaporan = (lap: LaporanKegiatan) => {
    setLaporanEditingId(lap.id);
    setLaporanJenis(lap.jenis_dokumen);
    setLaporanFormData(lap.form_data);
    setShowLaporanForm(true);
  };

  const handleLaporanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await compressAndUploadFile(file, 'dokumen');
      setLaporanFileUrl(url);
      alert('Berkas laporan berhasil diunggah!');
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah berkas.');
    }
  };

  // Kompres gambar di browser lalu upload ke Cloudinary
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

  // Save/Update DKR Profile Description & Logo
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kecamatan) return;
    setProfileSaving(true);
    try {
      const res = await fetch('/api/dkr_profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kecamatan_id: kecamatan.id,
          deskripsi,
          logo_url: logoUrl
        })
      });
      if (res.ok) {
        alert('Profil & Logo Ambacana berhasil diperbarui!');
        loadDkrData();
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

  // Add Pangkalan (CRUD)
  const handleAddPangkalan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kecamatan || !newPangkalanNama) return;

    try {
      const res = await fetch('/api/pangkalan/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kecamatan_id: kecamatan.id,
          nama_pangkalan: newPangkalanNama,
          jenis: newPangkalanJenis,
          status_aktif: true
        })
      });

      if (res.ok) {
        setNewPangkalanNama('');
        alert('Gugus Depan / Pangkalan berhasil ditambahkan!');
        loadDkrData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Pangkalan
  const handleDeletePangkalan = async (id: string) => {
    if (!confirm('Hapus pangkalan ini?')) return;
    try {
      const res = await fetch('/api/pangkalan/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadDkrData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Berita (Pending awaiting admin approval)
  const handleSubmitBerita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!beritaJudul || !beritaKonten || !kecamatan || !user) return;
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
          author_name: `DKR ${kecamatan.nama_kecamatan}`,
          kecamatan_id: kecamatan.id,
          kecamatan_nama: kecamatan.nama_kecamatan,
          status: 'pending',
          published_at: new Date().toISOString()
        })
      });

      if (res.ok) {
        setBeritaJudul('');
        setBeritaGambar('');
        setBeritaKonten('');
        alert('Pengajuan berita berhasil! Menunggu moderasi & persetujuan dari DKC.');
        loadDkrData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBeritaSaving(false);
    }
  };

  // Delete Berita local
  const handleDeleteBerita = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus warta kontribusi ini?')) return;
    try {
      const res = await fetch('/api/berita/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadDkrData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Local Agenda
  const handleAddLocalAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kecamatan || !agendaNama || !agendaTempat) return;

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
          kecamatan_id: kecamatan.id,
          kecamatan_nama: kecamatan.nama_kecamatan,
          status_publikasi: true,
          is_aktif_pendaftaran: false
        })
      });

      if (res.ok) {
        setAgendaNama('');
        setAgendaTempat('');
        setAgendaMulai('');
        setAgendaSelesai('');
        alert('Agenda DKR berhasil didaftarkan!');
        loadDkrData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete local agenda
  const handleDeleteLocalAgenda = async (id: string) => {
    if (!confirm('Hapus agenda kegiatan lokal ini?')) return;
    try {
      const res = await fetch('/api/agenda/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadDkrData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add Personalia (CRUD)
  const handleAddPersonalia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kecamatan || !newPersonNama || !newPersonJabatan) return;

    try {
      const res = await fetch('/api/personalia/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_type: 'dkr',
          kecamatan_id: kecamatan.id,
          nama: newPersonNama,
          jabatan: newPersonJabatan,
          golongan: newPersonGolongan,
          foto_url: newPersonFoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
        })
      });

      if (res.ok) {
        setNewPersonNama('');
        setNewPersonJabatan('');
        setNewPersonFoto('');
        alert('Struktur personalia berhasil diperbarui!');
        loadDkrData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete personalia
  const handleDeletePersonalia = async (id: string) => {
    if (!confirm('Hapus pengurus ini dari struktur DKR?')) return;
    try {
      const res = await fetch('/api/personalia/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadDkrData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update password local
  const handleUpdatePassword = async (e: React.FormEvent) => {
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

      if (res.ok) {
        alert('Password portal internal berhasil diperbarui!');
        setNewPassword('');
        setOldPassword('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPasswordSaving(false);
    }
  };

  
  const verifiedLaporanCount = laporanList.filter(l => l.status === 'diterima' || l.status === 'ditolak').length;
  const verifiedBeritaCount = beritaList.filter(b => b.status === 'approved' || b.status === 'rejected').length;
  const totalNotifs = verifiedLaporanCount + verifiedBeritaCount;

  return (
    <div className="min-h-screen bg-dash-canvas flex flex-col md:flex-row">
      
      {/* 1. TOP APP BAR (Mobile Only) */}
      <div className="md:hidden bg-white flex items-center justify-between px-4 py-3 shrink-0 sticky top-0 z-40 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-800 p-1">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
            <h2 className="font-extrabold text-[10px] sm:text-xs tracking-wider font-display text-gray-800 uppercase leading-tight mt-0.5">Ambacana Tatar Sukapura</h2>
          </div>
        </div>
        <div className="flex items-center gap-4 relative">
          <button onClick={() => { setIsNotifMenuOpen(!isNotifMenuOpen); setIsProfileMenuOpen(false); }} className="relative text-gray-500 p-1">
            <Bell className="w-5 h-5" />
            {totalNotifs > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
          </button>
          
          {isNotifMenuOpen && (
            <div className="absolute top-10 right-10 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-2">Notifikasi</h4>
              {totalNotifs === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">Belum ada notifikasi baru</p>
              ) : (
                <div className="space-y-2">
                  {verifiedLaporanCount > 0 && (
                    <button onClick={() => { setActiveTab('laporan'); setIsNotifMenuOpen(false); }} className="w-full text-left p-2 rounded-xl hover:bg-gray-50 text-xs text-brand-brown-dark flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                      <span><strong>{verifiedLaporanCount} Laporan</strong> Anda telah ditinjau</span>
                    </button>
                  )}
                  {verifiedBeritaCount > 0 && (
                    <button onClick={() => { setActiveTab('berita'); setIsNotifMenuOpen(false); }} className="w-full text-left p-2 rounded-xl hover:bg-gray-50 text-xs text-brand-brown-dark flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-green"></div>
                      <span><strong>{verifiedBeritaCount} Ajuan Warta</strong> telah ditinjau</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <button onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotifMenuOpen(false); }} className="w-8 h-8 rounded-full bg-brand-brown-dark flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer">
            DK
          </button>

          {isProfileMenuOpen && (
            <div className="absolute top-10 right-0 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
              <button onClick={() => { setIsChangePasswordModalOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-700">
                Pengaturan Akun
              </button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-red-50 text-xs font-bold text-brand-red">
                Keluar Sesi
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. SIDEBAR BACKDROP (Mobile Only) */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-[45] backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar (Desktop Only) */}
      <aside className={`hidden md:flex ${isSidebarCollapsed ? 'w-20' : 'w-64'} transition-all duration-300 bg-brand-brown-dark text-white border-r-4 border-brand-green flex-col shrink-0`}>
        <div className="p-5 border-b border-white/10 flex flex-col items-center relative">
          <div className={`flex items-center gap-3 w-full ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-brand-green p-1 shrink-0 shadow-sm overflow-hidden">
                {profile?.logo_url ? (
                  <img src={profile.logo_url} alt="Logo DKR" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl text-brand-green font-bold">⛺</span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <div className="text-left">
                  <h2 className="font-display font-extrabold text-xs tracking-wider text-brand-green uppercase leading-tight">Portal DKR Ranting</h2>
                  <p className="text-[10px] text-gray-300 font-mono mt-0.5 tracking-wider uppercase leading-none">Kec. {kecamatan?.nama_kecamatan || '...'}</p>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <button onClick={() => setIsSidebarCollapsed(true)} className="p-1 hover:bg-white/10 rounded-lg text-white">
                <PanelLeft className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {isSidebarCollapsed && (
            <button onClick={() => setIsSidebarCollapsed(false)} className="mt-4 p-2 hover:bg-white/10 rounded-lg text-white">
              <PanelLeft className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="p-4 space-y-1.5 flex-1 font-sans">
          {/* Kategori: RINGKASAN */}
          <p className={`px-4 pt-1 pb-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono ${isSidebarCollapsed ? 'text-center opacity-50' : ''}`}>
            {isSidebarCollapsed ? '•' : 'Ringkasan'}
          </p>
          <button 
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-[#4a3227] border-l-4 border-brand-green text-white font-bold' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-brand-green" /> Dashboard Ranting
          </button>

          {/* Kategori: DATA RANTING */}
          <p className={`px-4 pt-3 pb-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono ${isSidebarCollapsed ? 'text-center opacity-50' : ''}`}>
            {isSidebarCollapsed ? '•' : 'Data Ranting'}
          </p>
          <button 
            onClick={() => { setActiveTab('potensial'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'potensial' ? 'bg-[#4a3227] border-l-4 border-brand-green text-white font-bold' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-brand-orange" /> Anggota Potensial
          </button>

          <button 
            onClick={() => { setActiveTab('pangkalan'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'pangkalan' ? 'bg-[#4a3227] border-l-4 border-brand-green text-white font-bold' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <Building className="w-4 h-4 text-brand-teal" /> Gudep / Pangkalan
          </button>

          <button 
            onClick={() => { setActiveTab('personalia'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'personalia' ? 'bg-[#4a3227] border-l-4 border-brand-green text-white font-bold' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <Users className="w-4 h-4 text-brand-teal" /> Kelola Personalia
          </button>

          {/* Kategori: PUBLIKASI & KEGIATAN */}
          <p className={`px-4 pt-3 pb-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono ${isSidebarCollapsed ? 'text-center opacity-50' : ''}`}>
            {isSidebarCollapsed ? '•' : 'Publikasi &amp; Kegiatan'}
          </p>
          <button 
            onClick={() => { setActiveTab('berita'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'berita' ? 'bg-[#4a3227] border-l-4 border-brand-green text-white font-bold' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4 text-[#F9A825]" /> Ajukan Berita
          </button>

          <button 
            onClick={() => { setActiveTab('agenda'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'agenda' ? 'bg-[#4a3227] border-l-4 border-brand-green text-white font-bold' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <Calendar className="w-4 h-4 text-brand-green" /> Kegiatan Lokal
          </button>

          {/* Kategori: LAPORAN & AKUN */}
          <p className={`px-4 pt-3 pb-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono ${isSidebarCollapsed ? 'text-center opacity-50' : ''}`}>
            {isSidebarCollapsed ? '•' : 'Laporan &amp; Akun'}
          </p>
          {showLaporanMenu && (
            <button 
              onClick={() => { setActiveTab('laporan'); setIsMobileMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'laporan' ? 'bg-[#4a3227] border-l-4 border-brand-green text-white font-bold' : 'text-gray-300 hover:bg-white/5'
              }`}
            >
              <Award className="w-4 h-4 text-[#FF7043]" /> Laporan 02GP & 01 Diklat
            </button>
          )}

          <button 
            onClick={() => { setActiveTab('password'); setIsMobileMenuOpen(false); }}
            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'password' ? 'bg-[#4a3227] border-l-4 border-brand-green text-white font-bold' : 'text-gray-300 hover:bg-white/5'
            }`}
          >
            <Key className="w-4 h-4 text-brand-red" /> Ganti Password
          </button>
        </nav>

        {/* Desktop Logout Block */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button 
            title="Kembali ke Beranda"
            onClick={() => navigate('/')}
            className={`w-full bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] py-2 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-none ${isSidebarCollapsed ? 'px-0' : ''}`}
          >
            {isSidebarCollapsed ? <LayoutDashboard className="w-4 h-4" /> : 'Kembali ke Beranda'}
          </button>
          <button 
            title="Keluar Sesi"
            onClick={handleLogout}
            className={`w-full bg-brand-red/15 hover:bg-brand-red/25 text-brand-red border border-brand-red/30 font-bold text-[11px] py-2 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-none ${isSidebarCollapsed ? 'px-0' : ''}`}
          >
            {isSidebarCollapsed ? <Check className="w-4 h-4" /> : 'Keluar Sesi'}
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        
        <GreetingBanner name={user?.nama || 'Pengurus DKR'} role={user?.role} />

        {/* DKR TAB 1: DASHBOARD RANTING */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Kecamatan {kecamatan?.nama_kecamatan}</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Sistem informasi pendataan terpusat Gerakan Pramuka tingkat ranting.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase font-semibold">Total Anggota</span>
                  <h3 className="text-2xl font-black text-brand-brown-dark">
                    {(penegakL + penegakP + pandegaL + pandegaP)} <span className="text-xs font-normal text-gray-500">Jiwa</span>
                  </h3>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-teal/10 rounded-2xl flex items-center justify-center text-brand-teal shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase font-semibold">Pangkalan Gudep</span>
                  <h3 className="text-2xl font-black text-brand-brown-dark">
                    {pangkalan.length} <span className="text-xs font-normal text-gray-500">Unit</span>
                  </h3>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase font-semibold">Berita Anda</span>
                  <h3 className="text-2xl font-black text-brand-brown-dark">
                    {berita.length} <span className="text-xs font-normal text-gray-500">Artikel</span>
                  </h3>
                </div>
              </div>

            </div>

            {/* PROFILE CONFIGURATION AND AMBACANA LOGO */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b pb-3">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight">
                  Pengaturan Profil & Logo Ambalan / Racana (Ambacana)
                </h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">
                  Lengkapi deskripsi wilayah ranting dan unggah logo kebanggaan ambalan/racana Anda untuk ditampilkan di halaman publik.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-xs font-mono font-bold text-gray-500 uppercase">
                    Deskripsi DKR / Ranting
                  </label>
                  <textarea
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    rows={4}
                    className="w-full text-xs p-3.5 bg-gray-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#0E9F6E]/10 focus:border-[#0E9F6E] focus:bg-white transition-all duration-200 text-gray-800"
                    placeholder="Tuliskan deskripsi ringkas, sejarah, atau fokus kegiatan DKR Anda..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-3">
                    <label className="block text-xs font-mono font-bold text-gray-500 uppercase">
                      Logo Ambalan / Racana (Ambacana)
                    </label>
                    
                    <div className="flex items-center gap-4">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Logo Ambacana" 
                          className="w-20 h-20 object-contain rounded-2xl border border-gray-100 bg-gray-50 p-2 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 shrink-0">
                          <span className="text-[10px] font-mono">No Logo</span>
                        </div>
                      )}

                      <div className="space-y-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'logo')}
                          className="hidden"
                          id="logo-upload-input"
                        />
                        <label
                          htmlFor="logo-upload-input"
                          className="px-4 py-2 bg-brand-brown-dark hover:bg-brand-orange text-white rounded-xl text-xs font-bold font-mono tracking-wide cursor-pointer transition-all duration-200 inline-block"
                        >
                          Pilih File Logo
                        </label>
                        <p className="text-[10px] text-gray-400 leading-none">Format: PNG, JPG (Max 2MB)</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:border-l md:pl-6 space-y-1 text-xs text-gray-500">
                    <p className="font-bold text-brand-brown-dark">Tampilan Publik:</p>
                    <p>Logo ini akan menghias halaman detail profil DKR {kecamatan?.nama_kecamatan} dan memberikan identitas visual khas bagi ranting Anda.</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex items-center gap-2 bg-brand-green hover:bg-brand-green/90 text-white font-mono font-bold text-xs py-3 px-6 rounded-xl uppercase tracking-wider transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{profileSaving ? 'Menyimpan...' : 'Simpan Profil & Logo'}</span>
                  </button>
                </div>
              </form>
            </div>

          </div>
        )}

        {/* DKR TAB 2: DATA POTENSIAL T/D */}
        {activeTab === 'potensial' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Kuantitas & Potensi Anggota</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Lakukan pembaruan jumlah anggota pramuka Penegak dan Pandega ranting secara berkala.</p>
            </div>

            <div className="max-w-2xl bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="font-extrabold text-base text-brand-brown-dark mb-6 tracking-tight border-b pb-2">
                Pembaruan Jumlah Anggota (Periode 2026)
              </h3>

              <form onSubmit={handleSavePotensial} className="space-y-5 text-xs font-mono">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Penegak Laki-Laki (Jiwa)</label>
                    <input 
                      type="number" value={penegakL} onChange={(e) => setPenegakL(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Penegak Perempuan (Jiwa)</label>
                    <input 
                      type="number" value={penegakP} onChange={(e) => setPenegakP(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Pandega Laki-Laki (Jiwa)</label>
                    <input 
                      type="number" value={pandegaL} onChange={(e) => setPandegaL(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1.5">Pandega Perempuan (Jiwa)</label>
                    <input 
                      type="number" value={pandegaP} onChange={(e) => setPandegaP(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={potensialSaving}
                  className="bg-brand-brown-dark hover:bg-brand-brown-dark/95 text-white font-extrabold text-xs px-6 py-3 rounded-xl uppercase shadow"
                >
                  {potensialSaving ? 'Menyimpan...' : 'Simpan Kuantitas'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DKR TAB 3: GUGUS DEPAN / PANGKALAN CRUD */}
        {activeTab === 'pangkalan' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Gugus Depan / Pangkalan</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Daftarkan dan kelola list sekolah pangkalan Ambalan / Racana pramuka aktif di ranting.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Form Add */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-orange pb-2">
                  Daftarkan Pangkalan Baru
                </h3>

                <form onSubmit={handleAddPangkalan} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Gugus Depan / Sekolah</label>
                    <input 
                      type="text" required value={newPangkalanNama} onChange={(e) => setNewPangkalanNama(e.target.value)}
                      placeholder="Contoh: Ambalan SMA Negeri 1" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tingkat / Kategori</label>
                    <select 
                      value={newPangkalanJenis} onChange={(e) => setNewPangkalanJenis(e.target.value as any)}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    >
                      <option value="SMA">SMA</option>
                      <option value="SMK">SMK</option>
                      <option value="MA">MA</option>
                      <option value="Perguruan Tinggi">Perguruan Tinggi</option>
                      <option value="lainnya">Lainnya / Umum</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green/95 text-white font-extrabold text-xs py-3 rounded-xl uppercase shadow"
                  >
                    Daftarkan Gudep
                  </button>
                </form>
              </div>

              {/* List Pangkalan */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-extrabold text-base text-brand-brown-dark mb-4 tracking-tight border-b pb-2">
                  Daftar Pangkalan Gudep Terdaftar
                </h3>

                <div className="space-y-3">
                  {pangkalan.map((pk) => (
                    <div key={pk.id} className="p-3.5 bg-gray-50 border rounded-xl flex items-center justify-between font-mono text-xs text-gray-700">
                      <div>
                        <strong className="text-brand-brown-dark text-xs block">{pk.nama_pangkalan}</strong>
                        <span className="text-[10px] text-gray-400 uppercase">Kategori: {pk.jenis}</span>
                      </div>
                      <button 
                        onClick={() => handleDeletePangkalan(pk.id)}
                        className="text-brand-red hover:bg-brand-red/10 px-2 py-1 rounded"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* DKR TAB 4: AJUKAN BERITA */}
        {activeTab === 'berita' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Kontribusi Warta DKR</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Ajukan tulisan warta aktivitas ranting untuk dimoderasi dan diterbitkan oleh Admin DKC.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* Form News */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-orange pb-2">
                  Tulis Artikel Berita Baru
                </h3>

                <form onSubmit={handleSubmitBerita} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Judul Berita</label>
                    <input 
                      type="text" required value={beritaJudul} onChange={(e) => setBeritaJudul(e.target.value)}
                      placeholder="Judul warta kegiatan ranting" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Foto Kegiatan (Unggah Berkas)</label>
                    <input 
                      type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'berita')}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-[10px] text-gray-500 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                    {beritaGambar && <span className="text-[10px] text-brand-green font-bold">✓ Foto terkompresi berhasil diunggah!</span>}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Isi Narasi Warta</label>
                    <textarea 
                      required rows={5} value={beritaKonten} onChange={(e) => setBeritaKonten(e.target.value)}
                      placeholder="Ceritakan jalannya acara, rincian, dan hasil kegiatan..." className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs font-sans text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={beritaSaving}
                    className="w-full bg-brand-brown-dark hover:bg-brand-brown-dark/95 text-white font-extrabold text-xs py-3 rounded-xl uppercase shadow"
                  >
                    {beritaSaving ? 'Mengajukan...' : 'Ajukan ke DKC'}
                  </button>
                </form>
              </div>

              {/* Status List */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-extrabold text-base text-brand-brown-dark mb-4 tracking-tight border-b pb-2">
                  Status Pengajuan Berita Ranting Anda
                </h3>

                <div className="space-y-4">
                  {berita.map((b) => (
                    <div key={b.id} className="p-4 bg-gray-50 border rounded-2xl flex items-center justify-between font-mono text-xs">
                      <div>
                        <strong className="text-brand-brown-dark block leading-snug">{b.judul}</strong>
                        <span className="text-[9px] text-gray-400 mt-1 block">Diajukan: {new Date(b.published_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          b.status === 'approved' ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                        <button 
                          onClick={() => handleDeleteBerita(b.id)}
                          className="text-brand-red font-bold text-[10px]"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* DKR TAB 5: AGENDA KEGIATAN LOKAL */}
        {activeTab === 'agenda' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Kegiatan & Agenda Lokal</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Daftarkan agenda perkemahan, rapat, atau latihan kepemimpinan internal ranting.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Form Agenda */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-orange pb-2">
                  Daftarkan Kegiatan DKR
                </h3>

                <form onSubmit={handleAddLocalAgenda} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Kegiatan</label>
                    <input 
                      type="text" required value={agendaNama} onChange={(e) => setAgendaNama(e.target.value)}
                      placeholder="Contoh: Gladian Pemimpin Satuan" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tempat</label>
                    <input 
                      type="text" required value={agendaTempat} onChange={(e) => setAgendaTempat(e.target.value)}
                      placeholder="Aula Kwaran, dsb." className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tanggal Mulai</label>
                      <input 
                        type="date" required value={agendaMulai} onChange={(e) => setAgendaMulai(e.target.value)}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tanggal Selesai</label>
                      <input 
                        type="date" required value={agendaSelesai} onChange={(e) => setAgendaSelesai(e.target.value)}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estimasi Jumlah Peserta (Jiwa)</label>
                    <input 
                      type="number" required value={agendaPeserta} onChange={(e) => setAgendaPeserta(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green/95 text-white font-extrabold text-xs py-3 rounded-xl uppercase shadow"
                  >
                    Daftarkan Kegiatan
                  </button>
                </form>
              </div>

              {/* List Agenda */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-extrabold text-base text-brand-brown-dark mb-4 tracking-tight border-b pb-2">
                  Agenda DKR yang Terdaftar
                </h3>

                <div className="space-y-4">
                  {agenda.map((a) => (
                    <div key={a.id} className="p-4 bg-gray-50 border rounded-2xl flex justify-between items-center font-mono text-xs">
                      <div>
                        <strong className="text-brand-brown-dark block leading-snug">{a.nama_kegiatan}</strong>
                        <p className="text-[10px] text-gray-400 mt-1">📍 {a.tempat} | 📅 {a.tanggal_mulai} s.d {a.tanggal_selesai}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteLocalAgenda(a.id)}
                        className="text-brand-red font-bold text-[10px] ml-4 shrink-0"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* DKR TAB 6: KELOLA PERSONALIA */}
        {activeTab === 'personalia' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Kader & Personalia DKR</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Daftarkan pengurus DKR Ranting Anda untuk ditampilkan di landingpage publik.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Add form */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-orange pb-2">
                  Tambah Personil DKR
                </h3>

                <form onSubmit={handleAddPersonalia} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Pengurus</label>
                    <input 
                      type="text" required value={newPersonNama} onChange={(e) => setNewPersonNama(e.target.value)}
                      placeholder="Contoh: Kak Guntur" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Jabatan Struktur</label>
                    <input 
                      type="text" required value={newPersonJabatan} onChange={(e) => setNewPersonJabatan(e.target.value)}
                      placeholder="Contoh: Ketua DKR" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Golongan Kepramukaan</label>
                    <select 
                      value={newPersonGolongan} onChange={(e) => setNewPersonGolongan(e.target.value as any)}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    >
                      <option value="penegak">Penegak</option>
                      <option value="pandega">Pandega</option>
                      <option value="pembina">Pembina</option>
                      <option value="lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Foto Formal (Unggah File)</label>
                    <input 
                      type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'personalia')}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-[10px] text-gray-500 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green/95 text-white font-extrabold text-xs py-3 rounded-xl uppercase shadow"
                  >
                    Tambahkan Pengurus
                  </button>
                </form>
              </div>

              {/* List Personalia */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-extrabold text-base text-brand-brown-dark mb-4 tracking-tight border-b pb-2">
                  Personalia DKR Terdaftar
                </h3>

                <div className="space-y-4">
                  {personalia.map((p) => (
                    <div key={p.id} className="p-4 bg-gray-50 border rounded-2xl flex items-center justify-between font-mono text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-200 overflow-hidden shrink-0">
                          <img src={p.foto_url} alt={p.nama} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <strong className="text-brand-brown-dark block leading-none">{p.nama}</strong>
                          <span className="text-[10px] text-gray-400 mt-1 block">{p.jabatan} • {p.golongan}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeletePersonalia(p.id)}
                        className="text-brand-red font-bold text-[10px] ml-4"
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* DKR TAB 7: GANTI PASSWORD */}
        {activeTab === 'password' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Kombinasi Sandi</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Perbarui password login portal internal DKR Anda untuk keamanan.</p>
            </div>

            <div className="max-w-md bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="font-extrabold text-base text-brand-brown-dark mb-6 tracking-tight border-b pb-2">
                Ubah Password Portal Internal
              </h3>

              <form onSubmit={handleUpdatePassword} className="space-y-5 text-xs font-mono">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Password Lama</label>
                  <input 
                    type="password" required value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Password Baru</label>
                  <input 
                    type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="bg-brand-red hover:bg-brand-red/90 text-white font-extrabold text-xs px-6 py-3 rounded-xl uppercase shadow cursor-pointer"
                >
                  {passwordSaving ? 'Memperbarui...' : 'Ubah Password'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DKR TAB 8: LAPORAN KEGIATAN 02GP & 01 DIKLAT */}
        {activeTab === 'laporan' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight flex items-center gap-2">
                  <Award className="w-7 h-7 text-brand-orange" />
                  Pelaporan Kegiatan 02GP & 01 Diklat
                </h1>
                <p className="text-xs text-gray-500 font-mono mt-1">
                  Kirim pelaporan resmi kegiatan Pramuka Penegak/Pandega Kwarran Anda ke DKC Tasikmalaya.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setLaporanEditingId(null);
                    setLaporanFormData(null);
                    setShowLaporanForm(true);
                  }}
                  className="bg-[#D35400] hover:bg-[#E67E22] text-white font-extrabold font-mono text-xs px-4 py-2.5 rounded-xl shadow transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Laporan
                </button>
              </div>
            </div>

            {/* Stats Overview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center font-black">
                  {laporanList.filter(l => l.status === 'diterima').length}
                </div>
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase">Diterima</h4>
                  <p className="text-sm font-extrabold text-brand-brown-dark leading-none">
                    {laporanList.filter(l => l.status === 'diterima').reduce((acc, curr) => acc + (curr.point_bobot || 0), 0)} Pts
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-orange/10 text-brand-orange rounded-full flex items-center justify-center font-black">
                  {laporanList.filter(l => l.status === 'revisi').length}
                </div>
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase">Revisi</h4>
                  <p className="text-sm font-extrabold text-brand-brown-dark leading-none">Butuh Perbaikan</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-red/10 text-brand-red rounded-full flex items-center justify-center font-black">
                  {laporanList.filter(l => l.status === 'ditolak').length}
                </div>
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase">Ditolak</h4>
                  <p className="text-sm font-extrabold text-brand-brown-dark leading-none">Tidak Diterima</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black">
                  {laporanList.filter(l => l.status === 'pending').length}
                </div>
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase">Pending</h4>
                  <p className="text-sm font-extrabold text-brand-brown-dark leading-none">Diproses DKC</p>
                </div>
              </div>
            </div>

            {showLaporanForm && (
              <LaporanFormGenerator
                key={laporanEditingId || 'new'}
                jenisDokumen={laporanJenis}
                onJenisDokumenChange={setLaporanJenis}
                initialData={laporanFormData}
                onSave={handleSaveLaporan}
                onCancel={() => setShowLaporanForm(false)}
                isLoading={laporanSaving}
              />
            )}

            {/* List of Laporan */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-brand-green" />
                Daftar Pelaporan Kegiatan Kwarran
              </h3>

              {laporanLoading ? (
                <p className="text-xs font-mono text-gray-500 italic py-6">Memuat data pelaporan...</p>
              ) : laporanList.length > 0 ? (
                <div className="space-y-4">
                  {laporanList.map((lap) => (
                    <div
                      key={lap.id}
                      className="border border-slate-100 rounded-2xl p-5 hover:bg-slate-50/50 transition-all space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black font-mono uppercase px-2.5 py-1 rounded-md text-white ${
                            lap.jenis_dokumen === '02GP' ? 'bg-[#0E9F6E]' : 'bg-[#1e3c72]'
                          }`}>
                            {lap.jenis_dokumen}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            Dilaporkan pada: {new Date(lap.created_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>

                        {/* Status Label */}
                        <div>
                          {lap.status === 'diterima' && (
                            <div className="flex items-center gap-1.5 bg-[#0E9F6E]/15 text-[#0E9F6E] px-3 py-1 rounded-full text-[10px] font-bold font-mono">
                              <span className="w-2 h-2 rounded-full bg-[#0E9F6E] inline-block" />
                              <span>DITERIMA ({lap.point_bobot || 0} Pts)</span>
                            </div>
                          )}
                          {lap.status === 'ditolak' && (
                            <div className="flex items-center gap-1.5 bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold font-mono">
                              <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                              <span>DITOLAK</span>
                            </div>
                          )}
                          {lap.status === 'revisi' && (
                            <div className="flex items-center gap-1.5 bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold font-mono animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
                              <span>BUTUH REVISI</span>
                            </div>
                          )}
                          {lap.status === 'pending' && (
                            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold font-mono">
                              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                              <span>MENUNGGU VERIFIKASI</span>
                            </div>
                          )}
                          {lap.status === 'draft' && (
                            <div className="flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold font-mono">
                              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                              <span>DRAF (BELUM SELESAI)</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-slate-800 tracking-tight uppercase leading-snug">
                          {lap.nama_kegiatan || 'Draf Laporan Kegiatan'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-gray-500 font-mono">
                          <p>📅 Pelaksanaan: <strong>{lap.tanggal_pelaksanaan ? new Date(lap.tanggal_pelaksanaan).toLocaleDateString('id-ID') : '-'}</strong></p>
                          <p>📍 Tempat: <strong>{lap.tempat_pelaksanaan || '-'}</strong></p>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed pt-2">
                          {lap.deskripsi_singkat || 'Data deskripsi belum diisi...'}
                        </p>
                      </div>

                      {/* Catatan Admin / Penjelasan Penolakan / Revisi */}
                      {(lap.status === 'revisi' || lap.status === 'ditolak') && lap.catatan_admin && (
                        <div className="p-3 bg-brand-orange/5 border border-brand-orange/20 rounded-xl space-y-1">
                          <p className="text-[9px] font-black font-mono text-brand-orange uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            Catatan/Penjelasan dari DKC:
                          </p>
                          <p className="text-xs text-brand-brown-dark italic font-medium">
                            "{lap.catatan_admin}"
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-50 flex-wrap">
                        <div className="flex gap-2 items-center">
                          {lap.status !== 'draft' && (
                            <button
                              onClick={() => handleDownloadPdf(lap)}
                              className="bg-brand-green hover:bg-[#0E9F6E] text-white font-extrabold font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                            >
                              <FileText className="w-3.5 h-3.5" /> Download PDF
                            </button>
                          )}

                          {lap.file_laporan_url && (
                            <a
                              href={lap.file_laporan_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold font-mono text-brand-green hover:underline flex items-center gap-1.5 uppercase ml-2"
                            >
                              <FileSpreadsheet className="w-4 h-4 shrink-0" /> Lihat Lampiran
                            </a>
                          )}
                        </div>

                        {/* Revision Trigger */}
                        {lap.status === 'revisi' && (
                          <button
                            onClick={() => handleEditLaporan(lap)}
                            className="bg-brand-orange hover:bg-brand-orange/90 text-brand-brown-dark font-extrabold font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Revisi Laporan Sekarang
                          </button>
                        )}
                        
                        {lap.status === 'draft' && (
                          <button
                            onClick={() => handleEditLaporan(lap)}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-extrabold font-mono text-[10px] px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" /> Lanjutkan Pengisian
                          </button>
                        )}
                      </div>

                      {/* Hidden PDF Template Container */}
                      <div style={{ display: 'none' }}>
                        <LaporanPdfTemplate laporan={lap} profileDkr={dkrProfile} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-slate-50 border border-dashed rounded-2xl">
                  <Award className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-xs text-gray-500 font-mono italic">
                    Belum ada laporan kegiatan 02GP & 01 Diklat yang dilaporkan.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- OFFICIAL FORMAT GENERATOR MODAL/OVERLAY --- */}
        {showGeneratorModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl my-8">
              
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <Printer className="w-6 h-6 text-brand-green" />
                  <h3 className="font-extrabold text-base text-brand-brown-dark font-mono uppercase">
                    ⚜️ Generator Format Resmi Laporan Se-Kabupaten
                  </h3>
                </div>
                <button
                  onClick={() => setShowGeneratorModal(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                Fitur ini membantu Anda melakukan generate draf format laporan kegiatan <strong>02GP</strong> atau <strong>01 Diklat</strong> agar seragam dan memiliki struktur format resmi yang sama di seluruh 39 Kwartir Ranting se-Kabupaten Tasikmalaya. Isikan informasi di bawah, lalu salin/cetak format resmi di sebelah kanan.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Inputs Form */}
                <div className="lg:col-span-5 space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Jenis Dokumen</label>
                    <select
                      value={generatorJenis}
                      onChange={(e) => setGeneratorJenis(e.target.value as any)}
                      className="w-full bg-gray-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="02GP">02GP (Kegiatan Umum Ranting)</option>
                      <option value="01DIKLAT">01 DIKLAT (Pendidikan & Pelatihan)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Nomor Surat / Kode Laporan</label>
                    <input
                      type="text" value={genNoSurat} onChange={(e) => setGenNoSurat(e.target.value)}
                      className="w-full bg-gray-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Nama Kegiatan</label>
                    <input
                      type="text" value={genNamaKegiatan} onChange={(e) => setGenNamaKegiatan(e.target.value)}
                      placeholder="LT-II, Sidparran, atau LDK..."
                      className="w-full bg-gray-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Waktu</label>
                      <input
                        type="text" value={genWaktuPelaksanaan} onChange={(e) => setGenWaktuPelaksanaan(e.target.value)}
                        placeholder="e.g. 15 Juni 2026"
                        className="w-full bg-gray-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Tempat</label>
                      <input
                        type="text" value={genTempat} onChange={(e) => setGenTempat(e.target.value)}
                        placeholder="e.g. Aula Kwarran"
                        className="w-full bg-gray-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Ketua DKR</label>
                      <input
                        type="text" value={genKetuaDkr} onChange={(e) => setGenKetuaDkr(e.target.value)}
                        className="w-full bg-gray-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Sekretaris DKR</label>
                      <input
                        type="text" value={genSekretaris} onChange={(e) => setGenSekretaris(e.target.value)}
                        className="w-full bg-gray-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">Hasil Kegiatan & Rekomendasi</label>
                    <textarea
                      rows={3} value={genHasilDeskripsi} onChange={(e) => setGenHasilDeskripsi(e.target.value)}
                      placeholder="Jelaskan ringkasan output keputusan/rekomendasi..."
                      className="w-full bg-gray-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                {/* Document Preview Card */}
                <div className="lg:col-span-7 bg-amber-50/20 border-2 border-amber-800/10 rounded-2xl p-5 sm:p-6 shadow-inner space-y-5 max-h-[460px] overflow-y-auto">
                  <div className="text-center space-y-1.5 border-b-2 border-slate-800 pb-3">
                    <h4 className="font-extrabold text-[11px] uppercase tracking-wide text-slate-800 leading-none">
                      GERAKAN PRAMUKA KABUPATEN TASIKMALAYA
                    </h4>
                    <p className="font-extrabold text-xs text-brand-brown-dark leading-tight">
                      DEWAN KERJA PRAMUKA PENEGAK DAN PANDEGA PUTERA PUTERI
                    </p>
                    <p className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      KWARIR RANTING {kecamatan?.nama_kecamatan || '...'}
                    </p>
                  </div>

                  <div className="text-center">
                    <h5 className="font-black text-xs underline uppercase text-slate-800">
                      LAPORAN RESMI {generatorJenis === '02GP' ? 'KEGIATAN UMUM RANTING (KODE 02GP)' : 'PENDIDIKAN DAN PELATIHAN RANTING (KODE 01 DIKLAT)'}
                    </h5>
                    <p className="text-[9px] font-mono font-bold text-gray-500 mt-1">
                      Nomor Laporan: {genNoSurat}
                    </p>
                  </div>

                  <div className="space-y-2.5 text-[11px] text-slate-800 leading-relaxed font-sans">
                    <p>
                      <strong>I. PENDAHULUAN</strong><br />
                      Berdasarkan program kerja Dewan Kerja Ranting {kecamatan?.nama_kecamatan || '...'}, berikut dilaporkan pelaksanaan kegiatan resmi yang telah berjalan tertib dan lancar.
                    </p>

                    <p>
                      <strong>II. INFORMASI KEGIATAN</strong>
                    </p>
                    <table className="w-full text-[11px] border-collapse">
                      <tbody>
                        <tr>
                          <td className="w-32 py-0.5">1. Nama Kegiatan</td>
                          <td className="py-0.5">: <strong>{genNamaKegiatan || '...........................................'}</strong></td>
                        </tr>
                        <tr>
                          <td className="py-0.5">2. Waktu Pelaksanaan</td>
                          <td className="py-0.5">: {genWaktuPelaksanaan || '...........................................'}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5">3. Tempat Kegiatan</td>
                          <td className="py-0.5">: {genTempat || '...........................................'}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5">4. Jumlah Peserta</td>
                          <td className="py-0.5">: {genJumlahPeserta || '...........................................'}</td>
                        </tr>
                        <tr>
                          <td className="py-0.5">5. Kategori Laporan</td>
                          <td className="py-0.5">: Formatif Resmi Kabupaten Tasikmalaya - Kode {generatorJenis}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p>
                      <strong>III. HASIL KEGIATAN & OUTPUT</strong><br />
                      {genHasilDeskripsi || 'Dilaporkan hasil pelaksanaan program kerja ranting berjalan dengan sukses dengan capaian output koordinasi pembinaan Penegak dan Pandega Kwartir Ranting.'}
                    </p>

                    <p>
                      <strong>IV. PENUTUP</strong><br />
                      Demikian laporan resmi {generatorJenis} ini dibuat secara sadar, jujur, dan bertanggung jawab agar dapat dipergunakan sebagai bahan evaluasi kegiatan Pramuka Penegak dan Pandega di Kwartir Cabang Kabupaten Tasikmalaya.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 text-center text-[10px] pt-4 border-t border-slate-100 font-sans">
                    <div>
                      <p className="text-gray-400">Mengetahui,</p>
                      <p className="font-bold text-slate-800">Ketua DKR</p>
                      <p className="h-12"></p>
                      <p className="font-extrabold underline text-slate-900">{genKetuaDkr}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Dibuat oleh,</p>
                      <p className="font-bold text-slate-800">Sekretaris DKR</p>
                      <p className="h-12"></p>
                      <p className="font-extrabold underline text-slate-900">{genSekretaris}</p>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    const textContent = `GERAKAN PRAMUKA KABUPATEN TASIKMALAYA\nDEWAN KERJA RANTING ${kecamatan?.nama_kecamatan?.toUpperCase()}\n\nLAPORAN RESMI KODE ${generatorJenis}\nNomor: ${genNoSurat}\n\nI. PENDAHULUAN\nDilaporkan dengan hormat pelaksanaan kegiatan oleh DKR.\n\nII. INFORMASI KEGIATAN\n1. Kegiatan: ${genNamaKegiatan}\n2. Waktu: ${genWaktuPelaksanaan}\n3. Tempat: ${genTempat}\n4. Peserta: ${genJumlahPeserta}\n\nIII. HASIL KEGIATAN\n${genHasilDeskripsi}\n\nKetua DKR: ${genKetuaDkr}\nSekretaris DKR: ${genSekretaris}`;
                    navigator.clipboard.writeText(textContent);
                    alert('Format teks resmi berhasil disalin ke clipboard! Silakan paste ke dokumen pengolah kata Anda.');
                  }}
                  className="px-5 py-2.5 bg-brand-green hover:bg-brand-green/90 text-white font-extrabold font-mono text-xs rounded-xl shadow cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-4 h-4" /> Salin Teks Format
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold font-mono text-xs rounded-xl shadow cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-4 h-4" /> Cetak Format
                </button>
                <button
                  onClick={() => setShowGeneratorModal(false)}
                  className="px-5 py-2.5 border border-slate-200 text-gray-500 font-extrabold font-mono text-xs rounded-xl hover:bg-gray-50 cursor-pointer"
                >
                  Tutup
                </button>
              </div>

            </div>
          </div>
        )}

      </main>

    
      
      {/* Change Password Modal */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsChangePasswordModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-black text-brand-brown-dark mb-1">Ganti Password</h3>
            <p className="text-xs text-gray-500 mb-6">Masukkan password baru untuk akun Anda.</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Password Baru</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-brown-dark focus:ring-2 focus:ring-brand-brown-dark/20"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsChangePasswordModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-brown-dark hover:bg-brand-brown-dark/90 shadow-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. BOTTOM NAVIGATION (Mobile Only) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40 px-6 py-2 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] rounded-t-3xl">
        <div className="flex justify-between items-center relative mt-2">
          
          <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'dashboard' ? 'text-brand-brown-dark' : 'text-gray-400'}`}>
            <LayoutDashboard className={`${activeTab === 'dashboard' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className="text-[10px] font-bold">Beranda</span>
          </button>
          
          <button onClick={() => setActiveTab('berita')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'berita' ? 'text-brand-brown-dark' : 'text-gray-400'}`}>
            <FileText className={`${activeTab === 'berita' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className="text-[10px] font-bold">Warta</span>
          </button>
          
          {/* Floating Center Button */}
          <div className="relative -top-8 flex flex-col items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-14 h-14 bg-brand-brown-dark rounded-full flex items-center justify-center text-white shadow-xl border-4 border-white/80 transform hover:scale-105 active:scale-95 transition-all"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-[10px] font-bold text-brand-brown-dark mt-1.5">Menu</span>
          </div>

          <button onClick={() => setActiveTab('agenda')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'agenda' ? 'text-brand-brown-dark' : 'text-gray-400'}`}>
            <Calendar className={`${activeTab === 'agenda' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className="text-[10px] font-bold">Kegiatan</span>
          </button>
          
          <button onClick={() => setActiveTab('laporan')} className={`flex flex-col items-center gap-1.5 ${activeTab === 'laporan' ? 'text-brand-brown-dark' : 'text-gray-400'}`}>
            <Award className={`${activeTab === 'laporan' ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className="text-[10px] font-bold">Laporan</span>
          </button>
          
        </div>
      </div>
      
      </div>
  );
}
