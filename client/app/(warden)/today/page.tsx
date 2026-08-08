'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { apiGet, apiPost, apiPatch } from '@/app/lib/api';
import { iso, fromISO, fmtLong, isReportComplete } from '@/app/lib/constants';
import type { ReportDetail } from '@/app/lib/types';
import { useToast } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PageHeader from '@/app/components/PageHeader';
import Stamp from '@/app/components/Stamp';
import ReportForm from '@/app/components/ReportForm';
import NoReportCard from './components/NoReportCard';
import RecordedReportCard from './components/RecordedReportCard';
import ReportDetailModal from './components/ReportDetailModal';

function TodayPageInner() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailReport, setDetailReport] = useState<ReportDetail | null>(null);

  const searchParams = useSearchParams();
  const paramDate = searchParams.get('date');
  const targetDate = paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate) ? paramDate : iso(new Date());
  const todayStr = targetDate;

  useEffect(() => {
    const target = fromISO(todayStr);
    const todayWeekStart = iso(new Date(target.getFullYear(), target.getMonth(), target.getDate() - target.getDay() + 1));
    apiGet('/api/reports', { week_start: todayWeekStart })
      .then((reports: ReportDetail[]) => {
        const todayReport = reports.find(r => r.date === todayStr);
        if (todayReport) {
          setReportId(todayReport.id);
          return apiGet(`/api/reports/${todayReport.id}`).then(setReport);
        }
        setReport(null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [todayStr]);

  const handleSave = async (data: ReportDetail, status: string) => {
    setSaving(true);
    try {
      const isSubmitting = status === 'submitted';

      if (isSubmitting && !isReportComplete(data as unknown as Record<string, unknown>)) {
        showToast('Sila lengkapkan semua bahagian sebelum menghantar.');
        setSaving(false);
        return;
      }

      if (reportId && report?.status === 'draft') {
        const updated = await apiPatch(`/api/reports/${reportId}`, data);
        setReport(updated);
        setReportId(updated.id);
        if (isSubmitting) {
          const submitted = await apiPost(`/api/reports/${updated.id}/submit`);
          setReport(submitted);
        }
      } else if (reportId && report?.status === 'submitted') {
        showToast('Laporan sudah dihantar.');
        setShowForm(false);
        setSaving(false);
        return;
      } else {
        const created = await apiPost('/api/reports', { ...data, status: 'draft' });
        setReport(created);
        setReportId(created.id);
        if (isSubmitting) {
          const submitted = await apiPost(`/api/reports/${created.id}/submit`);
          setReport(submitted);
        }
      }

      setShowForm(false);
      showToast(isSubmitting ? 'Laporan dihantar.' : 'Draf disimpan.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('draft')) {
        setReport(prev => prev ? { ...prev, status: 'submitted' } : prev);
        setShowForm(false);
      } else if (msg.includes('already')) {
        setShowForm(false);
      }
      showToast(msg || 'Gagal menyimpan laporan.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitDraft = async () => {
    if (!reportId) return;
    if (!report || !isReportComplete(report as unknown as Record<string, unknown>)) {
      showToast('Sila lengkapkan semua bahagian sebelum menghantar.');
      return;
    }
    setSaving(true);
    try {
      await apiPost(`/api/reports/${reportId}/submit`);
      setReport(prev => prev ? { ...prev, status: 'submitted' } : prev);
      showToast('Laporan dihantar.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('draft')) {
        setReport(prev => prev ? { ...prev, status: 'submitted' } : prev);
      }
      showToast(msg || 'Gagal menghantar.');
    } finally {
      setSaving(false);
    }
  };

  const handleViewDetail = async () => {
    if (!reportId) return;
    const r = await apiGet(`/api/reports/${reportId}`);
    setDetailReport(r);
  };

  if (loading) {
    return <div className="text-center py-12 text-dim-text flex items-center justify-center gap-2"><LoadingSpinner size={18} />Memuatkan…</div>;
  }

  const dateLabel = fmtLong(fromISO(todayStr));

  if (showForm || (!report && !showForm)) {
    if (!showForm && !report) {
      return (
        <div>
          <PageHeader eyebrow={dateLabel} title="Laporan Hari Ini" />
          <NoReportCard onStart={() => setShowForm(true)} />
        </div>
      );
    }

    if (showForm && user) {
      return (
        <ReportForm
          report={report}
          wardenName={user.name}
          wardenHostel={user.hostel || ''}
          dateStr={todayStr}
          scheduledWardenName={null}
          isSubstitution={false}
          isReadOnly={false}
          saving={saving}
          onSave={handleSave}
        />
      );
    }
  }

  if (report && !showForm) {
    return (
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <div>
            <span className="block font-mono text-[0.68rem] uppercase tracking-wider text-dim-text mb-0.5">{dateLabel}</span>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink-text">Laporan Hari Ini</h2>
          </div>
          <Stamp status={report.status} />
        </div>

        <RecordedReportCard
          report={report}
          saving={saving}
          onEdit={() => setShowForm(true)}
          onSubmitDraft={handleSubmitDraft}
          onView={handleViewDetail}
        />

        <ReportDetailModal
          report={detailReport}
          fallbackName={user?.name}
          onClose={() => setDetailReport(null)}
        />
      </div>
    );
  }

  return null;
}

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-dim-text">Memuatkan…</div>}>
      <TodayPageInner />
    </Suspense>
  );
}
