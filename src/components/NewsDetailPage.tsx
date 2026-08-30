import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, User, ArrowLeft, Tag, Share2, Heart, X, Copy, Check, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Berita } from '../types';

export default function NewsDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [berita, setBerita] = useState<Berita | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [liked, setLiked] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    const fetchBerita = async () => {
      try {
        const res = await fetch(`/api/berita/${slug}`);
        if (!res.ok) throw new Error('Berita tidak ditemukan');
        const data = await res.json();
        setBerita(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBerita();
  }, [slug]);

  useEffect(() => {
    if (berita) {
      try {
        const saved = localStorage.getItem('liked_news_ids');
        if (saved) {
          const parsed = JSON.parse(saved);
          setLiked(parsed.includes(berita.id));
        }
      } catch (e) {}
    }
  }, [berita]);

  const handleToggleLike = async () => {
    if (!berita) return;
    const action = liked ? 'unlike' : 'like';
    const originalLiked = liked;
    
    // Optimistic update
    setLiked(!originalLiked);
    setBerita(prev => prev ? {
      ...prev,
      likes: Math.max(0, (prev.likes || 0) + (originalLiked ? -1 : 1))
    } : null);

    try {
      const saved = localStorage.getItem('liked_news_ids');
      let parsed = saved ? JSON.parse(saved) : [];
      if (originalLiked) {
        parsed = parsed.filter((id: string) => id !== berita.id);
      } else {
        if (!parsed.includes(berita.id)) parsed.push(berita.id);
      }
      localStorage.setItem('liked_news_ids', JSON.stringify(parsed));

      const res = await fetch(`/api/berita/${berita.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const resData = await res.json();
        setBerita(prev => prev ? { ...prev, likes: resData.likes } : null);
      }
    } catch (err) {
      console.error("Failed to like:", err);
    }
  };

  const handleDownloadPamflet = async () => {
    if (!berita) return;
    const element = document.getElementById('pamflet-render-target');
    if (!element) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(element, {
        useCORS: true,
        scale: 2.5,
        backgroundColor: '#ffffff',
        logging: false
      });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `pamflet-${berita.slug}.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error("Error generating pamphlet:", err);
      alert("Gagal mengunduh pamflet. Silakan salin tautan manual.");
    }
  };

  const handleCopyLink = () => {
    if (!berita) return;
    const link = window.location.href;
    navigator.clipboard.writeText(link);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-24 flex flex-col items-center justify-center">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs text-gray-500 font-mono">Memuat artikel berita...</p>
      </div>
    );
  }

  if (error || !berita) {
    return (
      <div className="min-h-screen bg-white py-24 px-4 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat Artikel</h2>
        <p className="text-sm text-gray-500 mb-6">{error || 'Artikel tidak ditemukan atau telah dihapus.'}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-brand-orange hover:underline font-bold">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const formattedDate = new Date(berita.published_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <article className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Back navigation */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-brand-brown-mid hover:text-brand-orange font-bold mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Beranda
        </Link>

        {/* Article Container */}
        <div className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-sm">
          
          {/* Header image with parallax styled spacing */}
          <div className="relative h-[250px] sm:h-[450px] overflow-hidden bg-brand-brown-dark">
            <img 
              src={berita.gambar_url} 
              alt={berita.judul}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800';
              }}
            />
            {/* Absolute badge */}
            <div className="absolute top-6 left-6">
              {berita.kecamatan_id ? (
                <span className="bg-[#2E5C9A] text-white text-[10px] font-extrabold font-mono px-3.5 py-1.5 rounded-full shadow-lg border border-white/20 uppercase tracking-wider">
                  Kontribusi DKR {berita.kecamatan_nama}
                </span>
              ) : (
                <span className="bg-gradient-to-r from-brand-orange to-brand-red text-white text-[10px] font-extrabold font-mono px-3.5 py-1.5 rounded-full shadow-lg border border-white/20 uppercase tracking-wider">
                  Rilis Resmi DKC
                </span>
              )}
            </div>
          </div>

          {/* Article Info */}
          <div className="p-6 sm:p-10">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-brand-brown-dark tracking-tight leading-tight mb-6">
              {berita.judul}
            </h1>

            {/* Meta tags */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-gray-500 font-mono pb-6 border-b border-gray-100 mb-8">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-orange" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-brand-green" />
                <span>Ditulis oleh: <strong className="text-brand-brown-dark">{berita.author_name}</strong></span>
              </div>
              {berita.kecamatan_id && (
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-brand-teal" />
                  <span>Kecamatan {berita.kecamatan_nama}</span>
                </div>
              )}
            </div>

            {/* Article Content Area */}
            <div 
              className="prose prose-sm sm:prose-base max-w-none text-gray-700 leading-relaxed font-sans space-y-6"
              dangerouslySetInnerHTML={{ __html: berita.konten }}
            />

            {/* Share and Footer Stamp */}
            <div className="border-t border-gray-100 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-6">
              {/* Like and Share controls */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleToggleLike}
                  className={`flex items-center gap-2 text-xs font-bold font-mono px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                    liked
                      ? 'text-red-500 bg-red-50 border border-red-200'
                      : 'text-gray-500 bg-gray-50 hover:bg-gray-100 border border-slate-200/80'
                  }`}
                >
                  <Heart className={`w-4 h-4 transition-transform active:scale-125 ${liked ? 'fill-current text-red-500' : 'text-gray-400'}`} />
                  <span>Suka Berita ({berita.likes || 0})</span>
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-2 text-xs text-brand-green font-bold font-mono px-4 py-2.5 rounded-xl bg-brand-green/5 hover:bg-brand-green/10 border border-brand-green/25 transition-all cursor-pointer shadow-sm"
                >
                  <Share2 className="w-4 h-4 animate-pulse" />
                  <span>Bagikan & Buat Pamflet</span>
                </button>
              </div>

              {/* Stamp */}
              <div className="text-center sm:text-right font-mono">
                <span className="text-brand-orange text-xs font-black">⚜ Gerakan Pramuka</span>
                <p className="text-[10px] text-gray-400">Dewan Kerja Cabang Tasikmalaya</p>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* SHARE & AUTOMATIC NEWS PAMPHLET MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/5 p-4 md:p-6 rounded-[32px] border border-white/10 my-8 shadow-2xl overflow-hidden"
            >
              {/* Left Pane: Interactive Live Pamphlet Preview */}
              <div className="col-span-1 md:col-span-7 flex flex-col items-center">
                <span className="text-[10px] font-mono font-extrabold text-white/60 uppercase tracking-widest mb-2.5 block text-center">
                  👁️ Pratinjau Pamflet Gambar
                </span>

                {/* THE ACTUAL DOWNLOAD TARGET */}
                <div 
                  id="pamflet-render-target"
                  className="w-full max-w-[370px] bg-white p-5 rounded-[24px] border border-slate-100 shadow-2xl flex flex-col justify-between relative select-none"
                  style={{ minHeight: '520px' }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-orange via-brand-green to-brand-brown-mid" />

                  {/* Header Row */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center border border-brand-green/20">
                        <span className="text-brand-green text-sm">⚜</span>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-brand-brown-dark tracking-wider uppercase font-mono leading-none">
                          Warta Pramuka
                        </h4>
                        <p className="text-[8px] text-gray-400 font-bold font-mono tracking-wider mt-0.5 uppercase leading-none">
                          DKC Tasikmalaya
                        </p>
                      </div>
                    </div>
                    <div>
                      {berita.saka_id ? (
                        <span className="bg-brand-orange text-white text-[7px] font-black font-mono px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                          SAKA {berita.saka_nama}
                        </span>
                      ) : berita.kecamatan_id ? (
                        <span className="bg-[#2E5C9A] text-white text-[7px] font-black font-mono px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                          DKR {berita.kecamatan_nama}
                        </span>
                      ) : (
                        <span className="bg-gradient-to-r from-brand-orange to-brand-red text-white text-[7px] font-black font-mono px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                          KABAR DKC UTAMA
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Featured Image */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100 rounded-xl border border-slate-150/60 shadow-inner">
                    <img 
                      src={berita.gambar_url} 
                      alt={berita.judul}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                  </div>

                  {/* News Title */}
                  <div className="mt-3">
                    <h3 className="font-extrabold text-sm text-slate-950 tracking-tight leading-snug uppercase">
                      {berita.judul}
                    </h3>
                  </div>

                  {/* Short Excerpt */}
                  <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[10px] text-gray-500 leading-relaxed font-sans line-clamp-3 font-medium">
                      "{stripHtml(berita.konten)}"
                    </p>
                  </div>

                  {/* Separator dot */}
                  <div className="flex items-center justify-center gap-1 my-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                    <span className="w-8 h-[2px] bg-brand-green/20" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                  </div>

                  {/* Footer metadata */}
                  <div className="grid grid-cols-12 gap-3 items-center border-t border-slate-100 pt-3">
                    <div className="col-span-8 space-y-1 text-left">
                      <div className="text-[8px] text-gray-400 font-mono font-bold leading-tight">
                        DITERBITKAN: <span className="text-gray-600 font-extrabold">{formattedDate}</span>
                      </div>
                      <div className="text-[8px] text-gray-400 font-mono font-bold leading-tight">
                        KONTRIBUTOR: <span className="text-brand-brown-dark font-extrabold">{berita.author_name}</span>
                      </div>
                      <p className="text-[8px] text-brand-green font-extrabold font-mono uppercase tracking-wider mt-1 leading-tight">
                        Satyaku Kudarmakan, Darmaku Kubaktikan
                      </p>
                    </div>

                    {/* QR Code */}
                    <div className="col-span-4 flex flex-col items-center">
                      <div className="bg-white p-1 rounded-lg border border-slate-200/80 shadow-sm">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}`}
                          alt="QR Code Link"
                          className="w-12 h-12"
                        />
                      </div>
                      <span className="text-[6px] font-mono font-bold text-gray-400 text-center tracking-wider block mt-1 uppercase leading-none">
                        PINDAI LINK
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Pane: Controls and Action Panel */}
              <div className="col-span-1 md:col-span-5 flex flex-col justify-between bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight font-mono">
                      Bagikan Berita
                    </h3>
                    <button 
                      onClick={() => setShowShareModal(false)}
                      className="text-gray-400 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mb-6 font-mono leading-relaxed">
                    Sistem otomatis mengkompilasi warta berita ini ke dalam pamflet gambar beresolusi tinggi, lengkap dengan foto, ulasan ringkas, dan QR Code untuk dibagikan di jejaring sosial Anda.
                  </p>

                  {/* Actions list */}
                  <div className="space-y-3">
                    <button
                      onClick={handleDownloadPamflet}
                      className="w-full bg-brand-green hover:brightness-110 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4 animate-bounce" /> Unduh Pamflet (PNG)
                    </button>

                    <button
                      onClick={handleCopyLink}
                      className={`w-full font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                        copyFeedback
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-slate-200/80'
                      }`}
                    >
                      {copyFeedback ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600" /> Tautan Berhasil Disalin!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-gray-500" /> Salin Tautan Berita
                        </>
                      )}
                    </button>

                    <div className="pt-2">
                      <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block mb-2">
                        Bagikan Cepat
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Ayo baca berita terbaru dari Gerakan Pramuka Tasikmalaya: ' + berita.judul + ' ' + window.location.href)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl text-center transition-colors cursor-pointer"
                        >
                          WhatsApp
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl text-center transition-colors cursor-pointer"
                        >
                          Facebook
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="text-xs font-bold font-mono text-gray-400 hover:text-gray-600 transition-colors uppercase cursor-pointer"
                  >
                    Tutup Dialog
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </article>
  );
}
