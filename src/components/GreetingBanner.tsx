import React, { useState, useEffect } from 'react';
import { User, Shield } from 'lucide-react';

interface GreetingBannerProps {
  name: string;
  role: string;
}

export default function GreetingBanner({ name, role }: GreetingBannerProps) {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setGreeting('Selamat Pagi');
    else if (hour >= 11 && hour < 15) setGreeting('Selamat Siang');
    else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');
  }, []);

  return (
    <div className="relative w-full rounded-[2rem] overflow-hidden bg-[#FFF9F5] shadow-sm border border-orange-100/50 mb-8 min-h-[180px] sm:min-h-[200px] flex items-center">
      {/* Background Image (Right aligned with fade out to left) */}
      <div className="absolute inset-0 z-0 flex justify-end">
        <div className="w-full sm:w-2/3 h-full relative">
          <img 
            src="/banner-pramuka.jpg" 
            alt="Pramuka Banner" 
            className="w-full h-full object-cover object-left-bottom sm:object-center"
          />
          {/* Gradient mask to blend with background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FFF9F5] via-[#FFF9F5]/80 to-transparent"></div>
          {/* Top/bottom soft gradients for smooth edges */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFF9F5]/40 to-transparent"></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full sm:w-2/3 p-6 sm:p-10">
        <div className="flex items-center gap-2 mb-2 text-brand-orange font-bold font-mono text-[10px] sm:text-xs">
          <span>✨</span>
          <span className="uppercase tracking-wider">{greeting},</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-brand-brown-dark tracking-tight mb-3">
          {name}.
        </h1>
        
        <p className="text-xs sm:text-sm text-gray-500 font-mono mb-6 max-w-md leading-relaxed">
          Semoga hari ini penuh berkah dan kemudahan dalam {role === 'admin' ? 'mengelola portal DKC Kab. Tasikmalaya' : 'mengelola administrasi Pramuka Penegak Pandega di Kwarran Anda'}.
        </p>

        <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange/10 border border-brand-orange/20 rounded-xl">
          <div className="w-6 h-6 rounded-full bg-brand-orange text-white flex items-center justify-center">
            {role === 'admin' ? <Shield className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black font-mono text-brand-orange uppercase leading-none">AKSES AKUN</span>
            <span className="text-[11px] font-bold text-brand-brown-dark leading-tight capitalize">
              {role === 'admin' ? 'Administrator' : 'Dewan Kerja Ranting'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
