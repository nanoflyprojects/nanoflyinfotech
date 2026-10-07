/* NanoFly Accounts – service worker: makes the portal installable and opens instantly.
   Your data always comes live from the Google Sheet (Apps Script calls are never cached).
   Bump VERSION whenever you upload changed files so every phone / computer picks them up. */
const VERSION = 'nf-accounts-v5.5';
const SHELL = ['./', './index.html', './manifest.webmanifest',
  './css/styles.css', './css/documents.css', './css/brand-fonts.css',
  './js/config.js', './js/app.js', './js/documents.js', './js/share-doc.js',
  './assets/logo-tight.png', './assets/logo-white-tight.png', './assets/mark-tight.png', './assets/favicon.png',
  './assets/apple-touch-icon.png', './assets/icon-192.png', './assets/icon-512.png',
  './assets/doc-logo.png', './assets/doc-watermark.png', './assets/sign.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;  // live data: never cached
  const sameOrigin = url.origin === location.origin;
  const cdn = /fonts\.(googleapis|gstatic)\.com$|cdn\.jsdelivr\.net$|cdnjs\.cloudflare\.com$/.test(url.hostname);
  if (!sameOrigin && !cdn) return;
  // app files: network first (so updates show at once), cache when offline
  e.respondWith(fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))));
});
