import { Check } from 'lucide-react';
import { SuratDkr, SuratStatus } from '../types';
import { SURAT_STATUS, formatTanggal } from '../utils/suratDkr';

export function StatusBadge({ status, size = 'md' }: { status: SuratStatus; size?: 'sm' | 'md' }) {
  const meta = SURAT_STATUS[status] || SURAT_STATUS.terkirim;
  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-extrabold font-mono uppercase tracking-wider rounded-full whitespace-nowrap ${meta.badge} ${
        size === 'sm' ? 'text-[9px] px-2 py-0.5' : 'text-[10px] px-2.5 py-1'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

// Jejak status: Terkirim → Dibaca → Ditanggapi
export function StatusTrack({ surat }: { surat: SuratDkr }) {
  const steps = [
    { label: 'Terkirim', at: surat.created_at, done: true },
    { label: 'Dibaca DKC', at: surat.dibaca_at, done: !!surat.dibaca_at || surat.status !== 'terkirim' },
    { label: 'Ditanggapi', at: surat.ditanggapi_at, done: !!surat.ditanggapi_at },
  ];
  return (
    <ol className="flex items-start">
      {steps.map((st, i) => (
        <li key={st.label} className="flex-1 flex flex-col items-center text-center relative">
          {i > 0 && (
            <span className={`absolute top-3 right-1/2 w-full h-0.5 ${st.done ? 'bg-brand-green' : 'bg-gray-200'}`} />
          )}
          <span
            className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
              st.done ? 'bg-brand-green border-brand-green text-white' : 'bg-white border-gray-300 text-gray-300'
            }`}
          >
            <Check className="w-3 h-3" />
          </span>
          <span className="text-[10px] font-bold text-gray-600 mt-1.5 leading-tight">{st.label}</span>
          <span className="text-[9px] font-mono text-gray-400 leading-tight">
            {st.at && st.done ? formatTanggal(st.at, true) : '-'}
          </span>
        </li>
      ))}
    </ol>
  );
}
