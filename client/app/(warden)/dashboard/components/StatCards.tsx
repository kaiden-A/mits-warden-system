'use client';

import StatCard from '@/app/components/StatCard';

export default function StatCards({ stats }: {
  stats: { total_reports: number; submitted_this_week: number; reviewed_total: number };
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5">
      <StatCard value={stats.total_reports} label="Jumlah Laporan" />
      <StatCard value={stats.submitted_this_week} label="Dihantar Minggu Ini" color="text-brass-deep" />
      <StatCard value={stats.reviewed_total} label="Telah Disemak" color="text-green" />
    </div>
  );
}
