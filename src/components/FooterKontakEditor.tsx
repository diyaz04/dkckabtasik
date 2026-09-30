import React, { useEffect, useState } from 'react';
import { MapPin, Mail, Phone, Save, Loader2 } from 'lucide-react';
import { showAlert as alert } from '../utils/dialog';
import { DEFAULT_KONTAK } from './Footer';

/**
 * Editor kontak Footer (alamat, email, no. telp sekretariat).
 * Disimpan di tabel site_content dengan section_key = 'footer_dkc'
 * (tabel generik key-value, jadi TIDAK butuh migrasi database).
 */
export default function FooterKontakEditor() {
  const [alamat, setAlamat] = useState('');
  const [email, setEmail] = useState('');
  const [telp, setTelp] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/site_content')
      .then(r => r.json())
      .then((sc: any[]) => {
        if (cancelled) return;
        const row = sc.find(item => item.section_key === 'footer_dkc');
        const c = row?.content || {};
        // Kalau belum pernah disimpan, isi form dengan nilai default yang tampil sekarang
        setAlamat(c.alamat ?? DEFAULT_KONTAK.alamat);
        setEmail(c.email ?? DEFAULT_KONTAK.email);
        setTelp(c.telp ?? DEFAULT_KONTAK.telp);
      })
      .catch(() => {
        if (cancelled) return;
        setAlamat(DEFAULT_KONTAK.alamat);
        setEmail(DEFAULT_KONTAK.email);
        setTelp(DEFAULT_KONTAK.telp);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      alert('Format email belum benar bro, cek lagi ya.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/site_content/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: 'footer_dkc',
          content: { alamat: alamat.trim(), email: email.trim(), telp: telp.trim() },
        }),
      });
      if (!res.ok) throw new Error('save failed');
      alert('Kontak footer berhasil diperbarui!');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan kontak footer. Coba lagi ya.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-gray-50 border border-slate-200/80 rounded-xl px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#0E9F6E] focus:ring-2 focus:ring-[#0E9F6E]/10 focus:bg-white transition-all duration-200';
  const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase mb-1';

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="border-b pb-3 mb-5">
        <h3 className="font-extrabold text-sm text-brand-brown-dark tracking-tight flex items-center gap-2 font-mono">
          <span className="w-5 h-5 bg-brand-orange text-white rounded-full flex items-center justify-center text-[10px]">
            <MapPin className="w-3 h-3" />
          </span>
          Kontak Footer (Hubungi Sekretariat)
        </h3>
        <p className="text-[10px] text-gray-500 font-mono mt-1">
          Alamat, email, dan nomor telepon ini tampil di bagian "Hubungi Sekretariat" pada footer website publik.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono py-6">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat data...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5 text-xs font-mono">
          <div>
            <label className={labelCls}>
              <MapPin className="w-3 h-3 inline -mt-0.5 mr-1" />
              Alamat Sekretariat
            </label>
            <textarea
              rows={3}
              value={alamat}
              onChange={e => setAlamat(e.target.value)}
              placeholder="Jl. ..., Kecamatan, Kabupaten Tasikmalaya, Jawa Barat, 46xxx"
              className={inputCls + ' resize-y'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>
                <Mail className="w-3 h-3 inline -mt-0.5 mr-1" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="info@dkctasikmalaya.org"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                <Phone className="w-3 h-3 inline -mt-0.5 mr-1" />
                No. Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={telp}
                onChange={e => setTelp(e.target.value)}
                placeholder="0265-123456 (Sekretariat DKC)"
                className={inputCls}
              />
            </div>
          </div>

          <p className="text-[9px] text-gray-400 font-sans">
            *Kalau ada kolom yang dikosongkan, footer otomatis memakai teks bawaan supaya tidak terlihat bolong.
          </p>

          <button
            type="submit"
            disabled={saving}
            className="bg-brand-brown-dark hover:bg-brand-orange disabled:opacity-60 text-white font-mono font-bold text-[10px] py-3 px-5 rounded-xl transition-all duration-200 uppercase tracking-wider inline-flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Menyimpan...' : 'Simpan Kontak Footer'}
          </button>
        </form>
      )}
    </div>
  );
}
