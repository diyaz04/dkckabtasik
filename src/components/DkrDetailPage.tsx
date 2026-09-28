import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Building, ShieldAlert, Award, Calendar, BookOpen, 
  MapPin, Plus, GraduationCap, CheckCircle2, ArrowRight 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Kecamatan, DkrProfile, Personalia, Pangkalan, DataPotensial, Berita, AgendaKegiatan } from '../types';

interface DkrDetailResponse {
  kecamatan: Kecamatan;
  profile: DkrProfile;
  personalia: Personalia[];
  pangkalan: Pangkalan[];
  data_potensial?: DataPotensial;
  berita: Berita[];
  agenda: AgendaKegiatan[];
}

export default function DkrDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<DkrDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDkrDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/kecamatan/${slug}`);
        if (!res.ok) throw new Error('Kecamatan tidak ditemukan');
        const resData = await res.json();
        setData(resData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDkrDetail();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-24 flex flex-col items-center justify-center">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs text-gray-500 font-mono">Memuat detail DKR Kecamatan...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white py-24 px-4 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat Detail DKR</h2>
        <p className="text-sm text-gray-500 mb-6">{error || 'Data DKR tidak ditemukan.'}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-brand-orange hover:underline font-bold">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const { kecamatan, profile, personalia, pangkalan, data_potensial, berita, agenda } = data;

  // Prepare chart data if potensial data exists
  const hasPotensialData = !!data_potensial;
  const chartData = data_potensial ? [
    {
      name: 'Penegak',
      'Laki-laki': data_potensial.jumlah_penegak_l,
      'Perempuan': data_potensial.jumlah_penegak_p,
    },
    {
      name: 'Pandega',
      'Laki-laki': data_potensial.jumlah_pandega_l,
      'Perempuan': data_potensial.jumlah_pandega_p,
    }
  ] : [];

  const pieData = data_potensial ? [
    { name: 'Penegak Laki-laki', value: data_potensial.jumlah_penegak_l, color: '#2E5C9A' },
    { name: 'Penegak Perempuan', value: data_potensial.jumlah_penegak_p, color: '#00A99D' },
    { name: 'Pandega Laki-laki', value: data_potensial.jumlah_pandega_l, color: '#F9A825' },
    { name: 'Pandega Perempuan', value: data_potensial.jumlah_pandega_p, color: '#E53935' },
  ] : [];

  const totalAnggota = data_potensial 
    ? (data_potensial.jumlah_penegak_l + data_potensial.jumlah_penegak_p + data_potensial.jumlah_pandega_l + data_potensial.jumlah_pandega_p)
    : 0;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Navigation */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-brand-brown-mid hover:text-brand-orange font-bold mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Peta Sebaran
        </Link>

        {/* Header Section */}
        <div className="bg-gradient-to-r from-brand-orange to-brand-green rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3"></div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-black/20 border border-white/20 rounded-full px-3.5 py-1 text-xs font-mono font-bold tracking-wider mb-4 uppercase">
              📍 DEWAN KERJA RANTING
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none mb-4">
              Kecamatan {kecamatan.nama_kecamatan}
            </h1>
            <p className="text-base sm:text-lg text-white/95 leading-relaxed font-sans max-w-2xl">
              {profile.deskripsi || `Gugus kepengurusan DKR ${kecamatan.nama_kecamatan} di bawah naungan Kwaran Gerakan Pramuka setempat.`}
            </p>
          </div>
          {profile.logo_url && (
            <div className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/20 shrink-0 flex items-center justify-center shadow-lg hover:rotate-3 transition-all duration-300">
              <img 
                src={profile.logo_url} 
                alt={`Logo Ambacana ${kecamatan.nama_kecamatan}`} 
                className="max-w-full max-h-full object-contain filter drop-shadow"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
        </div>

        {/* Grid Stats & Organization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start mb-16">
          
          {/* Main Left Columns - Organization structure & Members stats */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Personalia Structure */}
            <div>
              <h2 className="text-2xl font-extrabold text-brand-brown-dark mb-6 border-b-4 border-brand-orange pb-2.5 inline-block">
                Struktur Pengurus DKR
              </h2>
              
              {personalia.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {personalia.map((p) => (
                    <Link 
                      key={p.id}
                      to={`/personalia/${p.id}`}
                      className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm relative group h-80 flex flex-col justify-end cursor-pointer"
                    >
                      {/* Full height Person Photo */}
                      <img 
                        src={p.foto_url} 
                        alt={p.nama}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                      
                      {/* Vignette shader */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

                      {/* Floating Name Badge - Custom gradient as requested! */}
                      <div className="relative z-10 m-4 p-4 rounded-2xl bg-gradient-to-r from-brand-orange to-brand-teal text-white shadow-lg border border-white/10">
                        <h4 className="font-extrabold text-sm tracking-tight leading-tight uppercase">
                          {p.nama}
                        </h4>
                        <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-white/15">
                          <span className="text-[10px] font-bold font-mono uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                            {p.jabatan}
                          </span>
                          <span className="text-[10px] font-mono capitalize">
                            {p.golongan}
                          </span>
                        </div>
                        <span className="mt-2.5 flex items-center justify-center gap-1.5 w-full bg-white text-brand-brown-dark group-hover:bg-brand-brown-dark group-hover:text-white text-[10px] font-extrabold font-mono uppercase tracking-wider py-2 rounded-xl transition-colors">
                          Lihat Detail <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-200/60 rounded-2xl p-8 text-center text-gray-500 italic">
                  Belum ada data personalia pengurus terdaftar untuk DKR ini.
                </div>
              )}
            </div>

            {/* Keanggotaan Stats Charts */}
            <div>
              <h2 className="text-2xl font-extrabold text-brand-brown-dark mb-6 border-b-4 border-brand-green pb-2.5 inline-block">
                Statistik Potensi Anggota T/D
              </h2>
              
              {hasPotensialData ? (
                <div className="bg-white border border-gray-200/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-xs text-gray-400 font-mono">TOTAL POTENSI ANGGOTA</span>
                      <h3 className="text-3xl font-black text-brand-brown-dark">{totalAnggota} <span className="text-sm font-medium text-gray-500">Jiwa</span></h3>
                    </div>
                    <span className="bg-brand-orange/10 text-brand-orange text-[10px] font-extrabold font-mono px-3.5 py-1.5 rounded-full border border-brand-orange/20">
                      PERIODE {data_potensial.periode}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    
                    {/* Bar chart - Penegak vs Pandega (Male/Female) */}
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" stroke="#5C4033" fontSize={11} fontWeight="bold" />
                          <YAxis stroke="#5C4033" fontSize={10} />
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Laki-laki" fill="#F5A623" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Perempuan" fill="#00A99D" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Donut chart - Demographics distribution */}
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-40 h-40 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={65}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} Jiwa`, 'Kategori']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-1.5 text-xs font-mono w-full">
                        {pieData.map((d) => (
                          <div key={d.name} className="flex justify-between items-center p-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="flex items-center gap-2 text-gray-500 text-[10px]">
                              <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: d.color }}></span>
                              {d.name}
                            </span>
                            <span className="font-bold text-brand-brown-dark">{d.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="bg-white border border-gray-200/60 rounded-2xl p-8 text-center text-gray-500 italic">
                  Data statistik potensial belum diinput oleh admin DKR setempat.
                </div>
              )}
            </div>

          </div>

          {/* Sidebar - Pangkalan & News Contribution */}
          <div className="space-y-12">
            
            {/* Media Sosial DKR - if any links exist */}
            {(profile.medsos_ig || profile.medsos_yt || profile.medsos_tk) && (
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-100 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5 border-b border-pink-100 pb-3">
                  <span className="text-xl">📱</span>
                  <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight">
                    Media Sosial DKR
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-3 font-mono text-xs">
                  {profile.medsos_ig && (
                    <a href={profile.medsos_ig} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white hover:bg-pink-50 border border-pink-100 p-3 rounded-xl transition-all group">
                      <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-800 block">Instagram</span>
                        <span className="text-[10px] text-pink-500 truncate block max-w-[160px]">{profile.medsos_ig.replace('https://','')}</span>
                      </div>
                    </a>
                  )}
                  {profile.medsos_yt && (
                    <a href={profile.medsos_yt} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white hover:bg-red-50 border border-red-100 p-3 rounded-xl transition-all group">
                      <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-800 block">YouTube</span>
                        <span className="text-[10px] text-red-500 truncate block max-w-[160px]">{profile.medsos_yt.replace('https://','')}</span>
                      </div>
                    </a>
                  )}
                  {profile.medsos_tk && (
                    <a href={profile.medsos_tk} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 p-3 rounded-xl transition-all group">
                      <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.62 4.14 1.13 1.14 2.66 1.77 4.23 1.8v3.96c-1.63-.02-3.21-.57-4.52-1.57-.46-.35-.86-.76-1.19-1.22-.05 2.12-.01 4.24-.03 6.36-.09 2.53-1.02 4.99-2.78 6.78-2.22 2.13-5.56 2.82-8.48 1.76-2.58-.93-4.66-3.15-5.38-5.78C-.7 12.83 1.16 9.07 4.35 7.63c1.78-.79 3.86-.77 5.62.11V11.8c-.89-.48-1.92-.62-2.92-.38-1.54.34-2.73 1.69-2.9 3.26-.22 1.62.63 3.23 2.1 3.84 1.48.61 3.29.13 4.19-1.18.51-.71.74-1.59.73-2.46-.01-4.96-.01-9.92-.01-14.88z"/></svg>
                      </div>
                      <div>
                        <span className="font-bold text-xs text-gray-800 block">TikTok</span>
                        <span className="text-[10px] text-gray-500 truncate block max-w-[160px]">{profile.medsos_tk.replace('https://','')}</span>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Pangkalan / Gugus Depan */}
            <div className="bg-white border border-gray-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                <Building className="w-5 h-5 text-brand-orange" />
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight">
                  Pangkalan / Gudep Aktif
                </h3>
              </div>

              {pangkalan.length > 0 ? (
                <div className="space-y-3">
                  {pangkalan.map((pk) => (
                    <div 
                      key={pk.id}
                      className="p-3 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between group hover:border-brand-teal transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-brand-teal/10 rounded-xl flex items-center justify-center text-brand-teal">
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-brand-brown-dark block leading-snug">
                            {pk.nama_pangkalan}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono uppercase font-semibold">
                            Kategori: {pk.jenis}
                          </span>
                        </div>
                      </div>
                      {pk.status_aktif && (
                        <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0 ml-2" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-4">
                  Belum ada pangkalan terdaftar di kecamatan ini.
                </p>
              )}
            </div>

            {/* Berita DKR */}
            <div className="bg-white border border-gray-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                <BookOpen className="w-5 h-5 text-brand-teal" />
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight">
                  Warta Pramuka DKR
                </h3>
              </div>

              {berita.length > 0 ? (
                <div className="space-y-4">
                  {berita.map((b) => (
                    <Link 
                      key={b.id}
                      to={`/berita/${b.slug}`}
                      className="flex items-center gap-3 group block border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                        <img 
                          src={b.gambar_url} 
                          alt={b.judul}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800';
                          }}
                        />
                      </div>
                      <div>
                        <span className="font-extrabold text-xs text-brand-brown-dark leading-snug block line-clamp-2 group-hover:text-brand-orange transition-colors">
                          {b.judul}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono mt-1 block">
                          {new Date(b.published_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-4">
                  Belum ada warta kontribusi DKR terpublikasi.
                </p>
              )}
            </div>

            {/* Agenda DKR */}
            <div className="bg-white border border-gray-200/60 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
                <Calendar className="w-5 h-5 text-brand-green" />
                <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight">
                  Agenda DKR
                </h3>
              </div>

              {agenda.length > 0 ? (
                <div className="space-y-3">
                  {agenda.map((a) => (
                    <div 
                      key={a.id}
                      className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs"
                    >
                      <span className="font-bold text-brand-brown-dark block mb-1">
                        {a.nama_kegiatan}
                      </span>
                      <div className="text-[10px] text-gray-400 space-y-0.5 font-mono">
                        <p>📍 {a.tempat}</p>
                        <p>📅 {new Date(a.tanggal_mulai).toLocaleDateString('id-ID')} s.d {new Date(a.tanggal_selesai).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic text-center py-4">
                  Belum ada agenda terdaftar di kecamatan ini.
                </p>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
