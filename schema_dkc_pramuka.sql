-- =====================================================================
-- SCHEMA SQL - DKC PRAMUKA KABUPATEN TASIKMALAYA
-- Dibuat sesuai src/types.ts pada project
-- Jalankan di Supabase: Dashboard > SQL Editor > paste semua > Run
-- =====================================================================

-- Extension buat generate UUID (biasanya sudah aktif default di Supabase)
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. MASTER DATA: KECAMATAN & SAKA
-- =====================================================================

create table if not exists kecamatan (
  id text primary key,                 -- slug pendek, cth: 'singaparna'
  nama_kecamatan text not null,
  slug text unique not null,
  is_dkr_aktif boolean not null default true,
  latitude numeric,
  longitude numeric
);

create table if not exists saka (
  id text primary key,                 -- slug pendek, cth: 'bhayangkara'
  nama_saka text not null,
  slug text unique not null,
  deskripsi text,
  is_aktif boolean not null default true,
  latitude numeric,
  longitude numeric,
  foto_url text
);

-- =====================================================================
-- 2. PROFILES (nyambung ke auth.users bawaan Supabase Auth)
-- =====================================================================

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'user', 'saka')),
  kecamatan_id text references kecamatan(id) on delete set null,
  saka_id text references saka(id) on delete set null,
  nama text not null,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 3. PROFIL ORGANISASI (DKC / DKR / SAKA)
-- =====================================================================

create table if not exists dkc_profile (
  id text primary key default 'dkc-main',
  visi text,
  misi text,
  updated_at timestamptz not null default now()
);

create table if not exists dkr_profile (
  id uuid primary key default gen_random_uuid(),
  kecamatan_id text not null unique references kecamatan(id) on delete cascade,
  deskripsi text,
  logo_url text,
  updated_at timestamptz not null default now()
);

create table if not exists saka_profile (
  id uuid primary key default gen_random_uuid(),
  saka_id text not null unique references saka(id) on delete cascade,
  deskripsi text,
  logo_url text,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- 4. PERSONALIA (pengurus DKC/DKR/SAKA)
-- =====================================================================

create table if not exists personalia (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('dkc', 'dkr', 'saka')),
  kecamatan_id text references kecamatan(id) on delete cascade,
  saka_id text references saka(id) on delete cascade,
  foto_url text,
  nama text not null,
  jabatan text not null,
  golongan text not null check (golongan in ('penegak', 'pandega', 'pembina', 'lainnya')),
  urutan int not null default 0
);

-- =====================================================================
-- 5. PANGKALAN (gudep binaan)
-- =====================================================================

create table if not exists pangkalan (
  id uuid primary key default gen_random_uuid(),
  kecamatan_id text references kecamatan(id) on delete cascade,
  saka_id text references saka(id) on delete cascade,
  nama_pangkalan text not null,
  jenis text not null check (jenis in ('SMA', 'SMK', 'MA', 'Perguruan Tinggi', 'lainnya')),
  status_aktif boolean not null default true
);

-- =====================================================================
-- 6. DATA POTENSIAL (rekap jumlah anggota per kecamatan/saka)
-- =====================================================================

create table if not exists data_potensial (
  id uuid primary key default gen_random_uuid(),
  kecamatan_id text references kecamatan(id) on delete cascade,
  saka_id text references saka(id) on delete cascade,
  periode text not null,               -- cth: '2026' atau '2026-Semester 1'
  jumlah_penegak_l int not null default 0,
  jumlah_penegak_p int not null default 0,
  jumlah_pandega_l int not null default 0,
  jumlah_pandega_p int not null default 0,
  updated_by text,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- 7. BERITA
-- =====================================================================

create table if not exists berita (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  slug text unique not null,
  konten text,
  gambar_url text,
  author_id uuid references auth.users(id) on delete set null,
  author_name text,
  kecamatan_id text references kecamatan(id) on delete set null,
  kecamatan_nama text,
  saka_id text references saka(id) on delete set null,
  saka_nama text,
  status text not null default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  published_at timestamptz not null default now(),
  likes int default 0
);

-- =====================================================================
-- 8. AGENDA KEGIATAN
-- =====================================================================

create table if not exists agenda_kegiatan (
  id uuid primary key default gen_random_uuid(),
  nama_kegiatan text not null,
  tempat text,
  tanggal_mulai date,
  tanggal_selesai date,
  estimasi_peserta int,
  jenis text not null check (jenis in ('mandiri', 'partisipasi')),
  tingkat text not null check (tingkat in ('kabupaten', 'provinsi', 'nasional', 'internasional')),
  kecamatan_id text references kecamatan(id) on delete set null,  -- null = agenda DKC
  kecamatan_nama text,
  saka_id text references saka(id) on delete set null,
  saka_nama text,
  status_publikasi boolean not null default false,
  is_aktif_pendaftaran boolean not null default false,
  is_tanggal_diputuskan boolean default true,
  bulan_rencana text                   -- format 'YYYY-MM'
);

-- =====================================================================
-- 9. FORM KEGIATAN CONFIG & PENDAFTARAN PESERTA
-- =====================================================================

create table if not exists form_kegiatan_config (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid not null references agenda_kegiatan(id) on delete cascade,
  form_schema jsonb not null default '[]'::jsonb,  -- array of FormFieldConfig
  tipe_pendaftaran text not null check (tipe_pendaftaran in ('mandiri', 'kolektif', 'keduanya'))
);

create table if not exists pendaftaran_peserta (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid not null references agenda_kegiatan(id) on delete cascade,
  tipe text not null check (tipe in ('mandiri', 'kolektif')),
  kecamatan_id text references kecamatan(id) on delete set null,
  data_peserta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 10. INFORMASI (galeri dokumen/gambar publik)
-- =====================================================================

create table if not exists informasi (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  deskripsi text,
  file_url text,
  tipe text not null check (tipe in ('gambar', 'dokumen')),
  created_at timestamptz not null default now()
);

-- =====================================================================
-- 11. SITE CONTENT (konten dinamis landing page: hero, footer, about)
-- =====================================================================

create table if not exists site_content (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- =====================================================================
-- 12. LAPORAN KEGIATAN (02GP / 01DIKLAT dari DKR)
-- =====================================================================

create table if not exists laporan_kegiatan (
  id uuid primary key default gen_random_uuid(),
  kecamatan_id text not null references kecamatan(id) on delete cascade,
  kecamatan_nama text,
  jenis_dokumen text not null check (jenis_dokumen in ('02GP', '01DIKLAT')),
  nama_kegiatan text not null,
  tanggal_pelaksanaan date,
  tempat_pelaksanaan text,
  deskripsi_singkat text,
  file_laporan_url text,
  status text not null default 'pending' check (status in ('pending', 'diterima', 'ditolak', 'revisi')),
  catatan_admin text,
  point_bobot int,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- INDEX TAMBAHAN BUAT QUERY YANG SERING DIPAKAI
-- =====================================================================

create index if not exists idx_personalia_owner on personalia (owner_type, kecamatan_id, saka_id);
create index if not exists idx_pangkalan_kecamatan on pangkalan (kecamatan_id);
create index if not exists idx_berita_status on berita (status, published_at desc);
create index if not exists idx_agenda_publikasi on agenda_kegiatan (status_publikasi, tanggal_mulai);
create index if not exists idx_pendaftaran_agenda on pendaftaran_peserta (agenda_id);
create index if not exists idx_laporan_kecamatan on laporan_kegiatan (kecamatan_id, status);
create index if not exists idx_data_potensial_kecamatan on data_potensial (kecamatan_id, periode);

-- =====================================================================
-- HELPER FUNCTION BUAT RLS (biar gak recursive query ke tabel profiles)
-- =====================================================================

create or replace function public.current_role_dkc()
returns text
language sql stable security definer
set search_path = public
as $$
  select role from profiles where user_id = auth.uid()
$$;

create or replace function public.current_kecamatan_id()
returns text
language sql stable security definer
set search_path = public
as $$
  select kecamatan_id from profiles where user_id = auth.uid()
$$;

create or replace function public.current_saka_id()
returns text
language sql stable security definer
set search_path = public
as $$
  select saka_id from profiles where user_id = auth.uid()
$$;

-- =====================================================================
-- ENABLE ROW LEVEL SECURITY DI SEMUA TABEL
-- =====================================================================

alter table kecamatan enable row level security;
alter table saka enable row level security;
alter table profiles enable row level security;
alter table dkc_profile enable row level security;
alter table dkr_profile enable row level security;
alter table saka_profile enable row level security;
alter table personalia enable row level security;
alter table pangkalan enable row level security;
alter table data_potensial enable row level security;
alter table berita enable row level security;
alter table agenda_kegiatan enable row level security;
alter table form_kegiatan_config enable row level security;
alter table pendaftaran_peserta enable row level security;
alter table informasi enable row level security;
alter table site_content enable row level security;
alter table laporan_kegiatan enable row level security;

-- =====================================================================
-- POLICIES: DATA MASTER & KONTEN PUBLIK (semua orang boleh baca)
-- =====================================================================

create policy "public read kecamatan" on kecamatan for select using (true);
create policy "admin write kecamatan" on kecamatan for all
  using (current_role_dkc() = 'admin') with check (current_role_dkc() = 'admin');

create policy "public read saka" on saka for select using (true);
create policy "admin write saka" on saka for all
  using (current_role_dkc() = 'admin') with check (current_role_dkc() = 'admin');

create policy "public read dkc_profile" on dkc_profile for select using (true);
create policy "admin write dkc_profile" on dkc_profile for all
  using (current_role_dkc() = 'admin') with check (current_role_dkc() = 'admin');

create policy "public read dkr_profile" on dkr_profile for select using (true);
create policy "admin or owner write dkr_profile" on dkr_profile for all
  using (current_role_dkc() = 'admin' or current_kecamatan_id() = kecamatan_id)
  with check (current_role_dkc() = 'admin' or current_kecamatan_id() = kecamatan_id);

create policy "public read saka_profile" on saka_profile for select using (true);
create policy "admin or owner write saka_profile" on saka_profile for all
  using (current_role_dkc() = 'admin' or current_saka_id() = saka_id)
  with check (current_role_dkc() = 'admin' or current_saka_id() = saka_id);

create policy "public read personalia" on personalia for select using (true);
create policy "admin or owner write personalia" on personalia for all
  using (
    current_role_dkc() = 'admin'
    or (owner_type = 'dkr' and current_kecamatan_id() = kecamatan_id)
    or (owner_type = 'saka' and current_saka_id() = saka_id)
  )
  with check (
    current_role_dkc() = 'admin'
    or (owner_type = 'dkr' and current_kecamatan_id() = kecamatan_id)
    or (owner_type = 'saka' and current_saka_id() = saka_id)
  );

create policy "public read pangkalan" on pangkalan for select using (true);
create policy "admin or owner write pangkalan" on pangkalan for all
  using (
    current_role_dkc() = 'admin'
    or current_kecamatan_id() = kecamatan_id
    or current_saka_id() = saka_id
  )
  with check (
    current_role_dkc() = 'admin'
    or current_kecamatan_id() = kecamatan_id
    or current_saka_id() = saka_id
  );

create policy "public read data_potensial" on data_potensial for select using (true);
create policy "admin or owner write data_potensial" on data_potensial for all
  using (
    current_role_dkc() = 'admin'
    or current_kecamatan_id() = kecamatan_id
    or current_saka_id() = saka_id
  )
  with check (
    current_role_dkc() = 'admin'
    or current_kecamatan_id() = kecamatan_id
    or current_saka_id() = saka_id
  );

create policy "public read informasi" on informasi for select using (true);
create policy "admin write informasi" on informasi for all
  using (current_role_dkc() = 'admin') with check (current_role_dkc() = 'admin');

create policy "public read site_content" on site_content for select using (true);
create policy "admin write site_content" on site_content for all
  using (current_role_dkc() = 'admin') with check (current_role_dkc() = 'admin');

-- =====================================================================
-- POLICIES: BERITA (publik cuma lihat yang approved, penulis kelola milik sendiri)
-- =====================================================================

create policy "public read berita approved" on berita for select
  using (status = 'approved' or current_role_dkc() = 'admin' or author_id = auth.uid());

create policy "user insert berita sendiri" on berita for insert
  with check (auth.uid() is not null and author_id = auth.uid());

create policy "admin or author update berita" on berita for update
  using (current_role_dkc() = 'admin' or author_id = auth.uid())
  with check (current_role_dkc() = 'admin' or author_id = auth.uid());

create policy "admin delete berita" on berita for delete
  using (current_role_dkc() = 'admin');

-- =====================================================================
-- POLICIES: AGENDA KEGIATAN & FORM
-- =====================================================================

create policy "public read agenda published" on agenda_kegiatan for select
  using (status_publikasi = true or current_role_dkc() = 'admin'
         or current_kecamatan_id() = kecamatan_id or current_saka_id() = saka_id);

create policy "admin write agenda" on agenda_kegiatan for all
  using (current_role_dkc() = 'admin') with check (current_role_dkc() = 'admin');

create policy "public read form_config" on form_kegiatan_config for select using (true);
create policy "admin write form_config" on form_kegiatan_config for all
  using (current_role_dkc() = 'admin') with check (current_role_dkc() = 'admin');

-- =====================================================================
-- POLICIES: PENDAFTARAN PESERTA (siapa aja boleh daftar, hanya admin/DKR lihat)
-- =====================================================================

create policy "siapapun boleh daftar" on pendaftaran_peserta for insert
  with check (true);

create policy "admin atau dkr terkait boleh lihat pendaftaran" on pendaftaran_peserta for select
  using (current_role_dkc() = 'admin' or current_kecamatan_id() = kecamatan_id);

create policy "admin kelola pendaftaran" on pendaftaran_peserta for update
  using (current_role_dkc() = 'admin') with check (current_role_dkc() = 'admin');

create policy "admin hapus pendaftaran" on pendaftaran_peserta for delete
  using (current_role_dkc() = 'admin');

-- =====================================================================
-- POLICIES: LAPORAN KEGIATAN (DKR kelola punya sendiri, admin kelola semua)
-- =====================================================================

create policy "admin atau dkr terkait lihat laporan" on laporan_kegiatan for select
  using (current_role_dkc() = 'admin' or current_kecamatan_id() = kecamatan_id);

create policy "dkr insert laporan sendiri" on laporan_kegiatan for insert
  with check (current_role_dkc() = 'admin' or current_kecamatan_id() = kecamatan_id);

create policy "admin atau dkr update laporan sendiri" on laporan_kegiatan for update
  using (current_role_dkc() = 'admin' or current_kecamatan_id() = kecamatan_id)
  with check (current_role_dkc() = 'admin' or current_kecamatan_id() = kecamatan_id);

create policy "admin hapus laporan" on laporan_kegiatan for delete
  using (current_role_dkc() = 'admin');

-- =====================================================================
-- POLICIES: PROFILES
-- =====================================================================

create policy "user lihat profile sendiri" on profiles for select
  using (auth.uid() = user_id or current_role_dkc() = 'admin');

create policy "admin kelola semua profile" on profiles for all
  using (current_role_dkc() = 'admin') with check (current_role_dkc() = 'admin');

-- =====================================================================
-- LOG ASSET UPLOAD (dicatat otomatis oleh server tiap kali ada upload
-- berhasil ke Cloudinary ATAU Uploadcare, biar ada audit trail linknya)
-- =====================================================================

create table if not exists uploaded_assets (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  cloudinary_url text not null, -- catatan: kolom ini menyimpan URL CDN dari provider manapun (Cloudinary/Uploadcare), bukan cuma Cloudinary
  file_type text,
  created_at timestamptz not null default now()
);

alter table uploaded_assets enable row level security;
create policy "admin baca semua asset" on uploaded_assets for select
  using (current_role_dkc() = 'admin');
create policy "service role tulis asset" on uploaded_assets for insert
  with check (true);

-- =====================================================================
-- SEED DATA MASTER: KECAMATAN (biar gak mulai dari kosong)
-- =====================================================================

insert into kecamatan (id, nama_kecamatan, slug, is_dkr_aktif, latitude, longitude) values
  ('singaparna', 'Singaparna', 'singaparna', true, -7.3512, 108.1112),
  ('ciawi', 'Ciawi', 'ciawi', true, -7.1528, 108.1411),
  ('karangnunggal', 'Karangnunggal', 'karangnunggal', true, -7.6521, 108.1512),
  ('manonjaya', 'Manonjaya', 'manonjaya', true, -7.3533, 108.3112),
  ('taraju', 'Taraju', 'taraju', true, -7.4421, 108.0123),
  ('sukaraja', 'Sukaraja', 'sukaraja', false, -7.3912, 108.2312)
on conflict (id) do nothing;

insert into dkc_profile (id, visi, misi) values (
  'dkc-main',
  'Mewujudkan Pramuka Penegak dan Pandega Kabupaten Tasikmalaya yang aktif, berkarakter, berdaya saing tinggi, dan berjiwa mengabdi tiada batas bagi kemajuan bangsa.',
  '1. Mengoptimalkan peran Dewan Kerja Cabang dan Ranting sebagai wadah pembinaan kepemimpinan.
2. Mengembangkan kegiatan Penegak dan Pandega yang inovatif, rekreatif, dan berbasis teknologi.
3. Memperkokoh solidaritas, budi pekerti luhur, dan pengabdian masyarakat (Abdimas) di setiap jenjang.
4. Membangun kolaborasi sinergis dengan seluruh stakeholder dan instansi kepemudaan se-Kabupaten Tasikmalaya.'
) on conflict (id) do nothing;

-- =====================================================================
-- SELESAI. Setelah ini:
-- 1. Buat user login via Supabase Auth (Dashboard > Authentication > Add user)
-- 2. Insert baris ke tabel `profiles` yang nge-link user_id itu ke role & kecamatan_id/saka_id
-- 3. Ganti server/db.ts jadi pakai @supabase/supabase-js client, bukan file JSON lagi
-- =====================================================================
