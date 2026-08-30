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
  updated_at: string;
}

export interface SakaProfile {
  id: string;
  saka_id: string;
  deskripsi: string;
  logo_url?: string;
  updated_at: string;
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
}

export interface FormFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[]; // For 'select' type
}

export interface FormKegiatanConfig {
  id: string;
  agenda_id: string;
  form_schema: FormFieldConfig[];
  tipe_pendaftaran: 'mandiri' | 'kolektif' | 'keduanya';
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
  status: 'pending' | 'diterima' | 'ditolak' | 'revisi';
  catatan_admin?: string;
  point_bobot?: number;
  created_at: string;
}
