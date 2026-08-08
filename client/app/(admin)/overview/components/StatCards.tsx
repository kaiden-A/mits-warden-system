'use client';

import StatCard from '@/app/components/StatCard';

export default function StatCards({ stats }: {
  stats: {
    active_wardens: number;
    pending_review_this_week: number;
    reviewed_this_week: number;
    flagged_total: number;
  };
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-5">
      <StatCard value={stats.active_wardens} label="Warden Aktif" />
      <StatCard value={stats.pending_review_this_week} label="Belum Disemak" color="text-brass-deep" />
      <StatCard value={stats.reviewed_this_week} label="Disemak Minggu Ini" color="text-green" />
      <StatCard value={stats.flagged_total} label="Ditanda Sepanjang Masa" color="text-red" />
    </div>
  );
}
