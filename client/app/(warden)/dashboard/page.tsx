'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import { apiGet } from '@/app/lib/api';
import { iso, mondayOf, addDays, fmtLong, malayDay, fromISO, fmtShort, countRatedSections, HOSTELS, statusLabel, statusColor } from '@/app/lib/constants';
import Stamp from '@/app/components/Stamp';
import WeekProgress from '@/app/components/WeekProgress';
import { useToast } from '@/app/components/Toast';

interface DashboardData {
  user: { id: string; name: string; hostel: string };
  stats: { total_reports: number; submitted_this_week: number; reviewed_total: number };
  today: {
    date: string; day: string; duty_warden: { id: string; name: string } | null;
    is_user_on_duty: boolean; report: string | null;
  } | null;
  week_recap: any[];
  week_progress: { date: string; status: string }[];
}

interface RosterDay {
  date: string; day: string;
  putera: { id: string; name: string } | null;
  puteri: { id: string; name: string } | null;
}

export default function WardenDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [roster, setRoster] = useState<RosterDay[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = iso(new Date());
  const weekStart = mondayOf(new Date());

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      apiGet('/api/dashboard'),
      apiGet('/api/roster', { week_start: iso(weekStart) }),
    ]).then(results => {
      if (results[0].status === 'fulfilled') setData(results[0].value);
      else showToast('Gagal memuatkan dashboard.');
      if (results[1].status === 'fulfilled') setRoster(results[1].value.days || []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-dim-text">Memuatkan…</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-dim-text">Ralat memuatkan data.</div>;
  }

  const reportStatus = data.today?.report;
  const isScheduled = data.today?.is_user_on_duty || false;
  const hasReport = reportStatus && reportStatus !== 'none';
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const pastDays = weekDays.filter(d => d <= new Date());

  const dutyWardenName = (hostel: string, dayRoster: RosterDay | undefined) => {
    if (!dayRoster) return '—';
    return hostel === 'Asrama Putera' ? dayRoster.putera?.name || '—' : dayRoster.puteri?.name || '—';
  };

  const rosterMap = new Map(roster.map(d => [d.date, d]));

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">
            {fmtLong(new Date())}
          </span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">Dashboard</h2>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
        <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4">
          <div className="font-heading font-bold text-2xl sm:text-3xl leading-none text-ink-text">{data.stats.total_reports}</div>
          <div className="text-[0.6rem] sm:text-[0.7rem] text-dim-text uppercase tracking-wider font-mono mt-1">Jumlah Laporan</div>
        </div>
        <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4">
          <div className="font-heading font-bold text-2xl sm:text-3xl leading-none text-brass-deep">{data.stats.submitted_this_week}</div>
          <div className="text-[0.6rem] sm:text-[0.7rem] text-dim-text uppercase tracking-wider font-mono mt-1">Dihantar Minggu Ini</div>
        </div>
        <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4">
          <div className="font-heading font-bold text-2xl sm:text-3xl leading-none text-green">{data.stats.reviewed_total}</div>
          <div className="text-[0.6rem] sm:text-[0.7rem] text-dim-text uppercase tracking-wider font-mono mt-1">Telah Disemak</div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 sm:p-4 bg-paper-raised border border-paper-line rounded-lg mb-5">
        {hasReport ? (
          <>
            <span className="material-symbols-outlined text-2xl sm:text-3xl flex-shrink-0"
              style={{ color: reportStatus === 'reviewed' ? '#43604B' : reportStatus === 'flagged' ? '#A23E30' : reportStatus === 'submitted' ? '#7C5E1F' : '#7A7261' }}>
              {reportStatus === 'reviewed' ? 'check_circle' : reportStatus === 'flagged' ? 'warning' : reportStatus === 'submitted' ? 'send' : 'edit_note'}
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-sm sm:text-base truncate">
                Laporan Hari Ini {reportStatus === 'draft' ? '(Draf)' : 'Telah Direkodkan'}
              </h3>
              <p className="text-xs sm:text-sm text-dim-text truncate">
                <Stamp status={reportStatus} /> {reportStatus !== 'draft' ? 'Dihantar' : ''}
              </p>
            </div>
            <button type="button" onClick={() => router.push('/today')}
              className="px-3 py-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded border border-paper-line bg-transparent text-ink-text hover:bg-paper transition-colors flex-shrink-0">
              {reportStatus === 'draft' ? 'Sunting' : 'Lihat'}
            </button>
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-2xl sm:text-3xl text-dim-text flex-shrink-0">radio_button_unchecked</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-sm sm:text-base">
                Belum ada laporan hari ini{isScheduled ? ' — Anda bertugas' : ''}
              </h3>
              <p className="text-xs sm:text-sm text-dim-text">Sila hantar laporan.</p>
            </div>
            <button type="button" onClick={() => router.push('/today')}
              className="px-4 py-2.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors flex-shrink-0">
              Buat Laporan
            </button>
          </>
        )}
      </div>

      {pastDays.length > 0 && (
        <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4 mb-5">
          <h3 className="font-heading font-semibold text-sm sm:text-base mb-3">Rekap Minggu Ini</h3>
          <div className="flex flex-col gap-2">
            {pastDays.map(d => {
              const ds = iso(d);
              const dayRoster = rosterMap.get(ds);
              return (
                <div key={ds} className="p-2.5 bg-paper rounded">
                  <div className="font-heading font-semibold text-sm text-ink-text mb-1">
                    {malayDay(d)}, {d.getDate()} {fmtShort(d)}
                  </div>
                  {HOSTELS.map(hostel => {
                    const wn = dutyWardenName(hostel, dayRoster);
                    return (
                      <div key={hostel} className="flex items-center gap-2 py-1 text-sm">
                        <span className="font-semibold text-xs sm:text-sm min-w-[90px] sm:min-w-[110px] text-ink-text">{hostel === 'Asrama Putera' ? 'Putera' : 'Puteri'}</span>
                        <span className="text-xs text-dim-text truncate">{wn}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
        <h3 className="font-heading font-semibold text-base mb-3">Kemajuan Minggu Ini</h3>
        <WeekProgress days={data.week_progress} today={todayStr} />
      </div>
    </div>
  );
}
