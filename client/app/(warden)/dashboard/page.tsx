'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/app/lib/api';
import { iso, mondayOf, addDays, fmtLong } from '@/app/lib/constants';
import WeekProgress from '@/app/components/WeekProgress';
import { useToast } from '@/app/components/Toast';
import PageHeader from '@/app/components/PageHeader';
import StatCards from './components/StatCards';
import TodayCard from './components/TodayCard';
import WeekRecap from './components/WeekRecap';
import type { DashboardData, RosterDay } from './types';

export default function WardenDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [roster, setRoster] = useState<RosterDay[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = iso(new Date());
  const weekStart = mondayOf(new Date());

  useEffect(() => {
    Promise.allSettled([
      apiGet('/api/dashboard'),
      apiGet('/api/roster', { week_start: iso(weekStart) }),
    ]).then(results => {
      if (results[0].status === 'fulfilled') setData(results[0].value);
      else showToast('Gagal memuatkan dashboard.');
      if (results[1].status === 'fulfilled') setRoster(results[1].value.days || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-dim-text">Memuatkan…</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-dim-text">Ralat memuatkan data.</div>;
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const pastDays = weekDays.filter(d => d <= new Date());

  return (
    <div>
      <PageHeader eyebrow={fmtLong(new Date())} title="Dashboard" />

      <StatCards stats={data.stats} />

      <TodayCard
        reportStatus={data.today?.report}
        isScheduled={data.today?.is_user_on_duty || false}
        onGoToday={() => router.push('/today')}
      />

      <WeekRecap days={pastDays} roster={roster} />

      <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
        <h3 className="font-heading font-semibold text-base mb-3">Kemajuan Minggu Ini</h3>
        <WeekProgress days={data.week_progress} today={todayStr} />
      </div>
    </div>
  );
}
