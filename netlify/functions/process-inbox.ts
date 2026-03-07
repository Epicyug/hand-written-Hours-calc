
import type { Config } from "@netlify/functions";
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { analyzeImage } from '../../src/utils/googleCloudOcr'; // Adjust path if needed
import { parseTimesheet } from '../../src/utils/ocrParser'; // Adjust path if needed
import _ from 'lodash';

// We need to polyfill some globals if reusing frontend code that uses 'fetch' or environment
// Use 'node-fetch' if needed, or global fetch is available in Node 18+ (Netlify usually 18 or 20)

export default async (req: Request) => {
    // Basic security check: Require a secret token in URL query ?secret=YOUR_SECRET
    // to prevent random people from triggering your inbox check.
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    if (secret !== process.env.SECRET_KEY) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const result = await checkInboxAndProcess(url.origin); // Pass origin to generate links
        return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};

async function checkInboxAndProcess(baseUrl: string) {
    const config = {
        imap: {
            user: process.env.EMAIL_USER!,
            password: process.env.EMAIL_PASS!,
            host: process.env.IMAP_HOST || 'imap.gmail.com',
            port: 993,
            tls: true,
            authTimeout: 3000,
        },
    };

    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN']; // Only unread emails
    const fetchOptions = {
        bodies: ['HEADER', 'TEXT', ''],
        markSeen: false, // We'll mark seen after successful processing
    };

    const messages = await connection.search(searchCriteria, fetchOptions);

    // Store results to batch send
    const batchResults: Array<{
        filename: string;
        parsedData: any | null;
        error?: string;
    }> = [];

    // Store UIDs to mark as seen
    const processedUids: number[] = [];
    // Only reply to the sender of the first email? Or just send to defined EMAIL_TO?
    // User requested "send link to a specific email". So we always send to EMAIL_TO.

    for (const message of messages) {
        const parts = imaps.getParts(message.attributes.struct);

        // Find attachments (images or PDFs)
        const attachmentParts = parts.filter(part =>
            part.disposition &&
            part.disposition.type.toUpperCase() === 'ATTACHMENT'
        );

        if (attachmentParts.length === 0) continue;

        const all = _.find(message.parts, { "which": "" });
        const id = message.attributes.uid;

        // Use mailparser to parse the raw email source
        const raw = await connection.getPartData(message, all!); // Fix types
        const parsedEmail = await simpleParser(raw);

        // Filter for images/pdfs
        const targetAttachments = parsedEmail.attachments.filter(att =>
            ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'].includes(att.contentType)
        );

        if (targetAttachments.length > 0) {
            console.log(`Processing email: ${parsedEmail.subject} - Found ${targetAttachments.length} attachments`);

            for (const targetAttachment of targetAttachments) {
                // Skip PDF OCR for now or handle it? 
                let parsedData = null;
                let errorMsg = undefined;

                if (targetAttachment.contentType === 'application/pdf') {
                    errorMsg = "PDF processing not fully supported on cloud yet.";
                    // If we wanted to, we could try pdf-lib or just attachment forwarding.
                } else {
                    try {
                        // 1. OCR
                        const base64 = targetAttachment.content.toString('base64');
                        const ocrResponse = await analyzeImage(base64, process.env.GOOGLE_CLOUD_VISION_API_KEY!);
                        // 2. Parse
                        parsedData = parseTimesheet(ocrResponse);
                    } catch (e: any) {
                        errorMsg = e.message || "OCR Failed";
                    }
                }

                batchResults.push({
                    filename: targetAttachment.filename || 'unknown_file',
                    parsedData,
                    error: errorMsg
                });
            }

            processedUids.push(message.attributes.uid);
        }
    }

    if (batchResults.length > 0) {
        await sendBatchEmail(process.env.EMAIL_TO!, batchResults, baseUrl);

        // Mark all as SEEN
        if (processedUids.length > 0) {
            await connection.addFlags(processedUids, '\\Seen');
        }
    }

    connection.end();
    return { status: 'success', processedCount: batchResults.length };
}

async function sendBatchEmail(to: string, results: Array<{ filename: string, parsedData: any | null, error?: string }>, baseUrl: string) {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: parseInt(process.env.EMAIL_PORT || '587') === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    let htmlBody = `
        <h2>Processed Scans Report</h2>
        <p>Found ${results.length} new document(s).</p>
        <hr/>
    `;

    results.forEach((res, index) => {
        htmlBody += `<div style="margin-bottom: 30px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">`;
        htmlBody += `<h3>${index + 1}. ${res.filename}</h3>`;

        if (res.error) {
            htmlBody += `<p style="color: red;">Error: ${res.error}</p>`;
        } else if (res.parsedData) {
            // Generate Deep Link
            const jsonString = JSON.stringify(res.parsedData);
            const base64Data = Buffer.from(jsonString).toString('base64');
            // Assuming baseUrl is where the app is hosted. Netlify function request header might be api root, need site root.
            // If function is at site.com/.netlify/function..., origin is site.com
            const editLink = `${baseUrl}/?data=${encodeURIComponent(base64Data)}`;

            htmlBody += `<p><a href="${editLink}" style="background-color: #2563eb; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; font-weight: bold;">📝 Open & Edit in App</a></p>`;

            // Brief Table (Reuse formatter logic minimally or just abstract)
            htmlBody += formatWeekHtml(res.parsedData.week1, 'Week 1');
            htmlBody += formatWeekHtml(res.parsedData.week2, 'Week 2');
        }

        htmlBody += `</div>`;
    });

    await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM || 'Hours Bot'}" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: `New Scans Processed (${results.length})`,
        html: htmlBody
    });
}

function formatWeekHtml(weekData: any, title: string) {
    const days = weekData.days || [];
    const rows = days.map((d: any) => `
        <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.day.substring(0, 3)}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.morningIn || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.morningOut || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.afternoonIn || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${d.afternoonOut || '-'}</td>
        </tr>
    `).join('');

    return `
        <h4 style="margin-top:10px; margin-bottom:5px;">${title}</h4>
        <table style="border-collapse: collapse; width: 100%; font-size: 14px;">
            <thead>
                <tr style="background-color: #f8f9fa;">
                    <th style="border: 1px solid #ddd; padding: 6px;">Day</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">In</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">Out</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">In</th>
                    <th style="border: 1px solid #ddd; padding: 6px;">Out</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}
