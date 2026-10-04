import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  PAMFLET_H,
  PAMFLET_W,
  PAMFLET_ZONES,
  PamfletTemplateConfig,
  PamfletTextTheme,
  usePamfletTemplate,
} from '../utils/pamfletTemplate';

export const PAMFLET_TARGET_ID = 'pamflet-render-target';
const FALLBACK_IMG = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800';

export interface PamfletData {
  judul: string;
  excerpt: string;
  gambar_url?: string | null;
  saka_id?: string | null;
  saka_nama?: string | null;
  kecamatan_id?: string | null;
  kecamatan_nama?: string | null;
  author_name: string;
  dateText: string;
  qrValue: string;
}

function labelText(d: PamfletData) {
  if (d.saka_id) return `SAKA ${d.saka_nama ?? ''}`;
  if (d.kecamatan_id) return `DKR ${d.kecamatan_nama ?? ''}`;
  return 'KABAR DKC UTAMA';
}

function onImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const el = e.target as HTMLImageElement;
  if (!el.dataset.fallback) {
    el.dataset.fallback = '1';
    el.src = FALLBACK_IMG;
  }
}

/** Desain bawaan (dipakai selama admin belum mengunggah template). */
function DefaultPamflet({ d }: { d: PamfletData }) {
  return (
    <div
      id={PAMFLET_TARGET_ID}
      className="w-full max-w-[370px] bg-white p-5 rounded-[24px] border border-slate-100 shadow-2xl flex flex-col justify-between relative select-none"
      style={{ minHeight: '520px' }}
    >
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-orange via-brand-green to-brand-brown-mid" />

      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center border border-brand-green/20">
            <span className="text-brand-green text-sm">⚜</span>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-brand-brown-dark tracking-wider uppercase font-mono leading-none">Warta Pramuka</h4>
            <p className="text-[8px] text-gray-400 font-bold font-mono tracking-wider mt-0.5 uppercase leading-none">DKC Tasikmalaya</p>
          </div>
        </div>
        <div>
          {d.saka_id ? (
            <span className="bg-brand-orange text-white text-[7px] font-black font-mono px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">{labelText(d)}</span>
          ) : d.kecamatan_id ? (
            <span className="bg-[#2E5C9A] text-white text-[7px] font-black font-mono px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">{labelText(d)}</span>
          ) : (
            <span className="bg-gradient-to-r from-brand-orange to-brand-red text-white text-[7px] font-black font-mono px-2 py-1 rounded-md uppercase tracking-wider shadow-sm">{labelText(d)}</span>
          )}
        </div>
      </div>

      <div className="relative h-40 w-full overflow-hidden bg-slate-100 rounded-xl border border-slate-150/60 shadow-inner">
        <img src={d.gambar_url || FALLBACK_IMG} alt={d.judul} crossOrigin="anonymous" className="w-full h-full object-cover" onError={onImgError} />
      </div>

      <div className="mt-3">
        <h3 className="font-extrabold text-sm text-slate-950 tracking-tight leading-snug uppercase">{d.judul}</h3>
      </div>

      <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
        <p className="text-[10px] text-gray-500 leading-relaxed font-sans line-clamp-3 font-medium">"{d.excerpt}"</p>
      </div>

      <div className="flex items-center justify-center gap-1 my-3">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
        <span className="w-8 h-[2px] bg-brand-green/20" />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
      </div>

      <div className="grid grid-cols-12 gap-3 items-center border-t border-slate-100 pt-3">
        <div className="col-span-8 space-y-1 text-left">
          <div className="text-[8px] text-gray-400 font-mono font-bold leading-tight">
            DITERBITKAN: <span className="text-gray-600 font-extrabold">{d.dateText}</span>
          </div>
          <div className="text-[8px] text-gray-400 font-mono font-bold leading-tight">
            KONTRIBUTOR: <span className="text-brand-brown-dark font-extrabold">{d.author_name}</span>
          </div>
          <p className="text-[8px] text-brand-green font-extrabold font-mono uppercase tracking-wider mt-1 leading-tight">Satyaku Kudarmakan, Darmaku Kubaktikan</p>
        </div>
        <div className="col-span-4 flex flex-col items-center">
          <div className="bg-white p-1 rounded-lg border border-slate-200/80 shadow-sm">
            <QRCode value={d.qrValue} size={48} />
          </div>
          <span className="text-[6px] font-mono font-bold text-gray-400 text-center tracking-wider block mt-1 uppercase leading-none">PINDAI LINK</span>
        </div>
      </div>
    </div>
  );
}

/** Pamflet 1080x1350 di atas gambar template. Elemen inilah yang diunduh sebagai PNG. */
export function TemplatePamfletCanvas({
  d,
  imageUrl,
  textTheme,
  id,
}: {
  d: PamfletData;
  imageUrl: string;
  textTheme: PamfletTextTheme;
  id?: string;
}) {
  const light = textTheme === 'light';
  const mainColor = light ? '#ffffff' : '#0f172a';
  const subColor = light ? 'rgba(255,255,255,0.85)' : '#475569';
  const pos = (k: string): React.CSSProperties => {
    const z = PAMFLET_ZONES.find(zn => zn.key === k)!;
    return { position: 'absolute', left: z.x, top: z.y, width: z.w, height: z.h };
  };
  const clamp = (n: number): React.CSSProperties => ({
    display: '-webkit-box',
    WebkitLineClamp: n,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  });

  return (
    <div
      id={id}
      className="select-none"
      style={{ position: 'relative', width: PAMFLET_W, height: PAMFLET_H, background: '#fff', overflow: 'hidden', fontFamily: 'sans-serif' }}
    >
      <img src={imageUrl} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      <div style={{ ...pos('label'), display: 'flex', alignItems: 'center' }}>
        <span style={{ background: '#E8731A', color: '#fff', fontWeight: 800, fontSize: 26, letterSpacing: 2, padding: '6px 20px', borderRadius: 10, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          {labelText(d)}
        </span>
      </div>

      <div style={{ ...pos('foto'), borderRadius: 20, overflow: 'hidden', background: '#e2e8f0' }}>
        <img src={d.gambar_url || FALLBACK_IMG} alt={d.judul} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={onImgError} />
      </div>

      <div style={{ ...pos('judul'), color: mainColor, fontWeight: 800, fontSize: 52, lineHeight: 1.15, textTransform: 'uppercase', ...clamp(3) }}>
        {d.judul}
      </div>

      <div style={{ ...pos('ringkasan'), color: subColor, fontSize: 28, lineHeight: 1.4, ...clamp(3) }}>"{d.excerpt}"</div>

      <div style={{ ...pos('meta'), color: subColor, fontSize: 26, lineHeight: 1.5, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div>DITERBITKAN: <b style={{ color: mainColor }}>{d.dateText}</b></div>
        <div style={clamp(1)}>KONTRIBUTOR: <b style={{ color: mainColor }}>{d.author_name}</b></div>
        <div style={{ marginTop: 8, fontWeight: 800, fontSize: 22, letterSpacing: 1, color: mainColor, textTransform: 'uppercase' }}>
          Satyaku Kudarmakan, Darmaku Kubaktikan
        </div>
      </div>

      <div style={{ ...pos('qr'), background: '#fff', padding: 10, borderRadius: 14, boxSizing: 'border-box' }}>
        <QRCode value={d.qrValue} size={150} />
      </div>
    </div>
  );
}

/** Menampilkan canvas 1080x1350 mengecil sesuai lebar wadah. */
export function ScaledPamflet({ children, maxWidth = 370 }: { children: React.ReactNode; maxWidth?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(maxWidth);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.min(maxWidth, el.clientWidth || maxWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth]);
  const scale = width / PAMFLET_W;
  return (
    <div ref={ref} className="w-full" style={{ maxWidth }}>
      <div className="rounded-[20px] shadow-2xl border border-slate-100 bg-white" style={{ width, height: PAMFLET_H * scale, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
    </div>
  );
}

/** Pratinjau + target unduhan. Otomatis memilih template admin atau desain bawaan. */
export default function PamfletCard({ data }: { data: PamfletData }) {
  const tpl: PamfletTemplateConfig | null | undefined = usePamfletTemplate();

  if (tpl === undefined) {
    return <div className="w-full max-w-[370px] bg-white/80 rounded-[24px] animate-pulse" style={{ minHeight: 520 }} />;
  }
  if (!tpl) return <DefaultPamflet d={data} />;
  return (
    <ScaledPamflet>
      <TemplatePamfletCanvas d={data} imageUrl={tpl.url} textTheme={tpl.textTheme} id={PAMFLET_TARGET_ID} />
    </ScaledPamflet>
  );
}
