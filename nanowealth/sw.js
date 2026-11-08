/* Scope: /nanowealth/ only — the main NanoFLY site is never cached or intercepted by this worker.
   Offline shell cache. API calls to Google are never cached. */
const V='nanowealth-v11', SHELL=['./','index.html','app.html','css/brand.css','css/app.css','css/site.css','/nw-config.js','/nw-core.js','/nw-auth.js','/nw-registry.js','/nw-store.js','/nw-charts.js','/nw-calc.js','/nw-plan.js','/nw-views.js','/nw-app.js','assets/brand/logo-light.png','assets/brand/logo.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{ const u=new URL(e.request.url); if(e.request.method!=='GET'||u.origin!==location.origin) return;
  e.respondWith(fetch(e.request).then(r=>{ const c=r.clone(); caches.open(V).then(x=>x.put(e.request,c)); return r; }).catch(()=>caches.match(e.request))); });

self.addEventListener('notificationclick',e=>{ e.notification.close(); e.waitUntil(clients.matchAll({type:'window'}).then(l=>{ for(const c of l){ if('focus' in c) return c.focus(); } return clients.openWindow('./app.html'); })); });
