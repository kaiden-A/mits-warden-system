'use client';

import Stamp from '@/app/components/Stamp';

export default function TodayCard({ reportStatus, isScheduled, onGoToday }: {
  reportStatus: string | null | undefined;
  isScheduled: boolean;
  onGoToday: () => void;
}) {
  const hasReport = !!reportStatus && reportStatus !== 'none';

  return (
    <div className="flex items-center gap-3 p-3 sm:p-4 bg-paper-raised border border-paper-line rounded-lg mb-5">
      {hasReport ? (
        <>
          <span className="material-symbols-outlined text-2xl sm:text-3xl flex-shrink-0"
            style={{ color: reportStatus === 'reviewed' ? '#2E7D4F' : reportStatus === 'flagged' ? '#B3402E' : reportStatus === 'submitted' ? '#8F6A10' : '#6B7280' }}>
            {reportStatus === 'reviewed' ? 'check_circle' : reportStatus === 'flagged' ? 'warning' : reportStatus === 'submitted' ? 'send' : 'edit_note'}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-sm sm:text-base truncate">
              Laporan Hari Ini {reportStatus === 'draft' ? '(Draf)' : 'Telah Direkodkan'}
            </h3>
            <p className="text-xs sm:text-sm text-dim-text truncate">
              <Stamp status={reportStatus} />
            </p>
          </div>
          <button type="button" onClick={onGoToday}
            className="px-3 py-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded border border-paper-line bg-transparent text-ink-text hover:bg-paper transition-colors flex-shrink-0">
            {reportStatus === 'draft' ? 'Sunting' : 'Lihat'}
          </button>
        </>
      ) : (
        <>
          <span className="material-symbols-outlined text-2xl sm:text-3xl text-dim-text flex-shrink-0">radio_button_unchecked</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-semibold text-sm sm:text-base">
              Belum ada laporan hari ini{isScheduled ? ' — Anda bertugas' : ''}
            </h3>
            <p className="text-xs sm:text-sm text-dim-text">Sila hantar laporan.</p>
          </div>
          <button type="button" onClick={onGoToday}
            className="px-4 py-2.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold rounded bg-brass text-white hover:bg-brass-deep transition-colors flex-shrink-0">
            Buat Laporan
          </button>
        </>
      )}
    </div>
  );
}
