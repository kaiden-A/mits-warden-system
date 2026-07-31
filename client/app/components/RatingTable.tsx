import { RATING_OPTS, fromISO } from '@/app/lib/constants';
import RatingBadge from './RatingBadge';

interface Item {
  key: string;
  label: string;
  days?: number[];
}

export function RatingTableEditable({ items, data, onRatingChange }: {
  items: Item[];
  data?: Record<string, string>;
  onRatingChange: (key: string, value: string) => void;
}) {
  return (
    <table className="w-full border-collapse table-card">
      <thead>
        <tr>
          <th className="text-left text-[0.62rem] sm:text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-1.5 pl-1.5 pr-2 border-b border-paper-line">Perkara</th>
          <th className="text-left text-[0.62rem] sm:text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-1.5 pr-1.5 border-b border-paper-line">Penilaian</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.key}>
            <td data-label="Perkara" className="py-2 sm:py-1.5 pl-1.5 pr-2 border-b border-paper-line text-sm">{item.label}</td>
            <td data-label="Penilaian" className="py-2 sm:py-1.5 pr-1.5 border-b border-paper-line">
              <div className="flex gap-1 min-w-0 w-full sm:w-auto">
                {RATING_OPTS.map(opt => {
                  const selected = data?.[item.key] === opt.value;
                  return (
                    <button key={opt.value} type="button" title={opt.title} aria-pressed={selected}
                      onClick={() => onRatingChange(item.key, selected ? '' : opt.value)}
                      className={`flex-1 sm:flex-none min-w-0 sm:min-w-[36px] min-h-[44px] sm:min-h-[36px] px-1 rounded border-2 text-xs font-semibold transition-colors cursor-pointer ${
                        selected
                          ? `border-current rating-${opt.value}`
                          : 'border-paper-line text-dim-text bg-white hover:border-brass hover:text-brass-deep'
                      }`}>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RatingTableReadOnly({ items, data, date }: {
  items: Item[];
  data?: Record<string, string>;
  date?: string;
}) {
  const reportDate = date ? fromISO(date) : null;
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-1.5 pl-1.5 pr-2 border-b border-paper-line">Perkara</th>
          <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-1.5 pr-1.5 border-b border-paper-line">Penilaian</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.key}>
            <td className="py-1.5 pl-1.5 pr-2 border-b border-paper-line text-sm">{item.label}</td>
            <td className="py-1.5 pr-1.5 border-b border-paper-line">
              <RatingBadge value={data?.[item.key] || (reportDate && item.days && !item.days.includes(reportDate.getDay()) ? 'NA' : undefined)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
