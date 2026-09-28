import { useState, useEffect, type ReactNode } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Users, GraduationCap, Trophy, Medal, Building2 } from 'lucide-react';
import { Personalia, PersonaliaEntry } from '../types';

const FALLBACK_FOTO = 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400';

const toEntries = (v: unknown): PersonaliaEntry[] =>
  Array.isArray(v) ? (v as PersonaliaEntry[]).filter((e) => e && e.judul) : [];

function Timeline({ items }: { items: PersonaliaEntry[] }) {
  return (
    <ol className="relative border-l-2 border-brand-orange/25 ml-2 space-y-6">
      {items.map((it, i) => (
        <li key={i} className="pl-6 relative">
          <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-brand-orange" />
          {it.tahun && (
            <span className="inline-block text-[10px] font-mono font-extrabold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-md mb-1">
              {it.tahun}
            </span>
          )}
          <h4 className="font-extrabold text-sm text-brand-brown-dark leading-snug">{it.judul}</h4>
          {it.keterangan && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{it.keterangan}</p>}
        </li>
      ))}
    </ol>
  );
}

function AchievementList({ items }: { items: PersonaliaEntry[] }) {
  return (
    <ul className="space-y-3">
      {items.map((it, i) => (
        <li key={i} className="flex gap-3 items-start bg-gray-50 border border-gray-100 rounded-2xl p-3.5">
          <span className="shrink-0 w-8 h-8 rounded-xl bg-brand-yellow/20 text-brand-yellow flex items-center justify-center">
            <Medal className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h4 className="font-extrabold text-sm text-brand-brown-dark leading-snug">{it.judul}</h4>
            <div className="flex flex-wrap items-center gap-x-2 mt-0.5">
              {it.tahun && <span className="text-[10px] font-mono font-bold text-brand-orange">{it.tahun}</span>}
              {it.keterangan && <span className="text-xs text-gray-500">{it.keterangan}</span>}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
      <h2 className="flex items-center gap-2.5 font-extrabold text-base text-brand-brown-dark tracking-tight mb-5 pb-3 border-b border-gray-100">
        <span className="w-8 h-8 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function PersonaliaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<Personalia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    (async () => {
      try {
        const res = await fetch(`/api/personalia/${id}`);
        if (!res.ok) throw new Error('Profil tidak ditemukan atau telah dihapus.');
        setPerson(await res.json());
      } catch (err: any) {
        setError(err.message || 'Gagal memuat profil.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-24 flex flex-col items-center justify-center">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-2 h-2 bg-brand-orange rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-brand-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="text-xs text-gray-500 font-mono">Memuat profil...</p>
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-white py-24 px-4 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Gagal Memuat Profil</h2>
        <p className="text-sm text-gray-500 mb-6">{error || 'Profil tidak ditemukan.'}</p>
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-brand-orange hover:underline font-bold">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const riwayatOrg = toEntries(person.riwayat_organisasi);
  const riwayatPend = toEntries(person.riwayat_pendidikan);
  const prestasiAkad = toEntries(person.prestasi_akademik);
  const prestasiNon = toEntries(person.prestasi_non_akademik);
  const hasAny = !!person.tentang || riwayatOrg.length + riwayatPend.length + prestasiAkad.length + prestasiNon.length > 0;

  const backPath = person.owner_type === 'dkr' && person.owner_slug ? `/dkr/${person.owner_slug}` : '/#personalia';

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* HERO: foto background */}
      <div className="relative h-[260px] sm:h-[380px] overflow-hidden bg-gradient-to-br from-brand-brown-dark via-brand-brown-mid to-brand-green">
        {person.foto_background_url && (
          <img
            src={person.foto_background_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/30" />
        <div className="absolute top-6 left-4 sm:left-8">
          <Link
            to={backPath}
            className="inline-flex items-center gap-2 text-xs text-white bg-black/35 hover:bg-black/55 backdrop-blur px-3.5 py-2 rounded-full font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Kartu identitas (menumpuk di atas hero) */}
        <div className="relative -mt-20 sm:-mt-24 bg-white border border-gray-200/80 rounded-3xl shadow-lg p-6 sm:p-8 flex flex-col sm:flex-row gap-5 sm:gap-7 items-center sm:items-end">
          <img
            src={person.foto_url || FALLBACK_FOTO}
            alt={person.nama}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl object-cover border-4 border-white shadow-xl -mt-16 sm:-mt-24 shrink-0 bg-gray-100"
            onError={(e) => { const el = e.target as HTMLImageElement; if (!el.dataset.fallback) { el.dataset.fallback = '1'; el.src = FALLBACK_FOTO; } }}
          />
          <div className="text-center sm:text-left min-w-0">
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-brown-dark tracking-tight leading-tight break-words">
              {person.nama}
            </h1>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 mt-3">
              <span className="bg-gradient-to-r from-brand-orange to-brand-teal text-white text-[10px] font-extrabold font-mono px-3 py-1.5 rounded-full uppercase tracking-wider">
                {person.jabatan}
              </span>
              <span className="bg-brand-green/10 text-brand-green text-[10px] font-extrabold font-mono px-3 py-1.5 rounded-full uppercase tracking-wider">
                {person.golongan}
              </span>
              {person.owner_nama && (
                <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-600 text-[10px] font-bold font-mono px-3 py-1.5 rounded-full uppercase tracking-wider">
                  <Building2 className="w-3 h-3" /> {person.owner_nama}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {person.tentang && (
            <Section icon={<User className="w-4 h-4" />} title="Tentang">
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line break-words">{person.tentang}</p>
            </Section>
          )}

          {(riwayatOrg.length > 0 || riwayatPend.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {riwayatOrg.length > 0 && (
                <Section icon={<Users className="w-4 h-4" />} title="Riwayat Organisasi">
                  <Timeline items={riwayatOrg} />
                </Section>
              )}
              {riwayatPend.length > 0 && (
                <Section icon={<GraduationCap className="w-4 h-4" />} title="Riwayat Pendidikan">
                  <Timeline items={riwayatPend} />
                </Section>
              )}
            </div>
          )}

          {(prestasiAkad.length > 0 || prestasiNon.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {prestasiAkad.length > 0 && (
                <Section icon={<Trophy className="w-4 h-4" />} title="Prestasi Akademik">
                  <AchievementList items={prestasiAkad} />
                </Section>
              )}
              {prestasiNon.length > 0 && (
                <Section icon={<Trophy className="w-4 h-4" />} title="Prestasi Non Akademik">
                  <AchievementList items={prestasiNon} />
                </Section>
              )}
            </div>
          )}

          {!hasAny && (
            <div className="bg-white border border-gray-200/80 rounded-3xl p-10 text-center text-sm text-gray-400 italic font-mono">
              Detail profil belum dilengkapi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
