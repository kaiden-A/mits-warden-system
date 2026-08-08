'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { apiGet } from '@/app/lib/api';
import { fmtShort, fmtTime, fromISO, statusLabel, statusColor } from '@/app/lib/constants';
import Stamp from '@/app/components/Stamp';
import { useToast } from '@/app/components/Toast';

interface AdminDashboard {
  stats: {
    active_wardens: number;
    pending_review_this_week: number;
    reviewed_this_week: number;
    flagged_total: number;
  };
  recent_entries: {
    id: string;
    date: string;
    hostel: string;
    warden_name: string;
    status: string;
    inspection_time: string | null;
    submitted_at: string | null;
  }[];
}

const GREETINGS = ['Selamat pagi', 'Selamat petang', 'Selamat malam'];

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return GREETINGS[0];
  if (h < 18) return GREETINGS[1];
  return GREETINGS[2];
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const greeting = useMemo(timeGreeting, []);

  useEffect(() => {
    apiGet('/api/dashboard', { admin: '1' })
      .then(setData)
      .catch(() => showToast('Gagal memuatkan dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-dim-text">Memuatkan…</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-dim-text">Ralat memuatkan data.</div>;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Ringkasan MITSAI</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">{greeting}, {user?.name || 'Pengarah'}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4">
          <div className="font-heading font-bold text-2xl sm:text-3xl leading-none text-ink-text">{data.stats.active_wardens}</div>
          <div className="text-[0.62rem] sm:text-[0.7rem] text-dim-text uppercase tracking-wider font-mono mt-1">Warden Aktif</div>
        </div>
        <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4">
          <div className="font-heading font-bold text-2xl sm:text-3xl leading-none text-brass-deep">{data.stats.pending_review_this_week}</div>
          <div className="text-[0.62rem] sm:text-[0.7rem] text-dim-text uppercase tracking-wider font-mono mt-1">Belum Disemak</div>
        </div>
        <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4">
          <div className="font-heading font-bold text-2xl sm:text-3xl leading-none text-green">{data.stats.reviewed_this_week}</div>
          <div className="text-[0.62rem] sm:text-[0.7rem] text-dim-text uppercase tracking-wider font-mono mt-1">Disemak Minggu Ini</div>
        </div>
        <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4">
          <div className="font-heading font-bold text-2xl sm:text-3xl leading-none text-red">{data.stats.flagged_total}</div>
          <div className="text-[0.62rem] sm:text-[0.7rem] text-dim-text uppercase tracking-wider font-mono mt-1">Ditanda Sepanjang Masa</div>
        </div>
      </div>

      <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
        <h3 className="font-heading font-semibold text-base mb-3">Entri Terkini</h3>
        <ul className="m-0 p-0 list-none">
          {data.recent_entries.length === 0 && (
            <li className="text-sm text-dim-text">Tiada entri.</li>
          )}
          {data.recent_entries.map(entry => (
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
    </div>
  );
}
