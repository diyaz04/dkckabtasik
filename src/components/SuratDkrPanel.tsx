import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Send, Paperclip, FileText, ExternalLink, Trash2, ChevronDown, Calendar, X } from 'lucide-react';
import { SuratDkr, SuratJenis } from '../types';
import { compressAndUploadFile } from '../utils/imageUpload';
import { showAlert as alert, showConfirm } from '../utils/dialog';
import { SURAT_JENIS, jenisLabel, formatTanggal } from '../utils/suratDkr';
import { StatusBadge, StatusTrack } from './SuratShared';

const MAX_PDF_MB = 3; // batas request Vercel ±4.5MB, file dikirim sebagai base64 (+33%)

const inputCls =
  'w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200';
const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase mb-1';

interface Props {
  kecamatan: { id: string; nama_kecamatan: string };
  list: SuratDkr[];
  reload: () => void | Promise<void>;
}

export default function SuratDkrPanel({ kecamatan, list, reload }: Props) {
  const [jenis, setJenis] = useState<SuratJenis>('permohonan_pemateri');
  const [nomor, setNomor] = useState('');
  const [perihal, setPerihal] = useState('');
  const [tglSurat, setTglSurat] = useState('');
  const [tglAcara, setTglAcara] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0);
  const [sending, setSending] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const resetForm = () => {
    setJenis('permohonan_pemateri');
    setNomor('');
    setPerihal('');
    setTglSurat('');
    setTglAcara('');
    setKeterangan('');
    setFile(null);
    setFileKey((k) => k + 1);
  };

  const handlePickFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      alert('File surat harus berformat PDF.', 'warning');
      e.target.value = '';
      return;
    }
    if (f.size > MAX_PDF_MB * 1024 * 1024) {
      alert(`Ukuran PDF terlalu besar (${(f.size / 1024 / 1024).toFixed(1)} MB). Maksimal ${MAX_PDF_MB} MB — kompres dulu PDF-nya ya.`, 'warning');
      e.target.value = '';
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!perihal.trim()) return alert('Perihal surat wajib diisi.', 'warning');
    if (!file) return alert('Harap pilih file surat (PDF) terlebih dahulu.', 'warning');

    setSending(true);
    try {
      const fileUrl = await compressAndUploadFile(file, 'dokumen');
      const res = await fetch('/api/surat-dkr/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kecamatan_id: kecamatan.id,
          jenis,
          nomor_surat: nomor,
          perihal,
          tanggal_surat: tglSurat || null,
          tanggal_acara: tglAcara || null,
          keterangan,
          file_url: fileUrl,
          file_nama: file.name,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan surat');
      resetForm();
      alert('Surat berhasil dikirim ke DKC! Admin akan langsung mendapat pemberitahuan.', 'success');
      reload();
    } catch (err: any) {
      console.error(err);
      alert('Gagal mengirim surat: ' + (err.message || 'terjadi kesalahan'), 'error');
    } finally {
      setSending(false);
    }
  };

  const toggleOpen = async (s: SuratDkr) => {
    const willOpen = openId !== s.id;
    setOpenId(willOpen ? s.id : null);
    if (willOpen && !s.dilihat_dkr) {
      try {
        await fetch('/api/surat-dkr/seen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: s.id, kecamatan_id: kecamatan.id }),
        });
        reload();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleDelete = async (s: SuratDkr) => {
    if (!(await showConfirm(`Hapus surat "${s.perihal}"? Surat ini belum dibaca oleh DKC.`))) return;
    try {
      const res = await fetch('/api/surat-dkr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id, kecamatan_id: kecamatan.id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal menghapus surat');
      alert('Surat berhasil dihapus.', 'success');
      reload();
    } catch (err: any) {
      alert('Gagal menghapus surat: ' + err.message, 'error');
    }
  };

  const belumDilihat = list.filter((s) => !s.dilihat_dkr).length;

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Surat ke DKC</h1>
        <p className="text-xs text-gray-500 font-mono mt-1">
          Kirim surat resmi (permohonan pemateri, undangan, dll) dalam bentuk PDF. Admin DKC langsung mendapat pemberitahuan, dan status surat bisa Anda pantau di sini.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* FORM KIRIM */}
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5 self-start">
          <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight border-b-2 border-brand-orange pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-brand-orange" /> Kirim Surat Baru
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 font-mono">
            <div>
              <label className={labelCls}>Jenis Surat</label>
              <select value={jenis} onChange={(e) => setJenis(e.target.value as SuratJenis)} className={inputCls + ' font-bold'}>
                {SURAT_JENIS.map((j) => (
                  <option key={j.value} value={j.value}>{j.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Perihal *</label>
              <input type="text" value={perihal} onChange={(e) => setPerihal(e.target.value)} placeholder="Contoh: Permohonan pemateri Latihan Gabungan" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Nomor Surat</label>
              <input type="text" value={nomor} onChange={(e) => setNomor(e.target.value)} placeholder="Contoh: 012/DKR-SGP/IX/2026" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Tanggal Surat</label>
                <input type="date" value={tglSurat} onChange={(e) => setTglSurat(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Tanggal Acara</label>
                <input type="date" value={tglAcara} onChange={(e) => setTglAcara(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Catatan untuk DKC (opsional)</label>
              <textarea rows={3} value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Info tambahan: lokasi, waktu, materi yang diminta…" className={inputCls + ' resize-y'} />
            </div>

            <div>
              <label className={labelCls}>File Surat (PDF, maks {MAX_PDF_MB} MB) *</label>
              <label className="flex items-center justify-center gap-2 w-full bg-gray-50 border border-dashed border-slate-300 rounded-xl px-4 py-3 text-[11px] text-gray-500 hover:bg-white cursor-pointer transition-colors">
                <Paperclip className="w-3.5 h-3.5" />
                {file ? 'Ganti file PDF' : 'Pilih file PDF'}
                <input key={fileKey} type="file" accept="application/pdf,.pdf" onChange={handlePickFile} className="hidden" />
              </label>
              {file && (
                <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  <FileText className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-[11px] text-gray-700 font-bold truncate flex-1">{file.name}</span>
                  <span className="text-[10px] text-gray-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                  <button type="button" onClick={() => { setFile(null); setFileKey((k) => k + 1); }} className="text-gray-400 hover:text-brand-red cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-brand-green hover:bg-brand-green/95 text-white font-extrabold text-xs py-3 rounded-xl uppercase shadow disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> {sending ? 'Mengirim…' : 'Kirim ke DKC'}
            </button>
          </form>
        </div>

        {/* RIWAYAT */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b pb-2 mb-4">
            <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight">Riwayat Surat Terkirim ({list.length})</h3>
            {belumDilihat > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-extrabold font-mono px-2.5 py-1 rounded-full">{belumDilihat} update baru</span>
            )}
          </div>

          {list.length === 0 ? (
            <div className="bg-gray-50 border border-gray-150 rounded-2xl p-8 text-center text-gray-500 italic text-xs font-mono">
              Belum ada surat yang Anda kirim ke DKC.
            </div>
          ) : (
            <div className="space-y-3">
              {list.map((s) => {
                const open = openId === s.id;
                return (
                  <div key={s.id} className={`border rounded-2xl overflow-hidden transition-colors ${!s.dilihat_dkr ? 'border-brand-orange/60 bg-orange-50/40' : 'border-gray-150 bg-gray-50'}`}>
                    <button type="button" onClick={() => toggleOpen(s)} className="w-full text-left p-4 flex items-start gap-3 cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-[9px] font-extrabold font-mono uppercase tracking-wider text-brand-brown-mid bg-brand-brown-mid/10 px-2 py-0.5 rounded-md">{jenisLabel(s.jenis)}</span>
                          {!s.dilihat_dkr && <span className="text-[9px] font-extrabold font-mono uppercase bg-brand-orange text-white px-2 py-0.5 rounded-md">Update baru</span>}
                        </div>
                        <h4 className="font-extrabold text-sm text-brand-brown-dark leading-snug break-words">{s.perihal}</h4>
                        <p className="text-[10px] text-gray-400 font-mono mt-1">
                          {s.nomor_surat ? `${s.nomor_surat} • ` : ''}Dikirim {formatTanggal(s.created_at, true)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <StatusBadge status={s.status} />
                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {open && (
                      <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-200/70 bg-white">
                        <div className="pt-4"><StatusTrack surat={s} /></div>

                        {(s.status !== 'terkirim' && s.status !== 'dibaca') || s.tanggapan ? (
                          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 text-xs space-y-1.5">
                            <p className="text-[10px] font-extrabold uppercase font-mono text-emerald-700">Tanggapan DKC</p>
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{s.tanggapan || 'Tidak ada keterangan tambahan.'}</p>
                            {s.status === 'diwakilkan' && s.diwakili_oleh && (
                              <p className="text-gray-700"><span className="font-bold">Diwakili oleh:</span> {s.diwakili_oleh}</p>
                            )}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-400 italic font-mono">
                            {s.status === 'dibaca' ? 'Surat sudah dibaca DKC, menunggu tanggapan.' : 'Surat terkirim, menunggu dibaca DKC.'}
                          </p>
                        )}

                        <div className="text-[11px] text-gray-500 font-mono space-y-1">
                          {s.tanggal_surat && <p>Tanggal surat: <b className="text-gray-700">{formatTanggal(s.tanggal_surat)}</b></p>}
                          {s.tanggal_acara && (
                            <p className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Tanggal acara: <b className="text-gray-700">{formatTanggal(s.tanggal_acara)}</b></p>
                          )}
                          {s.keterangan && <p>Catatan: <span className="text-gray-700">{s.keterangan}</span></p>}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-brand-teal hover:underline">
                            <ExternalLink className="w-3.5 h-3.5" /> Buka PDF{s.file_nama ? ` (${s.file_nama})` : ''}
                          </a>
                          {s.status === 'terkirim' && (
                            <button type="button" onClick={() => handleDelete(s)} className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-brand-red hover:underline cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" /> Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
