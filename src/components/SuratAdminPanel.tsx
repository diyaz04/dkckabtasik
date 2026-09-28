import { useEffect, useMemo, useState } from 'react';
import { Search, ExternalLink, Trash2, X, Calendar, Building2, Inbox, Send } from 'lucide-react';
import { SuratDkr, SuratStatus } from '../types';
import { showAlert as alert, showConfirm } from '../utils/dialog';
import { SURAT_JENIS, SURAT_STATUS, SURAT_STATUS_TANGGAPAN, jenisLabel, formatTanggal } from '../utils/suratDkr';
import { StatusBadge, StatusTrack } from './SuratShared';

const inputCls =
  'w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200';
const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase mb-1';

interface Props {
  list: SuratDkr[];
  reload: () => void | Promise<void>;
}

export default function SuratAdminPanel({ list, reload }: Props) {
  const [filterStatus, setFilterStatus] = useState<string>('semua');
  const [filterJenis, setFilterJenis] = useState<string>('semua');
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // form tanggapan
  const [respStatus, setRespStatus] = useState<SuratStatus>('diterima');
  const [respTanggapan, setRespTanggapan] = useState('');
  const [respWakil, setRespWakil] = useState('');
  const [saving, setSaving] = useState(false);

  const selected = useMemo(() => list.find((s) => s.id === selectedId) || null, [list, selectedId]);

  // isi ulang form tiap kali surat berbeda dibuka
  useEffect(() => {
    if (!selected) return;
    const isTanggapan = SURAT_STATUS_TANGGAPAN.some((o) => o.value === selected.status);
    setRespStatus(isTanggapan ? selected.status : 'diterima');
    setRespTanggapan(selected.tanggapan || '');
    setRespWakil(selected.diwakili_oleh || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const openSurat = async (s: SuratDkr) => {
    setSelectedId(s.id);
    if (s.status === 'terkirim') {
      try {
        await fetch('/api/surat-dkr/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: s.id }),
        });
        reload();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSaveResponse = async () => {
    if (!selected) return;
    if (respStatus === 'diwakilkan' && !respWakil.trim()) {
      return alert('Isi nama pihak yang mewakili terlebih dahulu.', 'warning');
    }
    setSaving(true);
    try {
      const res = await fetch('/api/surat-dkr/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, status: respStatus, tanggapan: respTanggapan, diwakili_oleh: respWakil }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan tanggapan');
      alert(`Tanggapan berhasil dikirim ke DKR ${selected.kecamatan_nama}!`, 'success');
      reload();
    } catch (err: any) {
      alert('Gagal menyimpan tanggapan: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: SuratDkr) => {
    if (!(await showConfirm(`Hapus surat "${s.perihal}" dari DKR ${s.kecamatan_nama}? Tindakan ini tidak bisa dibatalkan.`))) return;
    try {
      const res = await fetch('/api/surat-dkr/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: s.id }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Gagal menghapus surat');
      setSelectedId(null);
      alert('Surat berhasil dihapus.', 'success');
      reload();
    } catch (err: any) {
      alert('Gagal menghapus surat: ' + err.message, 'error');
    }
  };

  const baruCount = list.filter((s) => s.status === 'terkirim').length;
  const menungguCount = list.filter((s) => s.status === 'dibaca').length;

  const filtered = list.filter((s) => {
    if (filterStatus !== 'semua' && s.status !== filterStatus) return false;
    if (filterJenis !== 'semua' && s.jenis !== filterJenis) return false;
    if (q.trim()) {
      const hay = `${s.perihal} ${s.kecamatan_nama} ${s.nomor_surat || ''}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-display font-extrabold text-brand-brown-dark tracking-tight">Surat Masuk dari DKR</h1>
        <p className="text-xs text-gray-500 font-mono mt-1">
          Permohonan pemateri, undangan, dan surat lain dari DKR Kecamatan. Buka surat untuk menandainya dibaca, lalu beri tanggapan agar DKR tahu statusnya.
        </p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Surat Baru', value: baruCount, tone: 'text-red-500 bg-red-50 border-red-100' },
          { label: 'Menunggu Tanggapan', value: menungguCount, tone: 'text-sky-600 bg-sky-50 border-sky-100' },
          { label: 'Total Surat', value: list.length, tone: 'text-brand-brown-dark bg-white border-gray-200' },
        ].map((c) => (
          <div key={c.label} className={`border rounded-2xl p-4 ${c.tone}`}>
            <p className="text-2xl font-extrabold font-display leading-none">{c.value}</p>
            <p className="text-[10px] font-bold uppercase font-mono tracking-wider mt-1.5 opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari perihal / DKR / nomor…" className={inputCls + ' !pl-9'} />
          </div>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={inputCls + ' font-bold'}>
            <option value="semua">Semua Status</option>
            {(Object.keys(SURAT_STATUS) as SuratStatus[]).map((k) => (
              <option key={k} value={k}>{SURAT_STATUS[k].label}</option>
            ))}
          </select>
          <select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className={inputCls + ' font-bold'}>
            <option value="semua">Semua Jenis</option>
            {SURAT_JENIS.map((j) => (
              <option key={j.value} value={j.value}>{j.label}</option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-gray-50 border border-gray-150 rounded-2xl p-10 text-center text-gray-500 italic text-xs font-mono flex flex-col items-center gap-2">
            <Inbox className="w-6 h-6 text-gray-300" />
            {list.length === 0 ? 'Belum ada surat masuk dari DKR.' : 'Tidak ada surat yang cocok dengan filter.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => openSurat(s)}
                className={`w-full text-left border rounded-2xl p-4 flex items-start gap-3 hover:shadow-md transition-all cursor-pointer ${
                  s.status === 'terkirim' ? 'border-red-200 bg-red-50/40' : 'border-gray-150 bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold font-mono uppercase tracking-wider text-white bg-[#2E5C9A] px-2 py-0.5 rounded-md">
                      <Building2 className="w-2.5 h-2.5" /> DKR {s.kecamatan_nama}
                    </span>
                    <span className="text-[9px] font-extrabold font-mono uppercase tracking-wider text-brand-brown-mid bg-brand-brown-mid/10 px-2 py-0.5 rounded-md">{jenisLabel(s.jenis)}</span>
                    {s.status === 'terkirim' && <span className="text-[9px] font-extrabold font-mono uppercase bg-red-500 text-white px-2 py-0.5 rounded-md">Baru</span>}
                  </div>
                  <h4 className="font-extrabold text-sm text-brand-brown-dark leading-snug break-words">{s.perihal}</h4>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">
                    {s.nomor_surat ? `${s.nomor_surat} • ` : ''}Masuk {formatTanggal(s.created_at, true)}
                    {s.tanggal_acara ? ` • Acara ${formatTanggal(s.tanggal_acara)}` : ''}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal detail */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm overflow-y-auto p-4 flex items-start justify-center" onClick={() => setSelectedId(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-extrabold font-mono uppercase tracking-wider text-white bg-[#2E5C9A] px-2 py-0.5 rounded-md">
                    <Building2 className="w-2.5 h-2.5" /> DKR {selected.kecamatan_nama}
                  </span>
                  <span className="text-[9px] font-extrabold font-mono uppercase tracking-wider text-brand-brown-mid bg-brand-brown-mid/10 px-2 py-0.5 rounded-md">{jenisLabel(selected.jenis)}</span>
                  <StatusBadge status={selected.status} size="sm" />
                </div>
                <h3 className="font-extrabold text-lg text-brand-brown-dark leading-snug break-words">{selected.perihal}</h3>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-gray-400 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <StatusTrack surat={selected} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-gray-50 rounded-xl p-3"><p className={labelCls}>Nomor Surat</p><p className="text-gray-700 font-bold">{selected.nomor_surat || '-'}</p></div>
                <div className="bg-gray-50 rounded-xl p-3"><p className={labelCls}>Tanggal Surat</p><p className="text-gray-700 font-bold">{formatTanggal(selected.tanggal_surat)}</p></div>
                <div className="bg-gray-50 rounded-xl p-3 sm:col-span-2">
                  <p className={labelCls + ' flex items-center gap-1'}><Calendar className="w-3 h-3" /> Tanggal Acara</p>
                  <p className="text-gray-700 font-bold">{formatTanggal(selected.tanggal_acara)}</p>
                </div>
                {selected.keterangan && (
                  <div className="bg-gray-50 rounded-xl p-3 sm:col-span-2">
                    <p className={labelCls}>Catatan dari DKR</p>
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{selected.keterangan}</p>
                  </div>
                )}
              </div>

              <a
                href={selected.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-brand-brown-dark hover:brightness-110 text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider shadow"
              >
                <ExternalLink className="w-4 h-4" /> Buka Surat PDF{selected.file_nama ? ` — ${selected.file_nama}` : ''}
              </a>

              {/* Form tanggapan */}
              <div className="border-t-2 border-dashed border-gray-200 pt-5 space-y-4 font-mono">
                <p className="text-[10px] font-extrabold text-brand-orange uppercase tracking-widest">Tanggapan DKC</p>

                <div>
                  <label className={labelCls}>Status</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SURAT_STATUS_TANGGAPAN.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        title={o.hint}
                        onClick={() => setRespStatus(o.value)}
                        className={`text-[11px] font-extrabold py-2.5 px-2 rounded-xl border transition-all cursor-pointer ${
                          respStatus === o.value ? 'bg-brand-green text-white border-brand-green shadow' : 'bg-white text-gray-600 border-slate-200 hover:bg-gray-50'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {respStatus === 'diwakilkan' && (
                  <div>
                    <label className={labelCls}>Diwakili oleh *</label>
                    <input type="text" value={respWakil} onChange={(e) => setRespWakil(e.target.value)} placeholder="Nama & jabatan yang mewakili" className={inputCls} />
                  </div>
                )}

                <div>
                  <label className={labelCls}>Keterangan / Pesan untuk DKR (opsional)</label>
                  <textarea rows={3} value={respTanggapan} onChange={(e) => setRespTanggapan(e.target.value)} placeholder="Contoh: Pemateri akan hadir 30 menit sebelum acara." className={inputCls + ' resize-y'} />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleSaveResponse}
                    disabled={saving}
                    className="flex-1 bg-brand-green hover:bg-brand-green/95 text-white font-extrabold text-xs py-3 rounded-xl uppercase shadow disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" /> {saving ? 'Menyimpan…' : 'Kirim Tanggapan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(selected)}
                    className="sm:w-auto bg-red-50 hover:bg-red-100 text-brand-red font-extrabold text-xs py-3 px-5 rounded-xl uppercase cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Hapus
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
