# Contact Form → Google Sheet + Email (Setup Guide)

This connects the contact form on `contact.html` to a Google Sheet and sends
a notification email to **works@nanoflyinfotech.com**, sent from
**nanofly.projects@gmail.com** (the Gmail account that owns the script).

Total time: ~10 minutes.

---

## Step 1 — Create the Google Sheet

1. Log into **nanofly.projects@gmail.com** (must be this account, since it
   determines the "From" address on the notification email).
2. Go to https://sheets.google.com and create a **new blank spreadsheet**.
3. Name it something like `Nanofly Website Leads`.
4. You don't need to create any tabs/columns manually — the script creates
   a "Submissions" tab with headers automatically on the first submission.

## Step 2 — Open the Apps Script editor

1. In the spreadsheet, click **Extensions → Apps Script**.
2. Delete anything in the default `Code.gs` file that opens.
3. Copy the entire contents of `Code.gs` (in this folder) and paste it in.
4. Click the disk icon (**Save**), and name the project e.g. `Nanofly Contact Form`.

## Step 3 — Deploy as a Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** `Nanofly contact form v1`
   - **Execute as:** `Me (nanofly.projects@gmail.com)`
   - **Who has access:** `Anyone`
     *(This is required — it's what lets your public website POST to it.
     It does not expose your Sheet; only this script's `doPost`/`doGet`
     functions are reachable, and only in the ways the code allows.)*
4. Click **Deploy**.
5. Google will ask you to **authorize** the script:
   - Click **Authorize access**.
   - Choose the `nanofly.projects@gmail.com` account.
   - You'll see an "unverified app" warning — this is normal for scripts
     you write yourself. Click **Advanced → Go to Nanofly Contact Form
     (unsafe)** → **Allow**.
6. After deployment, copy the **Web app URL** shown. It looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

## Step 4 — Paste the URL into the website

1. Open `contact.html`.
2. Find this line near the bottom (inside the `<script>` block):
   ```js
   const GOOGLE_SHEET_ENDPOINT = "PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
   ```
3. Replace the placeholder with the URL you copied, e.g.:
   ```js
   const GOOGLE_SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycb.../exec";
   ```
4. Save and re-upload/deploy the website.

## Step 5 — Test it

1. Open the live contact page and submit the form with a test entry.
2. Check:
   - The Google Sheet — a new row should appear in the "Submissions" tab.
   - The **works@nanoflyinfotech.com** inbox — you should get an email
     titled "New Website Lead — ...", sent from `nanofly.projects@gmail.com`.
   - If you left `SEND_AUTO_REPLY = true` in `Code.gs`, the test email
     address you submitted should also get a short thank-you auto-reply.

If the form shows a "Something went wrong" error:
- Double-check the URL was pasted correctly (must end in `/exec`, not `/dev`).
- Make sure "Who has access" was set to **Anyone**, not "Anyone with Google account".
- Re-open Apps Script → Deploy → Manage deployments, and confirm the
  deployment is **Active**.

## Updating the script later

If you ever edit `Code.gs` again (e.g. change the notification email),
you must create a **new version**: Deploy → Manage deployments → pencil
icon → Version: "New version" → Deploy. Simply saving the file does not
update the live Web App.

## Notes

- Submissions are stored with a timestamp, name, email, phone, inquiry
  type, message, and the page URL they were sent from.
- The honeypot field (`botcheck`) silently drops spam-bot submissions
  without writing them to the sheet or sending an email.
- `MailApp.sendEmail` uses your Gmail sending quota (100 emails/day on a
  free Gmail account, 1,500/day on Google Workspace) — more than enough
  for a contact form.
