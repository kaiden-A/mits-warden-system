'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { apiGet, apiPost, apiPatch } from '@/app/lib/api';
import { iso } from '@/app/lib/constants';
import { useToast } from '@/app/components/Toast';
import ReportForm from '@/app/components/ReportForm';
import Stamp from '@/app/components/Stamp';
import { SectionAccordionReadOnly } from '@/app/components/SectionAccordion';
import { SECTIONS_CONFIG, fmtLong, fromISO, countRatedSections, statusLabel } from '@/app/lib/constants';
import ApprovalTrail from '@/app/components/ApprovalTrail';
import Modal from '@/app/components/Modal';

export default function TodayPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [report, setReport] = useState<any>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detailReport, setDetailReport] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const todayStr = iso(new Date());

  useEffect(() => {
    const todayWeekStart = iso(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - new Date().getDay() + 1));
    apiGet('/api/reports', { week_start: todayWeekStart })
      .then((reports: any[]) => {
        const todayReport = reports.find((r: any) => r.date === todayStr);
        if (todayReport) {
          setReportId(todayReport.id);
          return apiGet(`/api/reports/${todayReport.id}`).then(setReport);
        }
        setReport(null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (data: any, status: string) => {
    setSaving(true);
    try {
      const isSubmitting = status === 'submitted';

      if (reportId && report?.status === 'draft') {
        const updated = await apiPatch(`/api/reports/${reportId}`, data);
        setReport(updated);
        setReportId(updated.id);
        if (isSubmitting) {
          await apiPost(`/api/reports/${updated.id}/submit`);
          setReport({ ...updated, status: 'submitted' });
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
          await apiPost(`/api/reports/${created.id}/submit`);
          setReport({ ...created, status: 'submitted' });
        }
      }

      setShowForm(false);
      showToast(isSubmitting ? 'Laporan dihantar.' : 'Draf disimpan.');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('draft')) {
        setReport((prev: any) => prev ? { ...prev, status: 'submitted' } : prev);
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
    setSaving(true);
    try {
      await apiPost(`/api/reports/${reportId}/submit`);
      setReport((prev: any) => ({ ...prev, status: 'submitted' }));
      showToast('Laporan dihantar.');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('draft')) {
        setReport((prev: any) => prev ? { ...prev, status: 'submitted' } : prev);
      }
      showToast(msg || 'Gagal menghantar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-dim-text">Memuatkan…</div>;
  }

  const dateLabel = fmtLong(new Date());

  if (showForm || (!report && !showForm)) {
    if (!showForm && !report) {
      return (
        <div>
          <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
            <div>
              <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">{dateLabel}</span>
              <h2 className="font-heading text-2xl font-bold text-ink-text">Laporan Hari Ini</h2>
            </div>
          </div>
          <div className="bg-paper-raised border border-paper-line rounded-lg p-6 sm:p-8 text-center">
            <span className="material-symbols-outlined text-4xl sm:text-5xl text-dim-text opacity-40 mb-3 block">description</span>
            <h3 className="font-heading font-semibold text-base sm:text-lg mb-2">Belum ada laporan untuk hari ini</h3>
            <p className="text-sm text-dim-text max-w-xs mx-auto mb-6">
              Sila lengkapkan laporan pemeriksaan harian untuk hari ini.
            </p>
            <button type="button" onClick={() => setShowForm(true)}
              className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-base font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors">
              Buat Laporan Baru
            </button>
          </div>
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
          onSave={handleSave}
        />
      );
    }
  }

  if (report && !showForm) {
    const isDraft = report.status === 'draft';
    return (
      <div>
        <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
          <div>
            <span className="block font-mono text-[0.68rem] uppercase tracking-wider text-dim-text mb-0.5">{dateLabel}</span>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-ink-text">Laporan Hari Ini</h2>
          </div>
          <Stamp status={report.status} />
        </div>

        <div className="bg-paper-raised border border-paper-line rounded-lg p-6 sm:p-8 text-center">
          <span className={`material-symbols-outlined text-3xl mb-2 block ${isDraft ? 'text-dim-text' : 'text-green'}`}>
            {isDraft ? 'edit_note' : 'check_circle'}
          </span>
          <h3 className="font-heading font-semibold text-base sm:text-lg">Laporan telah direkodkan</h3>
          <div className="text-sm text-dim-text mt-1 mb-3">
            {countRatedSections(report)}/11 bahagian dinilai
            · {report.inspection_time || '—'}
          </div>
          {isDraft && (
            <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
              <button type="button" onClick={() => setShowForm(true)}
                className="w-full sm:w-auto px-4 py-3 sm:py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
                Sunting Draf
              </button>
              <button type="button" onClick={handleSubmitDraft} disabled={saving}
                className="w-full sm:w-auto px-4 py-3 sm:py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors">
                {saving ? '…' : 'Hantar Laporan'}
              </button>
            </div>
          )}
          {!isDraft && (
            <button type="button" onClick={async () => {
              const r = await apiGet(`/api/reports/${reportId}`);
              setDetailReport(r);
              setShowDetail(true);
            }}
              className="w-full sm:w-auto px-4 py-3 sm:py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors mt-4">
              Lihat Laporan
            </button>
          )}
        </div>

        <Modal open={showDetail} onClose={() => { setShowDetail(false); setDetailReport(null); }} wide>
          {detailReport && (
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="font-heading font-semibold text-lg">{fmtLong(fromISO(detailReport.date))}</h3>
                <button type="button" onClick={() => setShowDetail(false)}
                  className="text-dim-text hover:text-ink-text text-xl leading-none p-0.5">&times;</button>
              </div>
              <p className="text-sm text-dim-text mb-1">
                {detailReport.submitted_by?.name || user?.name} · {detailReport.hostel} · Masa: {detailReport.inspection_time || '—'}
              </p>
              <div className="inline-block mb-3">
                <Stamp status={detailReport.status} />
              </div>

              <ApprovalTrail
                submittedAt={detailReport.submitted_at}
                reviewedAt={detailReport.reviewed_at}
                flaggedAt={detailReport.flagged_at}
                reviewedBy={detailReport.reviewed_by?.name}
                flaggedBy={detailReport.flagged_by?.name}
              />

              <div className="mt-3">
                {SECTIONS_CONFIG.map(cfg => (
                  <SectionAccordionReadOnly
                    key={cfg.id}
                    section={cfg}
                    data={detailReport.ratings?.[cfg.id]}
                  />
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-paper-line space-y-3">
                <div>
                  <strong className="text-xs">8. Aduan Kerosakan</strong>
                  <p className="text-sm whitespace-pre-wrap mt-1">{detailReport.aduan_kerosakan}</p>
                </div>
                <div>
                  <strong className="text-xs">9. Murid Sakit / Balik Luar Jadual</strong>
                  <p className="text-sm whitespace-pre-wrap mt-1">{detailReport.murid_sakit}</p>
                </div>
                <div>
                  <strong className="text-xs">10. Kawalan Keselamatan</strong>
                  <p className="text-sm mt-1">{detailReport.kawalan_keselamatan ? `${detailReport.kawalan_keselamatan} / 5` : '—'}</p>
                </div>
                <div>
                  <strong className="text-xs">11. Catatan Tambahan</strong>
                  <p className="text-sm whitespace-pre-wrap mt-1">{detailReport.catatan_tambahan || '—'}</p>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  return null;
}
