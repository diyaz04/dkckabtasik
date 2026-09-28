-- Detail profil personalia (DKC & DKR): tentang, riwayat, prestasi, foto background
-- Jalankan di Supabase SQL Editor SEBELUM deploy versi baru.

alter table personalia
  add column if not exists tentang text,
  add column if not exists foto_background_url text,
  add column if not exists riwayat_organisasi jsonb not null default '[]'::jsonb,
  add column if not exists riwayat_pendidikan jsonb not null default '[]'::jsonb,
  add column if not exists prestasi_akademik jsonb not null default '[]'::jsonb,
  add column if not exists prestasi_non_akademik jsonb not null default '[]'::jsonb;

-- Format tiap array: [{"tahun":"2022","judul":"...","keterangan":"..."}]
