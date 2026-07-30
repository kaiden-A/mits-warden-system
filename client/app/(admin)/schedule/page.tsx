'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPut } from '@/app/lib/api';
import { iso, mondayOf, addDays, fromISO, fmtShort, malayDay } from '@/app/lib/constants';
import WeekFlip from '@/app/components/WeekFlip';
import { useToast } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';

interface Warden {
  id: string;
  name: string;
  hostel: string;
  status: string;
}

interface RosterDay {
  date: string;
  day: string;
  putera: { id: string; name: string } | null;
  puteri: { id: string; name: string } | null;
}

interface RosterData {
  week_start: string;
  days: RosterDay[];
}

export default function AdminSchedulePage() {
  const { showToast } = useToast();
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [roster, setRoster] = useState<RosterData | null>(null);
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const weekEnd = addDays(weekStart, 6);
  const isCurrentWeek = iso(weekStart) === iso(mondayOf(new Date()));

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      apiGet('/api/roster', { week_start: iso(weekStart) }),
      apiGet('/api/wardens'),
    ]).then(results => {
      if (results[0].status === 'fulfilled') setRoster(results[0].value);
      else showToast('Gagal memuatkan jadual.');
      if (results[1].status === 'fulfilled') setWardens(results[1].value.wardens || []);
      else showToast('Gagal memuatkan senarai warden.');
    }).finally(() => setLoading(false));
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const puteraWardens = wardens.filter(w => w.status === 'active' && w.hostel === 'Asrama Putera');
  const puteriWardens = wardens.filter(w => w.status === 'active' && w.hostel === 'Asrama Puteri');

  const handleSave = async () => {
    const assignments = days.map(d => {
      const ds = iso(d);
      return {
        date: ds,
        putera_warden_id: (document.getElementById(`sched-putera-${ds}`) as HTMLSelectElement)?.value,
        puteri_warden_id: (document.getElementById(`sched-puteri-${ds}`) as HTMLSelectElement)?.value,
      };
    });

    const missingDays = days.filter((_, i) => {
      const a = assignments[i];
      return !a.putera_warden_id || !a.puteri_warden_id;
    });

    if (missingDays.length > 0) {
      const names = missingDays.map(d => malayDay(d)).join(', ');
      showToast(`Sila pilih warden untuk kedua-dua asrama pada hari: ${names}.`);
      return;
    }

    setSaving(true);
    try {
      await apiPut('/api/roster', { week_start: iso(weekStart), assignments });
      showToast('Jadual minggu ini disimpan.');

      const r = await apiGet('/api/roster', { week_start: iso(weekStart) });
      setRoster(r);
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan jadual.');
    } finally {
      setSaving(false);
    }
  };

  const getDayRoster = (ds: string) => roster?.days?.find(d => d.date === ds);

  if (loading) {
    return <div className="text-center py-12 text-dim-text flex items-center justify-center gap-2"><LoadingSpinner size={18} />Memuatkan…</div>;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Pengurusan</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">Jadual Warden</h2>
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
                    <td className="py-3 px-2 border-b border-paper-line font-mono text-xs text-dim-text">{d.getDate()}/{d.getMonth() + 1}</td>
                    <td className="py-3 px-2 border-b border-paper-line">
                      <select id={`sched-putera-${ds}`}
                        defaultValue={dayRoster?.putera?.id || ''}
                        className="w-full px-2.5 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass min-h-[40px]">
                        <option value="">— Pilih —</option>
                        {puteraWardens.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-2 border-b border-paper-line">
                      <select id={`sched-puteri-${ds}`}
                        defaultValue={dayRoster?.puteri?.id || ''}
                        className="w-full px-2.5 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass min-h-[40px]">
                        <option value="">— Pilih —</option>
                        {puteriWardens.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-paper-line">
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center gap-2">
            {saving && <LoadingSpinner size={16} />}
            {saving ? 'Menyimpan…' : 'Simpan Jadual'}
          </button>
        </div>
      </div>
    </div>
  );
}
