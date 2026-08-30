import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Compass, Award, ChevronRight, ChevronLeft, Calendar, BookOpen, Users, 
  MapPin, CheckCircle2, ChevronDown, Download, Eye, AlertCircle,
  Heart, Share2, X, Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence, useScroll, useVelocity, useTransform, useSpring, useMotionValue, useAnimationFrame } from 'motion/react';
import InteractiveMap from './InteractiveMap';
import { 
  Kecamatan, Personalia, Berita, AgendaKegiatan, 
  Informasi, SiteContent, FormKegiatanConfig, DkcProfile, Saka
} from '../types';

interface VelocityMarqueeProps {
  baseVelocity: number;
  children: string;
}

function VelocityMarquee({ baseVelocity = 3, children }: VelocityMarqueeProps) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false
  });

  const x = useTransform(baseX, (v) => `${v}%`);

  const directionFactor = useRef<number>(-1);
  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000);

    const vel = velocityFactor.get();
    if (vel < 0) {
      directionFactor.current = -1;
    } else if (vel > 0) {
      directionFactor.current = 1;
    }

    // Scroll speed inflates velocity multiplier
    moveBy += directionFactor.current * vel * (delta / 1000) * 15;

    baseX.set(baseX.get() + moveBy);
    
    // Seamless wrapping between -50% and 0%
    if (baseX.get() <= -50) {
      baseX.set(0);
    } else if (baseX.get() >= 0) {
      baseX.set(-50);
    }
  });

  return (
    <div className="overflow-hidden whitespace-nowrap flex flex-nowrap py-4 bg-brand-brown-dark text-brand-orange uppercase text-[11px] font-mono font-extrabold border-y-4 border-brand-green select-none tracking-widest relative z-20">
      <motion.div style={{ x }} className="flex whitespace-nowrap gap-12 shrink-0">
        <span className="flex items-center gap-12">{children} ⚜ {children} ⚜ {children} ⚜ {children}</span>
        <span className="flex items-center gap-12">{children} ⚜ {children} ⚜ {children} ⚜ {children}</span>
      </motion.div>
    </div>
  );
}

interface OverlappingSectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  isFirst?: boolean;
}

function OverlappingSection({ children, id, className = "", isFirst = false }: OverlappingSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth overlapping interpolation
  const scale = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [0.93, 1, 1, 0.93]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.7, 1, 1, 0.7]);
  const y = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [80, 0, 0, -80]);

  return (
    <div ref={containerRef} className={`relative min-h-[50vh] md:min-h-screen px-2 sm:px-4 ${isFirst ? 'pt-4 pb-10 sm:pt-6' : 'py-10'}`}>
      <motion.div 
        style={{ scale, opacity, y }}
        id={id}
        className={`w-full h-full rounded-[30px] sm:rounded-[50px] overflow-hidden ${className} shadow-xl relative origin-center`}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default function LandingPage() {
  // DB States
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
  const [sakaList, setSakaList] = useState<Saka[]>([]);
  const [dkcProfile, setDkcProfile] = useState<DkcProfile | null>(null);
  const [dkcPersonalia, setDkcPersonalia] = useState<Personalia[]>([]);
  const [beritaList, setBeritaList] = useState<Berita[]>([]);
  const [agendaList, setAgendaList] = useState<AgendaKegiatan[]>([]);
  const [informasiList, setInformasiList] = useState<Informasi[]>([]);
  const [heroContent, setHeroContent] = useState<any>(null);
  const [dataPotensial, setDataPotensial] = useState<any[]>([]);
  const [laporanList, setLaporanList] = useState<any[]>([]);
  const [showKlasemen, setShowKlasemen] = useState<boolean>(true);
  const [themeColors, setThemeColors] = useState({
    brandOrange: '#F5A623',
    brandGreen: '#4CAF50',
    brandBrownDark: '#5C4033',
    brandBrownMid: '#8B7355',
  });

  // Compute Kwarran Standings
  const standings = useMemo(() => {
    const scores: Record<string, { kecamatan_id: string; nama: string; total_points: number; count_02gp: number; count_01diklat: number }> = {};
    
    kecamatanList.forEach(k => {
      scores[k.id] = {
        kecamatan_id: k.id,
        nama: k.nama_kecamatan,
        total_points: 0,
        count_02gp: 0,
        count_01diklat: 0
      };
    });

    laporanList.forEach(lap => {
      if (lap.status === 'diterima') {
        const kid = lap.kecamatan_id;
        if (!scores[kid]) {
          scores[kid] = {
            kecamatan_id: kid,
            nama: lap.kecamatan_nama || 'Kecamatan',
            total_points: 0,
            count_02gp: 0,
            count_01diklat: 0
          };
        }
        scores[kid].total_points += (lap.point_bobot || 0);
        if (lap.jenis_dokumen === '02GP') {
          scores[kid].count_02gp += 1;
        } else {
          scores[kid].count_01diklat += 1;
        }
      }
    });

    return Object.values(scores).sort((a, b) => b.total_points - a.total_points);
  }, [kecamatanList, laporanList]);

  // Filtering news
  const [selectedNewsFilter, setSelectedNewsFilter] = useState<'all' | 'dkc' | 'dkr' | 'saka'>('all');

  // Registration Modal States
  const [selectedAgenda, setSelectedAgenda] = useState<AgendaKegiatan | null>(null);
  const [agendaConfig, setAgendaConfig] = useState<FormKegiatanConfig | null>(null);
  const [registrationType, setRegistrationType] = useState<'mandiri' | 'kolektif'>('mandiri');
  const [registrationFormData, setRegistrationFormData] = useState<Record<string, any>>({});
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Load Data
  const loadData = async () => {
    try {
      // 1. Kecamatan
      const kecaRes = await fetch('/api/kecamatan');
      const kecaData = await kecaRes.json();
      setKecamatanList(kecaData);

      // 2. DKC Profile
      const dkcRes = await fetch('/api/dkc');
      const dkcData = await dkcRes.json();
      setDkcProfile(dkcData);

      // 3. DKC Personalia
      const persRes = await fetch('/api/personalia?owner_type=dkc');
      const persData = await persRes.json();
      setDkcPersonalia(persData);

      // 4. Approved Berita
      const newsRes = await fetch('/api/berita?status=approved');
      const newsData = await newsRes.json();
      setBeritaList(newsData);

      // 5. Agenda
      const ageRes = await fetch('/api/agenda');
      const ageData = await ageRes.json();
      setAgendaList(ageData);

      // 6. Informasi
      const infoRes = await fetch('/api/informasi');
      const infoData = await infoRes.json();
      setInformasiList(infoData);

      // 7. Site Content (Hero)
      const scRes = await fetch('/api/site_content');
      const scData = await scRes.json();
      const hero = scData.find((item: any) => item.section_key === 'hero');
      if (hero) setHeroContent(hero.content);

      const theme = scData.find((item: any) => item.section_key === 'theme');
      if (theme && theme.content) {
        setThemeColors({
          brandOrange: theme.content.brandOrange || '#F5A623',
          brandGreen: theme.content.brandGreen || '#4CAF50',
          brandBrownDark: theme.content.brandBrownDark || '#5C4033',
          brandBrownMid: theme.content.brandBrownMid || '#8B7355',
        });
      }

      const klasemen = scData.find((item: any) => item.section_key === 'klasemen');
      if (klasemen && klasemen.content) {
        setShowKlasemen(klasemen.content.show_klasemen !== false);
      } else {
        setShowKlasemen(true);
      }

      // 8. Data Potensial (for map stats)
      const potRes = await fetch('/api/data_potensial');
      const potData = await potRes.json();
      setDataPotensial(potData);

      // 9. SAKA list
      const sakaRes = await fetch('/api/saka');
      const sakaData = await sakaRes.json();
      setSakaList(sakaData);

      // 10. Laporan list (for standings computation)
      const lapRes = await fetch('/api/laporan_kegiatan');
      const lapData = await lapRes.json();
      setLaporanList(lapData || []);
    } catch (e) {
      console.error("Error loading landing page data:", e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Registration Modal
  const openRegistration = async (agenda: AgendaKegiatan) => {
    setSelectedAgenda(agenda);
    setRegisterSuccess(false);
    setRegistrationFormData({});
    
    try {
      const res = await fetch(`/api/agenda/${agenda.id}/config`);
      const config = await res.json();
      setAgendaConfig(config);
      if (config) {
        setRegistrationType(config.tipe_pendaftaran === 'keduanya' ? 'mandiri' : config.tipe_pendaftaran);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (fieldId: string, value: any) => {
    setRegistrationFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgenda) return;
    setRegisterLoading(true);

    try {
      const response = await fetch(`/api/agenda/${selectedAgenda.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipe: registrationType,
          kecamatan_id: null, // Public mandiri is null, or can be bound if desired
          data_peserta: registrationFormData
        })
      });

      if (response.ok) {
        setRegisterSuccess(true);
      } else {
        alert('Gagal mengirim pendaftaran, silakan coba lagi.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRegisterLoading(false);
    }
  };

  // Like and Share States
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [shareNews, setShareNews] = useState<Berita | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('liked_news_ids');
      if (saved) setLikedIds(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const handleToggleLike = async (id: string) => {
    const isLiked = likedIds.includes(id);
    const action = isLiked ? 'unlike' : 'like';
    
    // Optimistic update
    const updatedLiked = isLiked 
      ? likedIds.filter(item => item !== id)
      : [...likedIds, id];
    setLikedIds(updatedLiked);
    localStorage.setItem('liked_news_ids', JSON.stringify(updatedLiked));

    setBeritaList(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          likes: Math.max(0, (item.likes || 0) + (isLiked ? -1 : 1))
        };
      }
      return item;
    }));

    try {
      const res = await fetch(`/api/berita/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const resData = await res.json();
        setBeritaList(prev => prev.map(item => {
          if (item.id === id) {
            return { ...item, likes: resData.likes };
          }
          return item;
        }));
      }
    } catch (err) {
      console.error("Failed to like:", err);
    }
  };

  const handleDownloadPamflet = async () => {
    if (!shareNews) return;
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
      link.download = `pamflet-${shareNews.slug}.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error("Error generating pamphlet:", err);
      alert("Gagal mengunduh pamflet. Silakan salin tautan manual.");
    }
  };

  const handleCopyLink = () => {
    if (!shareNews) return;
    const link = `${window.location.origin}/berita/${shareNews.slug}`;
    navigator.clipboard.writeText(link);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const stripHtml = (html: string) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  // Calendar and Activities States
  const [kegiatanSubTab, setKegiatanSubTab] = useState<'calendar' | 'registration'>('calendar');
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(7); // Default to August (0-indexed = 7)
  const [selectedDay, setSelectedDay] = useState<number | null>(14); // Default to 14 (Kemah Bakti starts on 14)
  const [selectedCalendarCategory, setSelectedCalendarCategory] = useState<'all' | 'dkc' | 'daerah' | 'nasional' | 'internasional'>('all');

  const INDO_MONTHS = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const INDO_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const getFirstDayIndex = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayIndex(currentYear, currentMonth);
  
  const prevMonthIdx = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevDaysInMonth = getDaysInMonth(prevYear, prevMonthIdx);

  const calendarCells = [];

  // Previous month filler days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: prevDaysInMonth - i,
      month: prevMonthIdx,
      year: prevYear,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      day: d,
      month: currentMonth,
      year: currentYear,
      isCurrentMonth: true,
    });
  }

  // Next month filler days (to make full grid of multiples of 7, e.g. 42 cells)
  const remainingCells = 42 - calendarCells.length;
  const nextMonthIdx = currentMonth === 11 ? 0 : currentMonth + 1;
  const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  for (let d = 1; d <= remainingCells; d++) {
    calendarCells.push({
      day: d,
      month: nextMonthIdx,
      year: nextYear,
      isCurrentMonth: false,
    });
  }

  // Helper to format date as 'YYYY-MM-DD'
  const formatDateString = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  };

  // Helper to check if activity fits the category filter
  const matchesCategoryFilter = (a: AgendaKegiatan) => {
    if (selectedCalendarCategory === 'all') return true;
    if (selectedCalendarCategory === 'dkc') {
      return a.jenis === 'mandiri' && !a.kecamatan_id;
    }
    if (selectedCalendarCategory === 'daerah') {
      return a.tingkat === 'provinsi';
    }
    if (selectedCalendarCategory === 'nasional') {
      return a.tingkat === 'nasional';
    }
    if (selectedCalendarCategory === 'internasional') {
      return a.tingkat === 'internasional';
    }
    return true;
  };

  const getActivitiesForDate = (y: number, m: number, d: number) => {
    const dStr = formatDateString(y, m, d);
    return agendaList.filter(a => {
      if (!a.status_publikasi) return false;
      if (a.is_tanggal_diputuskan === false) return false;
      if (!matchesCategoryFilter(a)) return false;
      return dStr >= a.tanggal_mulai && dStr <= a.tanggal_selesai;
    });
  };

  const getUndecidedActivitiesForMonth = () => {
    const mStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return agendaList.filter(a => {
      if (!a.status_publikasi) return false;
      if (a.is_tanggal_diputuskan !== false) return false;
      if (!matchesCategoryFilter(a)) return false;
      return a.bulan_rencana === mStr;
    });
  };

  const handlePrevMonth = () => {
    setSelectedDay(null);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedDay(null);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Filter News
  const filteredBerita = beritaList.filter(b => {
    if (selectedNewsFilter === 'all') return true;
    if (selectedNewsFilter === 'dkc') return !b.kecamatan_id && !b.saka_id;
    if (selectedNewsFilter === 'dkr') return !!b.kecamatan_id;
    if (selectedNewsFilter === 'saka') return !!b.saka_id;
    return true;
  });

  const displayHero = {
    title: heroContent?.title || 'Dewan Kerja Cabang',
    subtitle: heroContent?.subtitle || 'Kabupaten Tasikmalaya',
    lead: heroContent?.lead || 'Wadah Pembinaan Pramuka Penegak dan Pandega Tasikmalaya. Berkarakter, bersaudara, berdaya saing, berbakti tiada batas.',
    cta_text: heroContent?.cta_text || 'Jelajahi Kegiatan',
    badge_text: heroContent?.badge_text || 'Satyaku Kudarmakan, Darmaku Kubaktikan',
    bg_image_url: heroContent?.bg_image_url || 'https://media.suara.com/pictures/970x544/2023/08/14/79829-hari-pramuka-raimuna-nasional-xii.jpg',
    bg_opacity: heroContent?.bg_opacity !== undefined ? Number(heroContent.bg_opacity) : 0.4
  };

  return (
    <div className="bg-white min-h-screen">
      <style>{`
        :root {
          --color-brand-orange: ${themeColors.brandOrange} !important;
          --color-brand-green: ${themeColors.brandGreen} !important;
          --color-brand-brown-dark: ${themeColors.brandBrownDark} !important;
          --color-brand-brown-mid: ${themeColors.brandBrownMid} !important;
        }
      `}</style>
      
      {/* 1. HERO SECTION - Overlapping Layout with Custom Photo Background & Adjustable Opacity */}
      <OverlappingSection id="home" isFirst={true} className="relative overflow-hidden bg-brand-brown-dark py-24 sm:py-32 text-white shadow-xl">
        {/* Underneath photo with custom opacity */}
        {displayHero.bg_image_url && (
          <div 
            className="absolute inset-0 bg-cover bg-center pointer-events-none transition-all duration-300"
            style={{ 
              backgroundImage: `url(${displayHero.bg_image_url})`,
              opacity: displayHero.bg_opacity
            }}
          />
        )}
        {/* Color gradient on top of photo */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/70 via-brand-brown-mid/85 to-brand-green/80 pointer-events-none z-[1]"></div>
        
        <div className="absolute inset-0 bg-black/15 pointer-events-none z-[2]"></div>
        
        {/* Organic decorative background shapes */}
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none z-[2]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-orange/20 rounded-full blur-3xl translate-y-1/2 translate-x-1/2 pointer-events-none z-[2]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tag badge with decorative Scout Fleur-de-lis */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-white/25 border border-white/20 backdrop-blur rounded-full px-4 py-1.5 text-xs font-mono font-bold tracking-widest uppercase shadow-md"
            >
              <span className="text-white text-base">⚜</span>
              {displayHero.badge_text}
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-7xl font-black tracking-tight leading-none text-white drop-shadow-sm"
            >
              {displayHero.title} <span className="block text-brand-orange drop-shadow-md">{displayHero.subtitle}</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-xl text-gray-100 max-w-2xl leading-relaxed font-sans"
            >
              {displayHero.lead}
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="pt-4 flex flex-wrap gap-4"
            >
              <a 
                href="#kegiatan"
                className="bg-brand-brown-dark hover:bg-[#3d2920] text-white font-extrabold text-sm px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
              >
                {displayHero.cta_text}
                <ChevronRight className="w-4 h-4" />
              </a>
              <a 
                href="#peta"
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-sm px-7 py-4 rounded-full transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
              >
                Peta DKR
              </a>
            </motion.div>
          </div>

          {/* Graphical scout side visual (No generic AI image, clean scout emblem card) */}
          <div className="lg:col-span-4 hidden lg:flex justify-center relative">
            <div className="w-72 h-72 rounded-full border-4 border-white/30 p-4 bg-[#2b1d16]/30 backdrop-blur-md flex items-center justify-center shadow-2xl relative animate-pulse-slow">
              <span className="text-white text-9xl">⚜</span>
              {/* Spinning circular logo badge text */}
              <div className="absolute inset-0 border border-white/10 rounded-full scale-110 pointer-events-none" />
              <div className="absolute inset-0 border border-brand-orange/20 rounded-full scale-120 pointer-events-none" />
            </div>
          </div>
        </div>
      </OverlappingSection>

      {/* 2. VISI & MISI SECTION - Overlapping Layout */}
      <OverlappingSection id="profil" className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Asymmetric visual side */}
          <div className="lg:col-span-4 space-y-6">
            <span className="text-xs font-mono font-bold tracking-widest text-brand-orange uppercase block">
              Mengenal DKC Tasikmalaya
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-brown-dark tracking-tight leading-tight">
              Arah Juang Pembinaan T/D
            </h2>
            <div className="w-16 h-2 bg-gradient-to-r from-brand-orange to-brand-green rounded-full"></div>
            <p className="text-sm text-gray-500 leading-relaxed font-sans">
              DKC Kabupaten Tasikmalaya mengemban amanah mengelola pembinaan, merumuskan kebijakan operasional pramuka Penegak dan Pandega di seluruh pangkalan ranting se-kabupaten.
            </p>
          </div>

          {/* Core Content - Visi & Misi Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Visi */}
            <div className="bg-white rounded-3xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group transition-all duration-300">
              <div className="w-12 h-12 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                V
              </div>
              <h3 className="font-extrabold text-lg text-brand-brown-dark mb-4">Visi Dewan Kerja</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {dkcProfile?.visi || "Mewujudkan Pramuka Penegak dan Pandega Kabupaten Tasikmalaya yang aktif, berkarakter, berdaya saing tinggi, dan berjiwa mengabdi."}
              </p>
            </div>

            {/* Misi */}
            <div className="bg-white rounded-3xl p-8 shadow-md hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group transition-all duration-300">
              <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-brand-green font-bold text-lg mb-6 group-hover:scale-110 transition-transform">
                M
              </div>
              <h3 className="font-extrabold text-lg text-brand-brown-dark mb-4">Misi Dewan Kerja</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {dkcProfile?.misi || "1. Mengoptimalkan peran DKR.\n2. Mengembangkan kegiatan Penegak/Pandega inovatif.\n3. Memperkokoh solidaritas kepramukaan."}
              </p>
            </div>
          </div>

        </div>
      </OverlappingSection>

      {/* 3. STRUKTUR PERSONALIA SECTION - Overlapping Layout */}
      <OverlappingSection id="personalia" className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-wider">Pimpinan Cabang</span>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-brown-dark tracking-tight">
              Struktur Personalia DKC
            </h2>
            <p className="text-xs text-gray-500 font-mono">
              Para kader penggerak utama Dewan Kerja Cabang Kabupaten Tasikmalaya periode aktif.
            </p>
          </div>

          {dkcPersonalia.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {dkcPersonalia.map((p) => (
                <div 
                  key={p.id}
                  className="bg-[#2e1d15] rounded-3xl overflow-hidden shadow-md relative h-[360px] flex flex-col justify-end group cursor-pointer"
                >
                  {/* Full image */}
                  <img 
                    src={p.foto_url} 
                    alt={p.nama}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                  {/* Overlay shadow gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>

                  {/* Floating Name Badge - Brand style */}
                  <div className="relative z-10 m-4 p-4 rounded-2xl bg-gradient-to-r from-brand-orange to-brand-teal text-white shadow-lg group-hover:translate-y-[-5px] transition-transform">
                    <h4 className="font-extrabold text-sm tracking-tight leading-tight uppercase">
                      {p.nama}
                    </h4>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/10">
                      <span className="text-[10px] font-bold font-mono bg-white/20 px-2 py-0.5 rounded uppercase">
                        {p.jabatan}
                      </span>
                      <span className="text-[10px] font-mono capitalize">
                        {p.golongan}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500 italic">
              Belum ada data personalia pengurus DKC terinput.
            </div>
          )}
        </div>
      </OverlappingSection>

      {/* 4. SEBARAN DKR MAP SECTION - Overlapping Layout */}
      <OverlappingSection id="peta" className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-full">
          <InteractiveMap 
            kecamatanList={kecamatanList} 
            dataPotensialList={dataPotensial} 
          />
        </div>
      </OverlappingSection>

      {/* 4.5. KLASEMEN KEAKTIFAN KWARRAN / DKR SECTION (Conditional) */}
      {showKlasemen && (
        <OverlappingSection id="klasemen" className="bg-[#FAF9F6] py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-wider block">
                Leaderboard Prestasi Keaktifan DKR
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-brown-dark tracking-tight">
                Klasemen Keaktifan Kwartir Ranting
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 font-sans max-w-xl mx-auto leading-relaxed">
                Peringkat keaktifan Dewan Kerja Ranting se-Kabupaten Tasikmalaya yang dihitung otomatis berdasarkan poin verifikasi laporan kegiatan 02GP &amp; 01 Diklat yang disetujui.
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-[32px] overflow-hidden shadow-xl shadow-brand-brown-dark/5">
              {/* Table Wrapper for beautiful responsive scrolling */}
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-brown-dark text-white text-[10px] uppercase font-mono tracking-wider">
                      <th className="py-5 px-6 font-bold">Pos</th>
                      <th className="py-5 px-6 font-bold">Kwarran / Kecamatan</th>
                      <th className="py-5 px-6 font-bold text-center">Laporan 02GP</th>
                      <th className="py-5 px-6 font-bold text-center">Laporan 01 Diklat</th>
                      <th className="py-5 px-6 font-bold text-right">Total Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs font-mono">
                    {standings.map((item, idx) => {
                      const isTop3 = idx < 3;
                      const badges = ['🥇', '🥈', '🥉'];
                      return (
                        <tr 
                          key={item.kecamatan_id} 
                          className={`transition-colors hover:bg-slate-50/50 ${
                            isTop3 ? 'bg-amber-500/[0.01]' : ''
                          }`}
                        >
                          <td className="py-4 px-6 font-bold text-slate-800">
                            {isTop3 ? (
                              <span className="text-lg" title={`Peringkat ${idx + 1}`}>{badges[idx]}</span>
                            ) : (
                              <span className="text-gray-400 pl-1">{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-800 uppercase tracking-tight font-sans">
                              Kwarran {item.nama}
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">Kabupaten Tasikmalaya</span>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-[#009B4E]">
                            {item.count_02gp > 0 ? (
                              <span className="bg-[#009B4E]/10 text-[#009B4E] px-2.5 py-1 rounded-full text-[10px]">
                                {item.count_02gp} Laporan
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-blue-600">
                            {item.count_01diklat > 0 ? (
                              <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[10px]">
                                {item.count_01diklat} Laporan
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right font-black text-brand-brown-dark">
                            <span className={`inline-block px-3 py-1.5 rounded-xl font-bold font-mono text-xs ${
                              isTop3 
                                ? 'bg-[#009B4E] text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {item.total_points} Pts
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </OverlappingSection>
      )}

      {/* 4B. SATUAN KARYA PRAMUKA (SAKA) SECTION */}
      <OverlappingSection id="saka" className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-wider block">
              PRAMUKA PEMINATAN & PROFESIONAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-brown-dark tracking-tight">
              Satuan Karya Pramuka (SAKA)
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-sans max-w-xl mx-auto">
              Wadah pembinaan bagi Pramuka Penegak dan Pandega se-Kabupaten Tasikmalaya untuk menyalurkan minat, mengembangkan bakat, dan meningkatkan keterampilan vokasional.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sakaList.map((sk) => {
              // Find potential members for this SAKA
              const pot = dataPotensial.find(p => p.saka_id === sk.id);
              const totalAnggota = pot 
                ? (pot.jumlah_penegak_l + pot.jumlah_penegak_p + pot.jumlah_pandega_l + pot.jumlah_pandega_p)
                : null;

              return (
                <div 
                  key={sk.id}
                  className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="p-6 sm:p-8 space-y-4">
                    {/* SAKA Header Badge/Icon block */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-brand-orange/10 rounded-2xl flex items-center justify-center text-brand-orange shrink-0">
                        <Compass className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-lg text-brand-brown-dark tracking-tight leading-snug">
                          {sk.nama_saka}
                        </h3>
                        <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-50 border px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Tk. Kabupaten
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed font-sans line-clamp-3">
                      {sk.deskripsi || `${sk.nama_saka} tingkat Kabupaten Tasikmalaya yang aktif membina kader kepramukaan bidang keterampilan khusus.`}
                    </p>

                    {/* Stats Summary if exists */}
                    {totalAnggota !== null && (
                      <div className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 flex items-center justify-between text-xs font-mono">
                        <span className="text-gray-400 font-bold uppercase text-[9px]">Potensi Anggota</span>
                        <span className="font-black text-brand-orange bg-brand-orange/5 px-2.5 py-1 rounded-lg border border-brand-orange/10">
                          {totalAnggota} Jiwa
                        </span>
                      </div>
                    )}
                  </div>

                  {/* View Details Action */}
                  <div className="p-6 sm:p-8 pt-0">
                    <Link 
                      to={`/saka/${sk.slug}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-brand-brown-dark hover:bg-brand-orange text-white hover:text-white font-extrabold text-xs py-3.5 px-4 rounded-xl uppercase tracking-wider shadow hover:shadow-lg cursor-pointer transition-all duration-300 font-mono"
                    >
                      <span>Lihat Detail SAKA</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {sakaList.length === 0 && (
            <p className="text-center text-gray-400 py-8 italic text-xs font-mono">Belum ada data SAKA terdaftar.</p>
          )}

        </div>
      </OverlappingSection>

      {/* 5. BERITA & WARTA SECTION - Overlapping Layout */}
      <OverlappingSection id="berita" className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-mono font-bold text-brand-orange uppercase tracking-wider block mb-1">
                Kabar Pramuka Tasikmalaya
              </span>
              <h2 className="text-3xl font-black text-brand-brown-dark tracking-tight">
                Warta Kegiatan Terbaru
              </h2>
            </div>

            {/* Source News Filter Tags */}
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setSelectedNewsFilter('all')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold font-mono transition-all cursor-pointer ${
                  selectedNewsFilter === 'all' 
                    ? 'bg-brand-brown-dark text-white shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                Semua Kabar
              </button>
              <button
                onClick={() => setSelectedNewsFilter('dkc')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold font-mono transition-all cursor-pointer ${
                  selectedNewsFilter === 'dkc' 
                    ? 'bg-brand-orange text-white shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                Kabar DKC Cabang
              </button>
              <button
                onClick={() => setSelectedNewsFilter('dkr')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold font-mono transition-all cursor-pointer ${
                  selectedNewsFilter === 'dkr' 
                    ? 'bg-brand-teal text-white shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                Kabar Kontribusi DKR
              </button>
              <button
                onClick={() => setSelectedNewsFilter('saka')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold font-mono transition-all cursor-pointer ${
                  selectedNewsFilter === 'saka' 
                    ? 'bg-brand-orange text-white shadow-md' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                Kabar Kontribusi SAKA
              </button>
            </div>
          </div>

          {filteredBerita.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filteredBerita.map((b) => (
                <div 
                  key={b.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between group transition-all duration-350"
                >
                  <div>
                    {/* Header Image */}
                    <div className="relative h-48 overflow-hidden bg-brand-brown-dark">
                      <img 
                        src={b.gambar_url} 
                        alt={b.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-350"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800';
                        }}
                      />
                      {/* Source tag on top left */}
                      <span className={`absolute top-4 left-4 text-[9px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full text-white shadow-sm ${
                        b.saka_id ? 'bg-brand-orange' : b.kecamatan_id ? 'bg-[#2E5C9A]' : 'bg-[#E53935]'
                      }`}>
                        {b.saka_id ? `SAKA ${b.saka_nama}` : b.kecamatan_id ? `DKR ${b.kecamatan_nama}` : 'DKC Cabang'}
                      </span>
                    </div>

                    {/* Meta & Title */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(b.published_at).toLocaleDateString('id-ID')}</span>
                        <span>•</span>
                        <span>{b.author_name}</span>
                      </div>
                      <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight leading-snug mb-3 group-hover:text-brand-orange transition-colors">
                        {b.judul}
                      </h3>
                      {/* Preview text */}
                      <div 
                        className="text-xs text-gray-500 line-clamp-2 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: b.konten }}
                      />
                    </div>
                  </div>

                  {/* Read detail button & Likes/Share controls */}
                  <div className="px-6 pb-6 pt-3 flex items-center justify-between border-t border-gray-100 mt-auto">
                    <Link 
                      to={`/berita/${b.slug}`}
                      className="text-xs font-bold font-mono text-brand-orange hover:text-brand-brown-dark transition-colors flex items-center gap-1 uppercase"
                    >
                      Baca
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      {/* Like button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleLike(b.id);
                        }}
                        className={`flex items-center gap-1 text-[10px] font-extrabold font-mono px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                          likedIds.includes(b.id)
                            ? 'text-red-500 bg-red-50/80 border border-red-200'
                            : 'text-gray-500 bg-gray-50 hover:bg-gray-100 border border-slate-200/60'
                        }`}
                        title={likedIds.includes(b.id) ? "Batal Suka" : "Suka Berita Ini"}
                      >
                        <Heart className={`w-3.5 h-3.5 transition-transform active:scale-125 ${likedIds.includes(b.id) ? 'fill-current text-red-500' : 'text-gray-400'}`} />
                        <span>{b.likes || 0}</span>
                      </button>

                      {/* Share button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShareNews(b);
                        }}
                        className="flex items-center gap-1 text-[10px] text-brand-green font-extrabold font-mono px-2.5 py-1.5 rounded-xl bg-brand-green/5 hover:bg-brand-green/10 border border-brand-green/20 transition-all cursor-pointer"
                        title="Bagikan & Buat Pamflet Otomatis"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Bagikan</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50/70 rounded-3xl p-8 text-center text-gray-400 italic font-mono text-xs shadow-sm">
              Belum ada rilis berita dalam kategori ini.
            </div>
          )}

        </div>
      </OverlappingSection>

      {/* 6. KEGIATAN & KALENDER SECTION - Tabbed Interactive Module */}
      <OverlappingSection id="kegiatan" className="bg-gray-50 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
            <span className="text-xs font-mono font-bold text-brand-green uppercase tracking-wider">Agenda & Partisipasi</span>
            <h2 className="text-3xl font-black text-brand-brown-dark tracking-tight">
              Informasi & Kalender Kegiatan
            </h2>
            <p className="text-xs text-gray-500 font-mono">
              Agenda program kerja DKC, kegiatan partisipasi Daerah, Nasional, hingga Internasional secara real-time.
            </p>
          </div>

          {/* Sub-Tabs Selector */}
          <div className="flex justify-center mb-10">
            <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-1">
              <button
                onClick={() => setKegiatanSubTab('calendar')}
                className={`px-5 py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all cursor-pointer ${
                  kegiatanSubTab === 'calendar'
                    ? 'bg-brand-green text-white shadow-md'
                    : 'text-gray-500 hover:text-brand-green'
                }`}
              >
                📅 Kalender Kegiatan
              </button>
              <button
                onClick={() => setKegiatanSubTab('registration')}
                className={`px-5 py-2.5 rounded-xl font-bold font-mono text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                  kegiatanSubTab === 'registration'
                    ? 'bg-brand-green text-white shadow-md'
                    : 'text-gray-500 hover:text-brand-green'
                }`}
              >
                <span>📝 Portal Pendaftaran</span>
                {agendaList.filter(a => a.status_publikasi && a.is_aktif_pendaftaran).length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black leading-none ${
                    kegiatanSubTab === 'registration' ? 'bg-white text-brand-green' : 'bg-brand-green text-white'
                  }`}>
                    {agendaList.filter(a => a.status_publikasi && a.is_aktif_pendaftaran).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {kegiatanSubTab === 'calendar' ? (
            <div className="space-y-8">
              {/* Category Filter Pills */}
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { id: 'all', label: 'Semua Agenda' },
                  { id: 'dkc', label: 'Program Kerja DKC' },
                  { id: 'daerah', label: 'Partisipasi Daerah' },
                  { id: 'nasional', label: 'Nasional' },
                  { id: 'internasional', label: 'Internasional' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCalendarCategory(cat.id as any);
                      setSelectedDay(null); // Reset day selection to show monthly summary
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all border cursor-pointer ${
                      selectedCalendarCategory === cat.id
                        ? 'bg-brand-brown-dark text-white border-brand-brown-dark shadow'
                        : 'bg-white text-gray-600 border-slate-200/80 hover:bg-gray-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Main Calendar Grid & Detail Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT: Calendar Grid Card */}
                <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                  
                  {/* Calendar Navigation Header */}
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer"
                      title="Bulan Sebelumnya"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="text-center">
                      <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight font-mono uppercase">
                        {INDO_MONTHS[currentMonth]} {currentYear}
                      </h3>
                      <button
                        onClick={() => {
                          const now = new Date();
                          setCurrentYear(2026); // Anchor to our mock year
                          setCurrentMonth(7); // August is index 7
                          setSelectedDay(14); // Kemah Bakti
                        }}
                        className="text-[10px] font-bold font-mono text-brand-green hover:underline uppercase tracking-wider mt-1"
                      >
                        Reset ke Agustus 2026
                      </button>
                    </div>

                    <button
                      onClick={handleNextMonth}
                      className="p-2.5 rounded-xl border border-slate-200 hover:bg-gray-50 transition-colors text-gray-600 cursor-pointer"
                      title="Bulan Berikutnya"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Weekday Names Header */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2.5">
                    {INDO_DAYS.map((dayName, idx) => (
                      <span 
                        key={idx} 
                        className={`text-[10px] font-mono font-black uppercase tracking-wider ${
                          idx === 0 ? 'text-red-500' : idx === 6 ? 'text-brand-green' : 'text-gray-400'
                        }`}
                      >
                        {dayName}
                      </span>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarCells.map((cell, idx) => {
                      const dayActivities = cell.isCurrentMonth 
                        ? getActivitiesForDate(cell.year, cell.month, cell.day) 
                        : [];
                      
                      const hasActivities = dayActivities.length > 0;
                      const isSelected = selectedDay === cell.day && cell.isCurrentMonth;
                      const isTodayMock = cell.year === 2026 && cell.month === 7 && cell.day === 14; // anchor highlights

                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (cell.isCurrentMonth) {
                              setSelectedDay(cell.day);
                            }
                          }}
                          disabled={!cell.isCurrentMonth}
                          className={`relative aspect-square rounded-2xl flex flex-col items-center justify-between p-1.5 transition-all focus:outline-none select-none ${
                            !cell.isCurrentMonth
                              ? 'text-gray-300 opacity-20 cursor-default'
                              : isSelected
                              ? 'bg-brand-green text-white font-extrabold shadow-md ring-2 ring-brand-green/35 ring-offset-2'
                              : isTodayMock
                              ? 'bg-brand-green/5 text-brand-green border-2 border-brand-green/30 font-bold'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                          } ${cell.isCurrentMonth ? 'cursor-pointer' : ''}`}
                        >
                          <span className="text-xs font-mono font-bold leading-none self-start">
                            {cell.day}
                          </span>

                          {/* Level Dots inside Day Cell */}
                          {hasActivities && (
                            <div className="flex gap-0.5 justify-center flex-wrap w-full mt-auto mb-0.5 max-h-2 overflow-hidden">
                              {dayActivities.slice(0, 4).map((act) => {
                                let dotColor = 'bg-brand-orange'; // dkc/kabupaten
                                if (act.tingkat === 'provinsi') dotColor = 'bg-[#00A99D]'; // daerah
                                if (act.tingkat === 'nasional') dotColor = 'bg-red-500';
                                if (act.tingkat === 'internasional') dotColor = 'bg-indigo-600';
                                return (
                                  <span 
                                    key={act.id} 
                                    className={`w-1.5 h-1.5 rounded-full ${dotColor}`}
                                    title={act.nama_kegiatan}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Legend */}
                  <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-4 text-[9px] font-mono font-black uppercase text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-orange inline-block" />
                      <span>Program Kerja DKC</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00A99D] inline-block" />
                      <span>Partisipasi Daerah</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                      <span>Nasional</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" />
                      <span>Internasional</span>
                    </div>
                  </div>

                </div>

                {/* RIGHT: Detail Info Panel */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Selected Day Agenda Box */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-5">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-[10px] font-mono font-extrabold text-brand-green uppercase tracking-widest block">
                        📋 Detail Agenda Terpilih
                      </span>
                      <h4 className="font-extrabold text-sm text-brand-brown-dark tracking-tight mt-1 leading-snug">
                        {selectedDay ? (
                          <span>Agenda Tanggal {selectedDay} {INDO_MONTHS[currentMonth]} {currentYear}</span>
                        ) : (
                          <span>Ringkasan Agenda Bulan {INDO_MONTHS[currentMonth]}</span>
                        )}
                      </h4>
                    </div>

                    {/* Show Activities List */}
                    {(() => {
                      const actsToRender = selectedDay 
                        ? getActivitiesForDate(currentYear, currentMonth, selectedDay)
                        : agendaList.filter(a => {
                            if (!a.status_publikasi) return false;
                            if (a.is_tanggal_diputuskan === false) return false;
                            if (!matchesCategoryFilter(a)) return false;
                            // verify overlap with currently active month
                            const startM = new Date(a.tanggal_mulai).getMonth();
                            const startY = new Date(a.tanggal_mulai).getFullYear();
                            return startM === currentMonth && startY === currentYear;
                          });

                      if (actsToRender.length > 0) {
                        return (
                          <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
                            {actsToRender.map((a) => (
                              <div 
                                key={a.id} 
                                className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3 shadow-inner hover:bg-slate-100/50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-2 flex-wrap">
                                  <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-md text-white shadow-sm ${
                                    a.tingkat === 'kabupaten' ? 'bg-brand-orange' :
                                    a.tingkat === 'provinsi' ? 'bg-[#00A99D]' :
                                    a.tingkat === 'nasional' ? 'bg-red-500' : 'bg-indigo-600'
                                  }`}>
                                    {a.tingkat}
                                  </span>
                                  {a.is_aktif_pendaftaran && (
                                    <span className="bg-brand-green/10 text-brand-green text-[8px] font-black font-mono px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse">
                                      Pendaftaran Buka
                                    </span>
                                  )}
                                </div>

                                <h5 className="font-extrabold text-xs text-slate-900 tracking-tight leading-snug uppercase">
                                  {a.nama_kegiatan}
                                </h5>

                                <div className="space-y-1.5 text-[10px] text-gray-500 font-mono">
                                  <p className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                                    <span>📍 {a.tempat}</span>
                                  </p>
                                  <p className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-brand-green shrink-0" />
                                    <span>📅 {new Date(a.tanggal_mulai).toLocaleDateString('id-ID')} s.d {new Date(a.tanggal_selesai).toLocaleDateString('id-ID')}</span>
                                  </p>
                                </div>

                                {a.is_aktif_pendaftaran && (
                                  <button
                                    onClick={() => openRegistration(a)}
                                    className="w-full bg-brand-orange hover:bg-brand-orange/95 text-brand-brown-dark font-extrabold text-[10px] py-2 rounded-xl shadow-sm uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    Daftar Sekarang <ChevronRight className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      } else {
                        return (
                          <div className="text-center py-10 px-4">
                            <span className="text-3xl block mb-2">📅</span>
                            <p className="text-[11px] text-gray-400 font-mono italic leading-relaxed">
                              {selectedDay 
                                ? 'Tidak ada agenda dengan tanggal pasti yang dijadwalkan pada hari ini.'
                                : 'Tidak ada agenda dengan tanggal pasti di bulan ini.'}
                            </p>
                            {selectedDay && (
                              <button 
                                onClick={() => setSelectedDay(null)}
                                className="text-[10px] font-bold font-mono text-brand-green uppercase tracking-wider mt-3 hover:underline"
                              >
                                Lihat Semua Agenda Bulan Ini
                              </button>
                            )}
                          </div>
                        );
                      }
                    })()}

                  </div>

                  {/* Planned Month Undecided Date Activities: "apabila belum hanya ditampilkan dibawah bulan yg direncanakan" */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <span className="text-[10px] font-mono font-extrabold text-brand-orange uppercase tracking-widest block">
                        🎯 Rencana Kegiatan Bulanan
                      </span>
                      <h4 className="font-extrabold text-sm text-brand-brown-dark tracking-tight mt-1 leading-snug">
                        Tanggal Belum Diputusan / Tentative
                      </h4>
                    </div>

                    {getUndecidedActivitiesForMonth().length > 0 ? (
                      <div className="space-y-3">
                        {getUndecidedActivitiesForMonth().map((a) => (
                          <div 
                            key={a.id} 
                            className="p-4.5 bg-brand-orange/5 border border-brand-orange/15 rounded-2xl space-y-2 hover:bg-brand-orange/10 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="bg-brand-orange/20 text-brand-orange text-[8px] font-black font-mono px-2 py-0.5 rounded-md uppercase tracking-wider shadow-inner">
                                TENTATIVE / RENCANA
                              </span>
                              <span className="text-[8px] font-black font-mono text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded-md">
                                {a.tingkat}
                              </span>
                            </div>

                            <h5 className="font-extrabold text-xs text-slate-900 tracking-tight leading-snug uppercase">
                              {a.nama_kegiatan}
                            </h5>

                            <div className="space-y-1 text-[10px] text-gray-500 font-mono">
                              <p className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                                <span>📍 {a.tempat}</span>
                              </p>
                              <p className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-brand-green shrink-0" />
                                <span>📅 Rencana Bulan: <strong>{INDO_MONTHS[currentMonth]} {currentYear}</strong></span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 font-mono italic text-center py-4 bg-slate-50 border border-dashed rounded-2xl">
                        Tidak ada agenda rencana/tentative di bulan ini.
                      </p>
                    )}
                  </div>

                </div>

              </div>
            </div>
          ) : (
            /* Tab 2: List active and published agenda for registration */
            agendaList.filter(a => a.status_publikasi && a.is_aktif_pendaftaran).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {agendaList.filter(a => a.status_publikasi && a.is_aktif_pendaftaran).map((a) => (
                  <div 
                    key={a.id}
                    className="bg-white rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl hover:-translate-y-1.5 flex flex-col justify-between transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                          a.tingkat === 'kabupaten' ? 'bg-[#00A99D]/15 text-[#00A99D]' : 'bg-[#E53935]/15 text-[#E53935]'
                        }`}>
                          Tingkat {a.tingkat}
                        </span>
                        <span className="bg-brand-green/10 text-brand-green font-bold font-mono text-[9px] px-2.5 py-1 rounded-full">
                          PENDAFTARAN BUKA
                        </span>
                      </div>

                      <h3 className="font-extrabold text-lg text-brand-brown-dark tracking-tight leading-snug mb-4">
                        {a.nama_kegiatan}
                      </h3>

                      <div className="space-y-2.5 text-xs text-gray-500 font-mono mb-6">
                        <p className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-brand-orange shrink-0" />
                          <span>📍 {a.tempat}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-brand-green shrink-0" />
                          <span>📅 {new Date(a.tanggal_mulai).toLocaleDateString('id-ID')} s.d {new Date(a.tanggal_selesai).toLocaleDateString('id-ID')}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-brand-teal shrink-0" />
                          <span>Estimasi Peserta: <strong>{a.estimasi_peserta} Jiwa</strong></span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openRegistration(a)}
                      className="w-full bg-brand-orange hover:bg-brand-orange/90 text-brand-brown-dark font-extrabold text-xs py-3.5 rounded-xl shadow-md uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Daftar Sekarang
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center text-gray-500 italic shadow-md">
                Saat ini belum ada pendaftaran kegiatan aktif yang dibuka untuk umum.
              </div>
            )
          )}

        </div>
      </OverlappingSection>

      {/* 7. INFORMASI & UNDUH DOKUMEN SECTION - Overlapping Layout */}
      <OverlappingSection id="informasi" className="bg-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
            <div>
              <span className="text-xs font-mono font-bold text-brand-teal uppercase tracking-wider block mb-1">
                Pusat Unduhan Berkas
              </span>
              <h2 className="text-3xl font-black text-brand-brown-dark tracking-tight">
                Dokumen & Informasi Resmi
              </h2>
            </div>
            <Link 
              to="/informasi"
              className="text-xs font-extrabold font-mono text-brand-orange hover:underline uppercase flex items-center gap-1 shrink-0"
            >
              Lihat Semua Informasi
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {informasiList.slice(0, 4).map((info) => (
              <div 
                key={info.id}
                className="bg-gray-50/70 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group hover:bg-white hover:shadow-lg transition-all duration-300"
              >
                <div>
                  <span className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3 inline-block ${
                    info.tipe === 'gambar' ? 'bg-[#F9A825]/15 text-[#F9A825]' : 'bg-[#00A99D]/15 text-[#00A99D]'
                  }`}>
                    {info.tipe === 'gambar' ? 'Aset Gambar / Media' : 'Dokumen / Jukran'}
                  </span>
                  <h3 className="font-extrabold text-sm text-brand-brown-dark tracking-tight leading-snug">
                    {info.judul}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-sans line-clamp-2">
                    {info.deskripsi}
                  </p>
                </div>
                
                {info.tipe === 'gambar' && info.file_url !== '#' ? (
                  <a 
                    href={info.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-brand-teal hover:bg-brand-teal/90 text-white px-4 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-1.5 shrink-0 uppercase tracking-wider shadow"
                  >
                    <Eye className="w-4 h-4" /> Pratinjau
                  </a>
                ) : (
                  <a 
                    href={info.file_url}
                    className="bg-brand-brown-mid hover:bg-brand-brown-dark text-white px-4 py-2.5 rounded-xl font-bold font-mono text-xs flex items-center gap-1.5 shrink-0 uppercase tracking-wider shadow cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Unduh PDF
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </OverlappingSection>

      {/* REGISTRATION DYNAMIC FORM MODAL */}
      <AnimatePresence>
        {selectedAgenda && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-8 overflow-hidden"
            >
              {/* Elegant Accent Bar at Top */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-orange via-brand-brown-mid to-brand-green" />
              {/* Close Button */}
              <button 
                onClick={() => setSelectedAgenda(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                ✕
              </button>

              <div className="mb-6">
                <span className="text-[10px] font-mono text-brand-orange uppercase font-bold tracking-widest block mb-1">
                  Pendaftaran Online Kegiatan
                </span>
                <h3 className="font-extrabold text-lg text-brand-brown-dark tracking-tight leading-snug">
                  {selectedAgenda.nama_kegiatan}
                </h3>
              </div>

              {registerSuccess ? (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto text-3xl">
                    ✓
                  </div>
                  <h4 className="font-black text-xl text-brand-brown-dark">Pendaftaran Berhasil!</h4>
                  <p className="text-sm text-gray-500 max-w-sm mx-auto">
                    Data kontingen atau kepesertaan mandiri Anda telah sukses tersimpan di pangkalan database DKC Tasikmalaya.
                  </p>
                  <button
                    onClick={() => setSelectedAgenda(null)}
                    className="bg-brand-brown-dark text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-brand-brown-mid"
                  >
                    Tutup Jendela
                  </button>
                </div>
              ) : (
                <form onSubmit={submitRegistration} className="space-y-5">
                  {/* Tipe pendaftaran picker if configured as both */}
                  {agendaConfig?.tipe_pendaftaran === 'keduanya' && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                        Tipe Pendaftaran
                      </label>
                      <div className="grid grid-cols-2 gap-3 font-mono text-xs text-center">
                        <button
                          type="button"
                          onClick={() => setRegistrationType('mandiri')}
                          className={`p-2.5 rounded-xl border font-bold ${
                            registrationType === 'mandiri' 
                              ? 'bg-brand-orange text-brand-brown-dark border-brand-orange font-extrabold shadow'
                              : 'bg-gray-50 border-gray-200 text-gray-500'
                          }`}
                        >
                          Mandiri (Perorangan)
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegistrationType('kolektif')}
                          className={`p-2.5 rounded-xl border font-bold ${
                            registrationType === 'kolektif' 
                              ? 'bg-brand-orange text-brand-brown-dark border-brand-orange font-extrabold shadow'
                              : 'bg-gray-50 border-gray-200 text-gray-500'
                          }`}
                        >
                          Kolektif (Ranting/Gudep)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Schema fields */}
                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                    {agendaConfig?.form_schema ? (
                      agendaConfig.form_schema.map((f) => (
                        <div key={f.id}>
                          <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                            {f.label} {f.required && <span className="text-brand-red">*</span>}
                          </label>

                          {f.type === 'select' ? (
                            <select
                              required={f.required}
                              value={registrationFormData[f.id] || ''}
                              onChange={(e) => handleInputChange(f.id, e.target.value)}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 font-medium"
                            >
                              <option value="">-- Pilih salah satu --</option>
                              {f.options?.map((opt) => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : f.type === 'textarea' ? (
                            <textarea
                              required={f.required}
                              value={registrationFormData[f.id] || ''}
                              onChange={(e) => handleInputChange(f.id, e.target.value)}
                              placeholder={`Masukkan ${f.label.toLowerCase()}`}
                              rows={3}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800"
                            />
                          ) : (
                            <input
                              type={f.type === 'number' ? 'number' : 'text'}
                              required={f.required}
                              value={registrationFormData[f.id] || ''}
                              onChange={(e) => handleInputChange(f.id, e.target.value)}
                              placeholder={`Masukkan ${f.label.toLowerCase()}`}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800"
                            />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-xl p-3 flex gap-2 items-start text-xs text-brand-yellow">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>Formulir sedang dipersiapkan oleh administrator. Silakan hubungi sekretariat.</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={registerLoading || !agendaConfig}
                    className="w-full bg-gradient-to-r from-brand-orange to-brand-green text-white font-extrabold text-sm py-3.5 rounded-xl shadow-md uppercase tracking-wider hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {registerLoading ? 'Mengirim Data...' : 'Kirim Pendaftaran Resmi'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}

        {/* SHARE & AUTOMATIC NEWS PAMPHLET MODAL */}
        {shareNews && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-12 gap-6 bg-white/5 p-4 md:p-6 rounded-[32px] border border-white/10 my-8 shadow-2xl overflow-hidden"
            >
              {/* Left Pane: Interactive Live Pamphlet Preview (Pure White Base, Super Professional) */}
              <div className="col-span-1 md:col-span-7 flex flex-col items-center">
                <span className="text-[10px] font-mono font-extrabold text-white/60 uppercase tracking-widest mb-2.5 block text-center">
                  👁️ Pratinjau Pamflet Gambar
                </span>

                {/* THE ACTUAL DOWNLOAD TARGET - Pure White, Highly Polished */}
                <div 
                  id="pamflet-render-target"
                  className="w-full max-w-[370px] bg-white p-5 rounded-[24px] border border-slate-100 shadow-2xl flex flex-col justify-between relative select-none"
                  style={{ minHeight: '520px' }}
                >
                  {/* Decorative Scout Fleur-de-lis Watermark Icon or Top Accent Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-orange via-brand-green to-brand-brown-mid" />

                  {/* 1. Header Row */}
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
                      {shareNews.saka_id ? (
                        <span className="bg-brand-orange text-white text-[7px] font-black font-mono px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                          SAKA {shareNews.saka_nama}
                        </span>
                      ) : shareNews.kecamatan_id ? (
                        <span className="bg-[#2E5C9A] text-white text-[7px] font-black font-mono px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                          DKR {shareNews.kecamatan_nama}
                        </span>
                      ) : (
                        <span className="bg-gradient-to-r from-brand-orange to-brand-red text-white text-[7px] font-black font-mono px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">
                          KABAR DKC UTAMA
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Featured Image Container */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-100 rounded-xl border border-slate-150/60 shadow-inner">
                    <img 
                      src={shareNews.gambar_url} 
                      alt={shareNews.judul}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                  </div>

                  {/* 3. News Title */}
                  <div className="mt-3">
                    <h3 className="font-extrabold text-sm text-slate-950 tracking-tight leading-snug uppercase">
                      {shareNews.judul}
                    </h3>
                  </div>

                  {/* 4. Short Excerpt with clean quotes-styled background */}
                  <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[10px] text-gray-500 leading-relaxed font-sans line-clamp-3 font-medium">
                      "{stripHtml(shareNews.konten)}"
                    </p>
                  </div>

                  {/* 5. Separator dot or brand accent lines */}
                  <div className="flex items-center justify-center gap-1 my-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                    <span className="w-8 h-[2px] bg-brand-green/20" />
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
                  </div>

                  {/* 6. Footer segment with Metadata & QR code */}
                  <div className="grid grid-cols-12 gap-3 items-center border-t border-slate-100 pt-3">
                    {/* Left: Metadata details */}
                    <div className="col-span-8 space-y-1 text-left">
                      <div className="text-[8px] text-gray-400 font-mono font-bold leading-tight">
                        DITERBITKAN: <span className="text-gray-600 font-extrabold">{new Date(shareNews.published_at).toLocaleDateString('id-ID')}</span>
                      </div>
                      <div className="text-[8px] text-gray-400 font-mono font-bold leading-tight">
                        KONTRIBUTOR: <span className="text-brand-brown-dark font-extrabold">{shareNews.author_name}</span>
                      </div>
                      <p className="text-[8px] text-brand-green font-extrabold font-mono uppercase tracking-wider mt-1 leading-tight">
                        Satyaku Kudarmakan, Darmaku Kubaktikan
                      </p>
                    </div>

                    {/* Right: Beautiful QR Code frame */}
                    <div className="col-span-4 flex flex-col items-center">
                      <div className="bg-white p-1 rounded-lg border border-slate-200/80 shadow-sm">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/berita/' + shareNews.slug)}`}
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

              {/* Right Pane: Premium Controls and Action Panel */}
              <div className="col-span-1 md:col-span-5 flex flex-col justify-between bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-extrabold text-base text-brand-brown-dark tracking-tight font-mono">
                      Bagikan Berita
                    </h3>
                    <button 
                      onClick={() => setShareNews(null)}
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
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Ayo baca berita terbaru dari Gerakan Pramuka Tasikmalaya: ' + shareNews.judul + ' ' + window.location.origin + '/berita/' + shareNews.slug)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white p-2.5 rounded-xl text-center transition-colors cursor-pointer"
                        >
                          WhatsApp
                        </a>
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/berita/' + shareNews.slug)}`}
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
                    onClick={() => setShareNews(null)}
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

    </div>
  );
}
