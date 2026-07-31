'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/app/lib/api';
import { iso, mondayOf, addDays, fromISO, malayDay, fmtShort, fmtTime, SECTIONS_CONFIG } from '@/app/lib/constants';
import Stamp from '@/app/components/Stamp';
import WeekFlip from '@/app/components/WeekFlip';
import { RatingTableReadOnly } from '@/app/components/RatingTable';
import ApprovalTrail from '@/app/components/ApprovalTrail';
import { useToast } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [reports, setReports] = useState<any[]>([]);
  const [reportDetails, setReportDetails] = useState<Record<string, any>>({});
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = iso(weekStart) === iso(mondayOf(new Date()));

  useEffect(() => {
    setLoading(true);
    setReportDetails({});
    setExpandedIds({});
    apiGet('/api/reports', { week_start: iso(weekStart) })
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

  const updateReportLocally = (id: string, updates: Record<string, any>) => {
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
    } catch (err: any) {
      showToast(err.message || 'Gagal menyemak laporan.');
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
    } catch (err: any) {
      showToast(err.message || 'Gagal menanda laporan.');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-dim-text flex items-center justify-center gap-2"><LoadingSpinner size={18} />Memuatkan…</div>;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Semakan</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">Laporan</h2>
        </div>
      </div>

      <WeekFlip
        weekStart={weekStart}
        weekEnd={weekEnd}
        isCurrentWeek={isCurrentWeek}
        onPrev={() => setWeekStart(prev => addDays(prev, -7))}
        onNext={() => setWeekStart(prev => addDays(prev, 7))}
        onThisWeek={() => setWeekStart(mondayOf(new Date()))}
      />

      <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
        {days.map(d => {
          const ds = iso(d);
          const dayReports = reportsForDay(ds);
          const hasAny = dayReports.length > 0;
          const isFuture = d > new Date();

          return (
            <div key={ds}>
              <div className="py-3 px-1 border-b border-paper-line">
                <div className="font-heading font-bold text-lg text-ink-text">{malayDay(d)}, {d.getDate()} {fmtShort(d)}</div>
                {!hasAny && (
                  <div className="text-sm text-dim-text italic mt-1">{isFuture ? 'Belum sampai masa' : 'Tiada laporan'}</div>
                )}
                {dayReports.map(report => {
                  const isExpanded = expandedIds[report.id];
                  const detail = reportDetails[report.id];

                  return (
                    <div key={report.id}>
                      <button type="button" onClick={() => toggleDetail(report.id)}
                        className="flex items-center gap-3 w-full py-3 pl-3 sm:pl-5 pr-2 text-left hover:bg-paper transition-colors rounded-sm min-h-[52px]">
                        <span className={`text-xs font-mono text-dim-text transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}>&#9654;</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-ink-text truncate">
                            <strong>{report.submitted_by_name || '—'}</strong>
                            <span className="text-dim-text font-normal"> ({report.hostel})</span>
                          </div>
                          <div className="text-[0.68rem] text-dim-text font-mono mt-0.5">
                            {report.status !== 'draft' ? fmtTime(report.submitted_at) : (report.inspection_time || '—')}
                            {report.is_substitution && report.duty_warden_name && (
                              <span className="ml-1.5 text-[0.58rem] font-semibold uppercase tracking-wider px-1 py-0.5 border border-brass text-brass-deep bg-brass-wash rounded-sm whitespace-nowrap inline-block">
                                bg pihak {report.duty_warden_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Stamp status={report.status} />
                      </button>

                      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[5000px]' : 'max-h-0'}`}>
                        {detail && (
                          <div className="pl-4 sm:pl-5 pr-3 sm:pr-4 py-4 bg-paper border-t border-paper-line rounded-b-sm">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                              {SECTIONS_CONFIG.map(cfg => (
                                <div key={cfg.id} className="sm:col-span-2">
                                  <h5 className="font-heading font-semibold text-sm mb-1 text-ink-text">{cfg.title}</h5>
                                  <div className="table-scroll">
                                    <RatingTableReadOnly items={cfg.items} data={detail.ratings?.[cfg.id]} date={detail.date} />
                                  </div>
                                </div>
                              ))}
                              <div className="sm:col-span-2">
                                <h5 className="font-heading font-semibold text-sm mb-1 text-ink-text">8. Aduan Kerosakan</h5>
                                <p className="text-sm whitespace-pre-wrap">{detail.aduan_kerosakan}</p>
                              </div>
                              <div className="sm:col-span-2">
                                <h5 className="font-heading font-semibold text-sm mb-1 text-ink-text">9. Murid Sakit / Balik Luar Jadual</h5>
                                <p className="text-sm whitespace-pre-wrap">{detail.murid_sakit}</p>
                              </div>
                              <div>
                                <h5 className="font-heading font-semibold text-sm mb-1 text-ink-text">10. Kawalan Keselamatan</h5>
                                <p className="text-sm">{detail.kawalan_keselamatan ? `${detail.kawalan_keselamatan} / 5` : '—'}</p>
                              </div>
                              <div>
                                <h5 className="font-heading font-semibold text-sm mb-1 text-ink-text">11. Catatan Tambahan</h5>
                                <p className="text-sm whitespace-pre-wrap">{detail.catatan_tambahan || '—'}</p>
                              </div>
                              <div className="sm:col-span-2">
                                <ApprovalTrail
                                  submittedAt={detail.submitted_at}
                                  reviewedAt={detail.reviewed_at}
                                  flaggedAt={detail.flagged_at}
                                  reviewedBy={detail.reviewed_by?.name}
                                  flaggedBy={detail.flagged_by?.name}
                                />
                              </div>
                              <div className="sm:col-span-2 mt-2 pt-3 border-t border-paper-line">
                                <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Nota Pengurusan</label>
                                <textarea id={`admin-note-${report.id}`}
                                  placeholder="Tambah nota untuk rekod…"
                                  defaultValue={detail.admin_note || ''}
                                  className="w-full min-h-[60px] px-3 py-2 border border-paper-line rounded bg-white text-sm text-ink-text resize-y outline-none focus-visible:border-brass" />
                                <div className="flex gap-2 justify-end mt-2">
                                  <button type="button" onClick={() => {
                                    const note = (document.getElementById(`admin-note-${report.id}`) as HTMLTextAreaElement)?.value || '';
                                    handleFlag(report.id, note);
                                  }} disabled={actionLoading === report.id}
                                    className="flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 text-xs font-semibold border border-red rounded bg-transparent text-red hover:bg-red-wash disabled:opacity-60 transition-colors text-center inline-flex items-center justify-center gap-1.5">
                                    {actionLoading === report.id && <LoadingSpinner size={14} />}
                                    Tanda untuk Tindakan
                                  </button>
                                  <button type="button" onClick={() => {
                                    const note = (document.getElementById(`admin-note-${report.id}`) as HTMLTextAreaElement)?.value || '';
                                    handleReview(report.id, note);
                                  }} disabled={actionLoading === report.id}
                                    className="flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 text-xs font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors text-center inline-flex items-center justify-center gap-1.5">
                                    {actionLoading === report.id && <LoadingSpinner size={14} />}
                                    Tanda Disemak
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
