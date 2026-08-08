'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fromISO, malayDay } from '@/app/lib/constants';
import { AXIS_TICK, C, TOOLTIP_STYLE } from '../constants';
import ChartCard, { NoData } from './ChartCard';
import type { AnalyticsData } from '../types';

export default function StatusChart({ week }: { week: AnalyticsData['week'] }) {
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
    <ChartCard title="Status Laporan Harian">
      {!hasWeekData ? <NoData /> : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E5" vertical={false} />
              <XAxis dataKey="day" tick={AXIS_TICK} axisLine={{ stroke: '#E2E8E5' }} tickLine={false} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="draft" name="Draf" stackId="s" fill={C.draft} />
              <Bar dataKey="submitted" name="Dihantar" stackId="s" fill={C.submitted} />
              <Bar dataKey="reviewed" name="Disemak" stackId="s" fill={C.reviewed} />
              <Bar dataKey="flagged" name="Ditanda" stackId="s" fill={C.flagged} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
