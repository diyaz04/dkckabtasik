import React, { useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Personalia, PersonaliaEntry } from '../types';
import { compressAndUploadFile } from '../utils/imageUpload';
import { showAlert as alert } from '../utils/dialog';

// Field tambahan detail profil personalia (dipakai di Portal Admin/DKC & Portal DKR)
export interface PersonaliaExtra {
  tentang: string;
  foto_background_url: string;
  riwayat_organisasi: PersonaliaEntry[];
  riwayat_pendidikan: PersonaliaEntry[];
  prestasi_akademik: PersonaliaEntry[];
  prestasi_non_akademik: PersonaliaEntry[];
}

export const emptyPersonaliaExtra = (): PersonaliaExtra => ({
  tentang: '',
  foto_background_url: '',
  riwayat_organisasi: [],
  riwayat_pendidikan: [],
  prestasi_akademik: [],
  prestasi_non_akademik: [],
});

const asEntries = (v: unknown): PersonaliaEntry[] =>
  Array.isArray(v)
    ? v.map((e: any) => ({ tahun: String(e?.tahun ?? ''), judul: String(e?.judul ?? ''), keterangan: String(e?.keterangan ?? '') }))
    : [];

// Isi form dari data personalia yang sudah tersimpan (saat klik Edit)
export const extraFromPersonalia = (p: Personalia): PersonaliaExtra => ({
  tentang: p.tentang || '',
  foto_background_url: p.foto_background_url || '',
  riwayat_organisasi: asEntries(p.riwayat_organisasi),
  riwayat_pendidikan: asEntries(p.riwayat_pendidikan),
  prestasi_akademik: asEntries(p.prestasi_akademik),
  prestasi_non_akademik: asEntries(p.prestasi_non_akademik),
});

const cleanEntries = (list: PersonaliaEntry[]): PersonaliaEntry[] =>
  list
    .map((e) => ({ tahun: e.tahun.trim(), judul: e.judul.trim(), keterangan: (e.keterangan || '').trim() }))
    .filter((e) => e.judul !== '');

// Bentuk siap kirim ke API (baris kosong dibuang)
export const serializeExtra = (x: PersonaliaExtra) => ({
  tentang: x.tentang.trim() || null,
  foto_background_url: x.foto_background_url || null,
  riwayat_organisasi: cleanEntries(x.riwayat_organisasi),
  riwayat_pendidikan: cleanEntries(x.riwayat_pendidikan),
  prestasi_akademik: cleanEntries(x.prestasi_akademik),
  prestasi_non_akademik: cleanEntries(x.prestasi_non_akademik),
});

const inputCls =
  'w-full bg-gray-50 border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200';
const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase mb-1';

function EntryListEditor({
  label,
  hint,
  items,
  onChange,
}: {
  label: string;
  hint: string;
  items: PersonaliaEntry[];
  onChange: (next: PersonaliaEntry[]) => void;
}) {
  const update = (i: number, patch: Partial<PersonaliaEntry>) =>
    onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));

  return (
    <div className="border border-slate-200/80 rounded-2xl p-3 bg-white space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-extrabold text-brand-brown-dark uppercase tracking-wider">{label}</label>
        <button
          type="button"
          onClick={() => onChange([...items, { tahun: '', judul: '', keterangan: '' }])}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-green hover:underline cursor-pointer"
        >
          <Plus className="w-3 h-3" /> Tambah
        </button>
      </div>

      {items.length === 0 && <p className="text-[10px] text-gray-400 italic">{hint}</p>}

      {items.map((it, i) => (
        <div key={i} className="bg-gray-50 border border-slate-200/70 rounded-xl p-2.5 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={it.tahun}
              onChange={(e) => update(i, { tahun: e.target.value })}
              placeholder="Tahun"
              className={inputCls + ' !w-24 shrink-0'}
            />
            <input
              type="text"
              value={it.judul}
              onChange={(e) => update(i, { judul: e.target.value })}
              placeholder="Judul / nama"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              title="Hapus baris"
              className="shrink-0 text-gray-400 hover:text-brand-red p-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={it.keterangan || ''}
            onChange={(e) => update(i, { keterangan: e.target.value })}
            placeholder="Keterangan (opsional)"
            className={inputCls}
          />
        </div>
      ))}
    </div>
  );
}

export default function PersonaliaExtraFields({
  value,
  onChange,
}: {
  value: PersonaliaExtra;
  onChange: (next: PersonaliaExtra) => void;
}) {
  const [uploadingBg, setUploadingBg] = useState(false);
  const set = (patch: Partial<PersonaliaExtra>) => onChange({ ...value, ...patch });

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBg(true);
    try {
      const url = await compressAndUploadFile(file, 'gambar');
      set({ foto_background_url: url });
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah/kompres foto background. Coba lagi ya.');
    } finally {
      setUploadingBg(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t-2 border-dashed border-slate-200">
      <p className="text-[10px] font-extrabold text-brand-orange uppercase tracking-widest">
        Detail Profil (tampil di halaman "Lihat Detail")
      </p>

      <div>
        <label className={labelCls}>Tentang</label>
        <textarea
          rows={4}
          value={value.tentang}
          onChange={(e) => set({ tentang: e.target.value })}
          placeholder="Deskripsi singkat tentang orang ini…"
          className={inputCls + ' resize-y'}
        />
      </div>

      <div>
        <label className={labelCls}>Foto Background (halaman detail)</label>
        <label className="flex items-center justify-center gap-2 w-full bg-gray-50 border border-dashed border-slate-300 rounded-xl px-4 py-3 text-[10px] text-gray-500 hover:bg-white cursor-pointer transition-colors">
          <Upload className="w-3.5 h-3.5" />
          {uploadingBg ? 'Mengunggah…' : value.foto_background_url ? 'Ganti foto background' : 'Unggah foto background (lebar / landscape)'}
          <input type="file" accept="image/*" onChange={handleBgUpload} disabled={uploadingBg} className="hidden" />
        </label>
        {value.foto_background_url && (
          <div className="relative mt-2">
            <img src={value.foto_background_url} alt="Preview background" className="w-full h-24 object-cover rounded-xl border" />
            <button
              type="button"
              onClick={() => set({ foto_background_url: '' })}
              className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-black/80 text-white text-[9px] font-bold px-2 py-1 rounded-lg cursor-pointer"
            >
              Hapus
            </button>
          </div>
        )}
      </div>

      <EntryListEditor
        label="Riwayat Organisasi"
        hint="Contoh: 2021–2023 · Ketua Pramuka SMA Negeri 1"
        items={value.riwayat_organisasi}
        onChange={(riwayat_organisasi) => set({ riwayat_organisasi })}
      />
      <EntryListEditor
        label="Riwayat Pendidikan"
        hint="Contoh: 2019–2023 · S1 Pendidikan Guru — Universitas Siliwangi"
        items={value.riwayat_pendidikan}
        onChange={(riwayat_pendidikan) => set({ riwayat_pendidikan })}
      />
      <EntryListEditor
        label="Prestasi Akademik"
        hint="Contoh: 2022 · Lulusan Terbaik Fakultas"
        items={value.prestasi_akademik}
        onChange={(prestasi_akademik) => set({ prestasi_akademik })}
      />
      <EntryListEditor
        label="Prestasi Non Akademik"
        hint="Contoh: 2023 · Juara 1 LT III Tingkat Kabupaten"
        items={value.prestasi_non_akademik}
        onChange={(prestasi_non_akademik) => set({ prestasi_non_akademik })}
      />
    </div>
  );
}
