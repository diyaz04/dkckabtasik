import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, AlertTriangle, ChevronLeft } from 'lucide-react';

interface LaporanValidasi {
  id: string;
  jenis_dokumen: '02GP' | '01DIKLAT';
  nama_kegiatan: string;
  kecamatan_nama: string;
  tanggal_pelaksanaan?: string | null;
  tempat_pelaksanaan?: string | null;
  status: 'pending' | 'diterima' | 'ditolak' | 'revisi';
  created_at: string;
  ketua_panitia?: string | null;
}

const STATUS_UI = {
  diterima: { Icon: CheckCircle2, box: 'bg-green-100 text-green-600', title: 'text-green-600', judul: 'DOKUMEN VALID', sub: 'Laporan telah diterima & diverifikasi DKC' },
  pending: { Icon: Clock, box: 'bg-amber-100 text-amber-600', title: 'text-amber-600', judul: 'TERDAFTAR', sub: 'Laporan terdaftar, menunggu verifikasi DKC' },
  revisi: { Icon: AlertTriangle, box: 'bg-amber-100 text-amber-600', title: 'text-amber-600', judul: 'PERLU REVISI', sub: 'Laporan terdaftar namun diminta revisi oleh DKC' },
  ditolak: { Icon: XCircle, box: 'bg-red-100 text-red-500', title: 'text-red-500', judul: 'DITOLAK', sub: 'Laporan ini ditolak oleh DKC' },
} as const;

const tgl = (v?: string | null, withTime = false) => {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '-';
  return withTime ? d.toLocaleString('id-ID') : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function ValidasiLaporan() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LaporanValidasi | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!id) return;
        const res = await fetch(`/api/laporan/validate/${id}`);
        if (!res.ok) throw new Error('Not found');
        const d = await res.json();
        if (!cancelled) setData(d);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const ui = data ? STATUS_UI[data.status] || STATUS_UI.pending : null;
  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div>
      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
      <span className="font-bold text-gray-800">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#593922] p-6 text-center text-white">
          <h2 className="font-display font-black text-xl tracking-tight">VALIDASI LAPORAN</h2>
          <p className="text-xs text-white/70 font-mono mt-1">DKC KABUPATEN TASIKMALAYA</p>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-10 h-10 border-4 border-[#F28C28] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 mt-4 font-bold">Memverifikasi Dokumen...</p>
            </div>
          ) : data && ui ? (
            <div className="text-center space-y-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${ui.box}`}>
                <ui.Icon className="w-10 h-10" />
              </div>
              <div>
                <h3 className={`font-black text-2xl ${ui.title}`}>{ui.judul}</h3>
                <p className="text-xs text-gray-500 mt-1">{ui.sub}</p>
              </div>

              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-left space-y-2 text-sm mt-6">
                <Row label="Jenis Dokumen" value={data.jenis_dokumen === '02GP' ? 'Laporan Model 02/GP' : 'Laporan Model 01/Lapdiklat'} />
                <Row label="Nama Kegiatan" value={data.nama_kegiatan} />
                <Row label="Kwartir Ranting" value={data.kecamatan_nama || '-'} />
                <Row label="Waktu Pelaksanaan" value={tgl(data.tanggal_pelaksanaan)} />
                <Row label="Tempat" value={data.tempat_pelaksanaan || '-'} />
                {data.ketua_panitia && <Row label="Ketua Panitia" value={data.ketua_panitia} />}
                <Row label="Dilaporkan Pada" value={tgl(data.created_at, true)} />
                <Row label="ID Dokumen" value={<span className="font-mono text-[#593922]">{data.id.split('-')[0].toUpperCase()}</span>} />
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 py-6">
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-black text-2xl text-red-500">TIDAK VALID</h3>
                <p className="text-xs text-gray-500 mt-1">Laporan tidak ditemukan di sistem. Dokumen ini mungkin palsu.</p>
              </div>
            </div>
          )}

          <div className="mt-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#593922] hover:text-[#F28C28]">
              <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
