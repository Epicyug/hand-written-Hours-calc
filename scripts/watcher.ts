
import chokidar from 'chokidar';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeImage } from '../src/utils/googleCloudOcr';
import { parseTimesheet } from '../src/utils/ocrParser';

// Load environment variables
dotenv.config();

// Configuration
const WATCH_DIR = process.env.WATCH_DIR || 'C:\\Scans';
const GOOGLE_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY;
const EMAIL_HOST = process.env.EMAIL_HOST; // e.g. smtp.gmail.com
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587');
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_TO = process.env.EMAIL_TO; // The specific email to send to
const SECRET_KEY = process.env.SECRET_KEY || 'NoKeyProvided';

if (!GOOGLE_API_KEY) {
    console.error('❌ Missing GOOGLE_CLOUD_VISION_API_KEY in .env');
    process.exit(1);
}

if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
    console.error('❌ Missing Email configuration in .env');
    process.exit(1);
}

// Ensure watch directory exists
if (!fs.existsSync(WATCH_DIR)) {
    console.log(`Creating watch directory: ${WATCH_DIR}`);
    fs.mkdirSync(WATCH_DIR, { recursive: true });
}

// Setup Email Transporter
const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
    },
});

console.log(`👀 Watching for new scans in: ${WATCH_DIR}`);

const watcher = chokidar.watch(WATCH_DIR, {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
    },
});

watcher.on('add', async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.pdf'].includes(ext)) return;

    console.log(`\n📄 New file detected: ${path.basename(filePath)}`);

    try {
        await processFile(filePath);
    } catch (error) {
        console.error('❌ Error processing file:', error);
    }
});

async function processFile(filePath: string) {
    // 1. Read File
    // For now, handle images. PDF support would require pdf-to-image conversion node library (e.g. pdf-poppler) which might not be installed.
    // If it's a PDF, we might skip or try to attach as is.
    // But the requirements say "scanned document (filled hours)", which implies we MUST read it.
    // Since App.tsx handles PDF via pdfjs inside browser context, reusing that here is hard without DOM.
    // For this MVP script, we'll support Images fully. If PDF, we might just email it without hours pre-filled or warn.

    const ext = path.extname(filePath).toLowerCase();
    let base64Image = '';

    if (ext === '.pdf') {
        console.warn('⚠️ PDF detected. PDF OCR in Node requires additional setup. Attaching raw PDF to email.');
        // We can't easily parse PDF in Node without external tools like poppler or canvas for pdf.js
        // Sending email with attachment only.
        await sendEmail(filePath, null, "PDF Document (OCR skipped)");
        return;
    } else {
        const fileBuffer = fs.readFileSync(filePath);
        base64Image = fileBuffer.toString('base64');
    }

    // 2. OCR
    console.log('🔍 Running OCR...');
    const ocrResponse = await analyzeImage(base64Image, GOOGLE_API_KEY!);

    // 3. Parse
    console.log('🧠 Parsing Hours...');
    const parsedData = parseTimesheet(ocrResponse);

    // 4. Send Email
    console.log('📧 Sending Email...');
    await sendEmail(filePath, parsedData, "Scanned Timesheet Processed");
    console.log('✅ Done!');
}

function formatWeekHtml(weekData: any, title: string) {
    const days = weekData.days || [];
    const rows = days.map((d: any) => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.day}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.morningIn || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.morningOut || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.afternoonIn || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.afternoonOut || '-'}</td>
        </tr>
    `).join('');

    return `
        <h3>${title}</h3>
        <table style="border-collapse: collapse; width: 100%;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th style="border: 1px solid #ddd; padding: 8px;">Day</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Morning In</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Morning Out</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Afternoon In</th>
                    <th style="border: 1px solid #ddd; padding: 8px;">Afternoon Out</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

async function sendEmail(filePath: string, parsedData: any | null, subject: string) {
    const filename = path.basename(filePath);

    let htmlBody = `
        <h2>New Scan Received</h2>
        <p><strong>File:</strong> ${filename}</p>
        <p><strong>Key:</strong> ${SECRET_KEY}</p>
    `;

    if (parsedData) {
        htmlBody += formatWeekHtml(parsedData.week1, 'Week 1');
        htmlBody += formatWeekHtml(parsedData.week2, 'Week 2');
    } else {
        htmlBody += `<p><em>No data parsed (PDF or error). Please review attached file.</em></p>`;
    }

    // Add a link if needed?
    // htmlBody += `<p><a href="http://localhost:5173">Open App</a></p>`;

    const mailOptions = {
        from: `"${EMAIL_FROM}" <${EMAIL_USER}>`,
        to: EMAIL_TO,
        subject: `${subject} - ${filename}`,
        html: htmlBody,
        attachments: [
            {
                filename: filename,
                path: filePath
            }
        ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Message sent: %s", info.messageId);
}
