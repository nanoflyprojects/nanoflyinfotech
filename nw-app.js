/* Nano Wealth app controller */
(function(){
const NS=window.NS,$=NS.$,ic=NS.icon;
const NAV=[['dashboard','Dashboard','dashboard'],['income','Income','income'],['expenses','Expenses','expense'],['investments','Investments','invest'],['loans','Loans','loan'],['debts','Debts','debt'],['goals','Goals','target'],['calculators','Calculators','calc'],['settings','Settings','settings']];
let route='dashboard';

function fillIcons(){ const g=$('#gate'); g.innerHTML=g.innerHTML.replace(/NS_ICON_(\w+)/g,(_,n)=>ic(n)); }
const show=id=>['gate','setup','shell'].forEach(x=>$('#'+x).hidden=x!==id);

/* ---------- first-run / sign-in sequence ---------- */
function steps(list){ const box=$('#steps'); box.innerHTML=list.map((t,i)=>`<div class="step" id="st${i}"><span class="st">${ic('check')}</span>${t}</div>`).join(''); return i=>{ list.forEach((_,k)=>{ const e=$('#st'+k); e.className='step'+(k<i?' done':k===i?' on':''); }); }; }
async function start(){
  show('setup'); $('#setupTitle').textContent='Setting things up…';
  const set=steps(['Connecting to your Google account','Opening your private Google Sheet','Locking access to only you','Loading your dashboard']);
  try{
    set(0); const reg=await NS.registry.touch({});
    if(reg.status==='suspended'){ show('gate'); $('#gateTitle').textContent='Account paused'; $('#gateSub').textContent='Your Nano Wealth account has been paused by the administrator. Your Google Sheet and data are untouched.'; $('#gSignIn').hidden=true; return; }
    set(1); const r=await NS.store.init();
    if(r.created) $('#setupTitle').textContent='Creating your private sheet…';
    set(2); await NS.store.load();
    let locked=false, lockMsg=null;
    if(r.created||NS.store.setting('autoLock','1')!=='0'){ try{ const l=await NS.store.lockdown(); locked=!l.permissions.some(p=>p.role!=='owner'); lockMsg=l.removed?`Removed ${l.removed} other ${l.removed>1?'accounts':'account'} from your sheet`:null; }catch(e){ console.warn('lockdown',e); } }
    else locked=false;
    set(3); NS.registry.touch({update:true,sheetLinked:true,sheetLocked:locked}).catch(()=>{});
    await new Promise(x=>setTimeout(x,r.created?700:250));
    enter(r.created?'Welcome to Nano Wealth! Your private sheet is ready.':lockMsg);
  }catch(e){
    console.error(e); show('gate'); $('#gateTitle').textContent='Something went wrong'; $('#gateSub').textContent=e.message||'Please try again.'; $('#gSignIn').hidden=false; setBtn(false);
  }
}
function enter(msg){
  const u=NS.auth.user; show('shell');
  $('#avatar').innerHTML=u.picture?`<img src="${NS.esc(u.picture)}" referrerpolicy="no-referrer" alt="">`:NS.initials(u.name);
  $('#meName').textContent=u.name; $('#meEmail').textContent=u.email;
  $('#lockLine').innerHTML=ic('lock')+'<span>Private: only you can open your data</span>';
  $('#logoutBtn').innerHTML=ic('logout'); $('#menuBtn').innerHTML=ic('menu'); $('#quickAdd').innerHTML=ic('plus')+' Add'; $('#demoBanner').hidden=!NS.demo;
  NS.applyTheme();
  $('#nav').innerHTML='<div class="sec">Money</div>'+NAV.slice(0,7).map(n=>`<a href="#/${n[0]}" data-r="${n[0]}">${ic(n[2])}${n[1]}</a>`).join('')+'<div class="sec">Tools</div>'+NAV.slice(7).map(n=>`<a href="#/${n[0]}" data-r="${n[0]}">${ic(n[2])}${n[1]}</a>`).join('');
  $('#tabbar').innerHTML=[NAV[0],NAV[2],NAV[3],NAV[6],NAV[8]].map(n=>`<a href="#/${n[0]}" data-r="${n[0]}">${ic(n[2])}${n[1]}</a>`).join('');
  render(); if(msg) setTimeout(()=>NS.toast(msg),500); setTimeout(()=>NS.notify.check(),1500);
}

/* ---------- routing ---------- */
function render(){
  const h=(location.hash.replace(/^#\//,'')||'dashboard').split('?')[0]; route=NS.views[h]?h:'dashboard';
  NS.$$('[data-r]').forEach(a=>a.classList.toggle('on',a.dataset.r===route));
  const m=NS.viewMeta[route]; $('#pageTitle').firstChild.textContent=m[0]; $('#pageSub').textContent=m[1]; document.title=m[0]+' · Nano Wealth';
  setMenu(false); const v=$('#view'); v.style.animation='none'; v.offsetHeight; v.style.animation='';
  try{ NS.views[route](v); }catch(e){ console.error(e); v.innerHTML='<div class="card empty"><h4>Couldn’t draw this page</h4><p>'+NS.esc(e.message)+'</p></div>'; }
  scrollTo({top:0}); updateBell();
}
NS.refresh=render;

/* ---------- mobile menu: always closable ---------- */
function setMenu(open){ const s=$('#side'); if(!s) return; s.classList.toggle('open',open); $('#scrim').classList.toggle('on',open); document.body.classList.toggle('noscroll',open); $('#menuBtn').setAttribute('aria-expanded',open); }

/* ---------- reminders bell ---------- */
function updateBell(){ const n=NS.dueNow().length+NS.insightsUnread().length; const b=$('#bellBtn'); if(!b) return; b.innerHTML=ic('bell')+(n?`<span class="bell-dot">${n}</span>`:''); }
function remindersModal(){
  const L=NS.reminders().filter(r=>r.days<=45), due=NS.dueNow().map(r=>r.key);
  const kindIc={sip:'invest',loan:'loan',debt:'clock',recv:'arrowD',bill:'clock'};
  const P=NS.insights(), seen=NS.insightsSeen(), pic={report:'pie',alert:'alert',goal:'target',perf:'invest'};
  const perf=P.length?`<div class="full"><div class="sub" style="font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:.72rem;margin:.2rem 0 .4rem">Your performance</div><div class="list">${P.map(i=>`<div class="li"><span class="ic ${i.kind==='alert'?'out':i.good?'in':'due'}">${ic(pic[i.kind]||'spark')}</span><div style="min-width:0"><div class="t">${NS.esc(i.title)}${seen[i.key]?'':' <span class="badge orange" style="margin-left:.3rem">new</span>'}</div><div class="s">${NS.esc(i.body)}</div></div></div>`).join('')}</div></div><div class="sub" style="font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:.72rem;margin:1rem 0 .4rem">Reminders</div>`:'';
  NS.insightsMarkRead(); setTimeout(updateBell,0);
  const m=NS.modal({title:'Notifications',footer:false,width:640,body:perf+`<div class="full list">${L.length?L.map(x=>`<div class="li"><span class="ic ${x.kind==='recv'?'in':x.days<0?'out':due.includes(x.key)?'due':'neu'}">${ic(kindIc[x.kind])}</span><div style="min-width:0"><div class="t">${NS.esc(x.title)}</div><div class="s">${x.sub} · ${x.days<0?'<b class="neg">overdue '+(-x.days)+'d</b>':x.days===0?'<b>today</b>':'in '+x.days+' day'+(x.days>1?'s':'')} · ${NS.fmtDate(x.date,{day:'numeric',month:'short'})}</div></div><div class="a">${NS.money(x.amount)}</div><button class="btn btn-icon" data-cal="${x.key}" title="Add to calendar with alert" style="margin-left:.5rem">${ic('cal')}</button></div>`).join(''):'<div class="empty">'+ic('bell')+'<h4>All clear</h4><p>No SIPs, EMIs or dues in the next 45 days.</p></div>'}</div>
    <div class="full alert warn" style="margin-top:.4rem">${ic('info')}<div>${NS.notify.enabled()?'Browser notifications are <b>on</b>. For alerts even when the app is closed, tap the calendar button on any item.':'Turn on <b>browser notifications</b> in Settings, or tap the calendar button to get alerts on your phone even when Nano Wealth is closed.'}</div></div>`});
  NS.$$('[data-cal]',m.el).forEach(b=>b.onclick=()=>{ const x=L.find(r=>r.key===b.dataset.cal); m.close(); if(x) NS.calendarModal(x); });
}
window.addEventListener('hashchange',()=>{ if(!$('#shell').hidden) render(); });

/* ---------- quick add ---------- */
function quickAdd(){
  const items=[['income','Income','income'],['expenses','Expense','expense'],['investments','Investment','invest'],['loans','Loan','loan'],['debts','Debt','debt'],['goals','Savings goal','target']];
  const m=NS.modal({title:'What would you like to add?',footer:false,body:items.map(i=>`<button class="card kpi" data-q="${i[0]}" style="text-align:left;box-shadow:none;border:1.5px solid var(--line)"><div class="lb"><span class="ic">${ic(i[2])}</span>${i[1]}</div></button>`).join('')});
  NS.$$('[data-q]',m.el).forEach(b=>b.onclick=()=>{ m.close(); NS.openForm(b.dataset.q); });
}

/* ---------- command palette (Ctrl/⌘+K) ---------- */
function palette(){
  if($('.pal')) return;
  const acts=[...NAV.map(n=>({g:'Go to',t:n[1],i:n[2],f:()=>location.hash='#/'+n[0]})),
    ...[['income','Add income','income'],['expenses','Add expense','expense'],['investments','Add investment','invest'],['loans','Add loan','loan'],['debts','Add debt','debt'],['goals','New savings goal','target']].map(a=>({g:'Create',t:a[1],i:a[2],f:()=>NS.openForm(a[0])})),
    {g:'Actions',t:'Toggle dark / light theme',i:'moon',f:()=>NS.toggleTheme()},
    {g:'Actions',t:'Export backup (JSON)',i:'download',f:()=>{ NS.download('nanospend-backup.json',NS.store.exportAll(),'application/json'); NS.toast('Backup downloaded'); }},
    ...(NS.data.sheetUrl?[{g:'Actions',t:'Open my Google Sheet',i:'sheet',f:()=>window.open(NS.data.sheetUrl,'_blank','noopener')}]:[]),
    {g:'Actions',t:'Sign out',i:'logout',f:async()=>{ await NS.auth.signOut(); location.href=NS.cfg.BASE; }}];
  const ov=document.createElement('div'); ov.className='overlay pal'; ov.innerHTML=`<div class="modal"><div class="pal-in">${ic('search')}<input id="pq" placeholder="Search pages and actions…" autocomplete="off"><span class="kbd">Esc</span></div><div class="pal-list" id="pl"></div></div>`;
  document.body.appendChild(ov); let sel=0,list=acts;
  const close=()=>ov.remove(); const draw=()=>{ let last=''; $('#pl',ov).innerHTML=list.length?list.map((a,i)=>{ const h=a.g!==last?`<div class="pal-h">${last=a.g}</div>`:''; return h+`<div class="pal-it ${i===sel?'on':''}" data-i="${i}">${ic(a.i)}${NS.esc(a.t)}</div>`; }).join(''):'<div class="empty"><p>No matches</p></div>';
    NS.$$('.pal-it',ov).forEach(e=>{ e.onclick=()=>{ close(); list[e.dataset.i].f(); }; e.onmousemove=()=>{ sel=+e.dataset.i; NS.$$('.pal-it',ov).forEach(x=>x.classList.toggle('on',x===e)); }; }); const on=$('.pal-it.on',ov); on&&on.scrollIntoView({block:'nearest'}); };
  const q=$('#pq',ov); q.focus(); draw(); ov.onmousedown=e=>{ if(e.target===ov) close(); };
  q.oninput=()=>{ const s=q.value.toLowerCase(); list=acts.filter(a=>(a.t+' '+a.g).toLowerCase().includes(s)); sel=0; draw(); };
  q.onkeydown=e=>{ if(e.key==='Escape') close(); else if(e.key==='ArrowDown'){ e.preventDefault(); sel=Math.min(list.length-1,sel+1); draw(); } else if(e.key==='ArrowUp'){ e.preventDefault(); sel=Math.max(0,sel-1); draw(); } else if(e.key==='Enter'&&list[sel]){ close(); list[sel].f(); } };
}

/* ---------- sign-in gate ---------- */
function setBtn(busy,label){ const b=$('#gSignIn'); b.disabled=busy; b.innerHTML=busy?ic('refresh','spin')+' Connecting…':NS.googleG+(label||(NS.demo?'Continue to demo':'Continue with Google')); }
const T0=Date.now();
NS.hideSplash=()=>{ const e=$('#splash'); if(!e) return; setTimeout(()=>{ e.classList.add('out'); setTimeout(()=>e.remove(),700); },Math.max(0,1900-(Date.now()-T0))); };
async function boot(){
  try{ await boot2(); } finally { NS.hideSplash(); }
}
async function boot2(){
  fillIcons(); NS.applyTheme();
  $('#demoNote').hidden=!NS.demo;
  const saved=NS.auth.saved();
  setBtn(false,saved?'Continue as '+saved.name.split(' ')[0]:null);
  $('#gSignIn').onclick=async()=>{ setBtn(true); try{ await NS.auth.signIn(); await start(); }catch(e){ setBtn(false); NS.toast(e.message,'err',5000); } };
  $('#logoutBtn').onclick=async()=>{ await NS.auth.signOut(); location.href=NS.cfg.BASE; };
  $('#menuBtn').onclick=()=>setMenu(!$('#side').classList.contains('open'));
  $('#themeBtn').onclick=()=>NS.toggleTheme();
  NS.auth.mountHelp($('.gate-box'),$('#gSignIn'));
  $('#searchBtn').innerHTML=ic('search'); $('#searchBtn').onclick=palette; $('#bellBtn').onclick=remindersModal;
  $('#sideClose').innerHTML=ic('x'); $('#sideClose').onclick=()=>setMenu(false); $('#scrim').onclick=()=>setMenu(false);
  let tx=null; $('#side').addEventListener('touchstart',e=>tx=e.touches[0].clientX,{passive:true}); $('#side').addEventListener('touchend',e=>{ if(tx!==null&&tx-e.changedTouches[0].clientX>60) setMenu(false); tx=null; });
  addEventListener('resize',()=>{ if(innerWidth>860) setMenu(false); });
  $('#quickAdd').onclick=()=>{ const t=NS.MOD[route]; t?NS.openForm(route):quickAdd(); };
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&$('#side')&&$('#side').classList.contains('open')) return setMenu(false); if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!$('#shell').hidden){ e.preventDefault(); return palette(); } if(/input|select|textarea/i.test(e.target.tagName)||e.metaKey||e.ctrlKey||$('.overlay')) return; if(e.key==='/'){ const q=$('#q'); if(q){ e.preventDefault(); q.focus(); } } if(e.key==='n'&&!$('#shell').hidden){ const t=NS.MOD[route]; t?NS.openForm(route):quickAdd(); } });
  show('gate');
  // keep the person signed in: reuse a valid token, otherwise one tap (or the first click in the app) refreshes quietly
  document.addEventListener('pointerdown',()=>{ if(!$('#shell').hidden&&NS.auth.needsRefresh()) NS.auth.token().catch(()=>{}); },true);
  if(saved && !NS.demo && NS.auth.restore()){ setBtn(true); try{ await NS.auth.loadGIS().catch(()=>{}); NS.auth.user=saved; await start(); }catch(e){ setBtn(false,'Continue as '+saved.name.split(' ')[0]); } }
  else if(saved && (NS.demo || new URLSearchParams(location.search).get('go')==='1')){ setBtn(true); try{ await NS.auth.resume(); await start(); }catch(e){ setBtn(false,'Continue as '+saved.name.split(' ')[0]); } }
  else if(saved && !NS.demo){ try{ await NS.auth.loadGIS(); } catch(e){} }
}
boot();
})();
