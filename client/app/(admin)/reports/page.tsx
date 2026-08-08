'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/app/lib/api';
import { iso, mondayOf, addDays } from '@/app/lib/constants';
import type { ReportDetail } from '@/app/lib/types';
import { generateDailyReportPdf } from '@/app/lib/dailyReportPdf';
import WeekFlip from '@/app/components/WeekFlip';
import { useToast } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PageHeader from '@/app/components/PageHeader';
import DayGroup from './components/DayGroup';

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [reportDetails, setReportDetails] = useState<Record<string, ReportDetail>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = iso(weekStart) === iso(mondayOf(new Date()));

  const changeWeek = (next: (prev: Date) => Date) => {
    setLoading(true);
    setReportDetails({});
    setExpandedIds({});
    setWeekStart(next);
  };

  useEffect(() => {
    apiGet('/api/reports', { week_start: iso(weekStart), scope: 'all' })
      .then(setReports)
      .catch(() => showToast('Gagal memuatkan laporan.'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const reportsForDay = (ds: string) => reports.filter(r => r.date === ds);

  const toggleDetail = async (id: string) => {
    if (expandedIds[id]) {
      setExpandedIds(prev => ({ ...prev, [id]: false }));
      return;
    }

    if (!reportDetails[id]) {
      try {
        const detail = await apiGet(`/api/reports/${id}`);
        setReportDetails(prev => ({ ...prev, [id]: detail }));
      } catch {
        showToast('Gagal memuatkan butiran laporan.');
        return;
      }
    }

    setExpandedIds(prev => ({ ...prev, [id]: true }));
  };

  const updateReportLocally = (id: string, updates: Partial<ReportDetail>) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const handleReview = async (id: string, adminNote: string) => {
    setActionLoading(id);
    try {
      await apiPost(`/api/reports/${id}/review`, { admin_note: adminNote });
      updateReportLocally(id, { status: 'reviewed' });
      showToast('Laporan ditanda sebagai disemak.');
      const detail = await apiGet(`/api/reports/${id}`);
      setReportDetails(prev => ({ ...prev, [id]: detail }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyemak laporan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async (id: string, adminNote: string) => {
    setActionLoading(id);
    try {
      await apiPost(`/api/reports/${id}/flag`, { admin_note: adminNote });
      updateReportLocally(id, { status: 'flagged' });
      showToast('Laporan ditanda untuk tindakan.');
      const detail = await apiGet(`/api/reports/${id}`);
      setReportDetails(prev => ({ ...prev, [id]: detail }));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menanda laporan.');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePrintDay = async (ds: string, dayReports: ReportDetail[]) => {
    setPdfBusy(ds);
    try {
      const details = await Promise.all(
        dayReports.map(r =>
          reportDetails[r.id] ? Promise.resolve(reportDetails[r.id]) : apiGet(`/api/reports/${r.id}`)
        )
      );
      await generateDailyReportPdf({ date: ds, reports: details });
      showToast('PDF laporan harian telah dimuat turun.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menjana PDF.');
    } finally {
      setPdfBusy(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-dim-text flex items-center justify-center gap-2"><LoadingSpinner size={18} />Memuatkan…</div>;
  }

  return (
    <div>
      <PageHeader eyebrow="Semakan" title="Laporan" />

      <WeekFlip
        weekStart={weekStart}
        weekEnd={weekEnd}
        isCurrentWeek={isCurrentWeek}
        onPrev={() => changeWeek(prev => addDays(prev, -7))}
        onNext={() => changeWeek(prev => addDays(prev, 7))}
        onThisWeek={() => changeWeek(() => mondayOf(new Date()))}
      />

      <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
        {days.map(d => (
          <DayGroup key={iso(d)}
            day={d}
            dayReports={reportsForDay(iso(d))}
            pdfBusy={pdfBusy}
            expandedIds={expandedIds}
            reportDetails={reportDetails}
            actionLoading={actionLoading}
            onPrintDay={handlePrintDay}
            onToggle={toggleDetail}
            onFlag={handleFlag}
            onReview={handleReview}
          />
        ))}
      </div>
    </div>
  );
}
