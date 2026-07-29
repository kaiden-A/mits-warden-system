import { malayDay } from '@/app/lib/constants';

interface DayStatus {
  date: string;
  status: string;
}

export default function WeekProgress({ days, today }: { days: DayStatus[]; today: string }) {
  return (
    <div className="flex gap-1.5 sm:gap-2 justify-center flex-wrap">
      {days.map(d => {
        const isToday = d.date === today;
        const isFuture = d.date > today;
        const status = d.status;

        let cls = '';
        let check = '';

        if (status === 'submitted' || status === 'reviewed' || status === 'flagged') {
          cls = 'bg-green-wash border-[#8AAA8A]';
          check = '✓';
        } else if (isFuture) {
          cls = 'bg-paper border-paper-line';
          check = '';
        } else if (status === 'none') {
          cls = 'bg-red-wash border-[#D4A89E]';
          check = '✗';
        } else if (status === 'draft') {
          cls = 'bg-paper border-paper-line';
          check = '·';
        }

        if (isToday) cls += ' border-brass border-2';

        const dateObj = new Date(d.date + 'T00:00:00');

        return (
          <div key={d.date} className={`flex flex-col items-center gap-0.5 py-1.5 sm:py-2 px-1.5 sm:px-2.5 rounded min-w-[44px] sm:min-w-[56px] border ${cls}`}>
            <span className="text-[0.55rem] sm:text-[0.6rem] uppercase tracking-wider text-dim-text font-mono">
              {malayDay(dateObj).slice(0, 3)}
            </span>
            <span className="text-xs sm:text-sm font-semibold">{dateObj.getDate()}</span>
            <span className="text-[0.65rem] sm:text-xs mt-0.5">{check}</span>
          </div>
        );
      })}
    </div>
  );
}
