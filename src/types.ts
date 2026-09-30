export interface Profile {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'saka';
  kecamatan_id?: string;
  saka_id?: string;
  nama: string;
  created_at: string;
}

export interface Kecamatan {
  id: string;
  nama_kecamatan: string;
  slug: string;
  is_dkr_aktif: boolean;
  wilayah?: string;
  latitude: number;
  longitude: number;
}

export interface Saka {
  id: string;
  nama_saka: string;
  slug: string;
  deskripsi: string;
  is_aktif: boolean;
  latitude?: number;
  longitude?: number;
  foto_url?: string;
}

export interface DkcProfile {
  id: string;
  visi: string;
  misi: string;
  updated_at: string;
}

export interface DkrProfile {
  id: string;
  kecamatan_id: string;
  deskripsi: string;
  logo_url?: string;
  medsos_ig?: string;
  medsos_yt?: string;
  medsos_tk?: string;
  updated_at: string;
}

export interface SakaProfile {
  id: string;
  saka_id: string;
  deskripsi: string;
  logo_url?: string;
  updated_at: string;
}

export interface PersonaliaEntry {
  tahun: string;
  judul: string;
  keterangan?: string;
}

export interface Personalia {
  id: string;
  owner_type: 'dkc' | 'dkr' | 'saka';
  kecamatan_id?: string;
  saka_id?: string;
  foto_url: string;
  nama: string;
  jabatan: string;
  golongan: 'penegak' | 'pandega' | 'pembina' | 'lainnya';
  urutan: number;
  tentang?: string | null;
  foto_background_url?: string | null;
  riwayat_organisasi?: PersonaliaEntry[] | null;
  riwayat_pendidikan?: PersonaliaEntry[] | null;
  prestasi_akademik?: PersonaliaEntry[] | null;
  prestasi_non_akademik?: PersonaliaEntry[] | null;
  owner_nama?: string; // hanya diisi oleh GET /api/personalia/:id
  owner_slug?: string | null;
}

export interface Pangkalan {
  id: string;
  kecamatan_id?: string;
  saka_id?: string;
  nama_pangkalan: string;
  jenis: 'SMA' | 'SMK' | 'MA' | 'Perguruan Tinggi' | 'lainnya';
  status_aktif: boolean;
}

export interface DataPotensial {
  id: string;
  kecamatan_id?: string;
  saka_id?: string;
  periode: string; // e.g. "2026" or "2026-Semester 1"
  jumlah_penegak_l: number;
  jumlah_penegak_p: number;
  jumlah_pandega_l: number;
  jumlah_pandega_p: number;
  updated_by: string; // user name/email
  updated_at: string;
}

export interface Berita {
  id: string;
  judul: string;
  slug: string;
  konten: string;
  gambar_url: string;
  author_id: string;
  author_name: string;
  kecamatan_id?: string;
  kecamatan_nama?: string;
  saka_id?: string;
  saka_nama?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  published_at: string;
  likes?: number;
}

export interface AgendaKegiatan {
  id: string;
  nama_kegiatan: string;
  tempat: string;
  logo_url?: string;
  juknis_url?: string | null;
  surat_edaran_url?: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  estimasi_peserta: number;
  jenis: 'mandiri' | 'partisipasi';
  tingkat: 'kabupaten' | 'provinsi' | 'nasional' | 'internasional';
  kecamatan_id?: string; // null if DKC
  kecamatan_nama?: string;
  saka_id?: string;
  saka_nama?: string;
  status_publikasi: boolean;
  is_aktif_pendaftaran: boolean;
  is_tanggal_diputuskan?: boolean;
  bulan_rencana?: string; // Format: 'YYYY-MM', e.g. '2026-08'
  camp_fee?: number;
  is_camp_fee_required?: boolean;
  dashboard_config?: {
    show_stats: boolean;
    show_kwarran_chart: boolean;
    show_wilayah_chart: boolean;
    show_gender_chart: boolean;
    show_table: boolean;
    gender_field_id: string;
  };
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox' | 'pangkalan' | 'date';
  required: boolean;
  options?: string[]; // For 'select' type
  locked?: boolean; // field inti: tidak bisa dihapus/diubah di form builder
  auto?: boolean; // diisi otomatis sistem (tidak ditampilkan di form)
}

export interface FormKegiatanConfig {
  id: string;
  agenda_id: string;
  form_schema: FormFieldConfig[];
  tipe_pendaftaran: 'mandiri' | 'kolektif' | 'keduanya';
  is_qr_validasi?: boolean;
  is_qr_checkin?: boolean;
}

export interface PendaftaranPeserta {
  id: string;
  agenda_id: string;
  tipe: 'mandiri' | 'kolektif';
  kecamatan_id?: string;
  data_peserta: Record<string, any>;
  created_at: string;
}

export interface Informasi {
  id: string;
  judul: string;
  deskripsi: string;
  file_url: string;
  tipe: 'gambar' | 'dokumen';
  created_at: string;
}

export interface SiteContent {
  id: string;
  section_key: string; // 'hero', 'footer', 'about'
  content: Record<string, any>;
  updated_at: string;
}

export interface LaporanKegiatan {
  id: string;
  kecamatan_id: string;
  kecamatan_nama: string;
  jenis_dokumen: '02GP' | '01DIKLAT';
  nama_kegiatan: string;
  tanggal_pelaksanaan: string;
  tempat_pelaksanaan: string;
  deskripsi_singkat: string;
  file_laporan_url: string;
  form_data?: any;
  status: 'draft' | 'pending' | 'diterima' | 'ditolak' | 'revisi';
  catatan_admin?: string;
  point_bobot?: number;
  created_at: string;
}

export type SuratJenis = 'permohonan_pemateri' | 'undangan' | 'permohonan_lainnya' | 'pemberitahuan' | 'lainnya';
export type SuratStatus = 'terkirim' | 'dibaca' | 'diterima' | 'akan_hadir' | 'diwakilkan' | 'tidak_dapat_hadir' | 'ditolak' | 'selesai';

export interface SuratDkr {
  id: string;
  kecamatan_id: string;
  kecamatan_nama?: string;
  jenis: SuratJenis;
  nomor_surat?: string | null;
  perihal: string;
  tanggal_surat?: string | null;
  tanggal_acara?: string | null;
  keterangan?: string | null;
  file_url: string;
  file_nama?: string | null;
  status: SuratStatus;
  tanggapan?: string | null;
  diwakili_oleh?: string | null;
  dibaca_at?: string | null;
  ditanggapi_at?: string | null;
  dilihat_dkr: boolean;
  created_at: string;
  updated_at: string;
}

// Sejarah DKC (disimpan di site_content, section_key = 'sejarah_dkc', content.items)
// Urutan array = urutan kronologis (paling lama di atas/awal).
export interface SejarahDkcItem {
  id: string;
  nama: string;
  foto_url: string;
  masa_bakti: string;
  deskripsi: string;
}

// Pengumuman landing page (site_content, section_key = 'pengumuman', content.items)
// Urutan array = urutan tampil (paling atas = paling depan).
export interface PengumumanItem {
  id: string;
  judul: string;
  isi: string;
  gambar_url: string;
  tombol_teks: string;
  tombol_link: string;
  berlaku_sampai: string; // 'YYYY-MM-DD' atau '' (tanpa batas)
  aktif: boolean;         // tampil di section Pengumuman
  popup: boolean;         // ikut dimunculkan sebagai popup promosi
  dibuat: string;         // ISO date
}
