'use client';

import LoadingSpinner from '@/app/components/LoadingSpinner';
import { fmtRange } from '../constants';
import type { CycleSummary } from '../types';

export default function CycleList({ cycles, busy, openingCycle, onOpen }: {
  cycles: CycleSummary[];
  busy: boolean;
  openingCycle: boolean;
  onOpen: (id: string) => void;
}) {
  if (cycles.length === 0) {
    return <p className="text-sm text-dim-text text-center py-8">Belum ada kitaran. Klik &quot;+ Cipta Kitaran&quot; untuk mula.</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {cycles.map(c => (
        <div key={c.id} className="border border-paper-line rounded-lg p-4 hover:bg-paper transition-colors">
          <p className="font-heading font-semibold text-sm mb-1">{c.name}</p>
          <p className="text-xs text-dim-text font-mono mb-3">{fmtRange(c.start_date, c.end_date)}</p>
          <button type="button" onClick={() => onOpen(c.id)} disabled={busy || openingCycle}
            className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2">
            {openingCycle && <LoadingSpinner size={12} />}
            {openingCycle ? 'Membuka…' : 'Buka Jadual'}
          </button>
        </div>
      ))}
    </div>
  );
}
