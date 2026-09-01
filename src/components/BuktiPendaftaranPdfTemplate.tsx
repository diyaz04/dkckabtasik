import React from 'react';
import QRCode from 'react-qr-code';

interface Props {
  pendaftaranId: string;
  agendaName: string;
  waktuDaftar: string;
  tipePendaftaran: string;
  asalKwarran: string;
  formData: any;
  formFields: any[];
  isQrValidasi: boolean;
  isQrCheckin: boolean;
}

export default function BuktiPendaftaranPdfTemplate({ 
  pendaftaranId, agendaName, waktuDaftar, tipePendaftaran, asalKwarran, formData, formFields, isQrValidasi, isQrCheckin 
}: Props) {
  const origin = window.location.origin;

  return (
    <div id="pdf-bukti-pendaftaran" className="bg-white text-black p-10 font-sans" style={{ width: '210mm', minHeight: '297mm' }}>
      <style>{`
        #pdf-bukti-pendaftaran, #pdf-bukti-pendaftaran * {
          color: #000000 !important;
          border-color: #000000 !important;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Bukti Pendaftaran</h1>
          <p className="text-sm font-bold mt-1">{agendaName}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono">ID: {pendaftaranId.split('-')[0].toUpperCase()}</p>
          <p className="text-xs">{waktuDaftar}</p>
        </div>
      </div>

      {/* Basic Info */}
      <div className="mb-6">
        <table className="w-full text-sm">
          <tbody>
            <tr>
              <td className="w-40 font-bold py-1">Tipe Pendaftaran</td>
              <td>: {tipePendaftaran.toUpperCase()}</td>
            </tr>
            <tr>
              <td className="w-40 font-bold py-1">Asal Kwartir Ranting</td>
              <td>: {asalKwarran || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Dynamic Form Data */}
      <div className="mb-8 border border-black p-4 rounded-xl">
        <h3 className="font-bold text-sm mb-4 uppercase border-b border-black pb-2">Data Peserta</h3>
        <table className="w-full text-sm">
          <tbody>
            {formFields.map(field => (
              <tr key={field.id} className="border-b border-gray-100 last:border-0">
                <td className="w-1/2 py-2 text-gray-700">{field.label}</td>
                <td className="w-1/2 py-2 font-bold">: {formData[field.id] || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR Codes Section */}
      {(isQrValidasi || isQrCheckin) && (
        <div className="flex gap-10 mt-10 justify-center">
          {isQrValidasi && (
            <div className="flex flex-col items-center text-center">
              <div className="p-2 border-2 border-black rounded-lg inline-block bg-white">
                <QRCode value={`${origin}/validasi-pendaftaran/${pendaftaranId}`} size={120} level="M" />
              </div>
              <p className="text-xs font-bold mt-2 uppercase">Scan Validasi</p>
              <p className="text-[9px] w-32 mt-1">Gunakan kamera HP untuk memvalidasi dokumen ini.</p>
            </div>
          )}

          {isQrCheckin && (
            <div className="flex flex-col items-center text-center">
              <div className="p-2 border-2 border-black rounded-lg inline-block bg-white">
                <QRCode value={pendaftaranId} size={120} level="Q" />
              </div>
              <p className="text-xs font-bold mt-2 uppercase">Scan Check-in</p>
              <p className="text-[9px] w-32 mt-1">Scan kode ini pada meja registrasi ulang.</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-16 text-center text-[10px] italic border-t border-dashed border-gray-400 pt-4">
        Dokumen ini diterbitkan secara otomatis oleh sistem pendaftaran Dewan Kerja Cabang Kabupaten Tasikmalaya.
        <br/>Harap simpan dokumen ini atau tunjukkan saat registrasi ulang kegiatan.
      </div>
    </div>
  );
}
