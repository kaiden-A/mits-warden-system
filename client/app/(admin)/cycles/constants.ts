import type { SignatureBlock } from './types';

export const MONTHS = ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'];
export const WEEKDAYS = ['Aha', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
export const PDF_DAYS = ['AHAD', 'ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU'];
export const HARI = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];

export const DEFAULT_SIGNATURES: SignatureBlock[] = [
  {
    label: 'DISEDIAKAN OLEH',
    name: 'SITI HAJAR BINTI RADZALI',
    position: 'SETIAUSAHA WARDEN',
  },
  {
    label: 'DISEMAK OLEH',
    name: 'NORAZLIN BINTI RAZAK',
    position: 'GURU PENOLONG KANAN HEM',
  },
  {
    label: 'DISAHKAN OLEH',
    name: 'DR. HAJI AZAMMUDDIN BIN ZAINUDDIN',
    position: 'PENGETUA',
  },
];

export function fmtRange(a: string, b: string) {
  const d1 = new Date(a + 'T00:00:00');
  const d2 = new Date(b + 'T00:00:00');
  return `${d1.getDate()} ${MONTHS[d1.getMonth()]} – ${d2.getDate()} ${MONTHS[d2.getMonth()]} ${d2.getFullYear()}`;
}

export function shortDate(ds: string) {
  const d = new Date(ds + 'T00:00:00');
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function isoToLocal(d: Date) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

export function monthsOf(start: string, end: string): Date[] {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  const first = new Date(s.getFullYear(), s.getMonth(), 1);
  const last = new Date(e.getFullYear(), e.getMonth(), 1);
  const out: Date[] = [];
  let cur = first;
  while (cur <= last) {
    out.push(new Date(cur));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return out;
}

export function cellsOf(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = Array(first.getDay()).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  return cells;
}
