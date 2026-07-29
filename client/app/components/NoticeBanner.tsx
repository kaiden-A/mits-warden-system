import type { ReactNode } from 'react';

export default function NoticeBanner({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-brass-wash border border-paper-line border-l-[3px] border-l-brass rounded text-sm text-ink-text">
      <span className="material-symbols-outlined text-brass-deep text-lg">info</span>
      <span>{children}</span>
    </div>
  );
}
