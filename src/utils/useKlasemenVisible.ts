import { useEffect, useState } from 'react';

// Satu sumber kebenaran untuk visibilitas klasemen di sisi publik
// (Navbar + section Klasemen di LandingPage). Nilainya diatur admin
// lewat site_content dengan section_key 'klasemen'.
const CACHE_KEY = 'dkc_show_klasemen';

const readCache = (): boolean => {
  try {
    return sessionStorage.getItem(CACHE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const cacheKlasemenVisible = (visible: boolean) => {
  try {
    sessionStorage.setItem(CACHE_KEY, String(visible));
  } catch {
    /* sessionStorage tidak tersedia, abaikan */
  }
};

// Belum ada row 'klasemen' di database = default tampil.
export const parseKlasemenVisible = (siteContent: unknown): boolean => {
  const row = Array.isArray(siteContent)
    ? siteContent.find((item: any) => item?.section_key === 'klasemen')
    : undefined;
  return row?.content?.show_klasemen !== false;
};

/**
 * Nilai awal diambil dari cache sesi (kalau ada), kalau belum ada dianggap
 * tersembunyi sampai server menjawab. Jadi saat klasemen dinonaktifkan,
 * section/menu-nya tidak sempat "berkedip" muncul dulu.
 */
export function useKlasemenVisible(): boolean {
  const [visible, setVisible] = useState<boolean>(readCache);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/site_content')
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const next = parseKlasemenVisible(data);
        cacheKlasemenVisible(next);
        setVisible(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return visible;
}
