'use client';

export function AdminBadge({ size = 'normal' }: { size?: 'normal' | 'sm' }) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-semibold tracking-widest uppercase px-2 py-0.5 border border-current rounded-[2px] leading-none whitespace-nowrap text-brass-deep bg-brass-wash ${size === 'normal' ? 'text-[0.62rem]' : 'text-[0.58rem]'}`}>
      <span className="w-1 h-1 rounded-full bg-current"></span>
      Admin
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const active = status === 'active';
  return (
    <span className={`inline-flex items-center gap-1 font-mono font-semibold tracking-widest uppercase px-2 py-0.5 border border-current rounded-[2px] leading-none whitespace-nowrap ${
      active ? 'text-green bg-green-wash border-green' : 'text-red bg-red-wash border-red'
    }`}>
      <span className="w-1 h-1 rounded-full bg-current"></span>
      {active ? 'Aktif' : 'Ditarik'}
    </span>
  );
}
