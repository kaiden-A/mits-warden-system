'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/app/lib/api';
import { iso, mondayOf, addDays } from '@/app/lib/constants';
import type { ReportDetail } from '@/app/lib/types';
import WeekFlip from '@/app/components/WeekFlip';
import { useToast } from '@/app/components/Toast';
import PageHeader from '@/app/components/PageHeader';
import HistoryRow from './components/HistoryRow';
import ReportDetailModal from './components/ReportDetailModal';

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [detailReport, setDetailReport] = useState<ReportDetail | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = iso(weekStart) === iso(mondayOf(new Date()));

  useEffect(() => {
    apiGet('/api/reports', { week_start: iso(weekStart) })
      .then(setReports)
      .catch(() => showToast('Gagal memuatkan laporan.'));
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getReportForDate = (ds: string) => reports.find(r => r.date === ds);

  const openDetail = async (id: string) => {
    try {
      const r = await apiGet(`/api/reports/${id}`);
      setDetailReport(r);
    } catch {
      showToast('Gagal memuatkan laporan.');
    }
  };

  return (
    <div>
      <PageHeader eyebrow="Entri anda" title="Sejarah Laporan" />

      <WeekFlip
        weekStart={weekStart}
        weekEnd={weekEnd}
        isCurrentWeek={isCurrentWeek}
        onPrev={() => setWeekStart(prev => addDays(prev, -7))}
        onNext={() => setWeekStart(prev => addDays(prev, 7))}
        onThisWeek={() => setWeekStart(mondayOf(new Date()))}
      />

      <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4">
        {days.map(d => (
          <HistoryRow key={iso(d)}
            day={d}
            report={getReportForDate(iso(d))}
            onAdd={ds => router.push(`/today?date=${ds}`)}
            onOpen={openDetail}
          />
        ))}
      </div>

      <ReportDetailModal
        report={detailReport}
        fallbackName={user?.name}
        onClose={() => setDetailReport(null)}
      />
    </div>
  );
}
