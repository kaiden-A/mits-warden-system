'use client';

import { useState } from 'react';
import { SECTIONS_CONFIG, malayDay, fmtLong, fromISO } from '@/app/lib/constants';
import { SectionAccordionEditable } from './SectionAccordion';
import LoadingSpinner from './LoadingSpinner';
import StudentPicker, { StudentEntry, STUDENT_REASON_ORDER, STUDENT_REASON_LABELS } from './StudentPicker';

function splitMuridSakit(text: string | undefined | null): string {
  const t = (text || '').trim();
  if (!t || t === 'TLB') return '';
  const lines = t.split('\n');
  const idx = lines.findIndex(l => l.trim().toLowerCase() === 'lain-lain:');
  if (idx >= 0) return lines.slice(idx + 1).join('\n').trim();
  return t;
}

interface ReportFormProps {
  report: any;
  wardenName: string;
  wardenHostel: string;
  dateStr: string;
  scheduledWardenName?: string | null;
  isSubstitution?: boolean;
  isReadOnly: boolean;
  saving?: boolean;
  onSave: (data: any, status: string) => void;
}

export default function ReportForm({ report, wardenName, wardenHostel, dateStr, scheduledWardenName, isSubstitution, isReadOnly, saving, onSave }: ReportFormProps) {
  const [inspectionTime, setInspectionTime] = useState(report?.inspection_time || '');
  const [aduanKerosakan, setAduanKerosakan] = useState(report?.aduan_kerosakan || 'TKD');
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [lainLain, setLainLain] = useState(() => splitMuridSakit(report?.murid_sakit));
  const [kawalanKeselamatan, setKawalanKeselamatan] = useState(report?.kawalan_keselamatan || '');
  const [catatanTambahan, setCatatanTambahan] = useState(report?.catatan_tambahan || '');
  const [ratings, setRatings] = useState<Record<string, Record<string, string>>>(() => {
    const r: Record<string, Record<string, string>> = {};
    SECTIONS_CONFIG.forEach(cfg => {
      r[cfg.id] = {};
      cfg.items.forEach(item => {
        r[cfg.id][item.key] = report?.ratings?.[cfg.id]?.[item.key] || '';
      });
    });
    return r;
  });

  const handleRatingChange = (sectionId: string, itemKey: string, value: string) => {
    setRatings(prev => ({
      ...prev,
      [sectionId]: { ...prev[sectionId], [itemKey]: value },
    }));
  };

  const collectData = () => {
    const ratingsData: Record<string, Record<string, string>> = {};
    SECTIONS_CONFIG.forEach(cfg => {
      const sectionRatings: Record<string, string> = {};
      cfg.items.forEach(item => {
        if (item.days && !item.days.includes(dateObj.getDay())) {
          sectionRatings[item.key] = 'NA';
          return;
        }
        const val = ratings[cfg.id]?.[item.key];
        if (val) sectionRatings[item.key] = val;
      });
      if (Object.keys(sectionRatings).length > 0) ratingsData[cfg.id] = sectionRatings;
    });

    const textLines: string[] = [];
    STUDENT_REASON_ORDER.forEach(reason => {
      const group = students.filter(s => s.reason === reason);
      if (group.length > 0) {
        textLines.push(`${STUDENT_REASON_LABELS[reason]}:`);
        group.forEach(s => textLines.push(`• ${s.name} (${s.classLabel})`));
      }
    });
    if (lainLain.trim()) {
      textLines.push('Lain-lain:');
      textLines.push(lainLain.trim());
    }
    const muridSakit = textLines.length > 0 ? textLines.join('\n') : 'TLB';

    return {
      date: dateStr,
      inspection_time: inspectionTime || null,
      ratings: Object.keys(ratingsData).length > 0 ? ratingsData : null,
      aduan_kerosakan: aduanKerosakan || 'TKD',
      murid_sakit: muridSakit,
      kawalan_keselamatan: kawalanKeselamatan ? Number(kawalanKeselamatan) : null,
      catatan_tambahan: catatanTambahan || '',
    };
  };

  const dateObj = fromISO(dateStr);
  const dateLabel = fmtLong(dateObj);

  return (
    <div>
      <div className="flex items-baseline justify-between flex-wrap gap-3 mb-5">
        <div>
          <span className="block font-mono text-[0.72rem] uppercase tracking-wider text-dim-text mb-1">{dateLabel}</span>
          <h2 className="font-heading text-2xl font-bold text-ink-text">Laporan Baru</h2>
        </div>
      </div>

      {isSubstitution && !isReadOnly && scheduledWardenName && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-4 bg-brass-wash border border-paper-line border-l-[3px] border-l-brass rounded text-sm">
          <span className="material-symbols-outlined text-brass-deep text-lg">info</span>
          <span>Anda melaporkan <strong>bagi pihak {scheduledWardenName}</strong>. Beliau dijadualkan bertugas hari ini.</span>
        </div>
      )}

      {!isReadOnly && (
        <div className="flex gap-2 pb-4 mb-4 sm:mb-5 border-b border-paper-line">
          <button type="button" onClick={() => onSave(collectData(), 'draft')} disabled={saving}
            className="flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2">
            {saving && <LoadingSpinner size={16} />}
            {saving ? 'Menyimpan…' : 'Simpan Draf'}
          </button>
          <button type="button" onClick={() => onSave(collectData(), 'submitted')} disabled={saving}
            className="flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2">
            {saving && <LoadingSpinner size={16} />}
            {saving ? 'Menghantar…' : 'Hantar Laporan'}
          </button>
        </div>
      )}

      <div className="bg-paper-raised border border-paper-line rounded-lg p-4 sm:p-5">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3 pb-4 mb-4 sm:mb-5 border-b border-paper-line">
          <div>
            <label className="block text-[0.62rem] sm:text-[0.66rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Tarikh</label>
            <div className="px-2 py-1.5 sm:px-2.5 sm:py-2 bg-paper rounded text-xs sm:text-sm font-medium">{dateStr}</div>
          </div>
          <div>
            <label className="block text-[0.62rem] sm:text-[0.66rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Hari</label>
            <div className="px-2 py-1.5 sm:px-2.5 sm:py-2 bg-paper rounded text-xs sm:text-sm font-medium">{malayDay(dateObj)}</div>
          </div>
          <div>
            <label className="block text-[0.62rem] sm:text-[0.66rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Warden</label>
            <div className="px-2 py-1.5 sm:px-2.5 sm:py-2 bg-paper rounded text-xs sm:text-sm font-medium truncate">{wardenName}</div>
          </div>
          <div>
            <label className="block text-[0.62rem] sm:text-[0.66rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Asrama</label>
            <div className="px-2 py-1.5 sm:px-2.5 sm:py-2 bg-paper rounded text-xs sm:text-sm font-medium truncate">{wardenHostel}</div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[0.62rem] sm:text-[0.66rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Masa</label>
            <input type="time" value={inspectionTime} disabled={isReadOnly}
              onChange={e => setInspectionTime(e.target.value)}
              className="w-full px-2 py-1.5 sm:px-2.5 sm:py-2 border border-paper-line rounded bg-white text-xs sm:text-sm text-ink-text outline-none focus-visible:border-brass min-h-[38px]" />
          </div>
        </div>

        <div className="mb-4">
          <button type="button" className="flex items-center gap-2 w-full py-2.5 px-1 text-left border-b border-paper-line cursor-default">
            <h4 className="text-xs font-mono font-semibold tracking-wider uppercase text-brass-deep">Bahagian 1–7: Penilaian Rating</h4>
          </button>
        </div>

        {SECTIONS_CONFIG.map((cfg, i) => (
          <SectionAccordionEditable
            key={cfg.id}
            section={cfg}
            data={ratings[cfg.id]}
            onRatingChange={(key, val) => handleRatingChange(cfg.id, key, val)}
            defaultOpen={i === 0 || i === 1}
            date={dateStr}
          />
        ))}

        <div className="mt-5 pt-4 border-t border-paper-line">
          <button type="button" className="flex items-center gap-2 w-full py-2.5 px-1 text-left border-b border-paper-line cursor-default">
            <h4 className="text-xs font-mono font-semibold tracking-wider uppercase text-brass-deep">Bahagian 8–11: Teks &amp; Keselamatan</h4>
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">8. Aduan Kerosakan</label>
            <p className="text-xs text-dim-text mb-1">Rekodkan sebarang isu penyelenggaraan. Jika tiada, tulis <strong>TKD</strong>.</p>
            <textarea value={aduanKerosakan} readOnly={isReadOnly}
              onChange={e => setAduanKerosakan(e.target.value)}
              className="w-full min-h-[80px] px-3 py-2 border border-paper-line rounded bg-white text-sm text-ink-text resize-y outline-none focus-visible:border-brass" />
          </div>

          <div>
            <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">9. Murid Sakit / Balik Luar Jadual</label>
            <p className="text-xs text-dim-text mb-2">Pilih kelas, tandakan murid yang sakit atau balik luar jadual. Jika tiada, biarkan kosong (<strong>TLB</strong> akan disimpan).</p>
            {!isReadOnly ? (
              <StudentPicker
                hostel={wardenHostel}
                value={students}
                onChange={setStudents}
              />
            ) : (
              <div className="px-3 py-2 border border-paper-line rounded bg-paper text-sm whitespace-pre-wrap">{splitMuridSakit(report?.murid_sakit) || 'TLB'}</div>
            )}
            {!isReadOnly && (
              <div className="mt-3">
                <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">Lain-lain (Nota Tambahan)</label>
                <textarea value={lainLain}
                  onChange={e => setLainLain(e.target.value)}
                  placeholder="Sebarang nama murid atau nota yang tidak ada dalam senarai…"
                  className="w-full min-h-[70px] px-3 py-2 border border-paper-line rounded bg-white text-sm text-ink-text resize-y outline-none focus-visible:border-brass" />
              </div>
            )}
          </div>

          <div>
            <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">10. Kawalan Keselamatan</label>
              <div className="flex gap-2 flex-wrap">
              {[1, 2, 3, 4, 5].map(n => {
                const desc = n === 1 ? 'Lemah' : n === 5 ? 'Cemerlang' : '';
                const selected = kawalanKeselamatan === String(n);
                return (
                  <button key={n} type="button" disabled={isReadOnly}
                    onClick={() => setKawalanKeselamatan(String(n))}
                    className={`flex flex-col items-center gap-0.5 px-3 py-2 sm:px-2 sm:py-1.5 border-2 rounded text-sm font-semibold min-w-[52px] sm:min-w-[48px] min-h-[44px] transition-all ${
                      selected
                        ? 'bg-ink text-paper border-ink'
                        : 'bg-transparent text-dim-text border-paper-line hover:border-brass'
                    } disabled:opacity-70`}>
                    <span className="text-base font-bold">{n}</span>
                    {desc && <span className="text-[0.55rem] font-normal opacity-70 whitespace-nowrap hidden sm:inline">{desc}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-[0.72rem] font-semibold uppercase tracking-wider text-dim-text mb-1">11. Catatan Tambahan</label>
            <textarea value={catatanTambahan} readOnly={isReadOnly}
              onChange={e => setCatatanTambahan(e.target.value)}
              placeholder="Sebarang catatan tambahan..."
              className="w-full min-h-[80px] px-3 py-2 border border-paper-line rounded bg-white text-sm text-ink-text resize-y outline-none focus-visible:border-brass" />
          </div>
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex gap-2 mt-5 pt-4 border-t border-paper-line">
          <button type="button" onClick={() => onSave(collectData(), 'draft')} disabled={saving}
            className="flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 text-sm font-semibold border border-paper-line rounded bg-transparent text-ink-text hover:bg-paper disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2">
            {saving && <LoadingSpinner size={16} />}
            {saving ? 'Menyimpan…' : 'Simpan Draf'}
          </button>
          <button type="button" onClick={() => onSave(collectData(), 'submitted')} disabled={saving}
            className="flex-1 sm:flex-none px-3 py-2.5 sm:py-1.5 text-sm font-semibold rounded bg-brass text-white hover:bg-brass-deep disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2">
            {saving && <LoadingSpinner size={16} />}
            {saving ? 'Menghantar…' : 'Hantar Laporan'}
          </button>
        </div>
      )}
    </div>
  );
}
