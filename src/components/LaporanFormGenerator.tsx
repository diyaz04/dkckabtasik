import React, { useState } from 'react';
import { Upload, X, ChevronRight, ChevronLeft, Save } from 'lucide-react';
import { compressAndUploadFile } from '../utils/imageUpload';

interface LaporanFormGeneratorProps {
  jenisDokumen: '02GP' | '01DIKLAT';
  onJenisDokumenChange?: (jenis: '02GP' | '01DIKLAT') => void;
  initialData?: any;
  onSave: (formData: any, isDraft?: boolean) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export default function LaporanFormGenerator({ jenisDokumen, onJenisDokumenChange, initialData, onSave, onCancel, isLoading }: LaporanFormGeneratorProps) {
  const [step, setStep] = useState(initialData ? 1 : 1); // Wait, we can just start at 1
  const [autoSaveLoading, setAutoSaveLoading] = useState(false);
  
  // -- State untuk form data
  const [kegiatanData, setKegiatanData] = useState(initialData?.kegiatanData || { nama: '', waktu: '', tempat: '' });
  const [pelaksanaKetua, setPelaksanaKetua] = useState(initialData?.pelaksanaKetua || { nama: '', jabatanPramuka: '', jabatanPokok: '' });
  const [bentukBadan, setBentukBadan] = useState(initialData?.bentukBadan || '');
  
  // Jumlah Personil
  const defaultPersonil = { mabi: 0, anda: 0, kary: 0, pel: 0, bin: 0, t: 0, d: 0, lain: 0 };
  const [personilPa, setPersonilPa] = useState(initialData?.personilPa || { ...defaultPersonil });
  const [personilPi, setPersonilPi] = useState(initialData?.personilPi || { ...defaultPersonil });

  // Peserta
  const golongans = ['S', 'G', 'T', 'D', 'BIN', 'PEL', 'KAR', 'AN', 'MABI', 'LL'];
  const defaultPeserta = { pa: { tkk: 0, gar: 0, lain: 0, pram: 0, lainDewasa: 0, gudep: 0 }, pi: { tkk: 0, gar: 0, lain: 0, pram: 0, lainDewasa: 0, gudep: 0 } };
  const [peserta, setPeserta] = useState<Record<string, any>>(initialData?.peserta || golongans.reduce((acc, gol) => ({ ...acc, [gol]: JSON.parse(JSON.stringify(defaultPeserta)) }), {}));

  // Anggaran
  const [anggaran, setAnggaran] = useState(initialData?.anggaran || {
    mabi: 0, kwartir: 0, gudep: 0, anggota: 0, instansi: 0, masyarakatRp: 0, masyarakatBarang: '', sisa: 0, kurang: 0
  });
  const [sumbanganLain, setSumbanganLain] = useState(initialData?.sumbanganLain || '-');

  // Kesimpulan & Saran
  const [kesimpulan, setKesimpulan] = useState(initialData?.kesimpulan || '');
  const [saran, setSaran] = useState(initialData?.saran || '');
  
  // TTD
  const [ttdKota, setTtdKota] = useState(initialData?.ttdKota || 'Tasikmalaya');
  const [ttdTanggal, setTtdTanggal] = useState(initialData?.ttdTanggal || '');
  const [ttdPanitia, setTtdPanitia] = useState(initialData?.ttdPanitia || { nama: '', nta: '' });

  // Dokumentasi
  const [dokumentasi, setDokumentasi] = useState<string[]>(initialData?.dokumentasi || []);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Form helpers
  const handleUploadDokumentasi = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingDoc(true);
    try {
      const newDocs = [...dokumentasi];
      for (let i = 0; i < files.length; i++) {
        if (newDocs.length >= 6) break;
        const url = await compressAndUploadFile(files[i]);
        if (url) newDocs.push(url);
      }
      setDokumentasi(newDocs);
    } catch (err) {
      console.error(err);
      alert('Gagal mengupload foto dokumentasi');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleSave = () => {
    if (dokumentasi.length < 3) {
      alert('Minimal 3 foto dokumentasi wajib diunggah!');
      setStep(5);
      return;
    }
    
    onSave({
      kegiatanData, pelaksanaKetua, bentukBadan, personilPa, personilPi, peserta, anggaran, sumbanganLain, kesimpulan, saran, ttdKota, ttdTanggal, ttdPanitia, dokumentasi
    });
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!kegiatanData.nama || !kegiatanData.waktu || !kegiatanData.tempat) {
        alert('Mohon lengkapi Nama Kegiatan, Waktu, dan Tempat Pelaksanaan.');
        return;
      }
    }
    
    // Auto save draft
    setAutoSaveLoading(true);
    try {
      await onSave({
        kegiatanData, pelaksanaKetua, bentukBadan, personilPa, personilPi, peserta, anggaran, sumbanganLain, kesimpulan, saran, ttdKota, ttdTanggal, ttdPanitia, dokumentasi
      }, true); // isDraft = true
      setStep(step + 1);
    } catch (err) {
      console.error(err);
      alert('Gagal auto-save draf, silakan coba lagi.');
    } finally {
      setAutoSaveLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-xl font-bold text-brand-brown-dark">
          Form Laporan {jenisDokumen}
        </h2>
        <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          Step {step} of 5
        </span>
      </div>

      <div className="space-y-6">
        {step === 1 && (
          <div className="animate-fade-in space-y-4">
            <h3 className="font-bold text-lg text-brand-orange border-b pb-2">1. Kegiatan & Pelaksana</h3>
            {onJenisDokumenChange && (
              <div className="mb-4">
                <label className="block text-xs font-bold mb-1">Jenis Pelaporan</label>
                <select
                  value={jenisDokumen}
                  onChange={(e) => onJenisDokumenChange(e.target.value as any)}
                  className="w-full bg-gray-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 font-bold focus:outline-none focus:border-[#0E9F6E]"
                >
                  <option value="02GP">02GP (Laporan Kegiatan Umum Ranting)</option>
                  <option value="01DIKLAT">01 DIKLAT (Pendidikan & Pelatihan Kepemimpinan/Teknis)</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold mb-1">Nama Kegiatan</label>
              <input type="text" className="w-full p-2 border rounded-xl bg-slate-50" value={kegiatanData.nama} onChange={e => setKegiatanData({...kegiatanData, nama: e.target.value})} placeholder="Misal: Kursus Pengelola Dewan Kerja" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">Waktu Pelaksanaan</label>
                <input type="text" className="w-full p-2 border rounded-xl bg-slate-50" value={kegiatanData.waktu} onChange={e => setKegiatanData({...kegiatanData, waktu: e.target.value})} placeholder="Misal: 1-5 Juli 2022" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Tempat</label>
                <input type="text" className="w-full p-2 border rounded-xl bg-slate-50" value={kegiatanData.tempat} onChange={e => setKegiatanData({...kegiatanData, tempat: e.target.value})} placeholder="Misal: Gedung Pramuka" />
              </div>
            </div>

            <div className="pt-4 border-t border-dashed mt-4">
              <label className="block text-xs font-bold mb-1">Nama Ketua Panitia</label>
              <input type="text" className="w-full p-2 border rounded-xl bg-slate-50" value={pelaksanaKetua.nama} onChange={e => setPelaksanaKetua({...pelaksanaKetua, nama: e.target.value})} placeholder="Misal: Aini Mutaba'ah" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Jabatan Pramuka</label>
              <input type="text" className="w-full p-2 border rounded-xl bg-slate-50" value={pelaksanaKetua.jabatanPramuka} onChange={e => setPelaksanaKetua({...pelaksanaKetua, jabatanPramuka: e.target.value})} placeholder="Misal: Wakil Ketua DKC" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Jabatan Pokok</label>
              <input type="text" className="w-full p-2 border rounded-xl bg-slate-50" value={pelaksanaKetua.jabatanPokok} onChange={e => setPelaksanaKetua({...pelaksanaKetua, jabatanPokok: e.target.value})} placeholder="-" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Bentuk Badan Pelaksana</label>
              <input type="text" className="w-full p-2 border rounded-xl bg-slate-50" value={bentukBadan} onChange={e => setBentukBadan(e.target.value)} placeholder="Misal: Sangga Kerja" />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            <h3 className="font-bold text-lg text-brand-orange border-b pb-2">2. Jumlah Personil Pelaksana</h3>
            <p className="text-xs text-gray-500">Masukkan jumlah personil berdasarkan kategori (kosongkan atau isi 0 jika tidak ada).</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100 text-xs text-center">
                    <th className="border p-2">JENIS</th>
                    <th className="border p-2">MABI</th><th className="border p-2">ANDA</th><th className="border p-2">KARY</th>
                    <th className="border p-2">PEL</th><th className="border p-2">BIN</th><th className="border p-2">T</th>
                    <th className="border p-2">D</th><th className="border p-2">LAIN</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  <tr>
                    <td className="border p-2 font-bold">PA</td>
                    {['mabi','anda','kary','pel','bin','t','d','lain'].map(k => (
                      <td key={k} className="border p-1"><input type="number" min="0" className="w-12 text-center bg-transparent" value={(personilPa as any)[k]} onChange={e => setPersonilPa({...personilPa, [k]: Number(e.target.value)})} /></td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border p-2 font-bold">PI</td>
                    {['mabi','anda','kary','pel','bin','t','d','lain'].map(k => (
                      <td key={k} className="border p-1"><input type="number" min="0" className="w-12 text-center bg-transparent" value={(personilPi as any)[k]} onChange={e => setPersonilPi({...personilPi, [k]: Number(e.target.value)})} /></td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in space-y-4">
            <h3 className="font-bold text-lg text-brand-orange border-b pb-2">3. Jumlah Peserta</h3>
            <p className="text-xs text-gray-500">Silakan isi form peserta berdasarkan golongan. Untuk menyederhanakan form, isi nilai pada sel terkait.</p>
            <div className="max-h-[400px] overflow-y-auto overflow-x-auto border rounded-xl">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-gray-200">
                  <tr>
                    <th className="border p-2" rowSpan={2}>GOLONGAN</th>
                    <th className="border p-2" colSpan={3}>PESERTA KEGIATAN</th>
                    <th className="border p-2" colSpan={2}>ANGGOTA DEWASA</th>
                    <th className="border p-2" rowSpan={2}>GUDEP</th>
                  </tr>
                  <tr>
                    <th className="border p-2 text-[10px]">TKK</th>
                    <th className="border p-2 text-[10px]">GAR</th>
                    <th className="border p-2 text-[10px]">LAIN</th>
                    <th className="border p-2 text-[10px]">PRAM</th>
                    <th className="border p-2 text-[10px]">LAIN</th>
                  </tr>
                </thead>
                <tbody className="text-center">
                  {golongans.map(gol => (
                    <React.Fragment key={gol}>
                      <tr className="bg-white">
                        <td className="border p-1 font-bold" rowSpan={2}>{gol}</td>
                        <td className="border p-0"><input type="number" className="w-8 text-center" value={peserta[gol].pa.tkk} onChange={e => { const n = {...peserta}; n[gol].pa.tkk = Number(e.target.value); setPeserta(n); }} /></td>
                        <td className="border p-0"><input type="number" className="w-8 text-center" value={peserta[gol].pa.gar} onChange={e => { const n = {...peserta}; n[gol].pa.gar = Number(e.target.value); setPeserta(n); }} /></td>
                        <td className="border p-0"><input type="number" className="w-8 text-center" value={peserta[gol].pa.lain} onChange={e => { const n = {...peserta}; n[gol].pa.lain = Number(e.target.value); setPeserta(n); }} /></td>
                        <td className="border p-0"><input type="number" className="w-8 text-center" value={peserta[gol].pa.pram} onChange={e => { const n = {...peserta}; n[gol].pa.pram = Number(e.target.value); setPeserta(n); }} /></td>
                        <td className="border p-0"><input type="number" className="w-8 text-center" value={peserta[gol].pa.lainDewasa} onChange={e => { const n = {...peserta}; n[gol].pa.lainDewasa = Number(e.target.value); setPeserta(n); }} /></td>
                        <td className="border p-0 bg-gray-50" rowSpan={2}><input type="number" className="w-10 text-center bg-transparent" value={peserta[gol].pa.gudep} onChange={e => { const n = {...peserta}; n[gol].pa.gudep = Number(e.target.value); setPeserta(n); }} /></td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="border p-0"><input type="number" className="w-8 text-center bg-transparent" value={peserta[gol].pi.tkk} onChange={e => { const n = {...peserta}; n[gol].pi.tkk = Number(e.target.value); setPeserta(n); }} /></td>
                        <td className="border p-0"><input type="number" className="w-8 text-center bg-transparent" value={peserta[gol].pi.gar} onChange={e => { const n = {...peserta}; n[gol].pi.gar = Number(e.target.value); setPeserta(n); }} /></td>
                        <td className="border p-0"><input type="number" className="w-8 text-center bg-transparent" value={peserta[gol].pi.lain} onChange={e => { const n = {...peserta}; n[gol].pi.lain = Number(e.target.value); setPeserta(n); }} /></td>
                        <td className="border p-0"><input type="number" className="w-8 text-center bg-transparent" value={peserta[gol].pi.pram} onChange={e => { const n = {...peserta}; n[gol].pi.pram = Number(e.target.value); setPeserta(n); }} /></td>
                        <td className="border p-0"><input type="number" className="w-8 text-center bg-transparent" value={peserta[gol].pi.lainDewasa} onChange={e => { const n = {...peserta}; n[gol].pi.lainDewasa = Number(e.target.value); setPeserta(n); }} /></td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in space-y-4">
            <h3 className="font-bold text-lg text-brand-orange border-b pb-2">4. Anggaran, Kesimpulan & Saran</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">MABI (Rp)</label>
                <input type="number" className="w-full p-2 border rounded-xl" value={anggaran.mabi} onChange={e => setAnggaran({...anggaran, mabi: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">KWARTIR (Rp)</label>
                <input type="number" className="w-full p-2 border rounded-xl" value={anggaran.kwartir} onChange={e => setAnggaran({...anggaran, kwartir: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">GUGUS DEPAN (Rp)</label>
                <input type="number" className="w-full p-2 border rounded-xl" value={anggaran.gudep} onChange={e => setAnggaran({...anggaran, gudep: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">ANGGOTA (Rp)</label>
                <input type="number" className="w-full p-2 border rounded-xl" value={anggaran.anggota} onChange={e => setAnggaran({...anggaran, anggota: Number(e.target.value)})} />
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-xs font-bold mb-1">Kesimpulan Kegiatan</label>
              <textarea className="w-full p-2 border rounded-xl bg-slate-50 h-24" value={kesimpulan} onChange={e => setKesimpulan(e.target.value)} placeholder="Tuliskan kesimpulan..." />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Saran-Saran</label>
              <textarea className="w-full p-2 border rounded-xl bg-slate-50 h-24" value={saran} onChange={e => setSaran(e.target.value)} placeholder="Tuliskan saran..." />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-fade-in space-y-4">
            <h3 className="font-bold text-lg text-brand-orange border-b pb-2">5. TTD & Dokumentasi</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold mb-1">Tempat TTD</label>
                <input type="text" className="w-full p-2 border rounded-xl bg-slate-50" value={ttdKota} onChange={e => setTtdKota(e.target.value)} placeholder="Tasikmalaya" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Tanggal TTD</label>
                <input type="date" className="w-full p-2 border rounded-xl bg-slate-50" value={ttdTanggal} onChange={e => setTtdTanggal(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">Nama Ketua Panitia</label>
                <input type="text" className="w-full p-2 border rounded-xl bg-slate-50" value={ttdPanitia.nama} onChange={e => setTtdPanitia({...ttdPanitia, nama: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">NTA Ketua Panitia</label>
                <input type="text" className="w-full p-2 border rounded-xl bg-slate-50" value={ttdPanitia.nta} onChange={e => setTtdPanitia({...ttdPanitia, nta: e.target.value})} />
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <label className="block text-sm font-bold text-brand-orange mb-2">Upload Dokumentasi (Min. 3 Foto)</label>
              <p className="text-xs text-orange-800 mb-4">Sistem akan mengompres foto secara otomatis. Foto ini akan dicetak di halaman terakhir PDF.</p>
              
              <div className="flex gap-2 mb-4">
                <input type="file" id="doc-upload" multiple accept="image/*" onChange={handleUploadDokumentasi} className="hidden" />
                <label htmlFor="doc-upload" className="bg-brand-orange text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-2 hover:bg-orange-600 transition-all">
                  <Upload className="w-4 h-4" /> Pilih Foto
                </label>
                {uploadingDoc && <span className="text-xs text-gray-500 flex items-center">Mengunggah...</span>}
              </div>

              <div className="flex flex-wrap gap-2">
                {dokumentasi.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-orange-200">
                    <img src={url} alt={`Doc ${i}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setDokumentasi(dokumentasi.filter((_, idx) => idx !== i))}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              {dokumentasi.length < 3 && (
                <p className="text-xs text-red-500 mt-2 font-bold">* Silakan unggah {3 - dokumentasi.length} foto lagi</p>
              )}
            </div>
          </div>
        )}

      </div>

      <div className="flex justify-between items-center mt-8 pt-4 border-t">
        <button 
          onClick={step > 1 ? () => setStep(step - 1) : onCancel}
          className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
        >
          {step > 1 ? 'Kembali' : 'Batal'}
        </button>
        
        {step < 5 ? (
          <button 
            onClick={handleNext}
            disabled={autoSaveLoading}
            className="px-6 py-2 text-sm font-bold text-white bg-brand-green hover:bg-[#10B981] rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {autoSaveLoading ? 'Menyimpan Draf...' : 'Selanjutnya'} <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={handleSave}
            disabled={isLoading || dokumentasi.length < 3}
            className="px-6 py-2 text-sm font-bold text-white bg-brand-orange hover:bg-orange-600 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Menyimpan...' : 'Simpan Laporan'} <Save className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
