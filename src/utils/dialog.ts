// Sistem popup global (pengganti alert() & confirm() bawaan browser).
// Dipakai lewat: import { showAlert as alert, showConfirm } from '../utils/dialog';

export type DialogType = 'success' | 'error' | 'warning' | 'info';

export interface AlertItem {
  id: number;
  kind: 'alert';
  type: DialogType;
  title: string;
  message: string;
  resolve: () => void;
}

export interface ConfirmItem {
  id: number;
  kind: 'confirm';
  type: DialogType;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
  resolve: (value: boolean) => void;
}

export type DialogItem = AlertItem | ConfirmItem;

type Listener = (queue: DialogItem[]) => void;

let queue: DialogItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l(queue));

export function subscribeDialog(listener: Listener): () => void {
  listeners.add(listener);
  listener(queue);
  return () => {
    listeners.delete(listener);
  };
}

export function closeDialog(id: number, result?: boolean) {
  const item = queue.find((q) => q.id === id);
  if (!item) return;
  queue = queue.filter((q) => q.id !== id);
  emit();
  if (item.kind === 'confirm') item.resolve(!!result);
  else item.resolve();
}

// Tebak jenis popup dari isi pesan (Indonesia)
function detectType(message: string): DialogType {
  const m = message.toLowerCase();
  if (/(gagal|error|kesalahan|tidak valid|bermasalah|ditolak)/.test(m)) return 'error';
  if (/(berhasil|sukses|disalin|tersimpan|terkirim|diterbitkan|ditambahkan|diperbarui|dihapus)/.test(m)) return 'success';
  if (/(wajib|minimal|harap|mohon|belum|tidak ada|pilih|isi )/.test(m)) return 'warning';
  return 'info';
}

const TITLES: Record<DialogType, string> = {
  success: 'Berhasil',
  error: 'Gagal',
  warning: 'Perhatian',
  info: 'Informasi',
};

export function showAlert(message: unknown, type?: DialogType): Promise<void> {
  const text = String(message ?? '');
  const t = type ?? detectType(text);
  return new Promise<void>((resolve) => {
    queue = [
      ...queue,
      { id: nextId++, kind: 'alert', type: t, title: TITLES[t], message: text, resolve },
    ];
    emit();
  });
}

export interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

export function showConfirm(message: unknown, options: ConfirmOptions = {}): Promise<boolean> {
  const text = String(message ?? '');
  const danger = options.danger ?? /hapus|delete|buang/i.test(text);
  return new Promise<boolean>((resolve) => {
    queue = [
      ...queue,
      {
        id: nextId++,
        kind: 'confirm',
        type: danger ? 'error' : 'warning',
        title: options.title ?? (danger ? 'Konfirmasi Hapus' : 'Konfirmasi'),
        message: text,
        confirmText: options.confirmText ?? (danger ? 'Ya, Hapus' : 'Ya, Lanjutkan'),
        cancelText: options.cancelText ?? 'Batal',
        danger,
        resolve,
      },
    ];
    emit();
  });
}
