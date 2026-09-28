import type { ReactNode } from 'react';

interface VisibilityToggleCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  saving?: boolean;
  onChange: (next: boolean) => void;
  /** Teks status di samping switch */
  onLabel?: string;
  offLabel?: string;
  /** Daftar bagian yang ikut berubah saat switch di-toggle */
  effects?: string[];
}

export default function VisibilityToggleCard({
  icon,
  title,
  description,
  checked,
  saving = false,
  onChange,
  onLabel = 'Aktif',
  offLabel = 'Nonaktif',
  effects = [],
}: VisibilityToggleCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1 min-w-0">
          <h3 className="text-sm font-extrabold text-brand-brown-dark flex items-center gap-2">
            {icon}
            {title}
          </h3>
          <p className="text-xs text-gray-500 max-w-xl">{description}</p>
        </div>

        {/* Switch + status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p
              className={`text-xs font-black font-mono uppercase tracking-wider ${
                checked ? 'text-[#0E9F6E]' : 'text-gray-500'
              }`}
            >
              {saving ? 'Menyimpan...' : checked ? onLabel : offLabel}
            </p>
            <p className="text-[10px] text-gray-400">
              {checked ? 'Ketuk untuk menonaktifkan' : 'Ketuk untuk mengaktifkan'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={title}
            disabled={saving}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0E9F6E]/30 ${
              checked ? 'bg-[#0E9F6E]' : 'bg-gray-300'
            } ${saving ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-200 ${
                checked ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {effects.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100 grid gap-2 sm:grid-cols-2">
          {effects.map(label => (
            <div
              key={label}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-[11px] ${
                checked ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <span className="font-medium">{label}</span>
              <span className="font-black font-mono uppercase tracking-wider text-[10px]">
                {checked ? 'Tampil' : 'Tersembunyi'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
