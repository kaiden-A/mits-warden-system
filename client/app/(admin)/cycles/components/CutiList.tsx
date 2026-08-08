'use client';

import { shortDate } from '../constants';
import type { ExcludedDate } from '../types';

export default function CutiList({ items, onUpdate, onRemove }: {
  items: ExcludedDate[];
  onUpdate: (ds: string, reason: string) => void;
  onRemove: (ds: string) => void;
}) {
  return (
    <div className="mt-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-dim-text mb-1.5">Senarai Tarikh Cuti ({items.length})</p>
      <div className="space-y-1.5">
        {[...items].sort((a, b) => a.date.localeCompare(b.date)).map(x => (
          <div key={x.date} className="flex items-center gap-2">
            <span className="font-mono text-xs text-dim-text whitespace-nowrap w-20">{shortDate(x.date)}</span>
            <input type="text" value={x.reason}
              onChange={e => onUpdate(x.date, e.target.value)}
              placeholder="Sebab cuti (cth: Cuti Raya)"
              className="flex-1 px-2.5 py-1.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
            <button type="button" onClick={() => onRemove(x.date)}
              className="text-red text-xs font-semibold hover:underline whitespace-nowrap">Padam</button>
          </div>
        ))}
      </div>
    </div>
  );
}
