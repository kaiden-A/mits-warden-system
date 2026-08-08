'use client';

import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { C, SECTION_LABELS, TOOLTIP_STYLE, AXIS_TICK } from '../constants';
import ChartCard, { NoData } from './ChartCard';
import type { AnalyticsData } from '../types';

interface HealthRow {
  section?: string;
  good?: number;
  poor?: number;
  na?: number;
  goodPct?: number;
  poorPct?: number;
  naPct?: number;
}

function HealthTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: HealthRow }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div style={TOOLTIP_STYLE} className="px-3 py-2">
      <div className="font-semibold mb-1">{p.section}</div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm inline-block" style={{ background: C.good }} />
        Baik/Cemerlang: {p.good} ({p.goodPct}%)
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm inline-block" style={{ background: C.poor }} />
        Perlu Perhatian: {p.poor} ({p.poorPct}%)
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-sm inline-block" style={{ background: C.na }} />
        N/A: {p.na} ({p.naPct}%)
      </div>
    </div>
  );
}

function HealthPctLabel({ x, y, width, height, payload }: { x?: number; y?: number; width?: number; height?: number; payload?: HealthRow }) {
  return (
    <text x={(x ?? 0) + (width ?? 0) + 6} y={(y ?? 0) + (height ?? 0) / 2} dy="0.35em"
      fontSize={11} fontWeight={600} fill="#1F2937">
      {payload?.goodPct ?? 0}%
    </text>
  );
}

export default function SectionHealthChart({ sections }: { sections: AnalyticsData['sections'] }) {
  const hasSectionData = sections.some(s => s.total > 0);

  const data = sections.map(s => {
    const d = s.distribution;
    const good = (d['3'] || 0) + (d['4'] || 0);
    const poor = (d['1'] || 0) + (d['2'] || 0);
    const na = d['NA'] || 0;
    const total = good + poor + na;
    const goodPct = total ? Math.round((good / total) * 100) : 0;
    const poorPct = total ? Math.round((poor / total) * 100) : 0;
    const naPct = total ? 100 - goodPct - poorPct : 0;
    return {
      section: SECTION_LABELS[s.section_id] || s.section_id,
      goodPct,
      poorPct,
      naPct,
      good,
      poor,
      na,
      pct: 100,
    };
  });

  return (
    <ChartCard title="Kesihatan Bahagian (Baik/Cemerlang 3–4)">
      {!hasSectionData ? <NoData /> : (
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 34, left: 0, bottom: 0 }} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E5" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis type="category" dataKey="section" tick={AXIS_TICK} axisLine={false} tickLine={false} width={76} />
              <Tooltip content={<HealthTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="poorPct" name="Perlu Perhatian" stackId="h" fill={C.poor} radius={[4, 0, 0, 4]} />
              <Bar dataKey="goodPct" name="Baik/Cemerlang" stackId="h" fill={C.good} radius={0} />
              <Bar dataKey="naPct" name="N/A" stackId="h" fill={C.na} radius={[0, 4, 4, 0]} />
              <Bar dataKey="pct" name=" " fill="transparent" legendType="none" radius={0} isAnimationActive={false}>
                <LabelList dataKey="pct" content={<HealthPctLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}
