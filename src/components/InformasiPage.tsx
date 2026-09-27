import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Download, Eye, Search } from 'lucide-react';

import { Informasi } from '../types';

export default function InformasiPage() {
  const [informasiList, setInformasiList] = useState<Informasi[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInformasi();
  }, []);

  const fetchInformasi = async () => {
    try {
      const res = await fetch('/api/informasi');
      const data = await res.json();
      if (data) setInformasiList(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInfo = informasiList.filter(info => 
    info.judul.toLowerCase().includes(searchTerm.toLowerCase()) || 
    info.deskripsi?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8 mt-16">
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-brand-orange font-bold text-sm mb-6 hover:underline font-mono">
          <ChevronLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
        
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-t-4 border-brand-orange mb-8">
          <span className="text-sm font-mono font-bold text-brand-teal uppercase tracking-wider block mb-2">
            Pusat Unduhan
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-brand-brown-dark tracking-tight mb-4">
            Dokumen & Informasi Resmi
          </h1>
          <p className="text-gray-500 max-w-2xl leading-relaxed">
            Temukan berbagai dokumen resmi, petunjuk pelaksanaan, petunjuk teknis, surat edaran, dan aset grafis kegiatan DKC Kabupaten Tasikmalaya.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Cari dokumen atau informasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all font-mono text-sm"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-12 text-gray-400 font-mono italic animate-pulse">Memuat dokumen...</div>
          ) : filteredInfo.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredInfo.map((info) => (
                <div 
                  key={info.id}
                  className="bg-gray-50/70 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-white hover:shadow-md transition-all duration-300 border border-gray-100"
                >
                  <div className="flex-1">
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded-md mb-2 inline-block ${
                      info.tipe === 'gambar' ? 'bg-[#F9A825]/15 text-[#F9A825]' : 'bg-[#00A99D]/15 text-[#00A99D]'
                    }`}>
                      {info.tipe === 'gambar' ? 'Aset Gambar' : 'Dokumen PDF'}
                    </span>
                    <h3 className="font-extrabold text-sm text-brand-brown-dark tracking-tight leading-snug line-clamp-1 mb-1">
                      {info.judul}
                    </h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-sans line-clamp-2">
                      {info.deskripsi}
                    </p>
                  </div>
                  
                  <div className="shrink-0 w-full sm:w-auto">
                    {info.tipe === 'gambar' && info.file_url !== '#' ? (
                      <a 
                        href={info.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto bg-brand-teal hover:bg-brand-teal/90 text-white px-4 py-2 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider shadow"
                      >
                        <Eye className="w-3.5 h-3.5" /> Pratinjau
                      </a>
                    ) : (
                      <a 
                        href={info.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto bg-brand-brown-mid hover:bg-brand-brown-dark text-white px-4 py-2 rounded-xl font-bold font-mono text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider shadow"
                      >
                        <Download className="w-3.5 h-3.5" /> Unduh PDF
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 italic">
              Tidak ada dokumen yang sesuai dengan pencarian Anda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
