/* Nano Wealth views */
(function(){
const NS=window.NS, $=NS.$, esc=NS.esc, ic=NS.icon, M=NS.money;
const CAT={
  income:['Salary','Business','Freelance','Rental','Interest / Dividend','Bonus','Gift','Refund','Other'],
  expenses:['Food','Rent','Transport','Utilities','Shopping','Health','Education','Entertainment','Travel','Insurance','EMI','Subscriptions','Personal care','Other'],
  invest:['Mutual Fund','Stocks','Recurring Deposit','Fixed Deposit','Gold','Crypto','Real Estate','PPF / EPF','Bonds','Other'],
  loan:['Home Loan','Vehicle Loan','Personal Loan','Education Loan','Business Loan','Gold Loan','Other'],
  debt:['Credit Card','Borrowed from someone','Lent to someone','Buy-now-pay-later','Other']
};
const FOR=['Self','Family','Business','Others'];
NS.FOR=FOR;
const forOf=r=>r.spentFor||'Self';
const forBadge=r=>`<span class="badge for-${forOf(r).toLowerCase()}">${esc(forOf(r))}</span>${r.forWho?`<div class="small">${esc(r.forWho)}</div>`:''}`;
const MODE=['UPI','Cash','Debit card','Credit card','Bank transfer','Auto-debit','Wallet','Other'];
const CUR=['INR','USD','EUR','GBP','AED','SGD','AUD','CAD','JPY'];
const REMIND=[{v:'',l:'No reminder'},{v:'0',l:'On the day'},{v:'1',l:'1 day before'},{v:'2',l:'2 days before'},{v:'3',l:'3 days before'},{v:'7',l:'1 week before'}];
NS.CAT=CAT;
const store=()=>NS.store, S=k=>NS.store.setting.bind(NS.store)(k[0],k[1]);
const sel=a=>a.map(x=>typeof x==='string'?{v:x,l:x}:x);
const mon=(d,n=0)=>new Date(d.getFullYear(),d.getMonth()+n,1);
const mkey=s=>String(s).slice(0,7);
const inR=(s,a,b)=>s>=a&&s<=b;
const cur=()=>M(0).replace(/[\d.,\s]/g,'');

/* ---------- derived numbers ---------- */
const D=NS.derived={
  loanInfo(l){ const emi=NS.calc.emi(l.principal,l.rate,l.tenure), bal=NS.calc.balance(l.principal,l.rate,l.tenure,l.paidEmis); const start=NS.parseISO(l.startDate)||new Date(); const next=l.paidEmis>=l.tenure?null:NS.addMonths(start,l.paidEmis+1);
    return {emi,bal,next,prog:l.tenure?Math.min(100,l.paidEmis/l.tenure*100):0,done:l.paidEmis>=l.tenure}; },
  debtOut:d=>Math.max(0,d.amount-d.paid),
  totals(){ const invs=store().get('investments').map(NS.invCalc), loans=store().get('loans'), debts=store().get('debts');
    const invested=NS.sum(invs,i=>i.invested), value=NS.sum(invs,i=>i.current);
    const loanBal=NS.sum(loans,l=>D.loanInfo(l).bal), emis=NS.sum(loans,l=>D.loanInfo(l).done?0:D.loanInfo(l).emi);
    const owe=NS.sum(debts.filter(d=>d.direction==='owe'),D.debtOut), owed=NS.sum(debts.filter(d=>d.direction==='owed'),D.debtOut);
    const cash=Number(NS.store.setting('openingBalance',0))+NS.sum(NS.expandTx('income'),i=>i.amount)-NS.sum(NS.expandTx('expenses'),i=>i.amount)-invested;
    return {invested,value,loanBal,emis,owe,owed,cash,net:cash+value+owed-loanBal-owe};
  }
};

/* ---------- generic form ---------- */
function fieldHTML(f,val){
  const v=val??f.def??''; const id='f_'+f.k; let c;
  if(f.t==='select') c=`<select class="sel" id="${id}">${sel(f.opts).map(o=>`<option value="${esc(o.v)}" ${String(o.v)===String(v)?'selected':''}>${esc(o.l)}</option>`).join('')}</select>`;
  else if(f.t==='textarea') c=`<textarea class="txt" id="${id}" placeholder="${esc(f.ph||'')}">${esc(v)}</textarea>`;
  else if(f.t==='money') c=`<div class="inp-group"><span class="pre">${esc(cur())}</span><input class="inp" id="${id}" type="number" step="any" min="0" inputmode="decimal" value="${v}"></div>`;
  else c=`<input class="inp" id="${id}" type="${f.t||'text'}" ${f.t==='number'?'step="any" inputmode="decimal"':''} value="${esc(v)}" placeholder="${esc(f.ph||'')}">`;
  return `<div class="field ${f.full?'full':''}"><label for="${id}">${esc(f.l)}<span class="rq" data-rq="${f.k}">${f.req===1||f.req===true?' *':''}</span></label>${c}${f.help?`<div class="fhelp">${f.help}</div>`:''}<div class="hint" data-h="${f.k}"></div></div>`;
}
NS.openForm=(tbl,item,hooks={})=>{
  const mod=MOD[tbl], isNew=!item, rec=item?{...item}:{...(mod.defaults?mod.defaults():{})};
  const m=NS.modal({title:(isNew?'Add ':'Edit ')+mod.single,body:mod.fields.map(f=>fieldHTML(f,rec[f.k])).join('')+(mod.formNote?`<div class="full" id="fnote"></div>`:'')});
  m.foot.innerHTML=`<button class="btn btn-ghost" data-c>Cancel</button><button class="btn btn-primary" data-s>${isNew?'Add':'Save changes'}</button>`;
  const num=f=>f.t==='number'||f.t==='money';
  const get=()=>{ const o={...rec}; mod.fields.forEach(f=>{ const el=$('#f_'+f.k,m.el); o[f.k]=num(f)?(el.value===''?'':Number(el.value)):el.value.trim(); }); return o; };
  const refresh=()=>{ const o=get(); mod.fields.forEach(f=>{ if(f.showIf) $('#f_'+f.k,m.el).closest('.field').hidden=!f.showIf(o); }); mod.fields.forEach(f=>{ if(typeof f.req==='function'){ const q=$('[data-rq="'+f.k+'"]',m.el); if(q) q.textContent=f.req(o)?' *':''; } }); if(mod.formNote) $('#fnote',m.el).innerHTML=mod.formNote(o); };
  m.el.addEventListener('input',refresh); m.el.addEventListener('change',refresh); refresh();
  $('[data-c]',m.el).onclick=m.close; setTimeout(()=>{ const f=$('input,select',m.body); f&&f.focus(); },60);
  $('[data-s]',m.el).onclick=async e=>{
    const o=get(); let bad=false;
    mod.fields.forEach(f=>{ const h=$('[data-h="'+f.k+'"]',m.el), inp=$('#f_'+f.k,m.el); let msg=''; const shown=!f.showIf||f.showIf(o); const need=typeof f.req==='function'?f.req(o):f.req;
      if(shown&&need&&(o[f.k]===''||o[f.k]===undefined||(num(f)&&isNaN(o[f.k])))) msg='Required'; else if(shown&&need&&f.t==='money'&&o[f.k]<=0) msg='Must be above 0';
      h.textContent=msg; inp.classList.toggle('err',!!msg); if(msg) bad=true; });
    if(bad) return;
    mod.fields.forEach(f=>{ if(f.showIf&&!f.showIf(o)) o[f.k]=num(f)?'':(f.k==='recurring'||f.k==='plan'?o[f.k]:''); });
    const btn=e.currentTarget; btn.disabled=true; btn.innerHTML=ic('refresh','spin')+' Saving';
    try{ if(isNew) await store().add(tbl,o); else await store().update(tbl,o); NS.toast(isNew?mod.single[0].toUpperCase()+mod.single.slice(1)+' added':'Changes saved'); m.close(); (hooks.onSaved||NS.refresh)(); }
    catch(err){ btn.disabled=false; btn.textContent=isNew?'Add':'Save changes'; NS.toast(err.message,'err',5000); }
  };
};
function promptAmount(title,max,label){ return new Promise(res=>{
  const m=NS.modal({title,body:`<div class="field full"><label>${label}</label><div class="inp-group"><span class="pre">${esc(cur())}</span><input class="inp" id="pa" type="number" min="0" max="${max}" step="any" value="${max}"></div><div class="hint" style="color:var(--muted)">Up to ${M(max)}</div></div>`,onClose:()=>res(null)});
  m.foot.innerHTML='<button class="btn btn-ghost" data-c>Cancel</button><button class="btn btn-primary" data-s>Record</button>'; $('[data-c]',m.el).onclick=m.close;
  $('[data-s]',m.el).onclick=()=>{ const v=Number($('#pa',m.el).value); if(!(v>0)) return; res(Math.min(v,max)); m.close(); }; setTimeout(()=>$('#pa',m.el).select(),50); }); }

/* ---------- module definitions ---------- */
const amtCls=(n,t)=>`<span class="num ${t}">${t==='pos'?'+':t==='neg'?'−':''}${M(n)}</span>`;
const nameCell=(a,b)=>`<div class="name">${esc(a)}</div>${b?`<div class="small">${esc(b)}</div>`:''}`;
const repeatBadge=r=>NS.recurs(r.recurring)?`<span class="badge orange">${ic('refresh')} ${NS.FREQ_L[r.recurring]}</span>${r.endDate?`<div class="small">until ${NS.fmtDate(r.endDate,{day:'numeric',month:'short',year:'2-digit'})}</div>`:''}`:'<span class="faint">One-time</span>';
const periodCell=r=>`<b class="num">${M(r._sum||0)}</b>${r._n>1?`<div class="small">${r._n} × ${M(r.amount)}</div>`:''}`;
const remFor=(tbl,id)=>NS.reminders().find(r=>r.tbl===tbl&&r.id===id);
const remAction=(show)=>({icon:'bell',title:'Remind me (calendar alert)',show,fn:r=>{ const x=remFor(MODKEY(r),r.id); if(!x) return NS.toast('Nothing upcoming to remind about','info'); NS.calendarModal(x); }});
let _tbl; const MODKEY=r=>r._tbl||_tbl;
const recFields=[
  {k:'recurring',l:'How often?',t:'select',opts:NS.FREQ,help:'Pick “Every day / month…” for salary, rent or bills — Nano Wealth adds each payment automatically.'},
  {k:'endDate',l:'Stop on (optional)',t:'date',showIf:o=>o.recurring&&o.recurring!=='No'}];
const MOD={
  income:{single:'income',title:'Income',icon:'income',cats:CAT.income,catKey:'category',dateKey:'date',search:['source','category','notes'],sort:['date',-1],period:true,
    defaults:()=>({date:NS.todayISO(),category:'Salary',recurring:'No'}),
    fields:[{k:'source',l:'Source',t:'text',req:1,full:1,ph:'e.g. Monthly salary'},{k:'amount',l:'Amount per payment',t:'money',req:1},{k:'category',l:'Category',t:'select',opts:CAT.income},{k:'date',l:'Date (or start date)',t:'date',req:1},...recFields,{k:'notes',l:'Notes',t:'textarea',full:1}],
    cols:[['source','Source',r=>nameCell(r.source,r.notes)],['category','Category',r=>`<span class="badge">${esc(r.category)}</span>`],['date','Since',r=>NS.fmtDate(r.date)],['recurring','Repeats',repeatBadge],['amount','Per payment',r=>amtCls(r.amount,'pos'),'r'],['period','In '+'period',r=>periodCell(r),'r']],
    val:(r,k)=>k==='period'?r._sum:undefined,
    stats:(rows,rg)=>{ const t=NS.sum(rows,r=>r._sum), n=NS.sum(rows,r=>r._n); return [['Total · '+NS.periodLabel(),M(t)],['Payments received',n],[rg.all?'Average / payment':'Average / day',M(rg.all?(n?t/n:0):t/rg.days)]]; }},
  expenses:{single:'expense',title:'Expenses',icon:'expense',cats:CAT.expenses,catKey:'category',dateKey:'date',search:['description','category','notes','mode','spentFor','forWho'],fx:{key:'spentFor',all:'Everyone',opts:FOR},sort:['date',-1],period:true,
    defaults:()=>({date:NS.todayISO(),category:'Food',mode:'UPI',recurring:'No',spentFor:'Self'}),
    fields:[{k:'description',l:'What was it for?',t:'text',req:1,full:1,ph:'e.g. Groceries'},{k:'amount',l:'Amount',t:'money',req:1},{k:'spentFor',l:'Spent for',t:'select',opts:FOR},{k:'forWho',l:'Whom / which business (optional)',t:'text',ph:'e.g. Mom, Nano Fly shop'},{k:'category',l:'Category',t:'select',opts:CAT.expenses},{k:'date',l:'Date (or start date)',t:'date',req:1},{k:'mode',l:'Paid with',t:'select',opts:MODE},...recFields,{k:'notes',l:'Notes',t:'textarea',full:1}],
    cols:[['description','Description',r=>nameCell(r.description,r.notes)],['category','Category',r=>`<span class="badge">${esc(r.category)}</span>`],['spentFor','For',forBadge],['date','Date',r=>NS.fmtDate(r.date)],['recurring','Repeats',repeatBadge],['mode','Paid with',r=>`<span class="muted">${esc(r.mode)}</span>`],['amount','Amount',r=>amtCls(r.amount,'neg'),'r'],['period','In period',r=>periodCell(r),'r']],
    val:(r,k)=>k==='period'?r._sum:undefined,
    actions:[remAction(r=>NS.recurs(r.recurring)&&r.recurring!=='Daily')],
    stats:(rows,rg)=>{ const t=NS.sum(rows,r=>r._sum), n=NS.sum(rows,r=>r._n); const g=Object.entries(NS.group(rows,r=>r.category)).map(([k,v])=>[k,NS.sum(v,x=>x._sum)]).sort((a,b)=>b[1]-a[1])[0]; return [['Total · '+NS.periodLabel(),M(t)],[rg.all?'Transactions':'Per day',rg.all?n:M(t/rg.days)],['Top category',g&&g[1]>0?g[0]:'—']]; },
    breakdown:true},
  investments:{single:'investment',title:'Investments',icon:'invest',cats:CAT.invest,catKey:'type',dateKey:'buyDate',search:['name','type','notes'],sort:['current',-1],
    defaults:()=>({buyDate:NS.todayISO(),type:'Mutual Fund',plan:'One-time',sipDay:Math.min(28,new Date().getDate()),remind:'1',rate:0}),
    fields:[{k:'name',l:'Investment name',t:'text',req:1,full:1,ph:'e.g. Nifty 50 Index Fund'},{k:'type',l:'Type',t:'select',opts:CAT.invest},
      {k:'plan',l:'How do you invest?',t:'select',opts:[{v:'One-time',l:'One-time payment'},{v:'Monthly',l:'Monthly (SIP / RD)'},{v:'Quarterly',l:'Every 3 months'},{v:'Yearly',l:'Yearly'}]},
      {k:'buyDate',l:'Start / purchase date',t:'date',req:1},
      {k:'sipAmount',l:'Installment amount',t:'money',showIf:o=>o.plan&&o.plan!=='One-time',req:o=>o.plan&&o.plan!=='One-time'},
      {k:'sipDay',l:'Pay on day of month',t:'number',showIf:o=>o.plan&&o.plan!=='One-time',help:'e.g. 5 = every 5th. Months with fewer days use the last day.'},
      {k:'invested',l:'Lump sum invested',t:'money',req:o=>!o.plan||o.plan==='One-time',help:'Plans: amount you already put in before the first installment (optional).'},
      {k:'sipEnd',l:'Last installment (optional)',t:'date',showIf:o=>o.plan&&o.plan!=='One-time'},
      {k:'remind',l:'Remind me',t:'select',opts:REMIND,showIf:o=>o.plan&&o.plan!=='One-time'},
      {k:'rate',l:'Expected return % p.a.',t:'number',showIf:o=>o.plan&&o.plan!=='One-time'},
      {k:'current',l:'Current value',t:'money',full:1,help:'Leave 0 to auto-estimate (uses expected return for plans).'},
      {k:'notes',l:'Notes',t:'textarea',full:1}],
    cols:[['name','Investment',r=>{ const c=NS.invCalc(r); return nameCell(r.name,c.plan==='One-time'?r.notes:`${c.plan==='Monthly'?'SIP / RD':c.plan} · ${M(r.sipAmount)} on the ${ordinal(r.sipDay||NS.parseISO(r.buyDate).getDate())}`); }],['type','Type',r=>`<span class="badge info">${esc(r.type)}</span>`],
      ['invested','Invested',r=>{ const c=NS.invCalc(r); return `<span class="num">${M(c.invested)}</span>${c.n?`<div class="small">${c.n} installments</div>`:''}`; },'r'],
      ['current','Current value',r=>{ const c=NS.invCalc(r); return `<b class="num">${M(c.current)}</b>${c.est?'<div class="small">estimated</div>':''}`; },'r'],
      ['pl','Returns',r=>{ const c=NS.invCalc(r), p=c.current-c.invested, pc=c.invested?p/c.invested*100:0; return `<span class="num ${p>=0?'pos':'neg'}">${p>=0?'▲':'▼'} ${M(Math.abs(p))}<br><small>${pc.toFixed(1)}%${cagr(r,c)}</small></span>`; },'r'],
      ['next','Next installment',r=>{ const c=NS.invCalc(r); return c.plan==='One-time'?'<span class="faint">—</span>':c.next?dueBadge(c.next):'<span class="badge good">Completed</span>'; }]],
    val:(r,k)=>{ const c=NS.invCalc(r); return k==='invested'?c.invested:k==='current'?c.current:k==='pl'?c.current-c.invested:k==='next'?(c.next?+c.next:9e15):undefined; },
    actions:[remAction(r=>NS.invCalc(r).plan!=='One-time')],
    stats:rows=>{ const cs=rows.map(NS.invCalc), i=NS.sum(cs,c=>c.invested), c=NS.sum(cs,c=>c.current); const mo=NS.sum(rows.filter(r=>r.plan==='Monthly'),r=>r.sipAmount); return [['Current value',M(c)],['Invested',M(i)],['Returns',`<span class="${c>=i?'pos':'neg'}">${c>=i?'+':'−'}${M(Math.abs(c-i))} (${i?((c-i)/i*100).toFixed(1):0}%)</span>`]]; }},
  loans:{single:'loan',title:'Loans',icon:'loan',cats:CAT.loan,catKey:'type',dateKey:'startDate',search:['lender','type','notes'],sort:['startDate',-1],
    defaults:()=>({startDate:NS.todayISO(),type:'Home Loan',paidEmis:0}),
    fields:[{k:'lender',l:'Lender / loan name',t:'text',req:1,full:1,ph:'e.g. HDFC Home Loan'},{k:'type',l:'Type',t:'select',opts:CAT.loan},{k:'startDate',l:'Loan start date',t:'date',req:1},{k:'principal',l:'Loan amount',t:'money',req:1},{k:'rate',l:'Interest % p.a.',t:'number',req:1},{k:'tenure',l:'Tenure (months)',t:'number',req:1},{k:'paidEmis',l:'EMIs paid so far',t:'number'},{k:'notes',l:'Notes',t:'textarea',full:1}],
    formNote:o=>o.principal>0&&o.tenure>0?`<div class="insight"><span class="ic">${ic('calc')}</span><span>Estimated EMI: <b>${M(NS.calc.emi(o.principal,o.rate||0,o.tenure))}</b> / month · total interest <b>${M(NS.calc.emi(o.principal,o.rate||0,o.tenure)*o.tenure-o.principal)}</b></span></div>`:'',
    cols:[['lender','Loan',r=>nameCell(r.lender,r.type)],['emi','EMI',r=>`<span class="num">${M(D.loanInfo(r).emi)}</span>`,'r'],['bal','Outstanding',r=>`<b class="num">${M(D.loanInfo(r).bal)}</b>`,'r'],
      ['prog','Progress',r=>{ const x=D.loanInfo(r); return `<div class="mini-prog"><small class="muted">${r.paidEmis}/${r.tenure} EMIs · ${x.prog.toFixed(0)}%</small><div class="bar-track"><div class="bar-fill ${x.done?'ok':''}" style="width:${x.prog}%"></div></div></div>`; }],
      ['next','Next due',r=>{ const x=D.loanInfo(r); return x.done?'<span class="badge good">Paid off 🎉</span>':dueBadge(x.next); }]],
    val:(r,k)=>k==='emi'?D.loanInfo(r).emi:k==='bal'?D.loanInfo(r).bal:k==='prog'?D.loanInfo(r).prog:k==='next'?+(D.loanInfo(r).next||9e15):undefined,
    actions:[remAction(r=>!D.loanInfo(r).done),{icon:'check',title:'Mark EMI paid',fn:async r=>{ const x=D.loanInfo(r); if(x.done) return NS.toast('This loan is already paid off','info');
      const v=await NS.confirm({title:'Mark EMI as paid',text:`Record EMI #${r.paidEmis+1} of <b>${M(x.emi)}</b> for <b>${esc(r.lender)}</b>?`,ok:'Mark paid',extra:'<label class="full" style="display:flex;gap:.6rem;align-items:center;font-weight:600"><input type="checkbox" data-extra="log" checked> Also log it in Expenses (category: EMI)</label>'}); if(!v) return;
      try{ await store().update('loans',{...r,paidEmis:r.paidEmis+1}); if(v.log) await store().add('expenses',{date:NS.todayISO(),description:r.lender+' EMI',category:'EMI',amount:Math.round(x.emi),mode:'Auto-debit',notes:'Auto-logged from Loans',recurring:'No',endDate:''}); NS.toast('EMI recorded'); NS.refresh(); }catch(e){ NS.toast(e.message,'err'); } }}],
    stats:rows=>[['Outstanding',M(NS.sum(rows,r=>D.loanInfo(r).bal))],['Monthly EMIs',M(NS.sum(rows,r=>D.loanInfo(r).done?0:D.loanInfo(r).emi))],['Active loans',rows.filter(r=>!D.loanInfo(r).done).length]]},
  debts:{single:'debt entry',title:'Debts',icon:'debt',cats:CAT.debt,catKey:'type',dateKey:'dueDate',search:['party','type','notes'],sort:['dueDate',1],
    defaults:()=>({type:'Credit Card',direction:'owe',paid:0}),
    fields:[{k:'party',l:'Who / what',t:'text',req:1,full:1,ph:'e.g. ICICI Credit Card'},{k:'type',l:'Type',t:'select',opts:CAT.debt},{k:'direction',l:'Direction',t:'select',opts:[{v:'owe',l:'I owe this'},{v:'owed',l:'Owed to me'}]},{k:'amount',l:'Total amount',t:'money',req:1},{k:'paid',l:'Settled so far',t:'money'},{k:'dueDate',l:'Due date',t:'date'},{k:'notes',l:'Notes',t:'textarea',full:1}],
    cols:[['party','Party',r=>nameCell(r.party,r.type)],['direction','',r=>r.direction==='owe'?'<span class="badge bad">I owe</span>':'<span class="badge good">Owed to me</span>'],['amount','Total',r=>`<span class="num">${M(r.amount)}</span>`,'r'],
      ['out','Remaining',r=>`<b class="num ${r.direction==='owe'?'neg':'pos'}">${M(D.debtOut(r))}</b>`,'r'],
      ['prog','Settled',r=>{ const p=r.amount?Math.min(100,r.paid/r.amount*100):0; return `<div class="mini-prog"><small class="muted">${p.toFixed(0)}%</small><div class="bar-track"><div class="bar-fill ${p>=100?'ok':''}" style="width:${p}%"></div></div></div>`; }],
      ['dueDate','Due',r=>D.debtOut(r)<=0?'<span class="badge good">Settled</span>':r.dueDate?dueBadge(NS.parseISO(r.dueDate)):'<span class="faint">No date</span>']],
    val:(r,k)=>k==='out'?D.debtOut(r):k==='prog'?r.paid/(r.amount||1):k==='dueDate'?(r.dueDate||'9999'):undefined,
    actions:[remAction(r=>D.debtOut(r)>0&&r.dueDate),{icon:'coin',title:'Record a payment',fn:async r=>{ const left=D.debtOut(r); if(left<=0) return NS.toast('Already settled','info'); const v=await promptAmount(r.direction==='owe'?'Record payment you made':'Record payment received',left,'Amount'); if(!v) return; try{ await store().update('debts',{...r,paid:r.paid+v}); NS.toast('Payment recorded'); NS.refresh(); }catch(e){ NS.toast(e.message,'err'); } }}],
    stats:rows=>[['I owe',`<span class="neg">${M(NS.sum(rows.filter(r=>r.direction==='owe'),D.debtOut))}</span>`],['Owed to me',`<span class="pos">${M(NS.sum(rows.filter(r=>r.direction==='owed'),D.debtOut))}</span>`],['Open entries',rows.filter(r=>D.debtOut(r)>0).length]]},
  goals:{single:'goal',title:'Goals',icon:'target',cats:[],catKey:'name',dateKey:'deadline',search:['name'],sort:['deadline',1],
    defaults:()=>({saved:0}),
    fields:[{k:'name',l:'Goal name',t:'text',req:1,full:1,ph:'e.g. Emergency fund'},{k:'target',l:'Target amount',t:'money',req:1},{k:'saved',l:'Saved so far',t:'money'},{k:'deadline',l:'Target date',t:'date'},{k:'notes',l:'Notes',t:'textarea',full:1}]}
};
const ordinal=n=>{ n=Number(n)||1; const s=['th','st','nd','rd'],v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); };
function cagr(r,c){ const d=NS.parseISO(r.buyDate); if(!d||!c.invested||r.plan&&r.plan!=='One-time') return ''; const y=(Date.now()-d)/(365.25*864e5); if(y<1) return ''; return ` · ${((Math.pow(c.current/c.invested,1/y)-1)*100).toFixed(1)}% /yr`; }
function dueBadge(d){ if(!d) return '—'; const days=Math.round((d-new Date(new Date().toDateString()))/864e5); const t=NS.fmtDate(d,{day:'numeric',month:'short'}); if(days<0) return `<span class="badge bad">Overdue · ${t}</span>`; if(days<=7) return `<span class="badge warn">${days===0?'Today':'In '+days+'d'} · ${t}</span>`; return `<span class="badge">${t}</span>`; }
NS.MOD=MOD;

/* ---------- module page ---------- */
const mstate={};
function modulePage(el,tbl){
  _tbl=tbl; const mod=MOD[tbl]; const st=mstate[tbl]=mstate[tbl]||{q:'',cat:'',fx:'',sort:mod.sort[0],dir:mod.sort[1]};
  const all=store().get(tbl); all.forEach(r=>r._tbl=tbl);
  el.innerHTML=`${mod.period?'<div id="pb" style="margin-bottom:1rem"></div>':''}
  <div class="tools">
    <div class="search">${ic('search')}<input class="inp" id="q" placeholder="Search ${mod.title.toLowerCase()}…  ( / )" value="${esc(st.q)}"></div>
    <select class="sel" id="fc"><option value="">All categories</option>${mod.cats.map(c=>`<option ${st.cat===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
    ${mod.fx?`<select class="sel" id="fx"><option value="">${mod.fx.all}</option>${mod.fx.opts.map(c=>`<option ${st.fx===c?'selected':''}>${esc(c)}</option>`).join('')}</select>`:''}
    ${mod.period?`<button class="btn btn-ghost" id="imp" title="Import from CSV">${ic('upload')} Import</button><input type="file" id="impf" accept=".csv,text/csv" hidden>`:''}
    <button class="btn btn-ghost" id="exp">${ic('download')} CSV</button>
    <button class="btn btn-primary" id="add">${ic('plus')} Add ${mod.single}</button>
  </div>
  <div class="grid g3 stats3" id="stats" style="margin-bottom:1.2rem"></div><div id="bd" style="margin-bottom:1.2rem"></div>
  <div class="card" style="padding:.6rem 1rem 1rem"><div class="tbl-wrap" id="tw"></div></div>`;
  const draw=()=>{
    const rg=NS.periodRange(0);
    let rows=all.filter(r=>(!st.cat||r[mod.catKey]===st.cat)&&(!mod.fx||!st.fx||forOf(r)===st.fx)&&(!st.q||mod.search.some(k=>String(r[k]||'').toLowerCase().includes(st.q.toLowerCase()))));
    if(mod.period){ rows.forEach(r=>{ const o=NS.occIn(r,rg); r._n=o.length; r._sum=o.length*(r.amount||0); }); rows=rows.filter(r=>r._n>0); }
    const sk=mod.cols.find(c=>c[0]===st.sort)?st.sort:mod.sort[0];
    const val=r=>{ const v=mod.val?mod.val(r,sk):undefined; return v!==undefined?v:r[sk]; };
    rows=[...rows].sort((a,b)=>{ const x=val(a),y=val(b); return (x>y?1:x<y?-1:0)*st.dir; });
    if(mod.breakdown){ const tot=NS.sum(rows,r=>r._sum)||0; const bd=FOR.map(f=>[f,NS.sum(rows.filter(r=>forOf(r)===f),r=>r._sum)]); $('#bd',el).innerHTML=tot?`<div class="card fbreak"><div class="fb-bar">${bd.filter(b=>b[1]>0).map(b=>`<i class="for-${b[0].toLowerCase()}" style="width:${b[1]/tot*100}%" title="${b[0]}"></i>`).join('')}</div><div class="fb-leg">${bd.map(b=>`<span><i class="for-${b[0].toLowerCase()}"></i>${b[0]} <b>${M(b[1])}</b></span>`).join('')}</div></div>`:''; }
    $('#stats',el).innerHTML=mod.stats(rows,rg).map(s=>`<div class="card kpi"><div class="lb">${s[0]}</div><div class="v" style="font-size:1.5rem">${s[1]}</div></div>`).join('');
    const emptyMsg=all.length?(mod.period&&!st.q&&!st.cat?`Nothing in ${NS.periodLabel()}`:'Nothing matches those filters'):'No '+mod.title.toLowerCase()+' yet';
    $('#tw',el).innerHTML=rows.length?`<table class="tbl"><thead><tr>${mod.cols.map(c=>`<th class="${c[3]||''}" data-s="${c[0]}">${c[1]}${st.sort===c[0]?(st.dir>0?' ▲':' ▼'):''}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map(r=>`<tr data-id="${r.id}">${mod.cols.map(c=>`<td class="${c[3]||''}" data-l="${c[1]}">${c[2](r)}</td>`).join('')}<td class="acts-td"><div class="acts">${(mod.actions||[]).map((a,i)=>a.show&&!a.show(r)?'':`<button class="btn btn-icon" data-a="${i}" title="${a.title}">${ic(a.icon)}</button>`).join('')}<button class="btn btn-icon" data-e title="Edit">${ic('edit')}</button><button class="btn btn-icon" data-d title="Delete">${ic('trash')}</button></div></td></tr>`).join('')}</tbody></table>`
      :`<div class="empty">${ic(mod.icon)}<h4>${emptyMsg}</h4><p>${all.length?'Try another period, or clear the search and filters.':'Add your first entry — it takes 10 seconds.'}</p>${all.length?'':`<button class="btn btn-primary" style="margin-top:1rem" data-add2>${ic('plus')} Add ${mod.single}</button>`}</div>`;
    const a2=$('[data-add2]',el); if(a2) a2.onclick=()=>NS.openForm(tbl);
    NS.$$('th[data-s]',el).forEach(th=>th.onclick=()=>{ if(st.sort===th.dataset.s) st.dir*=-1; else{ st.sort=th.dataset.s; st.dir=-1; } draw(); });
    NS.$$('tr[data-id]',el).forEach(tr=>{ const rec=all.find(x=>x.id===tr.dataset.id);
      $('[data-e]',tr).onclick=()=>NS.openForm(tbl,rec);
      $('[data-d]',tr).onclick=async()=>{ const ok=await NS.confirm({title:'Delete this entry?',text:'It will also be removed from your Google Sheet. This can’t be undone.',ok:'Delete',danger:true}); if(!ok) return; try{ await store().remove(tbl,rec); NS.toast('Deleted'); NS.refresh(); }catch(e){ NS.toast(e.message,'err'); } };
      NS.$$('[data-a]',tr).forEach(b=>b.onclick=()=>{ _tbl=tbl; mod.actions[b.dataset.a].fn(rec); }); });
  };
  if(mod.period) NS.periodBar($('#pb',el),draw);
  $('#q',el).oninput=NS.debounce(e=>{ st.q=e.target.value; draw(); },120);
  $('#fc',el).onchange=e=>{ st.cat=e.target.value; draw(); };
  const fxs=$('#fx',el); if(fxs) fxs.onchange=e=>{ st.fx=e.target.value; draw(); };
  $('#add',el).onclick=()=>NS.openForm(tbl);
  const imp=$('#imp',el); if(imp){ imp.onclick=()=>$('#impf',el).click(); $('#impf',el).onchange=e=>{ const f=e.target.files[0]; if(f) importCSV(tbl,f); e.target.value=''; }; }
  $('#exp',el).onclick=()=>{ NS.download('nanowealth-'+tbl+'.csv',NS.csv(all,NS.SCHEMA[tbl].cols)); NS.toast('CSV downloaded'); };
  draw();
}

/* ---------- dashboard ---------- */
function dashboard(el){
  const R=NS.periodRange(0), Rp=NS.periodRange(-1), P=NS.period;
  let ff=''; try{ ff=sessionStorage.getItem('ns_for')||''; }catch(e){}
  const inc=NS.expandTx('income'), expA=NS.expandTx('expenses'), exp=ff?expA.filter(r=>forOf(r)===ff):expA, T=D.totals();
  const invIn=NS.sum(store().get('investments'),v=>{ const lump=(v.buyDate&&inR(v.buyDate,R.from,R.to))?(v.invested||0):0; const sip=(NS.sipDates?NS.sipDates(v):[]).filter(d=>inR(NS.iso(d),R.from,R.to)).length*(v.sipAmount||0); return lump+sip; });
  const forTot=FOR.map(f=>[f,NS.sum(expA.filter(r=>forOf(r)===f&&inR(r.date,R.from,R.to)),r=>r.amount)]);
  const pi=NS.sum(inc.filter(r=>inR(r.date,R.from,R.to)),r=>r.amount), pe=NS.sum(exp.filter(r=>inR(r.date,R.from,R.to)),r=>r.amount);
  const qi=NS.sum(inc.filter(r=>inR(r.date,Rp.from,Rp.to)),r=>r.amount), qe=NS.sum(exp.filter(r=>inR(r.date,Rp.from,Rp.to)),r=>r.amount);
  const save=pi-pe, rate=pi?save/pi*100:0, plv=T.value-T.invested, prevWord=P.mode==='year'?'last year':'last month';
  const dl=(a,b,good)=>{ if(R.all||!b) return '<span class="faint">—</span>'; const p=(a-b)/b*100; const up=p>=0; const g=good?up:!up; return `<span class="${g?'pos':'neg'}">${up?'▲':'▼'} ${Math.abs(p).toFixed(0)}%</span> <span class="faint" style="font-weight:600">vs ${prevWord}</span>`; };
  const name=(NS.auth.user.name||'').split(' ')[0]; const h=new Date().getHours(), n=new Date();
  let months; if(P.mode==='year') months=[...Array(12)].map((_,i)=>new Date(P.y,i,1)); else { const e=P.mode==='month'?new Date(P.y,P.m,1):mon(n); months=[...Array(6)].map((_,i)=>new Date(e.getFullYear(),e.getMonth()-5+i,1)); }
  const flow=months.map(m=>{ const k=NS.iso(m).slice(0,7); return {label:m.toLocaleDateString('en-GB',{month:'short'}),a:NS.sum(inc.filter(r=>mkey(r.date)===k),r=>r.amount),b:NS.sum(exp.filter(r=>mkey(r.date)===k),r=>r.amount)}; });
  const cats=Object.entries(NS.group(exp.filter(r=>inR(r.date,R.from,R.to)),r=>r.category)).map(([label,v])=>({label,value:NS.sum(v,x=>x.amount)})).sort((a,b)=>b.value-a.value);
  const topCats=cats.slice(0,6); if(cats.length>6) topCats.push({label:'Others',value:NS.sum(cats.slice(6),c=>c.value)});
  const alloc=Object.entries(NS.group(store().get('investments'),r=>r.type)).map(([label,v])=>({label,value:NS.sum(v,x=>NS.invCalc(x).current)})).sort((a,b)=>b.value-a.value);
  const ins=[]; if(topCats[0]&&pe) ins.push(['pie',`<b>${esc(topCats[0].label)}</b> is your biggest expense — ${(topCats[0].value/pe*100).toFixed(0)}% of spending (${M(topCats[0].value)}).`]);
  if(!R.all&&qe&&pe!==qe) ins.push([pe>qe?'arrowU':'arrowD',`You spent <b>${Math.abs((pe-qe)/qe*100).toFixed(0)}% ${pe>qe?'more':'less'}</b> than ${prevWord}.`]);
  const sips=store().get('investments').filter(v=>NS.invCalc(v).plan!=='One-time'); if(sips.length) ins.push(['invest',`You invest <b>${M(NS.sum(sips.filter(v=>v.plan==='Monthly'),v=>v.sipAmount))}</b> every month across ${sips.length} plan${sips.length>1?'s':''}.`]);
  else if(T.invested) ins.push(['invest',`Your portfolio is ${plv>=0?'up':'down'} <b>${M(Math.abs(plv))}</b> (${(plv/T.invested*100).toFixed(1)}%).`]);
  if(pi&&rate>=20) ins.push(['spark',`Great job — you saved <b>${rate.toFixed(0)}%</b> of income. Keep it above 20%.`]); else if(pi) ins.push(['target',`Savings rate is <b>${rate.toFixed(0)}%</b>. Aim for 20%+ by trimming one flexible category.`]);
  const rem=NS.reminders().slice(0,6);
  let budgets={}; try{ budgets=JSON.parse(NS.store.setting('budgets','{}')); }catch(e){}
  const bmult=R.all?Math.max(1,Math.round((new Date()-new Date(Math.min(...exp.concat(inc).map(r=>+NS.parseISO(r.date)).filter(Boolean),+new Date())))/2629800000)+1):P.mode==='year'?12:1; const spentCat=c=>NS.sum(exp.filter(r=>inR(r.date,R.from,R.to)&&r.category===c),r=>r.amount);
  const bl=Object.entries(budgets).filter(([,v])=>v>0).map(([c,v])=>[c,v*bmult]);
  const m3=NS.iso(mon(n,-2)); const avgInc=NS.sum(inc.filter(r=>r.date>=m3),r=>r.amount)/3;
  const sRate=pi?Math.max(0,Math.min(1,rate/30)):0, emiR=avgInc?T.emis/avgInc:0, emiS=emiR<=.2?1:emiR>=.5?0:1-(emiR-.2)/.3;
  const avgExp=NS.sum(exp.filter(r=>r.date>=m3),r=>r.amount)/3||1, invS=Math.min(1,T.value/(avgExp*6));
  const okB=bl.length?bl.filter(([c,v])=>spentCat(c)<=v).length/bl.length:.6;
  const score=Math.round(sRate*40+emiS*30+invS*15+okB*15);
  const tips=[[sRate>=.66,'Savings rate '+(pi?rate.toFixed(0)+'%':'unknown'),'Save 20%+ of income'],[emiS>=.7,'EMIs are '+(avgInc?(emiR*100).toFixed(0)+'% of income':'—'),'Keep EMIs under 30% of income'],[invS>=.7,'Investments cover '+(T.value/avgExp).toFixed(1)+' months of spending','Build 6+ months of cover'],[okB>=.7,bl.length?'Within most budgets':'No budgets set yet','Set budgets in Settings']];
  const col=score>=70?'var(--good)':score>=45?'var(--c4)':'var(--bad)';
  const recent=[...inc.filter(r=>!r._rec||r._last).map(r=>({...r,k:'in',t:r.source})),...exp.filter(r=>!r._rec||r._last).map(r=>({...r,k:'out',t:r.description}))].filter(r=>r.date<=NS.todayISO()&&inR(r.date,R.from,R.to)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7);
  const empty=!inc.length&&!exp.length&&!store().get('investments').length;
  const kindIc={sip:'invest',loan:'loan',debt:'clock',recv:'arrowD',bill:'clock'};
  el.innerHTML=`
  <div class="dash-head"><div class="muted" style="font-weight:600">Good ${h<12?'morning':h<17?'afternoon':'evening'}, ${esc(name)} 👋</div><div id="pb"></div></div>
  <div class="forbar"><span class="muted">Expenses for</span>${['',...FOR].map(f=>`<button class="chip ${ff===f?'on':''}" data-ff="${f}">${f||'Everyone'}</button>`).join('')}</div>
  ${empty?`<div class="card" style="margin-bottom:1.2rem;background:var(--grad-soft)"><div class="empty">${ic('spark')}<h4>Your dashboard is ready — it just needs data</h4><p>Add your first income or expense and watch this page come alive.</p><div style="display:flex;gap:.6rem;justify-content:center;margin-top:1rem;flex-wrap:wrap"><button class="btn btn-primary" onclick="NS.openForm('income')">${ic('plus')} Add income</button><button class="btn btn-ghost" onclick="NS.openForm('expenses')">${ic('plus')} Add expense</button></div></div></div>`:''}
  <div class="insights" style="margin-bottom:1.2rem">${ins.map(i=>`<div class="insight"><span class="ic">${ic(i[0])}</span><span>${i[1]}</span></div>`).join('')}</div>
  <div class="grid g4" style="margin-bottom:1.2rem">
    <div class="card kpi hero"><div class="lb"><span class="ic">${ic('wallet')}</span>Net worth · today</div><div class="v" data-n="${T.net}"></div><div class="d" style="color:rgba(246,246,233,.65)"><span title="Cash balance + investments + money owed to you − loans − debts">Cash ${NS.compact(T.cash)} · Assets ${NS.compact(T.value+T.owed)}</span></div></div>
    <div class="card kpi"><div class="lb"><span class="ic">${ic('income')}</span>Income</div><div class="v" data-n="${pi}"></div><div class="d">${dl(pi,qi,true)}</div></div>
    <div class="card kpi"><div class="lb"><span class="ic">${ic('expense')}</span>Expenses${ff?' · '+ff:''}</div><div class="v" data-n="${pe}"></div><div class="d">${dl(pe,qe,false)}</div></div>
    <div class="card kpi"><div class="lb"><span class="ic">${ic('coin')}</span>Savings</div><div class="v ${save<0?'neg':''}" data-n="${save}"></div><div class="d"><span class="badge ${rate>=20?'good':rate>=0?'warn':'bad'}">${rate.toFixed(0)}% of income</span></div></div>
  </div>
  <div class="grid g3" style="margin-bottom:1.2rem">
    <a href="#/investments" class="card kpi"><div class="lb"><span class="ic">${ic('invest')}</span>Invested · ${R.all?'all time':NS.periodLabel()}</div><div class="v" data-n="${R.all?T.invested:invIn}"></div><div class="d"><span class="muted">Portfolio ${NS.compact(T.value)}</span> <span class="${plv>=0?'pos':'neg'}">${plv>=0?'▲':'▼'} ${M(Math.abs(plv))}</span></div></a>
    <a href="#/loans" class="card kpi"><div class="lb"><span class="ic">${ic('loan')}</span>Loans outstanding</div><div class="v" data-n="${T.loanBal}"></div><div class="d"><span class="muted">EMIs: ${M(T.emis)} / month</span></div></a>
    <a href="#/debts" class="card kpi"><div class="lb"><span class="ic">${ic('debt')}</span>Debts</div><div class="v" data-n="${T.owe}"></div><div class="d"><span class="muted">Owed to you: <b class="pos">${M(T.owed)}</b></span></div></a>
  </div>
  <div class="grid g2" style="margin-bottom:1.2rem">
    <div class="card"><div class="card-h"><div><h3>Cash flow</h3><div class="sub">Income vs expenses · ${P.mode==='year'?P.y:'6 months'}</div></div><div class="row-flex" style="gap:1rem;font-size:.8rem;font-weight:700"><span><i class="dot" style="color:var(--good)"></i> Income</span><span><i class="dot" style="color:var(--orange)"></i> Expenses</span></div></div><div id="cBars"></div></div>
    <div class="card"><div class="card-h"><div><h3>Financial health</h3><div class="sub">Based on your last 3 months</div></div></div><div class="health"><div id="ring"></div><ul>${tips.map(t=>`<li>${ic(t[0]?'check':'target')}<span style="color:${t[0]?'var(--good)':'var(--text)'}">${t[0]?t[1]:t[2]}</span></li>`).join('')}</ul></div></div>
  </div>
  <div class="grid g2e" style="margin-bottom:1.2rem">
    <div class="card"><div class="card-h"><div><h3>Where your money goes</h3><div class="sub">Expenses${ff?' for '+ff:''} · ${NS.periodLabel()}</div></div></div>${topCats.length?`<div class="row-flex"><div id="cDon"></div><div class="legend">${topCats.map((c,i)=>`<div><i style="background:${NS.PAL[i%8]}"></i><span>${esc(c.label)}</span><span>${NS.compact(c.value)}</span></div>`).join('')}</div></div>`:`<div class="empty">${ic('pie')}<p>No expenses in this period.</p></div>`}</div>
    <div class="card"><div class="card-h"><div><h3>Investment allocation</h3><div class="sub">By current value</div></div><a class="btn btn-soft btn-sm" href="#/investments">Open</a></div>${alloc.length?`<div class="row-flex"><div id="cAlloc"></div><div class="legend">${alloc.map((c,i)=>`<div><i style="background:${NS.PAL[i%8]}"></i><span>${esc(c.label)}</span><span>${(c.value/(T.value||1)*100).toFixed(0)}%</span></div>`).join('')}</div></div>`:`<div class="empty">${ic('invest')}<p>No investments added yet.</p></div>`}</div>
  </div>
  <div class="card fbreak" style="margin-bottom:1.2rem"><div class="card-h"><div><h3>Spending by purpose</h3><div class="sub">Self, family, business &amp; others · ${NS.periodLabel()}</div></div></div>${(()=>{ const tt=NS.sum(forTot,x=>x[1]); return tt?`<div class="fb-bar">${forTot.filter(b=>b[1]>0).map(b=>`<i class="for-${b[0].toLowerCase()}" style="width:${b[1]/tt*100}%"></i>`).join('')}</div><div class="fb-leg">${forTot.map(b=>`<span><i class="for-${b[0].toLowerCase()}"></i>${b[0]} <b>${M(b[1])}</b> <small>${(b[1]/tt*100).toFixed(0)}%</small></span>`).join('')}</div>`:`<div class="empty"><p>No expenses in this period.</p></div>`; })()}</div>
  <div class="grid g2">
    <div class="card"><div class="card-h"><div><h3>Activity</h3><div class="sub">${NS.periodLabel()}</div></div></div><div class="list">${recent.length?recent.map(r=>`<div class="li"><span class="ic ${r.k}">${ic(r.k==='in'?'arrowD':'arrowU')}</span><div><div class="t">${esc(r.t)}</div><div class="s">${NS.fmtDate(r.date)} · ${esc(r.category)}${r._rec?' · '+NS.FREQ_L[r.recurring].toLowerCase():''}</div></div><div class="a ${r.k==='in'?'pos':''}">${r.k==='in'?'+':'−'}${M(r.amount)}</div></div>`).join(''):`<div class="empty"><p>No activity in ${NS.periodLabel()}.</p></div>`}</div></div>
    <div style="display:flex;flex-direction:column;gap:1.2rem">
      <div class="card"><div class="card-h"><div><h3>Reminders &amp; upcoming</h3><div class="sub">SIPs, EMIs, bills and dues</div></div></div><div class="list">${rem.length?rem.map(x=>`<div class="li"><span class="ic ${x.kind==='recv'?'in':x.days<0?'out':'due'}">${ic(kindIc[x.kind])}</span><div><div class="t">${esc(x.title)}</div><div class="s">${x.sub} · ${x.days<0?'<b class="neg">overdue '+(-x.days)+'d</b>':x.days===0?'<b>today</b>':'in '+x.days+' days'} (${NS.fmtDate(x.date,{day:'numeric',month:'short'})})</div></div><div class="a">${M(x.amount)}</div>${x.kind==='recv'||x.kind==='debt'&&0?'':`<button class="btn btn-icon" data-cal="${x.key}" title="Add to calendar with alert" style="margin-left:.4rem">${ic('bell')}</button>`}</div>`).join(''):`<div class="empty"><p>Nothing due. 🎉</p></div>`}</div></div>
      <div class="card"><div class="card-h"><div><h3>Budgets</h3><div class="sub">${NS.periodLabel()}</div></div><a class="btn btn-soft btn-sm" href="#/settings">Edit</a></div>${bl.length?bl.map(([c,v])=>{ const s=spentCat(c),p=Math.min(100,s/v*100); return `<div style="margin-bottom:.9rem"><div style="display:flex;justify-content:space-between;font-weight:700;font-size:.86rem;margin-bottom:.35rem"><span>${esc(c)}</span><span class="num ${s>v?'neg':'muted'}">${NS.compact(s)} / ${NS.compact(v)}</span></div><div class="bar-track"><div class="bar-fill ${s>v?'over':s/v>.8?'':'ok'}" style="width:${p}%"></div></div></div>`; }).join(''):`<div class="empty"><p>Set category budgets in Settings to track them here.</p></div>`}</div>
    </div>
  </div>`;
  NS.$$('[data-n]',el).forEach(e=>NS.countUp(e,Number(e.dataset.n)));
  NS.periodBar($('#pb',el),()=>dashboard(el));
  NS.$$('[data-ff]',el).forEach(b=>b.onclick=()=>{ try{ sessionStorage.setItem('ns_for',b.dataset.ff); }catch(e){} dashboard(el); });
  NS.$$('[data-cal]',el).forEach(b=>b.onclick=()=>{ const x=rem.find(r=>r.key===b.dataset.cal); if(x) NS.calendarModal(x); });
  NS.chartBars($('#cBars',el),flow);
  const ring=$('#ring',el); NS.chartRing(ring,0,col); setTimeout(()=>NS.chartRing(ring,score,col),60);
  if(topCats.length) NS.chartDonut($('#cDon',el),topCats,{center:NS.compact(pe),sub:'spent'});
  if(alloc.length) NS.chartDonut($('#cAlloc',el),alloc,{center:NS.compact(T.value),sub:'invested value'});
}

/* ---------- CSV import ---------- */
function parseCSV(t){ const rows=[]; let r=[],c='',q=false; t=t.replace(/^﻿/,'');
  for(let i=0;i<t.length;i++){ const ch=t[i]; if(q){ if(ch==='"'&&t[i+1]==='"'){ c+='"'; i++; } else if(ch==='"') q=false; else c+=ch; }
    else if(ch==='"') q=true; else if(ch===','){ r.push(c); c=''; } else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&t[i+1]==='\n') i++; r.push(c); c=''; if(r.some(x=>x!=='')) rows.push(r); r=[]; } else c+=ch; }
  r.push(c); if(r.some(x=>x!=='')) rows.push(r); return rows; }
function normDate(s){ s=String(s||'').trim(); if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0,10); let m=/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/.exec(s); if(m){ let [_,d,mo,y]=m; if(y.length===2) y='20'+y; return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`; } const d=new Date(s); return isNaN(d)?'':NS.iso(d); }
async function importCSV(tbl,file){
  const mod=MOD[tbl]; let rows; try{ rows=parseCSV(await file.text()); }catch(e){ return NS.toast('Could not read that file','err'); }
  if(rows.length<2) return NS.toast('The file has no data rows','err');
  const head=rows[0].map(h=>h.trim().toLowerCase()); const idx=(...n)=>head.findIndex(h=>n.includes(h));
  const iD=idx('date','day'),iA=idx('amount','amt','value','debit','credit'),iN=idx(tbl==='income'?'source':'description','description','source','name','narration','details','particulars'),iC=idx('category','type'),iM=idx('mode','paid with','payment mode'),iNt=idx('notes','note','remarks');
  if(iA<0||iD<0) return NS.toast('CSV needs at least "date" and "amount" columns','err',5000);
  const cats=mod.cats; const out=[]; let skipped=0;
  rows.slice(1).forEach(r=>{ const amt=Math.abs(Number(String(r[iA]).replace(/[^\d.\-]/g,''))); const date=normDate(r[iD]); if(!amt||!date){ skipped++; return; }
    const cat=cats.find(c=>c.toLowerCase()===String(r[iC]||'').trim().toLowerCase())||'Other'; const txt=(iN>=0?r[iN]:'')||'Imported';
    out.push(tbl==='income'?{date,source:txt,category:cat,amount:amt,recurring:'No',endDate:'',notes:iNt>=0?r[iNt]:''}:{date,description:txt,category:cat,amount:amt,mode:MODE.find(x=>iM>=0&&x.toLowerCase()===String(r[iM]).toLowerCase())||'Other',recurring:'No',endDate:'',notes:iNt>=0?r[iNt]:''}); });
  if(!out.length) return NS.toast('No valid rows found','err');
  const ok=await NS.confirm({title:'Import '+out.length+' '+mod.title.toLowerCase()+' entries?',text:`Found <b>${out.length}</b> valid rows${skipped?` (${skipped} skipped)`:''}, totalling <b>${M(NS.sum(out,r=>r.amount))}</b>. They will be added to your sheet.`,ok:'Import'}); if(!ok) return;
  try{ await store().addMany(tbl,out); NS.toast(out.length+' entries imported'); NS.refresh(); }catch(e){ NS.toast(e.message,'err',5000); }
}

/* ---------- goals ---------- */
function goalsPage(el){
  const gs=store().get('goals'); const tot=NS.sum(gs,g=>g.target), sv=NS.sum(gs,g=>g.saved);
  const info=g=>{ const p=g.target?Math.min(100,g.saved/g.target*100):0; const d=g.deadline?NS.parseISO(g.deadline):null; let need=null,left=null;
    if(d&&g.saved<g.target){ left=Math.max(0,(d.getFullYear()-new Date().getFullYear())*12+d.getMonth()-new Date().getMonth()); need=left>0?(g.target-g.saved)/left:g.target-g.saved; } return {p,d,need,left,done:g.saved>=g.target}; };
  el.innerHTML=`<div class="tools" style="justify-content:space-between"><div class="muted" style="font-weight:600">${gs.length?`${gs.filter(g=>g.saved>=g.target).length} of ${gs.length} goals achieved`:'Dream it, then fund it.'}</div><button class="btn btn-primary" id="add">${ic('plus')} New goal</button></div>
  ${gs.length?`<div class="grid g3 stats3" style="margin-bottom:1.2rem"><div class="card kpi hero"><div class="lb"><span class="ic">${ic('target')}</span>Total target</div><div class="v">${M(tot)}</div><div class="d" style="color:rgba(246,246,233,.65)">${gs.length} goals</div></div><div class="card kpi"><div class="lb"><span class="ic">${ic('coin')}</span>Saved so far</div><div class="v">${M(sv)}</div><div class="d"><span class="badge good">${tot?(sv/tot*100).toFixed(0):0}% funded</span></div></div><div class="card kpi"><div class="lb"><span class="ic">${ic('clock')}</span>Still to save</div><div class="v">${M(Math.max(0,tot-sv))}</div></div></div>
  <div class="goal-grid">${gs.map(g=>{ const x=info(g); const R=44,C=2*Math.PI*R; return `<div class="card goal ${x.done?'done':''}" data-id="${g.id}"><div class="goal-top"><svg viewBox="0 0 110 110" width="96" height="96"><circle cx="55" cy="55" r="${R}" fill="none" stroke="var(--surface-3)" stroke-width="11"/><circle class="gr" cx="55" cy="55" r="${R}" fill="none" stroke="${x.done?'var(--good)':'var(--orange)'}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${C*x.p/100} ${C}" transform="rotate(-90 55 55)"/><text x="55" y="61" text-anchor="middle" class="gp">${x.done?'✓':Math.round(x.p)+'%'}</text></svg>
    <div><h3>${esc(g.name)}</h3><div class="muted num" style="font-weight:700;margin-top:.3rem">${M(g.saved)} <span class="faint">of ${M(g.target)}</span></div>${x.done?'<span class="badge good" style="margin-top:.5rem">Achieved 🎉</span>':x.d?`<div class="small muted" style="margin-top:.5rem">${NS.fmtDate(x.d,{day:'numeric',month:'short',year:'numeric'})} · ${x.left} mo left</div>`:''}</div></div>
    ${x.need!==null&&!x.done?`<div class="insight" style="margin-top:1rem;box-shadow:none"><span class="ic">${ic('spark')}</span><span>Save <b>${M(x.need)}</b>/month to get there on time.</span></div>`:''}
    <div class="goal-act">${x.done?'':`<button class="btn btn-soft btn-sm" data-c>${ic('plus')} Add money</button>`}<button class="btn btn-icon" data-e title="Edit">${ic('edit')}</button><button class="btn btn-icon" data-d title="Delete">${ic('trash')}</button></div></div>`; }).join('')}</div>`
  :`<div class="card"><div class="empty">${ic('target')}<h4>No goals yet</h4><p>A trip, an emergency fund, a new laptop — track progress and see how much to save each month.</p><button class="btn btn-primary" style="margin-top:1rem" id="add2">${ic('plus')} Create your first goal</button></div></div>`}`;
  $('#add',el).onclick=()=>NS.openForm('goals'); const a2=$('#add2',el); if(a2) a2.onclick=()=>NS.openForm('goals');
  NS.$$('.goal',el).forEach(c=>{ const g=gs.find(x=>x.id===c.dataset.id);
    const add=$('[data-c]',c); if(add) add.onclick=async()=>{ const left=Math.max(0,g.target-g.saved); const v=await promptAmount('Add to “'+g.name+'”',left,'Amount'); if(!v) return; try{ await store().update('goals',{...g,saved:g.saved+v}); NS.toast(g.saved+v>=g.target?'Goal achieved! 🎉':'Added to your goal'); NS.refresh(); }catch(e){ NS.toast(e.message,'err'); } };
    $('[data-e]',c).onclick=()=>NS.openForm('goals',g);
    $('[data-d]',c).onclick=async()=>{ if(!await NS.confirm({title:'Delete this goal?',text:'It will be removed from your Google Sheet too.',ok:'Delete',danger:true})) return; try{ await store().remove('goals',g); NS.toast('Deleted'); NS.refresh(); }catch(e){ NS.toast(e.message,'err'); } }; });
}

/* ---------- calculators ---------- */
let ctab='emi';
function calculators(el){
  const tabs=[['emi','EMI / Loan'],['sip','SIP & Investing'],['goal','Savings goal']];
  el.innerHTML=`<div class="tools"><div class="seg-ctl" id="ct">${tabs.map(([k,l])=>`<button data-t="${k}" class="${ctab===k?'on':''}">${l}</button>`).join('')}</div></div><div class="calc"><div class="card" id="cin"></div><div class="card" id="cout"></div></div>`;
  NS.$$('#ct button',el).forEach(b=>b.onclick=()=>{ ctab=b.dataset.t; calculators(el); });
  const sl=(id,l,min,max,step,v)=>`<div class="sl"><div class="top-r"><span>${l}</span><input class="inp" id="n_${id}" type="number" value="${v}" step="${step}"></div><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"></div>`;
  const cin=$('#cin',el), cout=$('#cout',el);
  const bind=(ids,fn)=>{ ids.forEach(id=>{ const r=$('#'+id,el),n=$('#n_'+id,el); const paint=()=>r.style.setProperty('--p',((r.value-r.min)/(r.max-r.min)*100)+'%'); paint();
    r.oninput=()=>{ n.value=r.value; paint(); fn(); }; n.oninput=()=>{ r.value=n.value; paint(); fn(); }; }); fn(); };
  if(ctab==='emi'){
    cin.innerHTML=`<h3 style="margin-bottom:1.2rem">Loan details</h3>${sl('P','Loan amount',50000,20000000,50000,2500000)}${sl('r','Interest rate (% p.a.)',1,24,.1,8.5)}${sl('n','Tenure (months)',6,360,6,240)}`;
    bind(['P','r','n'],()=>{ const P=+$('#n_P',el).value,r=+$('#n_r',el).value,n=+$('#n_n',el).value; const e=NS.calc.emi(P,r,n), tot=e*n, int=tot-P;
      const pts=[...Array(Math.ceil(n/12)+1)].map((_,i)=>NS.calc.balance(P,r,n,Math.min(n,i*12)));
      cout.innerHTML=`<div class="res"><div class="big"><small>Monthly EMI</small><b>${M(e)}</b></div><div><small>Total interest</small><b>${M(int)}</b></div><div><small>Total payable</small><b>${M(tot)}</b></div></div>
      <div class="row-flex" style="margin-bottom:1rem"><div id="d1"></div><div class="legend"><div><i style="background:var(--c2)"></i><span>Principal</span><span>${(P/tot*100).toFixed(0)}%</span></div><div><i style="background:var(--c1)"></i><span>Interest</span><span>${(int/tot*100).toFixed(0)}%</span></div></div></div>
      <h4 style="margin:1rem 0 .4rem">Balance over time</h4><div id="l1"></div>`;
      NS.chartDonut($('#d1',el),[{label:'Principal',value:P,color:'var(--c2)'},{label:'Interest',value:int,color:'var(--c1)'}],{center:NS.compact(tot),sub:'total',size:170});
      NS.chartLine($('#l1',el),pts.map((_,i)=>'Y'+i),[{name:'Balance',color:'var(--orange)',values:pts}],{h:200}); });
  } else if(ctab==='sip'){
    cin.innerHTML=`<h3 style="margin-bottom:1.2rem">Invest regularly</h3>${sl('m','Monthly investment',500,200000,500,15000)}${sl('r','Expected return (% p.a.)',1,30,.5,12)}${sl('y','Years',1,40,1,15)}${sl('s','Yearly step-up (%)',0,25,1,5)}<p class="muted" style="font-size:.8rem">Returns are illustrative, not guaranteed.</p>`;
    bind(['m','r','y','s'],()=>{ const m=+$('#n_m',el).value,r=+$('#n_r',el).value,y=+$('#n_y',el).value,s=+$('#n_s',el).value; const rows=NS.calc.sipFV(m,r,y,s); const L=rows[rows.length-1]||{inv:0,fv:0};
      cout.innerHTML=`<div class="res"><div><small>Invested</small><b>${M(L.inv)}</b></div><div><small>Gains</small><b class="pos">${M(L.fv-L.inv)}</b></div><div class="big"><small>Future value</small><b>${M(L.fv)}</b></div></div><div class="row-flex" style="gap:1rem;font-size:.8rem;font-weight:700;margin-bottom:.4rem"><span><i class="dot" style="color:var(--orange)"></i> Value</span><span><i class="dot" style="color:var(--c2)"></i> Invested</span></div><div id="l2"></div>`;
      NS.chartLine($('#l2',el),rows.map(x=>'Y'+x.y),[{name:'Value',color:'var(--orange)',values:rows.map(x=>x.fv)},{name:'Invested',color:'var(--c2)',values:rows.map(x=>x.inv)}],{h:280}); });
  } else {
    cin.innerHTML=`<h3 style="margin-bottom:1.2rem">Your goal</h3>${sl('t','Target amount',50000,50000000,50000,2000000)}${sl('y','Years to reach it',1,30,1,8)}${sl('r','Expected return (% p.a.)',0,20,.5,10)}${sl('l','Already saved',0,10000000,10000,200000)}`;
    bind(['t','y','r','l'],()=>{ const t=+$('#n_t',el).value,y=+$('#n_y',el).value,r=+$('#n_r',el).value,l=+$('#n_l',el).value; const need=NS.calc.goalMonthly(t,r,y,l); const inc=NS.sum(NS.expandTx('income').filter(x=>x.date>=NS.iso(mon(new Date(),-2))),x=>x.amount)/3;
      cout.innerHTML=`<div class="res"><div class="big"><small>Save per month</small><b>${M(need)}</b></div><div><small>Over ${y} years</small><b>${M(need*y*12)}</b></div><div><small>Growth helps</small><b class="pos">${M(Math.max(0,t-l-need*y*12))}</b></div></div>
      ${inc?`<div class="insight"><span class="ic">${ic('target')}</span><span>That's about <b>${(need/inc*100).toFixed(0)}%</b> of your average monthly income (${M(inc)}).</span></div>`:''}`; });
  }
}

/* ---------- settings ---------- */
function settings(el){
  const u=NS.auth.user; let budgets={}; try{ budgets=JSON.parse(NS.store.setting('budgets','{}')); }catch(e){}
  const nOn=NS.notify.enabled();
  el.innerHTML=`<div class="set-grid"><div style="display:flex;flex-direction:column;gap:1.2rem">
    <div class="card"><div class="card-h"><h3>Profile & preferences</h3></div>
      <div class="me" style="margin-bottom:1rem"><div class="av" style="width:56px;height:56px;font-size:1.1rem">${u.picture?`<img src="${esc(u.picture)}" referrerpolicy="no-referrer">`:NS.initials(u.name)}</div><div style="min-width:0"><div style="font-weight:800;font-size:1.1rem">${esc(u.name)}</div><div class="muted" style="word-break:break-all">${esc(u.email)}</div></div></div>
      <div class="set-row"><div><div class="t">Install as an app</div><div class="s">${NS.isStandalone()?'Already installed on this device ✓':'Add Nano Wealth to your home screen — opens full-screen like a normal app'}</div></div>${NS.isStandalone()?'':`<button class="btn btn-primary btn-sm" id="inst">Install</button>`}</div>
      <div class="set-row"><div><div class="t">Currency</div><div class="s">Used across the dashboard</div></div><select class="sel" id="cur" style="width:auto">${CUR.map(c=>`<option ${NS.currency===c?'selected':''}>${c}</option>`).join('')}</select></div>
      <div class="set-row"><div><div class="t">Opening balance</div><div class="s">Cash you had before using Nano Wealth</div></div><input class="inp" id="ob" type="number" style="width:150px;text-align:right" value="${NS.store.setting('openingBalance',0)}"></div>
      <div class="set-row"><div><div class="t">Theme</div><div class="s">Light, dark, or follow your device</div></div><div class="seg-ctl" id="thm">${[['light','Light'],['dark','Dark'],['auto','Auto']].map(([k,l])=>`<button data-th="${k}" class="${NS.themePref()===k?'on':''}">${l}</button>`).join('')}</div></div></div>
    <div class="card"><div class="card-h"><div><h3>${ic('bell')} Reminders</h3><div class="sub">Reminders for SIPs, EMIs and bills, plus performance updates</div></div></div>
      <div class="set-row"><div><div class="t">Browser notifications</div><div class="s">${NS.notify.supported?'Alerts when you open Nano Wealth or the installed app':'Not supported in this browser'}</div></div><label class="switch"><input type="checkbox" id="nt" ${nOn?'checked':''} ${NS.notify.supported?'':'disabled'}><i></i></label></div>
      <div class="set-row"><div><div class="t">Performance updates</div><div class="s">Weekly summary, monthly report, budget alerts, goal milestones and portfolio returns — worked out on your device</div></div><label class="switch"><input type="checkbox" id="ntp" ${localStorage.getItem('ns_notif_perf')!=='0'?'checked':''}><i></i></label></div>
      <p class="muted" style="font-size:.85rem;margin-top:.8rem">For alerts <b>even when the app is closed</b>, tap the <span style="color:var(--orange)">${ic('bell')}</span> <b>Remind me</b> button on any SIP, EMI, bill or due date — it adds a repeating event with an alarm to Google Calendar (or any calendar app).</p></div>
    <div class="card"><div class="card-h"><div><h3>Monthly budgets</h3><div class="sub">Leave blank for no budget</div></div></div>${['Food','Transport','Shopping','Entertainment','Utilities','Health','Travel','Subscriptions'].map(c=>`<div class="bud"><label style="font-weight:700">${c}</label><input class="inp" data-b="${c}" type="number" min="0" placeholder="—" value="${budgets[c]||''}"></div>`).join('')}<button class="btn btn-primary" id="saveB" style="margin-top:.6rem">Save budgets</button></div>
  </div><div style="display:flex;flex-direction:column;gap:1.2rem">
    <div class="card"><div class="card-h"><div><h3>${ic('shield')} Data & privacy</h3><div class="sub">Where your data lives and who can see it</div></div></div>
      <p class="muted" style="margin-bottom:1rem">Your data is stored in a Google Sheet <b>created by you, in your own Drive</b>. Nano Wealth only has permission for that one file.</p>
      <div id="perms"><div class="skel" style="height:56px"></div></div>
      <div class="set-row"><div><div class="t">Auto-lock sheet access</div><div class="s">On every sign-in, remove anyone else from the sheet</div></div><label class="switch"><input type="checkbox" id="al" ${NS.store.setting('autoLock','1')!=='0'?'checked':''}><i></i></label></div>
      <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.8rem"><button class="btn btn-soft" id="lockNow">${ic('lock')} Run access check now</button>${NS.data.sheetUrl?`<a class="btn btn-ghost" target="_blank" rel="noopener" href="${NS.data.sheetUrl}">${ic('sheet')} Open my Google Sheet</a>`:''}</div></div>
    <div class="card"><div class="card-h"><h3>Your data</h3></div>
      <div class="set-row"><div><div class="t">Export everything</div><div class="s">JSON backup of all tables</div></div><button class="btn btn-ghost btn-sm" id="exAll">${ic('download')} Export</button></div>
      ${NS.demo?`<div class="set-row"><div><div class="t">Reset demo data</div><div class="s">Start again with fresh sample data</div></div><button class="btn btn-ghost btn-sm" id="rst">${ic('refresh')} Reset</button></div>`:''}
      <div class="set-row"><div><div class="t" style="color:var(--bad)">Delete my Nano Wealth account</div><div class="s">Removes you from the member list. Your Google Sheet stays in your Drive.</div></div><button class="btn btn-danger btn-sm" id="delAcc">Delete</button></div></div>
  </div></div>`;
  const sv=async(k,v,msg)=>{ try{ await store().setSetting(k,v); NS.toast(msg||'Saved'); }catch(e){ NS.toast(e.message,'err'); } };
  $('#cur',el).onchange=async e=>{ NS.currency=e.target.value; localStorage.setItem('ns_currency',NS.currency); await sv('currency',NS.currency,'Currency updated'); };
  const ntp=$('#ntp',el); if(ntp) ntp.onchange=e=>{ localStorage.setItem('ns_notif_perf',e.target.checked?'1':'0'); NS.toast(e.target.checked?'Performance updates on':'Performance updates off'); };
  const ib=$('#inst',el); if(ib) ib.onclick=()=>NS.install();
  $('#ob',el).onchange=e=>sv('openingBalance',e.target.value||0);
  NS.$$('#thm button',el).forEach(b=>b.onclick=()=>{ NS.setTheme(b.dataset.th); NS.$$('#thm button',el).forEach(x=>x.classList.toggle('on',x===b)); });
  $('#nt',el).onchange=async e=>{ if(e.target.checked){ const p=await NS.notify.enable(); if(p!=='granted'){ e.target.checked=false; NS.toast('Notifications are blocked — allow them in your browser’s site settings','err',5000); } else { NS.toast('Notifications on'); NS.notify.show('Nano Wealth reminders are on','You’ll get alerts for SIPs, EMIs and dues.'); } } else { NS.notify.disable(); NS.toast('Notifications off'); } };
  $('#al',el).onchange=e=>sv('autoLock',e.target.checked?'1':'0');
  $('#saveB',el).onclick=()=>{ const b={}; NS.$$('[data-b]',el).forEach(i=>{ if(Number(i.value)>0) b[i.dataset.b]=Number(i.value); }); sv('budgets',JSON.stringify(b),'Budgets saved'); };
  $('#exAll',el).onclick=()=>{ NS.download('nanospend-backup.json',store().exportAll(),'application/json'); NS.toast('Backup downloaded'); };
  const rst=$('#rst',el); if(rst) rst.onclick=async()=>{ if(await NS.confirm({title:'Reset demo data?',text:'This replaces everything with fresh sample data.',ok:'Reset'})){ store().resetDemo(); location.reload(); } };
  $('#delAcc',el).onclick=async()=>{ if(!await NS.confirm({title:'Delete your account?',text:'You will be removed from Nano Wealth’s member list and signed out. Your Google Sheet is not deleted — it remains in your Drive.',ok:'Delete account',danger:true})) return; try{ await NS.registry.deleteMe(); await NS.auth.signOut(); location.href=NS.cfg.BASE; }catch(e){ NS.toast(e.message,'err'); } };
  const drawPerms=async(res)=>{ const box=$('#perms',el); try{ const p=res?res.permissions:await store().audit(); const others=p.filter(x=>x.role!=='owner');
    box.innerHTML=p.map(x=>`<div class="perm">${ic(x.role==='owner'?'user':'users')}<span style="flex:1;min-width:0;word-break:break-all">${esc(x.emailAddress||x.type)}</span><span class="badge ${x.role==='owner'?'good':'bad'}">${x.role==='owner'?'Owner (you)':x.role}</span></div>`).join('')+`<div class="perm" style="background:${others.length?'var(--bad-bg)':'var(--good-bg)'};color:${others.length?'var(--bad)':'var(--good)'}">${ic(others.length?'alert':'shield')}<span>${others.length?others.length+' other '+(others.length>1?'accounts have':'account has')+' access':'Only you can open this sheet'}</span></div>`; }catch(e){ box.innerHTML=`<div class="perm">${ic('alert')} Couldn't read permissions: ${esc(e.message)}</div>`; } };
  drawPerms();
  $('#lockNow',el).onclick=async e=>{ const b=e.currentTarget; b.disabled=true; try{ const r=await store().lockdown(); NS.toast(r.removed?`Removed ${r.removed} other ${r.removed>1?'accounts':'account'} from your sheet`:'Verified — only you have access'); drawPerms(r); }catch(err){ NS.toast(err.message,'err'); } b.disabled=false; };
}

NS.views={dashboard,calculators,settings,goals:goalsPage,income:el=>modulePage(el,'income'),expenses:el=>modulePage(el,'expenses'),investments:el=>modulePage(el,'investments'),loans:el=>modulePage(el,'loans'),debts:el=>modulePage(el,'debts')};
NS.viewMeta={dashboard:['Dashboard','Your complete money picture','dashboard'],income:['Income','Salary, business and every payment in','income'],expenses:['Expenses','See where your money goes','expense'],investments:['Investments','SIPs, RDs and your portfolio','invest'],loans:['Loans','EMIs, balances and payoff progress','loan'],debts:['Debts','Cards, borrowings and money lent','debt'],goals:['Goals','Save towards what matters','target'],calculators:['Calculators','Plan EMIs, SIPs and goals','calc'],settings:['Settings','Profile, reminders, budgets, privacy','settings']};
})();
