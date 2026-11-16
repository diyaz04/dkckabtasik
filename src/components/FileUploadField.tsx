import { useState } from 'react';
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { uploadFormFile, FORM_FILE_ACCEPT } from '../utils/imageUpload';

interface Props {
  value: string;                       // URL Cloudinary yang sudah terupload ('' = belum ada)
  onChange: (url: string) => void;
  required?: boolean;
  compact?: boolean;
}

/** Input upload berkas untuk field bertipe 'file' di form pendaftaran (Cloudinary, maks 2 MB). */
export default function FileUploadField({ value, onChange, required, compact }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // supaya file yang sama bisa dipilih ulang
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      onChange(await uploadFormFile(file));
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunggah berkas.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {value ? (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
          <a href={value} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 truncate hover:underline flex-1">
            Berkas terunggah — klik untuk melihat
          </a>
          <button type="button" onClick={() => onChange('')} title="Hapus & ganti berkas"
            className="text-gray-400 hover:text-red-500 p-1 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className={`flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-brand-orange rounded-xl cursor-pointer bg-gray-50 transition-colors ${compact ? 'px-3 py-2' : 'px-4 py-3'} ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin text-brand-orange" /> : <Upload className="w-4 h-4 text-brand-orange" />}
          <span className="text-xs font-bold text-gray-600">{uploading ? 'Mengunggah...' : 'Pilih berkas (PDF / JPG / PNG)'}</span>
          <input type="file" accept={FORM_FILE_ACCEPT} onChange={handlePick} className="hidden" />
        </label>
      )}
      {/* input tersembunyi agar validasi "required" bawaan browser ikut bekerja */}
      {required && <input tabIndex={-1} aria-hidden required value={value} onChange={() => {}} className="sr-only" />}
      <p className="text-[10px] text-gray-400 font-mono">Maksimal 2 MB · format PDF, JPG, PNG, WEBP</p>
      {error && <p className="text-[10px] text-red-500 font-bold">{error}</p>}
    </div>
  );
}
