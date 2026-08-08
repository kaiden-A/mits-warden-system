'use client';

import { useState } from 'react';
import { useToast } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import MonthGrid from './MonthGrid';
import CutiList from './CutiList';
import { monthsOf, isoToLocal } from '../constants';
import type { Pair, ExcludedDate, Warden, CreateCyclePayload } from '../types';

const EMPTY_PAIR: Pair = { name: 'Pasangan A', putera_warden_id: '', puteri_warden_id: '' };

export default function CreateCycleForm({ wardens, busy, onCancel, onCreate }: {
  wardens: Warden[];
  busy: boolean;
  onCancel: () => void;
  onCreate: (payload: CreateCyclePayload) => void;
}) {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [pairs, setPairs] = useState<Pair[]>([EMPTY_PAIR]);
  const [excluded, setExcluded] = useState<ExcludedDate[]>([]);

  const puteraWardens = wardens.filter(w => w.status === 'active' && w.hostel === 'Asrama Putera');
  const puteriWardens = wardens.filter(w => w.status === 'active' && w.hostel === 'Asrama Puteri');

  const pickMonth = () => {
    if (!start) return;
    const s = new Date(start + 'T00:00:00');
    const e = new Date(s);
    e.setMonth(e.getMonth() + 1);
    e.setDate(0);
    setEnd(isoToLocal(e));
  };

  const toggleExcluded = (ds: string) => {
    setExcluded(prev =>
      prev.some(x => x.date === ds)
        ? prev.filter(x => x.date !== ds)
        : [...prev, { date: ds, reason: 'Cuti' }]
    );
  };

  const updateExcluded = (ds: string, reason: string) => {
    setExcluded(prev => prev.map(x => (x.date === ds ? { ...x, reason } : x)));
  };

  const removeExcluded = (ds: string) => {
    setExcluded(prev => prev.filter(x => x.date !== ds));
  };

  const handleCreate = () => {
    if (!name.trim() || !start || !end) {
      showToast('Sila lengkapkan nama dan tempoh kitaran.');
      return;
    }
    const pairsValid = pairs.every(p => p.name.trim() && p.putera_warden_id && p.puteri_warden_id);
    if (!pairsValid) {
      showToast('Sekurang-kurangnya satu pasangan perlu lengkap (nama + kedua-dua warden).');
      return;
    }
    onCreate({
      name: name.trim(),
      start_date: start,
      end_date: end,
      pairs: pairs.map(p => ({ ...p, name: p.name.trim() })),
      excluded_dates: excluded,
    });
  };

  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg p-4 mb-6 space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Nama Kitaran</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="Cth. Julai – Ogos 2026"
            className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
        </div>
        <div>
          <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Tarikh Mula</label>
          <input type="date" value={start} onChange={e => { setStart(e.target.value); if (end) pickMonth(); }}
            className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
        </div>
        <div>
          <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Tarikh Akhir</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)}
            className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
          <button type="button" onClick={pickMonth} className="text-[0.68rem] font-semibold text-brass hover:underline mt-1">Isi 2 bulan secara auto</button>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text">Pasangan Warden</label>
          <button type="button" onClick={() => setPairs(p => [...p, { name: `Pasangan ${String.fromCharCode(65 + p.length)}`, putera_warden_id: '', puteri_warden_id: '' }])}
            className="text-[0.68rem] font-semibold text-brass hover:underline">+ Tambah pasangan</button>
        </div>
        {pairs.map((p, i) => (
          <div key={i} className="flex flex-col sm:flex-row gap-2 mb-2 items-end">
            <input type="text" value={p.name} onChange={e => setPairs(ps => ps.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
              placeholder="Nama pasangan"
              className="w-full sm:w-40 px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
            <select value={p.putera_warden_id} onChange={e => setPairs(ps => ps.map((x, j) => j === i ? { ...x, putera_warden_id: e.target.value } : x))}
              className="w-full sm:w-56 px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass">
              <option value="">— Warden Putera —</option>
              {puteraWardens.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <select value={p.puteri_warden_id} onChange={e => setPairs(ps => ps.map((x, j) => j === i ? { ...x, puteri_warden_id: e.target.value } : x))}
              className="w-full sm:w-56 px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass">
              <option value="">— Warden Puteri —</option>
              {puteriWardens.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            {pairs.length > 1 && (
              <button type="button" onClick={() => setPairs(ps => ps.filter((_, j) => j !== i))}
                className="text-red text-xs font-semibold hover:underline">Padam</button>
            )}
          </div>
        ))}
      </div>

      <div>
        <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Tarikh Tiada Tugas (Cuti)</label>
        <p className="text-[0.68rem] text-dim-text mb-2">Klik tarikh pada kalendar untuk menandakan tiada tugas warden.</p>
        {start ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {monthsOf(start, end || start).map(m => (
              <MonthGrid key={m.toISOString()} month={m}
                start={new Date(start + 'T00:00:00')}
                end={end ? new Date(end + 'T00:00:00') : new Date(start + 'T00:00:00')}
                excluded={excluded}
                onToggle={toggleExcluded} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-dim-text">Pilih tarikh mula dahulu untuk melihat kalendar.</p>
        )}
        {excluded.length > 0 && (
          <CutiList items={excluded} onUpdate={updateExcluded} onRemove={removeExcluded} />
        )}
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-paper-line">
        <button type="button" onClick={onCancel}
          className="px-3 py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">Batal</button>
        <button type="button" onClick={handleCreate} disabled={busy}
          className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center gap-2">
          {busy && <LoadingSpinner size={16} />}
          {busy ? 'Mencipta…' : 'Cipta Kitaran'}
        </button>
      </div>
    </div>
  );
}
