'use client';

import { AdminBadge, StatusBadge } from './Badges';
import type { Warden } from '../types';

export default function WardenTable({ wardens, currentUserId, onViewReports, onToggleAdmin, onRevoke, onReinstate }: {
  wardens: Warden[];
  currentUserId?: string;
  onViewReports: (id: string) => void;
  onToggleAdmin: (w: Warden) => void;
  onRevoke: (w: Warden) => void;
  onReinstate: (w: Warden) => void;
}) {
  return (
    <div className="hidden sm:block bg-paper-raised border border-paper-line rounded-lg p-4 overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Nama</th>
            <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Emel</th>
            <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Asrama</th>
            <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Status</th>
            <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Laporan</th>
            <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line"></th>
          </tr>
        </thead>
        <tbody>
          {wardens.map(w => (
            <tr key={w.id}>
              <td className="py-3 px-2 border-b border-paper-line">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm">{w.name}</strong>
                  {w.is_admin && <AdminBadge />}
                </div>
              </td>
              <td className="py-3 px-2 border-b border-paper-line font-mono text-xs text-dim-text">{w.email}</td>
              <td className="py-3 px-2 border-b border-paper-line text-sm">{w.hostel}</td>
              <td className="py-3 px-2 border-b border-paper-line">
                <StatusBadge status={w.status} />
              </td>
              <td className="py-3 px-2 border-b border-paper-line text-sm">{w.report_count}</td>
              <td className="py-3 px-2 border-b border-paper-line">
                <div className="flex gap-1.5 justify-end flex-wrap">
                  <button type="button" onClick={() => onViewReports(w.id)}
                    className="px-3 py-1.5 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
                    Lihat Laporan
                  </button>
                  <button type="button" onClick={() => onToggleAdmin(w)} disabled={w.id === currentUserId}
                    className={w.is_admin
                      ? "px-3 py-1.5 text-xs font-semibold border border-brass-deep rounded bg-transparent text-brass-deep hover:bg-brass-wash disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      : "px-3 py-1.5 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors"}>
                    {w.is_admin ? 'Tarik Hak Admin' : 'Jadikan Admin'}
                  </button>
                  {w.status === 'active' ? (
                    <button type="button" onClick={() => onRevoke(w)}
                      className="px-3 py-1.5 text-xs font-semibold border border-red rounded bg-transparent text-red hover:bg-red-wash transition-colors">
                      Tarik Akses
                    </button>
                  ) : (
                    <button type="button" onClick={() => onReinstate(w)}
                      className="px-3 py-1.5 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
                      Aktifkan Semula
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
