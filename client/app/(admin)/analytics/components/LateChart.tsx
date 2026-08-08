'use client';

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fromISO, malayDay } from '@/app/lib/constants';
import { AXIS_TICK, C, TOOLTIP_STYLE } from '../constants';
import ChartCard, { NoData } from './ChartCard';
import type { AnalyticsData } from '../types';

export default function LateChart({ week }: { week: AnalyticsData['week'] }) {
  const hasWeekData = week.some(d => d.total > 0);
  const data = week.map(d => ({
    day: malayDay(fromISO(d.date)).slice(0, 3),
    draft: d.status_counts.draft,
    submitted: d.status_counts.submitted,
    reviewed: d.status_counts.reviewed,
    flagged: d.status_counts.flagged,
    late: d.late,
  }));

  return (
    <ChartCard title="Laporan Terlewat">
      {!hasWeekData ? <NoData /> : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E5" vertical={false} />
              <XAxis dataKey="day" tick={AXIS_TICK} axisLine={{ stroke: '#E2E8E5' }} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="late" name="Terlewat" fill={C.late} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
