'use client';

export default function StatCard({ value, label, color }: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg p-3 sm:p-4">
      <div className={`font-heading font-bold text-2xl sm:text-3xl leading-none ${color || 'text-ink-text'}`}>{value}</div>
      <div className="text-[0.6rem] sm:text-[0.7rem] text-dim-text uppercase tracking-wider font-mono mt-1">{label}</div>
    </div>
  );
}
