import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, Users, Building, FileText, Calendar, Plus, Trash, Check, X,
  Save, Edit, Lock, Eye, AlertCircle, ToggleLeft, ToggleRight, LayoutDashboard, Settings,
  RefreshCw, Palette, Upload, Award, ClipboardList, Printer, Clock, ChevronRight, Download
} from 'lucide-react';
import { 
  Kecamatan, Personalia, Berita, AgendaKegiatan, 
  Informasi, SiteContent, FormKegiatanConfig, DataPotensial, Profile, Saka, LaporanKegiatan 
} from '../types';
import { compressAndUploadFile, compressAndUploadToUploadcare } from '../utils/imageUpload';
import SiteContentEditor from './SiteContentEditor';
import GreetingBanner from './GreetingBanner';

export default function PortalAdmin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'potensial_dkr' | 'potensial_saka' | 'berita' | 'agenda' | 'personalia' | 'users_dkr' | 'users_saka' | 'konten' | 'laporan' | 'informasi'>('dashboard');

  // DB States
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
  const [sakaList, setSakaList] = useState<Saka[]>([]);
  const [dataPotensial, setDataPotensial] = useState<DataPotensial[]>([]);
  const [beritaList, setBeritaList] = useState<Berita[]>([]);
  const [agendaList, setAgendaList] = useState<AgendaKegiatan[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent[]>([]);
  const [pangkalanList, setPangkalanList] = useState<any[]>([]);
  const [personaliaList, setPersonaliaList] = useState<Personalia[]>([]);
  const [informasiList, setInformasiList] = useState<Informasi[]>([]);

  // Form Inputs (Pusat Unduhan Berkas / Informasi CRUD)
  const [infoJudul, setInfoJudul] = useState('');
  const [infoDeskripsi, setInfoDeskripsi] = useState('');
  const [infoTipe, setInfoTipe] = useState<'gambar' | 'dokumen'>('dokumen');
  const [infoFileUrl, setInfoFileUrl] = useState('');
  const [infoUploading, setInfoUploading] = useState(false);
  const [infoSaving, setInfoSaving] = useState(false);

  // Form Inputs (Personalia DKC CRUD)
  const [newPersonNama, setNewPersonNama] = useState('');
  const [newPersonJabatan, setNewPersonJabatan] = useState('');
  const [newPersonGolongan, setNewPersonGolongan] = useState<'penegak' | 'pandega' | 'pembina' | 'lainnya'>('pandega');
  const [newPersonFoto, setNewPersonFoto] = useState('');
  const [personaliaSaving, setPersonaliaSaving] = useState(false);

  // Laporan States
  const [laporanList, setLaporanList] = useState<LaporanKegiatan[]>([]);
  const [laporanLoading, setLaporanLoading] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processingLaporan, setProcessingLaporan] = useState<LaporanKegiatan | null>(null);
  const [processStatus, setProcessStatus] = useState<'diterima' | 'ditolak' | 'revisi'>('diterima');
  const [processCatatan, setProcessCatatan] = useState('');
  const [processPointBobot, setProcessPointBobot] = useState(10);
  const [processSaving, setProcessSaving] = useState(false);
  
  // New sub-tab state, expanded detail state, and standings toggle
  const [laporanSubTab, setLaporanSubTab] = useState<'pending' | 'verified'>('pending');
  const [expandedLaporanId, setExpandedLaporanId] = useState<string | null>(null);
  const [showKlasemen, setShowKlasemen] = useState<boolean>(true);
  const [showLaporanMenu, setShowLaporanMenu] = useState<boolean>(true);

  // Editor states (News)
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');
  const [newsSaving, setNewsSaving] = useState(false);

  // Editor states (Agenda)
  const [agendaName, setAgendaName] = useState('');
  const [agendaPlace, setAgendaPlace] = useState('');
  const [agendaStart, setAgendaStart] = useState('');
  const [agendaEnd, setAgendaEnd] = useState('');
  const [agendaEst, setAgendaEst] = useState(100);
  const [agendaType, setAgendaType] = useState<'mandiri' | 'partisipasi'>('mandiri');
  const [agendaLevel, setAgendaLevel] = useState<'kabupaten' | 'provinsi' | 'nasional' | 'internasional'>('kabupaten');
  const [agendaIsDateDecided, setAgendaIsDateDecided] = useState(true);
  const [agendaBulanRencana, setAgendaBulanRencana] = useState('2026-08');
  const [agendaSaving, setAgendaSaving] = useState(false);

  // Form Builder state
  const [selectedBuilderAgenda, setSelectedBuilderAgenda] = useState<AgendaKegiatan | null>(null);
  const [formFields, setFormFields] = useState<any[]>([]);
  const [pendaftaranTipe, setPendaftaranTipe] = useState<'mandiri' | 'kolektif' | 'keduanya'>('keduanya');
  const [registrants, setRegistrants] = useState<any[]>([]);

  // User management states
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newKecaId, setNewKecaId] = useState('');
  const [newSakaId, setNewSakaId] = useState('');
  const [newNama, setNewNama] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'saka'>('user');

  // Landing page editable states
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroLead, setHeroLead] = useState('');
  const [heroCta, setHeroCta] = useState('');
  const [heroBadge, setHeroBadge] = useState('');
  const [heroBgImageUrl, setHeroBgImageUrl] = useState('');
  const [heroBgOpacity, setHeroBgOpacity] = useState(0.4);

  // Theme customizer states
  const [brandOrange, setBrandOrange] = useState('#F5A623');
  const [brandGreen, setBrandGreen] = useState('#4CAF50');
  const [brandBrownDark, setBrandBrownDark] = useState('#5C4033');
  const [brandBrownMid, setBrandBrownMid] = useState('#8B7355');
  const [extractedColors, setExtractedColors] = useState<string[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);

  const checkAuth = () => {
    const token = localStorage.getItem('dkc_token');
    const userString = localStorage.getItem('dkc_user');
    if (!token || !userString) {
      navigate('/portal/login');
      return;
    }
    const userObj = JSON.parse(userString);
    if (userObj.role !== 'admin') {
      navigate('/portal/dkr');
    }
  };

  const loadData = async () => {
    try {
      const keca = await fetch('/api/kecamatan').then(r => r.json());
      setKecamatanList(keca);

      const saka = await fetch('/api/saka').then(r => r.json());
      setSakaList(saka);

      const pot = await fetch('/api/data_potensial').then(r => r.json());
      setDataPotensial(pot);

      const news = await fetch('/api/berita').then(r => r.json());
      setBeritaList(news);

      const age = await fetch('/api/agenda').then(r => r.json());
      setAgendaList(age);

      const users = await fetch('/api/users').then(r => r.json());
      setUserList(users);

      const info = await fetch('/api/informasi').then(r => r.json());
      setInformasiList(info);

      const sc = await fetch('/api/site_content').then(r => r.json());
      setSiteContent(sc);
      const hero = sc.find((item: any) => item.section_key === 'hero');
      if (hero) {
        setHeroTitle(hero.content.title);
        setHeroSubtitle(hero.content.subtitle);
        setHeroLead(hero.content.lead);
        setHeroCta(hero.content.cta_text);
        setHeroBadge(hero.content.badge_text);
        setHeroBgImageUrl(hero.content.bg_image_url || 'https://media.suara.com/pictures/970x544/2023/08/14/79829-hari-pramuka-raimuna-nasional-xii.jpg');
        setHeroBgOpacity(hero.content.bg_opacity !== undefined ? Number(hero.content.bg_opacity) : 0.4);
      }

      const theme = sc.find((item: any) => item.section_key === 'theme');
      if (theme && theme.content) {
        setBrandOrange(theme.content.brandOrange || '#F5A623');
        setBrandGreen(theme.content.brandGreen || '#4CAF50');
        setBrandBrownDark(theme.content.brandBrownDark || '#5C4033');
        setBrandBrownMid(theme.content.brandBrownMid || '#8B7355');
      }

      const klasemen = sc.find((item: any) => item.section_key === 'klasemen');
      if (klasemen && klasemen.content) {
        setShowKlasemen(klasemen.content.show_klasemen !== false);
      } else {
        setShowKlasemen(true);
      }

      const laporanMenu = sc.find((item: any) => item.section_key === 'laporan_menu_visibility');
      if (laporanMenu && laporanMenu.content) {
        setShowLaporanMenu(laporanMenu.content.show_menu !== false);
      } else {
        setShowLaporanMenu(true);
      }

      const pangkalan = await fetch('/api/pangkalan').then(r => r.json());
      setPangkalanList(pangkalan);

      const personel = await fetch('/api/personalia?owner_type=dkc').then(r => r.json());
      setPersonaliaList(personel || []);

      // Fetch Laporan Kegiatan
      setLaporanLoading(true);
      const lap = await fetch('/api/laporan_kegiatan').then(r => r.json());
      setLaporanList(lap || []);
      setLaporanLoading(false);
    } catch (e) {
      console.error(e);
      setLaporanLoading(false);
    }
  };

  // Process / Approve / Reject Laporan Kegiatan
  const handleProcessLaporan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingLaporan) return;
    setProcessSaving(true);
    try {
      const res = await fetch('/api/laporan_kegiatan/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: processingLaporan.id,
          status: processStatus,
          catatan_admin: processCatatan,
          point_bobot: processStatus === 'diterima' ? Number(processPointBobot) : 0
        })
      });
      if (res.ok) {
        alert('Status pelaporan kegiatan berhasil diperbarui!');
        setShowProcessModal(false);
        setProcessingLaporan(null);
        setProcessCatatan('');
        loadData();
      } else {
        alert('Gagal memproses pelaporan kegiatan.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessSaving(false);
    }
  };

  // Toggle Klasemen Landingpage
  const handleToggleKlasemen = async (val: boolean) => {
    try {
      const res = await fetch('/api/site_content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: 'klasemen',
          content: { show_klasemen: val }
        })
      });
      if (res.ok) {
        setShowKlasemen(val);
        const updatedSc = await fetch('/api/site_content').then(r => r.json());
        setSiteContent(updatedSc);
      } else {
        alert('Gagal memperbarui pengaturan klasemen.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Menu Laporan DKR
  const handleToggleLaporanMenu = async (val: boolean) => {
    try {
      const res = await fetch('/api/site_content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: 'laporan_menu_visibility',
          content: { show_menu: val }
        })
      });
      if (res.ok) {
        setShowLaporanMenu(val);
        const updatedSc = await fetch('/api/site_content').then(r => r.json());
        setSiteContent(updatedSc);
      } else {
        alert('Gagal memperbarui pengaturan visibilitas menu laporan.');
      }
    } catch (err) {
      console.error(err);
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
    loadData();
  }, []);

  // News Approval
  const handleApproveNews = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch('/api/berita/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create News DKC
  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsSaving(true);
    const userString = localStorage.getItem('dkc_user');
    const user = userString ? JSON.parse(userString) : null;

    try {
      const res = await fetch('/api/berita/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: newsTitle,
          konten: newsContent,
          gambar_url: newsImage || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
          author_id: user?.id || 'admin',
          author_name: user?.nama || 'Admin DKC',
          status: 'approved',
          published_at: new Date().toISOString()
        })
      });

      if (res.ok) {
        setNewsTitle('');
        setNewsContent('');
        setNewsImage('');
        alert('Berita resmi DKC berhasil diterbitkan!');
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setNewsSaving(false);
    }
  };

  // Kompres gambar di browser lalu upload ke Cloudinary (tidak ada lagi paste link manual)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'news' | 'informasi' | 'hero' | 'personalia') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await compressAndUploadFile(file, 'gambar');
      if (target === 'news') {
        setNewsImage(url);
      } else if (target === 'hero') {
        setHeroBgImageUrl(url);
      } else if (target === 'personalia') {
        setNewPersonFoto(url);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah/kompres gambar. Coba lagi ya bro.');
    }
  };

  // Upload berkas Pusat Unduhan Berkas ke Uploadcare (bukan Cloudinary), link disimpan lewat /api/informasi/save ke Supabase
  const handleInformasiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInfoUploading(true);
    try {
      const url = await compressAndUploadToUploadcare(file);
      setInfoFileUrl(url);
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah berkas ke Uploadcare. Coba lagi ya bro.');
    } finally {
      setInfoUploading(false);
    }
  };

  const handleSaveInformasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoJudul || !infoFileUrl) {
      alert('Judul dan berkas wajib diisi.');
      return;
    }
    setInfoSaving(true);
    try {
      const res = await fetch('/api/informasi/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: infoJudul,
          deskripsi: infoDeskripsi,
          tipe: infoTipe,
          file_url: infoFileUrl
        })
      });
      if (res.ok) {
        setInfoJudul('');
        setInfoDeskripsi('');
        setInfoTipe('dokumen');
        setInfoFileUrl('');
        alert('Berkas berhasil ditambahkan ke Pusat Unduhan Berkas!');
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInfoSaving(false);
    }
  };

  const handleDeleteInformasi = async (id: string) => {
    if (!confirm('Hapus berkas ini dari Pusat Unduhan Berkas?')) return;
    try {
      const res = await fetch('/api/informasi/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPersonalia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonNama || !newPersonJabatan) return;
    setPersonaliaSaving(true);
    try {
      const res = await fetch('/api/personalia/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_type: 'dkc',
          nama: newPersonNama,
          jabatan: newPersonJabatan,
          golongan: newPersonGolongan,
          foto_url: newPersonFoto || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400'
        })
      });
      if (res.ok) {
        setNewPersonNama('');
        setNewPersonJabatan('');
        setNewPersonFoto('');
        alert('Struktur Pengurus DKC berhasil diperbarui!');
        loadData();
      } else {
        alert('Gagal menyimpan data personalia.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPersonaliaSaving(false);
    }
  };

  // Delete Personalia DKC
  const handleDeletePersonalia = async (id: string) => {
    if (!confirm('Hapus pengurus ini dari struktur DKC?')) return;
    try {
      const res = await fetch('/api/personalia/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create Agenda
  const handleSaveAgenda = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgendaSaving(true);

    try {
      const startVal = agendaIsDateDecided ? agendaStart : `${agendaBulanRencana}-01`;
      const endVal = agendaIsDateDecided ? agendaEnd : `${agendaBulanRencana}-01`;

      const res = await fetch('/api/agenda/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama_kegiatan: agendaName,
          tempat: agendaPlace,
          tanggal_mulai: startVal,
          tanggal_selesai: endVal,
          estimasi_peserta: agendaEst,
          jenis: agendaType,
          tingkat: agendaLevel,
          status_publikasi: true,
          is_aktif_pendaftaran: false,
          is_tanggal_diputuskan: agendaIsDateDecided,
          bulan_rencana: agendaBulanRencana
        })
      });

      if (res.ok) {
        setAgendaName('');
        setAgendaPlace('');
        setAgendaStart('');
        setAgendaEnd('');
        setAgendaEst(100);
        setAgendaIsDateDecided(true);
        alert('Agenda kegiatan berhasil ditambahkan!');
        loadData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAgendaSaving(false);
    }
  };

  // Delete Agenda
  const handleDeleteAgenda = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus agenda kegiatan ini? Semua data pendaftaran terkait juga akan dihapus.')) return;
    try {
      const res = await fetch('/api/agenda/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Form Config Open Builder
  const handleOpenFormBuilder = async (agenda: AgendaKegiatan) => {
    setSelectedBuilderAgenda(agenda);
    try {
      const configRes = await fetch(`/api/agenda/${agenda.id}/config`);
      const config = await configRes.json();
      if (config) {
        setFormFields(config.form_schema || []);
        setPendaftaranTipe(config.tipe_pendaftaran || 'keduanya');
      } else {
        setFormFields([
          { id: 'f1', label: 'Nama Lengkap Pendaftar', type: 'text', required: true },
          { id: 'f2', label: 'Asal Gugus Depan', type: 'text', required: true }
        ]);
        setPendaftaranTipe('keduanya');
      }

      // Load registered participants
      const registrantsRes = await fetch(`/api/agenda/${agenda.id}/registrants`);
      const regs = await registrantsRes.json();
      setRegistrants(regs);
    } catch (e) {
      console.error(e);
    }
  };

  // Save Form Schema
  const handleSaveFormSchema = async () => {
    if (!selectedBuilderAgenda) return;
    try {
      const res = await fetch(`/api/agenda/${selectedBuilderAgenda.id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form_schema: formFields,
          tipe_pendaftaran: pendaftaranTipe
        })
      });
      if (res.ok) {
        alert('Konfigurasi formulir pendaftaran dinamis berhasil disimpan!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Pendaftaran Aktif
  const handleTogglePendaftaran = async (agenda: AgendaKegiatan) => {
    try {
      const res = await fetch('/api/agenda/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...agenda,
          is_aktif_pendaftaran: !agenda.is_aktif_pendaftaran
        })
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create User DKR / SAKA
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole === 'user' && (!newEmail || !newPassword || !newKecaId || !newNama)) {
      alert('Mohon isi seluruh bidang pendaftaran user DKR');
      return;
    }
    if (newRole === 'saka' && (!newEmail || !newPassword || !newSakaId || !newNama)) {
      alert('Mohon isi seluruh bidang pendaftaran user SAKA');
      return;
    }

    try {
      const res = await fetch('/api/users/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          role: newRole,
          kecamatan_id: newRole === 'user' ? newKecaId : undefined,
          saka_id: newRole === 'saka' ? newSakaId : undefined,
          nama: newNama
        })
      });
      if (res.ok) {
        alert(newRole === 'saka' ? 'Akun SAKA Tingkat Kabupaten berhasil dibuat!' : 'Akun DKR Kecamatan berhasil dibuat!');
        setNewEmail('');
        setNewPassword('');
        setNewNama('');
        setNewKecaId('');
        setNewSakaId('');
        setNewRole('user');
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Active Kecamatan status
  const handleToggleKecamatanActive = async (id: string) => {
    try {
      const res = await fetch('/api/kecamatan/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Active SAKA status
  const handleToggleSakaActive = async (id: string) => {
    try {
      const res = await fetch('/api/saka/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (c: number) => {
      const hex = Math.max(0, Math.min(255, c)).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const autoAssignColors = (colors: string[]) => {
    if (colors.length === 0) return;
    
    const colorDetails = colors.map(hex => {
      const rgb = hexToRgb(hex);
      if (!rgb) return { hex, r: 128, g: 128, b: 128, lum: 128, sat: 0, isGreen: false, isOrange: false };
      
      const max = Math.max(rgb.r, rgb.g, rgb.b);
      const min = Math.min(rgb.r, rgb.g, rgb.b);
      const l = (max + min) / 2;
      let s = 0;
      if (max !== min) {
        s = l > 0.5 ? (max - min) / (2.0 - max - min) : (max - min) / (max + min);
      }
      
      const lum = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
      const isGreen = rgb.g > rgb.r * 1.1 && rgb.g > rgb.b * 1.1;
      const isOrange = rgb.r > rgb.b * 1.5 && rgb.g > rgb.b;
      
      return { hex, r: rgb.r, g: rgb.g, b: rgb.b, lum, sat: s, isGreen, isOrange };
    });
    
    const darks = [...colorDetails].sort((a, b) => a.lum - b.lum);
    const darkest = darks[0]?.hex || '#5C4033';
    const midColor = darks[1]?.hex || '#8B7355';
    
    const orangeCandidate = colorDetails.find(c => c.isOrange) || 
                            [...colorDetails].sort((a, b) => (b.r - b.b) - (a.r - a.b))[0];
    const orangeColor = orangeCandidate?.hex || '#F5A623';
    
    const greenCandidate = colorDetails.find(c => c.isGreen) || 
                           [...colorDetails].sort((a, b) => (b.g - b.r) - (a.g - a.r))[0];
    const greenColor = greenCandidate?.hex || '#4CAF50';
    
    setBrandBrownDark(darkest);
    setBrandBrownMid(midColor);
    setBrandOrange(orangeColor);
    setBrandGreen(greenColor);
  };

  const handleImageColorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsExtracting(false);
          return;
        }
        
        canvas.width = 50;
        canvas.height = 50;
        ctx.drawImage(img, 0, 0, 50, 50);
        
        const imgData = ctx.getImageData(0, 0, 50, 50).data;
        const colorCounts: Record<string, number> = {};
        
        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i+1];
          const b = imgData[i+2];
          const a = imgData[i+3];
          
          if (a < 200) continue;
          
          const rRound = Math.round(r / 32) * 32;
          const gRound = Math.round(g / 32) * 32;
          const bRound = Math.round(b / 32) * 32;
          
          const hex = rgbToHex(rRound, gRound, bRound);
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }
        
        let colors = Object.keys(colorCounts).map(hex => ({
          hex,
          count: colorCounts[hex]
        }));
        
        colors.sort((a, b) => b.count - a.count);
        
        const uniqueColors: string[] = [];
        for (const item of colors) {
          const rgb = hexToRgb(item.hex);
          if (!rgb) continue;
          
          const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
          if (brightness > 245 || brightness < 10) continue;
          
          const isTooSimilar = uniqueColors.some(existingHex => {
            const extRgb = hexToRgb(existingHex);
            if (!extRgb) return false;
            const dist = Math.sqrt(
              Math.pow(rgb.r - extRgb.r, 2) +
              Math.pow(rgb.g - extRgb.g, 2) +
              Math.pow(rgb.b - extRgb.b, 2)
            );
            return dist < 65;
          });
          
          if (!isTooSimilar) {
            uniqueColors.push(item.hex);
          }
          
          if (uniqueColors.length >= 8) break;
        }
        
        if (uniqueColors.length < 4) {
          for (const item of colors) {
            if (!uniqueColors.includes(item.hex)) {
              uniqueColors.push(item.hex);
            }
            if (uniqueColors.length >= 8) break;
          }
        }
        
        setExtractedColors(uniqueColors);
        setIsExtracting(false);
        autoAssignColors(uniqueColors);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetTheme = () => {
    if (confirm('Apakah Anda yakin ingin mengembalikan warna landing page ke setelan awal (oranye, hijau, & cokelat)?')) {
      setBrandOrange('#F5A623');
      setBrandGreen('#4CAF50');
      setBrandBrownDark('#5C4033');
      setBrandBrownMid('#8B7355');
    }
  };

  // Save Site Content
  const handleSaveSiteContent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const resHero = await fetch('/api/site_content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: 'hero',
          content: {
            title: heroTitle,
            subtitle: heroSubtitle,
            lead: heroLead,
            cta_text: heroCta,
            badge_text: heroBadge,
            bg_image_url: heroBgImageUrl,
            bg_opacity: Number(heroBgOpacity)
          }
        })
      });

      const resTheme = await fetch('/api/site_content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: 'theme',
          content: {
            brandOrange,
            brandGreen,
            brandBrownDark,
            brandBrownMid
          }
        })
      });

      if (resHero.ok && resTheme.ok) {
        alert('Konten dan tema warna landing page berhasil diperbarui!');
        loadData();
      } else {
        alert('Gagal menyimpan pembaruan.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalPenegak = dataPotensial.reduce((acc, curr) => acc + curr.jumlah_penegak_l + curr.jumlah_penegak_p, 0);
  const totalPandega = dataPotensial.reduce((acc, curr) => acc + curr.jumlah_pandega_l + curr.jumlah_pandega_p, 0);

  return (
    <div className="min-h-screen bg-dash-canvas flex flex-col md:flex-row">
      
      {/* Mobile Top Header & Swipeable Tab-bar (Mobile Only) */}
      <div className="md:hidden bg-gradient-to-r from-[#0E9F6E] to-[#065F46] text-white border-b-2 border-emerald-500/20 flex flex-col shrink-0 sticky top-0 z-40 shadow-md">
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-emerald-400 p-0.5">
              <span className="text-sm text-[#0E9F6E] font-bold">⚜</span>
            </div>
            <div>
              <h2 className="font-extrabold text-[10px] tracking-wider font-mono text-white uppercase leading-none">Admin DKC</h2>
              <p className="text-[8px] text-emerald-200 font-mono mt-0.5 leading-none">Kab. Tasikmalaya</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => navigate('/')} 
              className="text-[9px] font-bold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg uppercase tracking-wider font-mono"
            >
              Beranda
            </button>
            <button 
              onClick={handleLogout} 
              className="text-[9px] font-bold bg-brand-red/20 hover:bg-brand-red/35 text-brand-red border border-brand-red/30 px-2.5 py-1.5 rounded-lg uppercase tracking-wider font-mono"
            >
              Keluar
            </button>
          </div>
        </div>
        
        {/* Horizontal Scroll Menu - dikelompokkan per kategori dengan separator */}
        <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 bg-[#064E3B] scrollbar-none whitespace-nowrap">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'dashboard' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" /> Rekap
          </button>

          <span className="w-px h-5 bg-white/15 shrink-0 mx-0.5" />

          <button 
            onClick={() => setActiveTab('potensial_dkr')}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'potensial_dkr' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Potensial DKR
          </button>
          <button 
            onClick={() => setActiveTab('potensial_saka')}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'potensial_saka' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Potensial SAKA
          </button>

          <span className="w-px h-5 bg-white/15 shrink-0 mx-0.5" />

          <button 
            onClick={() => setActiveTab('berita')}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'berita' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Warta
          </button>
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'agenda' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" /> Kegiatan
          </button>
          <button 
            onClick={() => setActiveTab('personalia')}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'personalia' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Personalia DKC
          </button>
          <button 
            onClick={() => setActiveTab('konten')}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'konten' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Landingpage
          </button>
          <button 
            onClick={() => setActiveTab('informasi')}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'informasi' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Unduhan
          </button>

          <span className="w-px h-5 bg-white/15 shrink-0 mx-0.5" />

          <button 
            onClick={() => { setActiveTab('users_dkr'); setNewRole('user'); }}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'users_dkr' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> User DKR
          </button>
          <button 
            onClick={() => { setActiveTab('users_saka'); setNewRole('saka'); }}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'users_saka' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> User SAKA
          </button>

          <span className="w-px h-5 bg-white/15 shrink-0 mx-0.5" />

          <button 
            onClick={() => setActiveTab('laporan')}
            className={`text-[10px] font-bold px-3 py-2 rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              activeTab === 'laporan' ? 'bg-white text-[#065F46] shadow-sm' : 'text-emerald-100 hover:bg-white/5'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Laporan DKR
          </button>
        </div>
      </div>

      {/* Desktop Sidebar (Desktop Only) with Gradient Green matching the uploaded reference */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-[#0E9F6E] via-[#10B981] to-[#065F46] text-white flex-col shrink-0 border-r border-[#064E3B]">
        <div className="p-5 border-b border-white/10 flex flex-col items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-emerald-400 p-1 shrink-0 shadow-sm">
              <span className="text-2xl text-[#0E9F6E] font-bold">⚜</span>
            </div>
            <div className="text-left">
              <h2 className="font-display font-black text-xs tracking-tight text-white uppercase leading-tight">DKC TASIKMALAYA</h2>
              <p className="text-[9px] text-[#A7F3D0] font-mono mt-0.5 tracking-wider uppercase leading-none">NUR SAKTI BUANA</p>
            </div>
          </div>
          
          {/* ACCESS BADGE AS SHOWN IN THE USER REFERENCE IMAGE */}
          <div className="w-full bg-black/15 border border-emerald-500/20 rounded-2xl p-3 text-center mt-4">
            <p className="text-[9px] font-bold tracking-widest text-[#A7F3D0] uppercase font-mono">AKSES MASUK:</p>
            <h3 className="text-xs font-black tracking-widest text-white uppercase mt-0.5">ADMINISTRATOR</h3>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1 font-sans overflow-y-auto">
          {/* Kategori: RINGKASAN */}
          <p className="px-4 pt-1 pb-1 text-[9px] font-bold text-emerald-200/70 uppercase tracking-widest font-mono">Ringkasan</p>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'dashboard' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Dashboard Rekap
          </button>

          {/* Kategori: DATA POTENSIAL */}
          <p className="px-4 pt-3 pb-1 text-[9px] font-bold text-emerald-200/70 uppercase tracking-widest font-mono">Data Potensial</p>
          <button 
            onClick={() => setActiveTab('potensial_dkr')}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'potensial_dkr' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Potensial DKR (Ranting)
          </button>

          <button 
            onClick={() => setActiveTab('potensial_saka')}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'potensial_saka' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Potensial SAKA (Karya)
          </button>

          {/* Kategori: KONTEN & PUBLIKASI */}
          <p className="px-4 pt-3 pb-1 text-[9px] font-bold text-emerald-200/70 uppercase tracking-widest font-mono">Konten &amp; Publikasi</p>
          <button 
            onClick={() => setActiveTab('berita')}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'berita' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" /> Persetujuan Warta
          </button>

          <button 
            onClick={() => setActiveTab('agenda')}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'agenda' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <Calendar className="w-4 h-4" /> Kegiatan & Form Builder
          </button>

          <button 
            onClick={() => setActiveTab('personalia')}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'personalia' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <Award className="w-4 h-4" /> Personalia DKC
          </button>

          <button 
            onClick={() => setActiveTab('konten')}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'konten' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" /> Kelola Landingpage
          </button>

          <button 
            onClick={() => setActiveTab('informasi')}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'informasi' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <Download className="w-4 h-4" /> Pusat Unduhan Berkas
          </button>

          {/* Kategori: MANAJEMEN AKUN */}
          <p className="px-4 pt-3 pb-1 text-[9px] font-bold text-emerald-200/70 uppercase tracking-widest font-mono">Manajemen Akun</p>
          <button 
            onClick={() => { setActiveTab('users_dkr'); setNewRole('user'); }}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'users_dkr' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" /> User DKR Kecamatan
          </button>

          <button 
            onClick={() => { setActiveTab('users_saka'); setNewRole('saka'); }}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'users_saka' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4" /> User SAKA Kabupaten
          </button>

          {/* Kategori: VERIFIKASI LAPORAN */}
          <p className="px-4 pt-3 pb-1 text-[9px] font-bold text-emerald-200/70 uppercase tracking-widest font-mono">Verifikasi Laporan</p>
          <button 
            onClick={() => setActiveTab('laporan')}
            className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === 'laporan' ? 'bg-white text-[#065F46] shadow-md' : 'text-emerald-50 hover:bg-white/10'
            }`}
          >
            <Award className="w-4 h-4" /> Verifikasi Laporan 02GP & 01
          </button>
        </nav>

        {/* Desktop Logout Block */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-bold text-[11px] py-2.5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Kembali ke Beranda
          </button>
          <button 
            onClick={handleLogout}
            className="w-full bg-brand-red/10 hover:bg-brand-red/20 text-red-200 border border-brand-red/20 font-bold text-[11px] py-2.5 rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            Keluar Sesi
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        
        <GreetingBanner name={user?.nama || 'Administrator'} role={user?.role} />

        {/* TAB 1: DASHBOARD REKAP */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Kinerja Cabang & Ranting</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Ikhtisar data real-time Penegak, Pandega, DKR, dan Pangkalan Aktif.</p>
            </div>

            {/* Bento Grid Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Metric 1 */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase font-semibold">Total Penegak</span>
                  <h3 className="text-2xl font-display font-black text-brand-brown-dark">{totalPenegak} <span className="text-xs font-normal text-gray-500">Jiwa</span></h3>
                </div>
              </div>

              {/* Metric 2 */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase font-semibold">Total Pandega</span>
                  <h3 className="text-2xl font-display font-black text-brand-brown-dark">{totalPandega} <span className="text-xs font-normal text-gray-500">Jiwa</span></h3>
                </div>
              </div>

              {/* Metric 3 */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-teal/10 rounded-2xl flex items-center justify-center text-brand-teal shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase font-semibold">DKR Aktif (Sudah Punya Akun)</span>
                  <h3 className="text-2xl font-display font-black text-brand-brown-dark">
                    {kecamatanList.filter(k => userList.some(u => u.role === 'user' && u.kecamatan_id === k.id)).length} <span className="text-xs font-normal text-gray-500">Kec.</span>
                  </h3>
                </div>
              </div>

              {/* Metric 4 */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue/10 rounded-2xl flex items-center justify-center text-brand-blue shrink-0">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase font-semibold">Pangkalan Aktif</span>
                  <h3 className="text-2xl font-display font-black text-brand-brown-dark">
                    {pangkalanList.filter(p => p.status_aktif).length} <span className="text-xs font-normal text-gray-500">Gudep</span>
                  </h3>
                </div>
              </div>

            </div>

            {/* Quick Summary list */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <h3 className="font-extrabold text-base text-brand-brown-dark mb-4 tracking-tight border-b border-gray-100 pb-2">
                Kontribusi Ranting (Kecamatan)
              </h3>
              <div className="space-y-3">
                {kecamatanList.map((keca) => {
                  const pot = dataPotensial.find(p => p.kecamatan_id === keca.id);
                  const total = pot ? (pot.jumlah_penegak_l + pot.jumlah_penegak_p + pot.jumlah_pandega_l + pot.jumlah_pandega_p) : 0;
                  const punyaAkun = userList.some(u => u.role === 'user' && u.kecamatan_id === keca.id);
                  return (
                    <div key={keca.id} className="flex items-center justify-between text-xs p-3 bg-gray-50 rounded-xl border border-gray-100 font-mono">
                      <span className="font-bold text-brand-brown-dark text-xs">{keca.nama_kecamatan}</span>
                      <div className="flex gap-4 items-center">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${punyaAkun ? 'bg-brand-green/10 text-brand-green' : 'bg-brand-orange/10 text-brand-orange'}`}>
                          {punyaAkun ? 'DKR AKTIF' : 'BELUM ADA AKUN'}
                        </span>
                        <span className="font-bold text-gray-600 bg-white border px-2.5 py-0.5 rounded">{total} Anggota</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2A: DATA POTENSIAL DKR */}
        {activeTab === 'potensial_dkr' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Data Potensial Anggota DKR Kecamatan</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Rekapitulasi berkas keanggotaan Penegak & Pandega se-Kabupaten Tasikmalaya tingkat Kecamatan (Ranting).</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <span className="font-extrabold text-xs text-brand-brown-dark font-mono uppercase">Tabel Rekapitulasi Ranting</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-brand-brown-dark text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4 font-bold">Kecamatan</th>
                      <th className="p-4 font-bold text-center">Penegak (L)</th>
                      <th className="p-4 font-bold text-center">Penegak (P)</th>
                      <th className="p-4 font-bold text-center">Pandega (L)</th>
                      <th className="p-4 font-bold text-center">Pandega (P)</th>
                      <th className="p-4 font-bold text-center">Total</th>
                      <th className="p-4 font-bold">Terakhir Diperbarui</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {kecamatanList.map((keca) => {
                      const pot = dataPotensial.find(p => p.kecamatan_id === keca.id);
                      const total = pot ? (pot.jumlah_penegak_l + pot.jumlah_penegak_p + pot.jumlah_pandega_l + pot.jumlah_pandega_p) : 0;
                      return (
                        <tr key={keca.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-brand-brown-dark">{keca.nama_kecamatan}</td>
                          <td className="p-4 text-center font-bold">{pot?.jumlah_penegak_l || 0}</td>
                          <td className="p-4 text-center font-bold">{pot?.jumlah_penegak_p || 0}</td>
                          <td className="p-4 text-center font-bold">{pot?.jumlah_pandega_l || 0}</td>
                          <td className="p-4 text-center font-bold">{pot?.jumlah_pandega_p || 0}</td>
                          <td className="p-4 text-center font-black text-brand-orange bg-brand-orange/5">{total}</td>
                          <td className="p-4 text-gray-500 text-[10px]">{pot ? new Date(pot.updated_at).toLocaleString('id-ID') : 'Belum ada data'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2B: DATA POTENSIAL SAKA */}
        {activeTab === 'potensial_saka' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Data Potensial Anggota SAKA</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Rekapitulasi berkas keanggotaan Satuan Karya (SAKA) Tingkat Kabupaten Tasikmalaya.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <span className="font-extrabold text-xs text-brand-brown-dark font-mono uppercase">Tabel Rekapitulasi SAKA</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-brand-brown-dark text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4 font-bold">Satuan Karya (SAKA)</th>
                      <th className="p-4 font-bold text-center">Penegak (L)</th>
                      <th className="p-4 font-bold text-center">Penegak (P)</th>
                      <th className="p-4 font-bold text-center">Pandega (L)</th>
                      <th className="p-4 font-bold text-center">Pandega (P)</th>
                      <th className="p-4 font-bold text-center">Total</th>
                      <th className="p-4 font-bold">Terakhir Diperbarui</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {sakaList.map((sakaItem) => {
                      const pot = dataPotensial.find(p => p.saka_id === sakaItem.id);
                      const total = pot ? (pot.jumlah_penegak_l + pot.jumlah_penegak_p + pot.jumlah_pandega_l + pot.jumlah_pandega_p) : 0;
                      return (
                        <tr key={sakaItem.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-brand-brown-dark">{sakaItem.nama_saka}</td>
                          <td className="p-4 text-center font-bold">{pot?.jumlah_penegak_l || 0}</td>
                          <td className="p-4 text-center font-bold">{pot?.jumlah_penegak_p || 0}</td>
                          <td className="p-4 text-center font-bold">{pot?.jumlah_pandega_l || 0}</td>
                          <td className="p-4 text-center font-bold">{pot?.jumlah_pandega_p || 0}</td>
                          <td className="p-4 text-center font-black text-brand-orange bg-brand-orange/5">{total}</td>
                          <td className="p-4 text-gray-500 text-[10px]">{pot ? new Date(pot.updated_at).toLocaleString('id-ID') : 'Belum ada data'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KELOLA BERITA (Approval & Creator) */}
        {activeTab === 'berita' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Kanal Berita & Publikasi</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Approve kontribusi berita DKR, atau tulis berita resmi Dewan Kerja Cabang.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              
              {/* News Approval Queue */}
              <div className="space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-orange pb-2">
                  Antrean Persetujuan (Kontribusi DKR)
                </h3>
                
                {beritaList.filter(b => b.status === 'pending').length > 0 ? (
                  <div className="space-y-4">
                    {beritaList.filter(b => b.status === 'pending').map((b) => (
                      <div key={b.id} className="bg-white border border-gray-200 rounded-3xl p-5 shadow-sm space-y-4">
                        <div className="flex gap-4 items-start">
                          <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                            <img src={b.gambar_url} alt={b.judul} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <span className="bg-[#2E5C9A]/15 text-[#2E5C9A] border border-[#2E5C9A]/20 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase block w-max mb-1.5">
                              DKR {b.kecamatan_nama}
                            </span>
                            <h4 className="font-extrabold text-sm text-brand-brown-dark tracking-tight leading-tight">{b.judul}</h4>
                            <p className="text-[10px] text-gray-400 font-mono mt-1">Diajukan oleh: {b.author_name}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-3 border-t border-gray-50">
                          <button
                            onClick={() => handleApproveNews(b.id, 'rejected')}
                            className="bg-brand-red/10 hover:bg-brand-red/20 text-brand-red border border-brand-red/20 font-bold px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Tolak
                          </button>
                          <button
                            onClick={() => handleApproveNews(b.id, 'approved')}
                            className="bg-brand-green/10 hover:bg-brand-green/20 text-brand-green border border-brand-green/20 font-bold px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Setujui & Terbitkan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center text-gray-500 italic text-xs font-mono">
                    Tidak ada kiriman berita pending dari DKR saat ini.
                  </div>
                )}
              </div>

              {/* Tulis Berita DKC */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-green pb-2">
                  Tulis Rilis Resmi DKC
                </h3>

                <form onSubmit={handleSaveNews} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Judul Berita</label>
                    <input 
                      type="text"
                      required
                      value={newsTitle}
                      onChange={(e) => setNewsTitle(e.target.value)}
                      placeholder="Masukkan judul berita resmi"
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Foto Sampul (Unggah File Gambar)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'news')}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-[10px] text-gray-500 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                    {newsImage && (
                      <div className="mt-2 text-[10px] text-brand-green font-bold">
                        ✓ Berhasil diunggah: <a href={newsImage} target="_blank" className="underline">{newsImage}</a>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Konten / Isi Artikel (HTML didukung)</label>
                    <textarea 
                      required
                      rows={5}
                      value={newsContent}
                      onChange={(e) => setNewsContent(e.target.value)}
                      placeholder="Tulis narasi berita pramuka di sini..."
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 font-sans focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={newsSaving}
                    className="w-full bg-gradient-to-r from-brand-orange to-brand-green text-white font-extrabold text-xs py-3.5 rounded-xl uppercase tracking-wider shadow cursor-pointer"
                  >
                    {newsSaving ? 'Menerbitkan...' : 'Terbitkan Sekarang'}
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: AGENDA KEGIATAN & FORM CONFIG BUILDER */}
        {activeTab === 'agenda' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Manajemen Agenda & Pendaftaran</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Buat kegiatan baru, aktifkan portal pendaftaran online, dan rancang form dinamis.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Left Form: Add Agenda */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-orange pb-2">
                  Tambah Agenda Baru
                </h3>

                <form onSubmit={handleSaveAgenda} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Kegiatan</label>
                    <input 
                      type="text" required value={agendaName} onChange={(e) => setAgendaName(e.target.value)}
                      placeholder="Nama kegiatan" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tempat</label>
                    <input 
                      type="text" required value={agendaPlace} onChange={(e) => setAgendaPlace(e.target.value)}
                      placeholder="Bumi perkemahan, Aula, dsb." className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  {/* Tanggal Sudah Diputuskan Toggle */}
                  <div className="flex items-center gap-2 py-1">
                    <input 
                      type="checkbox" 
                      id="agendaIsDateDecided" 
                      checked={agendaIsDateDecided} 
                      onChange={(e) => setAgendaIsDateDecided(e.target.checked)}
                      className="w-4 h-4 text-brand-green border-slate-300 rounded focus:ring-brand-green"
                    />
                    <label htmlFor="agendaIsDateDecided" className="text-[10px] font-bold text-gray-500 uppercase cursor-pointer select-none">
                      Tanggal Sudah Diputuskan?
                    </label>
                  </div>

                  {agendaIsDateDecided ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Mulai</label>
                        <input 
                          type="date" required={agendaIsDateDecided} value={agendaStart} onChange={(e) => setAgendaStart(e.target.value)}
                          className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Selesai</label>
                        <input 
                          type="date" required={agendaIsDateDecided} value={agendaEnd} onChange={(e) => setAgendaEnd(e.target.value)}
                          className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Bulan Rencana</label>
                      <input 
                        type="month" required={!agendaIsDateDecided} value={agendaBulanRencana} onChange={(e) => setAgendaBulanRencana(e.target.value)}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Jenis</label>
                      <select 
                        value={agendaType} onChange={(e) => setAgendaType(e.target.value as any)}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                      >
                        <option value="mandiri">Mandiri</option>
                        <option value="partisipasi">Partisipasi</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tingkat</label>
                      <select 
                        value={agendaLevel} onChange={(e) => setAgendaLevel(e.target.value as any)}
                        className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                      >
                        <option value="kabupaten">Kabupaten</option>
                        <option value="provinsi">Provinsi</option>
                        <option value="nasional">Nasional</option>
                        <option value="internasional">Internasional</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Estimasi Jumlah Peserta (Jiwa)</label>
                    <input 
                      type="number" required value={agendaEst} onChange={(e) => setAgendaEst(Number(e.target.value))}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={agendaSaving}
                    className="w-full bg-brand-brown-dark hover:bg-brand-brown-dark/95 text-white font-extrabold text-xs py-3 rounded-xl uppercase shadow cursor-pointer"
                  >
                    Tambah Agenda
                  </button>
                </form>
              </div>

              {/* Middle List: Action Center */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <h3 className="font-extrabold text-base text-brand-brown-dark mb-4 tracking-tight border-b pb-2">
                    Daftar Agenda Kegiatan & Aktivitas
                  </h3>

                  <div className="space-y-4">
                    {agendaList.map((a) => (
                      <div key={a.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
                        <div>
                          <div className="flex gap-2 mb-1.5 items-center">
                            <span className="bg-brand-orange/15 text-brand-orange font-bold px-2 py-0.5 rounded text-[9px] uppercase border border-brand-orange/10">
                              Tingkat {a.tingkat}
                            </span>
                            <span className="bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded text-[9px] uppercase border">
                              {a.jenis}
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-brand-brown-dark tracking-tight leading-snug">{a.nama_kegiatan}</h4>
                          <p className="text-[10px] text-gray-400 mt-1">📍 {a.tempat} | 📅 {a.tanggal_mulai} s.d {a.tanggal_selesai}</p>
                        </div>

                        {/* Control buttons */}
                        <div className="flex flex-wrap gap-2 shrink-0">
                          {/* Toggle active registration */}
                          <button
                            onClick={() => handleTogglePendaftaran(a)}
                            className={`p-2 rounded-xl border flex items-center gap-1 font-bold text-[10px] transition-all cursor-pointer ${
                              a.is_aktif_pendaftaran 
                                ? 'bg-brand-green/10 text-brand-green border-brand-green/20'
                                : 'bg-gray-200 text-gray-500 border-gray-300'
                            }`}
                          >
                            {a.is_aktif_pendaftaran ? 'PENDAFTARAN AKTIF' : 'PENDAFTARAN NONAKTIF'}
                          </button>

                          {/* Open Form Config Builder */}
                          <button
                            onClick={() => handleOpenFormBuilder(a)}
                            className="bg-brand-teal/15 text-brand-teal border border-brand-teal/20 hover:bg-brand-teal/20 font-bold p-2 rounded-xl text-[10px] transition-all flex items-center gap-1 cursor-pointer"
                          >
                            Rancang Form
                          </button>

                          <button
                            onClick={() => handleDeleteAgenda(a.id)}
                            className="bg-brand-red/15 text-brand-red border border-brand-red/20 hover:bg-brand-red/25 p-2 rounded-xl cursor-pointer"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Online Form Config Builder Component */}
                {selectedBuilderAgenda && (
                  <div className="bg-white border-2 border-brand-orange rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
                    <div className="flex justify-between items-center border-b pb-3">
                      <div>
                        <span className="text-[10px] text-brand-orange font-mono font-bold uppercase tracking-wider block">Rancang Schema Online Form</span>
                        <h4 className="font-extrabold text-base text-brand-brown-dark tracking-tight">Formulir: {selectedBuilderAgenda.nama_kegiatan}</h4>
                      </div>
                      <button 
                        onClick={() => setSelectedBuilderAgenda(null)}
                        className="text-gray-400 hover:text-black font-bold text-xs"
                      >
                        ✕ Sembunyikan
                      </button>
                    </div>

                    {/* Form Builder configuration */}
                    <div className="space-y-4">
                      <div className="flex gap-4 items-center">
                        <label className="text-xs font-bold font-mono text-gray-600 shrink-0">Tipe Pendaftaran:</label>
                        <select 
                          value={pendaftaranTipe} onChange={(e) => setPendaftaranTipe(e.target.value as any)}
                          className="bg-gray-50 border rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-gray-800"
                        >
                          <option value="mandiri">Mandiri Sahaja (Perorangan)</option>
                          <option value="kolektif">Kolektif Kontingen (Ranting/Gudep)</option>
                          <option value="keduanya">Keduanya (Bisa memilih)</option>
                        </select>
                      </div>

                      {/* Fields Designer list */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest block">Struktur Fields Formulir</span>
                        
                        {formFields.map((field, idx) => (
                          <div key={field.id} className="bg-gray-50 p-3 rounded-xl border border-gray-150 flex flex-wrap gap-3 items-center justify-between text-xs font-mono">
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                              <span className="bg-brand-orange/15 text-brand-orange font-bold px-1.5 py-0.5 rounded text-[10px]">{field.id}</span>
                              <input 
                                type="text" value={field.label}
                                onChange={(e) => {
                                  const list = [...formFields];
                                  list[idx].label = e.target.value;
                                  setFormFields(list);
                                }}
                                className="bg-white border rounded px-2 py-1 flex-1 font-sans text-xs text-brand-brown-dark font-bold"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <select 
                                value={field.type}
                                onChange={(e) => {
                                  const list = [...formFields];
                                  list[idx].type = e.target.value;
                                  setFormFields(list);
                                }}
                                className="bg-white border rounded px-2 py-1 text-[11px]"
                              >
                                <option value="text">Text Input</option>
                                <option value="number">Numeric</option>
                                <option value="select">Dropdown Select</option>
                                <option value="textarea">Paragraph Box</option>
                              </select>

                              <label className="flex items-center gap-1 font-bold text-[10px] text-gray-500">
                                <input 
                                  type="checkbox" checked={field.required}
                                  onChange={(e) => {
                                    const list = [...formFields];
                                    list[idx].required = e.target.checked;
                                    setFormFields(list);
                                  }}
                                /> Wajib
                              </label>

                              <button
                                onClick={() => setFormFields(formFields.filter((_, i) => i !== idx))}
                                className="text-brand-red hover:bg-brand-red/10 p-1.5 rounded"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Dropdown Options details */}
                            {field.type === 'select' && (
                              <div className="w-full pt-2 border-t border-dashed mt-2">
                                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Opsi Dropdown (Satu per baris)</label>
                                <textarea
                                  rows={2}
                                  value={field.options?.join('\n') || ''}
                                  onChange={(e) => {
                                    const list = [...formFields];
                                    list[idx].options = e.target.value.split('\n').filter(o => o.trim());
                                    setFormFields(list);
                                  }}
                                  placeholder="Sebutkan opsi..."
                                  className="w-full bg-white border rounded px-3 py-1.5 text-xs text-gray-800"
                                />
                              </div>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => setFormFields([...formFields, { id: `f${Date.now().toString().substr(-4)}`, label: 'Field Baru', type: 'text', required: false }])}
                          className="bg-brand-green hover:bg-brand-green/90 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Tambah Field
                        </button>
                      </div>

                      {/* Action save builder schema */}
                      <div className="pt-4 border-t flex gap-3 justify-end">
                        <button
                          onClick={handleSaveFormSchema}
                          className="bg-brand-brown-dark hover:bg-brand-brown-dark/95 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow"
                        >
                          <Save className="w-4 h-4" /> Simpan Struktur Form
                        </button>
                      </div>

                      {/* Registrants Viewer list */}
                      <div className="pt-6 border-t mt-6">
                        <h5 className="font-extrabold text-sm text-brand-brown-dark tracking-tight mb-3">
                          Total Pendaftar Terkonfirmasi ({registrants.length} Kontingen)
                        </h5>
                        
                        {registrants.length > 0 ? (
                          <div className="space-y-3 font-mono text-[10px] text-gray-700">
                            {registrants.map((reg, idx) => (
                              <div key={reg.id} className="p-3 bg-gray-50 border rounded-xl border-gray-150">
                                <div className="flex justify-between items-center font-bold text-[11px] mb-2 text-brand-brown-dark border-b pb-1">
                                  <span>Pendaftar #{idx+1} ({reg.tipe})</span>
                                  <span className="text-gray-400 font-normal">{new Date(reg.created_at).toLocaleString('id-ID')}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                                  {formFields.map((field) => (
                                    <div key={field.id} className="flex justify-between border-b border-gray-100 py-0.5">
                                      <span className="text-gray-400 text-[10px]">{field.label}:</span>
                                      <strong className="text-gray-800">{reg.data_peserta[field.id] || '-'}</strong>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Belum ada peserta yang mendaftar pada kegiatan ini.</p>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 4B: PERSONALIA DKC */}
        {activeTab === 'personalia' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Personalia Dewan Kerja Cabang</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Kelola daftar pengurus DKC yang ditampilkan pada landingpage publik.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

              {/* Add form */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-orange pb-2">
                  Tambah Pengurus DKC
                </h3>

                <form onSubmit={handleAddPersonalia} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Pengurus</label>
                    <input
                      type="text" required value={newPersonNama} onChange={(e) => setNewPersonNama(e.target.value)}
                      placeholder="Contoh: Kak Fajar Ramadhan" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Jabatan Struktur</label>
                    <input
                      type="text" required value={newPersonJabatan} onChange={(e) => setNewPersonJabatan(e.target.value)}
                      placeholder="Contoh: Ketua DKC" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
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
                      type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'personalia')}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-[10px] text-gray-500 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                    {newPersonFoto && (
                      <img src={newPersonFoto} alt="Preview" className="w-16 h-16 object-cover rounded-xl mt-2 border" />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={personaliaSaving}
                    className="w-full bg-brand-green hover:bg-brand-green/95 text-white font-extrabold text-xs py-3 rounded-xl uppercase shadow disabled:opacity-60 cursor-pointer"
                  >
                    {personaliaSaving ? 'Menyimpan...' : 'Tambahkan Pengurus'}
                  </button>
                </form>
              </div>

              {/* List Personalia */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-extrabold text-base text-brand-brown-dark mb-4 tracking-tight border-b pb-2">
                  Personalia DKC Terdaftar ({personaliaList.length})
                </h3>

                <div className="space-y-4">
                  {personaliaList.length === 0 && (
                    <div className="bg-gray-50 border border-gray-150 rounded-2xl p-8 text-center text-gray-500 italic text-xs font-mono">
                      Belum ada pengurus DKC yang terdaftar.
                    </div>
                  )}
                  {personaliaList.sort((a, b) => a.urutan - b.urutan).map((p) => (
                    <div key={p.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex items-center justify-between font-mono text-xs">
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
                        className="text-brand-red font-bold text-[10px] ml-4 cursor-pointer"
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

        {/* TAB 5A: MANAJEMEN USER DKR KECAMATAN */}
        {activeTab === 'users_dkr' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Manajemen Akun DKR Kecamatan</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Buat kredensial utusan DKR Kecamatan se-Kabupaten Tasikmalaya serta kelola hak akses portal.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Add DKR user form */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-orange pb-2">
                  Daftarkan Akun DKR Baru
                </h3>

                <form onSubmit={(e) => { setNewRole('user'); handleCreateUser(e); }} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Organisasi DKR</label>
                    <input 
                      type="text" required value={newNama} onChange={(e) => setNewNama(e.target.value)}
                      placeholder="Contoh: DKR Singaparna" 
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alamat Email Kredensial</label>
                    <input 
                      type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="singaparna@dkctasik.org" 
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kata Sandi Default</label>
                    <input 
                      type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kecamatan Relasi</label>
                    <select 
                      value={newKecaId} onChange={(e) => setNewKecaId(e.target.value)} required
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    >
                      <option value="">-- Pilih Kecamatan --</option>
                      {kecamatanList.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green/95 text-white font-extrabold text-xs py-3 rounded-xl uppercase shadow cursor-pointer"
                  >
                    Daftarkan Akun DKR
                  </button>
                </form>
              </div>

              {/* List user list & status */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-extrabold text-base text-brand-brown-dark mb-4 tracking-tight border-b pb-2">
                  Daftar Kredensial DKR Terdaftar
                </h3>

                <div className="space-y-4">
                  {userList.filter(u => u.role === 'user').map((usr) => {
                    const keca = kecamatanList.find(k => k.id === usr.kecamatan_id);
                    return (
                      <div key={usr.email} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="bg-brand-brown-dark text-white font-bold px-2 py-0.5 rounded text-[8px] uppercase font-mono">
                            DKR KECAMATAN
                          </span>
                          <h4 className="font-extrabold text-sm text-brand-brown-dark tracking-tight leading-none mt-2">{usr.nama}</h4>
                          <p className="text-[10px] text-gray-400 mt-1">{usr.email}</p>
                        </div>

                        {/* Toggle active button for DKR */}
                        {keca && (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500">Status Landingpage:</span>
                            <button
                              onClick={() => handleToggleKecamatanActive(keca.id)}
                              className="focus:outline-none cursor-pointer"
                            >
                              {keca.is_dkr_aktif ? (
                                <span className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Tampil Publik
                                </span>
                              ) : (
                                <span className="bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-3 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" /> Sembunyi Publik
                                </span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {userList.filter(u => u.role === 'user').length === 0 && (
                    <p className="text-center text-gray-400 py-6">Belum ada akun DKR terdaftar.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5B: MANAJEMEN USER SAKA KABUPATEN */}
        {activeTab === 'users_saka' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Manajemen Akun SAKA Kabupaten</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Buat kredensial utusan SAKA (Satuan Karya) Tingkat Kabupaten Tasikmalaya serta kelola hak akses portal.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Add SAKA user form */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-orange pb-2">
                  Daftarkan Akun SAKA Baru
                </h3>

                <form onSubmit={(e) => { setNewRole('saka'); handleCreateUser(e); }} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nama Organisasi SAKA</label>
                    <input 
                      type="text" required value={newNama} onChange={(e) => setNewNama(e.target.value)}
                      placeholder="Contoh: Saka Bhayangkara" 
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Alamat Email Kredensial</label>
                    <input 
                      type="email" required value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="bhayangkara@dkctasik.org" 
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Kata Sandi Default</label>
                    <input 
                      type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">SAKA Relasi</label>
                    <select 
                      value={newSakaId} onChange={(e) => setNewSakaId(e.target.value)} required
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    >
                      <option value="">-- Pilih SAKA --</option>
                      {sakaList.map(s => (
                        <option key={s.id} value={s.id}>{s.nama_saka}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-green hover:bg-brand-green/95 text-white font-extrabold text-xs py-3 rounded-xl uppercase shadow cursor-pointer"
                  >
                    Daftarkan Akun SAKA
                  </button>
                </form>
              </div>

              {/* List user list & status */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-extrabold text-base text-brand-brown-dark mb-4 tracking-tight border-b pb-2">
                  Daftar Kredensial SAKA Terdaftar
                </h3>

                <div className="space-y-4">
                  {userList.filter(u => u.role === 'saka').map((usr) => {
                    const sakaItem = sakaList.find(s => s.id === usr.saka_id);
                    return (
                      <div key={usr.email} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
                        <div>
                          <span className="bg-brand-brown-dark text-white font-bold px-2 py-0.5 rounded text-[8px] uppercase font-mono">
                            SAKA KABUPATEN
                          </span>
                          <h4 className="font-extrabold text-sm text-brand-brown-dark tracking-tight leading-none mt-2">{usr.nama}</h4>
                          <p className="text-[10px] text-gray-400 mt-1">{usr.email}</p>
                        </div>

                        {/* Toggle active button for SAKA */}
                        {sakaItem && (
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-gray-500">Status Landingpage:</span>
                            <button
                              onClick={() => handleToggleSakaActive(sakaItem.id)}
                              className="focus:outline-none cursor-pointer"
                            >
                              {sakaItem.is_aktif ? (
                                <span className="bg-brand-green/10 text-brand-green border border-brand-green/20 px-3 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Tampil Publik
                                </span>
                              ) : (
                                <span className="bg-brand-orange/10 text-brand-orange border border-brand-orange/20 px-3 py-1 rounded-xl text-[10px] font-extrabold flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" /> Sembunyi Publik
                                </span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {userList.filter(u => u.role === 'saka').length === 0 && (
                    <p className="text-center text-gray-400 py-6">Belum ada akun SAKA terdaftar.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: KELOLA LANDING PAGE CONTENT */}
        {activeTab === 'konten' && (
          <div className="space-y-8">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Kustomisasi Konten & Warna Landingpage</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Sesuaikan informasi hero banner serta kelola warna tampilan landing page (baik manual maupun mendeteksi otomatis dari gambar).</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <form onSubmit={handleSaveSiteContent} className="space-y-6 text-xs font-mono">
                
                {/* PART 1: TEXT CONTENT */}
                <div className="space-y-5">
                  <h3 className="font-extrabold text-sm text-brand-brown-dark tracking-tight border-b pb-2 flex items-center gap-2">
                    <span className="w-5 h-5 bg-brand-orange text-white rounded-full flex items-center justify-center text-[10px]">1</span>
                    Kelola Informasi Hero Banner
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Judul Utama Hero</label>
                      <input 
                        type="text" required value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)}
                        placeholder="Contoh: Dewan Kerja Cabang" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 font-bold focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Subjudul / Wilayah</label>
                      <input 
                        type="text" required value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)}
                        placeholder="Contoh: Kabupaten Tasikmalaya" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 font-bold focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Teks Slogan / Tagline Banner</label>
                    <input 
                      type="text" required value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)}
                      placeholder="Satyaku Kudarmakan, Darmaku Kubaktikan" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Deskripsi Panjang (Lead Intro)</label>
                    <textarea 
                      required rows={3} value={heroLead} onChange={(e) => setHeroLead(e.target.value)}
                      placeholder="Narasi pendek visi dewan kerja di hero" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs font-sans text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Label Tombol CTA</label>
                    <input 
                      type="text" required value={heroCta} onChange={(e) => setHeroCta(e.target.value)}
                      placeholder="Jelajahi Kegiatan" className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  {/* HERO BACKGROUND CONFIGURATION */}
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4">
                    <p className="font-extrabold text-xs text-brand-brown-dark uppercase tracking-wider font-mono flex items-center gap-2">
                      <span>🖼️</span> Foto Background Hero & Opacity
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start font-mono">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Foto Background</label>
                          {heroBgImageUrl && (
                            <div className="mb-2 w-full h-24 rounded-xl overflow-hidden border border-slate-200/80 bg-gray-100">
                              <img src={heroBgImageUrl} alt="Preview background hero" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <input 
                            type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')}
                            id="hero-bg-upload-input" className="hidden"
                          />
                          <label 
                            htmlFor="hero-bg-upload-input"
                            className="bg-brand-brown-dark hover:bg-brand-orange text-white font-mono font-bold text-[10px] py-2.5 px-4 rounded-xl cursor-pointer transition-all duration-200 uppercase tracking-wider inline-flex items-center gap-1.5 shrink-0"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah Foto</span>
                          </label>
                          <p className="text-[9px] text-gray-400 leading-none">Otomatis dikompres &amp; diunggah ke Cloudinary</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase">Transparansi / Opacity Foto ({Math.round(heroBgOpacity * 100)}%)</label>
                            <span className="text-[10px] font-mono font-bold text-brand-brown-dark">{heroBgOpacity}</span>
                          </div>
                          <input 
                            type="range" min="0" max="1" step="0.05" value={heroBgOpacity} onChange={(e) => setHeroBgOpacity(parseFloat(e.target.value))}
                            className="w-full accent-brand-orange h-1.5 bg-gray-200 rounded-lg cursor-pointer"
                          />
                          <p className="text-[9px] text-gray-400 font-sans mt-1">
                            *Catatan: Semakin rendah opacity, warna gradien landing page akan semakin dominan.
                          </p>
                        </div>

                        {heroBgImageUrl && (
                          <div className="flex items-center gap-3 pt-1">
                            <span className="text-[10px] text-gray-500">Preview:</span>
                            <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-brand-brown-dark">
                              <img 
                                src={heroBgImageUrl} 
                                alt="Preview background" 
                                className="w-full h-full object-cover"
                                style={{ opacity: heroBgOpacity }}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PART 2: COLOR THEME CUSTOMIZER */}
                <div className="pt-6 border-t-2 border-dashed border-gray-150 space-y-5">
                  <h3 className="font-extrabold text-sm text-brand-brown-dark tracking-tight pb-2 flex items-center gap-2">
                    <span className="w-5 h-5 bg-brand-green text-white rounded-full flex items-center justify-center text-[10px]">2</span>
                    Skema Warna Landingpage (Theme Customizer)
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Left: manual input sliders */}
                    <div className="space-y-4">
                      <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                        Pilih warna kustom satu-persatu untuk landing page Anda, atau gunakan panel analisis AI di kanan untuk mendeteksi warna otomatis dari foto / logo.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Orange slot */}
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-150">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Warna Utama (Oranye)</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" value={brandOrange} onChange={(e) => setBrandOrange(e.target.value)}
                              className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                            />
                            <input 
                              type="text" value={brandOrange} onChange={(e) => setBrandOrange(e.target.value)}
                              placeholder="#F5A623" className="w-full bg-white border rounded-lg px-2 text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Green slot */}
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-150">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Warna Sekunder (Hijau)</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" value={brandGreen} onChange={(e) => setBrandGreen(e.target.value)}
                              className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                            />
                            <input 
                              type="text" value={brandGreen} onChange={(e) => setBrandGreen(e.target.value)}
                              placeholder="#4CAF50" className="w-full bg-white border rounded-lg px-2 text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Brown dark slot */}
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-150">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Warna Gelap (Cokelat Tua)</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" value={brandBrownDark} onChange={(e) => setBrandBrownDark(e.target.value)}
                              className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                            />
                            <input 
                              type="text" value={brandBrownDark} onChange={(e) => setBrandBrownDark(e.target.value)}
                              placeholder="#5C4033" className="w-full bg-white border rounded-lg px-2 text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        {/* Brown mid slot */}
                        <div className="bg-gray-50 p-3 rounded-2xl border border-gray-150">
                          <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1.5">Warna Penengah (Cokelat Sedang)</label>
                          <div className="flex gap-2">
                            <input 
                              type="color" value={brandBrownMid} onChange={(e) => setBrandBrownMid(e.target.value)}
                              className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer shrink-0"
                            />
                            <input 
                              type="text" value={brandBrownMid} onChange={(e) => setBrandBrownMid(e.target.value)}
                              placeholder="#8B7355" className="w-full bg-white border rounded-lg px-2 text-xs font-mono font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={handleResetTheme}
                          className="text-[9px] font-extrabold uppercase tracking-wider text-brand-red bg-brand-red/10 border border-brand-red/20 px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-brand-red/15 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Reset ke Default Tasik
                        </button>
                      </div>
                    </div>

                    {/* Right: AI upload area */}
                    <div className="space-y-4 border-l pl-0 lg:pl-6 border-dashed border-gray-200">
                      <div className="flex items-center justify-between border-b pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-orange flex items-center gap-1">
                          <Palette className="w-3.5 h-3.5" /> Deteksi Warna Dari Gambar
                        </span>
                        <span className="bg-brand-green/10 text-brand-green font-bold text-[8px] px-2 py-0.5 rounded uppercase">
                          Auto-Detector
                        </span>
                      </div>

                      <p className="text-[10px] text-gray-500 font-sans leading-relaxed">
                        Unggah pamflet kegiatan atau logo resmi daerah Anda. Sistem kami akan menganalisis visual gambar untuk mengekstrak dan memetakan warnanya secara instan.
                      </p>

                      <div className="border-2 border-dashed border-gray-300 hover:border-brand-green bg-gray-50/50 rounded-2xl p-4 text-center hover:bg-gray-50/80 transition-all relative">
                        <input 
                          type="file" accept="image/*" onChange={handleImageColorUpload}
                          className="hidden" id="theme-image-file"
                        />
                        <label htmlFor="theme-image-file" className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-3">
                          <Upload className="w-7 h-7 text-brand-green" />
                          <div className="text-xs font-bold text-brand-brown-dark">Pilih / Unggah Gambar Visual</div>
                          <div className="text-[9px] text-gray-400">Analisis instan JPG, PNG, WEBP</div>
                        </label>
                      </div>

                      {isExtracting && (
                        <div className="text-center py-2 text-brand-brown-mid font-bold animate-pulse text-[10px] flex items-center justify-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
                          Menganalisis skema warna gambar...
                        </div>
                      )}

                      {extractedColors.length > 0 && (
                        <div className="space-y-3 bg-gray-50 p-4 border border-gray-150 rounded-2xl">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Warna Terdeteksi ({extractedColors.length})</span>
                            <button 
                              type="button" onClick={() => autoAssignColors(extractedColors)}
                              className="text-[9px] bg-brand-green hover:bg-brand-green/90 text-white font-extrabold px-2.5 py-1 rounded-lg uppercase tracking-wider"
                            >
                              Auto-Assign
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2">
                            {extractedColors.map((hex) => (
                              <div key={hex} className="flex flex-col items-center p-1.5 border rounded-xl bg-white shadow-sm">
                                <div className="w-7 h-7 rounded-full border shadow-inner mb-1" style={{ backgroundColor: hex }} />
                                <span className="text-[8px] font-bold text-gray-600 mb-1">{hex}</span>
                                <div className="grid grid-cols-2 gap-1 w-full">
                                  <button 
                                    type="button" onClick={() => setBrandOrange(hex)} title="Set Warna Utama"
                                    className="bg-brand-orange/15 hover:bg-brand-orange/30 text-brand-orange font-black text-[8px] py-0.5 rounded text-center cursor-pointer"
                                  >
                                    O
                                  </button>
                                  <button 
                                    type="button" onClick={() => setBrandGreen(hex)} title="Set Warna Sekunder"
                                    className="bg-brand-green/15 hover:bg-brand-green/30 text-brand-green font-black text-[8px] py-0.5 rounded text-center cursor-pointer"
                                  >
                                    H
                                  </button>
                                  <button 
                                    type="button" onClick={() => setBrandBrownDark(hex)} title="Set Warna Gelap"
                                    className="bg-brand-brown-dark/15 hover:bg-brand-brown-dark/30 text-brand-brown-dark font-black text-[8px] py-0.5 rounded text-center cursor-pointer"
                                  >
                                    G
                                  </button>
                                  <button 
                                    type="button" onClick={() => setBrandBrownMid(hex)} title="Set Warna Penengah"
                                    className="bg-brand-brown-mid/15 hover:bg-brand-brown-mid/30 text-brand-brown-mid font-black text-[8px] py-0.5 rounded text-center cursor-pointer"
                                  >
                                    P
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-[8px] text-gray-400 font-sans italic text-center">
                            *Keterangan tombol: O (Oranye/Utama), H (Hijau/Sekunder), G (Gelap/Cokelat), P (Penengah).
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Unified Save Action bar */}
                <div className="pt-6 border-t flex justify-end">
                  <button
                    type="submit"
                    className="bg-brand-brown-dark hover:bg-brand-brown-dark/95 text-white font-extrabold text-xs px-6 py-3.5 rounded-xl uppercase shadow cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4 text-brand-orange" /> Simpan Pembaruan Landingpage
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DKC ADMIN TAB: PUSAT UNDUHAN BERKAS (INFORMASI) */}
        {activeTab === 'informasi' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Pusat Unduhan Berkas</h1>
              <p className="text-xs text-gray-500 font-mono mt-1">Kelola dokumen & informasi resmi yang tampil di landing page. Berkas diunggah ke Uploadcare, link-nya otomatis tercatat di Supabase.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form Tambah Berkas */}
              <div className="lg:col-span-1 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-green pb-2">
                  Tambah Berkas Baru
                </h3>
                <form onSubmit={handleSaveInformasi} className="space-y-4 text-xs font-mono">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Judul Berkas</label>
                    <input
                      type="text" required value={infoJudul} onChange={(e) => setInfoJudul(e.target.value)}
                      placeholder="Contoh: Jukran Adat Ambalan 2026"
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Deskripsi Singkat</label>
                    <textarea
                      rows={3} value={infoDeskripsi} onChange={(e) => setInfoDeskripsi(e.target.value)}
                      placeholder="Deskripsi singkat isi berkas ini"
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tipe Berkas</label>
                    <select
                      value={infoTipe} onChange={(e) => setInfoTipe(e.target.value as 'gambar' | 'dokumen')}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    >
                      <option value="dokumen">Dokumen / Jukran (PDF, DOCX)</option>
                      <option value="gambar">Aset Gambar / Media</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Unggah Berkas (ke Uploadcare)</label>
                    <input
                      type="file"
                      accept={infoTipe === 'gambar' ? 'image/*' : '.pdf,.doc,.docx,image/*'}
                      onChange={handleInformasiFileUpload}
                      disabled={infoUploading}
                      className="w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-[10px] text-gray-500 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200"
                    />
                    {infoUploading && (
                      <p className="mt-2 text-[10px] text-brand-orange font-bold">Mengunggah &amp; mengompres berkas...</p>
                    )}
                    {infoFileUrl && !infoUploading && (
                      <div className="mt-2 text-[10px] text-brand-green font-bold">
                        ✓ Berhasil diunggah: <a href={infoFileUrl} target="_blank" rel="noopener noreferrer" className="underline break-all">{infoFileUrl}</a>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={infoSaving || infoUploading || !infoFileUrl}
                    className="w-full bg-brand-brown-dark hover:bg-brand-orange disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs px-6 py-3.5 rounded-xl uppercase shadow cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> {infoSaving ? 'Menyimpan...' : 'Simpan ke Pusat Unduhan'}
                  </button>
                </form>
              </div>

              {/* List Berkas Terdaftar */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="font-extrabold text-base text-brand-brown-dark mb-4 tracking-tight border-b pb-2">
                  Daftar Berkas Terdaftar ({informasiList.length})
                </h3>
                <div className="space-y-3">
                  {informasiList.map((info) => (
                    <div key={info.id} className="p-4 bg-gray-50 border border-gray-150 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-mono">
                      <div>
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-2 inline-block ${
                          info.tipe === 'gambar' ? 'bg-[#F9A825]/15 text-[#F9A825]' : 'bg-[#00A99D]/15 text-[#00A99D]'
                        }`}>
                          {info.tipe === 'gambar' ? 'Aset Gambar / Media' : 'Dokumen / Jukran'}
                        </span>
                        <h4 className="font-extrabold text-sm text-brand-brown-dark tracking-tight leading-none">{info.judul}</h4>
                        {info.deskripsi && <p className="text-[10px] text-gray-400 mt-1 max-w-md">{info.deskripsi}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={info.file_url} target="_blank" rel="noopener noreferrer"
                          className="bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal px-3 py-2 rounded-xl font-bold text-[10px] flex items-center gap-1.5 uppercase tracking-wider"
                        >
                          <Eye className="w-3.5 h-3.5" /> Lihat
                        </a>
                        <button
                          onClick={() => handleDeleteInformasi(info.id)}
                          className="bg-brand-red/10 hover:bg-brand-red/20 text-brand-red px-3 py-2 rounded-xl font-bold text-[10px] flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                  {informasiList.length === 0 && (
                    <p className="text-center text-gray-400 py-6">Belum ada berkas yang diunggah.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DKC ADMIN TAB 9: VERIFIKASI LAPORAN 02GP & 01 DIKLAT */}
        {activeTab === 'laporan' && (
          <div className="space-y-8 animate-fade-in">
            <div className="border-b border-gray-200 pb-4">
              <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight flex items-center gap-2">
                <Award className="w-7 h-7 text-[#0E9F6E]" />
                Verifikasi & Penilaian Laporan Kwarran
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Proses laporan kegiatan 02GP dan 01 Diklat yang dikirimkan oleh Dewan Kerja Ranting se-Kabupaten Tasikmalaya. Berikan keterangan status serta poin keaktifan kegiatan.
              </p>
            </div>

            {/* Aksi Klasemen Toggle Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-brand-brown-dark flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-brand-orange" />
                  Pengaturan Klasemen Keaktifan Kwarran di Landingpage
                </h3>
                <p className="text-xs text-gray-500 max-w-xl">
                  Klasemen dihitung otomatis dari akumulasi poin laporan kegiatan 02GP &amp; 01 Diklat yang disetujui oleh admin. Anda dapat menampilkan atau menyembunyikan tabel klasemen dari halaman depan landingpage.
                </p>
              </div>

              <div>
                <button
                  onClick={() => handleToggleKlasemen(!showKlasemen)}
                  className={`w-full md:w-auto px-5 py-3 rounded-2xl font-black font-mono text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    showKlasemen
                      ? 'bg-[#0E9F6E] hover:bg-[#10B981] text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                >
                  {showKlasemen ? (
                    <>
                      <Check className="w-4 h-4" /> Tampil di Landingpage (Aktif)
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" /> Sembunyi dari Landingpage
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Aksi Visibilitas Menu Laporan Toggle Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 mt-6">
              <div className="space-y-1">
                <h3 className="text-sm font-extrabold text-brand-brown-dark flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#0E9F6E]" />
                  Visibilitas Menu Laporan di Dashboard DKR
                </h3>
                <p className="text-xs text-gray-500 max-w-xl">
                  Atur apakah menu "Laporan 02GP & 01 Diklat" dapat diakses oleh DKR di dashboard mereka. Gunakan ini untuk menonaktifkan fitur pelaporan sementara waktu.
                </p>
              </div>

              <div>
                <button
                  onClick={() => handleToggleLaporanMenu(!showLaporanMenu)}
                  className={`w-full md:w-auto px-5 py-3 rounded-2xl font-black font-mono text-xs uppercase tracking-wider shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    showLaporanMenu
                      ? 'bg-brand-orange hover:bg-orange-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                  }`}
                >
                  {showLaporanMenu ? (
                    <>
                      <Check className="w-4 h-4" /> Menu Laporan (Aktif)
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4" /> Menu Disembunyikan
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* List of Laporan Section */}
            <div className="bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden">
              
              {/* Header with Sub-tabs */}
              <div className="border-b border-gray-200 bg-slate-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setLaporanSubTab('pending');
                      setExpandedLaporanId(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
                      laporanSubTab === 'pending'
                        ? 'bg-white text-brand-brown-dark shadow-sm border border-slate-200/80'
                        : 'text-gray-500 hover:bg-slate-100/80'
                    }`}
                  >
                    🔵 Belum Terverifikasi
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {laporanList.filter(l => l.status === 'pending').length}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setLaporanSubTab('verified');
                      setExpandedLaporanId(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-2 cursor-pointer ${
                      laporanSubTab === 'verified'
                        ? 'bg-white text-brand-brown-dark shadow-sm border border-slate-200/80'
                        : 'text-gray-500 hover:bg-slate-100/80'
                    }`}
                  >
                    🟢 Sudah Terverifikasi
                    <span className="bg-emerald-100 text-[#0E9F6E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {laporanList.filter(l => l.status !== 'pending').length}
                    </span>
                  </button>
                </div>

                <div className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">
                  Total Laporan: {laporanList.length}
                </div>
              </div>

              {/* Laporan List Container */}
              {laporanLoading ? (
                <div className="py-12 text-center text-xs font-mono text-gray-500 italic">
                  Memuat berkas laporan...
                </div>
              ) : (
                (() => {
                  const filteredList = laporanList.filter(lap => {
                    if (laporanSubTab === 'pending') return lap.status === 'pending';
                    return lap.status !== 'pending';
                  });

                  if (filteredList.length === 0) {
                    return (
                      <div className="text-center py-16 px-4">
                        <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="text-sm font-extrabold text-slate-700 uppercase font-mono">Tidak ada laporan</h4>
                        <p className="text-xs text-gray-500 font-mono italic mt-1">
                          {laporanSubTab === 'pending'
                            ? 'Seluruh kiriman laporan kegiatan Kwarran telah diverifikasi.'
                            : 'Belum ada laporan kegiatan yang telah diverifikasi.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-gray-100">
                      {filteredList.map((lap, index) => {
                        const isExpanded = expandedLaporanId === lap.id;
                        return (
                          <div 
                            key={lap.id} 
                            className={`transition-colors ${
                              isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'
                            }`}
                          >
                            {/* Simple List Row (Compact & Clean) */}
                            <div 
                              onClick={() => setExpandedLaporanId(isExpanded ? null : lap.id)}
                              className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer select-none"
                            >
                              <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                <span className="text-xs font-bold font-mono text-gray-400 w-6 shrink-0">
                                  {(index + 1).toString().padStart(2, '0')}
                                </span>
                                <div className="min-w-0 space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="bg-brand-brown-dark text-white text-[9px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider">
                                      DKR {lap.kecamatan_nama}
                                    </span>
                                    <span className={`text-[9px] font-black font-mono uppercase px-2 py-0.5 rounded text-white ${
                                      lap.jenis_dokumen === '02GP' ? 'bg-[#0E9F6E]' : 'bg-[#1e3c72]'
                                    }`}>
                                      {lap.jenis_dokumen}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-mono">
                                      {new Date(lap.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  </div>
                                  <h4 className="text-sm font-bold text-slate-800 tracking-tight leading-snug truncate">
                                    {lap.nama_kegiatan}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                                {/* Status badge */}
                                <div>
                                  {lap.status === 'diterima' && (
                                    <span className="bg-[#0E9F6E]/10 text-[#0E9F6E] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono">
                                      🟢 Diterima (+{lap.point_bobot || 0} Pts)
                                    </span>
                                  )}
                                  {lap.status === 'ditolak' && (
                                    <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono">
                                      🔴 Ditolak
                                    </span>
                                  )}
                                  {lap.status === 'revisi' && (
                                    <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono">
                                      🟠 Revisi
                                    </span>
                                  )}
                                  {lap.status === 'pending' && (
                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase font-mono animate-pulse">
                                      🔵 Menunggu
                                    </span>
                                  )}
                                </div>

                                {/* Chevron indicator or click to action */}
                                <div className="text-xs font-mono font-bold text-[#0E9F6E] flex items-center gap-1">
                                  {isExpanded ? 'Tutup' : 'Detail'}
                                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </div>
                              </div>
                            </div>

                            {/* Expandable Detail Section */}
                            {isExpanded && (
                              <div className="px-6 pb-6 pt-2 bg-slate-50 border-t border-slate-100 space-y-4 text-xs font-mono animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-100">
                                  <div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Tanggal Pelaksanaan</span>
                                    <p className="font-bold text-slate-800 text-xs mt-0.5">{new Date(lap.tanggal_pelaksanaan).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Tempat Pelaksanaan</span>
                                    <p className="font-bold text-slate-800 text-xs mt-0.5">{lap.tempat_pelaksanaan}</p>
                                  </div>
                                  <div>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Poin Bobot Keaktifan</span>
                                    <p className="font-bold text-[#0E9F6E] text-xs mt-0.5">
                                      {lap.status === 'diterima' ? `+ ${lap.point_bobot || 0} Poin` : 'Belum/tidak dinilai'}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Deskripsi Ringkas Kegiatan:</span>
                                  <p className="text-xs text-slate-700 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100 font-sans">
                                    {lap.deskripsi_singkat}
                                  </p>
                                </div>

                                {lap.catatan_admin && (
                                  <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-1">
                                    <p className="text-[9px] font-black text-orange-600 uppercase tracking-wider">Catatan Keputusan Admin DKC:</p>
                                    <p className="text-xs text-slate-700 italic">"{lap.catatan_admin}"</p>
                                  </div>
                                )}

                                <div className="flex items-center justify-between gap-4 flex-wrap pt-2">
                                  <div>
                                    {lap.file_laporan_url ? (
                                      <a
                                        href={lap.file_laporan_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-[#0E9F6E]/10 hover:bg-[#0E9F6E]/20 text-[#0E9F6E] font-bold text-[10px] px-4 py-2.5 rounded-xl inline-flex items-center gap-1.5 uppercase transition-all"
                                      >
                                        📂 Unduh / Lihat Berkas Laporan Kwarran
                                      </a>
                                    ) : (
                                      <span className="text-xs text-gray-400 italic font-mono">Tidak ada berkas lampiran</span>
                                    )}
                                  </div>

                                  <div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setProcessingLaporan(lap);
                                        setProcessStatus(lap.status === 'pending' ? 'diterima' : lap.status as any);
                                        setProcessCatatan(lap.catatan_admin || '');
                                        setProcessPointBobot(lap.point_bobot || 10);
                                        setShowProcessModal(true);
                                      }}
                                      className="bg-brand-brown-dark hover:bg-brand-brown-dark/95 text-white font-extrabold font-mono text-[10px] px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-xs transition-all uppercase tracking-wider"
                                    >
                                      <Edit className="w-3.5 h-3.5 text-brand-orange" /> Proses Verifikasi &amp; Penilaian
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Verification Modal Dialog */}
            {showProcessModal && processingLaporan && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-extrabold text-base text-brand-brown-dark font-mono uppercase">
                      ⚖️ Proses Verifikasi Laporan Kegiatan
                    </h3>
                    <button
                      onClick={() => { setShowProcessModal(false); setProcessingLaporan(null); }}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-3 bg-slate-50 p-4 border border-slate-100 rounded-2xl">
                    <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest leading-none">Mengulas Laporan:</div>
                    <h4 className="font-extrabold text-sm text-brand-brown-dark uppercase">{processingLaporan.nama_kegiatan}</h4>
                    <p className="text-[10px] font-mono text-gray-500">
                      Oleh: <strong>DKR {processingLaporan.kecamatan_nama}</strong> | Kode: <strong>{processingLaporan.jenis_dokumen}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleProcessLaporan} className="space-y-4 text-xs font-mono">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Keputusan Status</label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setProcessStatus('diterima')}
                          className={`py-2 rounded-xl font-bold font-mono text-[10px] border transition-all cursor-pointer text-center ${
                            processStatus === 'diterima'
                              ? 'bg-[#0E9F6E]/10 border-[#0E9F6E] text-[#0E9F6E]'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          🟢 Diterima
                        </button>
                        <button
                          type="button"
                          onClick={() => setProcessStatus('revisi')}
                          className={`py-2 rounded-xl font-bold font-mono text-[10px] border transition-all cursor-pointer text-center ${
                            processStatus === 'revisi'
                              ? 'bg-orange-100 border-orange-500 text-orange-600'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          🟠 Butuh Revisi
                        </button>
                        <button
                          type="button"
                          onClick={() => setProcessStatus('ditolak')}
                          className={`py-2 rounded-xl font-bold font-mono text-[10px] border transition-all cursor-pointer text-center ${
                            processStatus === 'ditolak'
                              ? 'bg-red-100 border-red-500 text-red-600'
                              : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          🔴 Ditolak
                        </button>
                      </div>
                    </div>

                    {processStatus === 'diterima' && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Poin Nilai Kegiatan (Sesuai Bobot)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={100}
                          value={processPointBobot}
                          onChange={(e) => setProcessPointBobot(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10"
                        />
                        <p className="text-[9px] text-gray-400 italic mt-1">
                          *Poin akan diakumulasikan ke keaktifan prestasi Kwarran {processingLaporan.kecamatan_nama} se-Kabupaten Tasikmalaya.
                        </p>
                      </div>
                    )}

                    {(processStatus === 'revisi' || processStatus === 'ditolak') && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Penjelasan Penolakan / Catatan Revisi (Wajib)
                        </label>
                        <textarea
                          required
                          rows={3}
                          value={processCatatan}
                          onChange={(e) => setProcessCatatan(e.target.value)}
                          placeholder="Sebutkan berkas atau data apa yang kurang, atau alasan penolakan secara logis agar DKR dapat memperbaikinya..."
                          className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-red-500"
                        />
                      </div>
                    )}

                    {processStatus === 'diterima' && (
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Catatan Tambahan (Opsional)</label>
                        <input
                          type="text"
                          value={processCatatan}
                          onChange={(e) => setProcessCatatan(e.target.value)}
                          placeholder="Contoh: Selamat, pertahankan kinerja Kwarran Anda!"
                          className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-3 border-t">
                      <button
                        type="button"
                        onClick={() => { setShowProcessModal(false); setProcessingLaporan(null); }}
                        className="px-5 py-2.5 border border-slate-200 text-gray-500 font-bold rounded-xl hover:bg-gray-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={processSaving}
                        className="px-6 py-2.5 bg-[#0E9F6E] hover:bg-[#10B981] text-white font-extrabold rounded-xl shadow cursor-pointer"
                      >
                        {processSaving ? 'Memproses...' : 'Simpan Verifikasi'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
}
