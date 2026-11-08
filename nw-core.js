/* Nano Wealth core: namespace, icons, formatting, dom helpers, modal, toast */
(function(){
const NS = window.NS = window.NS || {};
NS.cfg = window.NS_CONFIG || {};
NS.cfg.BASE = NS.cfg.BASE || '/nanowealth/';
NS.cfg.GOOGLE_CLIENT_ID = String(NS.cfg.GOOGLE_CLIENT_ID||'').trim().replace(/^["']|["']$/g,'');
NS.cfg.REGISTRY_URL = String(NS.cfg.REGISTRY_URL||'').trim();
NS.demo = !NS.cfg.GOOGLE_CLIENT_ID || /[?&]demo=1/.test(location.search);

/* ---------- icons (24px stroke set) ---------- */
const P = {
  dashboard:'<rect x="3" y="3" width="7.5" height="9" rx="2"/><rect x="13.5" y="3" width="7.5" height="5.5" rx="2"/><rect x="13.5" y="12" width="7.5" height="9" rx="2"/><rect x="3" y="15.5" width="7.5" height="5.5" rx="2"/>',
  income:'<circle cx="12" cy="12" r="9"/><path d="M12 7.5v9M8.5 13l3.5 3.5 3.5-3.5"/>',
  expense:'<circle cx="12" cy="12" r="9"/><path d="M12 16.5v-9M8.5 11l3.5-3.5 3.5 3.5"/>',
  invest:'<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  loan:'<path d="M3 10l9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/>',
  debt:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3.2 3.2 0 010 5.6M18.5 14.4c1.6.8 2.5 2.7 2.5 5.6"/>',
  calc:'<rect x="5" y="3" width="14" height="18" rx="3"/><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  plus:'<path d="M12 5v14M5 12h14"/>', search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  edit:'<path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3"/>',
  download:'<path d="M12 4v11M7.5 11L12 15.5 16.5 11M4 20h16"/>', upload:'<path d="M12 16V5M7.5 9L12 4.5 16.5 9M4 20h16"/>',
  sheet:'<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M4 9h16M4 15h16M10 9v12"/>',
  shield:'<path d="M12 3l8 3v6c0 4.7-3.2 8.3-8 9.5C7.2 20.3 4 16.7 4 12V6l8-3z"/><path d="M8.7 12l2.3 2.3 4.3-4.6"/>',
  lock:'<rect x="5" y="10.5" width="14" height="10" rx="3"/><path d="M8 10.5V8a4 4 0 118 0v2.5M12 14.5v2.5"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  moon:'<path d="M20 14.5A8.5 8.5 0 119.5 4 6.8 6.8 0 0020 14.5z"/>',
  logout:'<path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3M16 8l4 4-4 4M20 12H9"/>',
  menu:'<path d="M4 7h16M4 12h16M4 17h16"/>', cal:'<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  bell:'<path d="M6 16V11a6 6 0 1112 0v5l1.5 2h-15L6 16zM10 20.5a2 2 0 004 0"/>',
  wallet:'<path d="M4 7.5A2.5 2.5 0 016.5 5H18v3"/><path d="M4 7.5V17a2 2 0 002 2h12.5a1.5 1.5 0 001.5-1.5v-8A1.5 1.5 0 0018.5 8H6.5A2.5 2.5 0 014 5.5"/><circle cx="16.5" cy="13.5" r="1.1"/>',
  spark:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/>',
  chevR:'<path d="M9 6l6 6-6 6"/>', chevD:'<path d="M6 9l6 6 6-6"/>', ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4"/>',
  eyeoff:'<path d="M3 3l18 18M10.6 6.2A9.8 9.8 0 0112 6c5 0 8.5 4.2 9.5 6-.4.8-1.3 2.1-2.7 3.3M6.6 7.6C4.5 9 3.2 11 2.5 12c1 1.8 4.5 6 9.5 6 1.5 0 2.8-.4 4-.9"/><path d="M9.9 10a3 3 0 004.1 4.1"/>',
  refresh:'<path d="M20 11a8 8 0 00-14-4L4 9M4 4v5h5M4 13a8 8 0 0014 4l2-2M20 20v-5h-5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>', users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.2a3.2 3.2 0 010 5.6M18.5 14.4c1.6.8 2.5 2.7 2.5 5.6"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  pause:'<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>', play:'<circle cx="12" cy="12" r="9"/><path d="M10.5 8.8l4.5 3.2-4.5 3.2z"/>',
  alert:'<path d="M12 3.5l9.5 16.5h-19L12 3.5zM12 10v4.5M12 17.2v.01"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.01"/>',
  pie:'<path d="M12 3v9h9"/><path d="M20.5 15A9 9 0 119 3.5"/>', arrowU:'<path d="M7 17L17 7M9 7h8v8"/>', arrowD:'<path d="M7 7l10 10M17 9v8H9"/>',
  coin:'<circle cx="12" cy="12" r="9"/><path d="M14.8 9.3c-.5-.9-1.5-1.4-2.8-1.4-1.6 0-2.7.8-2.7 2 0 3 5.6 1.2 5.6 4.2 0 1.2-1.2 2-2.9 2-1.3 0-2.4-.6-2.9-1.5M12 6.5v1.4M12 16.1v1.4"/>',
  home:'<path d="M4 11l8-7 8 7v8a2 2 0 01-2 2h-3.5v-6h-5v6H6a2 2 0 01-2-2v-8z"/>', copy:'<rect x="8" y="8" width="12" height="12" rx="3"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
  filter:'<path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5z"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>', zap:'<path d="M13 2.5L4.5 13.5H12l-1 8 8.5-11H12l1-8z"/>'
};
NS.icon = (n,cls='') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]||''}</svg>`;
NS.googleG = '<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.5-4.1 7-10.2 7-17.6z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

/* ---------- helpers ---------- */
NS.$ = (s,r=document)=>r.querySelector(s); NS.$$ = (s,r=document)=>[...r.querySelectorAll(s)];
NS.esc = s => String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
NS.uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,7);
NS.todayISO = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
NS.iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
NS.parseISO = s => { if(!s) return null; const [y,m,d]=String(s).slice(0,10).split('-').map(Number); return new Date(y,(m||1)-1,d||1); };
NS.addMonths = (d,n) => { const x=new Date(d.getFullYear(),d.getMonth()+n,1); const last=new Date(x.getFullYear(),x.getMonth()+1,0).getDate(); x.setDate(Math.min(d.getDate(),last)); return x; };
NS.fmtDate = (s,opt={day:'numeric',month:'short',year:'numeric'}) => { const d=s instanceof Date?s:NS.parseISO(s); return d?d.toLocaleDateString('en-GB',opt):'—'; };
NS.ago = ts => { if(!ts) return 'Never'; const s=(Date.now()-new Date(ts).getTime())/1000; if(s<60) return 'Just now'; if(s<3600) return Math.floor(s/60)+' min ago'; if(s<86400) return Math.floor(s/3600)+' h ago'; if(s<86400*30) return Math.floor(s/86400)+' d ago'; return NS.fmtDate(new Date(ts)); };

NS.currency = localStorage.getItem('ns_currency') || 'INR';
NS.money = (n,opt={}) => {
  const v = Number(n)||0; const cur = NS.currency;
  const loc = cur==='INR' ? 'en-IN' : undefined;
  try{ return new Intl.NumberFormat(loc,{style:'currency',currency:cur,maximumFractionDigits:opt.dec??0,minimumFractionDigits:opt.dec??0}).format(v); }catch(e){ return v.toFixed(0); }
};
NS.compact = n => {
  const v=Math.abs(Number(n)||0), s=n<0?'-':''; const sym=NS.money(0).replace(/[\d.,\s]/g,'');
  if(NS.currency==='INR'){ if(v>=1e7) return s+sym+(v/1e7).toFixed(2).replace(/\.?0+$/,'')+' Cr'; if(v>=1e5) return s+sym+(v/1e5).toFixed(2).replace(/\.?0+$/,'')+' L'; if(v>=1e3) return s+sym+(v/1e3).toFixed(1).replace(/\.0$/,'')+'k'; return s+sym+Math.round(v); }
  if(v>=1e9) return s+sym+(v/1e9).toFixed(2).replace(/\.?0+$/,'')+'B'; if(v>=1e6) return s+sym+(v/1e6).toFixed(2).replace(/\.?0+$/,'')+'M'; if(v>=1e3) return s+sym+(v/1e3).toFixed(1).replace(/\.0$/,'')+'k'; return s+sym+Math.round(v);
};
NS.pct = (n,d=1) => (Number(n)||0).toFixed(d)+'%';
NS.sum = (a,f) => a.reduce((t,x)=>t+(Number(f?f(x):x)||0),0);
NS.group = (a,f) => a.reduce((m,x)=>{ const k=f(x); (m[k]=m[k]||[]).push(x); return m; },{});
NS.debounce = (fn,ms=200) => { let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; };
NS.initials = n => String(n||'?').split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('');

/* animated counter */
NS.countUp = (el,to,fmt=NS.money,ms=900) => {
  if(!el) return; const from=0, t0=performance.now();
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){ el.textContent=fmt(to); return; }
  const step = t => { const p=Math.min(1,(t-t0)/ms), e=1-Math.pow(1-p,4); el.textContent=fmt(from+(to-from)*e); if(p<1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
};

/* ---------- toast ---------- */
NS.toast = (msg,type='ok',ms=3200) => {
  let box = NS.$('.toasts'); if(!box){ box=document.createElement('div'); box.className='toasts'; document.body.appendChild(box); }
  const t=document.createElement('div'); t.className='toast '+type;
  t.innerHTML = NS.icon(type==='err'?'alert':type==='info'?'info':'check')+`<span>${NS.esc(msg)}</span>`;
  box.appendChild(t); setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),320); },ms);
};

/* ---------- modal ---------- */
NS.modal = ({title,body,footer,onClose,width}) => {
  const ov=document.createElement('div'); ov.className='overlay';
  ov.innerHTML=`<div class="modal" role="dialog" aria-modal="true" ${width?`style="width:min(${width}px,100%)"`:''}><div class="modal-h"><h3>${NS.esc(title)}</h3><button class="btn btn-icon" data-x aria-label="Close">${NS.icon('x')}</button></div><div class="modal-b">${body||''}</div>${footer===false?'':'<div class="modal-f"></div>'}</div>`;
  document.body.appendChild(ov);
  const close=()=>{ ov.remove(); document.removeEventListener('keydown',esc); onClose&&onClose(); };
  const esc=e=>{ if(e.key==='Escape') close(); };
  document.addEventListener('keydown',esc);
  ov.addEventListener('mousedown',e=>{ if(e.target===ov) close(); });
  NS.$('[data-x]',ov).onclick=close;
  return {el:ov,close,body:NS.$('.modal-b',ov),foot:NS.$('.modal-f',ov)};
};
NS.confirm = ({title,text,ok='Confirm',danger=false,extra}) => new Promise(res=>{
  const m=NS.modal({title,body:`<div class="full muted" style="font-size:1rem">${text}</div>${extra||''}`,onClose:()=>res(null)});
  m.foot.innerHTML=`<button class="btn btn-ghost" data-n>Cancel</button><button class="btn ${danger?'btn-danger':'btn-primary'}" data-y>${ok}</button>`;
  NS.$('[data-n]',m.el).onclick=()=>{ m.close(); };
  NS.$('[data-y]',m.el).onclick=()=>{ const extraVals={}; NS.$$('[data-extra]',m.el).forEach(i=>extraVals[i.dataset.extra]=i.type==='checkbox'?i.checked:i.value); res(extraVals); m.close(); };
});

/* ---------- theme (light / dark / auto) ---------- */
NS.themePref = () => { try{ return localStorage.getItem('ns_theme')||'auto'; }catch(e){ return 'auto'; } };
NS.applyTheme = () => {
  const p=NS.themePref(); const t=p==='auto'?(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'):p;
  document.documentElement.dataset.theme=t;
  let m=document.querySelector('meta[name=theme-color]'); if(m) m.content=t==='dark'?'#1B1218':'#F6F6E9';
  const ic=document.querySelector('link[rel=icon]'); if(ic) ic.href=t==='dark'?'assets/icons/favicon-light-64.png':'assets/icons/favicon-64.png';
  const at=document.querySelector('link[rel=apple-touch-icon]'); if(at&&t==='dark') at.href='assets/icons/icon-light-192.png'; else if(at) at.href='assets/icons/apple-touch-icon.png';
  const b=document.getElementById('themeBtn'); if(b){ b.innerHTML=NS.icon(t==='dark'?'sun':'moon'); b.title=t==='dark'?'Switch to light mode':'Switch to dark mode'; }
};
NS.setTheme = p => { try{ localStorage.setItem('ns_theme',p==='auto'?'auto':p); }catch(e){} NS.applyTheme(); };
NS.toggleTheme = () => NS.setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
NS.initTheme = NS.applyTheme; NS.applyTheme();
try{ matchMedia('(prefers-color-scheme:dark)').addEventListener('change',()=>{ if(NS.themePref()==='auto') NS.applyTheme(); }); }catch(e){}

/* download helper */
NS.download = (name,text,type='text/csv') => { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); };
NS.csv = (rows,cols) => [cols.join(','),...rows.map(r=>cols.map(c=>{ const v=String(r[c]??''); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; }).join(','))].join('\n');
})();

/* ---- install as an app (PWA) ---- */
(function(){
  const NS=window.NS; let dp=null;
  NS.isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  NS.isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); dp=e; document.dispatchEvent(new Event('ns-installable')); });
  addEventListener('appinstalled',()=>{ dp=null; try{ localStorage.setItem('ns_installed','1'); }catch(e){} NS.toast&&NS.toast('Nano Wealth installed — find it on your home screen'); });
  NS.canInstall=()=>!!dp;
  NS.install=async()=>{
    if(dp){ dp.prompt(); const r=await dp.userChoice; dp=null; return r.outcome; }
    NS.modal&&NS.modal({title:'Install Nano Wealth',body:NS.isIOS()
      ?'<ol style="padding-left:1.2rem;line-height:1.9"><li>Open this page in <b>Safari</b>.</li><li>Tap the <b>Share</b> button.</li><li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol>'
      :'<ol style="padding-left:1.2rem;line-height:1.9"><li>Open the browser menu <b>⋮</b> (Chrome) or <b>⋯</b> (Edge).</li><li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li></ol><p class="muted">If you do not see it, open the site in Chrome over https.</p>'});
  };
})();
