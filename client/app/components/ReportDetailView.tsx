'use client';

import { SECTIONS_CONFIG } from '@/app/lib/constants';
import type { ReportDetail } from '@/app/lib/types';
import Stamp from '@/app/components/Stamp';
import ApprovalTrail from '@/app/components/ApprovalTrail';
import { SectionAccordionReadOnly } from '@/app/components/SectionAccordion';
import { RatingTableReadOnly } from '@/app/components/RatingTable';

const ExtraNotes = ({ report, className = '' }: { report: ReportDetail; className?: string }) => (
  <div className={className}>
    <div>
      <strong className="text-xs">8. Aduan Kerosakan</strong>
      <p className="text-sm whitespace-pre-wrap mt-1">{report.aduan_kerosakan}</p>
    </div>
    <div>
      <strong className="text-xs">9. Murid Sakit / Balik Luar Jadual</strong>
      <p className="text-sm whitespace-pre-wrap mt-1">{report.murid_sakit}</p>
    </div>
    <div>
      <strong className="text-xs">10. Kawalan Keselamatan</strong>
      <p className="text-sm mt-1">{report.kawalan_keselamatan ? `${report.kawalan_keselamatan} / 5` : '—'}</p>
    </div>
    <div>
      <strong className="text-xs">11. Catatan Tambahan</strong>
      <p className="text-sm whitespace-pre-wrap mt-1">{report.catatan_tambahan || '—'}</p>
    </div>
  </div>
);

export default function ReportDetailView({ report, submittedByName, metaExtra, showMeta = true, showStamp = true, showLateBadge, variant = 'accordion', after }: {
  report: ReportDetail;
  submittedByName?: string;
  metaExtra?: string;
  showMeta?: boolean;
  showStamp?: boolean;
  showLateBadge?: boolean;
  variant?: 'accordion' | 'tables';
  after?: React.ReactNode;
}) {
  const lateBadge = showLateBadge && report.is_late && report.status !== 'draft' && (
    <span className="text-[0.58rem] font-semibold uppercase tracking-wider px-1 py-0.5 border border-red text-red bg-red-wash rounded-sm whitespace-nowrap inline-block">
      Terlewat
    </span>
  );

  const meta = showMeta && (
    <p className="text-sm text-dim-text mb-1">
      {report.submitted_by?.name || submittedByName} · {report.hostel}{metaExtra}
    </p>
  );

  const stamp = showStamp && (
    <div className={`${variant === 'accordion' ? 'inline-flex items-center gap-2 mb-3' : ''}`}>
      <Stamp status={report.status} />
      {variant === 'accordion' && lateBadge}
    </div>
  );

  const approval = (
    <ApprovalTrail
      submittedAt={report.submitted_at}
      reviewedAt={report.reviewed_at}
      flaggedAt={report.flagged_at}
      reviewedBy={report.reviewed_by?.name}
      flaggedBy={report.flagged_by?.name}
    />
  );

  if (variant === 'tables') {
    return (
      <div>
        {meta}
        {lateBadge && <div className="mb-3">{lateBadge}</div>}
        {stamp}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {SECTIONS_CONFIG.map(cfg => (
            <div key={cfg.id} className="sm:col-span-2">
              <h5 className="font-heading font-semibold text-sm mb-1 text-ink-text">{cfg.title}</h5>
              <div className="table-scroll">
                <RatingTableReadOnly items={cfg.items} data={report.ratings?.[cfg.id]} date={report.date} />
              </div>
            </div>
          ))}
          <div className="sm:col-span-2">
            <strong className="text-xs">8. Aduan Kerosakan</strong>
            <p className="text-sm whitespace-pre-wrap mt-1">{report.aduan_kerosakan}</p>
          </div>
          <div className="sm:col-span-2">
            <strong className="text-xs">9. Murid Sakit / Balik Luar Jadual</strong>
            <p className="text-sm whitespace-pre-wrap mt-1">{report.murid_sakit}</p>
          </div>
          <div>
            <strong className="text-xs">10. Kawalan Keselamatan</strong>
            <p className="text-sm mt-1">{report.kawalan_keselamatan ? `${report.kawalan_keselamatan} / 5` : '—'}</p>
          </div>
          <div>
            <strong className="text-xs">11. Catatan Tambahan</strong>
            <p className="text-sm whitespace-pre-wrap mt-1">{report.catatan_tambahan || '—'}</p>
          </div>
          <div className="sm:col-span-2">{approval}</div>
          {after}
        </div>
      </div>
    );
  }

  return (
    <div>
      {meta}
      {stamp}
      {approval}
      <div className="mt-3">
        {SECTIONS_CONFIG.map(cfg => (
          <SectionAccordionReadOnly key={cfg.id} section={cfg} data={report.ratings?.[cfg.id]} date={report.date} />
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-paper-line">
        <ExtraNotes report={report} className="space-y-3" />
      </div>
      {after}
    </div>
  );
}
