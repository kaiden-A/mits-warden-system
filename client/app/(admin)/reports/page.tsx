'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiGet, apiPost } from '@/app/lib/api';
import { iso, mondayOf, addDays, fromISO, fmtShort, malayDay, fmtLong, SECTIONS_CONFIG, countRatedSections } from '@/app/lib/constants';
import Stamp from '@/app/components/Stamp';
import WeekFlip from '@/app/components/WeekFlip';
import { SectionAccordionReadOnly } from '@/app/components/SectionAccordion';
import { RatingTableReadOnly } from '@/app/components/RatingTable';
import ApprovalTrail from '@/app/components/ApprovalTrail';
import { useToast } from '@/app/components/Toast';

interface Warden {
  id: string;
  name: string;
  email: string;
  hostel: string | null;
  status: string;
  report_count: number;
}

export default function AdminReportsPage() {
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [selectedWardenId, setSelectedWardenId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [reports, setReports] = useState<any[]>([]);
  const [reportDetails, setReportDetails] = useState<Record<string, any>>({});
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = iso(weekStart) === iso(mondayOf(new Date()));
  const todayStr = iso(new Date());

  useEffect(() => {
    const wardenParam = searchParams.get('warden');
    apiGet('/api/wardens')
      .then((data: { wardens: Warden[] }) => {
        setWardens(data.wardens);
        if (wardenParam && data.wardens.find(w => w.id === wardenParam)) {
          setSelectedWardenId(wardenParam);
        } else if (!selectedWardenId && data.wardens.length > 0) {
          setSelectedWardenId(data.wardens[0].id);
        }
      })
      .catch(() => showToast('Gagal memuatkan warden.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedWardenId) return;
    const warden = wardens.find(w => w.id === selectedWardenId);
    if (!warden) return;

    apiGet('/api/reports', {
      week_start: iso(weekStart),
      hostel: warden.hostel || '',
    }).then(setReports).catch(() => showToast('Gagal memuatkan laporan.'));
  }, [selectedWardenId, weekStart, wardens]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const toggleDayDetail = async (ds: string) => {
    if (expandedDays[ds]) {
      setExpandedDays(prev => ({ ...prev, [ds]: false }));
      return;
    }

    if (!reportDetails[ds]) {
      const report = reports.find(r => r.date === ds);
      if (!report) return;
      try {
        const detail = await apiGet(`/api/reports/${report.id}`);
        setReportDetails(prev => ({ ...prev, [ds]: detail }));
      } catch {
        showToast('Gagal memuatkan butiran laporan.');
        return;
      }
    }

    setExpandedDays(prev => ({ ...prev, [ds]: true }));
  };

  const handleReview = async (dateStr: string, adminNote: string) => {
    try {
      const report = reports.find(r => r.date === dateStr);
      if (!report) return;
      await apiPost(`/api/reports/${report.id}/review`, { admin_note: adminNote });
      showToast('Laporan ditanda sebagai disemak.');

      const detail = await apiGet(`/api/reports/${report.id}`);
      setReportDetails(prev => ({ ...prev, [dateStr]: detail }));
    } catch (err: any) {
      showToast(err.message || 'Gagal menyemak laporan.');
    }
  };

  const handleFlag = async (dateStr: string, adminNote: string) => {
    try {
      const report = reports.find(r => r.date === dateStr);
      if (!report) return;
      await apiPost(`/api/reports/${report.id}/flag`, { admin_note: adminNote });
      showToast('Laporan ditanda untuk tindakan.');

      const detail = await apiGet(`/api/reports/${report.id}`);
      setReportDetails(prev => ({ ...prev, [dateStr]: detail }));
    } catch (err: any) {
      showToast(err.message || 'Gagal menanda laporan.');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-dim-text">Memuatkan…</div>;
  }

  const selectedWarden = wardens.find(w => w.id === selectedWardenId);

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Semakan</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">Laporan</h2>
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-5 items-start">
        <div className="bg-paper-raised border border-paper-line rounded-lg p-3">
          <ul className="m-0 p-0 list-none">
            {wardens.map(w => (
              <li key={w.id}>
                <button type="button" onClick={() => setSelectedWardenId(w.id)}
                  className={`w-full text-left bg-transparent border-none border-l-[3px] border-transparent py-2.5 px-3 text-sm text-ink-text rounded-r transition-colors ${
                    selectedWardenId === w.id ? 'bg-brass-wash border-l-brass font-semibold' : 'hover:bg-paper'
                  }`}>
                  {w.name}
                  <span className="block text-[0.7rem] text-dim-text font-mono mt-0.5">
                    {w.email} · {w.hostel} · {w.status === 'active' ? 'Aktif' : 'Ditarik'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <WeekFlip
            weekStart={weekStart}
            weekEnd={weekEnd}
            isCurrentWeek={isCurrentWeek}
            onPrev={() => setWeekStart(prev => addDays(prev, -7))}
            onNext={() => setWeekStart(prev => addDays(prev, 7))}
            onThisWeek={() => setWeekStart(mondayOf(new Date()))}
          />

          <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
            {!selectedWarden ? (
              <div className="text-center py-8 text-dim-text">
                <h3 className="font-heading font-semibold text-base">Tiada warden dipilih</h3>
                <p className="text-sm mt-1">Pilih warden dari senarai untuk menyemak laporan harian.</p>
              </div>
            ) : (
              days.map(d => {
                const ds = iso(d);
                const report = reports.find(r => r.date === ds);
                const isFuture = d > new Date();
                const isExpanded = expandedDays[ds];
                const detail = reportDetails[ds];

                return (
                  <div key={ds}>
                    {!report ? (
                      <div className="flex items-center gap-4 py-3.5 border-b border-paper-line">
                        <div className="w-[78px] flex-shrink-0">
                          <div className="font-heading font-bold text-lg leading-none">{d.getDate()}</div>
                          <div className="text-[0.68rem] text-dim-text uppercase font-mono">{malayDay(d)}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-dim-text italic">{isFuture ? 'Belum sampai masa' : 'Tiada laporan'}</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button type="button" onClick={() => toggleDayDetail(ds)}
                          className="flex items-center gap-4 w-full py-3.5 border-b border-paper-line text-left hover:bg-paper transition-colors">
                          <span className={`text-xs font-mono text-dim-text transition-transform ${isExpanded ? 'rotate-90' : ''}`}>&#9654;</span>
                          <div className="w-[78px] flex-shrink-0">
                            <div className="font-heading font-bold text-lg leading-none">{d.getDate()}</div>
                            <div className="text-[0.68rem] text-dim-text uppercase font-mono">{malayDay(d)}</div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-ink-text truncate">
                              Masa: {report.inspection_time || '—'} · {countRatedSections(report)}/11 bahagian
                            </div>
                            <div className="text-[0.72rem] text-dim-text font-mono mt-0.5">
                              {report.aduan_kerosakan === 'TKD' ? 'TKD' : 'Ada kerosakan'} · {report.murid_sakit === 'TLB' ? 'TLB' : 'Ada sakit'}
                            </div>
                          </div>
                          <Stamp status={report.status} />
                        </button>

                        <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[5000px]' : 'max-h-0'}`}>
                          {detail && (
                            <div className="px-4 py-4 bg-paper border-t border-paper-line">
                              <div className="grid grid-cols-2 gap-5">
                                {SECTIONS_CONFIG.map(cfg => (
                                  <div key={cfg.id} className="col-span-2">
                                    <h5 className="font-heading font-semibold text-sm mb-1 text-ink-text">{cfg.title}</h5>
                                    <RatingTableReadOnly items={cfg.items} data={detail.ratings?.[cfg.id]} />
                                  </div>
                                ))}
                                <div className="col-span-2">
                                  <h5 className="font-heading font-semibold text-sm mb-1 text-ink-text">8. Aduan Kerosakan</h5>
                                  <p className="text-sm whitespace-pre-wrap">{detail.aduan_kerosakan}</p>
                                </div>
                                <div className="col-span-2">
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
                                <div className="col-span-2">
                                  <ApprovalTrail
                                    submittedAt={detail.submitted_at}
                                    reviewedAt={detail.reviewed_at}
                                    flaggedAt={detail.flagged_at}
                                    reviewedBy={detail.reviewed_by?.name}
                                    flaggedBy={detail.flagged_by?.name}
                                  />
                                </div>
                                <div className="col-span-2 mt-2 pt-3 border-t border-paper-line">
                                  <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Nota Pengurusan</label>
                                  <textarea id={`admin-note-${ds}`}
                                    placeholder="Tambah nota untuk rekod…"
                                    defaultValue={detail.admin_note || ''}
                                    className="w-full min-h-[60px] px-3 py-2 border border-paper-line rounded bg-white text-sm text-ink-text resize-y outline-none focus-visible:border-brass" />
                                  <div className="flex gap-2 justify-end mt-2">
                                    <button type="button" onClick={() => {
                                      const note = (document.getElementById(`admin-note-${ds}`) as HTMLTextAreaElement)?.value || '';
                                      handleFlag(ds, note);
                                    }}
                                      className="px-2 py-1 text-xs font-semibold border border-red rounded bg-transparent text-red hover:bg-red-wash transition-colors">
                                      Tanda untuk Tindakan
                                    </button>
                                    <button type="button" onClick={() => {
                                      const note = (document.getElementById(`admin-note-${ds}`) as HTMLTextAreaElement)?.value || '';
                                      handleReview(ds, note);
                                    }}
                                      className="px-2 py-1 text-xs font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors">
                                      Tanda Disemak
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
