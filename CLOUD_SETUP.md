# 🖨️ Scan-to-Email Automation: Complete Setup Guide

This guide explains how to set up your automated timesheet processing system.

**How it works**
1.  **You** scan a timesheet on your Brother printer (selecting "Scan to Email").
2.  **Printer** emails the image to a dedicated bot email address (e.g., `my.bot@gmail.com`).
3.  **Netlify** (your website) checks this inbox every 5 minutes.
4.  **AI** reads the hours from the image.
5.  **You** receive a summary email with the extracted hours and a "Edit in App" link.

---

## 🛠️ Step 1: Create a Bot Email Account
It is highly recommended to use a separate Gmail account for this (e.g., `company.timesheets@gmail.com`), but you can use your own if you are careful.

1.  **Create Account**: Sign up for a new Gmail account.
2.  **Enable IMAP**:
    -   Go to **Settings (Gear icon) > See all settings**.
    -   Click **Forwarding and POP/IMAP** tab.
    -   Under **IMAP access**, select **Enable IMAP**.
    -   Click **Save Changes**.
3.  **Generate App Password** (Critical security step):
    -   Go to [Google Account Security](https://myaccount.google.com/security).
    -   Enable **2-Step Verification** if not already on.
    -   Search for "App Passwords" in the search bar.
    -   Create a new App Password named "Netlify Scanner".
    -   **Copy this password**. You will use this instead of your real password.

---

## ☁️ Step 2: Google Cloud Vision API
You need an API key for the AI text recognition.

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a **New Project**.
3.  Search for **"Cloud Vision API"** and **Enable** it.
4.  Go to **Credentials** > **Create Credentials** > **API Key**.
5.  **Copy this key**.

---

## 🖨️ Step 3: Configure Printer
Set up your Brother Printer (or any scanner) to email scans to your Bot Account.

1.  Find your printer's IP address and type it into your browser to access the **Web Interface** (Default admin password is often `initpass` or on the back of the printer).
2.  Go to **Scan** > **Scan to Email Server** (or similar profile settings).
3.  Create a **New Profile**:
    -   **Profile Name**: `Hours Bot`
    -   **Email Address**: `my.bot@gmail.com` (The exact address from Step 1)
    -   **File Type**: `JPG` or `PDF` (JPG preferred for speed).
4.  **Test it**: Go to your printer, select "Scan to Email" > "Hours Bot". Ensure the email arrives in the `my.bot@gmail.com` inbox.

---

## 🚀 Step 4: Deploy to Netlify
Now we connect your code to the cloud.

1.  **Push Code**: Ensure your latest code is on GitHub.
    ```bash
    git add .
    git commit -m "Setup cloud scanning"
    git push
    ```
2.  **Netlify Configuration**:
    -   Go to your site dashboard on Netlify.
    -   Navigate to **Site settings** > **Environment variables**.
    -   Add the following variables (Click "Add variable"):

| Key | Value | Description |
| :--- | :--- | :--- |
| `EMAIL_USER` | `my.bot@gmail.com` | The bot account address |
| `EMAIL_PASS` | `abcd efgh ijkl mnop` | The **App Password** from Step 1 |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP Server (for sending replies) |
| `IMAP_HOST` | `imap.gmail.com` | IMAP Server (for reading input) |
| `EMAIL_TO` | `your.personal@email.com`| Where you want the report sent |
| `GOOGLE_CLOUD_VISION_API_KEY` | `AIzaSy...` | Your Google API Key from Step 2 |
| `SECRET_KEY` | `Sup3rSecr3t` | A password you invent (used in Step 5) |

3.  **Redeploy**: Go to **Deploys** > **Trigger deploy** to ensure the environmental variables are picked up.

---

## ⏲️ Step 5: Automate the Trigger
Netlify Functions don't run by themselves; they need to be "poked".

1.  Sign up for **[cron-job.org](https://cron-job.org)** (It's free).
2.  **Create Cronjob**:
    -   **Title**: `Hours Scanner Trigger`
    -   **URL**: `https://YOUR-SITE-NAME.netlify.app/.netlify/functions/process-inbox?secret=Sup3rSecr3t`
        -   *Replace `YOUR-SITE-NAME` with your actual Netlify URL.*
        -   *Replace `Sup3rSecr3t` with the `SECRET_KEY` you set in Step 4.*
    -   **Schedule**: Every **5 minutes** (or 10/15 depending on preference).
3.  **Save**.

---

## ✅ You're Done!
**Test the full loop:**
1.  Put a paper timesheet in the scanner.
2.  Select "Scan to Email".
3.  Wait ~5 minutes.
4.  Check your personal email. You should see a "New Scans Processed" email.

**Troubleshooting:**
-   **No email?** Check the **Logs** in Netlify Dashboard > **Functions** > `process-inbox`.
-   **Error "Invalid Credentials"?** Check your `EMAIL_PASS` (App Password) in Netlify Env Vars.
-   **"Unauthorized"?** Ensure the `?secret=` in your Cron Job matches `SECRET_KEY` in Netlify.
