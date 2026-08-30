import { Compass, Mail, Phone, MapPin, Youtube, Instagram, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-brown-dark text-gray-200 border-t-8 border-brand-green pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Left Column - Org Branding */}
        <div>
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-brand-orange overflow-hidden p-0.5 shadow-md">
              <img src="/logo.png" alt="Logo DKC" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-white leading-tight">
                DEWAN KERJA CABANG
              </h3>
              <p className="text-xs text-brand-orange font-mono tracking-wider font-semibold">
                KABUPATEN TASIKMALAYA
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed mb-6">
            Wadah tertinggi bagi pembinaan Pramuka Penegak dan Pandega se-Kabupaten Tasikmalaya. Mengawal generasi muda yang tangguh, berkarakter luhur, dan mengabdi tiada batas.
          </p>
          <div className="flex space-x-3 text-sm text-gray-400 items-center">
            <img src="/logo.png" alt="Icon" className="w-4 h-4 object-contain" />
            <span className="font-mono">Satyaku Kudarmakan, Darmaku Kubaktikan</span>
          </div>
        </div>

        {/* Center Column - Address & Contact */}
        <div>
          <h4 className="text-white font-extrabold text-base tracking-tight mb-6 border-b-2 border-brand-orange pb-2 inline-block">
            Hubungi Sekretariat
          </h4>
          <ul className="space-y-4 text-sm text-gray-300">
            <li className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
              <span>Jl. Pemuda No. 12, Singaparna, Kabupaten Tasikmalaya, Jawa Barat, 46411</span>
            </li>
            <li className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-brand-green shrink-0" />
              <a href="mailto:info@dkctasikmalaya.org" className="hover:text-brand-orange transition-colors">info@dkctasikmalaya.org</a>
            </li>
            <li className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-brand-teal shrink-0" />
              <span>0265-123456 (Sekretariat DKC)</span>
            </li>
          </ul>
        </div>

        {/* Right Column - Social Media Connect */}
        <div>
          <h4 className="text-white font-extrabold text-base tracking-tight mb-6 border-b-2 border-brand-orange pb-2 inline-block">
            Media Sosial Resmi
          </h4>
          <p className="text-sm text-gray-300 leading-relaxed mb-6">
            Ikuti perjalanan, publikasi, dan siaran kegiatan Pramuka Penegak & Pandega Kabupaten Tasikmalaya di platform kami.
          </p>
          
          <div className="grid grid-cols-1 gap-3 font-mono text-xs">
            {/* Instagram */}
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-3 bg-[#4c352a] hover:bg-brand-orange hover:text-brand-brown-dark p-3 rounded-xl transition-all"
            >
              <Instagram className="w-5 h-5 text-[#E1306C] group-hover:text-inherit" />
              <div>
                <span className="font-bold block text-white text-xs">Instagram</span>
                <span className="text-[10px] text-gray-300">@dkctasikmalaya</span>
              </div>
            </a>

            {/* Youtube */}
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-3 bg-[#4c352a] hover:bg-brand-red hover:text-white p-3 rounded-xl transition-all"
            >
              <Youtube className="w-5 h-5 text-[#FF0000]" />
              <div>
                <span className="font-bold block text-white text-xs">YouTube</span>
                <span className="text-[10px] text-gray-300">DKC TV Tasikmalaya</span>
              </div>
            </a>

            {/* TikTok */}
            <a 
              href="https://tiktok.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center space-x-3 bg-[#4c352a] hover:bg-black hover:text-white p-3 rounded-xl transition-all"
            >
              <svg className="w-5 h-5 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.62 4.14 1.13 1.14 2.66 1.77 4.23 1.8v3.96c-1.63-.02-3.21-.57-4.52-1.57-.46-.35-.86-.76-1.19-1.22-.05 2.12-.01 4.24-.03 6.36-.09 2.53-1.02 4.99-2.78 6.78-2.22 2.13-5.56 2.82-8.48 1.76-2.58-.93-4.66-3.15-5.38-5.78C-.7 12.83 1.16 9.07 4.35 7.63c1.78-.79 3.86-.77 5.62.11V11.8c-.89-.48-1.92-.62-2.92-.38-1.54.34-2.73 1.69-2.9 3.26-.22 1.62.63 3.23 2.1 3.84 1.48.61 3.29.13 4.19-1.18.51-.71.74-1.59.73-2.46-.01-4.96-.01-9.92-.01-14.88z" />
              </svg>
              <div>
                <span className="font-bold block text-white text-xs">TikTok</span>
                <span className="text-[10px] text-gray-300">@dkctasik</span>
              </div>
            </a>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#4c352a] mt-12 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 font-mono">
        <p>© 2026 DKC Kabupaten Tasikmalaya. Hak Cipta Dilindungi.</p>
        <p className="mt-2 md:mt-0 text-brand-orange">Gerakan Pramuka • Membina Pemimpin • Mengabdi Tiada Batas</p>
      </div>
    </footer>
  );
}
