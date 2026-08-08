'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/hooks/useAuth';
import { apiGet } from '@/app/lib/api';
import { useToast } from '@/app/components/Toast';
import PageHeader from '@/app/components/PageHeader';
import StatCards from './components/StatCards';
import RecentEntries from './components/RecentEntries';
import type { AdminDashboard } from './types';

const GREETINGS = ['Selamat pagi', 'Selamat petang', 'Selamat malam'];

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return GREETINGS[0];
  if (h < 18) return GREETINGS[1];
  return GREETINGS[2];
}

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/api/dashboard', { admin: '1' })
      .then(setData)
      .catch(() => showToast('Gagal memuatkan dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-dim-text">Memuatkan…</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-dim-text">Ralat memuatkan data.</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Ringkasan MITSAI"
        title={`${timeGreeting()}, ${user?.name || 'Pengarah'}`}
      />

      <StatCards stats={data.stats} />

      <RecentEntries entries={data.recent_entries} />
    </div>
  );
}
