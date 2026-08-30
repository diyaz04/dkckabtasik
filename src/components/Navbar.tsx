import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShieldAlert, Compass, ChevronDown, Users, Trophy, Tent, Newspaper, CalendarDays, FolderDown, MapPinned, IdCard } from 'lucide-react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('dkc_token');
    localStorage.removeItem('dkc_user');
    localStorage.removeItem('dkc_keca');
    localStorage.removeItem('dkc_saka');
    navigate('/portal/login');
  };

  const isLoggedIn = !!localStorage.getItem('dkc_token');
  const userString = localStorage.getItem('dkc_user');
  const user = userString ? JSON.parse(userString) : null;

  const isActiveSection = (hash: string) => {
    return location.pathname === '/' && location.hash === hash;
  };

  const isHomeActive = () => {
    return location.pathname === '/' && (!location.hash || location.hash === '#top' || location.hash === '');
  };

  return (
    <nav className="bg-white text-brand-brown-dark sticky top-0 z-50 shadow-sm border-b border-[#E5DCD3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Brand */}
          <Link to="/#top" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-brand-orange overflow-hidden p-0.5 shadow-md group-hover:rotate-12 transition-transform">
              <img src="/logo.png" alt="Logo DKC" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight block text-[#5C4033] uppercase leading-none group-hover:text-brand-orange transition-colors">
                DKC KAB. TASIKMALAYA
              </span>
              <span className="text-[10px] text-gray-500 block font-mono mt-1">
                Satyaku Kudarmakan, Darmaku Kubaktikan
              </span>
            </div>
          </Link>

          {/* Desktop Links - dikategorikan per kelompok fungsi supaya rapih */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link 
              to="/#top" 
              className={`text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-colors px-1.5 py-1.5 lg:px-2.5 lg:py-2 rounded-lg ${
                isHomeActive() ? 'text-brand-orange bg-[#FDF8F3]' : 'text-[#5C4033] hover:text-brand-green hover:bg-[#F9F6F0]'
              }`}
            >
              Beranda
            </Link>

            {/* Kategori: PROFIL (Visi Misi, Personalia, Peta Sebaran DKR) */}
            <div className="relative group">
              <button
                className={`text-[10px] lg:text-xs font-bold uppercase tracking-wider px-1.5 py-1.5 lg:px-2.5 lg:py-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:outline-none ${
                  isActiveSection('#profil') || isActiveSection('#personalia') || isActiveSection('#peta')
                    ? 'text-brand-orange bg-[#FDF8F3]'
                    : 'text-[#5C4033] hover:text-brand-green hover:bg-[#F9F6F0]'
                }`}
              >
                <span>Profil</span>
                <ChevronDown className="w-3 h-3 opacity-60 group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50">
                <span className="block px-4 pt-1 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Tentang DKC</span>
                <Link to="/#profil" className="px-4 py-2 text-[11px] font-bold text-[#5C4033] hover:bg-slate-50 hover:text-brand-green flex items-center gap-2 font-mono uppercase transition-colors">
                  <IdCard className="w-3.5 h-3.5 text-brand-orange" /> Visi &amp; Misi
                </Link>
                <Link to="/#personalia" className="px-4 py-2 text-[11px] font-bold text-[#5C4033] hover:bg-slate-50 hover:text-brand-green flex items-center gap-2 font-mono uppercase transition-colors">
                  <Users className="w-3.5 h-3.5 text-brand-orange" /> Personalia
                </Link>
                <Link to="/#peta" className="px-4 py-2 text-[11px] font-bold text-[#5C4033] hover:bg-slate-50 hover:text-brand-green flex items-center gap-2 font-mono uppercase transition-colors">
                  <MapPinned className="w-3.5 h-3.5 text-brand-orange" /> Peta 39 Kecamatan
                </Link>
              </div>
            </div>

            {/* Kategori: KOMUNITAS (Klasemen DKR, Satuan Karya) */}
            <div className="relative group">
              <button
                className={`text-[10px] lg:text-xs font-bold uppercase tracking-wider px-1.5 py-1.5 lg:px-2.5 lg:py-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:outline-none ${
                  isActiveSection('#klasemen') || isActiveSection('#saka')
                    ? 'text-brand-orange bg-[#FDF8F3]'
                    : 'text-[#5C4033] hover:text-brand-green hover:bg-[#F9F6F0]'
                }`}
              >
                <span>Komunitas</span>
                <ChevronDown className="w-3 h-3 opacity-60 group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50">
                <span className="block px-4 pt-1 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Ranting &amp; Satuan</span>
                <Link to="/#klasemen" className="px-4 py-2 text-[11px] font-bold text-[#5C4033] hover:bg-slate-50 hover:text-brand-green flex items-center gap-2 font-mono uppercase transition-colors">
                  <Trophy className="w-3.5 h-3.5 text-brand-orange" /> Klasemen DKR
                </Link>
                <Link to="/#saka" className="px-4 py-2 text-[11px] font-bold text-[#5C4033] hover:bg-slate-50 hover:text-brand-green flex items-center gap-2 font-mono uppercase transition-colors">
                  <Tent className="w-3.5 h-3.5 text-brand-orange" /> Satuan Karya (SAKA)
                </Link>
              </div>
            </div>

            {/* Kategori: INFORMASI (Warta, Kegiatan, Unduh Berkas) */}
            <div className="relative group">
              <button
                className={`text-[10px] lg:text-xs font-bold uppercase tracking-wider px-1.5 py-1.5 lg:px-2.5 lg:py-2 rounded-lg transition-all flex items-center gap-1 cursor-pointer focus:outline-none ${
                  isActiveSection('#berita') || isActiveSection('#kegiatan') || isActiveSection('#informasi')
                    ? 'text-brand-orange bg-[#FDF8F3]'
                    : 'text-[#5C4033] hover:text-brand-green hover:bg-[#F9F6F0]'
                }`}
              >
                <span>Informasi</span>
                <ChevronDown className="w-3 h-3 opacity-60 group-hover:rotate-180 transition-transform duration-200" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 opacity-0 translate-y-1 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible transition-all duration-200 z-50">
                <span className="block px-4 pt-1 pb-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Publikasi</span>
                <Link to="/#berita" className="px-4 py-2 text-[11px] font-bold text-[#5C4033] hover:bg-slate-50 hover:text-brand-green flex items-center gap-2 font-mono uppercase transition-colors">
                  <Newspaper className="w-3.5 h-3.5 text-brand-orange" /> Warta &amp; Berita
                </Link>
                <Link to="/#kegiatan" className="px-4 py-2 text-[11px] font-bold text-[#5C4033] hover:bg-slate-50 hover:text-brand-green flex items-center gap-2 font-mono uppercase transition-colors">
                  <CalendarDays className="w-3.5 h-3.5 text-brand-orange" /> Kegiatan &amp; Pendaftaran
                </Link>
                <Link to="/#informasi" className="px-4 py-2 text-[11px] font-bold text-[#5C4033] hover:bg-slate-50 hover:text-brand-green flex items-center gap-2 font-mono uppercase transition-colors">
                  <FolderDown className="w-3.5 h-3.5 text-brand-orange" /> Unduh Berkas
                </Link>
              </div>
            </div>
            
            {isLoggedIn && user ? (
              <div className="flex items-center space-x-1 lg:space-x-2 border-l border-gray-200 pl-1.5 lg:pl-2">
                <Link 
                  to={user.role === 'admin' ? '/portal/admin' : user.role === 'saka' ? '/portal/saka' : '/portal/dkr'}
                  className="bg-brand-green text-white font-bold text-[9px] lg:text-[10px] px-2 py-1.5 lg:px-3.5 lg:py-2 rounded-full shadow-sm hover:bg-[#439c47] transition-all flex items-center gap-1 uppercase tracking-wider whitespace-nowrap"
                >
                  <Compass className="w-3 lg:w-3.5 h-3 lg:h-3.5" />
                  Portal {user.role === 'admin' ? 'Admin' : user.role === 'saka' ? 'SAKA' : 'DKR'}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-[9px] lg:text-[10px] text-brand-red hover:text-red-700 font-bold transition-colors border border-brand-red/30 px-2 py-1.5 lg:px-2.5 lg:py-2 rounded-lg uppercase tracking-wider whitespace-nowrap"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <div className="border-l border-gray-200 pl-1.5 lg:pl-2">
                <Link 
                  to="/portal/login" 
                  className="bg-brand-orange text-white font-bold text-[9px] lg:text-[10px] px-2 py-2 lg:px-4 lg:py-2.5 rounded-full shadow-md hover:bg-[#e0951b] transition-all flex items-center gap-1 uppercase tracking-wider whitespace-nowrap"
                >
                  <ShieldAlert className="w-3 lg:w-3.5 h-3 lg:h-3.5 text-white" />
                  PORTAL
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#5C4033] hover:text-brand-orange hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#FDF8F3] border-t border-[#E5DCD3] px-2 pt-2 pb-4 space-y-2">
          <Link
            to="/#top"
            onClick={() => setIsOpen(false)}
            className={`block text-xs font-bold px-3 py-2.5 rounded-lg uppercase ${
              isHomeActive() ? 'text-brand-orange bg-[#F5EFE6]' : 'text-[#5C4033] hover:bg-[#F5EFE6]'
            }`}
          >
            Beranda
          </Link>

          {/* Kategori: PROFIL */}
          <p className="px-3 pt-2 pb-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Profil</p>
          <Link
            to="/#profil"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-lg uppercase ${
              isActiveSection('#profil') ? 'text-brand-orange bg-[#F5EFE6]' : 'text-[#5C4033] hover:bg-[#F5EFE6]'
            }`}
          >
            <IdCard className="w-3.5 h-3.5 text-brand-orange" /> Visi &amp; Misi
          </Link>
          <Link
            to="/#personalia"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-lg uppercase ${
              isActiveSection('#personalia') ? 'text-brand-orange bg-[#F5EFE6]' : 'text-[#5C4033] hover:bg-[#F5EFE6]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-brand-orange" /> Struktur Personalia
          </Link>
          <Link
            to="/#peta"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-lg uppercase ${
              isActiveSection('#peta') ? 'text-brand-orange bg-[#F5EFE6]' : 'text-[#5C4033] hover:bg-[#F5EFE6]'
            }`}
          >
            <MapPinned className="w-3.5 h-3.5 text-brand-orange" /> Peta 39 Kecamatan
          </Link>

          {/* Kategori: KOMUNITAS */}
          <p className="px-3 pt-2 pb-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Komunitas</p>
          <Link
            to="/#klasemen"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-lg uppercase ${
              isActiveSection('#klasemen') ? 'text-brand-orange bg-[#F5EFE6]' : 'text-[#5C4033] hover:bg-[#F5EFE6]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-brand-orange" /> Klasemen Keaktifan DKR
          </Link>
          <Link
            to="/#saka"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-lg uppercase ${
              isActiveSection('#saka') ? 'text-brand-orange bg-[#F5EFE6]' : 'text-[#5C4033] hover:bg-[#F5EFE6]'
            }`}
          >
            <Tent className="w-3.5 h-3.5 text-brand-orange" /> Satuan Karya (SAKA)
          </Link>

          {/* Kategori: INFORMASI */}
          <p className="px-3 pt-2 pb-0.5 text-[9px] font-bold text-gray-400 uppercase tracking-widest font-mono">Informasi</p>
          <Link
            to="/#berita"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-lg uppercase ${
              isActiveSection('#berita') ? 'text-brand-orange bg-[#F5EFE6]' : 'text-[#5C4033] hover:bg-[#F5EFE6]'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5 text-brand-orange" /> Warta &amp; Berita
          </Link>
          <Link
            to="/#kegiatan"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-lg uppercase ${
              isActiveSection('#kegiatan') ? 'text-brand-orange bg-[#F5EFE6]' : 'text-[#5C4033] hover:bg-[#F5EFE6]'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 text-brand-orange" /> Kegiatan &amp; Pendaftaran
          </Link>
          <Link
            to="/#informasi"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-2 text-xs font-bold px-3 py-2.5 rounded-lg uppercase ${
              isActiveSection('#informasi') ? 'text-brand-orange bg-[#F5EFE6]' : 'text-[#5C4033] hover:bg-[#F5EFE6]'
            }`}
          >
            <FolderDown className="w-3.5 h-3.5 text-brand-orange" /> Unduh Dokumen &amp; Info
          </Link>

          {isLoggedIn && user ? (
            <div className="border-t border-[#E5DCD3] pt-2 mt-2 space-y-2">
              <Link
                to={user.role === 'admin' ? '/portal/admin' : user.role === 'saka' ? '/portal/saka' : '/portal/dkr'}
                onClick={() => setIsOpen(false)}
                className="block text-center bg-brand-green text-white font-bold py-2.5 rounded-lg text-xs uppercase tracking-wider"
              >
                Portal {user.role === 'admin' ? 'Admin' : user.role === 'saka' ? 'SAKA' : 'DKR'}
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full text-center border border-brand-red text-brand-red font-bold py-2 rounded-lg text-xs uppercase tracking-wider"
              >
                Keluar
              </button>
            </div>
          ) : (
            <Link
              to="/portal/login"
              onClick={() => setIsOpen(false)}
              className="block text-center bg-brand-orange text-white font-bold py-3 rounded-lg text-xs mt-3 uppercase tracking-wider shadow-sm"
            >
              MASUK PORTAL INTERNAL
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
