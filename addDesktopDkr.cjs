const fs = require('fs');

let content = fs.readFileSync('src/components/PortalDkr.tsx', 'utf-8');

// The desktop header to inject
const desktopHeader = `
          {/* Desktop Top Header (Notification & Profile) */}
          <div className="hidden md:flex justify-end items-center gap-4 mb-6 relative">
            <button onClick={() => { setIsNotifMenuOpen(!isNotifMenuOpen); setIsProfileMenuOpen(false); }} className="relative text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer">
              <Bell className="w-5 h-5" />
              {totalNotifs > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
            </button>
            
            {isNotifMenuOpen && (
              <div className="absolute top-12 right-12 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50">
                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-2">Notifikasi</h4>
                {totalNotifs === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">Belum ada notifikasi baru</p>
                ) : (
                  <div className="space-y-2">
                    {verifiedLaporanCount > 0 && (
                      <button onClick={() => { setActiveTab('laporan'); setIsNotifMenuOpen(false); }} className="w-full text-left p-2 rounded-xl hover:bg-gray-50 text-xs text-brand-brown-dark flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                        <span><strong>{verifiedLaporanCount} Laporan</strong> Anda telah ditinjau</span>
                      </button>
                    )}
                    {verifiedBeritaCount > 0 && (
                      <button onClick={() => { setActiveTab('berita'); setIsNotifMenuOpen(false); }} className="w-full text-left p-2 rounded-xl hover:bg-gray-50 text-xs text-brand-brown-dark flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-brand-green"></div>
                        <span><strong>{verifiedBeritaCount} Ajuan Warta</strong> telah ditinjau</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            <button onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotifMenuOpen(false); }} className="w-9 h-9 rounded-full bg-brand-brown-dark flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer hover:scale-105 transition-transform">
              DK
            </button>

            {isProfileMenuOpen && (
              <div className="absolute top-12 right-0 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
                <button onClick={() => { setIsChangePasswordModalOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-700">
                  Pengaturan Akun
                </button>
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-red-50 text-xs font-bold text-brand-red">
                  Keluar Sesi
                </button>
              </div>
            )}
          </div>
`;

// Inject before <GreetingBanner
const targetString = "<GreetingBanner name={profile?.nama_ketua || 'Ketua DKR'} role={`Dewan Kerja Ranting ${kecamatan?.nama_kecamatan || ''}`} />";
content = content.replace(targetString, desktopHeader + '\n          ' + targetString);

fs.writeFileSync('src/components/PortalDkr.tsx', content);
console.log('Added desktop header for PortalDkr');
