import React from 'react';
import { LaporanKegiatan } from '../types';

interface Props {
  laporan: LaporanKegiatan;
  profileDkr?: any;
}

export default function LaporanPdfTemplate({ laporan, profileDkr }: Props) {
  const data = typeof laporan.form_data === 'string' ? JSON.parse(laporan.form_data) : laporan.form_data;
  if (!data) return null;

  return (
    <div id={`pdf-laporan-${laporan.id}`} className="bg-white text-black text-sm p-10 font-serif leading-relaxed" style={{ width: '210mm', minHeight: '297mm' }}>
      
      {/* PAGE 1 */}
      <div className="pdf-page break-after-page mb-8">
        <div className="text-right mb-4">Model : {laporan.jenis_dokumen === '02GP' ? '02/GP' : '01/Lapdiklat'}</div>
        <div className="text-center font-bold mb-8 uppercase leading-tight">
          LAPORAN KEGIATAN<br/>
          JAJARAN : Gerakan Pramuka Kwartir Cabang Kabupaten Tasikmalaya<br/>
          NOMOR : -
        </div>

        <table className="w-full mb-4">
          <tbody>
            <tr><td className="w-8 align-top">I.</td><td colSpan={2} className="font-bold">JAJARAN PENYELENGGARA</td></tr>
            <tr><td/><td className="w-48">1. KWARNAS</td><td>: -</td></tr>
            <tr><td/><td className="w-48">2. KWARDA</td><td>: -</td></tr>
            <tr><td/><td className="w-48">3. KWARCAB</td><td>: Kab. Tasikmalaya</td></tr>
            <tr><td/><td className="w-48">4. KWARRAN</td><td>: {laporan.kecamatan_nama || '-'}</td></tr>
            <tr><td/><td className="w-48">5. GUDEP</td><td>: -</td></tr>
            
            <tr><td colSpan={3} className="h-4"></td></tr>
            
            <tr><td className="w-8 align-top">II.</td><td colSpan={2} className="font-bold">KEGIATAN</td></tr>
            <tr><td/><td className="w-48">1. MACAM</td><td>: {laporan.nama_kegiatan}</td></tr>
            <tr><td/><td className="w-48">2. WAKTU</td><td>: {laporan.tanggal_pelaksanaan ? new Date(laporan.tanggal_pelaksanaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</td></tr>
            <tr><td/><td className="w-48">3. TEMPAT</td><td>: {laporan.tempat_pelaksanaan}</td></tr>

            <tr><td colSpan={3} className="h-4"></td></tr>
            
            <tr><td className="w-8 align-top">III.</td><td colSpan={2} className="font-bold">PELAKSANA</td></tr>
            <tr><td/><td colSpan={2}>1. PEM/KETUA :</td></tr>
            <tr><td/><td className="pl-6 w-48">a. NAMA</td><td>: {data.pelaksanaKetua?.nama || '-'}</td></tr>
            <tr><td/><td className="pl-6 w-48">b. JABATAN PRAMUKA</td><td>: {data.pelaksanaKetua?.jabatanPramuka || '-'}</td></tr>
            <tr><td/><td className="pl-6 w-48">c. JABATAN POKOK</td><td>: {data.pelaksanaKetua?.jabatanPokok || '-'}</td></tr>
            <tr><td/><td colSpan={2}>2. BENTUK BADAN PELAKSANA : {data.bentukBadan || '-'}</td></tr>
            <tr><td/><td colSpan={2}>3. JUMLAH PERSONIL BADAN PELAKSANA :</td></tr>
          </tbody>
        </table>

        {/* Tabel Personil */}
        <div className="pl-8 mb-6">
          <table className="w-full border-collapse border border-black text-center text-xs">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-black p-1">JENIS</td>
                <td className="border border-black p-1">MABI</td><td className="border border-black p-1">ANDA</td>
                <td className="border border-black p-1">KARY</td><td className="border border-black p-1">PEL</td>
                <td className="border border-black p-1">BIN</td><td className="border border-black p-1">T</td>
                <td className="border border-black p-1">D</td><td className="border border-black p-1">LAIN</td>
                <td className="border border-black p-1">JUML</td><td className="border border-black p-1">KET</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1">1. PA</td>
                {['mabi','anda','kary','pel','bin','t','d','lain'].map((k) => (
                  <td key={k} className="border border-black p-1">{data.personilPa?.[k] || ''}</td>
                ))}
                <td className="border border-black p-1 font-bold">{Object.values(data.personilPa || {}).reduce((a:any,b:any)=>a+b,0)}</td>
                <td className="border border-black p-1"></td>
              </tr>
              <tr>
                <td className="border border-black p-1">2. PI</td>
                {['mabi','anda','kary','pel','bin','t','d','lain'].map((k) => (
                  <td key={k} className="border border-black p-1">{data.personilPi?.[k] || ''}</td>
                ))}
                <td className="border border-black p-1 font-bold">{Object.values(data.personilPi || {}).reduce((a:any,b:any)=>a+b,0)}</td>
                <td className="border border-black p-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="pdf-page break-after-page mb-8 pt-8">
        <table className="w-full mb-4">
          <tbody>
            <tr><td className="w-8 align-top">IV.</td><td className="font-bold">JUMLAH PESERTA</td></tr>
          </tbody>
        </table>
        <div className="pl-8 mb-6">
          <table className="w-full border-collapse border border-black text-center text-xs">
            <thead>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-black p-1" rowSpan={2}>GOLONGAN</td>
                <td className="border border-black p-1" rowSpan={2}>JUMLAH<br/>ANGGOTA<br/>JAJARAN</td>
                <td className="border border-black p-1" colSpan={4}>JUMLAH PESERTA KEGIATAN</td>
                <td className="border border-black p-1" colSpan={3}>ANGGOTA DEWASA</td>
                <td className="border border-black p-1" rowSpan={2}>GUDEP<br/>KAMPUS</td>
              </tr>
              <tr className="bg-gray-100 font-bold">
                <td className="border border-black p-1">TKK</td><td className="border border-black p-1">GAR</td>
                <td className="border border-black p-1">LAIN</td><td className="border border-black p-1">JUML</td>
                <td className="border border-black p-1">PRAM</td><td className="border border-black p-1">LAIN</td>
                <td className="border border-black p-1">JUML</td>
              </tr>
            </thead>
            <tbody>
              {['S','G','T','D','BIN','PEL','KAR','AN','MABI','LL'].map((gol, i) => (
                <React.Fragment key={gol}>
                  <tr>
                    <td className="border border-black p-1" rowSpan={2}>{i+1}. {gol}</td>
                    <td className="border border-black p-1">PA</td>
                    <td className="border border-black p-1">{data.peserta?.[gol]?.pa?.tkk || ''}</td>
                    <td className="border border-black p-1">{data.peserta?.[gol]?.pa?.gar || ''}</td>
                    <td className="border border-black p-1">{data.peserta?.[gol]?.pa?.lain || ''}</td>
                    <td className="border border-black p-1 font-bold">{(data.peserta?.[gol]?.pa?.tkk||0) + (data.peserta?.[gol]?.pa?.gar||0) + (data.peserta?.[gol]?.pa?.lain||0) || ''}</td>
                    <td className="border border-black p-1">{data.peserta?.[gol]?.pa?.pram || ''}</td>
                    <td className="border border-black p-1">{data.peserta?.[gol]?.pa?.lainDewasa || ''}</td>
                    <td className="border border-black p-1 font-bold">{(data.peserta?.[gol]?.pa?.pram||0) + (data.peserta?.[gol]?.pa?.lainDewasa||0) || ''}</td>
                    <td className="border border-black p-1" rowSpan={2}>{data.peserta?.[gol]?.pa?.gudep || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-1">PI</td>
                    <td className="border border-black p-1">{data.peserta?.[gol]?.pi?.tkk || ''}</td>
                    <td className="border border-black p-1">{data.peserta?.[gol]?.pi?.gar || ''}</td>
                    <td className="border border-black p-1">{data.peserta?.[gol]?.pi?.lain || ''}</td>
                    <td className="border border-black p-1 font-bold">{(data.peserta?.[gol]?.pi?.tkk||0) + (data.peserta?.[gol]?.pi?.gar||0) + (data.peserta?.[gol]?.pi?.lain||0) || ''}</td>
                    <td className="border border-black p-1">{data.peserta?.[gol]?.pi?.pram || ''}</td>
                    <td className="border border-black p-1">{data.peserta?.[gol]?.pi?.lainDewasa || ''}</td>
                    <td className="border border-black p-1 font-bold">{(data.peserta?.[gol]?.pi?.pram||0) + (data.peserta?.[gol]?.pi?.lainDewasa||0) || ''}</td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <table className="w-full mb-4">
          <tbody>
            <tr><td className="w-8 align-top">V.</td><td className="font-bold">PELAKSANAAN</td></tr>
            <tr><td/><td className="pl-4">Terlampir.</td></tr>
            <tr><td colSpan={2} className="h-4"></td></tr>

            <tr><td className="w-8 align-top">VI.</td><td className="font-bold">ANGGARAN DIPEROLEH DARI</td></tr>
            <tr><td/><td className="pl-4">1. MABI &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Rp. {data.anggaran?.mabi || '-'}</td></tr>
            <tr><td/><td className="pl-4">2. KWARTIR &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Rp. {data.anggaran?.kwartir || '-'}</td></tr>
            <tr><td/><td className="pl-4">3. GUGUS DEPAN Rp. {data.anggaran?.gudep || '-'}</td></tr>
            <tr><td/><td className="pl-4">4. ANGGOTA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Rp. {data.anggaran?.anggota || '-'}</td></tr>
            
            <tr><td colSpan={2} className="h-4"></td></tr>
            <tr><td className="w-8 align-top">VII.</td><td className="font-bold">SUMBANGAN LAIN-LAIN</td></tr>
            <tr><td/><td className="pl-4">{data.sumbanganLain || '-'}</td></tr>
          </tbody>
        </table>
      </div>

      {/* PAGE 3 */}
      <div className="pdf-page break-after-page mb-8 pt-8">
        <table className="w-full mb-4">
          <tbody>
            <tr><td className="w-8 align-top">VIII.</td><td className="font-bold uppercase">Kesimpulan</td></tr>
            <tr><td/><td className="pl-4 text-justify pr-8">{data.kesimpulan || '-'}</td></tr>
            
            <tr><td colSpan={2} className="h-4"></td></tr>
            
            <tr><td className="w-8 align-top">IX.</td><td className="font-bold uppercase">Saran-Saran</td></tr>
            <tr><td/><td className="pl-4 text-justify pr-8">{data.saran || '-'}</td></tr>
            
            <tr><td colSpan={2} className="h-4"></td></tr>
            
            <tr><td className="w-8 align-top">X.</td><td className="font-bold uppercase">Penutup</td></tr>
            <tr><td/><td className="pl-4 text-justify pr-8">Demikian laporan ini kami sampaikan, atas segala dukungan dan perhatiannya kami ucapkan terima kasih.</td></tr>
          </tbody>
        </table>

        {/* TTD Section */}
        <div className="flex justify-between mt-12 pr-12">
          <div className="text-center">
            <p>Gerakan Pramuka</p>
            <p>Kwartir Ranting {laporan.kecamatan_nama}</p>
            <p>Ketua,</p>
            <div className="h-24"></div>
            <p className="font-bold underline">{profileDkr?.nama_ketua || '_______________________'}</p>
            <p>NTA. {profileDkr?.nta_ketua || '________________'}</p>
          </div>
          <div className="text-center">
            <p>{data.ttdKota || 'Tasikmalaya'}, {data.ttdTanggal || '................ 20..'}</p>
            <p>Panitia Penyelenggara</p>
            <p>Ketua,</p>
            <div className="h-24"></div>
            <p className="font-bold underline">{data.ttdPanitia?.nama || '_______________________'}</p>
            <p>NTA. {data.ttdPanitia?.nta || '________________'}</p>
          </div>
        </div>
      </div>

      {/* PAGE 4 - DOKUMENTASI */}
      <div className="pdf-page pt-8">
        <div className="text-center font-bold mb-8 uppercase text-lg">
          DOKUMENTASI KEGIATAN
        </div>
        
        <div className="grid grid-cols-2 gap-8 px-8">
          {data.dokumentasi?.map((url: string, idx: number) => (
            <div key={idx} className="w-full aspect-[4/3] bg-gray-100 border border-gray-300 rounded overflow-hidden shadow">
              <img src={url} alt={`Doc ${idx}`} className="w-full h-full object-cover" crossOrigin="anonymous" />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
