-- Juknis & Surat Edaran (opsional) per kegiatan, file disimpan di Uploadcare
-- Jalankan di Supabase SQL Editor SEBELUM deploy versi baru.

alter table agenda_kegiatan
  add column if not exists juknis_url text,
  add column if not exists surat_edaran_url text;
