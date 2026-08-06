'use client';

import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/app/lib/api';
import { useToast } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import Modal from '@/app/components/Modal';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

function errMsg(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

interface Warden {
  id: string;
  name: string;
  hostel: string;
  status: string;
}

interface Pair {
  name: string;
  putera_warden_id: string;
  puteri_warden_id: string;
}

interface ExcludedDate {
  date: string;
  reason: string;
}

interface CycleSummary {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface CycleEntry {
  id: string;
  date: string;
  pair_name: string | null;
  putera: { id: string; name: string } | null;
  puteri: { id: string; name: string } | null;
}

interface CycleDetail extends CycleSummary {
  pairs: Pair[];
  excluded_dates: ExcludedDate[];
  entries: CycleEntry[];
}

interface SignatureBlock {
  label: string;
  name: string;
  position: string;
}

const DEFAULT_SIGNATURES: SignatureBlock[] = [
  {
    label: 'DISEDIAKAN OLEH',
    name: 'SITI HAJAR BINTI RADZALI',
    position: 'SETIAUSAHA WARDEN',
  },
  {
    label: 'DISEMAK OLEH',
    name: 'NORAZLIN BINTI RAZAK',
    position: 'GURU PENOLONG KANAN HEM',
  },
  {
    label: 'DISAHKAN OLEH',
    name: 'DR. HAJI AZAMMUDDIN BIN ZAINUDDIN',
    position: 'PENGETUA',
  },
];

export default function AdminCyclesPage() {
  const { showToast } = useToast();
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [cycles, setCycles] = useState<CycleSummary[]>([]);
  const [detail, setDetail] = useState<CycleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openingCycle, setOpeningCycle] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newPairs, setNewPairs] = useState<Pair[]>([
    { name: 'Pasangan A', putera_warden_id: '', puteri_warden_id: '' },
  ]);
  const [newExcluded, setNewExcluded] = useState<ExcludedDate[]>([]);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfSignatures, setPdfSignatures] = useState<SignatureBlock[]>(DEFAULT_SIGNATURES);
  const [pdfInstitution, setPdfInstitution] = useState('MITS ALAM IMPIAN KLANG');
  const [pdfBusy, setPdfBusy] = useState(false);

  const puteraWardens = wardens.filter(w => w.status === 'active' && w.hostel === 'Asrama Putera');
  const puteriWardens = wardens.filter(w => w.status === 'active' && w.hostel === 'Asrama Puteri');

  const fetchCycles = () => {
    apiGet('/api/cycles')
      .then(setCycles)
      .catch(() => showToast('Gagal memuatkan kitaran.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCycles();
    apiGet('/api/wardens')
      .then((data: { wardens: Warden[] }) => setWardens(data.wardens))
      .catch(() => {});
  }, []);

  const openCycle = async (id: string) => {
    setOpeningCycle(true);
    try {
      const d = await apiGet(`/api/cycles/${id}`);
      setDetail(d);
      setShowForm(false);
    } catch (err) {
      showToast(errMsg(err, 'Gagal memuatkan kitaran.'));
    } finally {
      setOpeningCycle(false);
    }
  };

  const closeCycle = () => {
    setDetail(null);
    fetchCycles();
  };

  const pickMonth = () => {
    if (!newStart) return;
    const s = new Date(newStart + 'T00:00:00');
    const e = new Date(s);
    e.setMonth(e.getMonth() + 1);
    e.setDate(0);
    setNewEnd(isoToLocal(e));
  };

  const toggleNewExcluded = (ds: string) => {
    setNewExcluded(prev =>
      prev.some(x => x.date === ds)
        ? prev.filter(x => x.date !== ds)
        : [...prev, { date: ds, reason: 'Cuti' }]
    );
  };

  const updateNewExcluded = (ds: string, reason: string) => {
    setNewExcluded(prev => prev.map(x => (x.date === ds ? { ...x, reason } : x)));
  };

  const removeNewExcluded = (ds: string) => {
    setNewExcluded(prev => prev.filter(x => x.date !== ds));
  };

  const handleCreate = async () => {
    if (!newName.trim() || !newStart || !newEnd) {
      showToast('Sila lengkapkan nama dan tempoh kitaran.');
      return;
    }
    const pairsValid = newPairs.every(p => p.name.trim() && p.putera_warden_id && p.puteri_warden_id);
    if (!pairsValid) {
      showToast('Sekurang-kurangnya satu pasangan perlu lengkap (nama + kedua-dua warden).');
      return;
    }
    setBusy(true);
    try {
      const created = await apiPost('/api/cycles', {
        name: newName.trim(),
        start_date: newStart,
        end_date: newEnd,
        pairs: newPairs.map(p => ({ ...p, name: p.name.trim() })),
        excluded_dates: newExcluded,
      });
      setShowForm(false);
      setNewName('');
      setNewStart('');
      setNewEnd('');
      setNewPairs([{ name: 'Pasangan A', putera_warden_id: '', puteri_warden_id: '' }]);
      setNewExcluded([]);
      setDetail(created);
      showToast('Jadual warden telah dijana dan digunakan.');
      fetchCycles();
    } catch (err) {
      showToast(errMsg(err, 'Gagal mencipta kitaran.'));
    } finally {
      setBusy(false);
    }
  };

  const handleGenerate = async () => {
    if (!detail) return;
    if (detail.entries.length > 0) {
      if (!confirm('Jana semula akan menggantikan jadual semasa. Teruskan?')) return;
    }
    setBusy(true);
    try {
      const d = await apiPost(`/api/cycles/${detail.id}/generate`);
      setDetail(d);
      showToast('Jadual warden telah dijana dan digunakan.');
    } catch (err) {
      showToast(errMsg(err, 'Gagal menjana jadual.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    if (!window.confirm('Padam kitaran ini?')) return;
    setBusy(true);
    try {
      await apiDelete(`/api/cycles/${detail.id}`);
      setDetail(null);
      showToast('Kitaran dipadam.');
      fetchCycles();
    } catch (err) {
      showToast(errMsg(err, 'Gagal memadam kitaran.'));
    } finally {
      setBusy(false);
    }
  };

  const toggleExcluded = (ds: string) => {
    if (!detail) return;
    setDetail(prev => {
      if (!prev) return prev;
      const has = prev.excluded_dates.some(x => x.date === ds);
      return {
        ...prev,
        excluded_dates: has
          ? prev.excluded_dates.filter(x => x.date !== ds)
          : [...prev.excluded_dates, { date: ds, reason: 'Cuti' }],
      };
    });
  };

  const updateExcluded = (ds: string, reason: string) => {
    if (!detail) return;
    setDetail(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        excluded_dates: prev.excluded_dates.map(x => (x.date === ds ? { ...x, reason } : x)),
      };
    });
  };

  const removeExcluded = (ds: string) => {
    if (!detail) return;
    setDetail(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        excluded_dates: prev.excluded_dates.filter(x => x.date !== ds),
      };
    });
  };

  const saveExcluded = async () => {
    if (!detail) return;
    if (!window.confirm('Simpan tarikh cuti dan jana semula jadual?')) return;
    setBusy(true);
    try {
      await apiPatch(`/api/cycles/${detail.id}`, { excluded_dates: detail.excluded_dates });
      const d = await apiPost(`/api/cycles/${detail.id}/generate`);
      setDetail(d);
      showToast('Tarikh cuti disimpan, jadual dikemas kini.');
      fetchCycles();
    } catch (err) {
      showToast(errMsg(err, 'Gagal menyimpan tarikh cuti.'));
    } finally {
      setBusy(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!detail) return;
    setPdfBusy(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const M = 10;

      // Logo
      try {
        const res = await fetch('/logo_mits.jpeg');
        const blob = await res.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        doc.addImage(dataUrl, 'JPEG', M, 4, 32, 28);
      } catch { /* logo optional */ }

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text('JADUAL TUGASAN WARDEN ASRAMA', pageW / 2, 14, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('MAAHAD INTEGRASI TAHFIZ SELANGOR ALAM IMPIAN, KLANG', pageW / 2, 20, { align: 'center' });
      doc.text('Jalan Tun Teja 35/1, Alam Impian, Seksyen 35, 40470 Shah Alam, Selangor', pageW / 2, 24.5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const startYear = new Date(detail.start_date + 'T00:00:00').getFullYear();
      const endYear = new Date(detail.end_date + 'T00:00:00').getFullYear();
      doc.text(`TAHUN : ${startYear}${endYear !== startYear ? ` / ${endYear}` : ''}`, pageW / 2, 30, { align: 'center' });

      // Two month tables side by side
      const entryByDate = new Map(detail.entries.map(e => [e.date, e]));
      const excludedByDate = new Map(detail.excluded_dates.map(x => [x.date, x.reason]));
      const monthWidth = (pageW - M * 2 - 6) / 2;
      const dateW = 15;
      const hariW = 12;
      const nameW = (monthWidth - dateW - hariW) / 2;
      const startY = 36;

      const months = monthsOf(detail.start_date, detail.end_date);
      const tables = months.map(m => {
        const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
        const body: { date: string; hari: string; putera: string; puteri: string; reason: string | null; isWeekend: boolean }[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
          const dow = new Date(m.getFullYear(), m.getMonth(), d).getDay();
          const ds = isoToLocal(new Date(m.getFullYear(), m.getMonth(), d));
          const reason = excludedByDate.get(ds) || null;
          const entry = entryByDate.get(ds);
          body.push({
            date: `${d}`,
            hari: PDF_DAYS[dow],
            putera: reason ? reason.toUpperCase() : (entry?.putera?.name || '—'),
            puteri: reason ? reason.toUpperCase() : (entry?.puteri?.name || '—'),
            reason,
            isWeekend: dow === 0 || dow === 6,
          });
        }
        return { month: m, body };
      });

      tables.forEach((t, i) => {
        const x = M + i * (monthWidth + 6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${MONTHS[t.month.getMonth()].toUpperCase()} ${t.month.getFullYear()}`, x, startY - 2);
        autoTable(doc, {
          startY,
          margin: { left: x, right: pageW - x - monthWidth },
          tableWidth: monthWidth,
          head: [
            [{ content: 'TARIKH', rowSpan: 2 }, { content: 'HARI', rowSpan: 2 }, { content: 'WARDEN BERTUGAS', colSpan: 2 }],
            [{ content: 'ASRAMA PUTERA' }, { content: 'ASRAMA PUTERI' }],
          ],
          body: t.body.map(r => [r.date, r.hari, r.putera, r.puteri]),
          theme: 'grid',
          styles: { fontSize: 6, cellPadding: { top: 0.6, bottom: 0.6 }, halign: 'center', valign: 'middle' },
          headStyles: { fillColor: [49, 74, 98], fontSize: 5.5 },
          columnStyles: {
            0: { cellWidth: dateW },
            1: { cellWidth: hariW },
            2: { cellWidth: nameW, halign: 'left' },
            3: { cellWidth: nameW, halign: 'left' },
          },
          didParseCell: data => {
            if (data.section !== 'body') return;
            const row = t.body[data.row.index];
            if (row?.reason) {
              data.cell.styles.fillColor = [255, 241, 118];
              data.cell.styles.textColor = [120, 90, 0];
              if (data.column.index >= 2) data.cell.styles.fontStyle = 'bold';
            } else if (row?.isWeekend) {
              data.cell.styles.fillColor = [255, 224, 178];
              data.cell.styles.textColor = [100, 70, 0];
            }
          },
        });
      });

      const lastY = (doc.lastAutoTable?.finalY ?? startY) + 3;

      // Signature footer
      const sigY = lastY + 8;
      const blockW = (pageW - M * 2 - 12) / 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      pdfSignatures.forEach((s, i) => {
        const x = M + i * (blockW + 6);
        doc.text(s.label, x + blockW / 2, sigY, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Signature: (Signed)', x + blockW / 2, sigY + 15, { align: 'center' });
        doc.line(x + 6, sigY + 7, x + blockW - 6, sigY + 7);
        doc.setFontSize(7.5);
        doc.text(s.name, x + blockW / 2, sigY + 20, { align: 'center' });
        doc.text(s.position, x + blockW / 2, sigY + 24.5, { align: 'center' });
        doc.text(pdfInstitution, x + blockW / 2, sigY + 28.5, { align: 'center' });
        doc.setFont('helvetica', 'bold');
      });

      const safeName = detail.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      doc.save(`Jadual-Tugasan-Warden-${safeName}.pdf`);
      setShowPdfModal(false);
      showToast('PDF jadual telah dimuat turun.');
    } catch (err) {
      showToast(errMsg(err, 'Gagal menjana PDF.'));
    } finally {
      setPdfBusy(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-dim-text flex items-center justify-center gap-2"><LoadingSpinner size={18} />Memuatkan…</div>;
  }

  if (openingCycle) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center">
        <LoadingSpinner size={32} />
        <div>
          <p className="font-heading font-semibold text-sm text-ink-text">Memuatkan Jadual…</p>
          <p className="text-xs font-mono text-dim-text mt-1">Menyediakan tugasan mengikut tarikh untuk tempoh kitaran.</p>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div>
        <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
          <div>
            <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Jadual</span>
            <h2 className="font-heading text-2xl font-bold text-ink-text">Kitaran Roster Warden</h2>
            <p className="text-xs font-mono mt-1 text-dim-text">Roster auto untuk tempoh 2 bulan. Jadual terus digunakan selepas dijana.</p>
          </div>
          {!showForm && (
            <button type="button" onClick={() => setShowForm(true)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors">
              + Cipta Kitaran
            </button>
          )}
        </div>

        {showForm ? (
          <div className="bg-paper-raised border border-paper-line rounded-lg p-4 mb-6 space-y-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Nama Kitaran</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Cth. Julai – Ogos 2026"
                  className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
              </div>
              <div>
                <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Tarikh Mula</label>
                <input type="date" value={newStart} onChange={e => { setNewStart(e.target.value); if (newEnd) pickMonth(); }}
                  className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
              </div>
              <div>
                <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Tarikh Akhir</label>
                <input type="date" value={newEnd} onChange={e => setNewEnd(e.target.value)}
                  className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
                <button type="button" onClick={pickMonth} className="text-[0.68rem] font-semibold text-brass hover:underline mt-1">Isi 2 bulan secara auto</button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text">Pasangan Warden</label>
                <button type="button" onClick={() => setNewPairs(p => [...p, { name: `Pasangan ${String.fromCharCode(65 + p.length)}`, putera_warden_id: '', puteri_warden_id: '' }])}
                  className="text-[0.68rem] font-semibold text-brass hover:underline">+ Tambah pasangan</button>
              </div>
              {newPairs.map((p, i) => (
                <div key={i} className="flex flex-col sm:flex-row gap-2 mb-2 items-end">
                  <input type="text" value={p.name} onChange={e => setNewPairs(ps => ps.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                    placeholder="Nama pasangan"
                    className="w-full sm:w-40 px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
                  <select value={p.putera_warden_id} onChange={e => setNewPairs(ps => ps.map((x, j) => j === i ? { ...x, putera_warden_id: e.target.value } : x))}
                    className="w-full sm:w-56 px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass">
                    <option value="">— Warden Putera —</option>
                    {puteraWardens.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <select value={p.puteri_warden_id} onChange={e => setNewPairs(ps => ps.map((x, j) => j === i ? { ...x, puteri_warden_id: e.target.value } : x))}
                    className="w-full sm:w-56 px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass">
                    <option value="">— Warden Puteri —</option>
                    {puteriWardens.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  {newPairs.length > 1 && (
                    <button type="button" onClick={() => setNewPairs(ps => ps.filter((_, j) => j !== i))}
                      className="text-red text-xs font-semibold hover:underline">Padam</button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Tarikh Tiada Tugas (Cuti)</label>
              <p className="text-[0.68rem] text-dim-text mb-2">Klik tarikh pada kalendar untuk menandakan tiada tugas warden.</p>
              {newStart ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {monthsOf(newStart, newEnd || newStart).map(m => (
                    <MonthGrid key={m.toISOString()} month={m}
                      start={fromISO(newStart)}
                      end={newEnd ? fromISO(newEnd) : fromISO(newStart)}
                      excluded={newExcluded}
                      onToggle={toggleNewExcluded} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-dim-text">Pilih tarikh mula dahulu untuk melihat kalendar.</p>
              )}
              {newExcluded.length > 0 && (
                <CutiList items={newExcluded} onUpdate={updateNewExcluded} onRemove={removeNewExcluded} />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-paper-line">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">Batal</button>
              <button type="button" onClick={handleCreate} disabled={busy}
                className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center gap-2">
                {busy && <LoadingSpinner size={16} />}
                {busy ? 'Mencipta…' : 'Cipta Kitaran'}
              </button>
            </div>
          </div>
        ) : (
        <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
          {cycles.length === 0 ? (
            <p className="text-sm text-dim-text text-center py-8">Belum ada kitaran. Klik &quot;+ Cipta Kitaran&quot; untuk mula.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {cycles.map(c => (
                <div key={c.id} className="border border-paper-line rounded-lg p-4 hover:bg-paper transition-colors">
                  <p className="font-heading font-semibold text-sm mb-1">{c.name}</p>
                  <p className="text-xs text-dim-text font-mono mb-3">{fmtRange(c.start_date, c.end_date)}</p>
                  <button type="button" onClick={() => openCycle(c.id)} disabled={busy || openingCycle}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2">
                    {openingCycle && <LoadingSpinner size={12} />}
                    {openingCycle ? 'Membuka…' : 'Buka Jadual'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    );
  }

  const entryByDate = new Map(detail.entries.map(e => [e.date, e]));

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-4">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Jadual Warden</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">{detail.name}</h2>
          <p className="text-xs font-mono text-dim-text mt-1">{fmtRange(detail.start_date, detail.end_date)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={closeCycle}
            className="px-3 py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
            Kembali
          </button>
          <button type="button" onClick={() => setShowPdfModal(true)} disabled={detail.entries.length === 0 || pdfBusy}
            className="px-3 py-1.5 text-sm font-semibold rounded bg-transparent text-brass-deep border border-brass-deep hover:bg-brass-wash disabled:opacity-60 transition-colors inline-flex items-center gap-2">
            <span className="material-symbols-outlined text-base leading-none">print</span>
            Cetak PDF
          </button>
          <button type="button" onClick={handleGenerate} disabled={busy}
            className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center gap-2">
            {busy && <LoadingSpinner size={16} />}
            {busy ? 'Menjana…' : (detail.entries.length > 0 ? 'Jana Semula' : 'Jana Roster')}
          </button>
          <button type="button" onClick={handleDelete} disabled={busy}
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
            {monthsOf(detail.start_date, detail.end_date).map(m => (
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
                        return (
                          <tr key={ds} className={ex ? 'bg-red-wash/40' : ''}>
                            <td className="py-2.5 px-2 border-b border-paper-line">
                              <span className="font-mono text-xs text-dim-text">{d.getDate()} {MONTHS[d.getMonth()].slice(0, 3)}</span>
                              {ex && <span className="ml-2 text-[0.62rem] font-semibold text-red uppercase tracking-wide">{ex.reason || 'Cuti'}</span>}
                            </td>
                            <td className="py-2.5 px-2 border-b border-paper-line">
                              <span className="font-mono text-xs text-dim-text">{HARI[d.getDay()]}</span>
                            </td>
                            <td className="py-2.5 px-2 border-b border-paper-line text-sm">
                              {ex ? <span className="text-dim-text">—</span> : (entry?.putera?.name || '—')}
                            </td>
                            <td className="py-2.5 px-2 border-b border-paper-line text-sm">
                              {ex ? <span className="text-dim-text">—</span> : (entry?.puteri?.name || '—')}
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
          {monthsOf(detail.start_date, detail.end_date).map(m => (
            <MonthGrid key={m.toISOString()} month={m}
              start={fromISO(detail.start_date)} end={fromISO(detail.end_date)}
              excluded={detail.excluded_dates}
              onToggle={toggleExcluded} />
          ))}
        </div>
        {detail.excluded_dates.length > 0 && (
          <CutiList items={detail.excluded_dates} onUpdate={updateExcluded} onRemove={removeExcluded} />
        )}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-dim-text">
          <span><span className="inline-block w-3 h-3 rounded bg-red-wash border border-red mr-1 align-middle" />Tarikh Cuti (klik untuk tolak tarikh)</span>
          <span><span className="inline-block w-3 h-3 rounded bg-brass-wash border border-brass mr-1 align-middle" />Hari bertugas</span>
        </div>
        <div className="flex justify-end mt-3">
          <button type="button" onClick={saveExcluded} disabled={busy}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center gap-2">
            {busy && <LoadingSpinner size={14} />}
            {busy ? 'Menyimpan…' : 'Simpan & Jana Semula'}
          </button>
        </div>
      </div>

      <Modal open={showPdfModal} onClose={() => setShowPdfModal(false)} wide>
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-heading font-semibold text-lg">Cetak Jadual PDF</h3>
            <p className="text-xs font-mono text-dim-text mt-1">Isi maklumat untuk bahagian tandatangan.</p>
          </div>
          <button type="button" onClick={() => setShowPdfModal(false)}
            className="text-dim-text hover:text-ink-text text-xl leading-none p-0.5">&times;</button>
        </div>
        <div className="space-y-4">
          <div className="border border-paper-line rounded-lg p-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-dim-text mb-2">Institusi</p>
            <input type="text" value={pdfInstitution}
              onChange={e => setPdfInstitution(e.target.value)}
              className="w-full px-2.5 py-2 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
          </div>
          {pdfSignatures.map((s, i) => (
            <div key={i} className="border border-paper-line rounded-lg p-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-dim-text mb-2">{s.label}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[0.65rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Nama</label>
                  <input type="text" value={s.name}
                    onChange={e => setPdfSignatures(ps => ps.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                    className="w-full px-2.5 py-2 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
                </div>
                <div>
                  <label className="block text-[0.65rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Jawatan</label>
                  <input type="text" value={s.position}
                    onChange={e => setPdfSignatures(ps => ps.map((x, j) => j === i ? { ...x, position: e.target.value } : x))}
                    className="w-full px-2.5 py-2 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-paper-line">
          <button type="button" onClick={() => setShowPdfModal(false)}
            className="px-3 py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
            Batal
          </button>
          <button type="button" onClick={handlePrintPdf} disabled={pdfBusy}
            className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center gap-2">
            {pdfBusy && <LoadingSpinner size={16} />}
            {pdfBusy ? 'Menjana PDF…' : 'Jana PDF'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

const MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
const WEEKDAYS = ['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
const PDF_DAYS = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];
const HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

function fmtRange(a: string, b: string) {
  const d1 = new Date(a + 'T00:00:00');
  const d2 = new Date(b + 'T00:00:00');
  return `${d1.getDate()} ${MONTHS[d1.getMonth()]} – ${d2.getDate()} ${MONTHS[d2.getMonth()]} ${d2.getFullYear()}`;
}

function fromISO(s: string) {
  return new Date(s + 'T00:00:00');
}

function shortDate(ds: string) {
  const d = new Date(ds + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function isoToLocal(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function monthsOf(start: string, end: string): Date[] {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const first = new Date(s.getFullYear(), s.getMonth(), 1);
  const last = new Date(e.getFullYear(), e.getMonth(), 1);
  const out = [];
  let cur = first;
  while (cur <= last) {
    out.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return out;
}

function cellsOf(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  return cells;
}

function MonthGrid({ month, start, end, excluded, onToggle }: {
  month: Date;
  start: Date;
  end: Date;
  excluded: ExcludedDate[];
  onToggle: (ds: string) => void;
}) {
  return (
    <div>
      <p className="font-heading font-semibold text-sm mb-2">{MONTHS[month.getMonth()]} {month.getFullYear()}</p>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map(w => <div key={w} className="text-center text-[0.6rem] font-mono uppercase tracking-wider text-dim-text py-1">{w}</div>)}
        {cellsOf(month).map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = isoToLocal(d);
          const inRange = d >= start && d <= end;
          const ex = excluded.find(x => x.date === ds);
          return (
            <button key={i} type="button" onClick={() => onToggle(ds)}
              disabled={!inRange}
              title={ex ? ex.reason : undefined}
              className={`aspect-square text-xs flex items-center justify-center rounded border transition-colors ${
                !inRange ? 'text-dim-text/30 border-transparent' :
                ex ? 'bg-red-wash border-red text-red font-semibold' :
                'bg-white border-paper-line text-ink-text hover:border-brass'
              }`}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CutiList({ items, onUpdate, onRemove }: {
  items: ExcludedDate[];
  onUpdate: (ds: string, reason: string) => void;
  onRemove: (ds: string) => void;
}) {
  return (
    <div className="mt-3">
      <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-dim-text mb-1.5">Senarai Tarikh Cuti ({items.length})</p>
      <div className="space-y-1.5">
        {[...items].sort((a, b) => a.date.localeCompare(b.date)).map(x => (
          <div key={x.date} className="flex items-center gap-2">
            <span className="font-mono text-xs text-dim-text whitespace-nowrap w-20">{shortDate(x.date)}</span>
            <input type="text" value={x.reason}
              onChange={e => onUpdate(x.date, e.target.value)}
              placeholder="Sebab cuti (cth: Cuti Raya)"
              className="flex-1 px-2.5 py-1.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
            <button type="button" onClick={() => onRemove(x.date)}
              className="text-red text-xs font-semibold hover:underline whitespace-nowrap">Padam</button>
          </div>
        ))}
      </div>
    </div>
  );
}
