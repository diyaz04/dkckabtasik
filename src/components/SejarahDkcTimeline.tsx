import React, { useRef, useState } from 'react';
import { motion, useScroll, useSpring } from 'motion/react';
import type { SejarahDkcItem } from '../types';

/**
 * Timeline "flow chart" sejarah DKC dari masa ke masa.
 * - Desktop: garis tengah, kartu kiri-kanan bergantian.
 * - Mobile: garis di kiri, kartu di kanan.
 * - Garis progres terisi mengikuti scroll, kartu muncul animasi saat masuk layar.
 */

const initials = (nama: string) =>
  nama
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase())
    .join('') || '?';

function PhotoNode({ item, index }: { item: SejarahDkcItem; index: number }) {
  const [broken, setBroken] = useState(false);
  const showImg = item.foto_url && !broken;
  return (
    <div className="relative">
      {/* ring gradient + glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-orange to-brand-teal blur-md opacity-40" />
      <div className="relative w-16 h-16 md:w-28 md:h-28 rounded-full p-[3px] md:p-1 bg-gradient-to-br from-brand-orange via-brand-green to-brand-teal shadow-lg">
        <div className="w-full h-full rounded-full overflow-hidden border-2 md:border-4 border-white bg-brand-brown-dark flex items-center justify-center">
          {showImg ? (
            <img
              src={item.foto_url}
              alt={item.nama}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={() => setBroken(true)}
            />
          ) : (
            <span className="text-white font-black text-lg md:text-3xl tracking-tight">{initials(item.nama)}</span>
          )}
        </div>
      </div>
      {/* nomor urut */}
      <span className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 rounded-full bg-brand-brown-dark text-white text-[10px] md:text-xs font-mono font-bold flex items-center justify-center border-2 border-white shadow">
        {index + 1}
      </span>
    </div>
  );
}

export default function SejarahDkcTimeline({ items }: { items: SejarahDkcItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start 65%', 'end 65%'],
  });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });

  if (!items || items.length === 0) return null;

  return (
    <div id="sejarah" className="max-w-6xl mx-auto mt-24 scroll-mt-24">
      {/* Heading */}
      <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
        <span className="text-xs font-mono font-bold tracking-widest text-brand-green uppercase block">
          Sejarah DKC
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-brand-brown-dark tracking-tight leading-tight">
          DKC Tasikmalaya dari Masa ke Masa
        </h2>
        <div className="w-16 h-2 bg-gradient-to-r from-brand-orange to-brand-green rounded-full mx-auto" />
        <p className="text-sm text-gray-500 leading-relaxed">
          Jejak para ketua yang menakhodai Dewan Kerja Cabang Kabupaten Tasikmalaya dari masa ke masa.
        </p>
      </div>

      {/* Flow */}
      <div ref={trackRef} className="relative">
        {/* Garis track (abu) + progres (gradient) */}
        <div className="absolute top-0 bottom-0 left-8 md:left-1/2 -translate-x-1/2 w-1 rounded-full bg-gray-200" />
        <motion.div
          style={{ scaleY: fill, transformOrigin: 'top' }}
          className="absolute top-0 bottom-0 left-8 md:left-1/2 -translate-x-1/2 w-1 rounded-full bg-gradient-to-b from-brand-orange via-brand-green to-brand-teal"
        />

        <div className="relative space-y-10 md:space-y-16">
          {items.map((item, index) => {
            const cardLeft = index % 2 === 0; // desktop: genap di kiri, ganjil di kanan
            return (
              <div
                key={item.id}
                className="grid grid-cols-[64px_1fr] md:grid-cols-[1fr_112px_1fr] gap-x-5 md:gap-x-0 items-center"
              >
                {/* Node foto (di garis) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ type: 'spring', stiffness: 180, damping: 16 }}
                  className="flex justify-center md:col-start-2 md:row-start-1 z-10"
                >
                  <PhotoNode item={item} index={index} />
                </motion.div>

                {/* Kartu */}
                <motion.div
                  initial={{ opacity: 0, x: cardLeft ? -48 : 48, y: 16 }}
                  whileInView={{ opacity: 1, x: 0, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`relative md:row-start-1 ${
                    cardLeft ? 'md:col-start-1 md:mr-8 md:text-right' : 'md:col-start-3 md:ml-8'
                  }`}
                >
                  {/* konektor ke node (desktop) */}
                  <span
                    className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-0.5 w-8 bg-gradient-to-r ${
                      cardLeft
                        ? '-right-8 from-brand-orange/70 to-brand-orange'
                        : '-left-8 from-brand-orange to-brand-orange/70'
                    }`}
                  />
                  <div className="bg-white rounded-3xl p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
                    <span className="inline-block text-[11px] font-mono font-bold tracking-wider text-brand-green bg-brand-green/10 rounded-full px-3 py-1 mb-3">
                      {item.masa_bakti}
                    </span>
                    <h3 className="font-extrabold text-lg text-brand-brown-dark leading-tight">{item.nama}</h3>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-brand-orange mt-1">
                      Ketua DKC
                    </p>
                    {item.deskripsi && (
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line mt-3 text-left">
                        {item.deskripsi}
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Penutup alur */}
        <div className="relative flex md:justify-center pl-[26px] md:pl-0 mt-10">
          <span className="relative z-10 w-4 h-4 rounded-full bg-brand-teal ring-4 ring-brand-teal/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
