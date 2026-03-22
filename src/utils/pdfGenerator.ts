import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WeekSheet, PageData } from '../components/TimesheetForm';
import { calculateDailyMinutes, formatMinutes } from './timeUtils';

// Helper to draw a single week table, returns the Y position after the table
const drawWeekTable = (doc: jsPDF, week: WeekSheet | null, startY: number): number => {
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    doc.rect(14, startY, 90, 10);
    doc.text(week ? `Name Of Employee: ${week.employeeName}` : 'Name Of Employee:', 16, startY + 7);

    doc.rect(104, startY, 90, 10);
    doc.text(week ? `Week Of: ${week.weekOf}` : 'Week Of:', 106, startY + 7);

    let body: any[] = [];
    if (week) {
        body = week.days.map(day => {
            const dailyMins = calculateDailyMinutes(
                day.morningIn, day.morningOut,
                day.afternoonIn, day.afternoonOut,
                '', ''
            );
            return [
                day.day,
                day.morningIn, day.morningOut,
                day.afternoonIn, day.afternoonOut,
                dailyMins > 0 ? formatMinutes(dailyMins) : ''
            ];
        });

        const totalWeeklyMinutes = week.days.reduce((acc, day) => acc + calculateDailyMinutes(
            day.morningIn, day.morningOut,
            day.afternoonIn, day.afternoonOut,
            '', ''
        ), 0);

        body.push(['Total Hours', '', '', '', '', formatMinutes(totalWeeklyMinutes)]);
    } else {
        const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        body = DAYS.map(day => [day, '', '', '', '', '']);
        body.push(['Total Hours', '', '', '', '', '']);
    }

    autoTable(doc, {
        startY: startY + 10,
        head: [
            [
                { content: 'Week Day', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
                { content: 'Morning', colSpan: 2, styles: { halign: 'center' } },
                { content: 'Afternoon', colSpan: 2, styles: { halign: 'center' } },
                { content: 'Daily', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } }
            ],
            ['In', 'Out', 'In', 'Out', 'Total']
        ],
        body,
        theme: 'grid',
        styles: { lineWidth: 0.1, lineColor: [0, 0, 0], minCellHeight: 8 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 25 },
        }
    });

    return (doc as any).lastAutoTable.finalY;
};

export function generatePDF({ pages, hourlyRate }: { pages: PageData[]; hourlyRate?: string }) {
    const doc = new jsPDF();

    let grandTotalMins = 0;

    pages.forEach((page, pageIndex) => {
        if (pageIndex > 0) {
            doc.addPage();
        }

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        const title = pages.length > 1
            ? `Bi-weekly Time Sheet — ${page.label}`
            : 'Bi-weekly Time Sheet';
        doc.text(title, 105, 15, { align: 'center' });

        let currentY = 25;
        currentY = drawWeekTable(doc, page.week1, currentY);
        currentY += 10;
        currentY = drawWeekTable(doc, page.week2, currentY);

        // Per-page subtotal
        const w1Mins = page.week1.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
        const w2Mins = page.week2.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
        const pageTotalMins = w1Mins + w2Mins;
        grandTotalMins += pageTotalMins;

        currentY += 10;

        // Per-page summary box
        doc.setDrawColor(0);
        doc.setFillColor(245, 245, 245);
        doc.rect(14, currentY, 180, 20, 'F');
        doc.rect(14, currentY, 180, 20, 'S');

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Page Hours: ${formatMinutes(pageTotalMins)}`, 20, currentY + 12);

        if (pages.length > 1) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('(See last page for grand total)', 105, currentY + 12, { align: 'center' });
        }
    });

    // Grand total summary — on last page (or same page if single)
    const rate = parseFloat(hourlyRate || '0');
    const totalHours = grandTotalMins / 60;
    const totalPay = isNaN(rate) ? 0 : totalHours * rate;

    // Add a fresh page for grand total only when there are multiple pages
    if (pages.length > 1) {
        doc.addPage();
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Grand Total Summary', 105, 20, { align: 'center' });

        // Per-page breakdown table
        const breakdownBody = pages.map(page => {
            const w1 = page.week1.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
            const w2 = page.week2.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
            const pageMins = w1 + w2;
            const pageHours = pageMins / 60;
            const pagePay = isNaN(rate) ? 0 : pageHours * rate;
            return [
                page.label,
                page.week1.employeeName || '—',
                formatMinutes(pageMins),
                rate > 0 ? `$${pagePay.toFixed(2)}` : '—'
            ];
        });

        autoTable(doc, {
            startY: 30,
            head: [['Page', 'Employee', 'Hours', 'Pay']],
            body: breakdownBody,
            theme: 'grid',
            styles: { lineWidth: 0.1, lineColor: [0, 0, 0] },
            headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        });

        const afterTable = (doc as any).lastAutoTable.finalY + 10;

        // Grand total box
        doc.setDrawColor(0);
        doc.setFillColor(230, 245, 230);
        doc.rect(14, afterTable, 180, 30, 'F');
        doc.rect(14, afterTable, 180, 30, 'S');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Grand Total Hours:', 20, afterTable + 12);
        doc.setFont('helvetica', 'normal');
        doc.text(formatMinutes(grandTotalMins), 20, afterTable + 22);

        doc.setFont('helvetica', 'bold');
        doc.text('Hourly Rate:', 80, afterTable + 12);
        doc.setFont('helvetica', 'normal');
        doc.text(rate > 0 ? `$${rate.toFixed(2)}` : '—', 80, afterTable + 22);

        doc.setFont('helvetica', 'bold');
        doc.text('Total Pay:', 140, afterTable + 12);
        doc.setFontSize(14);
        doc.text(rate > 0 ? `$${totalPay.toFixed(2)}` : '—', 140, afterTable + 22);
    } else {
        // Single page — append summary at bottom of the only page (same as original)
        // Re-calculate currentY based on last page content
        // We don't have access to currentY here, so we use a fixed offset approach via lastAutoTable
        const lastY = (doc as any).lastAutoTable.finalY + 20;

        doc.setDrawColor(0);
        doc.setFillColor(245, 245, 245);
        doc.rect(14, lastY, 180, 25, 'F');
        doc.rect(14, lastY, 180, 25, 'S');

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Total Hours:', 20, lastY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(formatMinutes(grandTotalMins), 20, lastY + 18);

        doc.setFont('helvetica', 'bold');
        doc.text('Hourly Rate:', 80, lastY + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(rate > 0 ? `$${rate.toFixed(2)}` : '-', 80, lastY + 18);

        doc.setFont('helvetica', 'bold');
        doc.text('Total Pay:', 140, lastY + 10);
        doc.setFontSize(14);
        doc.text(rate > 0 ? `$${totalPay.toFixed(2)}` : '-', 140, lastY + 18);
    }

    doc.save('timesheet.pdf');
}
