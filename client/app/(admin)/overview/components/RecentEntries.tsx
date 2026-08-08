'use client';

import Stamp from '@/app/components/Stamp';
import { fmtShort, fmtTime, fromISO } from '@/app/lib/constants';
import type { AdminDashboard } from '../types';

export default function RecentEntries({ entries }: { entries: AdminDashboard['recent_entries'] }) {
  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
      <h3 className="font-heading font-semibold text-base mb-3">Entri Terkini</h3>
      <ul className="m-0 p-0 list-none">
        {entries.length === 0 && (
          <li className="text-sm text-dim-text">Tiada entri.</li>
        )}
        {entries.map(entry => (
          <li key={entry.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-3 border-b border-paper-line last:border-b-0">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <span className="font-semibold text-sm">{entry.warden_name}</span>
              <span className="sm:hidden"><Stamp status={entry.status} /></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-dim-text">
              <span className="font-mono">{fmtShort(fromISO(entry.date))}</span>
              <span className="hidden sm:inline">·</span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-sm" style={{ color: '#6B7280' }}>
                  {entry.status === 'flagged' ? 'flag' : entry.status === 'reviewed' ? 'check_circle' : entry.status === 'submitted' ? 'send' : 'edit_note'}
                </span>
                {entry.status !== 'draft' ? fmtTime(entry.submitted_at) : (entry.inspection_time || '—')}
              </span>
            </div>
            <span className="hidden sm:inline ml-auto"><Stamp status={entry.status} /></span>
          </li>
        ))}
      </ul>
    </div>
  );
}
