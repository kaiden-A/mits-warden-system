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
    <div className="flex items-center justify-center gap-2 sm:gap-3 font-mono font-semibold text-xs sm:text-sm uppercase tracking-wider py-2 px-2 sm:px-3 mb-2 bg-ink text-paper rounded-md">
      <button type="button" onClick={onPrev} aria-label="Minggu sebelumnya"
        className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-full border border-ink-line text-paper hover:bg-ink-soft transition-colors text-base leading-none flex-shrink-0">
        &#8249;
      </button>
      <span className="text-center truncate min-w-0">
        <span className="hidden sm:inline">Minggu </span>{fmtShort(weekStart)} – {fmtShort(weekEnd)}
      </span>
      <button type="button" onClick={onNext} disabled={isCurrentWeek} aria-label="Minggu seterusnya"
        className="w-8 h-8 sm:w-7 sm:h-7 flex items-center justify-center rounded-full border border-ink-line text-paper hover:bg-ink-soft transition-colors text-base leading-none disabled:opacity-35 disabled:cursor-not-allowed flex-shrink-0">
        &#8250;
      </button>
      {!isCurrentWeek && onThisWeek && (
        <button type="button" onClick={onThisWeek}
          className="h-8 sm:h-7 px-2 rounded border border-brass text-brass text-[0.6rem] sm:text-[0.68rem] hover:bg-ink-soft transition-colors flex-shrink-0">
          Minggu Ini
        </button>
      )}
    </div>
  );
}
