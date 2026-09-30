import type { FormFieldConfig } from '../types';

/**
 * Field inti yang WAJIB ada di setiap form pendaftaran kegiatan.
 * Tidak bisa dihapus / diubah di form builder admin.
 * Kombinasi kelimanya dipakai sebagai kunci deteksi pendaftar ganda.
 */
export const CORE_FIELDS: FormFieldConfig[] = [
  { id: 'nama_lengkap', label: 'Nama Lengkap', type: 'text', required: true, locked: true },
  { id: 'kwarran_asal', label: 'Kwartir Ranting Asal', type: 'select', required: true, locked: true, auto: true },
  { id: 'pangkalan', label: 'Pangkalan / Gudep', type: 'pangkalan', required: true, locked: true },
  { id: 'tempat_lahir', label: 'Tempat Lahir', type: 'text', required: true, locked: true },
  { id: 'tanggal_lahir', label: 'Tanggal Lahir', type: 'date', required: true, locked: true },
];

export const CORE_FIELD_IDS = CORE_FIELDS.map(f => f.id);
export const isCoreFieldId = (id: string) => CORE_FIELD_IDS.includes(id);

/** Pastikan field inti selalu ada di posisi paling atas (versi kanonik), field custom mengikuti di bawahnya. */
export function ensureCoreFields(schema: any[] | null | undefined): FormFieldConfig[] {
  const custom = (Array.isArray(schema) ? schema : []).filter(f => f && !isCoreFieldId(f.id));
  return [...CORE_FIELDS.map(f => ({ ...f })), ...custom];
}

/** Normalisasi teks untuk perbandingan: rapikan spasi + abaikan huruf besar/kecil. */
export const normalizeText = (s: any) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Ubah berbagai format tanggal (YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, serial Excel, Date) menjadi 'YYYY-MM-DD'.
 * Mengembalikan '' bila tidak valid.
 */
export function normalizeDate(v: any): string {
  if (v === null || v === undefined || v === '') return '';
  let y: number, m: number, d: number;

  if (v instanceof Date) {
    if (isNaN(v.getTime())) return '';
    y = v.getUTCFullYear(); m = v.getUTCMonth() + 1; d = v.getUTCDate();
  } else if (typeof v === 'number' || /^\d{5}(\.\d+)?$/.test(String(v).trim())) {
    // Serial tanggal Excel (basis 1899-12-30)
    const dt = new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(v)) * 86400000);
    y = dt.getUTCFullYear(); m = dt.getUTCMonth() + 1; d = dt.getUTCDate();
  } else {
    const s = String(v).trim();
    let mt = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (mt) { y = +mt[1]; m = +mt[2]; d = +mt[3]; }
    else {
      mt = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (!mt) return '';
      d = +mt[1]; m = +mt[2]; y = +mt[3];
    }
  }

  const check = new Date(Date.UTC(y, m - 1, d));
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d || y < 1900) return '';
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}
