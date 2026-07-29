import { statusLabel, statusColor } from '@/app/lib/constants';

export default function Stamp({ status }: { status: string }) {
  const color = statusColor(status);
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[0.68rem] font-semibold tracking-widest uppercase px-2 py-0.5 border border-current rounded-[2px] -rotate-1 leading-none whitespace-nowrap ${color}`}>
      <span className="w-1 h-1 rounded-full bg-current"></span>
      {statusLabel(status)}
    </span>
  );
}
