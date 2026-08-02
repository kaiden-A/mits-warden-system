'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';

const NAV_ITEMS = [
  { key: 'overview', label: 'Ringkasan', href: '/overview' },
  { key: 'analytics', label: 'Statistik', href: '/analytics' },
  { key: 'wardens', label: 'Warden', href: '/wardens' },
  { key: 'schedule', label: 'Jadual', href: '/schedule' },
  { key: 'reports', label: 'Laporan', href: '/reports' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!isAdmin) router.replace('/dashboard');
  }, [user, loading, isAdmin, router]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="text-center">
          <div className="text-paper font-heading text-xl animate-pulse">Log Tugas</div>
          <p className="text-[#8B93A8] text-xs font-mono mt-2">MITS Klang</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar mode="Pengurusan" navItems={NAV_ITEMS} />
      <main className="flex-1 pt-14 md:pt-0 p-4 sm:p-8 pb-24 md:pb-12 min-w-0">{children}</main>
    </div>
  );
}
