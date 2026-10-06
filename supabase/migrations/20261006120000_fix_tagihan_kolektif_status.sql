-- Status tagihan_kolektif yang dipakai aplikasi: belum_bayar, menunggu_verifikasi, lunas, ditolak.
-- Skema awal hanya mengizinkan 'pending' sehingga insert tagihan baru (belum_bayar) bisa gagal.
-- Jalankan di Supabase SQL Editor SEBELUM deploy versi baru.

alter table tagihan_kolektif drop constraint if exists tagihan_kolektif_status_check;

update tagihan_kolektif set status = 'belum_bayar' where status = 'pending';

alter table tagihan_kolektif alter column status set default 'belum_bayar';

alter table tagihan_kolektif
  add constraint tagihan_kolektif_status_check
  check (status in ('belum_bayar', 'menunggu_verifikasi', 'lunas', 'ditolak'));
