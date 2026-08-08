'use client';

import { AdminBadge, StatusBadge } from './Badges';
import type { Warden } from '../types';

export default function WardenCards({ wardens, currentUserId, onViewReports, onToggleAdmin, onRevoke, onReinstate }: {
  wardens: Warden[];
  currentUserId?: string;
  onViewReports: (id: string) => void;
  onToggleAdmin: (w: Warden) => void;
  onRevoke: (w: Warden) => void;
  onReinstate: (w: Warden) => void;
}) {
  return (
    <div className="sm:hidden space-y-3">
      {wardens.map(w => (
        <div key={w.id} className="bg-paper-raised border border-paper-line rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-heading font-semibold text-sm">{w.name}</p>
              <p className="font-mono text-[0.65rem] text-dim-text mt-0.5">{w.email}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              {w.is_admin && <AdminBadge size="sm" />}
              <StatusBadge status={w.status} />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-dim-text mb-3">
            <span>{w.hostel}</span>
            <span className="w-1 h-1 rounded-full bg-paper-line"></span>
            <span>{w.report_count} laporan</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => onViewReports(w.id)}
              className="flex-1 py-2.5 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors text-center">
              Lihat Laporan
            </button>
            <button type="button" onClick={() => onToggleAdmin(w)} disabled={w.id === currentUserId}
              className={w.is_admin
                ? "flex-1 py-2.5 text-xs font-semibold border border-brass-deep rounded bg-transparent text-brass-deep hover:bg-brass-wash disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-center"
                : "flex-1 py-2.5 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors text-center"}>
              {w.is_admin ? 'Tarik Hak Admin' : 'Jadikan Admin'}
            </button>
            {w.status === 'active' ? (
              <button type="button" onClick={() => onRevoke(w)}
                className="flex-1 py-2.5 text-xs font-semibold border border-red rounded bg-transparent text-red hover:bg-red-wash transition-colors text-center">
                Tarik Akses
              </button>
            ) : (
              <button type="button" onClick={() => onReinstate(w)}
                className="flex-1 py-2.5 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors text-center">
                Aktifkan Semula
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
