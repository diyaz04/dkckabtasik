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

    // Add high-performance beautiful map tiles (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
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

                <p className="text-[10px] text-gray-400 mt-3 italic font-mono text-center">
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
                  <button
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
                      <span className="text-[9px] font-mono text-gray-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                        {grandTotal} T/D
                      </span>
                      <span className="text-[10px] text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity">
                        🎯
                      </span>
                    </div>
                  </button>
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
