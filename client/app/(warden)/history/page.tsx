'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { apiGet } from '@/app/lib/api';
import { iso, mondayOf, addDays, fromISO, fmtShort, malayDay, fmtLong, fmtTime, SECTIONS_CONFIG } from '@/app/lib/constants';
import Stamp from '@/app/components/Stamp';
import WeekFlip from '@/app/components/WeekFlip';
import Modal from '@/app/components/Modal';
import { SectionAccordionReadOnly } from '@/app/components/SectionAccordion';
import ApprovalTrail from '@/app/components/ApprovalTrail';
import { useToast } from '@/app/components/Toast';

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [loading, setLoading] = useState(true);
  const [detailReport, setDetailReport] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);

  const todayStr = iso(new Date());
  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = iso(weekStart) === iso(mondayOf(new Date()));

  useEffect(() => {
    setLoading(true);
    apiGet('/api/reports', { week_start: iso(weekStart) })
      .then(setReports)
      .catch(() => showToast('Gagal memuatkan laporan.'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getReportForDate = (ds: string) => reports.find(r => r.date === ds);

  const openDetail = async (id: string) => {
    try {
      const r = await apiGet(`/api/reports/${id}`);
      setDetailReport(r);
      setShowDetail(true);
    } catch {
      showToast('Gagal memuatkan laporan.');
    }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Entri anda</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">Sejarah Laporan</h2>
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

      <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4">
        {days.map(d => {
          const ds = iso(d);
          const r = getReportForDate(ds);
          const isFuture = d > new Date();

          if (!r) {
            return (
              <div key={ds} className="flex items-center gap-3 py-3 border-b border-paper-line last:border-b-0">
                <div className="w-[60px] sm:w-[78px] flex-shrink-0">
                  <div className="font-heading font-bold text-lg leading-none">{d.getDate()}</div>
                  <div className="text-[0.62rem] sm:text-[0.68rem] text-dim-text uppercase font-mono">{malayDay(d).slice(0, 3)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-dim-text italic">{isFuture ? 'Belum sampai masa' : 'Tiada laporan'}</div>
                </div>
                {!isFuture && (
                  <button type="button" onClick={() => router.push('/today')}
                    className="px-3 py-2 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors flex-shrink-0">
                    Tambah Entri
                  </button>
                )}
              </div>
            );
          }

          return (
            <div key={ds} className="flex items-center gap-3 py-3 border-b border-paper-line last:border-b-0">
              <div className="w-[60px] sm:w-[78px] flex-shrink-0">
                <div className="font-heading font-bold text-lg leading-none">{d.getDate()}</div>
                <div className="text-[0.62rem] sm:text-[0.68rem] text-dim-text uppercase font-mono">{malayDay(d).slice(0, 3)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-ink-text truncate">
                  {r.rated_sections}/11 bhgn · {r.status !== 'draft' ? fmtTime(r.submitted_at) : (r.inspection_time || '—')}
                  {r.is_substitution && r.duty_warden_name && (
                    <span className="text-[0.58rem] font-semibold uppercase tracking-wider px-1 py-0.5 border border-brass text-brass-deep bg-brass-wash rounded-sm whitespace-nowrap ml-1 inline-block">
                      bg {r.duty_warden_name}
                    </span>
                  )}
                </div>
                <div className="text-[0.65rem] sm:text-[0.72rem] text-dim-text font-mono mt-0.5 truncate">
                  {r.aduan_kerosakan === 'TKD' ? 'TKD' : 'Ada kerosakan'} · {r.murid_sakit === 'TLB' ? 'TLB' : 'Ada laporan sakit'}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="hidden sm:block"><Stamp status={r.status} /></div>
                <button type="button" onClick={() => openDetail(r.id)}
                  className="px-3 py-2 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
                  {r.status === 'draft' ? 'Sunting' : 'Lihat'}
                </button>
              </div>
            </div>
          );
        })}
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
                <SectionAccordionReadOnly key={cfg.id} section={cfg} data={detailReport.ratings?.[cfg.id]} date={detailReport.date} />
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
