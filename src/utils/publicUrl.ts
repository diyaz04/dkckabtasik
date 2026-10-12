/**
 * Alamat publik website untuk tautan yang dicetak/dibagikan (mis. QR validasi dokumen).
 * Di web = origin halaman. Di app Android origin-nya https://localhost (tidak bisa dibuka orang lain),
 * jadi dipakai VITE_API_BASE (alamat server produksi yang juga melayani website).
 */
export function publicOrigin(): string {
  const base = String((import.meta as any).env?.VITE_API_BASE || '').replace(/\/+$/, '');
  return base || window.location.origin;
}

export const validasiLaporanUrl = (laporanId: string) => `${publicOrigin()}/#/validasi-laporan/${laporanId}`;
