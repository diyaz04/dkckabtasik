import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key, Mail, Award, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPortal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Email atau password salah');
      }

      // Store in local storage
      localStorage.setItem('dkc_token', resData.token);
      localStorage.setItem('dkc_user', JSON.stringify(resData.user));
      if (resData.kecamatan) {
        localStorage.setItem('dkc_keca', JSON.stringify(resData.kecamatan));
      } else {
        localStorage.removeItem('dkc_keca');
      }
      if (resData.saka) {
        localStorage.setItem('dkc_saka', JSON.stringify(resData.saka));
      } else {
        localStorage.removeItem('dkc_saka');
      }

      // Redirect based on role
      if (resData.user.role === 'admin') {
        navigate('/portal/admin');
      } else if (resData.user.role === 'saka') {
        navigate('/portal/saka');
      } else {
        navigate('/portal/dkr');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      
      {/* Dynamic background shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-orange/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-green/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <button 
          onClick={() => navigate('/')} 
          className="mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#5C4033] hover:text-brand-orange transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Beranda Publik
        </button>

        {/* Login Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white border border-[#E5DCD3] rounded-3xl p-8 shadow-xl"
        >
          {/* Logo & Heading */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-md mb-4 p-1 overflow-hidden">
              <img src="/logo.png" alt="Logo DKC" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-xl font-black text-[#5C4033] tracking-tight uppercase">
              PORTAL INTERNAL
            </h1>
            <p className="text-[10px] text-brand-orange font-mono uppercase tracking-widest mt-1.5 font-bold">
              DKC KAB. TASIKMALAYA
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-brand-red/10 border border-brand-red/30 rounded-xl p-3.5 mb-6 text-xs text-brand-red font-semibold flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-mono">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@dkctasik.org"
                  required
                  className="w-full bg-[#FAF9F6] border border-[#E5DCD3] rounded-xl py-3.5 pl-11 pr-4 text-sm text-[#5C4033] focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all font-mono placeholder:text-gray-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 font-mono">
                Kata Sandi
              </label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#FAF9F6] border border-[#E5DCD3] rounded-xl py-3.5 pl-11 pr-4 text-sm text-[#5C4033] focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all font-mono placeholder:text-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange hover:bg-[#e0951b] text-white font-bold text-xs py-4 rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              {loading ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-1 text-xs">Memvalidasi Ambalan...</span>
                </div>
              ) : (
                'MASUK PORTAL SINKRON'
              )}
            </button>
          </form>

          {/* Footer Guide Info */}
          <div className="border-t border-[#E5DCD3] mt-8 pt-6 text-center text-[10px] text-gray-400 font-mono leading-relaxed">
            <p>Portal login diperuntukkan khusus bagi <strong>Pengurus DKC Kabupaten</strong> dan <strong>Utusan DKR Kecamatan</strong>.</p>
            <p className="mt-2 text-brand-orange font-bold font-mono">Satyaku Kudarmakan, Darmaku Kubaktikan</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
