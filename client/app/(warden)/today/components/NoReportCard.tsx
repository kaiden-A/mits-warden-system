'use client';

export default function NoReportCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="bg-paper-raised border border-paper-line rounded-lg p-6 sm:p-8 text-center">
      <span className="material-symbols-outlined text-4xl sm:text-5xl text-dim-text opacity-40 mb-3 block">description</span>
      <h3 className="font-heading font-semibold text-base sm:text-lg mb-2">Belum ada laporan untuk hari ini</h3>
      <p className="text-sm text-dim-text max-w-xs mx-auto mb-6">
        Sila lengkapkan laporan pemeriksaan harian untuk hari ini.
      </p>
      <button type="button" onClick={onStart}
        className="w-full sm:w-auto px-5 py-3 sm:py-2.5 text-base font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors">
        Buat Laporan Baru
      </button>
    </div>
  );
}
