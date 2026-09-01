import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ChevronLeft } from 'lucide-react';
import { supabase } from '../../api/index';

export default function ValidasiPendaftaran() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [agenda, setAgenda] = useState<any>(null);

  useEffect(() => {
    async function validate() {
      try {
        if (!id) return;
        
        const res = await fetch('/api/informasi'); // Not directly, we need a new api endpoint for public or use supabase directly. But frontend doesn't have supabase client if it's protected? Actually it does. Wait, let's use the local API to avoid RLS issues.
        // Wait, supabase client is not in src/components/api, it's in the backend. 
        // I will change this to fetch from a new endpoint: `/api/pendaftaran/validate/:id`
        
        const validRes = await fetch(`/api/pendaftaran/validate/${id}`);
        if (!validRes.ok) throw new Error('Not found');
        
        const validData = await validRes.json();
        setData(validData.pendaftaran);
        setAgenda(validData.agenda);
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }
    
    validate();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-[#593922] p-6 text-center text-white relative">
          <h2 className="font-display font-black text-xl tracking-tight">PORTAL VALIDASI</h2>
          <p className="text-xs text-white/70 font-mono mt-1">DKC KABUPATEN TASIKMALAYA</p>
        </div>
        
        <div className="p-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="w-10 h-10 border-4 border-[#F28C28] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 mt-4 font-bold">Memverifikasi Data...</p>
            </div>
          ) : data ? (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-green-100/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-black text-2xl text-green-600">DOKUMEN VALID</h3>
                <p className="text-xs text-gray-500 mt-1 font-mono uppercase">Terdaftar Resmi di Sistem</p>
              </div>
              
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-left space-y-2 text-sm mt-6">
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">ID Pendaftaran</span>
                  <span className="font-mono font-bold text-[#593922]">{data.id.split('-')[0].toUpperCase()}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama Kegiatan</span>
                  <span className="font-bold text-gray-800">{agenda?.nama_kegiatan || '-'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Waktu Mendaftar</span>
                  <span className="font-bold text-gray-800">{new Date(data.created_at).toLocaleString('id-ID')}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipe Pendaftaran</span>
                  <span className="font-bold text-gray-800 uppercase">{data.tipe}</span>
                </div>
              </div>
            </div>
          ) : (
             <div className="text-center space-y-4 py-6">
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-inner shadow-red-500/20">
                <XCircle className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-black text-2xl text-red-500">TIDAK VALID</h3>
                <p className="text-xs text-gray-500 mt-1">Data pendaftaran tidak ditemukan atau dokumen ini palsu.</p>
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
