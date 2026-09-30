import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import {
  Megaphone, Plus, Trash2, ArrowUp, ArrowDown, Upload, Save, Loader2, Eye, ImageIcon, Link2,
} from 'lucide-react';
import { showAlert as alert, showConfirm } from '../utils/dialog';
import { compressAndUploadFile } from '../utils/imageUpload';
import type { PengumumanItem } from '../types';
import { normalizeLink, parsePengumuman, isExpired } from '../utils/pengumuman';
import { PengumumanModal } from './PengumumanPopup';

/**
 * Menu dashboard admin: Pengumuman Landingpage.
 * Disimpan di site_content (section_key = 'pengumuman') -> tanpa migrasi database.
 */

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `pg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyItem = (): PengumumanItem => ({
  id: newId(),
  judul: '',
  isi: '',
  gambar_url: '',
  tombol_teks: 'Selengkapnya',
  tombol_link: '',
  berlaku_sampai: '',
  aktif: true,
  popup: false,
  dibuat: new Date().toISOString(),
});

function Switch({
  checked, onChange, label, hint,
}: { checked: boolean; onChange: (v: boolean) => void; label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-extrabold text-brand-brown-dark">{label}</p>
        <p className="text-[10px] text-gray-400 font-sans">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0E9F6E]/30 ${
          checked ? 'bg-[#0E9F6E]' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function PengumumanEditor() {
  const [items, setItems] = useState<PengumumanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/site_content')
      .then(r => r.json())
      .then((sc: any[]) => {
        if (cancelled) return;
        const row = sc.find(x => x.section_key === 'pengumuman');
        setItems(parsePengumuman(row?.content));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const update = (id: string, patch: Partial<PengumumanItem>) => {
    setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
    setDirty(true);
  };

  const addItem = () => {
    setItems(prev => [emptyItem(), ...prev]); // baru = paling depan
    setDirty(true);
  };

  const removeItem = async (it: PengumumanItem) => {
    if (!(await showConfirm(`Hapus pengumuman "${it.judul.trim() || 'tanpa judul'}"?`))) return;
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
    e.target.value = '';
    if (!file) return;
    setUploadingId(id);
    try {
      const url = await compressAndUploadFile(file, 'gambar');
      update(id, { gambar_url: url });
    } catch (err) {
      console.error(err);
      alert('Gagal mengunggah/kompres gambar. Coba lagi ya bro.');
    } finally {
      setUploadingId(null);
    }
  };

  const handleSave = async () => {
    const cleaned: PengumumanItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.judul.trim() || !it.isi.trim()) {
        alert(`Pengumuman #${i + 1}: judul dan isi wajib diisi ya bro.`);
        return;
      }
      const link = normalizeLink(it.tombol_link);
      if (link === null) {
        alert(
          `Pengumuman #${i + 1}: link tombol nggak valid. Pakai format https://..., https://wa.me/62..., atau path internal seperti /informasi.`
        );
        return;
      }
      cleaned.push({
        ...it,
        judul: it.judul.trim(),
        isi: it.isi.trim(),
        tombol_link: link,
        tombol_teks: link ? it.tombol_teks.trim() || 'Selengkapnya' : '',
      });
    }

    setSaving(true);
    try {
      const res = await fetch('/api/site_content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section_key: 'pengumuman', content: { items: cleaned } }),
      });
      if (!res.ok) throw new Error('save failed');
      setItems(cleaned);
      setDirty(false);
      alert('Pengumuman berhasil disimpan!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengumuman. Coba lagi ya.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200';
  const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase mb-1';

  const previewItem = items.find(i => i.id === previewId) || null;
  const tampilCount = items.filter(i => i.aktif && !isExpired(i)).length;
  const popupCount = items.filter(i => i.aktif && i.popup && !isExpired(i)).length;

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-brand-orange" /> Pengumuman Landingpage
        </h1>
        <p className="text-xs text-gray-500 font-mono mt-1">
          Kelola pengumuman yang tampil di section "Pengumuman" landing page. Tiap pengumuman bisa dimunculkan juga
          sebagai popup promosi (opsional) dan dilengkapi tombol menuju link tujuan.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold">
            <span className="bg-brand-green/10 text-brand-green rounded-full px-3 py-1">{tampilCount} tampil di landing page</span>
            <span className="bg-brand-orange/10 text-brand-orange rounded-full px-3 py-1">{popupCount} muncul sebagai popup</span>
            {dirty && (
              <span className="text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                Ada perubahan belum disimpan
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="border-2 border-dashed border-brand-green text-brand-green hover:bg-brand-green hover:text-white font-mono font-bold text-[10px] py-2.5 px-5 rounded-xl transition-all duration-200 uppercase tracking-wider inline-flex items-center justify-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Pengumuman
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-gray-400 font-mono py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
          </div>
        ) : (
          <div className="space-y-5 font-mono">
            {items.length === 0 && (
              <div className="text-center text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl py-10">
                Belum ada pengumuman. Klik "Tambah Pengumuman" untuk mulai. Section baru muncul di landing page setelah
                ada minimal satu pengumuman yang aktif.
              </div>
            )}

            {items.map((it, index) => {
              const expired = isExpired(it);
              const linkInvalid = it.tombol_link.trim() !== '' && normalizeLink(it.tombol_link) === null;
              return (
                <div key={it.id} className="border border-gray-200 rounded-2xl p-4 sm:p-5 bg-gray-50/60 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-brown-dark bg-brand-orange/15 rounded-full px-3 py-1">
                        #{index + 1}
                      </span>
                      {expired && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-full px-3 py-1">
                          Kedaluwarsa (tidak tampil)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewId(it.id)}
                        disabled={!it.judul.trim()}
                        title="Pratinjau popup"
                        className="px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-brand-brown-dark text-[10px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau Popup
                      </button>
                      <button
                        type="button" onClick={() => move(index, -1)} disabled={index === 0}
                        title="Geser ke depan"
                        className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-brand-brown-dark disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1}
                        title="Geser ke belakang"
                        className="p-2 rounded-lg bg-white border border-gray-200 text-gray-500 hover:text-brand-brown-dark disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button" onClick={() => removeItem(it)} title="Hapus pengumuman"
                        className="p-2 rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 items-start">
                    {/* Gambar */}
                    <div className="space-y-2">
                      <label className={labelCls}>Gambar / Poster (opsional)</label>
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                        {it.gambar_url ? (
                          <img src={it.gambar_url} alt="Gambar pengumuman" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        )}
                        {uploadingId === it.id && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <input
                        type="file" accept="image/*" id={`pgm-img-${it.id}`} className="hidden"
                        onChange={e => handlePhoto(e, it.id)}
                      />
                      <div className="flex gap-2">
                        <label
                          htmlFor={`pgm-img-${it.id}`}
                          className="flex-1 bg-brand-brown-dark hover:bg-brand-orange text-white font-bold text-[10px] py-2 px-3 rounded-xl cursor-pointer transition-all duration-200 uppercase tracking-wider inline-flex items-center gap-1.5 justify-center"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {it.gambar_url ? 'Ganti' : 'Unggah'}
                        </label>
                        {it.gambar_url && (
                          <button
                            type="button" onClick={() => update(it.id, { gambar_url: '' })}
                            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-[10px] font-bold text-gray-500 hover:text-red-500"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Isi */}
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Judul *</label>
                        <input
                          type="text" value={it.judul} maxLength={120}
                          onChange={e => update(it.id, { judul: e.target.value })}
                          placeholder="contoh: Pendaftaran Raimuna Cabang 2026 Dibuka"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Isi Pengumuman *</label>
                        <textarea
                          rows={4} value={it.isi}
                          onChange={e => update(it.id, { isi: e.target.value })}
                          placeholder="Tulis detail pengumuman..."
                          className={inputCls + ' resize-y font-sans'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tombol + masa berlaku */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Teks Tombol</label>
                      <input
                        type="text" value={it.tombol_teks} maxLength={30}
                        onChange={e => update(it.id, { tombol_teks: e.target.value })}
                        placeholder="Daftar Sekarang"
                        className={inputCls}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelCls}>
                        <Link2 className="w-3 h-3 inline -mt-0.5 mr-1" />
                        Link Tujuan Tombol
                      </label>
                      <input
                        type="text" value={it.tombol_link}
                        onChange={e => update(it.id, { tombol_link: e.target.value })}
                        placeholder="https://... atau https://wa.me/62... atau /informasi"
                        className={inputCls + (linkInvalid ? ' !border-red-400 !ring-2 !ring-red-400/20' : '')}
                      />
                      <p className={`text-[9px] font-sans mt-1 ${linkInvalid ? 'text-red-500' : 'text-gray-400'}`}>
                        {linkInvalid
                          ? 'Link belum valid. Gunakan https://..., mailto:, tel:, atau path internal diawali "/".'
                          : 'Kosongkan link kalau pengumuman tidak butuh tombol.'}
                      </p>
                    </div>
                    <div>
                      <label className={labelCls}>Berlaku Sampai (opsional)</label>
                      <input
                        type="date" value={it.berlaku_sampai}
                        onChange={e => update(it.id, { berlaku_sampai: e.target.value })}
                        className={inputCls}
                      />
                      <p className="text-[9px] text-gray-400 font-sans mt-1">Lewat tanggal ini otomatis disembunyikan.</p>
                    </div>
                  </div>

                  {/* Toggle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Switch
                      checked={it.aktif}
                      onChange={v => update(it.id, { aktif: v })}
                      label="Tampilkan di landing page"
                      hint="Muncul di section Pengumuman."
                    />
                    <Switch
                      checked={it.popup && it.aktif}
                      onChange={v => update(it.id, { popup: v, ...(v ? { aktif: true } : {}) })}
                      label="Munculkan sebagai popup promosi"
                      hint="Popup tampil sekali per sesi pengunjung."
                    />
                  </div>
                </div>
              );
            })}

            {items.length > 0 && (
              <div className="pt-2">
                <button
                  type="button" onClick={handleSave} disabled={saving || uploadingId !== null}
                  className="bg-brand-brown-dark hover:bg-brand-orange disabled:opacity-60 text-white font-bold text-[10px] py-3 px-6 rounded-xl transition-all duration-200 uppercase tracking-wider inline-flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? 'Menyimpan...' : 'Simpan Pengumuman'}
                </button>
              </div>
            )}
            {items.length === 0 && dirty && (
              <button
                type="button" onClick={handleSave} disabled={saving}
                className="bg-brand-brown-dark hover:bg-brand-orange disabled:opacity-60 text-white font-bold text-[10px] py-3 px-6 rounded-xl uppercase tracking-wider inline-flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" /> Simpan (kosongkan semua pengumuman)
              </button>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {previewItem && (
          <PengumumanModal item={previewItem} onClose={() => setPreviewId(null)} preview />
        )}
      </AnimatePresence>
    </div>
  );
}
