'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';
import { iso, mondayOf, addDays, fmtShort, malayDay } from '@/app/lib/constants';
import WeekFlip from '@/app/components/WeekFlip';
import { useToast } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface RosterDay {
  date: string;
  day: string;
  putera: { id: string; name: string } | null;
  puteri: { id: string; name: string } | null;
}

interface RosterData {
  week_start: string;
  days: RosterDay[];
}

export default function AdminSchedulePage() {
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = iso(weekStart) === iso(mondayOf(new Date()));

  useEffect(() => {
    apiGet('/api/roster', { week_start: iso(weekStart) })
      .then(setRoster)
      .catch(() => showToast('Gagal memuatkan jadual.'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getDayRoster = (ds: string) => roster?.days?.find(d => d.date === ds);

  if (loading) {
    return <div className="text-center py-12 text-dim-text flex items-center justify-center gap-2"><LoadingSpinner size={18} />Memuatkan…</div>;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Pengurusan</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">Jadual Warden Mingguan</h2>
          <p className="text-xs font-mono mt-1 text-dim-text">Jadual diterbitkan dari kitaran roster. Hubungi admin untuk perubahan tugasan.</p>
        </div>
      </div>

      <WeekFlip
        weekStart={weekStart}
        weekEnd={weekEnd}
        isCurrentWeek={isCurrentWeek}
        onPrev={() => { setLoading(true); setWeekStart(prev => addDays(prev, -7)); }}
        onNext={() => { setLoading(true); setWeekStart(prev => addDays(prev, 7)); }}
        onThisWeek={() => { setLoading(true); setWeekStart(mondayOf(new Date())); }}
      />

      <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
        <div className="table-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full border-collapse min-w-[500px] sm:min-w-0">
            <thead>
              <tr>
                <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line w-[80px]">Hari</th>
                <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line w-[80px]">Tarikh</th>
                <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Asrama Putera</th>
                <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Asrama Puteri</th>
              </tr>
            </thead>
            <tbody>
              {days.map(d => {
                const ds = iso(d);
                const dayRoster = getDayRoster(ds);
                return (
                  <tr key={ds}>
                    <td className="py-3 px-2 border-b border-paper-line"><strong className="text-sm">{malayDay(d).slice(0, 3)}</strong></td>
                    <td className="py-3 px-2 border-b border-paper-line font-mono text-xs text-dim-text">{fmtShort(d)}</td>
                    <td className="py-3 px-2 border-b border-paper-line text-sm">
                      {dayRoster?.putera?.name || <span className="text-dim-text">—</span>}
                    </td>
                    <td className="py-3 px-2 border-b border-paper-line text-sm">
                      {dayRoster?.puteri?.name || <span className="text-dim-text">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
