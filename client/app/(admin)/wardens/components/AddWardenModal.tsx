'use client';

import { useState } from 'react';
import Modal from '@/app/components/Modal';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';
import type { AddWardenPayload } from '../types';

export default function AddWardenModal({ open, busy, onClose, onAdd }: {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onAdd: (payload: AddWardenPayload) => void;
}) {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [hostel, setHostel] = useState('Asrama Putera');

  const handleAdd = () => {
    if (!email.trim()) {
      showToast('Sila isi emel warden.');
      return;
    }
    if (!name.trim()) {
      showToast('Sila isi nama warden.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      showToast('Format emel tidak sah.');
      return;
    }
    onAdd({ email: email.trim(), name: name.trim(), hostel });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <h3 className="font-heading font-semibold text-lg">Tambah Warden</h3>
        <button type="button" onClick={onClose}
          className="text-dim-text hover:text-ink-text text-xl leading-none p-0.5">&times;</button>
      </div>
      <div className="mb-4">
        <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Emel</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="cth. nama@example.com"
          className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
      </div>
      <div className="mb-4">
        <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Nama</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          placeholder="Cth. Muhammad Ali Bin Ahmad"
          className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
      </div>
      <div className="mb-4">
        <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Asrama</label>
        <select value={hostel} onChange={e => setHostel(e.target.value)}
          className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass">
          <option value="Asrama Putera">Asrama Putera</option>
          <option value="Asrama Puteri">Asrama Puteri</option>
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-paper-line">
        <button type="button" onClick={onClose}
          className="px-3 py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
          Batal
        </button>
        <button type="button" onClick={handleAdd} disabled={busy}
          className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center gap-2">
          {busy && <LoadingSpinner size={16} />}
          {busy ? 'Menambah…' : 'Tambah ke Senarai'}
        </button>
      </div>
    </Modal>
  );
}
