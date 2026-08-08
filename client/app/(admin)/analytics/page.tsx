'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/app/lib/api';
import { iso, mondayOf, addDays } from '@/app/lib/constants';
import WeekFlip from '@/app/components/WeekFlip';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PageHeader from '@/app/components/PageHeader';
import { useToast } from '@/app/components/Toast';
import StatusChart from './components/StatusChart';
import LateChart from './components/LateChart';
import SectionRatingsChart from './components/SectionRatingsChart';
import SectionHealthChart from './components/SectionHealthChart';
import type { AnalyticsData } from './types';

export default function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = iso(weekStart) === iso(mondayOf(new Date()));

  const changeWeek = (next: (prev: Date) => Date) => {
    setLoading(true);
    setWeekStart(next);
  };

  useEffect(() => {
    apiGet('/api/analytics', { week_start: iso(weekStart) })
      .then(setData)
      .catch(() => showToast('Gagal memuatkan statistik.'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  if (loading) {
    return <div className="text-center py-12 text-dim-text flex items-center justify-center gap-2"><LoadingSpinner size={18} />Memuatkan…</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-dim-text">Ralat memuatkan statistik.</div>;
  }

  return (
    <div>
      <PageHeader eyebrow="Analisis" title="Statistik" />

      <WeekFlip
        weekStart={weekStart}
        weekEnd={weekEnd}
        isCurrentWeek={isCurrentWeek}
        onPrev={() => changeWeek(prev => addDays(prev, -7))}
        onNext={() => changeWeek(prev => addDays(prev, 7))}
        onThisWeek={() => changeWeek(() => mondayOf(new Date()))}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <StatusChart week={data.week} />
        <LateChart week={data.week} />
        <SectionRatingsChart sections={data.sections} />
        <SectionHealthChart sections={data.sections} />
      </div>
    </div>
  );
}
