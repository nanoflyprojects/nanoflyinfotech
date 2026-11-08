/* Nano Wealth admin portal — metadata only. There is no code path here that can read user data. */
(function(){
const NS=window.NS,$=NS.$,ic=NS.icon,esc=NS.esc;
let accts=[], route='overview', q='', fs='all', sortK='createdAt', dir=-1;
const TABS=[['overview','Overview','dashboard'],['accounts','Accounts','users'],['privacy','Privacy & security','shield']];
const show=id=>['gate','shell'].forEach(x=>$('#'+x).hidden=x!==id);
const av=a=>`<div class="av">${a.picture?`<img src="${esc(a.picture)}" referrerpolicy="no-referrer" alt="">`:NS.initials(a.name)}</div>`;
const DAY=864e5, since=(a,d)=>a&&Date.now()-new Date(a).getTime()<d*DAY;

async function load(){ const r=await NS.registry.list(); accts=r.accounts||[]; }
async function gate(){
  NS.auth.mountHelp($('.gate-box'),$('#gBtn'));
  $('#demoNote').hidden=!NS.demo; $('#gBtn').innerHTML=NS.googleG+(NS.demo?'Open demo admin':'Sign in with Google');
  $('#gBtn').onclick=async()=>{ const b=$('#gBtn'); b.disabled=true; try{ await NS.auth.signIn({scope:'openid email profile'}); await enter(); }catch(e){ b.disabled=false; $('#gT').textContent=e.code==='FORBIDDEN'?'Access denied':'Sign-in problem'; $('#gS').textContent=e.code==='FORBIDDEN'?`${(NS.auth.user||{}).email||'This account'} isn’t on the administrator list.`:e.message; if(e.code==='FORBIDDEN') NS.auth.signOut(); } };
}
async function enter(){
  if(!NS.cfg.REGISTRY_URL&&!NS.demo) throw new Error('REGISTRY_URL is not set in js/config.js yet — see SETUP.md step 3.');
  await load(); const u=NS.auth.user; show('shell');
  $('#avatar').innerHTML=u.picture?`<img src="${esc(u.picture)}" referrerpolicy="no-referrer">`:NS.initials(u.name); $('#meName').textContent=u.name; $('#meEmail').textContent=u.email;
  $('#lockLine').innerHTML=ic('eyeoff')+'<span>Metadata only — user data is invisible here</span>'; $('#out').innerHTML=ic('logout'); $('#rf').innerHTML=ic('refresh')+' Refresh'; $('#demoBanner').hidden=!NS.demo;
  NS.applyTheme(); $('#themeBtn').onclick=()=>NS.toggleTheme();
  $('#nav').innerHTML=TABS.map(t=>`<a href="#/${t[0]}" data-r="${t[0]}">${ic(t[2])}${t[1]}</a>`).join(''); $('#tabbar').innerHTML=$('#nav').innerHTML;
  $('#out').onclick=async()=>{ await NS.auth.signOut(); location.reload(); };
  $('#rf').onclick=async()=>{ try{ await load(); render(); NS.toast('Refreshed'); }catch(e){ NS.toast(e.message,'err'); } };
  render();
}
function render(){
  route=(location.hash.replace(/^#\//,'')||'overview'); if(!TABS.find(t=>t[0]===route)) route='overview';
  NS.$$('[data-r]').forEach(a=>a.classList.toggle('on',a.dataset.r===route));
  const t=TABS.find(x=>x[0]===route); $('#pt').firstChild.textContent=t[1]; $('#ps').textContent={overview:'Membership at a glance',accounts:'Everyone who has created an account',privacy:'What this portal can and can’t see'}[route];
  ({overview,accounts:accountsV,privacy})[route]($('#view'));
}
window.addEventListener('hashchange',()=>{ if(!$('#shell').hidden) render(); });

function overview(el){
  const act=accts.filter(a=>a.status!=='suspended'), n7=accts.filter(a=>since(a.createdAt,7)).length, a7=accts.filter(a=>since(a.lastLoginAt,7)).length;
  const linked=accts.filter(a=>a.sheetLinked).length, locked=accts.filter(a=>a.sheetLinked&&a.sheetLocked).length;
  const days=[...Array(30)].map((_,i)=>{ const d=new Date(); d.setDate(d.getDate()-29+i); return d; });
  const per=days.map(d=>accts.filter(a=>NS.iso(new Date(a.createdAt))===NS.iso(d)).length); let c=0; const cum=per.map(v=>c+=v), base=accts.length-c;
  const K=[['users','Total accounts',accts.length,`${act.length} active`],['spark','New this week',n7,'joined in last 7 days'],['zap','Active this week',a7,`${accts.length?Math.round(a7/accts.length*100):0}% of members`],['pause','Paused',accts.length-act.length,'blocked from signing in'],['lock','Sheets locked',linked?Math.round(locked/linked*100):100,'% owner-only access']];
  el.innerHTML=`<div class="grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:1.2rem" id="kp">${K.map(k=>`<div class="card kpi ${k[0]==='users'?'hero':''}"><div class="lb"><span class="ic">${ic(k[0])}</span>${k[1]}</div><div class="v" data-n="${k[2]}">0</div><div class="d muted" style="${k[0]==='users'?'color:rgba(246,246,233,.6)':''}">${k[3]}</div></div>`).join('')}</div>
  <div class="grid g2" style="margin-bottom:1.2rem"><div class="card"><div class="card-h"><div><h3>Total accounts</h3><div class="sub">Last 30 days</div></div></div><div id="gr"></div></div>
  <div class="card"><div class="card-h"><h3>Newest members</h3><a class="btn btn-soft btn-sm" href="#/accounts">All</a></div><div class="list">${accts.slice(0,6).map(a=>`<div class="li">${av(a)}<div style="min-width:0"><div class="t">${esc(a.name)}</div><div class="s">${esc(a.email)}</div></div><div class="a muted" style="font-size:.78rem;font-weight:600">${NS.ago(a.createdAt)}</div></div>`).join('')||'<div class="empty"><p>No accounts yet.</p></div>'}</div></div></div>
  <div class="card" style="background:var(--plum);color:var(--cream)"><div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">${ic('shield').replace('class="i','class="i" style="width:2.2rem;height:2.2rem;color:var(--orange-warm)" data-x="')}<div style="flex:1;min-width:240px"><h3 style="font-size:1.2rem">You see who joined — never what they spend.</h3><p style="color:rgba(246,246,233,.7);margin-top:.3rem;font-size:.9rem">Every member’s data lives in their own Google Sheet, created by them and locked to them.</p></div><a class="btn btn-primary btn-sm" href="#/privacy">How it works</a></div></div>`;
  NS.$$('[data-n]',el).forEach((e,i)=>NS.countUp(e,Number(e.dataset.n),v=>Math.round(v)+(i===4?'%':''),700));
  NS.chartLine($('#gr',el),days.map(d=>d.getDate()+'/'+(d.getMonth()+1)),[{name:'Accounts',color:'var(--orange)',values:cum.map(v=>v+base)}],{h:240,fmt:v=>Math.round(v)}); 
  // money() in tooltip is currency-formatted; override with plain numbers
  NS.$$('#gr [data-tip]',el).forEach(r=>r.dataset.tip=r.dataset.tip.replace(/Accounts: [^<]*/,m=>'Accounts: '+m.replace(/[^\d]/g,'')));
}
function accountsV(el){
  el.innerHTML=`<div class="tools"><div class="search">${ic('search')}<input class="inp" id="aq" placeholder="Search name or email…" value="${esc(q)}"></div>
  <div class="seg-ctl" id="fl">${[['all','All'],['active','Active'],['suspended','Paused'],['unlocked','Needs check']].map(([k,l])=>`<button data-f="${k}" class="${fs===k?'on':''}">${l}</button>`).join('')}</div>
  <button class="btn btn-ghost" id="ex">${ic('download')} CSV</button></div><div class="card" style="padding:.6rem 1rem 1rem"><div class="tbl-wrap" id="tw"></div></div>`;
  const draw=()=>{ let r=accts.filter(a=>(fs==='all'||(fs==='unlocked'?(a.sheetLinked&&!a.sheetLocked):(a.status||'active')===fs))&&(!q||(a.name+a.email).toLowerCase().includes(q.toLowerCase())));
    r=[...r].sort((a,b)=>String(a[sortK]).localeCompare(String(b[sortK]),undefined,{numeric:true})*dir);
    const th=(k,l,c='')=>`<th class="${c}" data-s="${k}">${l}${sortK===k?(dir>0?' ▲':' ▼'):''}</th>`;
    $('#tw',el).innerHTML=r.length?`<table class="tbl"><thead><tr>${th('name','Member')}${th('createdAt','Joined')}${th('lastLoginAt','Last active')}${th('logins','Logins','r')}<th>Sheet</th>${th('status','Status')}<th></th></tr></thead><tbody>${r.map(a=>`<tr data-id="${esc(a.sub)}"><td data-l="Member"><div class="acct">${av(a)}<div><div class="name">${esc(a.name)}</div><div class="small">${esc(a.email)}</div></div></div></td><td data-l="Joined">${NS.fmtDate(new Date(a.createdAt))}</td><td data-l="Last active">${NS.ago(a.lastLoginAt)}</td><td class="r num" data-l="Logins">${a.logins}</td>
      <td data-l="Sheet">${!a.sheetLinked?'<span class="badge">Not created</span>':a.sheetLocked?`<span class="badge good">${ic('lock')} Owner-only</span>`:'<span class="badge warn">Check pending</span>'}</td>
      <td data-l="Status">${a.status==='suspended'?'<span class="badge bad">Paused</span>':'<span class="badge good">Active</span>'}</td>
      <td class="acts-td"><div class="acts"><button class="btn btn-icon" data-v title="Details">${ic('chevR')}</button><button class="btn btn-icon" data-p title="${a.status==='suspended'?'Resume':'Pause'}">${ic(a.status==='suspended'?'play':'pause')}</button><button class="btn btn-icon" data-d title="Remove">${ic('trash')}</button></div></td></tr>`).join('')}</tbody></table>`:`<div class="empty">${ic('users')}<h4>No accounts match</h4></div>`;
    NS.$$('th[data-s]',el).forEach(h=>h.onclick=()=>{ if(sortK===h.dataset.s) dir*=-1; else{ sortK=h.dataset.s; dir=-1; } draw(); });
    NS.$$('tr[data-id]',el).forEach(tr=>{ const a=accts.find(x=>x.sub===tr.dataset.id);
      $('[data-v]',tr).onclick=()=>detail(a); tr.ondblclick=()=>detail(a);
      $('[data-p]',tr).onclick=()=>toggle(a); $('[data-d]',tr).onclick=()=>removeA(a); }); };
  $('#aq',el).oninput=NS.debounce(e=>{ q=e.target.value; draw(); },120);
  NS.$$('#fl button',el).forEach(b=>b.onclick=()=>{ fs=b.dataset.f; NS.$$('#fl button',el).forEach(x=>x.classList.toggle('on',x===b)); draw(); });
  $('#ex',el).onclick=()=>{ NS.download('nanospend-accounts.csv',NS.csv(accts,['name','email','createdAt','lastLoginAt','logins','status','sheetLinked','sheetLocked'])); NS.toast('CSV downloaded'); };
  draw();
}
async function toggle(a){ const to=a.status==='suspended'?'active':'suspended'; if(to==='suspended'&&!await NS.confirm({title:'Pause this account?',text:`<b>${esc(a.name)}</b> won’t be able to open Nano Wealth until resumed. Their Google Sheet is untouched.`,ok:'Pause'})) return;
  try{ await NS.registry.setStatus(a.sub,to); a.status=to; NS.toast(to==='active'?'Account resumed':'Account paused'); render(); }catch(e){ NS.toast(e.message,'err'); } }
async function removeA(a){ if(!await NS.confirm({title:'Remove from member list?',text:`<b>${esc(a.name)}</b> will be removed from this list. Their Google Sheet isn’t affected. They can create a new account by signing in again.`,ok:'Remove',danger:true})) return;
  try{ await NS.registry.remove(a.sub); accts=accts.filter(x=>x!==a); NS.toast('Removed'); render(); }catch(e){ NS.toast(e.message,'err'); } }
function detail(a){
  const m=NS.modal({title:'Account details',footer:true,body:`<div class="full acct">${av(a).replace('class="av"','class="av" style="width:56px;height:56px"')}<div><div style="font:800 1.2rem var(--font-display)">${esc(a.name)}</div><div class="muted">${esc(a.email)}</div></div><span style="margin-left:auto">${a.status==='suspended'?'<span class="badge bad">Paused</span>':'<span class="badge good">Active</span>'}</span></div>
  <div class="det"><div><small>Joined</small>${NS.fmtDate(new Date(a.createdAt),{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div><div><small>Last active</small>${NS.ago(a.lastLoginAt)}</div><div><small>Sign-ins</small>${a.logins}</div><div><small>Google sheet</small>${a.sheetLinked?(a.sheetLocked?'Created · owner-only ✓':'Created · lock check pending'):'Not created yet'}</div></div>
  <div class="full perm" style="background:var(--surface-3)">${ic('eyeoff')}<span>This member’s spending data is stored in their own Google Sheet. It is not available to the admin portal.</span></div>`});
  m.foot.innerHTML=`<button class="btn btn-ghost" data-c>Close</button><button class="btn btn-soft" data-t>${a.status==='suspended'?'Resume account':'Pause account'}</button>`;
  $('[data-c]',m.el).onclick=m.close; $('[data-t]',m.el).onclick=()=>{ m.close(); toggle(a); };
}
function privacy(el){
  const ok=!!NS.cfg.GOOGLE_CLIENT_ID, reg=!!NS.cfg.REGISTRY_URL;
  el.innerHTML=`<div class="card" style="margin-bottom:1.2rem"><div class="card-h"><h3>How a member’s sheet is created and protected</h3></div><div class="flow">
  <div class="n">${ic('user')}<b>1 · Member signs in</b>Google OAuth, minimal <i>drive.file</i> scope — a non-sensitive permission.</div><span class="ar">${ic('chevR')}</span>
  <div class="n">${ic('sheet')}<b>2 · Sheet is created by them</b>Made with the member’s own token, so the member is the owner. No one else is ever added.</div><span class="ar">${ic('chevR')}</span>
  <div class="n">${ic('lock')}<b>3 · Access is swept</b>On every sign-in any other collaborator — including the app creator — is removed automatically.</div><span class="ar">${ic('chevR')}</span>
  <div class="n">${ic('users')}<b>4 · Registry gets metadata</b>Only name, email, join date, status and a “locked” flag reach this portal.</div></div></div>
  <div class="pv" style="margin-bottom:1.2rem"><div class="card yes"><div class="card-h"><h3>This portal can</h3></div><ul class="yes"><li>${ic('check')}See name, email and photo of members</li><li>${ic('check')}See join date, last activity and sign-in count</li><li>${ic('check')}Pause / resume or remove accounts</li><li>${ic('check')}See whether each sheet is verified owner-only</li></ul></div>
  <div class="card no"><div class="card-h"><h3>This portal cannot</h3></div><ul class="no"><li>${ic('x')}Read any income, expense, loan, debt or investment</li><li>${ic('x')}See sheet links or IDs</li><li>${ic('x')}Open, edit or share a member’s Google Sheet</li><li>${ic('x')}Re-add itself to a sheet — the sweep removes it</li></ul></div></div>
  <div class="card"><div class="card-h"><h3>Setup health</h3></div>${[[ok,'Google OAuth client ID configured',ok?'':'Set GOOGLE_CLIENT_ID in js/config.js'],[reg,'Registry (Apps Script) connected',reg?'':'Set REGISTRY_URL in js/config.js'],[true,'Admin allow-list enforced server-side','Edit ADMIN_EMAILS in Code.gs']].map(r=>`<div class="perm" style="background:${r[0]?'var(--good-bg)':'var(--warn-bg)'};color:${r[0]?'var(--good)':'var(--warn)'}">${ic(r[0]?'check':'alert')}<span style="flex:1">${r[1]}</span><span style="font-weight:500;opacity:.85">${r[2]}</span></div>`).join('')}</div>`;
}
NS.applyTheme();
(async()=>{ await gate(); show('gate'); const s=NS.auth.saved(); if(s&&NS.demo){ try{ await NS.auth.resume(); await enter(); }catch(e){} } })();
})();
