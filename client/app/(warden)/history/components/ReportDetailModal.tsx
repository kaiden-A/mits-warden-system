'use client';

import Modal from '@/app/components/Modal';
import ReportDetailView from '@/app/components/ReportDetailView';
import { fmtLong, fromISO } from '@/app/lib/constants';
import type { ReportDetail } from '@/app/lib/types';

export default function ReportDetailModal({ report, fallbackName, onClose }: {
  report: ReportDetail | null;
  fallbackName?: string;
  onClose: () => void;
}) {
  return (
    <Modal open={!!report} onClose={onClose} wide>
      {report && (
        <div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <h3 className="font-heading font-semibold text-lg">{fmtLong(fromISO(report.date))}</h3>
            <button type="button" onClick={onClose}
              className="text-dim-text hover:text-ink-text text-xl leading-none p-0.5">&times;</button>
          </div>
          <ReportDetailView
            report={report}
            submittedByName={fallbackName}
            metaExtra={` · Masa: ${report.inspection_time || '—'}`}
            showLateBadge
          />
        </div>
      )}
    </Modal>
  );
}
