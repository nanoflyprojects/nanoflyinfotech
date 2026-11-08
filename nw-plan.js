/* Nano Wealth planning engine: recurring income/expenses, SIP/RD schedules, period filter,
   reminders, browser notifications and calendar export. */
(function(){
const NS=window.NS;
NS.FREQ=[{v:'No',l:'One-time'},{v:'Daily',l:'Every day'},{v:'Weekly',l:'Every week'},{v:'Monthly',l:'Every month'},{v:'Yearly',l:'Every year'}];
NS.FREQ_L=Object.fromEntries(NS.FREQ.map(f=>[f.v,f.l]));
const T0=()=>NS.parseISO(NS.todayISO());
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const clampMonth=(y,m,day)=>{ const yy=y+Math.floor(m/12), mm=((m%12)+12)%12; return new Date(yy,mm,Math.min(day,new Date(yy,mm+1,0).getDate())); };
const STEP={Daily:(s,i)=>addDays(s,i),Weekly:(s,i)=>addDays(s,7*i),Monthly:(s,i)=>clampMonth(s.getFullYear(),s.getMonth()+i,s.getDate()),Yearly:(s,i)=>clampMonth(s.getFullYear(),s.getMonth()+12*i,s.getDate())};
NS.recurs=f=>!!STEP[f];

/** every occurrence date (ISO) from start until today / end date */
NS.occDates=(startISO,freq,endISO)=>{
  const s=NS.parseISO(startISO); if(!s) return [];
  if(!STEP[freq]) return [startISO];
  const cap=T0(), e=endISO?NS.parseISO(endISO):null, stop=e&&e<cap?e:cap; const out=[];
  for(let i=0;i<4000;i++){ const d=STEP[freq](s,i); if(d>stop) break; out.push(NS.iso(d)); } return out;
};
NS.nextOcc=(startISO,freq,endISO)=>{
  const s=NS.parseISO(startISO); if(!s) return null; const t=T0(), e=endISO?NS.parseISO(endISO):null;
  if(!STEP[freq]) return s>=t?s:null;
  for(let i=0;i<4000;i++){ const d=STEP[freq](s,i); if(e&&d>e) return null; if(d>=t) return d; } return null;
};
/** income/expense rows expanded into occurrences (what actually happened so far) */
NS.expandTx=tbl=>{ const out=[]; NS.store.get(tbl).forEach(r=>{
  if(NS.recurs(r.recurring)){ const ds=NS.occDates(r.date,r.recurring,r.endDate); ds.forEach((d,i)=>out.push({...r,date:d,_rec:true,_last:i===ds.length-1})); }
  else out.push(r); }); return out; };
NS.occIn=(r,rg)=>{ if(NS.recurs(r.recurring)) return NS.occDates(r.date,r.recurring,r.endDate).filter(d=>d>=rg.from&&d<=rg.to); return (r.date>=rg.from&&r.date<=rg.to)?[r.date]:[]; };

/* ---------- SIP / RD ---------- */
const STEPM={Monthly:1,Quarterly:3,Yearly:12};
function sipSeq(v){
  const b=NS.parseISO(v.buyDate); if(!b||!(v.sipAmount>0)||!STEPM[v.plan]) return null;
  const st=STEPM[v.plan], day=Number(v.sipDay)||b.getDate(); const at=k=>clampMonth(b.getFullYear(),b.getMonth()+k*st,day);
  let k0=0; while(at(k0)<b&&k0<24) k0++; return {at,k0};
}
NS.sipDates=v=>{ const q=sipSeq(v); if(!q) return []; const cap=T0(), e=v.sipEnd?NS.parseISO(v.sipEnd):null, stop=e&&e<cap?e:cap; const out=[]; for(let k=q.k0;k<q.k0+2400;k++){ const d=q.at(k); if(d>stop) break; out.push(d); } return out; };
NS.sipNext=v=>{ const q=sipSeq(v); if(!q) return null; const t=T0(), e=v.sipEnd?NS.parseISO(v.sipEnd):null; for(let k=q.k0;k<q.k0+2400;k++){ const d=q.at(k); if(e&&d>e) return null; if(d>=t) return d; } return null; };
NS.invCalc=v=>{
  const dates=NS.sipDates(v), n=dates.length, invested=(v.invested||0)+n*(v.sipAmount||0);
  let current=v.current||0, est=false;
  if(!(current>0)){ est=true; const r=(v.rate||0)/100, now=new Date(), yrs=d=>Math.max(0,(now-d)/(365.25*864e5));
    if(STEPM[v.plan]){ current=(v.invested||0)*Math.pow(1+r,yrs(NS.parseISO(v.buyDate)||now)); dates.forEach(d=>current+=v.sipAmount*Math.pow(1+r,yrs(d))); } else current=invested; }
  return {invested,current,n,est,next:NS.sipNext(v),plan:STEPM[v.plan]?v.plan:'One-time'};
};

/* ---------- global period (monthly / yearly / all) ---------- */
const now=new Date(); let saved=null; try{ saved=JSON.parse(sessionStorage.getItem('ns_period')||'null'); }catch(e){}
NS.period=saved||{mode:'month',y:now.getFullYear(),m:now.getMonth()};
const MN=['January','February','March','April','May','June','July','August','September','October','November','December'];
NS.periodRange=(off=0)=>{ const P=NS.period; if(P.mode==='all') return {from:'1970-01-01',to:'2999-12-31',all:true};
  const a=P.mode==='month'?new Date(P.y,P.m+off,1):new Date(P.y+off,0,1), b=P.mode==='month'?new Date(P.y,P.m+off+1,0):new Date(P.y+off,11,31);
  const days=Math.round((Math.min(b,new Date())-a)/864e5)+1; return {from:NS.iso(a),to:NS.iso(b),days:Math.max(1,days),all:false}; };
NS.periodLabel=()=>{ const P=NS.period; return P.mode==='all'?'All time':P.mode==='year'?String(P.y):MN[P.m]+' '+P.y; };
NS.periodIsNow=()=>{ const P=NS.period; return P.mode==='all'||(P.y===now.getFullYear()&&(P.mode==='year'||P.m===now.getMonth())); };
NS.periodBar=(el,onChange)=>{
  const P=NS.period, ic=NS.icon, cy=new Date().getFullYear();
  let y0=cy-5; [...NS.store.get('income'),...NS.store.get('expenses')].forEach(r=>{ const y=Number(String(r.date).slice(0,4)); if(y>1990&&y<y0) y0=y; });
  const years=[]; for(let y=cy+1;y>=y0;y--) years.push(y);
  const draw=()=>{ el.innerHTML=`<div class="pbar"><div class="seg-ctl">${[['month','Monthly'],['year','Yearly'],['all','All time']].map(([k,l])=>`<button data-m="${k}" class="${P.mode===k?'on':''}">${l}</button>`).join('')}</div>
    ${P.mode==='all'?'':`<div class="pnav"><button class="btn btn-icon" data-pv aria-label="Previous">${ic('chevR','flip')}</button>${P.mode==='month'?`<select class="sel" data-pm aria-label="Month">${MN.map((m,i)=>`<option value="${i}" ${P.m===i?'selected':''}>${m}</option>`).join('')}</select>`:''}<select class="sel" data-py aria-label="Year">${years.map(y=>`<option ${P.y===y?'selected':''}>${y}</option>`).join('')}</select><button class="btn btn-icon" data-nx aria-label="Next">${ic('chevR')}</button></div>
    ${NS.periodIsNow()?'':`<button class="btn btn-soft btn-sm" data-now>${P.mode==='year'?'This year':'This month'}</button>`}`}</div>`;
    const set=()=>{ try{ sessionStorage.setItem('ns_period',JSON.stringify(P)); }catch(e){} draw(); onChange(); };
    NS.$$('[data-m]',el).forEach(b=>b.onclick=()=>{ P.mode=b.dataset.m; set(); });
    const pm=NS.$('[data-pm]',el), py=NS.$('[data-py]',el);
    if(pm) pm.onchange=()=>{ P.m=+pm.value; set(); }; if(py) py.onchange=()=>{ P.y=+py.value; set(); };
    const step=d=>{ if(P.mode==='year') P.y+=d; else{ P.m+=d; if(P.m<0){ P.m=11; P.y--; } if(P.m>11){ P.m=0; P.y++; } } set(); };
    const pv=NS.$('[data-pv]',el), nx=NS.$('[data-nx]',el); if(pv) pv.onclick=()=>step(-1); if(nx) nx.onclick=()=>step(1);
    const nw=NS.$('[data-now]',el); if(nw) nw.onclick=()=>{ P.y=now.getFullYear(); P.m=now.getMonth(); set(); };
  }; draw();
};

/* ---------- reminders ---------- */
const dayDiff=d=>Math.round((d-T0())/864e5);
NS.reminders=()=>{
  const L=[], D=NS.derived;
  NS.store.get('investments').forEach(v=>{ const n=NS.sipNext(v); if(n){ const lead=v.remind===''||v.remind==='none'||v.remind==null?null:Number(v.remind); L.push({kind:'sip',tbl:'investments',id:v.id,date:n,title:v.name,sub:(v.plan==='Monthly'?'SIP':v.type==='Recurring Deposit'?'RD':'Investment')+' installment',amount:v.sipAmount,lead}); } });
  NS.store.get('loans').forEach(l=>{ const x=D.loanInfo(l); if(x.next) L.push({kind:'loan',tbl:'loans',id:l.id,date:x.next,title:l.lender,sub:'EMI due',amount:x.emi,lead:3}); });
  NS.store.get('debts').forEach(d=>{ if(D.debtOut(d)>0&&d.dueDate) L.push({kind:d.direction==='owe'?'debt':'recv',tbl:'debts',id:d.id,date:NS.parseISO(d.dueDate),title:d.party,sub:d.direction==='owe'?'Payment due':'To collect',amount:D.debtOut(d),lead:d.direction==='owe'?2:1}); });
  NS.store.get('expenses').forEach(e=>{ if(NS.recurs(e.recurring)&&e.recurring!=='Daily'){ const n=NS.nextOcc(e.date,e.recurring,e.endDate); if(n) L.push({kind:'bill',tbl:'expenses',id:e.id,date:n,title:e.description,sub:'Bill · '+NS.FREQ_L[e.recurring].toLowerCase(),amount:e.amount,lead:1}); } });
  L.forEach(r=>{ r.days=dayDiff(r.date); r.key=r.tbl+r.id+NS.iso(r.date); }); return L.sort((a,b)=>a.date-b.date);
};
NS.dueNow=()=>NS.reminders().filter(r=>r.lead!==null&&r.days<=r.lead);

/* ---------- calendar export (.ics with alarm + Google Calendar link) ---------- */
const ymd=d=>NS.iso(d).replace(/-/g,'');
NS.calSpec=r=>{ // r: item from reminders()
  const t=NS.store.get(r.tbl).find(x=>x.id===r.id)||{}; let rrule=null;
  if(r.kind==='sip'){ const day=Number(t.sipDay)||NS.parseISO(t.buyDate).getDate(); rrule=t.plan==='Yearly'?`FREQ=YEARLY`:`FREQ=MONTHLY;INTERVAL=${t.plan==='Quarterly'?3:1};BYMONTHDAY=${Math.min(day,28)}`; if(t.sipEnd) rrule+=';UNTIL='+ymd(NS.parseISO(t.sipEnd)); }
  else if(r.kind==='loan'){ const s=NS.parseISO(t.startDate); const left=t.tenure-t.paidEmis; rrule=`FREQ=MONTHLY;BYMONTHDAY=${Math.min(s.getDate(),28)};COUNT=${Math.max(1,left)}`; }
  else if(r.kind==='bill'){ rrule={Weekly:'FREQ=WEEKLY',Monthly:'FREQ=MONTHLY',Yearly:'FREQ=YEARLY'}[t.recurring]; if(t.endDate) rrule+=';UNTIL='+ymd(NS.parseISO(t.endDate)); }
  return {title:`${r.title} — ${r.sub}`,date:r.date,rrule,lead:r.lead??1,details:`${NS.money(r.amount)} · Nano Wealth reminder`};
};
NS.calGoogle=s=>{ const d2=new Date(s.date.getFullYear(),s.date.getMonth(),s.date.getDate()+1); return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(s.title)+'&details='+encodeURIComponent(s.details)+'&dates='+ymd(s.date)+'/'+ymd(d2)+(s.rrule?'&recur='+encodeURIComponent('RRULE:'+s.rrule):''); };
NS.calICS=s=>{ const trig=s.lead===0?'PT9H':'-P'+(s.lead>1?(s.lead-1)+'D':'')+'T15H'; const d2=new Date(s.date.getFullYear(),s.date.getMonth(),s.date.getDate()+1);
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nano Wealth//EN','BEGIN:VEVENT','UID:'+NS.uid()+'@nanospend','DTSTAMP:'+new Date().toISOString().replace(/[-:]|\.\d+/g,''),'DTSTART;VALUE=DATE:'+ymd(s.date),'DTEND;VALUE=DATE:'+ymd(d2),'SUMMARY:'+s.title.replace(/[,;]/g,' '),'DESCRIPTION:'+s.details.replace(/[,;]/g,' '),s.rrule?'RRULE:'+s.rrule:'','BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+s.title.replace(/[,;]/g,' '),'TRIGGER;RELATED=START:'+trig,'END:VALARM','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n'); };
NS.calendarModal=r=>{ const s=NS.calSpec(r); const m=NS.modal({title:'Add reminder to calendar',footer:false,body:`<div class="full muted">Get a real phone notification — even when Nano Wealth is closed. <b>${NS.esc(s.title)}</b> will be added${s.rrule?' as a repeating event':''}, with an alert ${s.lead===0?'on the day':s.lead+' day'+(s.lead>1?'s':'')+' before'}.</div>
  <a class="btn btn-primary full" target="_blank" rel="noopener" href="${NS.calGoogle(s)}">${NS.icon('cal')} Add to Google Calendar</a>
  <button class="btn btn-ghost full" id="ics">${NS.icon('download')} Download .ics (Apple / Outlook / any calendar)</button>`});
  NS.$('#ics',m.el).onclick=()=>{ NS.download('nanospend-reminder.ics',NS.calICS(s),'text/calendar'); NS.toast('Calendar file downloaded'); }; };

/* ---------- performance notifications (computed on the device — your numbers never leave it) ---------- */
NS.insights=()=>{
  const out=[], M=NS.money, td=new Date(), iso=NS.iso, today=iso(td);
  const inc=NS.expandTx('income'), exp=NS.expandTx('expenses');
  const rng=(a,b)=>({from:iso(a),to:iso(b)});
  const sumIn=(rows,r)=>NS.sum(rows.filter(x=>x.date>=r.from&&x.date<=r.to),x=>x.amount);
  const top=(r)=>{ const g=NS.group(exp.filter(x=>x.date>=r.from&&x.date<=r.to),x=>x.category); const e=Object.entries(g).map(([k,v])=>[k,NS.sum(v,x=>x.amount)]).sort((a,b)=>b[1]-a[1])[0]; return e&&e[1]>0?e:null; };
  if(!inc.length&&!exp.length) return out;
  // 1) monthly report for last month (shown for the first 10 days of a new month)
  if(td.getDate()<=10){
    const a=new Date(td.getFullYear(),td.getMonth()-1,1), b=new Date(td.getFullYear(),td.getMonth(),0), a2=new Date(td.getFullYear(),td.getMonth()-2,1), b2=new Date(td.getFullYear(),td.getMonth()-1,0);
    const r=rng(a,b), r2=rng(a2,b2), i=sumIn(inc,r), e=sumIn(exp,r), e2=sumIn(exp,r2), t=top(r);
    if(i||e){ const rate=i?Math.round((i-e)/i*100):0; const mname=a.toLocaleDateString('en-GB',{month:'long'});
      out.push({key:'m'+iso(a).slice(0,7),kind:'report',title:mname+' report',body:`Income ${M(i)} · Spent ${M(e)} · Saved ${i?rate+'%':M(i-e)}${e2?` · spending ${e>e2?'up':'down'} ${Math.abs(Math.round((e-e2)/e2*100))}% vs previous month`:''}${t?` · biggest: ${t[0]}`:''}.`,good:i>=e}); } }
  // 2) weekly summary (last 7 days) — one per ISO week, shown from Monday
  { const a=new Date(td); a.setDate(a.getDate()-7); const r=rng(a,new Date(td.getTime()-864e5)); const e=sumIn(exp,r), i=sumIn(inc,r), t=top(r);
    const wk=iso(new Date(td.getFullYear(),td.getMonth(),td.getDate()-((td.getDay()+6)%7)));
    if(e||i) out.push({key:'w'+wk,kind:'report',title:'Your week in numbers',body:`Last 7 days: spent ${M(e)}, income ${M(i)}${t?`, top category ${t[0]} (${M(t[1])})`:''}.`,good:i>=e}); }
  // 3) budget alerts for this month
  try{ const bud=JSON.parse(NS.store.setting('budgets','{}')); const r=rng(new Date(td.getFullYear(),td.getMonth(),1),new Date(td.getFullYear(),td.getMonth()+1,0));
    Object.entries(bud).filter(([,v])=>v>0).forEach(([c,v])=>{ const s=NS.sum(exp.filter(x=>x.category===c&&x.date>=r.from&&x.date<=r.to&&x.date<=today),x=>x.amount); const p=s/v;
      if(p>=1) out.push({key:'b100'+c+r.from,kind:'alert',title:c+' budget exceeded',body:`You have spent ${M(s)} of ${M(v)} (${Math.round(p*100)}%) on ${c} this month.`,good:false});
      else if(p>=.8) out.push({key:'b80'+c+r.from,kind:'alert',title:c+' budget at '+Math.round(p*100)+'%',body:`${M(s)} of ${M(v)} used — ${M(v-s)} left for the rest of the month.`,good:false}); }); }catch(e){}
  // 4) goals progress milestones
  NS.store.get('goals').forEach(g=>{ if(!(g.target>0)) return; const p=(g.saved||0)/g.target*100; const m=p>=100?100:p>=75?75:p>=50?50:0; if(m) out.push({key:'g'+m+g.id,kind:'goal',title:m===100?`Goal reached: ${g.name} 🎉`:`${g.name} is ${m}% funded`,body:`${M(g.saved||0)} saved of ${M(g.target)}.`,good:true}); });
  // 5) portfolio performance
  { const iv=NS.store.get('investments'); if(iv.length){ const cs=iv.map(NS.invCalc), inv=NS.sum(cs,c=>c.invested), cur=NS.sum(cs,c=>c.current); if(inv>0){ const pc=(cur-inv)/inv*100; const mk=iso(td).slice(0,7);
      out.push({key:'p'+mk,kind:'perf',title:'Portfolio '+(pc>=0?'up ':'down ')+Math.abs(pc).toFixed(1)+'%',body:`Invested ${M(inv)} · now worth ${M(cur)} (${pc>=0?'+':'−'}${M(Math.abs(cur-inv))}).`,good:pc>=0}); } } }
  return out;
};
NS.insightsSeen=()=>{ try{ return JSON.parse(localStorage.getItem('ns_ins_seen')||'{}'); }catch(e){ return {}; } };
NS.insightsUnread=()=>{ const s=NS.insightsSeen(); return NS.insights().filter(i=>!s[i.key]); };
NS.insightsMarkRead=()=>{ const s=NS.insightsSeen(); NS.insights().forEach(i=>s[i.key]=1); try{ localStorage.setItem('ns_ins_seen',JSON.stringify(s)); }catch(e){} };

/* ---------- browser notifications (fire when the app / installed PWA is opened) ---------- */
NS.notify={
  supported:'Notification' in window,
  enabled(){ return this.supported&&Notification.permission==='granted'&&localStorage.getItem('ns_notif')!=='0'; },
  async enable(){ if(!this.supported) return 'unsupported'; const p=await Notification.requestPermission(); localStorage.setItem('ns_notif',p==='granted'?'1':'0'); return p; },
  disable(){ localStorage.setItem('ns_notif','0'); },
  async show(title,body){ try{ const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration(); const o={body,icon:'assets/icons/icon-192.png',badge:'assets/icons/favicon-64.png',tag:title}; if(reg&&reg.showNotification) return reg.showNotification(title,o); new Notification(title,o); }catch(e){} },
  check(){ if(!this.enabled()) return; let seen={}; try{ seen=JSON.parse(localStorage.getItem('ns_notified')||'{}'); }catch(e){} const today=NS.todayISO();
    NS.dueNow().forEach(r=>{ const k=r.key+today; if(seen[k]) return; seen[k]=1; const when=r.days<0?`${-r.days} day(s) overdue`:r.days===0?'today':`in ${r.days} day(s)`; this.show(`${r.title} — ${NS.money(r.amount)}`,`${r.sub} ${when}`); });
    Object.keys(seen).forEach(k=>{ if(!k.endsWith(today)) delete seen[k]; }); localStorage.setItem('ns_notified',JSON.stringify(seen));
    if(localStorage.getItem('ns_notif_perf')!=='0'){ let ps={}; try{ ps=JSON.parse(localStorage.getItem('ns_notified_perf')||'{}'); }catch(e){}
      NS.insights().filter(i=>i.kind!=='perf'||true).forEach(i=>{ if(ps[i.key]) return; ps[i.key]=1; this.show(i.title,i.body); });
      try{ localStorage.setItem('ns_notified_perf',JSON.stringify(ps)); }catch(e){} } }
};
})();

