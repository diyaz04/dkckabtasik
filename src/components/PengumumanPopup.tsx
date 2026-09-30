import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Megaphone, X, ArrowRight, ExternalLink } from 'lucide-react';
import type { PengumumanItem } from '../types';
import { fingerprint, getActivePengumuman, isExternalHref, normalizeLink } from '../utils/pengumuman';

/** Tampilan modal popup promosi (presentational, dipakai juga untuk pratinjau di dashboard admin). */
export function PengumumanModal({
  item,
  onClose,
  position,
  preview = false,
}: {
  item: PengumumanItem;
  onClose: () => void;
  position?: { index: number; total: number };
  preview?: boolean;
} & React.Attributes) {
  const href = normalizeLink(item.tombol_link) || '';
  const external = isExternalHref(href);
  const btnText = item.tombol_teks?.trim() || 'Selengkapnya';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Pengumuman: ${item.judul}`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup pengumuman"
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {item.gambar_url ? (
          <img
            src={item.gambar_url}
            alt={item.judul}
            className="w-full aspect-video object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-brand-orange via-brand-green to-brand-teal flex items-center justify-center">
            <Megaphone className="w-14 h-14 text-white/90" />
          </div>
        )}

        <div className="p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-brand-orange">
              Pengumuman DKC
            </span>
            {position && position.total > 1 && (
              <span className="text-[10px] font-mono text-gray-400">
                {position.index + 1} dari {position.total}
              </span>
            )}
          </div>
          <h3 className="text-xl font-black text-brand-brown-dark leading-tight">{item.judul}</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{item.isi}</p>

          <div className="pt-2 space-y-2">
            {href && (
              <a
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                onClick={preview ? e => e.preventDefault() : onClose}
                className="w-full bg-gradient-to-r from-brand-orange to-brand-green hover:opacity-90 text-white font-extrabold text-sm py-3 px-5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-opacity"
              >
                {btnText}
                {external ? <ExternalLink className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full text-xs font-mono font-bold text-gray-400 hover:text-gray-600 py-2 transition-colors"
            >
              {position && position.index < position.total - 1 ? 'Lanjut' : 'Tutup'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const safeSession = {
  get: (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } },
  set: (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* storage diblokir, abaikan */ } },
};

/**
 * Host popup di landing page: menampilkan pengumuman (aktif + popup + belum kedaluwarsa)
 * satu per satu. Yang sudah ditutup tidak muncul lagi selama sesi browser yang sama,
 * kecuali admin mengubah isinya.
 */
export default function PengumumanPopupHost({ items }: { items: PengumumanItem[] }) {
  const [state, setState] = useState<{ queue: PengumumanItem[]; total: number }>({ queue: [], total: 0 });
  const started = useRef(false);

  useEffect(() => {
    if (started.current || items.length === 0) return;
    const candidates = getActivePengumuman(items)
      .filter(it => it.popup)
      .filter(it => !safeSession.get(fingerprint(it)));
    started.current = true; // hitung sekali saja per kunjungan
    if (candidates.length === 0) return;
    const t = setTimeout(() => setState({ queue: candidates, total: candidates.length }), 900);
    return () => clearTimeout(t);
  }, [items]);

  const { queue, total } = state;
  const current = queue[0];
  const handleClose = () => {
    if (!current) return;
    safeSession.set(fingerprint(current), '1');
    setState(st => ({ ...st, queue: st.queue.slice(1) }));
  };

  return (
    <AnimatePresence>
      {current && (
        <PengumumanModal
          key={current.id}
          item={current}
          onClose={handleClose}
          position={{ index: total - queue.length, total }}
        />
      )}
    </AnimatePresence>
  );
}
