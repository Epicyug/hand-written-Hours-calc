import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { WeekSheet } from '../components/TimesheetForm';
import { calculateDailyMinutes, formatMinutes } from './timeUtils';

// Helper to draw the table structure
const drawWeekTable = (doc: jsPDF, week: WeekSheet | null, startY: number) => {
    // Header Info

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0); // Force Black Text
    // Draw Boxes for Name and Week Of like in image
    // Name Box
    doc.rect(14, startY, 90, 10);
    doc.text(week ? `Name Of Employee: ${week.employeeName}` : "Name Of Employee:", 16, startY + 7);

    // Week Of Box
    doc.rect(104, startY, 90, 10);
    doc.text(week ? `Week Of: ${week.weekOf}` : "Week Of:", 106, startY + 7);

    // Prepare Body
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
        // Blank rows for template
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
            [
                'In', 'Out', 'In', 'Out', 'Total'
            ]
        ],
        body: body,
        theme: 'grid',
        styles: { lineWidth: 0.1, lineColor: [0, 0, 0], minCellHeight: 8 }, // Taller cells for writing
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 25 },
        }
    });

    return (doc as any).lastAutoTable.finalY;
};

export function generatePDF(data: { week1: WeekSheet; week2: WeekSheet; hourlyRate?: string }) {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text("Bi-weekly Time Sheet", 105, 15, { align: "center" });

    let currentY = 25;
    currentY = drawWeekTable(doc, data.week1, currentY);
    currentY += 10;
    currentY = drawWeekTable(doc, data.week2, currentY);

    // Calculate Totals for PDF
    const w1Mins = data.week1.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
    const w2Mins = data.week2.days.reduce((acc, d) => acc + calculateDailyMinutes(d.morningIn, d.morningOut, d.afternoonIn, d.afternoonOut, '', ''), 0);
    const totalMins = w1Mins + w2Mins;
    const totalHours = totalMins / 60;
    const rate = parseFloat(data.hourlyRate || '0');
    const totalPay = isNaN(rate) ? 0 : totalHours * rate;

    currentY += 10;

    // Summary Box
    doc.setDrawColor(0);
    doc.setFillColor(245, 245, 245);
    doc.rect(14, currentY, 180, 25, 'F');
    doc.rect(14, currentY, 180, 25, 'S');

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    // Column 1: Hours
    doc.text("Total Hours:", 20, currentY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(formatMinutes(totalMins), 20, currentY + 18);

    // Column 2: Rate
    doc.setFont('helvetica', 'bold');
    doc.text("Hourly Rate:", 80, currentY + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(rate > 0 ? `$${rate.toFixed(2)}` : '-', 80, currentY + 18);

    // Column 3: Total Pay
    doc.setFont('helvetica', 'bold');
    doc.text("Total Pay:", 140, currentY + 10);
    doc.setFontSize(14); // Larger for pay
    doc.text(rate > 0 ? `$${totalPay.toFixed(2)}` : '-', 140, currentY + 18);




    doc.save("timesheet.pdf");
}


