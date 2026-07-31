export const MALAY_DAYS = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

export const RATING_OPTS = [
  { value: '1', label: '1', title: 'Tidak Memuaskan' },
  { value: '2', label: '2', title: 'Sederhana' },
  { value: '3', label: '3', title: 'Baik' },
  { value: '4', label: '4', title: 'Cemerlang' },
  { value: 'NA', label: 'N/A', title: 'Tiada Kaitan' },
];

export const ARAS_SHARED = [
  { key: 'bilikDorm', label: 'Bilik Dorm' },
  { key: 'koridor', label: 'Koridor' },
  { key: 'bilikPantri', label: 'Bilik Pantri' },
  { key: 'tandas', label: 'Tandas' },
  { key: 'bilikPrep', label: 'Bilik Prep' },
  { key: 'bilikIron', label: 'Bilik Iron' },
  { key: 'bilikRekreasi', label: 'Bilik Rekreasi' },
];

export interface SectionItem {
  key: string;
  label: string;
  days?: number[];
}

export function itemApplicable(item: SectionItem, date: Date): boolean {
  return !item.days || item.days.includes(date.getDay());
}

export function itemsForDate(items: SectionItem[], date: Date): SectionItem[] {
  return items.filter(item => itemApplicable(item, date));
}

export const SECTIONS_CONFIG = [
  {
    id: 'rutinAktivitiMurid', title: '1. Rutin Aktiviti Murid',
    items: [
      { key: 'halaqahQuran', label: 'Halaqah Quran' },
      { key: 'rollCall', label: 'Roll Call' },
      { key: 'riadhah', label: 'Riadhah' },
      { key: 'muraqabah', label: 'Muraqabah' },
      { key: 'prep', label: 'Prep / Kelas Tambahan (Malam)' },
      { key: 'tabassam', label: 'Tabassam / Prep (Sabtu & Ahad)', days: [0, 6] },
      { key: 'melawat', label: 'Melawat / Keluar Bandar' },
      { key: 'gotongRoyong', label: 'Gotong-Royong' },
      { key: 'tidur', label: 'Tidur' },
    ],
  },
  {
    id: 'tarbiyyahRohaniyyah', title: '2. Tarbiyyah / Rohaniyyah',
    items: [
      { key: 'qiamullail', label: 'Qiamullail Jamaie (Ahad)', days: [0] },
      { key: 'kuliahSubuh', label: 'Kuliah Subuh (Sabtu & Ahad)', days: [0, 6] },
      { key: 'subuh', label: 'Subuh / Azkar' },
      { key: 'zohor', label: 'Zohor (Sabtu & Ahad)', days: [0, 6] },
      { key: 'asar', label: 'Asar' },
      { key: 'azkarMaghrib', label: 'Azkar / Maghrib' },
      { key: 'kuliahMaghrib', label: 'Kuliah Maghrib (Sabtu & Ahad)', days: [0, 6] },
      { key: 'isya', label: "Isya'" },
      { key: 'usrahMurid', label: 'Usrah Murid (Sabtu & Ahad)', days: [0, 6] },
      { key: 'bacaanAlMulk', label: 'Bacaan Surah Al-Mulk' },
    ],
  },
  {
    id: 'kebersihanArasBawah', title: '3. Kebersihan Aras Bawah',
    items: [
      { key: 'lobi', label: 'Lobi Asrama' },
      { key: 'musolla', label: 'Musolla' },
      { key: 'storSukan', label: 'Stor Sukan' },
      { key: 'storKebersihan', label: 'Stor Kebersihan' },
      { key: 'bilikDobi', label: 'Bilik Dobi' },
      { key: 'bilikIsolasi', label: 'Bilik Isolasi' },
      { key: 'bilikICT', label: 'Bilik ICT' },
      { key: 'tandas', label: 'Tandas' },
      { key: 'ampaiBaju', label: 'Ampai Baju' },
    ],
  },
  { id: 'kebersihanAras1', title: '4. Kebersihan Aras 1', items: ARAS_SHARED },
  { id: 'kebersihanAras2', title: '5. Kebersihan Aras 2', items: ARAS_SHARED },
  { id: 'kebersihanAras3', title: '6. Kebersihan Aras 3', items: ARAS_SHARED },
  {
    id: 'dewanMakan', title: '7. Dewan Makan',
    items: [
      { key: 'sarapan', label: 'Sarapan' },
      { key: 'minumPagi', label: 'Minum Pagi (Sabtu & Ahad)', days: [0, 6] },
      { key: 'makanTengahari', label: 'Makan Tengahari' },
      { key: 'minumPetang', label: 'Minum Petang' },
      { key: 'makanMalam', label: 'Makan Malam' },
      { key: 'minumMalam', label: 'Minum Malam' },
    ],
  },
];

export const ALL_SECTION_IDS = SECTIONS_CONFIG.map(s => s.id);

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: 'Draf',
    submitted: 'Dihantar',
    reviewed: 'Disemak',
    flagged: 'Ditanda',
  };
  return labels[status] || status;
}

export function statusColor(status: string) {
  const colors: Record<string, string> = {
    draft: 'text-dim-text bg-transparent border-dim-text',
    submitted: 'text-brass-deep bg-brass-wash border-brass-deep',
    reviewed: 'text-green bg-green-wash border-green',
    flagged: 'text-red bg-red-wash border-red',
  };
  return colors[status] || colors.draft;
}

export const HOSTELS = ['Asrama Putera', 'Asrama Puteri'] as const;

export function iso(d: Date): string {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

export function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}

export function fromISO(s: string): Date {
  return new Date(s + 'T00:00:00');
}

export function mondayOf(d: Date): Date {
  const nd = new Date(d);
  const day = nd.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  nd.setDate(nd.getDate() + diff);
  return nd;
}

export function fmtShort(d: Date): string {
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function fmtLong(d: Date): string {
  return MALAY_DAYS[d.getDay()] + ', ' + d.getDate() + ' ' +
    d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function fmtDatetime(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return d.getDate() + ' ' + d.toLocaleDateString('en', { month: 'short' }) + ' ' +
    d.getFullYear() + ', ' +
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function fmtTime(isoStr: string | null | undefined): string {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function malayDay(d: Date): string {
  return MALAY_DAYS[d.getDay()];
}

export function countRatedSections(report: Record<string, unknown>): number {
  const ratings = (report.ratings ?? report) as Record<string, unknown>;
  let count = 0;
  ALL_SECTION_IDS.forEach(sid => {
    const sec = ratings[sid] as Record<string, string> | undefined;
    if (sec && Object.values(sec).some(v => v !== '' && v != null)) count++;
  });
  if (report.aduan_kerosakan && String(report.aduan_kerosakan).trim()) count++;
  if (report.murid_sakit && String(report.murid_sakit).trim()) count++;
  if (report.kawalan_keselamatan && String(report.kawalan_keselamatan).trim()) count++;
  if (report.catatan_tambahan && String(report.catatan_tambahan).trim()) count++;
  return Math.min(count, 11);
}

export function isReportComplete(report: Record<string, unknown>): boolean {
  const ratings = (report.ratings ?? report) as Record<string, unknown>;
  const allSectionsRated = SECTIONS_CONFIG.every(cfg => {
    const sec = ratings[cfg.id] as Record<string, string> | undefined;
    return !!sec && Object.values(sec).some(v => v !== '' && v != null);
  });
  return allSectionsRated && !!report.kawalan_keselamatan;
}
