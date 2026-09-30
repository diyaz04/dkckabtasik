import type { PengumumanItem } from '../types';

/**
 * Normalisasi link tombol pengumuman.
 * - ''                       -> '' (tanpa tombol)
 * - http(s)://, mailto:, tel: -> apa adanya
 * - '/path' atau '#anchor'    -> apa adanya (link internal)
 * - 'wa.me/62...'             -> 'https://wa.me/62...'
 * - skema lain (javascript:, data:, dll) atau teks aneh -> null (ditolak)
 */
export function normalizeLink(raw: string): string | null {
  const v = (raw || '').trim();
  if (!v) return '';
  if (/[\s<>"']/.test(v)) return null;
  if (/^https?:\/\//i.test(v) || /^(mailto|tel):/i.test(v)) return v;
  if ((v.startsWith('/') && !v.startsWith('//')) || v.startsWith('#')) return v;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return null; // skema lain
  if (/^[^./]+\.[^/]+/.test(v)) return `https://${v}`; // domain tanpa skema
  return null;
}

/** Dipakai saat render: link yang tidak lolos validasi jadi '' (tombol disembunyikan). */
export function safeHref(raw: string): string {
  return normalizeLink(raw) || '';
}

export const isExternalHref = (href: string) => /^https?:\/\//i.test(href);

const todayLocal = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const isExpired = (it: Pick<PengumumanItem, 'berlaku_sampai'>) =>
  !!it.berlaku_sampai && todayLocal() > it.berlaku_sampai;

/** Pengumuman yang boleh tampil di publik. */
export const getActivePengumuman = (items: PengumumanItem[]) =>
  items.filter(it => it.aktif && !isExpired(it) && it.judul?.trim());

/** Sidik jari isi pengumuman: kalau admin mengubah isinya, popup muncul lagi walau sudah pernah ditutup. */
export function fingerprint(it: PengumumanItem): string {
  const s = [it.id, it.judul, it.isi, it.tombol_link, it.gambar_url].join('|');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `pgm_${it.id}_${h}`;
}

export const parsePengumuman = (content: any): PengumumanItem[] =>
  (Array.isArray(content?.items) ? content.items : []).map((it: any) => ({
    id: String(it.id || `pg-${Math.random().toString(36).slice(2, 10)}`),
    judul: it.judul || '',
    isi: it.isi || '',
    gambar_url: it.gambar_url || '',
    tombol_teks: it.tombol_teks || '',
    tombol_link: it.tombol_link || '',
    berlaku_sampai: it.berlaku_sampai || '',
    aktif: it.aktif !== false,
    popup: !!it.popup,
    dibuat: it.dibuat || '',
  }));

export const formatTanggal = (iso: string) => {
  if (!iso) return '';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};
