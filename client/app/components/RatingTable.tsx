import RatingBadge from './RatingBadge';

interface Item {
  key: string;
  label: string;
}

export function RatingTableEditable({ items, data, onRatingChange }: {
  items: Item[];
  data?: Record<string, string>;
  onRatingChange: (key: string, value: string) => void;
}) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="text-left text-[0.62rem] sm:text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-1.5 pl-1.5 pr-2 border-b border-paper-line">Perkara</th>
          <th className="text-left text-[0.62rem] sm:text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-1.5 pr-1.5 border-b border-paper-line">Penilaian</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.key}>
            <td className="py-2 sm:py-1.5 pl-1.5 pr-2 border-b border-paper-line text-sm">{item.label}</td>
            <td className="py-2 sm:py-1.5 pr-1.5 border-b border-paper-line">
              <select
                value={data?.[item.key] || ''}
                onChange={e => onRatingChange(item.key, e.target.value)}
                className={`rating-select w-20 px-2 py-1.5 sm:py-1 text-xs font-semibold border rounded border-paper-line cursor-pointer bg-white min-h-[36px] ${data?.[item.key] ? 'rating-' + data[item.key] : ''}`}>
                <option value="">—</option>
                <option value="1" title="Tidak Memuaskan">1</option>
                <option value="2" title="Sederhana">2</option>
                <option value="3" title="Baik">3</option>
                <option value="4" title="Cemerlang">4</option>
                <option value="NA" title="Tiada Kaitan">N/A</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function RatingTableReadOnly({ items, data }: {
  items: Item[];
  data?: Record<string, string>;
}) {
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
            <td className="py-1.5 pr-1.5 border-b border-paper-line"><RatingBadge value={data?.[item.key]} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
