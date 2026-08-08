'use client';

import Modal from '@/app/components/Modal';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import type { SignatureBlock } from '../types';

export default function PdfModal({ open, busy, signatures, institution, onInstitutionChange, onSignatureChange, onGenerate, onClose }: {
  open: boolean;
  busy: boolean;
  signatures: SignatureBlock[];
  institution: string;
  onInstitutionChange: (value: string) => void;
  onSignatureChange: (index: number, updates: Partial<SignatureBlock>) => void;
  onGenerate: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-heading font-semibold text-lg">Cetak Jadual PDF</h3>
          <p className="text-xs font-mono text-dim-text mt-1">Isi maklumat untuk bahagian tandatangan.</p>
        </div>
        <button type="button" onClick={onClose}
          className="text-dim-text hover:text-ink-text text-xl leading-none p-0.5">&times;</button>
      </div>
      <div className="space-y-4">
        <div className="border border-paper-line rounded-lg p-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-dim-text mb-2">Institusi</p>
          <input type="text" value={institution}
            onChange={e => onInstitutionChange(e.target.value)}
            className="w-full px-2.5 py-2 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
        </div>
        {signatures.map((s, i) => (
          <div key={i} className="border border-paper-line rounded-lg p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-dim-text mb-2">{s.label}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.65rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Nama</label>
                <input type="text" value={s.name}
                  onChange={e => onSignatureChange(i, { name: e.target.value })}
                  className="w-full px-2.5 py-2 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
              </div>
              <div>
                <label className="block text-[0.65rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Jawatan</label>
                <input type="text" value={s.position}
                  onChange={e => onSignatureChange(i, { position: e.target.value })}
                  className="w-full px-2.5 py-2 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-paper-line">
        <button type="button" onClick={onClose}
          className="px-3 py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
          Batal
        </button>
        <button type="button" onClick={onGenerate} disabled={busy}
          className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center gap-2">
          {busy && <LoadingSpinner size={16} />}
          {busy ? 'Menjana PDF…' : 'Jana PDF'}
        </button>
      </div>
    </Modal>
  );
}
