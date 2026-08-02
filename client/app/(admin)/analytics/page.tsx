'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, type BarShapeProps } from 'recharts';
import { apiGet } from '@/app/lib/api';
import { iso, mondayOf, addDays, fromISO, malayDay } from '@/app/lib/constants';
import WeekFlip from '@/app/components/WeekFlip';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { useToast } from '@/app/components/Toast';

const C = {
  draft: '#B8AD97',
  submitted: '#A7802E',
  reviewed: '#43604B',
  flagged: '#A23E30',
  late: '#A23E30',
  putera: '#7C5E1F',
  puteri: '#43604B',
  good: '#43604B',
  poor: '#A23E30',
  na: '#B8AD97',
  missing: '#E2DAC4',
};

const SECTION_LABELS: Record<string, string> = {
  rutinAktivitiMurid: 'Rutin',
  tarbiyyahRohaniyyah: 'Tarbiyyah',
  kebersihanArasBawah: 'Aras Bawah',
  kebersihanAras1: 'Aras 1',
  kebersihanAras2: 'Aras 2',
  kebersihanAras3: 'Aras 3',
  dewanMakan: 'Dewan Makan',
};

const TOOLTIP_STYLE = {
  background: '#FBF9F3',
  border: '1px solid #E2DAC4',
  borderRadius: 8,
  fontSize: 12,
  color: '#2A2620',
};

const AXIS_TICK = { fontSize: 11, fill: '#7A7261' };

interface AnalyticsData {
  week_start: string;
  week: {
    date: string;
    status_counts: { draft: number; submitted: number; reviewed: number; flagged: number };
    late: number;
    total: number;
  }[];
  sections: {
    section_id: string;
    avg: { overall: number | null; putera: number | null; puteri: number | null };
    distribution: Record<string, number>;
    unrated: number;
    total: number;
  }[];
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
      <h3 className="font-heading font-semibold text-sm sm:text-base mb-3">{title}</h3>
      {children}
    </div>
  );
}

function NoData() {
  return (
    <div className="text-center text-sm text-dim-text py-10">
      Tiada data untuk minggu ini.
    </div>
  );
}

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
      fontSize={11} fontWeight={600} fill="#2A2620">
      {payload?.goodPct ?? 0}%
    </text>
  );
}

export default function AdminAnalyticsPage() {
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = iso(weekStart) === iso(mondayOf(new Date()));

  useEffect(() => {
    setLoading(true);
    apiGet('/api/analytics', { week_start: iso(weekStart) })
      .then(setData)
      .catch(() => showToast('Gagal memuatkan statistik.'))
      .finally(() => setLoading(false));
  }, [weekStart]);

  if (loading) {
    return <div className="text-center py-12 text-dim-text flex items-center justify-center gap-2"><LoadingSpinner size={18} />Memuatkan…</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-dim-text">Ralat memuatkan statistik.</div>;
  }

  const hasWeekData = data.week.some(d => d.total > 0);
  const hasSectionData = data.sections.some(s => s.total > 0);
  const hasPuteraRatings = data.sections.some(s => s.avg.putera != null);
  const hasPuteriRatings = data.sections.some(s => s.avg.puteri != null);
  const missingHostelNotes = [
    ...(!hasPuteraRatings ? ['Tiada laporan Asrama Putera minggu ini.'] : []),
    ...(!hasPuteriRatings ? ['Tiada laporan Asrama Puteri minggu ini.'] : []),
  ];

  const weekData = data.week.map(d => ({
    day: malayDay(fromISO(d.date)).slice(0, 3),
    draft: d.status_counts.draft,
    submitted: d.status_counts.submitted,
    reviewed: d.status_counts.reviewed,
    flagged: d.status_counts.flagged,
    late: d.late,
  }));

  const sectionData = data.sections.map(s => ({
    section: SECTION_LABELS[s.section_id] || s.section_id,
    putera: s.avg.putera ?? 0,
    puteri: s.avg.puteri ?? 0,
    puteraMissing: s.avg.putera == null,
    puteriMissing: s.avg.puteri == null,
  }));

  const healthData = data.sections.map(s => {
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
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Analisis</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">Statistik</h2>
        </div>
      </div>

      <WeekFlip
        weekStart={weekStart}
        weekEnd={weekEnd}
        isCurrentWeek={isCurrentWeek}
        onPrev={() => setWeekStart(prev => addDays(prev, -7))}
        onNext={() => setWeekStart(prev => addDays(prev, 7))}
        onThisWeek={() => setWeekStart(mondayOf(new Date()))}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Status Laporan Harian">
          {!hasWeekData ? <NoData /> : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2DAC4" vertical={false} />
                  <XAxis dataKey="day" tick={AXIS_TICK} axisLine={{ stroke: '#E2DAC4' }} tickLine={false} />
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

        <ChartCard title="Laporan Terlewat">
          {!hasWeekData ? <NoData /> : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2DAC4" vertical={false} />
                  <XAxis dataKey="day" tick={AXIS_TICK} axisLine={{ stroke: '#E2DAC4' }} tickLine={false} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="late" name="Terlewat" fill={C.late} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Purata Penilaian Mengikut Bahagian">
          {!hasSectionData ? <NoData /> : (
            <>
              {missingHostelNotes.length > 0 && (
                <p className="text-xs text-dim-text mb-2">{missingHostelNotes.join(' ')}</p>
              )}
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sectionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DAC4" vertical={false} />
                    <XAxis dataKey="section" tick={AXIS_TICK} axisLine={{ stroke: '#E2DAC4' }} tickLine={false} interval={0} />
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

        <ChartCard title="Kesihatan Bahagian (Baik/Cemerlang 3–4)">
          {!hasSectionData ? <NoData /> : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={healthData} layout="vertical" margin={{ top: 5, right: 34, left: 0, bottom: 0 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2DAC4" horizontal={false} />
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
      </div>
    </div>
  );
}
