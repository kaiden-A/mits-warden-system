'use client';

import { HOSTELS, iso, fmtShort, malayDay } from '@/app/lib/constants';
import type { RosterDay } from '../types';

export default function WeekRecap({ days, roster }: {
  days: Date[];
  roster: RosterDay[];
}) {
  const rosterMap = new Map(roster.map(d => [d.date, d]));

  const dutyWardenName = (hostel: string, dayRoster: RosterDay | undefined) => {
    if (!dayRoster) return '—';
    return hostel === 'Asrama Putera' ? dayRoster.putera?.name || '—' : dayRoster.puteri?.name || '—';
  };

  if (days.length === 0) return null;

  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4 mb-5">
      <h3 className="font-heading font-semibold text-sm sm:text-base mb-3">Rekap Minggu Ini</h3>
      <div className="flex flex-col gap-2">
        {days.map(d => {
          const ds = iso(d);
          const dayRoster = rosterMap.get(ds);
          return (
            <div key={ds} className="p-2.5 bg-paper rounded">
              <div className="font-heading font-semibold text-sm text-ink-text mb-1">
                {malayDay(d)}, {fmtShort(d)}
              </div>
              {HOSTELS.map(hostel => {
                const wn = dutyWardenName(hostel, dayRoster);
                return (
                  <div key={hostel} className="flex items-center gap-2 py-1 text-sm">
                    <span className="font-semibold text-xs sm:text-sm min-w-[90px] sm:min-w-[110px] text-ink-text">{hostel === 'Asrama Putera' ? 'Putera' : 'Puteri'}</span>
                    <span className="text-xs text-dim-text truncate">{wn}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
