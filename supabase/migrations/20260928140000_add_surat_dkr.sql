-- Surat DKR → DKC (permohonan pemateri, undangan, dll) + status tanggapan
-- Jalankan di Supabase SQL Editor SEBELUM deploy versi baru.

create table if not exists surat_dkr (
  id uuid primary key default gen_random_uuid(),
  kecamatan_id text not null references kecamatan(id) on delete cascade,
  jenis text not null default 'lainnya'
    check (jenis in ('permohonan_pemateri', 'undangan', 'permohonan_lainnya', 'pemberitahuan', 'lainnya')),
  nomor_surat text,
  perihal text not null,
  tanggal_surat date,
  tanggal_acara date,
  keterangan text,
  file_url text not null,
  file_nama text,
  status text not null default 'terkirim'
    check (status in ('terkirim', 'dibaca', 'diterima', 'akan_hadir', 'diwakilkan', 'tidak_dapat_hadir', 'ditolak', 'selesai')),
  tanggapan text,
  diwakili_oleh text,
  dibaca_at timestamptz,
  ditanggapi_at timestamptz,
  dilihat_dkr boolean not null default true,   -- false = ada update status yang belum dilihat DKR
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_surat_dkr_kecamatan on surat_dkr (kecamatan_id, created_at desc);
create index if not exists idx_surat_dkr_status on surat_dkr (status, created_at desc);

-- Diakses lewat API (service role), jadi RLS aktif tanpa policy publik
alter table surat_dkr enable row level security;
