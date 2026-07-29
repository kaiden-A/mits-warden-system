'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

interface NavItem {
  key: string;
  label: string;
  href: string;
}

export default function Sidebar({ mode, navItems }: { mode: string; navItems: NavItem[] }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <aside className="w-56 flex-shrink-0 bg-ink text-paper flex flex-col py-5 pb-4">
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
  );
}
