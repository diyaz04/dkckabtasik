import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';

/**
 * Input pangkalan/gudep untuk form pendaftaran.
 * - Memanggil daftar pangkalan yang sudah terdaftar di database (per Kwaran)
 * - Jika belum ada, user boleh menambahkan sendiri → otomatis tersimpan ke database
 */

const PANGKALAN_EVENT = 'pangkalan-updated';
const cache = new Map<string, any[]>();
const inflight = new Map<string, Promise<any[]>>();

export const normalizePangkalanName = (s: string) => (s || '').replace(/\s+/g, ' ').trim();
const sameName = (a: string, b: string) => normalizePangkalanName(a).toLowerCase() === normalizePangkalanName(b).toLowerCase();

/** Field form dianggap "pangkalan" jika bertipe 'pangkalan', atau field teks berlabel pangkalan/gudep/gugus depan. */
export const isPangkalanField = (f: { type?: string; label?: string }) =>
  f.type === 'pangkalan' ||
  ((f.type === 'text' || !f.type) && /pangkalan|gudep|gugus\s*depan/i.test(f.label || ''));

export async function loadPangkalan(kecamatanId: string, force = false): Promise<any[]> {
  if (!kecamatanId) return [];
  if (!force && cache.has(kecamatanId)) return cache.get(kecamatanId)!;
  if (!force && inflight.has(kecamatanId)) return inflight.get(kecamatanId)!;
  const p = fetch(`/api/pangkalan?kecamatan_id=${encodeURIComponent(kecamatanId)}`)
    .then(r => (r.ok ? r.json() : []))
    .then((data) => {
      const list = Array.isArray(data) ? data : [];
      cache.set(kecamatanId, list);
      return list;
    })
    .catch(() => cache.get(kecamatanId) || [])
    .finally(() => { inflight.delete(kecamatanId); });
  inflight.set(kecamatanId, p);
  return p;
}

/** Pastikan pangkalan ada di database; jika belum, simpan otomatis. */
export async function ensurePangkalan(kecamatanId: string, nama: string): Promise<any | null> {
  const name = normalizePangkalanName(nama);
  if (!kecamatanId || !name) return null;
  const list = await loadPangkalan(kecamatanId);
  const found = list.find(p => sameName(p.nama_pangkalan, name));
  if (found) return found;

  const res = await fetch('/api/pangkalan/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kecamatan_id: kecamatanId, nama_pangkalan: name })
  });
  if (!res.ok) throw new Error('Gagal menyimpan pangkalan baru');
  const { pangkalan } = await res.json();
  const current = cache.get(kecamatanId) || list;
  if (!current.some(p => p.id === pangkalan.id)) cache.set(kecamatanId, [...current, pangkalan]);
  window.dispatchEvent(new CustomEvent(PANGKALAN_EVENT, { detail: kecamatanId }));
  return pangkalan;
}

/** Jaring pengaman saat submit: semua nama pangkalan yang diketik ikut disimpan (termasuk hasil import Excel). */
export async function savePangkalanFromRows(
  schema: { id: string; type?: string; label?: string }[] | undefined,
  rows: Record<string, any>[],
  kecamatanId: string | null | undefined
) {
  if (!kecamatanId || !schema) return;
  const fields = schema.filter(isPangkalanField);
  const names = new Map<string, string>();
  rows.forEach(row => fields.forEach(f => {
    const n = normalizePangkalanName(String(row?.[f.id] ?? ''));
    if (n) names.set(n.toLowerCase(), n);
  }));
  for (const n of names.values()) {
    try { await ensurePangkalan(kecamatanId, n); } catch (e) { console.error(e); }
  }
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  kecamatanId?: string;
  required?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export default function PangkalanInput({ value, onChange, kecamatanId, required, placeholder, compact }: Props) {
  const [list, setList] = useState<any[]>(() => (kecamatanId ? cache.get(kecamatanId) || [] : []));
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState('');

  useEffect(() => {
    let alive = true;
    if (!kecamatanId) { setList([]); return; }
    loadPangkalan(kecamatanId).then(l => { if (alive) setList(l); });
    const onUpdate = (e: any) => {
      if (e?.detail === kecamatanId) setList(cache.get(kecamatanId) || []);
    };
    window.addEventListener(PANGKALAN_EVENT, onUpdate);
    return () => { alive = false; window.removeEventListener(PANGKALAN_EVENT, onUpdate); };
  }, [kecamatanId]);

  const query = normalizePangkalanName(value);
  const suggestions = useMemo(() => {
    const active = list.filter(p => p.status_aktif !== false);
    const q = query.toLowerCase();
    return (q ? active.filter(p => (p.nama_pangkalan || '').toLowerCase().includes(q)) : active)
      .sort((a, b) => (a.nama_pangkalan || '').localeCompare(b.nama_pangkalan || ''))
      .slice(0, 30);
  }, [list, query]);
  const exactExists = !!query && list.some(p => sameName(p.nama_pangkalan, query));

  const addNew = async () => {
    if (!kecamatanId || !query) return;
    setSaving(true);
    try {
      const pk = await ensurePangkalan(kecamatanId, query);
      if (pk) {
        onChange(pk.nama_pangkalan);
        setInfo('Pangkalan baru tersimpan ke database ✓');
        setOpen(false);
      }
    } catch (e) {
      setInfo('Gagal menyimpan pangkalan baru, coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = compact
    ? 'w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs'
    : 'w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800';

  return (
    <div className="space-y-1.5">
      <input
        type="text"
        required={required}
        value={value || ''}
        onChange={(e) => { onChange(e.target.value); setInfo(''); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder || (kecamatanId ? 'Ketik / pilih nama pangkalan' : 'Pilih Asal Kwartir Ranting dulu')}
        autoComplete="off"
        className={inputCls}
      />

      {open && kecamatanId && (suggestions.length > 0 || (query && !exactExists)) && (
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="bg-white border border-gray-200 rounded-xl shadow-sm max-h-40 overflow-y-auto divide-y divide-gray-100"
        >
          {suggestions.map(p => (
            <button
              type="button" key={p.id}
              onClick={() => { onChange(p.nama_pangkalan); setInfo(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-emerald-50"
            >
              {p.nama_pangkalan} <span className="text-[10px] text-gray-400 uppercase">· {p.jenis}</span>
            </button>
          ))}
          {query && !exactExists && (
            <button
              type="button" disabled={saving} onClick={addNew}
              className="w-full text-left px-3 py-2 text-xs font-bold text-brand-green hover:bg-emerald-50 flex items-center gap-1.5 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Tambahkan "{query}" sebagai pangkalan baru
            </button>
          )}
        </div>
      )}

      {!kecamatanId && (
        <p className="text-[10px] text-gray-400 font-mono">Pilih Asal Kwartir Ranting terlebih dahulu untuk memuat daftar pangkalan.</p>
      )}
      {kecamatanId && !info && query && !exactExists && !open && (
        <p className="text-[10px] text-amber-600 font-mono">Belum terdaftar — akan otomatis disimpan sebagai pangkalan baru saat dikirim.</p>
      )}
      {info && <p className="text-[10px] text-brand-green font-mono">{info}</p>}
    </div>
  );
}
