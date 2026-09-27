import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Users, Building2, CheckCircle2, AlertCircle, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Kecamatan, DataPotensial } from '../types';

interface InteractiveMapProps {
  kecamatanList: Kecamatan[];
  dataPotensialList: DataPotensial[];
  title?: string;
  subtitle?: string;
}

export default function InteractiveMap({ kecamatanList, dataPotensialList, title, subtitle }: InteractiveMapProps) {
  const [hoveredKeca, setHoveredKeca] = useState<Kecamatan | null>(null);
  const [dkrProfiles, setDkrProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/dkr_profile')
      .then(r => r.json())
      .then(data => {
         if (Array.isArray(data)) setDkrProfiles(data);
      })
      .catch(() => {});
  }, []);
  const navigate = useNavigate();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  // Helper to get stats for a kecamatan
  const getKecamatanStats = (kecaId: string) => {
    const stats = dataPotensialList.find(dp => dp.kecamatan_id === kecaId);
    if (!stats) return { totalT: 0, totalD: 0, grandTotal: 0 };
    const totalT = stats.jumlah_penegak_l + stats.jumlah_penegak_p;
    const totalD = stats.jumlah_pandega_l + stats.jumlah_pandega_p;
    return {
      totalT,
      totalD,
      grandTotal: totalT + totalD
    };
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Centered at Kabupaten Tasikmalaya, Jawa Barat, Indonesia
    const map = L.map(mapContainerRef.current, {
      center: [-7.40, 108.15],
      zoom: 10,
      minZoom: 9,
      maxZoom: 14,
      zoomControl: false,
      scrollWheelZoom: false, // Prevent page scrolling issues
    });

    mapRef.current = map;

    // Custom Zoom Control at Top-Right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Cleanup map instance on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers and Fit Bounds when kecamatanList or dataPotensialList changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !kecamatanList || kecamatanList.length === 0) return;

    // Clear existing markers
    Object.keys(markersRef.current).forEach((key) => {
      const marker = markersRef.current[key];
      if (marker) {
        marker.remove();
      }
    });
    markersRef.current = {};

    const points: L.LatLngTuple[] = [];

    kecamatanList.forEach((keca) => {
      // Prevent Leaflet crash if coordinates are not yet set in the database
      if (keca.latitude == null || keca.longitude == null) return;

      const { grandTotal } = getKecamatanStats(keca.id);

      // Scale marker size depending on total members
      const pinSize = Math.max(34, Math.min(50, 34 + (grandTotal / 25)));

      // Color scheme matching our scout brand
      const bgClass = keca.is_dkr_aktif ? 'bg-brand-green' : 'bg-brand-orange';
      const shadowClass = keca.is_dkr_aktif ? 'shadow-brand-green/30' : 'shadow-brand-orange/30';
      const borderClass = keca.is_dkr_aktif ? 'border-green-100' : 'border-orange-100';
      const pingColor = keca.is_dkr_aktif ? 'bg-brand-green/30' : 'bg-brand-orange/30';

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="relative flex items-center justify-center cursor-pointer" style="width: ${pinSize}px; height: ${pinSize}px;">
            <!-- Outer Pulsing Glow -->
            <div class="absolute inset-0 rounded-full animate-ping ${pingColor} opacity-75" style="animation-duration: 2.5s;"></div>
            
            <!-- Main Circular Pin -->
            <div class="w-full h-full rounded-full ${bgClass} border-2 ${borderClass} ${shadowClass} shadow-lg flex items-center justify-center transition-transform hover:scale-115 hover:rotate-12 duration-200">
              <span class="text-[9px] font-bold text-white uppercase tracking-tight font-sans">
                ${keca.nama_kecamatan.substring(0, 3)}
              </span>
            </div>
            
            <!-- Micro Name Tag directly below -->
            <div class="absolute top-full mt-1 bg-brand-brown-dark/95 text-[9px] font-bold font-mono tracking-wide px-2 py-0.5 rounded-md border border-white/10 text-white shadow-md pointer-events-none whitespace-nowrap">
              ${keca.nama_kecamatan}
            </div>
          </div>
        `,
        iconSize: [pinSize, pinSize],
        iconAnchor: [pinSize / 2, pinSize / 2]
      });

      const marker = L.marker([keca.latitude, keca.longitude], { icon: customIcon });

      // Interactive Events
      marker.on('mouseover', () => {
        setHoveredKeca(keca);
      });

      marker.on('mouseout', () => {
        setHoveredKeca(null);
      });

      marker.on('click', () => {
        navigate(`/dkr/${keca.slug}`);
      });

      marker.addTo(map);
      markersRef.current[keca.id] = marker;
      points.push([keca.latitude, keca.longitude]);
    });

    // Auto fit bounds to completely contain and focus on Kabupaten Tasikmalaya coordinates
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [kecamatanList, dataPotensialList]);

  // Handle Sidebar District Click
  const handleKecamatanClick = (keca: Kecamatan) => {
    if (mapRef.current) {
      mapRef.current.flyTo([keca.latitude, keca.longitude], 12, {
        animate: true,
        duration: 1.2
      });
    }
  };

  // Reset Map View to fit all of Kabupaten Tasikmalaya
  const handleResetView = () => {
    if (mapRef.current && kecamatanList.length > 0) {
      const points = kecamatanList.map(k => [k.latitude, k.longitude] as L.LatLngTuple);
      const bounds = L.latLngBounds(points);
      mapRef.current.fitBounds(bounds, { padding: [45, 45] });
    }
  };

  return (
    <div className="bg-[#2e1d15] border border-brand-orange/20 rounded-3xl p-6 sm:p-8 shadow-xl text-white relative">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-extrabold text-xl text-white tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-orange animate-spin-slow" />
            {title || "Peta Sebaran Geografis DKR Kabupaten Tasikmalaya"}
          </h3>
          <p className="text-xs text-gray-300 font-mono mt-1">
            {subtitle || "Fokus peta asli Kabupaten Tasikmalaya, Jawa Barat. Klik pin kecamatan untuk info selengkapnya."}
          </p>
        </div>
        <button
          onClick={handleResetView}
          className="self-start sm:self-center bg-brand-orange/20 hover:bg-brand-orange/30 border border-brand-orange/40 text-brand-orange font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          Fokus Kabupaten
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-stretch">
        
        {/* Real Leaflet Map */}
        <div className="lg:col-span-3 bg-[#e5dcd3] border border-brand-orange/10 rounded-2xl h-[380px] sm:h-[480px] relative overflow-hidden shadow-inner">
          
          {/* Leaflet container mount */}
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

          {/* Map Overlay Legenda */}
          <div className="absolute bottom-4 left-4 bg-brand-brown-dark/90 backdrop-blur border border-brand-orange/20 rounded-2xl p-4 text-[10px] space-y-2 z-[400] font-mono shadow-xl w-48 pointer-events-auto">
            <div className="font-bold text-white mb-1.5 uppercase tracking-wider text-xs border-b border-white/10 pb-1">
              Legenda Wilayah
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-brand-green rounded-full border border-white inline-block shadow"></span>
              <span className="text-gray-200">DKR Aktif / Berjalan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-brand-orange rounded-full border border-white inline-block shadow"></span>
              <span className="text-gray-200">DKR Menuju Re-Aktivasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 inline-block rounded-full bg-brand-orange animate-ping"></span>
              <span className="text-gray-300 text-[9px]">Sinyal Potensi (T/D)</span>
            </div>
            <div className="pt-1.5 text-[9px] text-gray-400 italic leading-snug">
              Peta asli bersumber dari satelit & kontributor OpenStreetMap.
            </div>
          </div>

          {/* Hover interactive card info overlay */}
          <AnimatePresence>
            {hoveredKeca && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-4 right-4 bg-brand-brown-dark/95 border-2 border-brand-orange/30 rounded-2xl p-4 shadow-2xl z-[400] w-64 backdrop-blur pointer-events-none"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-white text-sm">
                    {hoveredKeca.nama_kecamatan}
                  </h4>
                  {hoveredKeca.is_dkr_aktif ? (
                    <span className="bg-brand-green/20 text-brand-green border border-brand-green/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-2.5 h-2.5" /> AKTIF
                    </span>
                  ) : (
                    <span className="bg-brand-orange/20 text-brand-orange border border-brand-orange/30 text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                      <AlertCircle className="w-2.5 h-2.5" /> RE-AKTIVASI
                    </span>
                  )}
                </div>

                <div className="space-y-2 border-t border-white/10 pt-2 text-xs">
                  <div className="flex justify-between items-center text-gray-300">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-brand-orange" /> Penegak:
                    </span>
                    <span className="font-bold text-white font-mono">
                      {dataPotensialList.find(dp => dp.kecamatan_id === hoveredKeca.id) 
                        ? (dataPotensialList.find(dp => dp.kecamatan_id === hoveredKeca.id)!.jumlah_penegak_l + dataPotensialList.find(dp => dp.kecamatan_id === hoveredKeca.id)!.jumlah_penegak_p)
                        : 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-gray-300">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-brand-green" /> Pandega:
                    </span>
                    <span className="font-bold text-white font-mono">
                      {dataPotensialList.find(dp => dp.kecamatan_id === hoveredKeca.id) 
                        ? (dataPotensialList.find(dp => dp.kecamatan_id === hoveredKeca.id)!.jumlah_pandega_l + dataPotensialList.find(dp => dp.kecamatan_id === hoveredKeca.id)!.jumlah_pandega_p)
                        : 0}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-white/10 text-xs text-brand-orange font-bold">
                    <span>Total Potensi:</span>
                    <span className="font-mono text-white text-sm bg-black/40 px-2 py-0.5 rounded border border-white/5">
                      {getKecamatanStats(hoveredKeca.id).grandTotal}
                    </span>
                  </div>
                </div>

                {(() => {
                  const prof = dkrProfiles.find((p:any) => p.kecamatan_id === hoveredKeca.id);
                  if (prof && (prof.medsos_ig || prof.medsos_yt || prof.medsos_tk)) {
                    return (
                      <div className="flex gap-2 justify-center mt-3 pt-2 border-t border-white/10">
                        {prof.medsos_ig && (
                          <a href={prof.medsos_ig} target="_blank" rel="noopener noreferrer" className="bg-pink-600/20 text-pink-400 hover:bg-pink-600 hover:text-white p-1.5 rounded-lg transition-colors" title="Instagram DKR">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          </a>
                        )}
                        {prof.medsos_yt && (
                          <a href={prof.medsos_yt} target="_blank" rel="noopener noreferrer" className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white p-1.5 rounded-lg transition-colors" title="YouTube DKR">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          </a>
                        )}
                        {prof.medsos_tk && (
                          <a href={prof.medsos_tk} target="_blank" rel="noopener noreferrer" className="bg-gray-600/20 text-gray-400 hover:bg-gray-800 hover:text-white p-1.5 rounded-lg transition-colors" title="TikTok DKR">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.62 4.14 1.13 1.14 2.66 1.77 4.23 1.8v3.96c-1.63-.02-3.21-.57-4.52-1.57-.46-.35-.86-.76-1.19-1.22-.05 2.12-.01 4.24-.03 6.36-.09 2.53-1.02 4.99-2.78 6.78-2.22 2.13-5.56 2.82-8.48 1.76-2.58-.93-4.66-3.15-5.38-5.78C-.7 12.83 1.16 9.07 4.35 7.63c1.78-.79 3.86-.77 5.62.11V11.8c-.89-.48-1.92-.62-2.92-.38-1.54.34-2.73 1.69-2.9 3.26-.22 1.62.63 3.23 2.1 3.84 1.48.61 3.29.13 4.19-1.18.51-.71.74-1.59.73-2.46-.01-4.96-.01-9.92-.01-14.88z" /></svg>
                          </a>
                        )}
                      </div>
                    )
                  }
                  return null;
                })()}

                <p className="text-[10px] text-gray-400 mt-2 italic font-mono text-center">
                  Klik untuk melihat detail profil...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info / Interactive Kecamatan Selection */}
        <div className="flex flex-col justify-between">
          <div className="space-y-3 max-h-[350px] sm:max-h-[380px] overflow-y-auto pr-1">
            <h4 className="font-bold text-xs uppercase tracking-wider text-brand-orange font-mono">
              Wilayah Kecamatan ({kecamatanList.length})
            </h4>
            <div className="space-y-2">
              {kecamatanList.map((keca) => {
                const { grandTotal } = getKecamatanStats(keca.id);
                return (
                  <div
                    key={keca.id}
                    onClick={() => handleKecamatanClick(keca)}
                    className="w-full text-left bg-black/30 hover:bg-brand-orange/15 border border-white/5 hover:border-brand-orange/30 rounded-xl p-3 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${keca.is_dkr_aktif ? 'bg-brand-green' : 'bg-brand-orange'}`}></span>
                      <span className="font-semibold text-xs text-white group-hover:text-brand-orange transition-colors">
                        {keca.nama_kecamatan}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-gray-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/5 mr-1">
                        {grandTotal} T/D
                      </span>
                      {(() => {
                        const prof = dkrProfiles.find((p:any) => p.kecamatan_id === keca.id);
                        if (prof && (prof.medsos_ig || prof.medsos_yt || prof.medsos_tk)) {
                          return (
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              {prof.medsos_ig && (
                                <a href={prof.medsos_ig} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300" title="Instagram DKR">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                                </a>
                              )}
                              {prof.medsos_yt && (
                                <a href={prof.medsos_yt} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400" title="YouTube DKR">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                </a>
                              )}
                              {prof.medsos_tk && (
                                <a href={prof.medsos_tk} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-white" title="TikTok DKR">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.01 1.62 4.14 1.13 1.14 2.66 1.77 4.23 1.8v3.96c-1.63-.02-3.21-.57-4.52-1.57-.46-.35-.86-.76-1.19-1.22-.05 2.12-.01 4.24-.03 6.36-.09 2.53-1.02 4.99-2.78 6.78-2.22 2.13-5.56 2.82-8.48 1.76-2.58-.93-4.66-3.15-5.38-5.78C-.7 12.83 1.16 9.07 4.35 7.63c1.78-.79 3.86-.77 5.62.11V11.8c-.89-.48-1.92-.62-2.92-.38-1.54.34-2.73 1.69-2.9 3.26-.22 1.62.63 3.23 2.1 3.84 1.48.61 3.29.13 4.19-1.18.51-.71.74-1.59.73-2.46-.01-4.96-.01-9.92-.01-14.88z" /></svg>
                                </a>
                              )}
                            </div>
                          )
                        }
                        return null;
                      })()}
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/dkr/${keca.slug}`); }} className="text-[10px] text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-brand-orange/20 px-1.5 py-0.5 rounded cursor-pointer hover:bg-brand-orange/40">
                        Profil
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-[#1e120c] border border-brand-orange/10 rounded-2xl p-4 mt-4 text-xs space-y-2.5">
            <div className="flex items-center gap-2 text-brand-orange">
              <Building2 className="w-4 h-4" />
              <span className="font-extrabold uppercase text-[10px] tracking-wider">Metrik Sebaran</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-400 block text-[9px]">DKR AKTIF</span>
                <span className="text-xl font-black text-brand-green">
                  {kecamatanList.filter(k => k.is_dkr_aktif).length}
                </span>
              </div>
              <div className="bg-black/30 p-2.5 rounded-xl border border-white/5">
                <span className="text-gray-400 block text-[9px]">TOTAL T/D</span>
                <span className="text-xl font-black text-brand-orange">
                  {dataPotensialList.reduce((acc, curr) => acc + curr.jumlah_penegak_l + curr.jumlah_penegak_p + curr.jumlah_pandega_l + curr.jumlah_pandega_p, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
