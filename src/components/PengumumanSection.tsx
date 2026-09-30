import React from 'react';
import { motion } from 'motion/react';
import { Megaphone, ArrowRight, ExternalLink, CalendarClock } from 'lucide-react';
import type { PengumumanItem } from '../types';
import { formatTanggal, isExternalHref, safeHref } from '../utils/pengumuman';

function Card({ item, featured }: { item: PengumumanItem; featured: boolean } & React.Attributes) {
  const href = safeHref(item.tombol_link);
  const external = isExternalHref(href);
  const tgl = formatTanggal(item.dibuat);
  const sampai = formatTanggal(item.berlaku_sampai);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 flex flex-col ${
        featured ? 'md:grid md:grid-cols-2' : ''
      }`}
    >
      {item.gambar_url ? (
        <img
          src={item.gambar_url}
          alt={item.judul}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`w-full object-cover ${featured ? 'h-56 md:h-full md:min-h-[300px]' : 'aspect-video'}`}
        />
      ) : (
        <div
          className={`w-full bg-gradient-to-br from-brand-orange via-brand-green to-brand-teal flex items-center justify-center ${
            featured ? 'h-40 md:h-full md:min-h-[300px]' : 'h-32'
          }`}
        >
          <Megaphone className="w-12 h-12 text-white/90" />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider">
          <span className="text-brand-orange bg-brand-orange/10 rounded-full px-3 py-1">Pengumuman</span>
          {tgl && <span className="text-gray-400">{tgl}</span>}
        </div>
        <h3 className={`font-black text-brand-brown-dark leading-tight ${featured ? 'text-2xl' : 'text-lg'}`}>
          {item.judul}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line flex-1">{item.isi}</p>
        {sampai && (
          <p className="text-[11px] font-mono text-gray-400 flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" /> Berlaku sampai {sampai}
          </p>
        )}
        {href && (
          <a
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            className="mt-1 self-start bg-brand-brown-dark hover:bg-brand-orange text-white font-extrabold text-xs py-3 px-5 rounded-2xl inline-flex items-center gap-2 transition-colors"
          >
            {item.tombol_teks?.trim() || 'Selengkapnya'}
            {external ? <ExternalLink className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </a>
        )}
      </div>
    </motion.article>
  );
}

/** Isi section "Pengumuman" di landing page. Komponen pemanggil hanya merender kalau ada item aktif. */
export default function PengumumanSection({ items }: { items: PengumumanItem[] }) {
  if (items.length === 0) return null;
  const single = items.length === 1;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
        <span className="text-xs font-mono font-bold tracking-widest text-brand-orange uppercase block">
          Informasi Terkini
        </span>
        <h2 className="text-3xl sm:text-4xl font-black text-brand-brown-dark tracking-tight leading-tight">
          Pengumuman DKC
        </h2>
        <div className="w-16 h-2 bg-gradient-to-r from-brand-orange to-brand-green rounded-full mx-auto" />
      </div>

      <div className={single ? 'max-w-4xl mx-auto' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
        {items.map(it => (
          <Card key={it.id} item={it} featured={single} />
        ))}
      </div>
    </div>
  );
}
