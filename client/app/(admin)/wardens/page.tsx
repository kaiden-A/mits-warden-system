'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '@/app/lib/api';
import { useToast } from '@/app/components/Toast';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import PageHeader from '@/app/components/PageHeader';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import WardenTable from './components/WardenTable';
import WardenCards from './components/WardenCards';
import AddWardenModal from './components/AddWardenModal';
import RevokeConfirmModal from './components/RevokeConfirmModal';
import type { Warden, AddWardenPayload } from './types';

export default function AdminWardensPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const { user } = useAuth();
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [revokeWarden, setRevokeWarden] = useState<Warden | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchWardens = () => {
    apiGet('/api/wardens')
      .then((data: { wardens: Warden[] }) => setWardens(data.wardens))
      .catch(() => showToast('Gagal memuatkan senarai warden.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWardens();
  }, []);

  const handleAdd = async (payload: AddWardenPayload) => {
    setAdding(true);
    try {
      await apiPost('/api/wardens', payload);
      showToast(`${payload.name} berjaya ditambah.`);
      setShowAddModal(false);
      fetchWardens();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menambah warden.');
    } finally {
      setAdding(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await apiPatch(`/api/wardens/${id}/status`, { status: 'revoked' });
      showToast('Akses telah ditarik.');
      setRevokeWarden(null);
      fetchWardens();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menarik akses.');
    }
  };

  const handleReinstate = async (id: string) => {
    try {
      await apiPatch(`/api/wardens/${id}/status`, { status: 'active' });
      showToast('Warden diaktifkan semula.');
      fetchWardens();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengaktifkan.');
    }
  };

  const handleToggleAdmin = async (w: Warden) => {
    try {
      await apiPatch(`/api/wardens/${w.id}/admin`, { is_admin: !w.is_admin });
      showToast(w.is_admin ? 'Hak pentadbir telah ditarik.' : `${w.name} kini juga pentadbir.`);
      fetchWardens();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengemas kini hak pentadbir.');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-dim-text flex items-center justify-center gap-2"><LoadingSpinner size={18} />Memuatkan…</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Senarai"
        title="Warden"
        action={(
          <button type="button" onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors">
            + Tambah Warden
          </button>
        )}
      />

      <WardenTable
        wardens={wardens}
        currentUserId={user?.id}
        onViewReports={id => router.push(`/reports?warden=${id}`)}
        onToggleAdmin={handleToggleAdmin}
        onRevoke={setRevokeWarden}
        onReinstate={w => handleReinstate(w.id)}
      />

      <WardenCards
        wardens={wardens}
        currentUserId={user?.id}
        onViewReports={id => router.push(`/reports?warden=${id}`)}
        onToggleAdmin={handleToggleAdmin}
        onRevoke={setRevokeWarden}
        onReinstate={w => handleReinstate(w.id)}
      />

      <AddWardenModal
        key={String(showAddModal)}
        open={showAddModal}
        busy={adding}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAdd}
      />

      <RevokeConfirmModal
        warden={revokeWarden}
        onClose={() => setRevokeWarden(null)}
        onConfirm={handleRevoke}
      />
    </div>
  );
}
