import React, { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Upload, Download, Trash2, Save, Loader2 } from 'lucide-react';
import { showAlert as alert, showConfirm } from '../utils/dialog';
import {
  PAMFLET_H,
  PAMFLET_SECTION_KEY,
  PAMFLET_W,
  PAMFLET_ZONES,
  PamfletTextTheme,
  buildGuidePng,
  prepareTemplateImage,
} from '../utils/pamfletTemplate';
import { ScaledPamflet, TemplatePamfletCanvas, PamfletData } from './PamfletCard';

const SAMPLE: PamfletData = {
  judul: 'Contoh judul berita pramuka yang tampil di pamflet',
  excerpt: 'Ini adalah contoh ringkasan berita yang otomatis diambil dari isi berita dan dipotong maksimal tiga baris pada pamflet.',
  gambar_url: null,
  author_name: 'Admin DKC',
  dateText: new Date().toLocaleDateString('id-ID'),
  qrValue: 'https://example.com/berita/contoh',
};

/**
 * Editor template pamflet berita. Admin mengunggah gambar latar 1080x1350 px,
 * sistem menempatkan foto/judul/ringkasan/QR ke zona tetap.
 * Disimpan di site_content (section_key = 'pamflet_template'); kosong = desain bawaan.
 */
export default function PamfletTemplateEditor() {
  const [savedUrl, setSavedUrl] = useState('');
  const [savedTheme, setSavedTheme] = useState<PamfletTextTheme>('dark');
  const [draft, setDraft] = useState<string | null>(null); // data URL template baru (belum disimpan)
  const [theme, setTheme] = useState<PamfletTextTheme>('dark');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/site_content')
      .then(r => r.json())
      .then((rows: any[]) => {
        if (cancelled) return;
        const c = rows.find(r => r.section_key === PAMFLET_SECTION_KEY)?.content;
        if (c?.url) {
          setSavedUrl(c.url);
          const t: PamfletTextTheme = c.textTheme === 'light' ? 'light' : 'dark';
          setSavedTheme(t);
          setTheme(t);
        }
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const previewUrl = draft || savedUrl;
  const dirty = !!draft || (!!savedUrl && theme !== savedTheme);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setDraft(await prepareTemplateImage(file));
    } catch (err: any) {
      alert(err?.message || 'Gambar template tidak valid.');
    }
  };

  const persist = async (content: { url: string; textTheme: PamfletTextTheme } | { url: '' }) => {
    const res = await fetch('/api/site_content/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section_key: PAMFLET_SECTION_KEY, content }),
    });
    if (!res.ok) throw new Error('save failed');
  };

  const handleSave = async () => {
    if (!previewUrl) return;
    setSaving(true);
    try {
      let url = savedUrl;
      if (draft) {
        const up = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: draft, name: 'pamflet-template', type: 'gambar' }),
        });
        const data = await up.json();
        if (!up.ok) throw new Error(data?.error || 'Gagal mengunggah template');
        url = data.url;
      }
      await persist({ url, textTheme: theme });
      setSavedUrl(url);
      setSavedTheme(theme);
      setDraft(null);
      alert('Template pamflet berhasil disimpan! Pamflet berita kini memakai template ini.');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Gagal menyimpan template pamflet.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!(await showConfirm('Hapus template dan kembali ke desain pamflet bawaan?'))) return;
    setSaving(true);
    try {
      await persist({ url: '' });
      setSavedUrl('');
      setDraft(null);
      setTheme('dark');
      setSavedTheme('dark');
      alert('Template dihapus. Pamflet kembali memakai desain bawaan.');
    } catch {
      alert('Gagal menghapus template. Coba lagi ya.');
    } finally {
      setSaving(false);
    }
  };

  const downloadGuide = () => {
    const a = document.createElement('a');
    a.href = buildGuidePng();
    a.download = 'panduan-template-pamflet-1080x1350.png';
    a.click();
  };

  const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase mb-1';

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="border-b pb-3 mb-5">
        <h3 className="font-extrabold text-sm text-brand-brown-dark tracking-tight flex items-center gap-2 font-mono">
          <span className="w-5 h-5 bg-brand-orange text-white rounded-full flex items-center justify-center text-[10px]">
            <ImageIcon className="w-3 h-3" />
          </span>
          Template Pamflet Berita
        </h3>
        <p className="text-[10px] text-gray-500 font-mono mt-1">
          Unggah desain latar pamflet. Sistem otomatis menaruh foto, judul, ringkasan, tanggal, dan QR Code ke zona yang sudah ditentukan.
          Belum ada template = memakai desain bawaan.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-xs font-mono">
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
              <p className="font-bold text-gray-700">Ketentuan template</p>
              <ul className="list-disc pl-4 text-gray-500 space-y-1 leading-relaxed">
                <li>Ukuran <b>{PAMFLET_W} × {PAMFLET_H} px</b> (rasio 4:5), format PNG/JPG.</li>
                <li>Bagian atas (0–250 px) bebas untuk logo, kop, dan hiasan.</li>
                <li>Sisakan area kosong/terang di zona berikut (jangan taruh teks desain di sana):</li>
              </ul>
              <table className="w-full text-[10px] mt-2">
                <tbody>
                  {PAMFLET_ZONES.map(z => (
                    <tr key={z.key} className="border-t border-slate-200">
                      <td className="py-1 font-bold text-gray-700">{z.nama}</td>
                      <td className="py-1 text-gray-500">x{z.x} y{z.y} · {z.w}×{z.h}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                type="button"
                onClick={downloadGuide}
                className="mt-2 w-full flex items-center justify-center gap-2 bg-white border border-slate-300 hover:bg-slate-100 text-gray-700 font-bold py-2.5 rounded-xl cursor-pointer"
              >
                <Download className="w-4 h-4" /> Unduh Panduan Tata Letak (PNG)
              </button>
            </div>

            <div>
              <label className={labelCls}>Warna teks pada pamflet</label>
              <div className="flex gap-2">
                {(['dark', 'light'] as PamfletTextTheme[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={`flex-1 py-2.5 rounded-xl border font-bold cursor-pointer ${
                      theme === t ? 'bg-brand-brown-dark text-white border-brand-brown-dark' : 'bg-gray-50 text-gray-600 border-slate-200'
                    }`}
                  >
                    {t === 'dark' ? 'Gelap (latar terang)' : 'Terang (latar gelap)'}
                  </button>
                ))}
              </div>
            </div>

            <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handlePick} />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-green text-white font-extrabold py-3 rounded-xl uppercase cursor-pointer hover:brightness-110"
              >
                <Upload className="w-4 h-4" /> {savedUrl || draft ? 'Ganti Template' : 'Unggah Template'}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!dirty || saving}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-brown-dark text-white font-extrabold py-3 rounded-xl uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-brand-orange" />} Simpan
              </button>
            </div>
            {savedUrl && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 text-red-600 border border-red-200 hover:bg-red-50 font-bold py-2.5 rounded-xl cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-4 h-4" /> Hapus Template (kembali ke bawaan)
              </button>
            )}
            {draft && <p className="text-[10px] text-amber-600">Template baru belum disimpan. Klik Simpan agar berlaku di website.</p>}
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase mb-2">
              {previewUrl ? 'Pratinjau dengan data contoh' : 'Belum ada template — pamflet memakai desain bawaan'}
            </span>
            {previewUrl ? (
              <ScaledPamflet maxWidth={340}>
                <TemplatePamfletCanvas d={SAMPLE} imageUrl={previewUrl} textTheme={theme} />
              </ScaledPamflet>
            ) : (
              <div className="w-full max-w-[340px] aspect-[4/5] rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center text-gray-400 text-center p-6">
                Unggah template untuk melihat pratinjau
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
