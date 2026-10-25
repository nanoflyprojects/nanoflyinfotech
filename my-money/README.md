# My Money: money tracker with Google Sheets as the database

A website for tracking income, spending, bills, debts and investments. It reads and writes a Google Sheet through a small Google Apps Script web app.

```
my-money/
├─ index.html            the page
├─ css/style.css         all styling (light and dark theme)
├─ js/app.js             the app (dashboard, bills, debts, investments, reminders)
├─ js/config.js          your API_URL and TOKEN go here
├─ js/seed.js            your Expenses.xlsx data (demo data / first fill)
└─ apps-script/Code.gs   the Google Sheets backend
```

## 1. Set up the Google Sheet backend (about 5 minutes)

1. Upload your Expenses file to Google Drive and open it as a Google Sheet (or use the Sheet you already have).
2. In the Sheet choose **Extensions → Apps Script**.
3. Delete the sample code and paste the contents of `apps-script/Code.gs`. Save.
4. Choose the function **setup** in the toolbar and click **Run**. Approve the permissions. Open **Execution log** and copy the **TOKEN** it prints.
5. Optional but recommended: run **importFromMonthSheets**. It copies your July, August, September and October tabs into a new **Transactions** tab. Your original tabs are not changed. Run it once, before you start using the site.
6. Click **Deploy → New deployment → Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Copy the **Web app URL** (ends with `/exec`).

The URL is public but every request needs your TOKEN, so only your site can read or write the data. Keep the TOKEN private.

## 2. Connect the website

Open `js/config.js` and fill in both values:

```js
window.MYMONEY_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
  TOKEN: 'the-token-from-setup'
};
```

Then host the `my-money` folder anywhere that serves static files (GitHub Pages, Netlify, Vercel, Cloudflare Pages, or any web hosting). Double-clicking `index.html` also works for local use.

The sidebar shows the sync status ("Synced with Google Sheets"). Reminders and browser notifications need the site served over **https** (every host above does this).

## What gets stored in the Sheet

| Tab | Contents |
|---|---|
| Transactions | every income and expense (date, type, category, note, amount, wallet) |
| Bills | recurring bills and their next due date |
| Debts | loans and money owed to you |
| Meta | budgets, investment values, settings, opening balance |

You can read or edit these tabs by hand. Keep dates as `YYYY-MM-DD` and `type` as `in` or `out`. Reload the website to see the changes.

## Notes

- If you change `Code.gs` later, use **Deploy → Manage deployments → Edit → New version** so the URL stays the same.
- Without an `API_URL` the site runs in demo mode and keeps data in the browser only.
- To change the year or tab names used by the import, edit `YEAR` and `MONTH_TABS` at the top of `Code.gs`.
- Settings → Export backup downloads a JSON copy of everything.

## Sign-in (one password, once, no sign-out)

1. In Apps Script open `Code.gs`, type your password (at least 6 characters) between the quotes in `setPassword()`, choose **setPassword** in the toolbar and click **Run**. Then delete the password from the code and redeploy (Deploy → Manage deployments → Edit → New version).
2. Open the site once and type the password. The phone remembers it, so there is no sign-out button and it never asks again. Changing the password asks each device once more.

## Install on a phone

**Fastest (no build):** host the `my-money` folder on https (GitHub Pages, Netlify, Cloudflare Pages). Open it in Chrome on Android → menu → **Install app**. It installs with the My Money icon and opens full screen.

**Real APK:** put the whole `my-money-app` folder in a GitHub repository (branch `main`). Open the **Actions** tab → **Build My Money APK** → Run workflow. When it finishes, download `my-money-apk` from the run, unzip, and install `app-debug.apk` on your phone (allow "install unknown apps").
