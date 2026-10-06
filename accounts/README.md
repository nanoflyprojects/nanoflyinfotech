# NanoFly InfoTech – Accounts Portal

```
index.html            page layout
css/styles.css        portal styles
css/documents.css     invoice / quotation / receipt (A4) styles
css/brand-fonts.css   Posterama / Sentic font-face (needs your licensed font files)
js/config.js          API URL + company details & document defaults
js/app.js             portal logic (dashboard, clients, payments, forms)
js/documents.js       invoice / quotation / receipt templates
assets/logo.png       primary logo (printed documents)      assets/logo-white.png  reverse logo for dark backgrounds
assets/logo-tight.png / logo-white-tight.png   same logos cropped to the artwork (portal screens)
assets/mark.png, mark-tight.png   N mark (watermark, app icon)      assets/favicon.png, apple-touch-icon.png
assets/fonts/         drop Posterama / Sentic .woff2 here (see README.txt inside)
assets/sign.png       default signature
assets/doc-logo.png, doc-watermark.png   header logo + faint background logo taken from your sample formats
assets/icon-*.png     app icons (phone / desktop)
manifest.webmanifest, sw.js   make the portal installable as an app
apps-script/Code.gs   backend for your Google Sheet (paste into Apps Script)
```

## What's inside
- **Dashboard** – the current month only: billed vs collected this month, received, costs, net profit and invoices this month, plus a day-by-day chart. Also what needs attention (overdue invoices, old balances, unpaid designers, low ad wallet) with one-tap WhatsApp reminders.
- **Organization** – for clients who give you several organizations. Add each organization (billing name, contact, GSTIN…), optionally link it to its client, then pick it on projects, invoices and quotations. Each organization has its own page with billed / received / to-collect, projects, invoices, quotations and payments. Documents for an organization are billed to *its* billing name and city. A client page lists all of its organizations.
- **Clients** – one page per client: billed, received, balance, projects, invoices, quotations, payments; call / WhatsApp / email; printable account statement.
- **Invoices & quotations** – Nano Fly design, due dates and overdue flags, duplicate, convert quote → invoice, share on WhatsApp.
- **Team** – your company members / investors. Each project has an *Investor 1* and *Investor 2* (picked from the Team list). A member with a **Team member** login sees ONLY the projects they hold a share in: value, received, costs, profit, their %, their share, what has been paid out and what is still due, plus the payments / costs / payouts behind each project. Admins open any member to see exactly what that member sees.
- **Payments** – link to invoices, issue numbered receipts, filter by month.
- **Projects** – "Repeat next month" for monthly retainers.
- **Expenses** – project costs, company expenses, team payouts, design work, ads & wallet (ad platform: Google or Meta).
- **Company assets** – Expenses → Company expenses → *Add asset* (domain, hosting, laptop…). Choose who settles it: *Project fund*, *Investors (shared)* or a team member. Assets are **not** deducted from company profit (dashboard, monthly report).
- **Reports** – printable monthly summary, investor shares, health check, activity log.
- Search everything from the top bar (press **/**). Works on phone, tablet and desktop.

## Setup
1. Google Sheet → Extensions → Apps Script → replace Code.gs with `apps-script/Code.gs`. Save.
2. Reload the sheet → NanoFLY App → 1. Setup app sheets (and 3. Create client records from projects).
3. Deploy → New deployment → Web app → Execute as **Me**, Who has access **Anyone** → Deploy → copy the URL ending in `/exec`.
4. Open `js/config.js` and paste that URL into `API_URL`.
5. Open `index.html` (double-click, or upload the whole folder to your hosting).

## Login
Sample admin (created automatically the first time):

- Username: `admin`
- Password: `Nanofly@123`

You will be asked to set your own password at the first login. Later:
- **🔑 Password** (top bar) – change your own password.
- **⚙️ Settings → Users & passwords** – rename the admin, add users (Admin = full access, Viewer = read only), reset passwords, remove users.
- Locked out? In Apps Script, choose the function `resetAdmin` and press Run – this restores `admin` / `Nanofly@123`.

Sessions last 6 hours of inactivity. 5 wrong passwords lock that username for 15 minutes. Passwords are stored only as salted hashes in Script Properties (never in the sheet).

After any change to Code.gs: Deploy → Manage deployments → Edit → New version (the URL stays the same).

## Organization – updating an existing install
1. Paste the new `apps-script/Code.gs` into Apps Script and save.
2. Deploy → Manage deployments → Edit → **New version** (URL stays the same).
3. Log in to the portal. The first load adds the `App_Organizations` sheet and an `Organization` column at the end of `App_Projects` and `App_Docs` (nothing existing is moved or deleted). Running *NanoFLY App → 1. Setup app sheets* does the same by hand.

## Team – setup and updating an existing install
1. Paste the new `apps-script/Code.gs` into Apps Script and save.
2. Deploy → Manage deployments → Edit → **New version** (URL stays the same). **Do this before using Team** – until you do, the portal hides the *Team member* login option and shows an "update the backend" notice on the Team page.
3. Log in as admin. The first load adds the `App_Team` sheet and two columns (`Investor1`, `Investor2`) at the end of `App_Projects`. Nothing existing is moved or deleted.
4. **Team → Add member** for every investor / company member.
5. **Projects → Edit** each project and choose *Investor 1* and *Investor 2* (and check the *Investor 1 share %*). Projects with no investor chosen appear in nobody's Team page – the Team page warns you how many.
6. **Team →** the member's **⋯ → Create login** (or Settings → Users → Add user → Access = *Team member*, then pick the member). Give them the temporary password; they must choose their own at first login.
7. Open the member from Team to preview exactly what they will see.

What a Team login can and cannot get (enforced in the Apps Script, not just hidden in the page):
- Gets: only projects where they are Investor 1 or 2, with that project's payments, costs and **their own** payouts. Company name/phone/email.
- Never gets: other projects, clients, organizations, invoices, quotations, company expenses, ad wallet, activity log, bank details, client phone numbers, private notes, the co-investor's name or payouts.
- Cannot change anything (all writes are admin-only).
- Do **not** give investors a *Viewer* login – Viewer sees everything.

Limits: two investors per project (the existing Investor 1 / Investor 2 split). A member's share is calculated on money *received* so far, same as Reports → Investor shares.

## Brand kit (v01)
Colours – Nano Orange `#ED5B2D`, Nano Plum `#291B25`, Nano Cream `#F6F6E9`, White `#FFFFFF`. Fonts – Posterama (display), Sentic (sub-headings), Red Hat Display (body). Dark surfaces use the white logo; small spaces use the N mark. Layout rhythm lives in the `:root` tokens at the top of `css/styles.css` (`--gap`, `--pad`, `--maxw`, `--ctl`).

## Version 4 – what changed
- **Years are January–December** (no financial year). The year filter shows 2026, 2025…
- **Numbering** restarts every January, by document date:
  - Quotation `NF-Quo-2026-01`, Invoice `NF-Inv-2026-01`, Receipt `NF-Rec-2026-01`
  - Change the prefixes in ⚙️ Settings → Numbering if needed.
- **Printables** follow Quotation_format / Invoice_format / Receipt_format: cream paper, faint full logo in the background, "To:" shows ORGANIZATION NAME, website, phone number, city. Your company address is **not** printed.
- **Dashboard filter**: pick any month, or a whole year (Jan–Dec), from the box at the top of the dashboard. It always opens on the current month.
- **Share printables**: every invoice, quotation, receipt and statement has **🖼 Image** and **📄 PDF** buttons. On a phone they open the share sheet (WhatsApp, Gmail, Drive…); on a computer they download the file. 🖨 Print still works as before.
- **Loader** covers the screen while the portal opens and while anything is saving.
- **Phone layout** no longer scrolls sideways; invoices/receipts shrink to fit a phone screen (printing stays A4).

### Updating to version 4
1. Paste the new `apps-script/Code.gs` into Apps Script → Save → Deploy → Manage deployments → Edit → **New version**.
2. Upload the whole portal folder (replace the old files).
3. Log in once. The first load adds the new columns (`OldNo`, `OldReceiptNo`, `Kind`, `FundedBy`, `Notes`) at the end of the sheets – nothing existing moves – and switches saved settings that still had the old defaults (NF / NFQ / NFR prefixes, email, receipt heading, MD name under signature) to the sample formats.
4. ⚙️ Settings → **Restructure old records**. This makes a hidden backup copy of each sheet, renumbers all old invoices / quotations / receipts by date in the new format (old number kept in `OldNo` / `OldReceiptNo`), moves payments to their invoice's new number, sets ad platforms to Google / Meta and fills blank types. Safe to run again. (Also in the sheet menu: NanoFLY App → 4.)
5. Expenses → Company expenses: any domain / hosting / equipment entries are flagged – use ⋯ → *Change to company asset*.

## Install as an app (phone + desktop)
The portal is an installable app (PWA) – one code base for Android, iPhone, Windows and Mac. It must be opened from your website over **https** (not by double-clicking index.html).
- **Android (Chrome)**: menu ⋮ → *Install app* / *Add to Home screen*, or ⚙️ Settings → *Install app*.
- **iPhone / iPad**: open in **Safari** → Share → *Add to Home Screen*.
- **Windows / Mac (Chrome or Edge)**: click the install icon at the right of the address bar, or menu → *Install NanoFly Accounts*. It gets its own window, Start-menu / Dock icon.
- When you upload changed files later, raise `VERSION` at the top of `sw.js` so every device picks them up.
- Need store packages (Play Store APK / Microsoft Store)? Put the https address into pwabuilder.com – it builds them from this same app.

## Version 5 – work tracker, team payments, investor payouts, Hands-On Money
- **Work tracker** (new menu item): *Tasks* = work done (your old SIT / Lajiba / Works Payment logs), *Team payments* = how it was paid, *By member* = tasks, unpaid, task-based, weekly and other payments per person.
- **Two ways to pay the team** – nothing forces one model on everyone:
  - **Task-based**: Tasks → *Pay task* (or New → Team payment → Task-based). One payment, linked to one task; the task shows *Paid · task* and the amount.
  - **Weekly**: *Weekly payment* → choose the member and week (Mon–Sun, filled in for you). Their unpaid tasks for that week are listed and ticked; untick any, or untick all – ticking is optional. Ticked tasks show *Paid · weekly*. One amount for the week.
  - Every payment has a **Reason** (Specialized Task, Weekly Work Payment, Additional Work, Overtime, Urgent Work, Performance / Incentive, Advance Payment, Correction / Adjustment, Other → type the reason), a status (Paid / Pending), payment date and period.
  - Paid team payments are project costs: to the payment's project if you set one, otherwise split over the projects of the ticked tasks. A payment with neither (e.g. an advance) is a company-level cost.
  - Old *Team* amounts in Project costs (from Spent Details) stay as they are. Record new team payments in the Work tracker, not as project costs, so nothing is counted twice.
- **Investor payouts** (Team → Investor payouts, and Reports → Investor payouts): one *payout structure* per investor – investment amount, structure (Profit share / Fixed return % / Fixed amount / Manual), rate, payout period (monthly, quarterly…), start/end, status, notes. Shows payable, paid, pending, last payment date and status. *Pay* records a payout with the pending amount filled in. Investors on projects without a structure still appear (profit share).
- **Hands-On Money** on the dashboard: Overall, the year and the month, side by side (tap one to switch). Formula (same as the Hands-on column in your old sheet, extended to company money):
  received from clients − project costs − team payments − company running expenses − assets paid from the project fund − investor payouts.
  Also shown in Reports → Financial summary, and per project (*Hands-on* column in Projects).
- **Period filter everywhere**: Year (All years / 2026 / 2025…) + Month (Whole year / Jan…Dec). Lists use the box in the top bar; Reports has its own at the top of every report; the dashboard opens on the current month and has *All years* too.
- **Reports**: Financial summary (with year-by-year or month-by-month table), Team payments, Work tracker, Expenses, Investor payouts, Health check, Activity log.

### Updating to version 5
1. Paste the new `apps-script/Code.gs` into Apps Script → Save → Deploy → Manage deployments → Edit → **New version**.
2. Upload the whole portal folder (replace the old files).
3. Log in once. The first load adds the `App_TeamPay` and `App_InvestorPlans` sheets and six columns at the end of `App_Payouts` (`Member`, `FromDate`, `ToDate`, `Payable`, `Status`, `Plan`). Nothing existing moves; old payouts count as Paid.
4. Team → Investor payouts → *Add structure* for each investor.
