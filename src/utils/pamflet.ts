// Download pamflet berita sebagai PNG.
// Pakai html2canvas-pro karena html2canvas asli TIDAK mendukung warna oklch()
// yang dipakai Tailwind v4 (penyebab pamflet gagal diunduh).

async function toDataUrl(src: string): Promise<string | null> {
  if (!src) return null;
  if (src.startsWith('data:')) return src;
  try {
    const res = await fetch(src, { mode: 'cors', cache: 'no-store' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadPamflet(elementId: string, fileName: string): Promise<void> {
  const source = document.getElementById(elementId);
  if (!source) throw new Error('Elemen pamflet tidak ditemukan');

  const { default: html2canvas } = await import('html2canvas-pro');

  if ((document as any).fonts?.ready) {
    try { await (document as any).fonts.ready; } catch { /* abaikan */ }
  }

  // Klon pamflet ke wadah di luar modal (modal bersifat fixed + scroll → capture sering meleset/blank)
  const width = source.offsetWidth;
  const wrap = document.createElement('div');
  wrap.style.cssText = `position:absolute;left:0;top:0;width:${width}px;z-index:-1;pointer-events:none;background:#fff;`;
  const clone = source.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.style.width = `${width}px`;
  clone.style.maxWidth = `${width}px`;
  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  try {
    // Ubah semua gambar jadi data URL agar bebas masalah CORS
    const imgs = Array.from(clone.querySelectorAll('img'));
    await Promise.all(
      imgs.map(async (img) => {
        const dataUrl = await toDataUrl(img.currentSrc || img.src);
        if (dataUrl) {
          img.removeAttribute('crossorigin');
          img.src = dataUrl;
        } else {
          img.style.display = 'none'; // gambar tak bisa diambil → tetap unduh tanpa foto
        }
      })
    );
    await Promise.all(
      imgs
        .filter((img) => img.style.display !== 'none')
        .map((img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
        )
    );

    const canvas = await html2canvas(clone, {
      useCORS: true,
      scale: 2.5,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Gagal membuat gambar pamflet');

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
  } finally {
    document.body.removeChild(wrap);
  }
}
