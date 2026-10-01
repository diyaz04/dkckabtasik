/**
 * Membungkus window.fetch untuk semua request ke `/api/...`:
 *  1. Menambahkan `Authorization: Bearer <token>` dari localStorage (dkc_token).
 *  2. Kalau server membalas 401 (access token Supabase habis ±1 jam), otomatis menukar
 *     refresh token (dkc_refresh) lewat /api/auth/refresh lalu mengulang request satu kali.
 *  3. Kalau refresh gagal → sesi dibersihkan dan `onExpired` dipanggil (arahkan ke halaman login).
 *  4. Opsional `base`: awalan URL server (dipakai di app Android, di web dikosongkan).
 */
const TOKEN = 'dkc_token';
const REFRESH = 'dkc_refresh';
const SESSION_KEYS = [TOKEN, REFRESH, 'dkc_user', 'dkc_keca', 'dkc_saka'];

const store = {
  get: (k: string) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } },
  set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage diblokir */ } },
  remove: (k: string) => { try { localStorage.removeItem(k); } catch { /* abaikan */ } },
};

interface Options {
  base?: string;
  onExpired?: () => void;
}

export function installAuthFetch({ base = '', onExpired }: Options = {}) {
  const w = window as any;
  if (w.__authFetchInstalled) return;
  w.__authFetchInstalled = true;

  const original = window.fetch.bind(window);
  let refreshing: Promise<string> | null = null;

  const refreshToken = async (): Promise<string> => {
    const rt = store.get(REFRESH);
    if (!rt) return '';
    try {
      const res = await original(`${base}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) return '';
      const d = await res.json();
      if (!d?.token) return '';
      store.set(TOKEN, d.token);
      if (d.refresh_token) store.set(REFRESH, d.refresh_token);
      return d.token as string;
    } catch {
      return '';
    }
  };

  const withAuth = (init: RequestInit | undefined, token: string): RequestInit | undefined => {
    if (!token) return init;
    const headers = new Headers(init?.headers);
    // Hormati Authorization yang diisi pemanggil sendiri
    if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
    return { ...init, headers };
  };

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input !== 'string' || !input.startsWith('/api/')) return original(input, init);

    const isAuthCall = input.startsWith('/api/auth/login') || input.startsWith('/api/auth/refresh');
    const token = store.get(TOKEN);
    const res = await original(base + input, withAuth(init, token));
    if (res.status !== 401 || isAuthCall || !token) return res;

    // Token ditolak → coba perbarui sekali (satu proses refresh dibagi ke semua request yang gagal bersamaan)
    refreshing ??= refreshToken().finally(() => { refreshing = null; });
    const fresh = await refreshing;
    if (fresh) {
      const headers = new Headers(init?.headers);
      headers.delete('Authorization');
      return original(base + input, withAuth({ ...init, headers }, fresh));
    }

    SESSION_KEYS.forEach(store.remove);
    onExpired?.();
    return res;
  };
}
