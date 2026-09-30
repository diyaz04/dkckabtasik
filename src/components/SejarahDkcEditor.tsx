import React, { useEffect, useRef, useState } from 'react';
import { History, Plus, Trash2, ArrowUp, ArrowDown, Upload, Save, Loader2, User } from 'lucide-react';
import { showAlert as alert, showConfirm } from '../utils/dialog';
import { compressAndUploadFile } from '../utils/imageUpload';
import type { SejarahDkcItem } from '../types';

/**
 * Editor "Sejarah DKC dari masa ke masa" untuk dashboard admin.
 * Disimpan di site_content (section_key = 'sejarah_dkc') -> tanpa migrasi database.
 * Urutan kartu = urutan kronologis di timeline landing page (paling atas = paling awal).
 */

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `sj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyItem = (): SejarahDkcItem => ({
  id: newId(),
  nama: '',
  foto_url: '',
  masa_bakti: '',
  deskripsi: '',
});

export default function SejarahDkcEditor() {
  const [items, setItems] = useState<SejarahDkcItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/site_content')
      .then(r => r.json())
      .then((sc: any[]) => {
        if (cancelled) return;
        const row = sc.find(item => item.section_key === 'sejarah_dkc');
        const list = Array.isArray(row?.content?.items) ? row.content.items : [];
        setItems(
          list.map((it: any) => ({
            id: it.id || newId(),
            nama: it.nama || '',
            foto_url: it.foto_url || '',
            masa_bakti: it.masa_bakti || '',
            deskripsi: it.deskripsi || '',
          }))
        );
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // Peringatan kalau tab ditutup padahal ada perubahan belum disimpan
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const update = (id: string, patch: Partial<SejarahDkcItem>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
    setDirty(true);
  };

  const addItem = () => {
    setItems(prev => [...prev, emptyItem()]);
    setDirty(true);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const removeItem = async (it: SejarahDkcItem) => {
    const label = it.nama.trim() || 'periode ini';
    if (!(await showConfirm(`Hapus ${label} dari sejarah DKC?`))) return;
    setItems(prev => prev.filter(x => x.id !== it.id));
    setDirty(true);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    setItems(prev => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setDirty(true);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // biar bisa pilih file yang sama lagi
    if (!file) return;
    setUploadingId(id);
    try {
      const url = await compressAndUploadFile(file, 'gambar');
      update(id, { foto_url: url });
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah/kompres foto. Coba lagi ya bro.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleSave = async () => {
    const invalid = items.findIndex(it => !it.nama.trim() || !it.masa_bakti.trim());
    if (invalid !== -1) {
      alert(`Kartu #${invalid + 1}: nama ketua dan masa bakti wajib diisi ya bro.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/site_content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: 'sejarah_dkc',
          content: {
            items: items.map(it => ({
              id: it.id,
              nama: it.nama.trim(),
              foto_url: it.foto_url,
              masa_bakti: it.masa_bakti.trim(),
              deskripsi: it.deskripsi.trim(),
            })),
          },
        }),
      });
      if (!res.ok) throw new Error('save failed');
      setDirty(false);
      alert('Sejarah DKC berhasil disimpan dan tampil di landing page!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan sejarah DKC. Coba lagi ya.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200';
  const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase mb-1';

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="border-b pb-3 mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-sm text-brand-brown-dark tracking-tight flex items-center gap-2 font-mono">
            <span className="w-5 h-5 bg-brand-green text-white rounded-full flex items-center justify-center text-[10px]">
              <History className="w-3 h-3" />
            </span>
            Sejarah DKC (Dari Masa ke Masa)
          </h3>
          <p className="text-[10px] text-gray-500 font-mono mt-1 max-w-2xl">
            Isi ketua DKC dari periode paling awal sampai sekarang. Urutan kartu = urutan alur di landing page
            (paling atas = paling awal). Pakai tombol panah untuk mengatur urutan.
          </p>
        </div>
        {dirty && (
          <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 self-start">
            Ada perubahan belum disimpan
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
        </div>
      ) : (
        <div className="space-y-5 font-mono">
          {items.length === 0 && (
            <div className="text-center text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl py-10">
              Belum ada data sejarah. Klik "Tambah Periode" untuk mulai. Section sejarah baru tampil di landing page
              setelah ada minimal satu periode.
            </div>
          )}

          {items.map((it, index) => (
            <div key={it.id} className="border border-gray-200 rounded-2xl p-4 sm:p-5 bg-gray-50/60">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-brown-dark bg-brand-orange/15 rounded-full px-3 py-1">
                  Periode ke-{index + 1}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    title="Geser ke atas (lebih awal)"
                    className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-brand-brown-dark disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    title="Geser ke bawah (lebih baru)"
                    className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-brand-brown-dark disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(it)}
                    title="Hapus periode"
                    className="p-2 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-5 items-start">
                {/* Foto */}
                <div className="space-y-2">
                  <label className={labelCls}>Foto Ketua</label>
                  <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-md bg-gray-100 flex items-center justify-center mx-auto md:mx-0">
                    {it.foto_url ? (
                      <img src={it.foto_url} alt={it.nama || 'Foto ketua'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User className="w-10 h-10 text-gray-300" />
                    )}
                    {uploadingId === it.id && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    id={`sejarah-foto-${it.id}`}
                    className="hidden"
                    onChange={e => handlePhoto(e, it.id)}
                  />
                  <label
                    htmlFor={`sejarah-foto-${it.id}`}
                    className="bg-brand-brown-dark hover:bg-brand-orange text-white font-bold text-[10px] py-2 px-3 rounded-xl cursor-pointer transition-all duration-200 uppercase tracking-wider inline-flex items-center gap-1.5 w-full md:w-auto justify-center"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{it.foto_url ? 'Ganti Foto' : 'Unggah Foto'}</span>
                  </label>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Nama Ketua *</label>
                      <input
                        type="text"
                        value={it.nama}
                        onChange={e => update(it.id, { nama: e.target.value })}
                        placeholder="Nama lengkap ketua DKC"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Masa Bakti *</label>
                      <input
                        type="text"
                        value={it.masa_bakti}
                        onChange={e => update(it.id, { masa_bakti: e.target.value })}
                        placeholder="contoh: 2010 – 2015"
                        className={inputCls}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Deskripsi Masa Kepengurusan</label>
                    <textarea
                      rows={4}
                      value={it.deskripsi}
                      onChange={e => update(it.id, { deskripsi: e.target.value })}
                      placeholder="Ceritakan capaian, program unggulan, dan kenangan pada masa kepengurusan ini..."
                      className={inputCls + ' resize-y font-sans'}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={addItem}
              className="border-2 border-dashed border-brand-green text-brand-green hover:bg-brand-green hover:text-white font-bold text-[10px] py-3 px-5 rounded-xl transition-all duration-200 uppercase tracking-wider inline-flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Periode
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploadingId !== null}
              className="bg-brand-brown-dark hover:bg-brand-orange disabled:opacity-60 text-white font-bold text-[10px] py-3 px-5 rounded-xl transition-all duration-200 uppercase tracking-wider inline-flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Menyimpan...' : 'Simpan Sejarah DKC'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
