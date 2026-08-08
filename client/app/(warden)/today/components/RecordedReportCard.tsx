'use client';

import LoadingSpinner from '@/app/components/LoadingSpinner';
import { countRatedSections, fmtTime } from '@/app/lib/constants';
import type { ReportDetail } from '@/app/lib/types';

export default function RecordedReportCard({ report, saving, onEdit, onSubmitDraft, onView }: {
  report: ReportDetail;
  saving: boolean;
  onEdit: () => void;
  onSubmitDraft: () => void;
  onView: () => void;
}) {
  const isDraft = report.status === 'draft';

  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg p-6 sm:p-8 text-center">
      <span className={`material-symbols-outlined text-3xl mb-2 block ${isDraft ? 'text-dim-text' : 'text-green'}`}>
        {isDraft ? 'edit_note' : 'check_circle'}
      </span>
      <h3 className="font-heading font-semibold text-base sm:text-lg">Laporan telah direkodkan</h3>
      <div className="text-sm text-dim-text mt-1 mb-3">
        {countRatedSections(report as unknown as Record<string, unknown>)}/11 bahagian dinilai
        · {!isDraft ? fmtTime(report.submitted_at) : (report.inspection_time || '—')}
      </div>
      {isDraft ? (
        <div className="flex flex-col sm:flex-row justify-center gap-2 mt-4">
          <button type="button" onClick={onEdit}
            className="w-full sm:w-auto px-4 py-3 sm:py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
            Sunting Draf
          </button>
          <button type="button" onClick={onSubmitDraft} disabled={saving}
            className="w-full sm:w-auto px-4 py-3 sm:py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2">
            {saving && <LoadingSpinner size={16} />}
            {saving ? 'Menghantar…' : 'Hantar Laporan'}
          </button>
        </div>
      ) : (
        <button type="button" onClick={onView}
          className="w-full sm:w-auto px-4 py-3 sm:py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors mt-4">
          Lihat Laporan
        </button>
      )}
    </div>
  );
}
