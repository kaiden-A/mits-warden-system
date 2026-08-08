export default function RatingBadge({ value }: { value: string | undefined | null }) {
  if (!value) {
    return <span className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold text-center min-w-[28px]" style={{ background: '#F3F4F6', color: '#999' }}>—</span>;
  }

  const colors: Record<string, { bg: string; text: string }> = {
    '1': { bg: '#F6E3DE', text: '#B3402E' },
    '2': { bg: '#F7EDCF', text: '#8F6A10' },
    '3': { bg: '#E1ECF7', text: '#1D4F8F' },
    '4': { bg: '#E2F2E7', text: '#2E7D4F' },
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
