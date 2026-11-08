/* ==========================================================
   Nano Wealth configuration — edit these two values (see SETUP.md)
   Leave both empty to run in DEMO MODE (data stays in your browser).
   ========================================================== */
window.NS_CONFIG = {
  // Google Cloud → APIs & Services → Credentials → OAuth client ID (Web application)
  GOOGLE_CLIENT_ID: "808262907422-e2khl7bbi0hl8grg4nl8b76g467af0eg.apps.googleusercontent.com",
  // Apps Script web-app URL from apps-script/Code.gs (the admin registry)
  REGISTRY_URL: "https://script.google.com/macros/s/AKfycbyk46KWpqTg1-QkH9QFMiwa8mZNrr9Z-ZzwfctrDVGplfoK9o7eYe8571ptsOVXGlgH/exec",

  // Where the app pages live on the site. Only this folder holds pages; all .js files sit at the site root.
  BASE: "/nanowealth/",
  APP_NAME: "Nano Wealth",
  SHEET_TITLE: "Nano Wealth — My Money Data",
  // Only a hint for the admin sign-in screen. Real admin rights are enforced server-side
  // by ADMIN_EMAILS inside Code.gs.
  ADMIN_HINT: "nanowealth@nanoflyinfotech.com",
  // Only files created by Nano Wealth itself are ever touched (drive.file is a NON-sensitive scope).
  SCOPES: "openid email profile https://www.googleapis.com/auth/drive.file"
};
