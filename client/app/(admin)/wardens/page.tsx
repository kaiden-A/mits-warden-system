'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiPatch } from '@/app/lib/api';
import Stamp from '@/app/components/Stamp';
import Modal from '@/app/components/Modal';
import { useToast } from '@/app/components/Toast';
import { useRouter } from 'next/navigation';

interface Warden {
  id: string;
  email: string;
  name: string;
  hostel: string | null;
  status: string;
  report_count: number;
  last_submission: string | null;
}

export default function AdminWardensPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [wardens, setWardens] = useState<Warden[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newHostel, setNewHostel] = useState('Asrama Putera');

  const fetchWardens = () => {
    setLoading(true);
    apiGet('/api/wardens')
      .then((data: { wardens: Warden[] }) => setWardens(data.wardens))
      .catch(() => showToast('Gagal memuatkan senarai warden.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWardens(); }, []);

  const handleAdd = async () => {
    if (!newEmail.trim() || !newName.trim()) {
      showToast('Emel dan nama diperlukan.');
      return;
    }
    try {
      await apiPost('/api/wardens', { email: newEmail, name: newName, hostel: newHostel });
      showToast(`${newName} ditambah ke senarai.`);
      setShowAddModal(false);
      setNewEmail('');
      setNewName('');
      setNewHostel('Asrama Putera');
      fetchWardens();
    } catch (err: any) {
      showToast(err.message || 'Gagal menambah warden.');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await apiPatch(`/api/wardens/${id}/status`, { status: 'revoked' });
      showToast('Akses telah ditarik.');
      setConfirmRevokeId(null);
      fetchWardens();
    } catch (err: any) {
      showToast(err.message || 'Gagal menarik akses.');
    }
  };

  const handleReinstate = async (id: string) => {
    try {
      await apiPatch(`/api/wardens/${id}/status`, { status: 'active' });
      showToast('Warden diaktifkan semula.');
      fetchWardens();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengaktifkan.');
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-dim-text">Memuatkan…</div>;
  }

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-6">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">Senarai</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">Warden</h2>
        </div>
        <button type="button" onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors">
          + Tambah Warden
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-paper-raised border border-paper-line rounded-lg p-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Nama</th>
              <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Emel</th>
              <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Asrama</th>
              <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Status</th>
              <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line">Laporan</th>
              <th className="text-left text-[0.68rem] uppercase tracking-wider text-dim-text font-mono font-semibold py-2 px-2 border-b border-paper-line"></th>
            </tr>
          </thead>
          <tbody>
            {wardens.map(w => (
              <tr key={w.id}>
                <td className="py-3 px-2 border-b border-paper-line"><strong className="text-sm">{w.name}</strong></td>
                <td className="py-3 px-2 border-b border-paper-line font-mono text-xs text-dim-text">{w.email}</td>
                <td className="py-3 px-2 border-b border-paper-line text-sm">{w.hostel}</td>
                <td className="py-3 px-2 border-b border-paper-line">
                  <span className={`inline-flex items-center gap-1 font-mono text-[0.68rem] font-semibold tracking-widest uppercase px-2 py-0.5 border border-current rounded-[2px] leading-none whitespace-nowrap ${
                    w.status === 'active' ? 'text-green bg-green-wash border-green' : 'text-red bg-red-wash border-red'
                  }`}>
                    <span className="w-1 h-1 rounded-full bg-current"></span>
                    {w.status === 'active' ? 'Aktif' : 'Ditarik'}
                  </span>
                </td>
                <td className="py-3 px-2 border-b border-paper-line text-sm">{w.report_count}</td>
                <td className="py-3 px-2 border-b border-paper-line">
                  <div className="flex gap-1.5 justify-end">
                    <button type="button" onClick={() => router.push(`/reports?warden=${w.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
                      Lihat Laporan
                    </button>
                    {w.status === 'active' ? (
                      <button type="button" onClick={() => setConfirmRevokeId(w.id)}
                        className="px-3 py-1.5 text-xs font-semibold border border-red rounded bg-transparent text-red hover:bg-red-wash transition-colors">
                        Tarik Akses
                      </button>
                    ) : (
                      <button type="button" onClick={() => handleReinstate(w.id)}
                        className="px-3 py-1.5 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
                        Aktifkan Semula
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="sm:hidden space-y-3">
        {wardens.map(w => (
          <div key={w.id} className="bg-paper-raised border border-paper-line rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-heading font-semibold text-sm">{w.name}</p>
                <p className="font-mono text-[0.65rem] text-dim-text mt-0.5">{w.email}</p>
              </div>
              <span className={`inline-flex items-center gap-1 font-mono text-[0.62rem] font-semibold tracking-widest uppercase px-2 py-0.5 border border-current rounded-[2px] leading-none whitespace-nowrap ${
                w.status === 'active' ? 'text-green bg-green-wash border-green' : 'text-red bg-red-wash border-red'
              }`}>
                <span className="w-1 h-1 rounded-full bg-current"></span>
                {w.status === 'active' ? 'Aktif' : 'Ditarik'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-dim-text mb-3">
              <span>{w.hostel}</span>
              <span className="w-1 h-1 rounded-full bg-paper-line"></span>
              <span>{w.report_count} laporan</span>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => router.push(`/reports?warden=${w.id}`)}
                className="flex-1 py-2.5 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors text-center">
                Lihat Laporan
              </button>
              {w.status === 'active' ? (
                <button type="button" onClick={() => setConfirmRevokeId(w.id)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-red rounded bg-transparent text-red hover:bg-red-wash transition-colors text-center">
                  Tarik Akses
                </button>
              ) : (
                <button type="button" onClick={() => handleReinstate(w.id)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors text-center">
                  Aktifkan Semula
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)}>
        <div className="flex items-start justify-between gap-4 mb-4">
          <h3 className="font-heading font-semibold text-lg">Tambah Warden</h3>
          <button type="button" onClick={() => setShowAddModal(false)}
            className="text-dim-text hover:text-ink-text text-xl leading-none p-0.5">&times;</button>
        </div>
        <div className="mb-4">
          <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Emel</label>
          <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
            placeholder="cth. nama@example.com"
            className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
        </div>
        <div className="mb-4">
          <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Nama</label>
          <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Cth. Muhammad Ali Bin Ahmad"
            className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass" />
        </div>
        <div className="mb-4">
          <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Asrama</label>
          <select value={newHostel} onChange={e => setNewHostel(e.target.value)}
            className="w-full px-3 py-2.5 border border-paper-line rounded bg-white text-sm text-ink-text outline-none focus-visible:border-brass">
            <option value="Asrama Putera">Asrama Putera</option>
            <option value="Asrama Puteri">Asrama Puteri</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t border-paper-line">
          <button type="button" onClick={() => setShowAddModal(false)}
            className="px-3 py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
            Batal
          </button>
          <button type="button" onClick={handleAdd}
            className="px-3 py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors">
            Tambah ke Senarai
          </button>
        </div>
      </Modal>

      <Modal open={!!confirmRevokeId} onClose={() => setConfirmRevokeId(null)}>
        {(() => {
          const w = wardens.find(x => x.id === confirmRevokeId);
          return (
            <>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h3 className="font-heading font-semibold text-lg">Tarik Akses {w?.name}?</h3>
                <button type="button" onClick={() => setConfirmRevokeId(null)}
                  className="text-dim-text hover:text-ink-text text-xl leading-none p-0.5">&times;</button>
              </div>
              <p className="text-sm text-ink-text mb-5">
                Ini akan menarik akses {w?.name} ({w?.email}). Laporan sedia ada kekal, tetapi mereka tidak lagi boleh log masuk atau menghantar laporan baharu.
              </p>
              <div className="flex justify-end gap-2 pt-4 border-t border-paper-line">
                <button type="button" onClick={() => setConfirmRevokeId(null)}
                  className="px-3 py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper transition-colors">
                  Batal
                </button>
                <button type="button" onClick={() => confirmRevokeId && handleRevoke(confirmRevokeId)}
                  className="px-3 py-1.5 text-sm font-semibold rounded bg-transparent text-red border border-red hover:bg-red-wash transition-colors">
                  Tarik Akses
                </button>
              </div>
            </>
          );
        })()}
      </Modal>
    </div>
  );
}
