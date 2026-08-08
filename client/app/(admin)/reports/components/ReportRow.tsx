'use client';

import Stamp from '@/app/components/Stamp';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ReportDetailView from '@/app/components/ReportDetailView';
import { fmtTime } from '@/app/lib/constants';
import type { ReportDetail } from '@/app/lib/types';

export default function ReportRow({ report, isExpanded, detail, actionLoading, onToggle, onFlag, onReview }: {
  report: ReportDetail;
  isExpanded: boolean;
  detail: ReportDetail | undefined;
  actionLoading: boolean;
  onToggle: () => void;
  onFlag: (id: string, note: string) => void;
  onReview: (id: string, note: string) => void;
}) {
  return (
    <div>
      <button type="button" onClick={onToggle}
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
            {report.is_late && report.status !== 'draft' && (
              <span className="ml-1.5 text-[0.58rem] font-semibold uppercase tracking-wider px-1 py-0.5 border border-red text-red bg-red-wash rounded-sm whitespace-nowrap inline-block">
                Terlewat
              </span>
            )}
          </div>
        </div>
        <Stamp status={report.status} />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[5000px]' : 'max-h-0'}`}>
        {detail && (
          <div className="pl-4 sm:pl-5 pr-3 sm:pr-4 py-4 bg-paper border-t border-paper-line rounded-b-sm">
            <ReportDetailView
              report={detail}
              variant="tables"
              showMeta={false}
              showStamp={false}
              showLateBadge
              after={(
                <div className="sm:col-span-2 mt-2 pt-3 border-t border-paper-line">
                  <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Nota Pengurusan</label>
                  <textarea id={`admin-note-${report.id}`}
                    placeholder="Tambah nota untuk rekod…"
                    defaultValue={detail.admin_note || ''}
                    className="w-full min-h-[60px] px-3 py-2 border border-paper-line rounded bg-white text-sm text-ink-text resize-y outline-none focus-visible:border-brass" />
                  <div className="flex gap-2 justify-end mt-2">
                    <button type="button" onClick={() => {
                      const note = (document.getElementById(`admin-note-${report.id}`) as HTMLTextAreaElement)?.value || '';
                      onFlag(report.id, note);
                    }} disabled={actionLoading}
                      className="flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 text-xs font-semibold border border-red rounded bg-transparent text-red hover:bg-red-wash disabled:opacity-60 transition-colors text-center inline-flex items-center justify-center gap-1.5">
                      {actionLoading && <LoadingSpinner size={14} />}
                      Tanda untuk Tindakan
                    </button>
                    <button type="button" onClick={() => {
                      const note = (document.getElementById(`admin-note-${report.id}`) as HTMLTextAreaElement)?.value || '';
                      onReview(report.id, note);
                    }} disabled={actionLoading}
                      className="flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 text-xs font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors text-center inline-flex items-center justify-center gap-1.5">
                      {actionLoading && <LoadingSpinner size={14} />}
                      Tanda Disemak
                    </button>
                  </div>
                </div>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}
