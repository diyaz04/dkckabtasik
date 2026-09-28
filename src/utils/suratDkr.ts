import { useCallback, useEffect, useRef, useState } from 'react';
import { SuratDkr, SuratJenis, SuratStatus } from '../types';
import { showAlert } from './dialog';

export const SURAT_JENIS: { value: SuratJenis; label: string }[] = [
  { value: 'permohonan_pemateri', label: 'Permohonan Pemateri' },
  { value: 'undangan', label: 'Undangan' },
  { value: 'permohonan_lainnya', label: 'Permohonan Lainnya' },
  { value: 'pemberitahuan', label: 'Pemberitahuan / Laporan' },
  { value: 'lainnya', label: 'Lainnya' },
];

export const jenisLabel = (j: string) => SURAT_JENIS.find((x) => x.value === j)?.label || j;

// Kelas Tailwind ditulis lengkap (literal) supaya ikut ter-generate
export const SURAT_STATUS: Record<SuratStatus, { label: string; badge: string; dot: string }> = {
  terkirim: { label: 'Terkirim', badge: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' },
  dibaca: { label: 'Sudah Dibaca', badge: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  diterima: { label: 'Diterima', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  akan_hadir: { label: 'Akan Hadir', badge: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500' },
  diwakilkan: { label: 'Diwakilkan', badge: 'bg-violet-50 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  tidak_dapat_hadir: { label: 'Tidak Dapat Hadir', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  ditolak: { label: 'Ditolak', badge: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  selesai: { label: 'Selesai', badge: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' },
};

// Pilihan status yang bisa diberikan admin DKC sebagai tanggapan
export const SURAT_STATUS_TANGGAPAN: { value: SuratStatus; label: string; hint: string }[] = [
  { value: 'diterima', label: 'Diterima / Disetujui', hint: 'Surat diterima dan permohonan disetujui' },
  { value: 'akan_hadir', label: 'Akan Hadir', hint: 'DKC akan hadir / memenuhi undangan' },
  { value: 'diwakilkan', label: 'Diwakilkan', hint: 'Kehadiran / pemateri diwakili orang lain' },
  { value: 'tidak_dapat_hadir', label: 'Tidak Dapat Hadir', hint: 'Berhalangan hadir' },
  { value: 'ditolak', label: 'Ditolak', hint: 'Permohonan tidak dapat dipenuhi' },
  { value: 'selesai', label: 'Selesai', hint: 'Urusan surat sudah tuntas' },
];

export const formatTanggal = (iso?: string | null, withTime = false) => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
};

const POLL_MS = 30000;

/**
 * Ambil daftar surat + polling tiap 30 detik (dan saat tab dibuka lagi).
 * mode 'admin' → semua surat, popup saat ada surat baru dari DKR
 * mode 'dkr'   → hanya surat kecamatan tsb, popup saat status surat berubah
 */
export function useSuratDkr(mode: 'admin' | 'dkr', kecamatanId?: string) {
  const [list, setList] = useState<SuratDkr[]>([]);
  const [loading, setLoading] = useState(true);
  const snapshot = useRef<Map<string, string> | null>(null);

  const reload = useCallback(async () => {
    if (mode === 'dkr' && !kecamatanId) return;
    try {
      const url = mode === 'dkr' ? `/api/surat-dkr?kecamatan_id=${encodeURIComponent(kecamatanId!)}` : '/api/surat-dkr';
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data)) return;

      const prev = snapshot.current;
      if (prev) {
        if (mode === 'admin') {
          const fresh = (data as SuratDkr[]).filter((s) => !prev.has(s.id));
          if (fresh.length === 1) {
            showAlert(`Surat baru dari DKR ${fresh[0].kecamatan_nama}\nPerihal: ${fresh[0].perihal}`, 'info');
          } else if (fresh.length > 1) {
            showAlert(`${fresh.length} surat baru masuk dari DKR. Cek menu Surat Masuk DKR.`, 'info');
          }
        } else {
          const changed = (data as SuratDkr[]).filter((s) => prev.has(s.id) && prev.get(s.id) !== s.status);
          if (changed.length === 1) {
            showAlert(`Surat "${changed[0].perihal}" kini berstatus: ${SURAT_STATUS[changed[0].status]?.label || changed[0].status}`, 'info');
          } else if (changed.length > 1) {
            showAlert(`${changed.length} surat Anda mendapat pembaruan status dari DKC.`, 'info');
          }
        }
      }
      snapshot.current = new Map((data as SuratDkr[]).map((s) => [s.id, s.status]));
      setList(data);
    } catch (e) {
      console.error('Gagal memuat surat DKR:', e);
    } finally {
      setLoading(false);
    }
  }, [mode, kecamatanId]);

  useEffect(() => {
    snapshot.current = null; // baseline baru (mis. setelah kecamatan termuat) → tanpa popup
    reload();
    const timer = setInterval(reload, POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') reload(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [reload]);

  return { list, loading, reload };
}
