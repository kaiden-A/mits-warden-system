'use client';

export default function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg p-4">
      <h3 className="font-heading font-semibold text-sm sm:text-base mb-3">{title}</h3>
      {children}
    </div>
  );
}

export function NoData() {
  return (
    <div className="text-center text-sm text-dim-text py-10">
      Tiada data untuk minggu ini.
    </div>
  );
}
