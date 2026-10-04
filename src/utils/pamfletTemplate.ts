import { useEffect, useState } from 'react';

/**
 * Template pamflet berita yang diunggah admin.
 * Disimpan di tabel site_content (section_key = 'pamflet_template'),
 * jadi TIDAK butuh migrasi database.
 *
 * Template = gambar latar berukuran 1080x1350 px (rasio 4:5). Sistem menempatkan
 * foto, judul, ringkasan, tanggal/kontributor, dan QR Code ke zona tetap di bawah.
 * Admin tinggal mendesain gambar latar yang "menyisakan ruang" di zona-zona tsb.
 */
export const PAMFLET_SECTION_KEY = 'pamflet_template';
export const PAMFLET_W = 1080;
export const PAMFLET_H = 1350;

export interface PamfletZone {
  key: 'label' | 'foto' | 'judul' | 'ringkasan' | 'meta' | 'qr';
  nama: string;
  keterangan: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const PAMFLET_ZONES: PamfletZone[] = [
  { key: 'label', nama: 'Label Kategori', keterangan: 'KABAR DKC / DKR / SAKA', x: 60, y: 270, w: 520, h: 44 },
  { key: 'foto', nama: 'Foto Berita', keterangan: 'Foto utama (dipotong otomatis)', x: 60, y: 330, w: 960, h: 480 },
  { key: 'judul', nama: 'Judul Berita', keterangan: 'Maks. 3 baris', x: 60, y: 830, w: 960, h: 170 },
  { key: 'ringkasan', nama: 'Ringkasan', keterangan: 'Maks. 3 baris', x: 60, y: 1010, w: 960, h: 110 },
  { key: 'meta', nama: 'Tanggal & Kontributor', keterangan: 'Info penerbitan', x: 60, y: 1160, w: 720, h: 160 },
  { key: 'qr', nama: 'QR Code', keterangan: 'Tautan ke berita', x: 850, y: 1150, w: 170, h: 170 },
];

export type PamfletTextTheme = 'dark' | 'light';

export interface PamfletTemplateConfig {
  url: string;
  textTheme: PamfletTextTheme;
}

let cache: PamfletTemplateConfig | null | undefined; // undefined = belum dimuat

async function fetchTemplate(): Promise<PamfletTemplateConfig | null> {
  try {
    const res = await fetch('/api/site_content');
    if (!res.ok) return null;
    const rows: any[] = await res.json();
    const c = rows.find(r => r.section_key === PAMFLET_SECTION_KEY)?.content;
    if (c && typeof c.url === 'string' && c.url) {
      return { url: c.url, textTheme: c.textTheme === 'light' ? 'light' : 'dark' };
    }
  } catch {
    /* abaikan → fallback ke desain bawaan */
  }
  return null;
}

/** null = pakai desain bawaan, undefined = masih memuat. */
export function usePamfletTemplate(): PamfletTemplateConfig | null | undefined {
  const [tpl, setTpl] = useState<PamfletTemplateConfig | null | undefined>(cache);
  useEffect(() => {
    let cancelled = false;
    fetchTemplate().then(t => {
      cache = t;
      if (!cancelled) setTpl(t);
    });
    return () => { cancelled = true; };
  }, []);
  return tpl;
}

/**
 * Ubah gambar yang dipilih admin menjadi tepat 1080x1350 (JPEG).
 * Menolak gambar yang rasionya jauh dari 4:5 supaya tata letak tidak meleset.
 */
export function prepareTemplateImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('File harus berupa gambar (PNG/JPG).'));
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const ratio = img.width / img.height;
      if (Math.abs(ratio - PAMFLET_W / PAMFLET_H) > 0.02) {
        return reject(new Error(`Rasio gambar harus 4:5 (disarankan ${PAMFLET_W}x${PAMFLET_H} px). Gambar Anda ${img.width}x${img.height} px.`));
      }
      if (img.width < 720) {
        return reject(new Error('Resolusi terlalu kecil. Minimal 720x900 px, disarankan 1080x1350 px.'));
      }
      const canvas = document.createElement('canvas');
      canvas.width = PAMFLET_W;
      canvas.height = PAMFLET_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Gagal memproses gambar.'));
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, PAMFLET_W, PAMFLET_H);
      ctx.drawImage(img, 0, 0, PAMFLET_W, PAMFLET_H);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Gagal membaca gambar.'));
    };
    img.src = objectUrl;
  });
}

/** Gambar panduan tata letak (1080x1350) yang bisa diunduh admin sebagai acuan desain. */
export function buildGuidePng(): string {
  const canvas = document.createElement('canvas');
  canvas.width = PAMFLET_W;
  canvas.height = PAMFLET_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAMFLET_W, PAMFLET_H);

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, PAMFLET_W, 250);
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 34px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AREA BEBAS: logo, kop, nama organisasi, hiasan', PAMFLET_W / 2, 135);
  ctx.font = '26px sans-serif';
  ctx.fillText(`${PAMFLET_W} x ${PAMFLET_H} px (rasio 4:5)`, PAMFLET_W / 2, 185);

  PAMFLET_ZONES.forEach(z => {
    ctx.fillStyle = 'rgba(14,159,110,0.12)';
    ctx.fillRect(z.x, z.y, z.w, z.h);
    ctx.strokeStyle = '#0E9F6E';
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 10]);
    ctx.strokeRect(z.x, z.y, z.w, z.h);
    ctx.setLineDash([]);
    ctx.fillStyle = '#065f46';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(z.nama.toUpperCase(), z.x + z.w / 2, z.y + z.h / 2 - 4, z.w - 20);
    ctx.font = '22px sans-serif';
    ctx.fillText(`${z.w}x${z.h} px`, z.x + z.w / 2, z.y + z.h / 2 + 28, z.w - 20);
  });
  return canvas.toDataURL('image/png');
}
