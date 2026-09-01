const fs = require('fs');

let content = fs.readFileSync('src/components/PortalAdmin.tsx', 'utf-8');

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

if (!content.includes('handleChangePassword')) {
  content = content.replace(/const handleLogout =/, changePwInjection);
}

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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-brand-green/20"
                  placeholder="Minimal 6 karakter"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsChangePasswordModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-green hover:bg-brand-green/90 shadow-md">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
`;

if (!content.includes('Change Password Modal')) {
  // Try to insert before bottom navigation, or before closing main
  if (content.includes('{/* 3. BOTTOM NAVIGATION')) {
    content = content.replace(/\{(\/\* 3\. BOTTOM NAVIGATION)/, modalInjection + '\n      {$1');
  } else {
    // just put it right before the last closing </main>
    content = content.replace(/<\/main>/, modalInjection + '\n        </main>');
  }
}

fs.writeFileSync('src/components/PortalAdmin.tsx', content);
console.log('Fixed handleChangePassword and Modal in PortalAdmin');
