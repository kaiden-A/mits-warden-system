'use client';

import LoadingSpinner from '@/app/components/LoadingSpinner';
import MonthGrid from './MonthGrid';
import CutiList from './CutiList';
import { MONTHS, HARI, fmtRange, isoToLocal, monthsOf, cellsOf } from '../constants';
import { fromISO } from '@/app/lib/constants';
import type { CycleDetail, CycleEntryEdit, Warden } from '../types';

export default function CycleDetail({ detail, busy, wardens, dirtyEdits, pendingCount, onEditEntry, onBack, onPrint, onGenerate, onDelete, onToggleExcluded, onUpdateExcluded, onRemoveExcluded, onSaveExcluded }: {
  detail: CycleDetail;
  busy: boolean;
  wardens: Warden[];
  dirtyEdits: Map<string, CycleEntryEdit>;
  pendingCount: number;
  onEditEntry: (ds: string, values: CycleEntryEdit) => void;
  onBack: () => void;
  onPrint: () => void;
  onGenerate: () => void;
  onDelete: () => void;
  onToggleExcluded: (ds: string) => void;
  onUpdateExcluded: (ds: string, reason: string) => void;
  onRemoveExcluded: (ds: string) => void;
  onSaveExcluded: () => void;
}) {
  const entryByDate = new Map(detail.entries.map(e => [e.date, e]));
  const months = monthsOf(detail.start_date, detail.end_date);
  const puteraWardens = wardens.filter(w => w.status === 'active' && w.hostel === 'Asrama Putera');
  const puteriWardens = wardens.filter(w => w.status === 'active' && w.hostel === 'Asrama Puteri');

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-4 mt-7">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Jadual Warden</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">{detail.name}</h2>
          <p className="text-xs font-mono text-dim-text mt-1">{fmtRange(detail.start_date, detail.end_date)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={onBack}
            className="px-3 py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
            Kembali
          </button>
          <button type="button" onClick={onPrint} disabled={detail.entries.length === 0}
            className="px-3 py-1.5 text-sm font-semibold rounded bg-transparent text-brass-deep border border-brass-deep hover:bg-brass-wash disabled:opacity-60 transition-colors inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-base leading-none">print</span>
            Cetak PDF
          </button>
          <button type="button" onClick={onGenerate} disabled={busy}
            className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center gap-2">
            {busy && <LoadingSpinner size={16} />}
            {busy ? 'Menjana…' : (detail.entries.length > 0 ? 'Jana Semula' : 'Jana Roster')}
          </button>
          {pendingCount > 0 && (
            <span className="text-[0.68rem] font-semibold text-brass-deep bg-brass-wash border border-brass/40 rounded px-2 py-1 self-center">{pendingCount} perubahan belum disimpan</span>
          )}
          <button type="button" onClick={onDelete} disabled={busy}
            className="px-3 py-1.5 text-sm font-semibold rounded bg-transparent text-red border border-red hover:bg-red-wash transition-colors">
            Padam
          </button>
        </div>
      </div>

      <div className="bg-paper-raised border border-paper-line rounded-lg p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-sm">Tugasan Mengikut Tarikh</h3>
          {detail.entries.length > 0 && (
            <span className="text-[0.68rem] font-mono text-dim-text">{detail.entries.length} hari bertugas</span>
          )}
        </div>
        {detail.entries.length === 0 ? (
          <p className="text-sm text-dim-text text-center py-8">Belum dijana. Klik &quot;Jana Roster&quot; untuk menjana jadual auto.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4 items-start">
            {months.map(m => (
              <div key={m.toISOString()}>
                <p className="font-heading font-semibold text-sm mb-2">{MONTHS[m.getMonth()]} {m.getFullYear()}</p>
                <div className="table-scroll -mx-4 px-4 sm:mx-0 sm:px-0">
                  <table className="w-full border-collapse min-w-[500px] sm:min-w-0">
                    <thead>
                      <tr>
                        <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line w-[90px]">Tarikh</th>
                        <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line w-[70px]">Hari</th>
                        <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Asrama Putera</th>
                        <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Asrama Puteri</th>
                      </tr>
                    </thead>
<tbody>
  {cellsOf(m).filter(d => d && d >= fromISO(detail.start_date) && d <= fromISO(detail.end_date)).map(d => {
    if (!d) return null;
    const ds = isoToLocal(d);
    const ex = detail.excluded_dates.find(x => x.date === ds);
    const entry = entryByDate.get(ds);
    const dirty = dirtyEdits.get(ds);
    return (
      <tr key={ds} className={ex ? 'bg-red-wash/40' : dirty ? 'bg-brass-wash/60' : ''}>
        <td className="py-2 px-2 border-b border-paper-line">
          <span className="font-mono text-xs text-dim-text">{d.getDate()} {MONTHS[d.getMonth()].slice(0, 3)}</span>
          {dirty && <span className="ml-2 inline-block text-[0.6rem] font-semibold text-brass-deep uppercase tracking-wide bg-brass-wash border border-brass/40 rounded px-1 py-0.5">Diubah</span>}
          {ex && <span className="ml-2 text-[0.62rem] font-semibold text-red uppercase tracking-wide">{ex.reason || 'Cuti'}</span>}
        </td>
        <td className="py-2 px-2 border-b border-paper-line">
          <span className="font-mono text-xs text-dim-text">{HARI[d.getDay()]}</span>
        </td>
        <td className="py-1 px-2 border-b border-paper-line text-sm">
          {ex ? <span className="text-dim-text">—</span> : entry ? (
            <select
              value={dirty?.putera_warden_id ?? entry.putera?.id ?? ''}
              onChange={e => onEditEntry(ds, { putera_warden_id: e.target.value })}
              disabled={busy}
              title={dirty?.putera_warden_id ? puteraWardens.find(w => w.id === dirty.putera_warden_id)?.name : entry.putera?.name}
              className="w-full max-w-[200px] block truncate px-1 py-1 rounded bg-transparent text-sm text-ink-text outline-none focus-visible:border-brass disabled:opacity-60">
              {puteraWardens.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          ) : <span className="text-dim-text">—</span>}
        </td>
        <td className="py-1 px-2 border-b border-paper-line text-sm">
          {ex ? <span className="text-dim-text">—</span> : entry ? (
            <select
              value={dirty?.puteri_warden_id ?? entry.puteri?.id ?? ''}
              onChange={e => onEditEntry(ds, { puteri_warden_id: e.target.value })}
              disabled={busy}
              title={dirty?.puteri_warden_id ? puteriWardens.find(w => w.id === dirty.puteri_warden_id)?.name : entry.puteri?.name}
              className="w-full max-w-[200px] block truncate px-1 py-1 rounded bg-transparent text-sm text-ink-text outline-none focus-visible:border-brass disabled:opacity-60">
              {puteriWardens.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          ) : <span className="text-dim-text">—</span>}
        </td>
      </tr>
    );
  })}
</tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
        <h3 className="font-heading font-semibold text-sm mb-1">Tarikh Tiada Tugas (Cuti)</h3>
        <p className="text-[0.68rem] text-dim-text mb-3">Klik hari pada kalendar untuk menandakan tarikh tiada tugasan warden. Simpan untuk jana semula jadual.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {months.map(m => (
            <MonthGrid key={m.toISOString()} month={m}
              start={fromISO(detail.start_date)} end={fromISO(detail.end_date)}
              excluded={detail.excluded_dates}
              onToggle={onToggleExcluded} />
          ))}
        </div>
        {detail.excluded_dates.length > 0 && (
          <CutiList items={detail.excluded_dates} onUpdate={onUpdateExcluded} onRemove={onRemoveExcluded} />
        )}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-dim-text">
          <span><span className="inline-block w-3 h-3 rounded bg-red-wash border border-red mr-1 align-middle" />Tarikh Cuti (klik untuk tolak tarikh)</span>
          <span><span className="inline-block w-3 h-3 rounded bg-brass-wash border border-brass mr-1 align-middle" />Hari bertugas</span>
        </div>
        <div className="flex justify-end mt-3">
          <button type="button" onClick={onSaveExcluded} disabled={busy}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center gap-2">
            {busy && <LoadingSpinner size={14} />}
            {busy ? 'Menyimpan…' : 'Simpan & Jana Semula'}
          </button>
        </div>
      </div>
    </div>
  );
}
