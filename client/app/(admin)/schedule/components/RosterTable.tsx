'use client';

import { iso, fmtShort, malayDay } from '@/app/lib/constants';
import type { RosterData } from '../types';

export default function RosterTable({ days, roster }: {
  days: Date[];
  roster: RosterData | null;
}) {
  const getDayRoster = (ds: string) => roster?.days?.find(d => d.date === ds);

  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
      <div className="table-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-collapse min-w-[500px] sm:min-w-0">
          <thead>
            <tr>
              <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line w-[80px]">Hari</th>
              <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line w-[80px]">Tarikh</th>
              <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Asrama Putera</th>
              <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Asrama Puteri</th>
            </tr>
          </thead>
          <tbody>
            {days.map(d => {
              const ds = iso(d);
              const dayRoster = getDayRoster(ds);
              return (
                <tr key={ds}>
                  <td className="py-3 px-2 border-b border-paper-line"><strong className="text-sm">{malayDay(d).slice(0, 3)}</strong></td>
                  <td className="py-3 px-2 border-b border-paper-line font-mono text-xs text-dim-text">{fmtShort(d)}</td>
                  <td className="py-3 px-2 border-b border-paper-line text-sm">
                    {dayRoster?.putera?.name || <span className="text-dim-text">—</span>}
                  </td>
                  <td className="py-3 px-2 border-b border-paper-line text-sm">
                    {dayRoster?.puteri?.name || <span className="text-dim-text">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
