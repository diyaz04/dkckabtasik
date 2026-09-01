const fs = require('fs');

let content = fs.readFileSync('src/components/PortalDkr.tsx', 'utf-8');

// 1. Add new states
const stateInjection = `  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);`;

content = content.replace(/const \[isMobileMenuOpen, setIsMobileMenuOpen\] = useState\(false\);/, stateInjection);

// 2. Add handleChangePassword
const changePwInjection = `
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return alert('Password minimal 6 karakter');
    if (!user?.user_id) return alert('Gagal mengidentifikasi user. Silakan relogin.');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.user_id, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert('Password berhasil diubah!');
      setIsChangePasswordModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      alert('Gagal merubah password: ' + err.message);
    }
  };

  const handleLogout =`;

content = content.replace(/const handleLogout =/, changePwInjection);

// 3. Add notification variables
const notifVars = `
  const verifiedLaporanCount = laporanList.filter(l => l.status === 'diterima' || l.status === 'ditolak').length;
  const verifiedBeritaCount = beritaList.filter(b => b.status === 'approved' || b.status === 'rejected').length;
  const totalNotifs = verifiedLaporanCount + verifiedBeritaCount;
`;
// Put it before return (
content = content.replace(/return \(/, notifVars + '\n  return (');

// 4. Update Header Buttons
const oldHeaderRight = /<div className="flex items-center gap-4">[\s\S]*?<\/div>\s*<\/div>/;

const newHeaderRight = `<div className="flex items-center gap-4 relative">
          <button onClick={() => { setIsNotifMenuOpen(!isNotifMenuOpen); setIsProfileMenuOpen(false); }} className="relative text-gray-500 p-1">
            <Bell className="w-5 h-5" />
            {totalNotifs > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
          </button>
          
          {isNotifMenuOpen && (
            <div className="absolute top-10 right-10 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 z-50">
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

          <button onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotifMenuOpen(false); }} className="w-8 h-8 rounded-full bg-brand-brown-dark flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer">
            DK
          </button>

          {isProfileMenuOpen && (
            <div className="absolute top-10 right-0 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50">
              <button onClick={() => { setIsChangePasswordModalOpen(true); setIsProfileMenuOpen(false); }} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-gray-50 text-xs font-bold text-gray-700">
                Pengaturan Akun
              </button>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-red-50 text-xs font-bold text-brand-red">
                Keluar Sesi
              </button>
            </div>
          )}
        </div>
      </div>`;

content = content.replace(oldHeaderRight, newHeaderRight);

// 5. Inject Change Password Modal
const modalInjection = `
      {/* Change Password Modal */}
      {isChangePasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsChangePasswordModalOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-black text-brand-brown-dark mb-1">Ganti Password</h3>
            <p className="text-xs text-gray-500 mb-6">Masukkan password baru untuk akun Anda.</p>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Password Baru</label>
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-brown-dark focus:ring-2 focus:ring-brand-brown-dark/20"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsChangePasswordModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-brown-dark hover:bg-brand-brown-dark/90 shadow-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace(/\{(\/\* 3\. BOTTOM NAVIGATION)/, modalInjection + '\n      {$1');

fs.writeFileSync('src/components/PortalDkr.tsx', content);
console.log('Done Dkr');
