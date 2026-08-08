'use client';

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps } from 'recharts';
import { AXIS_TICK, C, SECTION_LABELS, TOOLTIP_STYLE } from '../constants';
import ChartCard, { NoData } from './ChartCard';
import type { AnalyticsData } from '../types';

export default function SectionRatingsChart({ sections }: { sections: AnalyticsData['sections'] }) {
  const hasSectionData = sections.some(s => s.total > 0);
  const hasPuteraRatings = sections.some(s => s.avg.putera != null);
  const hasPuteriRatings = sections.some(s => s.avg.puteri != null);
  const missingHostelNotes = [
    ...(!hasPuteraRatings ? ['Tiada laporan Asrama Putera minggu ini.'] : []),
    ...(!hasPuteriRatings ? ['Tiada laporan Asrama Puteri minggu ini.'] : []),
  ];

  const data = sections.map(s => ({
    section: SECTION_LABELS[s.section_id] || s.section_id,
    putera: s.avg.putera ?? 0,
    puteri: s.avg.puteri ?? 0,
    puteraMissing: s.avg.putera == null,
    puteriMissing: s.avg.puteri == null,
  }));

  return (
    <ChartCard title="Purata Penilaian Mengikut Bahagian">
      {!hasSectionData ? <NoData /> : (
        <>
          {missingHostelNotes.length > 0 && (
            <p className="text-xs text-dim-text mb-2">{missingHostelNotes.join(' ')}</p>
          )}
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8E5" vertical={false} />
                <XAxis dataKey="section" tick={AXIS_TICK} axisLine={{ stroke: '#E2E8E5' }} tickLine={false} interval={0} />
                <YAxis domain={[0, 4]} tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE}
                  formatter={(v, name, item) =>
                    (name === 'Putera' && item.payload.puteraMissing) ||
                    (name === 'Puteri' && item.payload.puteriMissing)
                      ? '—'
                      : typeof v === 'number' ? v.toFixed(2) : '—'} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="putera" name="Putera" radius={[4, 4, 0, 0]}
                  shape={(props: BarShapeProps) => {
                    const { x, y, width, height, payload } = props;
                    if (payload?.puteraMissing) {
                      return <rect x={x} y={y} width={6} height={height} fill={C.missing} rx={3} opacity={0.7} />;
                    }
                    return <rect x={x} y={y} width={width} height={height} fill={C.putera} rx={4} />;
                  }} />
                <Bar dataKey="puteri" name="Puteri" radius={[4, 4, 0, 0]}
                  shape={(props: BarShapeProps) => {
                    const { x, y, width, height, payload } = props;
                    if (payload?.puteriMissing) {
                      return <rect x={x} y={y} width={6} height={height} fill={C.missing} rx={3} opacity={0.7} />;
                    }
                    return <rect x={x} y={y} width={width} height={height} fill={C.puteri} rx={4} />;
                  }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </ChartCard>
  );
}
