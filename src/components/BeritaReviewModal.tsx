import React, { useMemo, useState } from 'react';
import { X, Check, Save, Loader2, Eye, Pencil } from 'lucide-react';
import { showAlert as alert, showConfirm } from '../utils/dialog';
import { compressAndUploadFile } from '../utils/imageUpload';
import type { Berita } from '../types';

/**
 * Tinjau & edit berita ajuan DKR/Saka sebelum admin DKC menyetujui.
 * Admin melihat isi lengkap (pratinjau), boleh mengubah judul/isi/foto, lalu
 * menyimpan saja (tetap pending), menolak, atau menyimpan sekaligus menerbitkan.
 */
export default function BeritaReviewModal({
  berita,
  onClose,
  onDone,
}: {
  berita: Berita;
  onClose: () => void;
  onDone: () => void;
}) {
  const [judul, setJudul] = useState(berita.judul);
  const [konten, setKonten] = useState(berita.konten);
  const [gambar, setGambar] = useState(berita.gambar_url || '');
  const [tab, setTab] = useState<'edit' | 'preview'>('preview');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);

  const asal = berita.saka_id ? `SAKA ${berita.saka_nama ?? ''}` : berita.kecamatan_id ? `DKR ${berita.kecamatan_nama ?? ''}` : 'DKC';
  const dirty = judul !== berita.judul || konten !== berita.konten || gambar !== (berita.gambar_url || '');

  // Isi berita berasal dari pengirim → dirender di iframe tersandbox (tanpa script) agar aman.
  const previewDoc = useMemo(
    () =>
      `<!doctype html><meta charset="utf-8"><base target="_blank"><style>body{font:15px/1.7 system-ui,sans-serif;color:#1f2937;margin:0;padding:4px}img{max-width:100%;height:auto}</style>${konten}`,
    [konten]
  );

  const post = async (url: string, body: any) => {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d?.error || 'Permintaan gagal');
    }
  };

  const saveEdits = () => post('/api/berita/save', { id: berita.id, judul: judul.trim(), konten, gambar_url: gambar });

  const validate = () => {
    if (!judul.trim() || !konten.trim()) {
      alert('Judul dan isi berita tidak boleh kosong.');
      return false;
    }
    return true;
  };

  const run = async (fn: () => Promise<void>, okMsg: string) => {
    setBusy(true);
    try {
      await fn();
      alert(okMsg);
      onDone();
      onClose();
    } catch (e: any) {
      alert(e?.message || 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const handleSave = () => validate() && run(saveEdits, 'Perubahan disimpan. Berita masih menunggu persetujuan.');

  const handleApprove = async () => {
    if (!validate()) return;
    if (!(await showConfirm(`Terbitkan berita "${judul.trim()}"${dirty ? ' (dengan perubahan Anda)' : ''}?`))) return;
    run(async () => {
      if (dirty) await saveEdits();
      await post('/api/berita/status', { id: berita.id, status: 'approved' });
    }, 'Berita disetujui dan diterbitkan.');
  };

  const handleReject = async () => {
    if (!(await showConfirm('Tolak berita ini?'))) return;
    run(() => post('/api/berita/status', { id: berita.id, status: 'rejected' }), 'Berita ditolak.');
  };

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      setGambar(await compressAndUploadFile(file, 'gambar'));
    } catch (err: any) {
      alert(err?.message || 'Gagal mengunggah foto.');
    } finally {
      setUploading(false);
    }
  };

  const inputCls =
    'w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white';
  const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl my-4 flex flex-col max-h-[94vh]">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div className="min-w-0">
            <span className="bg-[#2E5C9A]/15 text-[#2E5C9A] border border-[#2E5C9A]/20 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono uppercase">
              {asal}
            </span>
            <h3 className="font-extrabold text-base text-brand-brown-dark mt-1.5 leading-snug">Tinjau Berita Ajuan</h3>
            <p className="text-[10px] text-gray-400 font-mono">Diajukan oleh: {berita.author_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer" aria-label="Tutup">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 px-5 pt-4">
          {([['preview', 'Pratinjau', Eye], ['edit', 'Edit', Pencil]] as const).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-mono cursor-pointer ${
                tab === k ? 'bg-brand-brown-dark text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
          {dirty && <span className="ml-auto self-center text-[10px] font-bold text-amber-600 font-mono">Ada perubahan belum disimpan</span>}
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          {tab === 'preview' ? (
            <div className="space-y-4">
              {gambar && <img src={gambar} alt={judul} className="w-full max-h-64 object-cover rounded-2xl border border-gray-100" />}
              <h2 className="font-extrabold text-xl text-slate-900 leading-snug">{judul}</h2>
              <iframe title="Pratinjau isi berita" sandbox="" srcDoc={previewDoc} className="w-full min-h-[320px] rounded-2xl border border-gray-100 bg-white" />
            </div>
          ) : (
            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className={labelCls}>Judul</label>
                <input value={judul} onChange={e => setJudul(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Foto sampul</label>
                {gambar && <img src={gambar} alt="" className="h-28 rounded-xl object-cover mb-2 border border-gray-100" />}
                <input type="file" accept="image/*" onChange={handleImage} disabled={uploading} className={inputCls + ' !py-2.5 text-[10px]'} />
                {uploading && <p className="text-[10px] text-brand-orange mt-1 animate-pulse">Mengunggah...</p>}
              </div>
              <div>
                <label className={labelCls}>Isi artikel (HTML didukung)</label>
                <textarea rows={14} value={konten} onChange={e => setKonten(e.target.value)} className={inputCls + ' font-sans'} />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-end p-5 border-t border-gray-100">
          <button
            onClick={handleReject}
            disabled={busy}
            className="bg-brand-red/10 hover:bg-brand-red/20 text-brand-red border border-brand-red/20 font-bold px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" /> Tolak
          </button>
          <button
            onClick={handleSave}
            disabled={busy || !dirty}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 font-bold px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" /> Simpan Perubahan
          </button>
          <button
            onClick={handleApprove}
            disabled={busy || uploading}
            className="bg-brand-green text-white font-extrabold px-4 py-2.5 rounded-xl text-xs font-mono flex items-center gap-1.5 cursor-pointer hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} {dirty ? 'Simpan & Terbitkan' : 'Setujui & Terbitkan'}
          </button>
        </div>
      </div>
    </div>
  );
}
