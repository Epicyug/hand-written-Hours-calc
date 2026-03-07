
# Scan Processing Workflow Setup

This document guides you through setting up the automated "Scan to Email with Hours" system.

## 1. Prerequisites
- A Brother Printer (or any scanner) capable of scanning to a **folder on your PC**.
- Google Cloud Vision API Key.
- An Email account for sending notifications (Gmail, Outlook, etc.).

## 2. Configuration
Open the `.env` file in the project root and fill in the details:

```ini
# Your Google Cloud Key
GOOGLE_CLOUD_VISION_API_KEY=AIzaSy...

# The folder where your printer saves scans
WATCH_DIR=C:\Scans

# Email Settings (Example for Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your.bot@gmail.com
EMAIL_PASS=your_app_password
EMAIL_TO=recipient@example.com
```

> **Note for Gmail Users**: You likely need to generate an **App Password** if you have 2-Step Verification enabled. Go to Google Account > Security > App Passwords to create one.

## 3. Printer Setup
You need to configure your Brother printer to scan to the folder specified in `WATCH_DIR` (default: `C:\Scans`).

1. **Create the folder**: Ensure `C:\Scans` exists.
2. **Open Brother Utilities / ControlCenter4**:
   - Go to **Device Settings** > **Scan to PC Settings**.
   - Select the **File** button/tab.
   - Set the **Destination Folder** to `C:\Scans`.
   - Set the **File Type** to `PNG` or `JPG` (preferred) or `PDF`.
   - (Optional) Name the profile "Hours Scan".
3. **On the Printer**:
   - Press **Scan**.
   - Select **to File** (or your custom profile).
   - Start Scan.

## 4. Running the Automation
Open a terminal in the project folder and run:
```bash
npm run watch-scans
```

The script will:
1. Start watching `C:\Scans`.
2. Detect any new file.
3. Perform OCR to extract hours.
4. Send an email with the image attached and hours listed.
