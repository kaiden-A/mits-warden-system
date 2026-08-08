'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';
import { iso, mondayOf, addDays } from '@/app/lib/constants';
import WeekFlip from '@/app/components/WeekFlip';
import { useToast } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PageHeader from '@/app/components/PageHeader';
import RosterTable from './components/RosterTable';
import type { RosterData } from './types';

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

  if (loading) {
    return <div className="text-center py-12 text-dim-text flex items-center justify-center gap-2"><LoadingSpinner size={18} />Memuatkan…</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Pengurusan"
        title="Jadual Warden Mingguan"
        subtitle="Jadual diterbitkan dari kitaran roster. Hubungi admin untuk perubahan tugasan."
      />

      <WeekFlip
        weekStart={weekStart}
        weekEnd={weekEnd}
        isCurrentWeek={isCurrentWeek}
        onPrev={() => { setLoading(true); setWeekStart(prev => addDays(prev, -7)); }}
        onNext={() => { setLoading(true); setWeekStart(prev => addDays(prev, 7)); }}
        onThisWeek={() => { setLoading(true); setWeekStart(mondayOf(new Date())); }}
      />

      <RosterTable days={days} roster={roster} />
    </div>
  );
}
