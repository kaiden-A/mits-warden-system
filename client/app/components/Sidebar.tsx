'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon?: string;
}

const ICONS: Record<string, string> = {
  overview: 'dashboard',
  wardens: 'badge',
  schedule: 'calendar_month',
  reports: 'description',
  dashboard: 'grid_view',
  today: 'edit_note',
  history: 'history',
};

export default function Sidebar({ mode, navItems }: { mode: string; navItems: NavItem[] }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  const userLabel = user?.role === 'admin' ? (user?.name || 'Pengarah') : (user?.name || '');

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-shrink-0 bg-ink text-paper flex-col py-5 pb-4">
        <div className="flex items-center gap-2 px-5 pb-5 border-b border-ink-line mb-3">
          <div className="w-8 h-8 border-2 border-brass rounded-full flex items-center justify-center font-heading font-black text-sm text-brass flex-shrink-0">
            LT
          </div>
          <div>
            <h1 className="font-heading text-base text-paper font-bold leading-tight">Log Tugas</h1>
            <p className="text-[0.62rem] text-[#8B93A8] uppercase tracking-wider font-mono">{mode}</p>
          </div>
        </div>

        <nav className="flex-1">
          {navItems.map(item => {
            const active = pathname === item.href;
            return (
              <button key={item.key} type="button"
                onClick={() => router.push(item.href)}
                className={`flex items-center gap-2.5 py-3 px-5 mr-2 text-sm font-medium w-[calc(100%-0.5rem)] text-left rounded-r-[20px] transition-colors ${
                  active
                    ? 'bg-paper text-ink font-semibold'
                    : 'text-[#B7BDCC] hover:text-paper hover:bg-ink-soft'
                }`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-brass' : 'bg-current opacity-50'}`}></span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="pt-3 px-5 border-t border-ink-line mt-auto">
          <p className="text-[0.82rem] text-paper font-semibold truncate">{user?.name || '—'}</p>
          <p className="text-[0.68rem] text-[#8B93A8] uppercase tracking-wider font-mono mt-0.5 mb-2.5">
            {user?.hostel || (user?.role === 'admin' ? 'Pengarah Fasiliti' : '—')}
          </p>
          <button type="button" onClick={handleSignOut}
            className="w-full py-2 border border-ink-line text-[#C7CCDA] rounded text-xs transition-colors hover:bg-ink-soft">
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-ink text-paper flex items-center justify-between px-4 h-12 safe-top">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 border-2 border-brass rounded-full flex items-center justify-center font-heading font-black text-[10px] text-brass flex-shrink-0">
            LT
          </div>
          <span className="font-heading font-bold text-sm">Log Tugas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[0.65rem] text-[#8B93A8] font-mono truncate max-w-[120px]">{userLabel}</span>
          <button type="button" onClick={() => setDrawerOpen(true)}
            className="w-8 h-8 flex items-center justify-center text-paper rounded hover:bg-ink-soft transition-colors">
            <span className="material-symbols-outlined text-xl">account_circle</span>
          </button>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ink border-t border-ink-line flex safe-bottom"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {navItems.map(item => {
          const active = pathname === item.href;
          return (
            <button key={item.key} type="button"
              onClick={() => router.push(item.href)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[0.6rem] font-mono uppercase tracking-wider transition-colors min-h-[56px] ${
                active ? 'text-brass' : 'text-[#8B93A8] hover:text-paper'
              }`}>
              <span className="material-symbols-outlined text-2xl">{ICONS[item.key] || 'circle'}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Mobile user drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/45" onClick={() => setDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-ink text-paper rounded-t-2xl p-6 pb-8"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 border-2 border-brass rounded-full flex items-center justify-center font-heading font-black text-base text-brass flex-shrink-0">
                LT
              </div>
              <div>
                <p className="font-heading font-bold text-base">{user?.name || '—'}</p>
                <p className="text-[0.7rem] text-[#8B93A8] uppercase tracking-wider font-mono">
                  {user?.hostel || (user?.role === 'admin' ? 'Pengarah Fasiliti' : '—')}
                </p>
              </div>
            </div>
            <div className="border-t border-ink-line pt-4 space-y-2">
              <p className="text-[0.72rem] text-[#8B93A8] font-mono">{user?.email || ''}</p>
              <button type="button" onClick={handleSignOut}
                className="w-full py-3 border border-ink-line text-[#C7CCDA] rounded-lg text-sm font-semibold transition-colors hover:bg-ink-soft">
                Log Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
