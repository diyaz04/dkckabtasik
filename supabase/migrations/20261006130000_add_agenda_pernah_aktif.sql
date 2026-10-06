-- Riwayat "pernah aktif" per kegiatan: dipakai dashboard DKR agar kegiatan yang pernah
-- membuka pendaftaran tetap tampil (dengan label "Sudah selesai") setelah pendaftaran ditutup.
-- Jalankan di Supabase SQL Editor SEBELUM deploy versi baru.

alter table agenda_kegiatan
  add column if not exists pernah_aktif boolean not null default false;

-- Isi awal: yang sedang aktif, atau sudah punya pendaftar / tagihan (berarti pernah dibuka)
update agenda_kegiatan a set pernah_aktif = true
where a.is_aktif_pendaftaran = true
   or exists (select 1 from pendaftaran_peserta p where p.agenda_id = a.id)
   or exists (select 1 from tagihan_kolektif t where t.agenda_id = a.id);

-- Admin DKC bisa "menarik" kegiatan dari dashboard DKR; muncul lagi saat pendaftaran diaktifkan.
alter table agenda_kegiatan
  add column if not exists ditarik_dkr boolean not null default false;
