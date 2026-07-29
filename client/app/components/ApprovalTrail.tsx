import { fmtDatetime } from '@/app/lib/constants';

interface ApprovalEntry {
  action: string;
  user: string;
  at: string;
}

export default function ApprovalTrail({ trail, submittedAt, reviewedAt, flaggedAt, reviewedBy, flaggedBy }: {
  trail?: ApprovalEntry[];
  submittedAt?: string | null;
  reviewedAt?: string | null;
  flaggedAt?: string | null;
  reviewedBy?: string | null;
  flaggedBy?: string | null;
}) {
  const hasAny = submittedAt || reviewedAt || flaggedAt;

  return (
    <div className="mt-3 pt-3 border-t border-paper-line">
      {submittedAt && (
        <div className="flex items-center gap-1.5 text-sm text-dim-text mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brass flex-shrink-0"></span>
          Dihantar pada <strong className="text-ink-text font-semibold">{fmtDatetime(submittedAt)}</strong>
        </div>
      )}
      {reviewedBy && reviewedAt && (
        <div className="flex items-center gap-1.5 text-sm text-dim-text mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green flex-shrink-0"></span>
          Disemak oleh <strong className="text-ink-text font-semibold">{reviewedBy}</strong> pada {fmtDatetime(reviewedAt)}
        </div>
      )}
      {flaggedBy && flaggedAt && (
        <div className="flex items-center gap-1.5 text-sm text-dim-text mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red flex-shrink-0"></span>
          Ditanda oleh <strong className="text-ink-text font-semibold">{flaggedBy}</strong> pada {fmtDatetime(flaggedAt)}
        </div>
      )}
      {!hasAny && (
        <div className="text-sm text-dim-text opacity-50">Tiada rekod penghantaran</div>
      )}
    </div>
  );
}
