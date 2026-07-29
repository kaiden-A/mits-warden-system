'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard' },
  { key: 'today', label: 'Buat Laporan', href: '/today' },
  { key: 'history', label: 'Sejarah Laporan', href: '/history' },
];

export default function WardenLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isWarden } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
    else if (!isWarden) router.replace('/overview');
  }, [user, loading, isWarden, router]);

  if (loading || !user || !isWarden) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink">
        <div className="text-paper font-heading text-xl animate-pulse">Log Tugas</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar mode="Warden" navItems={NAV_ITEMS} />
      <main className="flex-1 pt-14 md:pt-0 p-4 sm:p-8 pb-24 md:pb-12 min-w-0">{children}</main>
    </div>
  );
}
