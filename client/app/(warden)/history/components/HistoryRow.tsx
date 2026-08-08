'use client';

import Stamp from '@/app/components/Stamp';
import { iso, malayDay, fmtTime } from '@/app/lib/constants';
import type { ReportDetail } from '@/app/lib/types';

export default function HistoryRow({ day, report, onAdd, onOpen }: {
  day: Date;
  report: ReportDetail | undefined;
  onAdd: (ds: string) => void;
  onOpen: (id: string) => void;
}) {
  const ds = iso(day);
  const isFuture = day > new Date();
  const r = report;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-paper-line last:border-b-0">
      <div className="w-[60px] sm:w-[78px] flex-shrink-0">
        <div className="font-heading font-bold text-lg leading-none">{day.getDate()}</div>
        <div className="text-[0.62rem] sm:text-[0.68rem] text-dim-text uppercase font-mono">{malayDay(day).slice(0, 3)}</div>
      </div>

      {!r ? (
        <>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-dim-text italic">{isFuture ? 'Belum sampai masa' : 'Tiada laporan'}</div>
          </div>
          {!isFuture && (
            <button type="button" onClick={() => onAdd(ds)}
              className="px-3 py-2 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors flex-shrink-0">
              Tambah Entri
            </button>
          )}
        </>
      ) : (
        <>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-ink-text truncate">
              {r.rated_sections}/11 bhgn · {r.status !== 'draft' ? fmtTime(r.submitted_at) : (r.inspection_time || '—')}
              {r.is_substitution && r.duty_warden_name && (
                <span className="text-[0.58rem] font-semibold uppercase tracking-wider px-1 py-0.5 border border-brass text-brass-deep bg-brass-wash rounded-sm whitespace-nowrap ml-1 inline-block">
                  bg {r.duty_warden_name}
                </span>
              )}
              {r.is_late && r.status !== 'draft' && (
                <span className="text-[0.58rem] font-semibold uppercase tracking-wider px-1 py-0.5 border border-red text-red bg-red-wash rounded-sm whitespace-nowrap ml-1 inline-block">
                  Terlewat
                </span>
              )}
            </div>
            <div className="text-[0.65rem] sm:text-[0.72rem] text-dim-text font-mono mt-0.5 truncate">
              {r.aduan_kerosakan === 'TKD' ? 'TKD' : 'Ada kerosakan'} · {r.murid_sakit === 'TLB' ? 'TLB' : 'Ada laporan sakit'}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:block"><Stamp status={r.status} /></div>
            <button type="button" onClick={() => onOpen(r.id)}
              className="px-3 py-2 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
              {r.status === 'draft' ? 'Sunting' : 'Lihat'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
