import fs from 'fs';
import path from 'path';
import { 
  Profile, Kecamatan, DkcProfile, DkrProfile, Personalia, 
  Pangkalan, DataPotensial, Berita, AgendaKegiatan, 
  FormKegiatanConfig, PendaftaranPeserta, Informasi, SiteContent,
  Saka, SakaProfile, LaporanKegiatan
} from '../src/types';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure DB directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

interface DatabaseSchema {
  profiles: Profile[];
  kecamatan: Kecamatan[];
  saka: Saka[];
  dkc_profile: DkcProfile[];
  dkr_profile: DkrProfile[];
  saka_profile: SakaProfile[];
  personalia: Personalia[];
  pangkalan: Pangkalan[];
  data_potensial: DataPotensial[];
  berita: Berita[];
  agenda_kegiatan: AgendaKegiatan[];
  form_kegiatan_config: FormKegiatanConfig[];
  pendaftaran_peserta: PendaftaranPeserta[];
  informasi: Informasi[];
  site_content: SiteContent[];
  laporan_kegiatan: LaporanKegiatan[];
}

// Initial Seed Data
// Seluruh 39 Kecamatan di Kabupaten Tasikmalaya, Jawa Barat
const defaultKecamatan: Kecamatan[] = [
  { id: 'singaparna', nama_kecamatan: 'Singaparna', slug: 'singaparna', is_dkr_aktif: true, latitude: -7.3512, longitude: 108.1112 },
  { id: 'ciawi', nama_kecamatan: 'Ciawi', slug: 'ciawi', is_dkr_aktif: true, latitude: -7.1528, longitude: 108.1411 },
  { id: 'karangnunggal', nama_kecamatan: 'Karangnunggal', slug: 'karangnunggal', is_dkr_aktif: true, latitude: -7.6521, longitude: 108.1512 },
  { id: 'manonjaya', nama_kecamatan: 'Manonjaya', slug: 'manonjaya', is_dkr_aktif: true, latitude: -7.3533, longitude: 108.3112 },
  { id: 'taraju', nama_kecamatan: 'Taraju', slug: 'taraju', is_dkr_aktif: true, latitude: -7.4421, longitude: 108.0123 },
  { id: 'sukaraja', nama_kecamatan: 'Sukaraja', slug: 'sukaraja', is_dkr_aktif: false, latitude: -7.3912, longitude: 108.2312 },
  { id: 'bantarkalong', nama_kecamatan: 'Bantarkalong', slug: 'bantarkalong', is_dkr_aktif: true, latitude: -7.60, longitude: 108.04 },
  { id: 'bojongasih', nama_kecamatan: 'Bojongasih', slug: 'bojongasih', is_dkr_aktif: true, latitude: -7.58, longitude: 108.00 },
  { id: 'bojonggambir', nama_kecamatan: 'Bojonggambir', slug: 'bojonggambir', is_dkr_aktif: true, latitude: -7.50, longitude: 108.00 },
  { id: 'cibalong', nama_kecamatan: 'Cibalong', slug: 'cibalong', is_dkr_aktif: true, latitude: -7.68, longitude: 108.13 },
  { id: 'cigalontang', nama_kecamatan: 'Cigalontang', slug: 'cigalontang', is_dkr_aktif: true, latitude: -7.34, longitude: 108.04 },
  { id: 'cikalong', nama_kecamatan: 'Cikalong', slug: 'cikalong', is_dkr_aktif: true, latitude: -7.70, longitude: 108.00 },
  { id: 'cikatomas', nama_kecamatan: 'Cikatomas', slug: 'cikatomas', is_dkr_aktif: true, latitude: -7.65, longitude: 108.20 },
  { id: 'cineam', nama_kecamatan: 'Cineam', slug: 'cineam', is_dkr_aktif: true, latitude: -7.42, longitude: 108.30 },
  { id: 'cipatujah', nama_kecamatan: 'Cipatujah', slug: 'cipatujah', is_dkr_aktif: true, latitude: -7.73, longitude: 108.08 },
  { id: 'cisayong', nama_kecamatan: 'Cisayong', slug: 'cisayong', is_dkr_aktif: true, latitude: -7.22, longitude: 108.20 },
  { id: 'culamega', nama_kecamatan: 'Culamega', slug: 'culamega', is_dkr_aktif: true, latitude: -7.55, longitude: 107.92 },
  { id: 'gunungtanjung', nama_kecamatan: 'Gunungtanjung', slug: 'gunungtanjung', is_dkr_aktif: true, latitude: -7.30, longitude: 108.28 },
  { id: 'jamanis', nama_kecamatan: 'Jamanis', slug: 'jamanis', is_dkr_aktif: true, latitude: -7.18, longitude: 108.19 },
  { id: 'jatiwaras', nama_kecamatan: 'Jatiwaras', slug: 'jatiwaras', is_dkr_aktif: true, latitude: -7.50, longitude: 108.18 },
  { id: 'kadipaten', nama_kecamatan: 'Kadipaten', slug: 'kadipaten', is_dkr_aktif: true, latitude: -7.15, longitude: 108.20 },
  { id: 'karangjaya', nama_kecamatan: 'Karangjaya', slug: 'karangjaya', is_dkr_aktif: true, latitude: -7.48, longitude: 108.28 },
  { id: 'leuwisari', nama_kecamatan: 'Leuwisari', slug: 'leuwisari', is_dkr_aktif: true, latitude: -7.24, longitude: 108.11 },
  { id: 'mangunreja', nama_kecamatan: 'Mangunreja', slug: 'mangunreja', is_dkr_aktif: true, latitude: -7.32, longitude: 108.15 },
  { id: 'padakembang', nama_kecamatan: 'Padakembang', slug: 'padakembang', is_dkr_aktif: true, latitude: -7.28, longitude: 108.13 },
  { id: 'pagerageung', nama_kecamatan: 'Pagerageung', slug: 'pagerageung', is_dkr_aktif: true, latitude: -7.10, longitude: 108.25 },
  { id: 'pancatengah', nama_kecamatan: 'Pancatengah', slug: 'pancatengah', is_dkr_aktif: true, latitude: -7.63, longitude: 108.27 },
  { id: 'parungponteng', nama_kecamatan: 'Parungponteng', slug: 'parungponteng', is_dkr_aktif: true, latitude: -7.55, longitude: 107.98 },
  { id: 'puspahiang', nama_kecamatan: 'Puspahiang', slug: 'puspahiang', is_dkr_aktif: true, latitude: -7.42, longitude: 108.06 },
  { id: 'rajapolah', nama_kecamatan: 'Rajapolah', slug: 'rajapolah', is_dkr_aktif: true, latitude: -7.14, longitude: 108.17 },
  { id: 'salawu', nama_kecamatan: 'Salawu', slug: 'salawu', is_dkr_aktif: true, latitude: -7.38, longitude: 108.02 },
  { id: 'salopa', nama_kecamatan: 'Salopa', slug: 'salopa', is_dkr_aktif: true, latitude: -7.55, longitude: 108.15 },
  { id: 'sariwangi', nama_kecamatan: 'Sariwangi', slug: 'sariwangi', is_dkr_aktif: true, latitude: -7.19, longitude: 108.13 },
  { id: 'sodonghilir', nama_kecamatan: 'Sodonghilir', slug: 'sodonghilir', is_dkr_aktif: true, latitude: -7.48, longitude: 107.97 },
  { id: 'sukahening', nama_kecamatan: 'Sukahening', slug: 'sukahening', is_dkr_aktif: true, latitude: -7.20, longitude: 108.17 },
  { id: 'sukarame', nama_kecamatan: 'Sukarame', slug: 'sukarame', is_dkr_aktif: true, latitude: -7.34, longitude: 108.09 },
  { id: 'sukaratu', nama_kecamatan: 'Sukaratu', slug: 'sukaratu', is_dkr_aktif: true, latitude: -7.27, longitude: 108.17 },
  { id: 'sukaresik', nama_kecamatan: 'Sukaresik', slug: 'sukaresik', is_dkr_aktif: true, latitude: -7.12, longitude: 108.22 },
  { id: 'tanjungjaya', nama_kecamatan: 'Tanjungjaya', slug: 'tanjungjaya', is_dkr_aktif: true, latitude: -7.37, longitude: 108.33 },
];

const defaultDkcProfile: DkcProfile[] = [{
  id: 'dkc-main',
  visi: 'Mewujudkan Pramuka Penegak dan Pandega Kabupaten Tasikmalaya yang aktif, berkarakter, berdaya saing tinggi, dan berjiwa mengabdi tiada batas bagi kemajuan bangsa.',
  misi: '1. Mengoptimalkan peran Dewan Kerja Cabang dan Ranting sebagai wadah pembinaan kepemimpinan.\n2. Mengembangkan kegiatan Penegak dan Pandega yang inovatif, rekreatif, dan berbasis teknologi.\n3. Memperkokoh solidaritas, budi pekerti luhur, dan pengabdian masyarakat (Abdimas) di setiap jenjang.\n4. Membangun kolaborasi sinergis dengan seluruh stakeholder dan instansi kepemudaan se-Kabupaten Tasikmalaya.',
  updated_at: new Date().toISOString()
}];

const defaultDkrProfiles: DkrProfile[] = [
  { id: 'dkr-singaparna', kecamatan_id: 'singaparna', deskripsi: 'DKR Singaparna aktif membina pangkalan tingkat SMA/SMK di ibu kota Kabupaten. Berfokus pada sinergitas kepemimpinan pemuda.', updated_at: new Date().toISOString() },
  { id: 'dkr-ciawi', kecamatan_id: 'ciawi', deskripsi: 'DKR Ciawi terletak di gerbang utara Kabupaten Tasikmalaya, memiliki reputasi kuat dalam kegiatan kepramukaan lintas pangkalan.', updated_at: new Date().toISOString() },
  { id: 'dkr-karangnunggal', kecamatan_id: 'karangnunggal', deskripsi: 'DKR Karangnunggal mendominasi wilayah selatan Tasikmalaya dengan segudang prestasi pramuka peduli dan bakti masyarakat pesisir.', updated_at: new Date().toISOString() },
  { id: 'dkr-manonjaya', kecamatan_id: 'manonjaya', deskripsi: 'DKR Manonjaya mengutamakan kedisiplinan dan pembentukan karakter kepemimpinan berbasis budaya lokal priangan.', updated_at: new Date().toISOString() },
  { id: 'dkr-taraju', kecamatan_id: 'taraju', deskripsi: 'DKR Taraju membina anggota pramuka di wilayah pegunungan yang asri dengan fokus kelestarian alam dan ekopramuka.', updated_at: new Date().toISOString() },
];

const defaultPersonalia: Personalia[] = [
  // DKC
  { id: 'p-dkc-1', owner_type: 'dkc', nama: 'Kak Fajar Ramadhan', jabatan: 'Ketua DKC', golongan: 'pandega', foto_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400', urutan: 1 },
  { id: 'p-dkc-2', owner_type: 'dkc', nama: 'Kak Linda Permatasari', jabatan: 'Wakil Ketua DKC', golongan: 'pandega', foto_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', urutan: 2 },
  { id: 'p-dkc-3', owner_type: 'dkc', nama: 'Kak Irfan Hakim', jabatan: 'Sekretaris I', golongan: 'penegak', foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', urutan: 3 },
  { id: 'p-dkc-4', owner_type: 'dkc', nama: 'Kak Rina Marlina', jabatan: 'Bendahara', golongan: 'pandega', foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', urutan: 4 },
  { id: 'p-dkc-5', owner_type: 'dkc', nama: 'Kak Deden Suherman', jabatan: 'Ketua Bidang Kajian Kepramukaan', golongan: 'pembina', foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', urutan: 5 },
  
  // DKR Singaparna
  { id: 'p-singa-1', owner_type: 'dkr', kecamatan_id: 'singaparna', nama: 'Kak Aldi Wijaya', jabatan: 'Ketua DKR Singaparna', golongan: 'penegak', foto_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400', urutan: 1 },
  { id: 'p-singa-2', owner_type: 'dkr', kecamatan_id: 'singaparna', nama: 'Kak Nisa Fitriani', jabatan: 'Sekretaris DKR', golongan: 'penegak', foto_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400', urutan: 2 },
  
  // DKR Ciawi
  { id: 'p-ciawi-1', owner_type: 'dkr', kecamatan_id: 'ciawi', nama: 'Kak Guntur Pratama', jabatan: 'Ketua DKR Ciawi', golongan: 'pandega', foto_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400', urutan: 1 },
  { id: 'p-ciawi-2', owner_type: 'dkr', kecamatan_id: 'ciawi', nama: 'Kak Amelia Rosa', jabatan: 'Wakil Ketua DKR', golongan: 'penegak', foto_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400', urutan: 2 },

  // SAKA Bhayangkara
  { id: 'p-saka-b1', owner_type: 'saka', saka_id: 'bhayangkara', nama: 'Kak Hendra Kurniawan', jabatan: 'Pamong Saka Bhayangkara', golongan: 'pembina', foto_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400', urutan: 1 },
  { id: 'p-saka-b2', owner_type: 'saka', saka_id: 'bhayangkara', nama: 'Kak Desi Rahmawati', jabatan: 'Ketua Dewan Saka', golongan: 'pandega', foto_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400', urutan: 2 },

  // SAKA Bakti Husada
  { id: 'p-saka-bh1', owner_type: 'saka', saka_id: 'baktihusada', nama: 'Kak Dr. Rahmat Hidayat', jabatan: 'Pamong Saka Bakti Husada', golongan: 'pembina', foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', urutan: 1 },
  { id: 'p-saka-bh2', owner_type: 'saka', saka_id: 'baktihusada', nama: 'Kak Fitri Handayani', jabatan: 'Ketua Dewan Saka', golongan: 'pandega', foto_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400', urutan: 2 },
];

const defaultPangkalan: Pangkalan[] = [
  { id: 'pk-1', kecamatan_id: 'singaparna', nama_pangkalan: 'Gugus Depan SMA Negeri 1 Singaparna', jenis: 'SMA', status_aktif: true },
  { id: 'pk-2', kecamatan_id: 'singaparna', nama_pangkalan: 'Gugus Depan SMK Negeri 1 Singaparna', jenis: 'SMK', status_aktif: true },
  { id: 'pk-3', kecamatan_id: 'ciawi', nama_pangkalan: 'Gugus Depan SMA Negeri 1 Ciawi', jenis: 'SMA', status_aktif: true },
  { id: 'pk-4', kecamatan_id: 'ciawi', nama_pangkalan: 'Gugus Depan MA Negeri 1 Tasikmalaya (Ciawi)', jenis: 'MA', status_aktif: true },
  { id: 'pk-5', kecamatan_id: 'karangnunggal', nama_pangkalan: 'Gugus Depan SMA Negeri 1 Karangnunggal', jenis: 'SMA', status_aktif: true },
  { id: 'pk-6', kecamatan_id: 'manonjaya', nama_pangkalan: 'Gugus Depan SMK Pasundan Manonjaya', jenis: 'SMK', status_aktif: true },
  { id: 'pk-7', kecamatan_id: 'singaparna', nama_pangkalan: 'Racana Universitas Cipasung Singaparna', jenis: 'Perguruan Tinggi', status_aktif: true },
];

const defaultDataPotensial: DataPotensial[] = [
  { id: 'dp-1', kecamatan_id: 'singaparna', periode: '2026', jumlah_penegak_l: 240, jumlah_penegak_p: 280, jumlah_pandega_l: 35, jumlah_pandega_p: 45, updated_by: 'singaparna@dkctasik.org', updated_at: new Date().toISOString() },
  { id: 'dp-2', kecamatan_id: 'ciawi', periode: '2026', jumlah_penegak_l: 185, jumlah_penegak_p: 195, jumlah_pandega_l: 20, jumlah_pandega_p: 25, updated_by: 'ciawi@dkctasik.org', updated_at: new Date().toISOString() },
  { id: 'dp-3', kecamatan_id: 'karangnunggal', periode: '2026', jumlah_penegak_l: 310, jumlah_penegak_p: 290, jumlah_pandega_l: 45, jumlah_pandega_p: 50, updated_by: 'karangnunggal@dkctasik.org', updated_at: new Date().toISOString() },
  { id: 'dp-4', kecamatan_id: 'manonjaya', periode: '2026', jumlah_penegak_l: 150, jumlah_penegak_p: 170, jumlah_pandega_l: 15, jumlah_pandega_p: 18, updated_by: 'admin@dkctasik.org', updated_at: new Date().toISOString() },
  { id: 'dp-5', kecamatan_id: 'taraju', periode: '2026', jumlah_penegak_l: 110, jumlah_penegak_p: 120, jumlah_pandega_l: 10, jumlah_pandega_p: 12, updated_by: 'admin@dkctasik.org', updated_at: new Date().toISOString() },
];

const defaultBerita: Berita[] = [
  {
    id: 'b-1',
    judul: 'Sidang Paripurna Cabang (SIDPARCAB) Tasikmalaya Sukses Merumuskan Program Strategis',
    slug: 'sidparcab-tasikmalaya-sukses-merumuskan-program',
    konten: '<p>Sidang Paripurna Cabang (Sidparcab) Gerakan Pramuka Kabupaten Tasikmalaya resmi diselenggarakan dengan meriah di Aula Dinas Pendidikan dan Kebudayaan. Acara ini dihadiri oleh perwakilan Dewan Kerja Ranting (DKR) dari seluruh penjuru Tasikmalaya untuk menyusun program kerja pembinaan Pramuka Penegak dan Pandega setahun ke depan.</p><p>Ketua DKC Kabupaten Tasikmalaya menyampaikan apresiasi mendalam atas dedikasi para kader muda Pramuka yang terus aktif berkolaborasi dan berkarya nyata.</p>',
    gambar_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    author_id: 'admin-id',
    author_name: 'Kak Fajar (DKC)',
    status: 'approved',
    published_at: new Date().toISOString()
  },
  {
    id: 'b-2',
    judul: 'Aksi Pramuka Peduli DKR Karangnunggal Bantu Bersihkan Pesisir Pantai Cipatujah',
    slug: 'aksi-pramuka-peduli-dkr-karangnunggal-bersihkan-pantai',
    konten: '<p>Anggota Pramuka Penegak dan Pandega yang tergabung dalam DKR Karangnunggal menggelar aksi nyata peduli lingkungan dengan menyisir dan membersihkan tumpukan sampah plastik di sepanjang pantai selatan Cipatujah. Aksi ini mendapat dukungan hangat dari warga setempat dan instansi pariwisata.</p>',
    gambar_url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    author_id: 'user-karangnunggal',
    author_name: 'DKR Karangnunggal',
    kecamatan_id: 'karangnunggal',
    kecamatan_nama: 'Karangnunggal',
    status: 'approved',
    published_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'b-3',
    judul: 'Latihan Kepemimpinan Tingkat Ranting DKR Singaparna Persiapkan Pemimpin Masa Depan',
    slug: 'latihan-kepemimpinan-ranting-dkr-singaparna',
    konten: '<p>Dalam rangka menyiapkan kader penerus gerakan kepramukaan, DKR Singaparna menyelenggarakan LKP (Latihan Kepemimpinan Pramuka) bagi seluruh pengurus Dewan Ambalan se-Kecamatan Singaparna. Pelatihan difokuskan pada manajemen organisasi dan kepemimpinan adaptif di era digital.</p>',
    gambar_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=800',
    author_id: 'user-singaparna',
    author_name: 'DKR Singaparna',
    kecamatan_id: 'singaparna',
    kecamatan_nama: 'Singaparna',
    status: 'approved',
    published_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'b-4',
    judul: 'Rencana Kegiatan Raimuna Ranting DKR Ciawi Tahun 2026',
    slug: 'rencana-raimuna-ranting-dkr-ciawi-2026',
    konten: '<p>DKR Ciawi mengajukan rencana pelaksanaan Raimuna Ranting yang mengusung tema kreativitas pemuda masa kini. Pertemuan akbar ini dirancang untuk mewadahi unjuk bakat budaya dan sains kepramukaan antar pangkalan se-Ciawi.</p>',
    gambar_url: 'https://images.unsplash.com/photo-1472289065668-ce650ac443d2?auto=format&fit=crop&q=80&w=800',
    author_id: 'user-ciawi',
    author_name: 'DKR Ciawi',
    kecamatan_id: 'ciawi',
    kecamatan_nama: 'Ciawi',
    status: 'pending',
    published_at: new Date().toISOString()
  }
];

const defaultAgendaKegiatan: AgendaKegiatan[] = [
  {
    id: 'a-1',
    nama_kegiatan: 'SIDPARDA (Sidang Paripurna Daerah) Jawa Barat 2026 - Kontingen Tasikmalaya',
    tempat: 'Pusdiklatda Karang Pramuka, Bandung',
    tanggal_mulai: '2026-07-20',
    tanggal_selesai: '2026-07-22',
    estimasi_peserta: 12,
    jenis: 'partisipasi',
    tingkat: 'provinsi',
    status_publikasi: true,
    is_aktif_pendaftaran: false,
    is_tanggal_diputuskan: true
  },
  {
    id: 'a-2',
    nama_kegiatan: 'Kemah Bakti Penegak dan Pandega Kabupaten Tasikmalaya 2026',
    tempat: 'Bumi Perkemahan Gunung Galunggung',
    tanggal_mulai: '2026-08-14',
    tanggal_selesai: '2026-08-17',
    estimasi_peserta: 500,
    jenis: 'mandiri',
    tingkat: 'kabupaten',
    status_publikasi: true,
    is_aktif_pendaftaran: true,
    is_tanggal_diputuskan: true
  },
  {
    id: 'a-3',
    nama_kegiatan: 'Gelar Karya Ekopramuka Kreatif Ranting Ciawi',
    tempat: 'Lapangan Alun-Alun Ciawi',
    tanggal_mulai: '2026-09-05',
    tanggal_selesai: '2026-09-06',
    estimasi_peserta: 150,
    jenis: 'mandiri',
    tingkat: 'kabupaten',
    kecamatan_id: 'ciawi',
    kecamatan_nama: 'Ciawi',
    status_publikasi: true,
    is_aktif_pendaftaran: false,
    is_tanggal_diputuskan: true
  },
  {
    id: 'a-4',
    nama_kegiatan: 'Raimuna Nasional XIII 2026 (Kontingen Tasikmalaya)',
    tempat: 'Bumi Perkemahan Pramuka Cibubur, Jakarta',
    tanggal_mulai: '2026-08-20',
    tanggal_selesai: '2026-08-25',
    estimasi_peserta: 32,
    jenis: 'partisipasi',
    tingkat: 'nasional',
    status_publikasi: true,
    is_aktif_pendaftaran: false,
    is_tanggal_diputuskan: true
  },
  {
    id: 'a-5',
    nama_kegiatan: 'World Scout Jamboree 2026 (Partisipasi Delegasi Internasional)',
    tempat: 'Saemangeum, South Korea',
    tanggal_mulai: '2026-08-01',
    tanggal_selesai: '2026-08-10',
    estimasi_peserta: 5,
    jenis: 'partisipasi',
    tingkat: 'internasional',
    status_publikasi: true,
    is_aktif_pendaftaran: false,
    is_tanggal_diputuskan: true
  },
  {
    id: 'a-6',
    nama_kegiatan: 'Pelatihan Jurnalistik Kehumasan & Desain Grafis DKC Tasikmalaya',
    tempat: 'Aula Sekretariat Kwarcab Tasikmalaya',
    tanggal_mulai: '2026-08-01',
    tanggal_selesai: '2026-08-01',
    estimasi_peserta: 80,
    jenis: 'mandiri',
    tingkat: 'kabupaten',
    status_publikasi: true,
    is_aktif_pendaftaran: false,
    is_tanggal_diputuskan: false,
    bulan_rencana: '2026-08'
  },
  {
    id: 'a-7',
    nama_kegiatan: 'Rapat Koordinasi Kewilayahan Priangan Timur',
    tempat: 'Sekretariat Kwarcab Ciamis (Tentative)',
    tanggal_mulai: '2026-07-01',
    tanggal_selesai: '2026-07-01',
    estimasi_peserta: 40,
    jenis: 'partisipasi',
    tingkat: 'provinsi',
    status_publikasi: true,
    is_aktif_pendaftaran: false,
    is_tanggal_diputuskan: false,
    bulan_rencana: '2026-07'
  }
];

const defaultFormConfig: FormKegiatanConfig[] = [
  {
    id: 'fc-2',
    agenda_id: 'a-2',
    tipe_pendaftaran: 'keduanya',
    form_schema: [
      { id: 'f1', label: 'Nama Lengkap Pendaftar', type: 'text', required: true },
      { id: 'f2', label: 'Asal Gugus Depan / Pangkalan', type: 'text', required: true },
      { id: 'f3', label: 'Nomor Anggota / KTA', type: 'text', required: false },
      { id: 'f4', label: 'Golongan Kepramukaan', type: 'select', required: true, options: ['Penegak Bantara', 'Penegak Laksana', 'Penegak Garuda', 'Pandega'] },
      { id: 'f5', label: 'Nomor WhatsApp Aktif', type: 'text', required: true },
      { id: 'f6', label: 'Ukuran Kaos Kegiatan', type: 'select', required: true, options: ['S', 'M', 'L', 'XL', 'XXL'] },
      { id: 'f7', label: 'Catatan Khusus Medis (Jika Ada)', type: 'textarea', required: false }
    ]
  }
];

const defaultPendaftaran: PendaftaranPeserta[] = [
  {
    id: 'reg-1',
    agenda_id: 'a-2',
    tipe: 'mandiri',
    kecamatan_id: 'singaparna',
    data_peserta: {
      f1: 'Ahmad Fauzi',
      f2: 'SMAN 1 Singaparna',
      f3: '12.26.01.0024',
      f4: 'Penegak Bantara',
      f5: '081234567890',
      f6: 'L',
      f7: 'Alergi makanan laut'
    },
    created_at: new Date().toISOString()
  }
];

const defaultInformasi: Informasi[] = [
  {
    id: 'info-1',
    judul: 'Petunjuk Penyelenggaraan Kemah Bakti Penegak Pandega Tasikmalaya 2026',
    deskripsi: 'Panduan teknis pelaksanaan kemah bakti, perlengkapan pribadi dan kontingen, serta tata tertib perkemahan di Buper Galunggung.',
    file_url: '#',
    tipe: 'dokumen',
    created_at: new Date().toISOString()
  },
  {
    id: 'info-2',
    judul: 'Logo Resmi Kemah Bakti Penegak Pandega 2026 (PNG HD)',
    deskripsi: 'Aset grafis logo resmi untuk kebutuhan publikasi umbul-umbul, banner pangkalan, dan sosial media.',
    file_url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&q=80&w=400',
    tipe: 'gambar',
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

const defaultSiteContent: SiteContent[] = [
  {
    id: 'sc-hero',
    section_key: 'hero',
    content: {
      title: 'Dewan Kerja Cabang',
      subtitle: 'Kabupaten Tasikmalaya',
      lead: 'Wadah Pembinaan Pramuka Penegak dan Pandega Tasikmalaya. Berkarakter, bersaudara, berdaya saing, berbakti tiada batas.',
      cta_text: 'Jelajahi Kegiatan',
      badge_text: 'Satyaku Kudarmakan, Darmaku Kubaktikan',
      bg_image_url: 'https://media.suara.com/pictures/970x544/2023/08/14/79829-hari-pramuka-raimuna-nasional-xii.jpg',
      bg_opacity: 0.4
    },
    updated_at: new Date().toISOString()
  },
  {
    id: 'sc-sosmed',
    section_key: 'sosmed',
    content: {
      instagram: '@dkctasikmalaya',
      tiktok: '@dkctasik',
      youtube: 'DKC TV Tasikmalaya',
      alamat: 'Jl. Pemuda No. 12, Singaparna, Tasikmalaya, Jawa Barat, 46411',
      email: 'info@dkctasikmalaya.org',
      telpon: '0265-123456'
    },
    updated_at: new Date().toISOString()
  }
];

const defaultSaka: Saka[] = [
  { id: 'bhayangkara', nama_saka: 'Saka Bhayangkara', slug: 'bhayangkara', deskripsi: 'Saka Bhayangkara (Kepolisian) tingkat Kabupaten Tasikmalaya aktif membina karakter disiplin, kamtibmas, dan kebencanaan.', is_aktif: true, foto_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400' },
  { id: 'baktihusada', nama_saka: 'Saka Bakti Husada', slug: 'baktihusada', deskripsi: 'Saka Bakti Husada (Kesehatan) tingkat Kabupaten Tasikmalaya berfokus pada pengabdian masyarakat di bidang kesehatan dan imunisasi.', is_aktif: true, foto_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
  { id: 'wanabakti', nama_saka: 'Saka Wanabakti', slug: 'wanabakti', deskripsi: 'Saka Wanabakti (Kehutanan) tingkat Kabupaten Tasikmalaya berfokus pada kelestarian hutan, konservasi alam, dan ekosistem.', is_aktif: true, foto_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
  { id: 'wirakartika', nama_saka: 'Saka Wira Kartika', slug: 'wirakartika', deskripsi: 'Saka Wira Kartika (TNI AD) tingkat Kabupaten Tasikmalaya membina bela negara, ketangkasan, dan cinta tanah air.', is_aktif: true, foto_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400' },
  { id: 'kencana', nama_saka: 'Saka Kencana', slug: 'kencana', deskripsi: 'Saka Kencana (Keluarga Berencana) tingkat Kabupaten Tasikmalaya berfokus pada kependudukan, kesehatan reproduksi remaja, dan generasi berencana.', is_aktif: true, foto_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
];

const defaultSakaProfiles: SakaProfile[] = [
  { id: 'sp-bhayangkara', saka_id: 'bhayangkara', deskripsi: 'Saka Bhayangkara (Kepolisian) tingkat Kabupaten Tasikmalaya aktif membina karakter disiplin, kamtibmas, dan kebencanaan.', updated_at: new Date().toISOString() },
  { id: 'sp-baktihusada', saka_id: 'baktihusada', deskripsi: 'Saka Bakti Husada (Kesehatan) tingkat Kabupaten Tasikmalaya berfokus pada pengabdian masyarakat di bidang kesehatan dan imunisasi.', updated_at: new Date().toISOString() },
  { id: 'sp-wanabakti', saka_id: 'wanabakti', deskripsi: 'Saka Wanabakti (Kehutanan) tingkat Kabupaten Tasikmalaya berfokus pada kelestarian hutan, konservasi alam, dan ekosistem.', updated_at: new Date().toISOString() },
  { id: 'sp-wirakartika', saka_id: 'wirakartika', deskripsi: 'Saka Wira Kartika (TNI AD) tingkat Kabupaten Tasikmalaya membina bela negara, ketangkasan, dan cinta tanah air.', updated_at: new Date().toISOString() },
  { id: 'sp-kencana', saka_id: 'kencana', deskripsi: 'Saka Kencana (Keluarga Berencana) tingkat Kabupaten Tasikmalaya berfokus pada kependudukan, kesehatan reproduksi remaja, dan generasi berencana.', updated_at: new Date().toISOString() },
];

const defaultProfiles: Profile[] = [
  { id: 'p-admin', user_id: 'admin-uid', role: 'admin', nama: 'Kak Fajar Ramadhan (DKC)', created_at: new Date().toISOString() },
  { id: 'p-singaparna', user_id: 'singaparna-uid', role: 'user', kecamatan_id: 'singaparna', nama: 'DKR Singaparna', created_at: new Date().toISOString() },
  { id: 'p-ciawi', user_id: 'ciawi-uid', role: 'user', kecamatan_id: 'ciawi', nama: 'DKR Ciawi', created_at: new Date().toISOString() },
  { id: 'p-karangnunggal', user_id: 'karangnunggal-uid', role: 'user', kecamatan_id: 'karangnunggal', nama: 'DKR Karangnunggal', created_at: new Date().toISOString() },
  { id: 'p-bhayangkara', user_id: 'bhayangkara-uid', role: 'saka', saka_id: 'bhayangkara', nama: 'Saka Bhayangkara', created_at: new Date().toISOString() },
  { id: 'p-baktihusada', user_id: 'baktihusada-uid', role: 'saka', saka_id: 'baktihusada', nama: 'Saka Bakti Husada', created_at: new Date().toISOString() },
];

const defaultLaporanKegiatan: LaporanKegiatan[] = [
  {
    id: 'lap-1',
    kecamatan_id: 'singaparna',
    kecamatan_nama: 'Singaparna',
    jenis_dokumen: '02GP',
    nama_kegiatan: 'Penyelenggaraan Lomba Tingkat II (LT-II) Kwarran Singaparna 2026',
    tanggal_pelaksanaan: '2026-05-10',
    tempat_pelaksanaan: 'Lapangan Ciawi-Singaparna, Tasikmalaya',
    deskripsi_singkat: 'Laporan pertanggungjawaban kegiatan pembinaan LT-II tingkat Kwartir Ranting Singaparna.',
    file_laporan_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    status: 'diterima',
    point_bobot: 15,
    created_at: '2026-05-15T10:00:00.000Z'
  },
  {
    id: 'lap-2',
    kecamatan_id: 'singaparna',
    kecamatan_nama: 'Singaparna',
    jenis_dokumen: '01DIKLAT',
    nama_kegiatan: 'Pendidikan & Latihan Pramuka Peduli Unit Singaparna',
    tanggal_pelaksanaan: '2026-06-01',
    tempat_pelaksanaan: 'Aula Kecamatan Singaparna',
    deskripsi_singkat: 'Diklat peningkatan kecakapan penanggulangan bencana bagi anggota Penegak dan Pandega.',
    file_laporan_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    status: 'revisi',
    catatan_admin: 'Mohon lampirkan daftar hadir peserta serta dokumentasi foto setiap materi pelatihan.',
    created_at: '2026-06-05T14:30:00.000Z'
  },
  {
    id: 'lap-3',
    kecamatan_id: 'ciawi',
    kecamatan_nama: 'Ciawi',
    jenis_dokumen: '02GP',
    nama_kegiatan: 'Sidang Paripurna Ranting (Sidparran) Ciawi 2026',
    tanggal_pelaksanaan: '2026-03-20',
    tempat_pelaksanaan: 'Aula Kwarran Ciawi',
    deskripsi_singkat: 'Laporan hasil keputusan Sidang Paripurna Ranting Ciawi tahun 2026.',
    file_laporan_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    status: 'pending',
    created_at: '2026-03-25T09:00:00.000Z'
  }
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        
        // Defensive initialization of new collections
        if (!parsed.saka) parsed.saka = defaultSaka;
        if (!parsed.saka_profile) parsed.saka_profile = defaultSakaProfiles;
        if (!parsed.laporan_kegiatan) parsed.laporan_kegiatan = defaultLaporanKegiatan;

        // Defensively ensure hero content has background config
        if (parsed.site_content) {
          const hero = parsed.site_content.find((sc: any) => sc.section_key === 'hero');
          if (hero && hero.content) {
            if (hero.content.bg_image_url === undefined) {
              hero.content.bg_image_url = 'https://media.suara.com/pictures/970x544/2023/08/14/79829-hari-pramuka-raimuna-nasional-xii.jpg';
            }
            if (hero.content.bg_opacity === undefined) {
              hero.content.bg_opacity = 0.4;
            }
          }
        }
        
        return parsed;
      }
    } catch (e) {
      console.error("Error loading database:", e);
    }
    
    // Default fallback database with seed data
    const initialDb: DatabaseSchema = {
      profiles: defaultProfiles,
      kecamatan: defaultKecamatan,
      saka: defaultSaka,
      dkc_profile: defaultDkcProfile,
      dkr_profile: defaultDkrProfiles,
      saka_profile: defaultSakaProfiles,
      personalia: defaultPersonalia,
      pangkalan: defaultPangkalan,
      data_potensial: defaultDataPotensial,
      berita: defaultBerita,
      agenda_kegiatan: defaultAgendaKegiatan,
      form_kegiatan_config: defaultFormConfig,
      pendaftaran_peserta: defaultPendaftaran,
      informasi: defaultInformasi,
      site_content: defaultSiteContent,
      laporan_kegiatan: defaultLaporanKegiatan,
    };
    
    this.saveData(initialDb);
    return initialDb;
  }

  private saveData(db: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    } catch (e) {
      console.error("Error writing database:", e);
    }
  }

  public get(): DatabaseSchema {
    return this.data;
  }

  public update(updater: (db: DatabaseSchema) => void): DatabaseSchema {
    updater(this.data);
    this.saveData(this.data);
    return this.data;
  }
}

export const dbInstance = new Database();
export default dbInstance;
