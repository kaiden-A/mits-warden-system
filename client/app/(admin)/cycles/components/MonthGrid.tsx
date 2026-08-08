'use client';

import { MONTHS, WEEKDAYS, isoToLocal, cellsOf } from '../constants';
import type { ExcludedDate } from '../types';

export default function MonthGrid({ month, start, end, excluded, onToggle }: {
  month: Date;
  start: Date;
  end: Date;
  excluded: ExcludedDate[];
  onToggle: (ds: string) => void;
}) {
  return (
    <div>
      <p className="font-heading font-semibold text-sm mb-2">{MONTHS[month.getMonth()]} {month.getFullYear()}</p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(w => <div key={w} className="text-center text-[0.6rem] font-mono uppercase tracking-wider text-dim-text py-1">{w}</div>)}
        {cellsOf(month).map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = isoToLocal(d);
          const inRange = d >= start && d <= end;
          const ex = excluded.find(x => x.date === ds);
          return (
            <button key={i} type="button" onClick={() => onToggle(ds)}
              disabled={!inRange}
              title={ex ? ex.reason : undefined}
              className={`aspect-square text-xs flex items-center justify-center rounded border transition-colors ${
                !inRange ? 'text-dim-text/30 border-transparent' :
                ex ? 'bg-red-wash border-red text-red font-semibold' :
                'bg-white border-paper-line text-ink-text hover:border-brass'
              }`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
