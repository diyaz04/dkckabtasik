/**
 * Helper utility for QR code preview and high-resolution PNG download
 * Dewan Kerja Cabang Kabupaten Tasikmalaya
 */

export const getPesertaDisplayName = (data: any, schema?: any[]): string => {
  if (!data) return 'Peserta';
  const direct = data.nama_lengkap || data.nama || data.nama_peserta || data.full_name;
  if (direct) return String(direct);
  if (schema && schema.length > 0) {
    const bukanPeserta = /kwarran|kwartir|kecamatan|ranting|pangkalan|gudep|sekolah|ayah|ibu|orang.*tua|wali|pembina|pembimbing|kegiatan/i;
    const namaField = schema.find((f: any) =>
      /nama|name/i.test(f.label || '') && !bukanPeserta.test(f.label || '') && data[f.id]
    );
    if (namaField) return String(data[namaField.id]);
    const firstField = schema.find((f: any) => f.type !== 'file' && !bukanPeserta.test(f.label || '') && data[f.id]);
    if (firstField) return String(data[firstField.id]);
  }
  return data[Object.keys(data).find(k => !k.startsWith('_')) || ''] || 'Peserta';
};

export interface QrDownloadOptions {
  title?: string;
  subtitle?: string;
  badgeText?: string;
  badgeColor?: string;
  footerText?: string;
}

/**
 * Converts an SVG QR code element into a crisp, official high-resolution PNG credential card
 */
export const downloadQrCodeImage = (
  svgElementOrId: string | SVGElement,
  fileName: string,
  options?: QrDownloadOptions
): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const svg = typeof svgElementOrId === 'string' 
        ? document.getElementById(svgElementOrId) 
        : svgElementOrId;

      if (!svg) {
        console.warn(`[qrDownload] SVG element not found:`, svgElementOrId);
        return resolve();
      }

      const clonedSvg = svg.cloneNode(true) as SVGElement;
      clonedSvg.setAttribute('width', '500');
      clonedSvg.setAttribute('height', '500');
      if (!clonedSvg.getAttribute('xmlns')) {
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }

      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        try {
          const qrSize = 460;
          const padding = 40;
          const headerHeight = options?.title ? 135 : 40;
          const footerHeight = 60;
          const canvas = document.createElement('canvas');
          canvas.width = qrSize + (padding * 2);
          canvas.height = qrSize + headerHeight + footerHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            URL.revokeObjectURL(url);
            return resolve();
          }

          // Background
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Top Accent Color Bar
          ctx.fillStyle = options?.badgeColor || '#0E9F6E';
          ctx.fillRect(0, 0, canvas.width, 10);

          // Card Outer Border
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 2;
          ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

          let y = 42;

          // Badge pill
          if (options?.badgeText) {
            const isBlue = options.badgeColor === '#2563EB' || options.badgeColor?.includes('blue');
            ctx.fillStyle = isBlue ? '#EFF6FF' : '#ECFDF5';
            const pillWidth = 260;
            const pillHeight = 28;
            const pillX = (canvas.width - pillWidth) / 2;
            
            ctx.beginPath();
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(pillX, y - 20, pillWidth, pillHeight, 14);
            } else {
              ctx.rect(pillX, y - 20, pillWidth, pillHeight);
            }
            ctx.fill();

            ctx.fillStyle = options.badgeColor || '#059669';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(options.badgeText, canvas.width / 2, y);
            y += 30;
          }

          // Title / Participant Name
          if (options?.title) {
            ctx.fillStyle = '#0F172A';
            ctx.font = 'bold 22px sans-serif';
            ctx.textAlign = 'center';
            const displayTitle = options.title.length > 28 ? options.title.slice(0, 28) + '...' : options.title;
            ctx.fillText(displayTitle.toUpperCase(), canvas.width / 2, y);
            y += 24;
          }

          // Subtitle / Event & Kwarran
          if (options?.subtitle) {
            ctx.fillStyle = '#64748B';
            ctx.font = '13px sans-serif';
            ctx.textAlign = 'center';
            const displaySub = options.subtitle.length > 40 ? options.subtitle.slice(0, 40) + '...' : options.subtitle;
            ctx.fillText(displaySub, canvas.width / 2, y);
          }

          // Draw QR Code in Center
          ctx.drawImage(img, padding, headerHeight, qrSize, qrSize);

          // Footer
          ctx.fillStyle = '#94A3B8';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(options?.footerText || 'DEWAN KERJA CABANG KABUPATEN TASIKMALAYA', canvas.width / 2, canvas.height - 24);

          const pngUrl = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.download = `${fileName.replace(/[/\\?%*:|"<>]/g, '_')}.png`;
          a.href = pngUrl;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (err) {
          console.error('[qrDownload] Error generating canvas:', err);
        } finally {
          URL.revokeObjectURL(url);
          resolve();
        }
      };

      img.onerror = (e) => {
        console.error('[qrDownload] Error loading SVG as image:', e);
        URL.revokeObjectURL(url);
        resolve();
      };

      img.src = url;
    } catch (e) {
      console.error('[qrDownload] Error:', e);
      resolve();
    }
  });
};

/**
 * Downloads both QR Validasi and QR Check-in for a participant with one click
 */
export const downloadBothQrImages = async (
  valSvgId: string,
  chkSvgId: string,
  name: string,
  agendaName: string,
  kwarran: string,
  id: string
) => {
  await downloadQrCodeImage(
    valSvgId,
    `QR_Validasi_${name}_${id.slice(0, 8)}`,
    {
      title: name,
      subtitle: `${agendaName} • ${kwarran}`,
      badgeText: 'QR DOKUMEN VALIDASI',
      badgeColor: '#2563EB'
    }
  );

  setTimeout(async () => {
    await downloadQrCodeImage(
      chkSvgId,
      `QR_Checkin_${name}_${id.slice(0, 8)}`,
      {
        title: name,
        subtitle: `${agendaName} • ${kwarran}`,
        badgeText: 'QR CHECK-IN KEHADIRAN',
        badgeColor: '#059669'
      }
    );
  }, 400);
};
