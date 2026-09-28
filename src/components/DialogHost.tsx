import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';
import { subscribeDialog, closeDialog, DialogItem, DialogType } from '../utils/dialog';

const STYLE: Record<DialogType, { icon: React.ReactNode; ring: string; btn: string }> = {
  success: {
    icon: <CheckCircle2 className="w-9 h-9 text-emerald-500" />,
    ring: 'bg-emerald-50 border-emerald-100',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
  },
  error: {
    icon: <XCircle className="w-9 h-9 text-red-500" />,
    ring: 'bg-red-50 border-red-100',
    btn: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: <AlertTriangle className="w-9 h-9 text-amber-500" />,
    ring: 'bg-amber-50 border-amber-100',
    btn: 'bg-amber-500 hover:bg-amber-600',
  },
  info: {
    icon: <Info className="w-9 h-9 text-sky-500" />,
    ring: 'bg-sky-50 border-sky-100',
    btn: 'bg-sky-600 hover:bg-sky-700',
  },
};

export default function DialogHost() {
  const [queue, setQueue] = useState<DialogItem[]>([]);

  useEffect(() => subscribeDialog(setQueue), []);

  const current = queue[0];

  // Popup sukses menutup sendiri setelah 3 detik
  useEffect(() => {
    if (!current || current.kind !== 'alert' || current.type !== 'success') return;
    const t = setTimeout(() => closeDialog(current.id), 3000);
    return () => clearTimeout(t);
  }, [current?.id]);

  // Esc = tutup / batal, Enter = OK
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog(current.id, false);
      if (e.key === 'Enter') closeDialog(current.id, true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current?.id]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={() => closeDialog(current.id, false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`mx-auto w-16 h-16 rounded-full border flex items-center justify-center mb-4 ${STYLE[current.type].ring}`}
            >
              {current.kind === 'confirm' && current.danger ? (
                <Trash2 className="w-8 h-8 text-red-500" />
              ) : (
                STYLE[current.type].icon
              )}
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">{current.title}</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line break-words">
              {current.message}
            </p>

            {current.kind === 'confirm' ? (
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => closeDialog(current.id, false)}
                  className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors cursor-pointer"
                >
                  {current.cancelText}
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => closeDialog(current.id, true)}
                  className={`py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-colors cursor-pointer ${
                    current.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {current.confirmText}
                </button>
              </div>
            ) : (
              <button
                type="button"
                autoFocus
                onClick={() => closeDialog(current.id)}
                className={`w-full mt-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-colors cursor-pointer ${STYLE[current.type].btn}`}
              >
                OK
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
