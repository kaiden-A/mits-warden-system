export default function RatingBadge({ value }: { value: string | undefined | null }) {
  if (!value) {
    return <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold text-center min-w-[28px]" style={{ background: '#f0ede4', color: '#999' }}>—</span>;
  }

  const colors: Record<string, { bg: string; text: string }> = {
    '1': { bg: '#F3DFDA', text: '#A23E30' },
    '2': { bg: '#FDEBD0', text: '#8B6914' },
    '3': { bg: '#D6EAF8', text: '#1A5276' },
    '4': { bg: '#DEE7DD', text: '#43604B' },
    'NA': { bg: '#EEEEEE', text: '#999' },
  };

  const c = colors[value] || colors['NA'];
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold text-center min-w-[28px]"
      style={{ background: c.bg, color: c.text }}>
      {value === 'NA' ? 'N/A' : value}
    </span>
  );
}
