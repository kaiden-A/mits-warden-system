'use client';

import { iso, fmtShort, malayDay } from '@/app/lib/constants';
import type { ReportDetail } from '@/app/lib/types';
import ReportRow from './ReportRow';

export default function DayGroup({ day, dayReports, pdfBusy, expandedIds, reportDetails, actionLoading, onPrintDay, onToggle, onFlag, onReview }: {
  day: Date;
  dayReports: ReportDetail[];
  pdfBusy: string | null;
  expandedIds: Record<string, boolean>;
  reportDetails: Record<string, ReportDetail>;
  actionLoading: string | null;
  onPrintDay: (ds: string, dayReports: ReportDetail[]) => void;
  onToggle: (id: string) => void;
  onFlag: (id: string, note: string) => void;
  onReview: (id: string, note: string) => void;
}) {
  const ds = iso(day);
  const hasAny = dayReports.length > 0;
  const isFuture = day > new Date();

  return (
    <div className="py-3 px-1 border-b border-paper-line">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="font-heading font-bold text-lg text-ink-text">{malayDay(day)}, {day.getDate()} {fmtShort(day)}</div>
        {hasAny && (
          <button type="button" onClick={() => onPrintDay(ds, dayReports)} disabled={pdfBusy === ds}
            className="px-3 py-2 text-xs font-semibold rounded bg-transparent text-brass-deep border border-brass-deep hover:bg-brass-wash disabled:opacity-60 transition-colors inline-flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base leading-none">print</span>
            {pdfBusy === ds ? 'Menjana…' : 'Cetak PDF'}
          </button>
        )}
      </div>
      {!hasAny && (
        <div className="text-sm text-dim-text italic mt-1">{isFuture ? 'Belum sampai masa' : 'Tiada laporan'}</div>
      )}
      {dayReports.map(report => (
        <ReportRow key={report.id}
          report={report}
          isExpanded={!!expandedIds[report.id]}
          detail={reportDetails[report.id]}
          actionLoading={actionLoading === report.id}
          onToggle={() => onToggle(report.id)}
          onFlag={onFlag}
          onReview={onReview}
        />
      ))}
    </div>
  );
}
