'use client';

import { fmtShort, malayDay } from '@/app/lib/constants';

export default function WeekFlip({ weekStart, weekEnd, isCurrentWeek, onPrev, onNext, onThisWeek }: {
  weekStart: Date;
  weekEnd: Date;
  isCurrentWeek: boolean;
  onPrev: () => void;
  onNext: () => void;
  onThisWeek?: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 font-mono font-semibold text-sm uppercase tracking-wider py-2.5 px-3 mb-2 bg-ink text-paper rounded-md">
      <button type="button" onClick={onPrev} aria-label="Minggu sebelumnya"
        className="w-7 h-7 flex items-center justify-center rounded-full border border-ink-line text-paper hover:bg-ink-soft transition-colors text-base leading-none">
        &#8249;
      </button>
      <span>
        Minggu {fmtShort(weekStart)} – {fmtShort(weekEnd)}, {weekEnd.getFullYear()}
      </span>
      <button type="button" onClick={onNext} disabled={isCurrentWeek} aria-label="Minggu seterusnya"
        className="w-7 h-7 flex items-center justify-center rounded-full border border-ink-line text-paper hover:bg-ink-soft transition-colors text-base leading-none disabled:opacity-35 disabled:cursor-not-allowed">
        &#8250;
      </button>
      {!isCurrentWeek && onThisWeek && (
        <button type="button" onClick={onThisWeek}
          className="h-7 px-2 rounded border border-brass text-brass text-[0.68rem] hover:bg-ink-soft transition-colors">
          Minggu Ini
        </button>
      )}
    </div>
  );
}
