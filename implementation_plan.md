# Implementation Plan - Cloud-Based Scan Processing

The goal is to enable a fully cloud-based "Scan to Email" workflow using your printer's existing capabilities and Netlify.

## The Workflow
1.  **Scan**: You select "Scan to Email" on your printer.
2.  **Send**: The printer sends the image to a dedicated email address (e.g., `your.bot@gmail.com`).
3.  **Trigger**: A Netlify Function checking the inbox (triggered manually or by schedule).
4.  **Process**: The function downloads the attachment, runs AI OCR, and emails you the results.

## Architecture

### 1. New Dependency: IMAP
We need to read emails from the bot account. We added `imap-simple` and `mailparser`.

### 2. Netlify Function: `process-inbox`
A new API endpoint `/api/check-inbox`.
-   **Connects** to Gmail (or other) via IMAP.
-   **Searches** for unread emails with subject "Scan" (or from specific sender).
-   **Downloads** attachment.
-   **Processes** (OCR + Parse).
-   **Replies** to the sender with the result.
-   **Marks** email as read/processed.

### 3. Usage
-   **Manual**: Visit `https://your-site.app/api/check-inbox` to force a check.
-   **Automated**: Use a free Cron service (like cron-job.org) or Netlify Scheduled Functions (if enabled) to hit that URL every 15 minutes.

## Proposed Code Changes

### [NEW] `netlify/functions/check-inbox.ts`
-   The core logic for checking email and running the pipeline.

### [MODIFY] `package.json`
-   Ensure build scripts handles the functions if needed (Netlify handles `netlify/functions` automatically).

### [MODIFY] `.env`
-   Reuse existing `EMAIL_USER` / `EMAIL_PASS`.
-   Add `IMAP_HOST` (e.g. `imap.gmail.com`).

## Verification Plan
1.  Create the function.
2.  Send a test email with an image attachment to the bot account.
3.  Run the function locally via a test script (simulating the web trigger).
4.  Verify a reply is received.
