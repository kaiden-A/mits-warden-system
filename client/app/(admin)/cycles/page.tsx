'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/app/lib/api';
import { useToast } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PageHeader from '@/app/components/PageHeader';
import { generateCycleSchedulePdf } from '@/app/lib/cycleSchedulePdf';
import CreateCycleForm from './components/CreateCycleForm';
import CycleList from './components/CycleList';
import CycleDetail from './components/CycleDetail';
import PdfModal from './components/PdfModal';
import { DEFAULT_SIGNATURES } from './constants';
import type { Warden, CycleSummary, CycleDetail as CycleDetailType, CreateCyclePayload, SignatureBlock } from './types';

function errMsg(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export default function AdminCyclesPage() {
  const { showToast } = useToast();
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [cycles, setCycles] = useState<CycleSummary[]>([]);
  const [detail, setDetail] = useState<CycleDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [openingCycle, setOpeningCycle] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfSignatures, setPdfSignatures] = useState<SignatureBlock[]>(DEFAULT_SIGNATURES);
  const [pdfInstitution, setPdfInstitution] = useState('MITS ALAM IMPIAN KLANG');
  const [pdfBusy, setPdfBusy] = useState(false);

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

  const handleCreate = async (payload: CreateCyclePayload) => {
    setBusy(true);
    try {
      const created = await apiPost('/api/cycles', payload);
      setShowForm(false);
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
      await generateCycleSchedulePdf(detail, pdfSignatures, pdfInstitution);
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
        <PageHeader
          eyebrow="Jadual"
          title="Kitaran Roster Warden"
          subtitle="Roster auto untuk tempoh 2 bulan. Jadual terus digunakan selepas dijana."
          action={!showForm && (
            <button type="button" onClick={() => setShowForm(true)}
              className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors">
              + Cipta Kitaran
            </button>
          )}
        />

        {showForm ? (
          <CreateCycleForm wardens={wardens} busy={busy} onCancel={() => setShowForm(false)} onCreate={handleCreate} />
        ) : (
          <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
            <CycleList cycles={cycles} busy={busy} openingCycle={openingCycle} onOpen={openCycle} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <CycleDetail
        detail={detail}
        busy={busy}
        onBack={closeCycle}
        onPrint={() => setShowPdfModal(true)}
        onGenerate={handleGenerate}
        onDelete={handleDelete}
        onToggleExcluded={toggleExcluded}
        onUpdateExcluded={updateExcluded}
        onRemoveExcluded={removeExcluded}
        onSaveExcluded={saveExcluded}
      />

      <PdfModal
        open={showPdfModal}
        busy={pdfBusy}
        signatures={pdfSignatures}
        institution={pdfInstitution}
        onInstitutionChange={setPdfInstitution}
        onSignatureChange={(i, updates) => setPdfSignatures(ps => ps.map((x, j) => j === i ? { ...x, ...updates } : x))}
        onGenerate={handlePrintPdf}
        onClose={() => setShowPdfModal(false)}
      />
    </div>
  );
}
