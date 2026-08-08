import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MONTHS, PDF_DAYS, isoToLocal, monthsOf } from '@/app/(admin)/cycles/constants';
import type { CycleDetail, SignatureBlock } from '@/app/(admin)/cycles/types';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

export async function generateCycleSchedulePdf(detail: CycleDetail, signatures: SignatureBlock[], institution: string): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const M = 10;

  try {
    const res = await fetch('/logo_mits.png');
    const blob = await res.blob();
    const dataUrl: string = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    doc.addImage(dataUrl, 'JPEG', M, 4, 32, 28);
  } catch { /* logo optional */ }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('JADUAL TUGASAN WARDEN ASRAMA', pageW / 2, 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('MAAHAD INTEGRASI TAHFIZ SELANGOR ALAM IMPIAN, KLANG', pageW / 2, 20, { align: 'center' });
  doc.text('Jalan Tun Teja 35/1, Alam Impian, Seksyen 35, 40470 Shah Alam, Selangor', pageW / 2, 24.5, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const startYear = new Date(detail.start_date + 'T00:00:00').getFullYear();
  const endYear = new Date(detail.end_date + 'T00:00:00').getFullYear();
  doc.text(`TAHUN : ${startYear}${endYear !== startYear ? ` / ${endYear}` : ''}`, pageW / 2, 30, { align: 'center' });

  const entryByDate = new Map(detail.entries.map(e => [e.date, e]));
  const excludedByDate = new Map(detail.excluded_dates.map(x => [x.date, x.reason]));
  const monthWidth = (pageW - M * 2 - 6) / 2;
  const dateW = 15;
  const hariW = 12;
  const nameW = (monthWidth - dateW - hariW) / 2;
  const startY = 36;

  const months = monthsOf(detail.start_date, detail.end_date);
  const tables = months.map(m => {
    const daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const body: { date: string; hari: string; putera: string; puteri: string; reason: string | null; isWeekend: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(m.getFullYear(), m.getMonth(), d).getDay();
      const ds = isoToLocal(new Date(m.getFullYear(), m.getMonth(), d));
      const reason = excludedByDate.get(ds) || null;
      const entry = entryByDate.get(ds);
      body.push({
        date: `${d}`,
        hari: PDF_DAYS[dow],
        putera: reason ? reason.toUpperCase() : (entry?.putera?.name || '—'),
        puteri: reason ? reason.toUpperCase() : (entry?.puteri?.name || '—'),
        reason,
        isWeekend: dow === 0 || dow === 6,
      });
    }
    return { month: m, body };
  });

  tables.forEach((t, i) => {
    const x = M + i * (monthWidth + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${MONTHS[t.month.getMonth()].toUpperCase()} ${t.month.getFullYear()}`, x, startY - 2);
    autoTable(doc, {
      startY,
      margin: { left: x, right: pageW - x - monthWidth },
      tableWidth: monthWidth,
      head: [
        [{ content: 'TARIKH', rowSpan: 2 }, { content: 'HARI', rowSpan: 2 }, { content: 'WARDEN BERTUGAS', colSpan: 2 }],
        [{ content: 'ASRAMA PUTERA' }, { content: 'ASRAMA PUTERI' }],
      ],
      body: t.body.map(r => [r.date, r.hari, r.putera, r.puteri]),
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: { top: 0.6, bottom: 0.6 }, halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [49, 74, 98], fontSize: 5.5 },
      columnStyles: {
        0: { cellWidth: dateW },
        1: { cellWidth: hariW },
        2: { cellWidth: nameW, halign: 'left', overflow: 'linebreak' },
        3: { cellWidth: nameW, halign: 'left', overflow: 'linebreak' },
      },
      didParseCell: data => {
        if (data.section !== 'body') return;
        const row = t.body[data.row.index];
        if (row?.reason) {
          data.cell.styles.fillColor = [255, 241, 118];
          data.cell.styles.textColor = [120, 90, 0];
          if (data.column.index >= 2) data.cell.styles.fontStyle = 'bold';
        } else if (row?.isWeekend) {
          data.cell.styles.fillColor = [255, 224, 178];
          data.cell.styles.textColor = [100, 70, 0];
        }
      },
    });
  });

  const lastY = (doc.lastAutoTable?.finalY ?? startY) + 3;

  const pageH = doc.internal.pageSize.getHeight();
  let sigY = lastY + 20;
  if (sigY + 30 > pageH) {
    doc.addPage();
    sigY = 25;
  }
  const blockW = (pageW - M * 2 - 12) / 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  signatures.forEach((s, i) => {
    const x = M + i * (blockW + 6);
    doc.text(s.label, x + blockW / 2, sigY, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Signature: (Signed)', x + blockW / 2, sigY + 15, { align: 'center' });
    doc.line(x + 6, sigY + 7, x + blockW - 6, sigY + 7);
    doc.setFontSize(7.5);
    doc.text(s.name, x + blockW / 2, sigY + 20, { align: 'center' });
    doc.text(s.position, x + blockW / 2, sigY + 24.5, { align: 'center' });
    doc.text(institution, x + blockW / 2, sigY + 28.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
  });

  const safeName = detail.name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  doc.save(`Jadual-Tugasan-Warden-${safeName}.pdf`);
}
