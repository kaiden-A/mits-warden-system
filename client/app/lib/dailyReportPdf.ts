import { jsPDF } from 'jspdf';
import autoTable, { type CellInput, type Styles } from 'jspdf-autotable';
import { SECTIONS_CONFIG, MALAY_DAYS, fromISO, itemApplicable } from '@/app/lib/constants';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

const PAGE_W = 210;
const PAGE_H = 297;
const M = 12;

const INSTITUTION = 'MAAHAD INTEGRASI TAHFIZ SELANGOR ALAM IMPIAN, KLANG';
const ADDRESS = 'Jalan Tun Teja 35/1, Alam Impian, Seksyen 35, 40470 Shah Alam, Selangor';

const SECTION_HEAD: Partial<Styles> = {
  fillColor: [11, 74, 46],
  textColor: [255, 255, 255],
  fontStyle: 'bold',
  fontSize: 6.4,
  halign: 'left',
};

const BODY_TEXT: Partial<Styles> = {
  fontSize: 6.6,
  halign: 'left',
  valign: 'top',
};

function malayDayOf(ds: string): string {
  return MALAY_DAYS[fromISO(ds).getDay()];
}

function timeLabel(t: string | null | undefined): string {
  if (!t) return '';
  const match = String(t).match(/(\d{1,2}):(\d{2})/);
  if (!match) return '';
  let hour = Number(match[1]) % 24;
  const minute = match[2];
  const suffix = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour}:${minute} ${suffix}`;
}

function reportTimeStr(r: ReportDetail): string {
  return timeLabel(r.inspection_time) || timeLabel(r.submitted_at) || '—';
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch('/logo_mits.png');
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

interface ReportDetail {
  id: string;
  date: string;
  hostel: string;
  status: string;
  submitted_by?: { id: string; name: string } | null;
  submitted_by_name?: string;
  duty_warden?: { id: string; name: string } | null;
  inspection_time?: string | null;
  submitted_at?: string | null;
  ratings?: Record<string, Record<string, string>>;
  aduan_kerosakan?: string;
  murid_sakit?: string;
  kawalan_keselamatan?: number | null;
  catatan_tambahan?: string;
}

function drawHeader(doc: jsPDF, logo: string | null, date: string, timeStr: string): void {
  if (logo) {
    try {
      doc.addImage(logo, 'JPEG', 7, 6, 16, 14);
    } catch {
      /* optional */
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text('LAPORAN PEMERIKSAAN HARIAN WARDEN ASRAMA', PAGE_W / 2, 12.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(INSTITUTION, PAGE_W / 2, 16.5, { align: 'center' });
  doc.text(ADDRESS, PAGE_W / 2, 19.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(
    `TARIKH : ${date}    |    HARI : ${malayDayOf(date)}    |    MASA PEMERIKSAAN : ${timeStr}`,
    PAGE_W / 2,
    24,
    { align: 'center' }
  );
  doc.setDrawColor(11, 74, 46);
  doc.setLineWidth(0.3);
  doc.line(M, 26.5, PAGE_W - M, 26.5);
}

function drawMeta(doc: jsPDF, r: ReportDetail, timeStr: string): number {
  const name = r.submitted_by?.name || r.submitted_by_name || '—';
  const rightX = PAGE_W / 2 + 4;
  const rows = [
    { left: `NAMA : ${name}`, right: `ASRAMA : ${r.hostel}` },
    { left: `HARI BERTUGAS : ${malayDayOf(r.date)}`, right: `MASA PEMERIKSAAN : ${timeStr}` },
    { left: `TARIKH : ${r.date}`, right: '' },
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  let y = 30;
  rows.forEach(row => {
    doc.text(row.left, M, y);
    if (row.right) doc.text(row.right, rightX, y);
    y += 4.8;
  });
  y += 1.5;
  doc.setDrawColor(185, 137, 31);
  doc.setLineWidth(0.2);
  doc.line(M, y, PAGE_W - M, y);
  return y + 3;
}

function buildBodyRows(r: ReportDetail): CellInput[][] {
  const rows: CellInput[][] = [];
  const reportDate = fromISO(r.date);

  SECTIONS_CONFIG.forEach(cfg => {
    rows.push([{ content: cfg.title, colSpan: 2, styles: SECTION_HEAD }]);
    cfg.items.forEach(item => {
      if (!itemApplicable(item, reportDate)) return;
      rows.push([item.label, r.ratings?.[cfg.id]?.[item.key] || '—']);
    });
  });

  const textBlocks = [
    { title: '8. ADUAN KEROSAKAN', body: r.aduan_kerosakan || 'TKD' },
    { title: '9. MURID SAKIT / BALIK LUAR JADUAL', body: r.murid_sakit || 'TLB' },
    { title: '10. KAWALAN KESELAMATAN', body: r.kawalan_keselamatan ? `${r.kawalan_keselamatan} / 5` : '—' },
    { title: '11. CATATAN TAMBAHAN', body: r.catatan_tambahan || '—' },
  ];
  textBlocks.forEach(block => {
    rows.push([{ content: `${block.title}\n${block.body}`, colSpan: 2, styles: BODY_TEXT }]);
  });

  return rows;
}

function drawSignatureFooter(doc: jsPDF, contentBottomY: number, wardenName: string): void {
  let baseY = contentBottomY + 12;
  if (baseY > PAGE_H - 40) baseY = PAGE_H - 40;

  const gap = 4;
  const blockW = (PAGE_W - M * 2 - gap * 2) / 3;

  for (let i = 0; i < 3; i++) {
    const x = M + i * (blockW + gap);
    const cx = x + blockW / 2;

    if (i === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('DISEDIAKAN OLEH', cx, baseY, { align: 'center' });
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(x + 5, baseY + 5.5, x + blockW - 5, baseY + 5.5);
      doc.setFontSize(9);
      doc.text(wardenName, cx, baseY + 13, { align: 'center' });
    } else {
      doc.setDrawColor(150, 145, 135);
      doc.setLineWidth(0.4);
      doc.line(x + 5, baseY + 5.5, x + blockW - 5, baseY + 5.5);
    }
  }
}

function drawReport(doc: jsPDF, logo: string | null, r: ReportDetail): void {
  const timeStr = reportTimeStr(r);
  drawHeader(doc, logo, r.date, timeStr);
  const metaEnd = drawMeta(doc, r, timeStr);

  autoTable(doc, {
    startY: metaEnd,
    margin: { left: M, right: M, bottom: 40 },
    head: [[{ content: 'PERKARA', styles: { halign: 'left' } }, { content: 'PENILAIAN', styles: { halign: 'center' } }]],
    body: buildBodyRows(r),
    theme: 'grid',
    styles: { fontSize: 6.2, cellPadding: 0.45 },
    headStyles: { fillColor: [11, 74, 46], fontSize: 6.4, textColor: [255, 255, 255] },
    columnStyles: {
      0: { cellWidth: PAGE_W - M * 2 - 18 },
      1: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
    },
  });

  const contentBottom = (doc.lastAutoTable?.finalY ?? metaEnd) + 2;
  drawSignatureFooter(doc, contentBottom, r.submitted_by?.name || r.submitted_by_name || '—');
}

export async function buildDailyReportPdf(options: { date: string; reports: ReportDetail[] }): Promise<jsPDF> {
  const { reports } = options;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const logo = await loadLogoDataUrl();

  reports.forEach((r, i) => {
    if (i > 0) doc.addPage();
    drawReport(doc, logo, r);
  });

  return doc;
}

export async function generateDailyReportPdf(options: { date: string; reports: ReportDetail[] }): Promise<void> {
  const doc = await buildDailyReportPdf(options);
  doc.save(`Laporan-Harian-${options.date.replace(/-/g, '')}.pdf`);
}
