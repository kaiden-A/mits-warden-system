'use client';

export default function PageHeader({ eyebrow, title, subtitle, action }: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6 mt-7">
      <div>
        {eyebrow && (
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">{eyebrow}</span>
        )}
        <h2 className="font-heading text-2xl font-bold text-ink-text">{title}</h2>
        {subtitle && (
          <p className="text-xs font-mono mt-1 text-dim-text">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
