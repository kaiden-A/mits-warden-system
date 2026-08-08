'use client';

import Modal from '@/app/components/Modal';
import type { Warden } from '../types';

export default function RevokeConfirmModal({ warden, onClose, onConfirm }: {
  warden: Warden | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
}) {
  return (
    <Modal open={!!warden} onClose={onClose}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="font-heading font-semibold text-lg">Tarik Akses {warden?.name}?</h3>
        <button type="button" onClick={onClose}
          className="text-dim-text hover:text-ink-text text-xl leading-none p-0.5">&times;</button>
      </div>
      <p className="text-sm text-ink-text mb-5">
        Ini akan menarik akses {warden?.name} ({warden?.email}). Laporan sedia ada kekal, tetapi mereka tidak lagi boleh log masuk atau menghantar laporan baharu.
      </p>
      <div className="flex justify-end gap-2 pt-4 border-t border-paper-line">
        <button type="button" onClick={onClose}
          className="px-3 py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
          Batal
        </button>
        <button type="button" onClick={() => warden && onConfirm(warden.id)}
          className="px-3 py-1.5 text-sm font-semibold rounded bg-transparent text-red border border-red hover:bg-red-wash transition-colors">
          Tarik Akses
        </button>
      </div>
    </Modal>
  );
}
