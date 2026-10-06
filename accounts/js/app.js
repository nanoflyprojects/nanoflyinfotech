/* NanoFly InfoTech Accounts – portal logic */
let TOKEN=sessionStorage.getItem('nf_tok')||'',ME={},ROLE='',SCHEMA={},BACKEND_OK=true,D=null,FY='all',charts=[],USERS=[],MENUS=[],LISTS=[],TEAM_OK=false,PAY_OK=false;
/* FY = reporting period used by every list and report: 'all' | '2026' (Jan–Dec) | '2026-10' (one month) */
const R={v:'dashboard',p:'',t:''};            // current route
const F={};                                   // filters per page

/* ---------- Icons (24px stroke) ---------- */
const IC={
 home:'<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.5 3.5 5.2"/>',
 folder:'<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
 invoice:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
 quote:'<path d="M5 4h14v16H5z"/><path d="M8 9h8M8 13h5"/><path d="m14 17 2 2 3-4"/>',
 wallet:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/><circle cx="16.5" cy="14.5" r="1.2"/>',
 out:'<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 21h16"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',
 phone:'<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
 chat:'<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.7A8 8 0 1 1 21 12z"/>',
 mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.3 3 14.7 0 18M12 3c-3 3.3-3 14.7 0 18"/>',
 print:'<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 team:'<circle cx="12" cy="8" r="3"/><circle cx="5.5" cy="10" r="2.2"/><circle cx="18.5" cy="10" r="2.2"/><path d="M7 20c.4-3.3 2.4-5 5-5s4.6 1.7 5 5"/><path d="M1.5 19c.2-2.4 1.6-3.7 4-3.9M22.5 19c-.2-2.4-1.6-3.7-4-3.9"/>',
 building:'<path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M14 9h5a1 1 0 0 1 1 1v11"/><path d="M3 21h18"/><path d="M8 8h2M8 12h2M8 16h2"/>',
 task:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 8M8 15l1.5 1.5L12 14M14.5 9.5H17M14.5 15.5H17"/>',
 coins:'<ellipse cx="9" cy="7" rx="6" ry="2.8"/><path d="M3 7v4c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8V7"/><path d="M9 16.6c0 1.5 2.7 2.8 6 2.8s6-1.3 6-2.8v-4c0-1.5-2.7-2.8-6-2.8"/>'
};
const ico=(k,cls='icon')=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[k]||''}</svg>`;
const NAV=[['dashboard','Dashboard','home'],['clients','Clients','users'],['organizations','Organization','building'],['projects','Projects','folder'],['work','Work tracker','task'],['team','Team','team'],['invoices','Invoices','invoice'],['quotations','Quotations','quote'],['payments','Payments','wallet'],['expenses','Expenses','out'],['reports','Reports','chart'],['settings','Settings','gear']];
const TITLES={dashboard:'Dashboard',clients:'Clients',client:'Client',organizations:'Organization',organization:'Organization',projects:'Projects',work:'Work tracker & team pay',team:'Team',member:'Team member',invoices:'Invoices',quotations:'Quotations',payments:'Payments & receipts',expenses:'Expenses',reports:'Reports',settings:'Settings'};

const PAYTYPES=['Task-Based','Weekly'];
const REASONS=['Specialized Task','Weekly Work Payment','Additional Work','Overtime','Urgent Work','Performance / Incentive','Advance Payment','Correction / Adjustment','Other'];
const STRUCTS=['Profit share','Fixed return %','Fixed amount','Manual'];
const FREQS=['Monthly','Quarterly','Half-yearly','Yearly','One-time','Per project'];
const OPTS={Category:['Meta Ads','Google Ads','SEO & Maintenance','Team','Hosting/Domain','Other'],Platform:['Google','Meta'],Kind:['Expense','Asset'],Mode:['UPI','GPay','Bank Transfer','Cash','Cheque'],Investor:['Investor 1','Investor 2'],Result:['Running','Completed','Killed'],Type:['Social Media','Website','Ads Campaign','SEO','Training','Other'],
  PayType:PAYTYPES,Reason:REASONS,Structure:STRUCTS,Frequency:FREQS};
const STATUS={Projects:['Active','Completed','On Hold','Cancelled'],Content:['Pending','Paid'],TeamPay:['Paid','Pending'],Payouts:['Paid','Partly paid','Pending'],InvestorPlans:['Active','Closed']};
const DOCSTATUS={Invoice:['Issued','Cancelled'],Quotation:['Draft','Sent','Accepted','Rejected']};
const ORG_COLS=['ID','Name','Client','BillingName','Contact','Phone','Email','Website','City','GSTIN','Address','Notes'];
const NUMK=['Budget','HandsOn','Inv1Pct','Amount','GST','Total','Rate','Investment','Payable'];
const LABEL={Investor1:'Investor 1 (team member)',Investor2:'Investor 2 (team member)',JoinDate:'Joined on',Role:'Role / designation',HandsOn:'Hands-on (team share)',Inv1Pct:'Investor 1 share %',PaidTo:'Paid to',DesignedBy:'Designed by',AdSet:'Ad set',PaymentDate:'Payment date',StartDate:'Start date',EndDate:'End date',PaidFor:'Paid for',Rate:'Rate (₹)',GST:'GST 18%',
  BillingName:'Billing name on documents (Enter = new line)',GSTIN:'GSTIN',InvoiceNo:'Against invoice',ReceiptNo:'Receipt no.',No:'No.',ValidDate:'Valid till',Budget:'Project value (₹)',Amount:'Amount (₹)',Total:'Total (₹)',Name:'Client name (short)',Project:'Project name',Kind:'Type (an Asset is not deducted from profit)',FundedBy:'Settled by (for assets)',OldNo:'Old number',OldReceiptNo:'Old receipt no.',FromDate:'Period from',ToDate:'Period to',Payable:'Amount payable (₹)',Investment:'Investment amount (₹)',InvestDate:'Invested on',Structure:'Payout / return structure',Frequency:'Payout period',PayType:'Payment type',Member:'Team member',ReasonOther:'Reason (type it)'};
/* labels that differ per sheet */
const FLABEL={Payouts:{Member:'Investor',Plan:'Payout structure',Project:'Project (for profit-share payouts)',Amount:'Amount paid (₹)',Date:'Payment date',Payable:'Amount payable for this period (₹)',Status:'Payment status'},
  InvestorPlans:{Investor:'Investor (team member)',Rate:'Rate – % for Fixed return, ₹ for Fixed amount',StartDate:'Payouts start from',EndDate:'Ends on (optional)'},Content:{Content:'Task / work item',Rate:'Task amount / rate (₹)',PaymentDate:'Paid on',Status:'Payment status'}};
const lbl=k=>LABEL[k]||k.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,c=>c.toUpperCase());

/* ---------- Utilities ---------- */
const $=id=>document.getElementById(id);
const main=h=>{$('main').innerHTML=h};
const inr=n=>(n<0?'-':'')+'₹'+Math.abs(+n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const sum=(a,k)=>a.reduce((s,x)=>s+(+x[k]||0),0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const js=s=>esc(JSON.stringify(String(s??'')));          // safe string inside onclick="…"
const fmtD=d=>d?new Date(String(d).slice(0,10)+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'';
const dmy=d=>d?String(d).slice(0,10).split('-').reverse().join('/'):'';
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
const addMonths=(d,n)=>{const x=new Date(String(d||today()).slice(0,10)+'T00:00:00');x.setMonth(x.getMonth()+n);return new Date(x-x.getTimezoneOffset()*6e4).toISOString().slice(0,10)};
const daysSince=d=>d?Math.floor((new Date(today()+'T00:00:00')-new Date(String(d).slice(0,10)+'T00:00:00'))/864e5):0;
const monthName=m=>new Date(m+'-01T00:00:00').toLocaleDateString('en-IN',{month:'long',year:'numeric'});
const fyOf=d=>d?String(d).slice(0,4):'';            // calendar year (Jan – Dec)
const inPer=(r,p)=>!p||p==='all'||String(r.Date||r.StartDate||r.InvestDate||'').startsWith(p);   // p = 'all' | 'YYYY' | 'YYYY-MM'
const inFY=r=>inPer(r,FY);
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const perLabel=p=>!p||p==='all'?'All time':p.length===4?p+' (Jan – Dec)':monthName(p);
const iso=x=>new Date(x-x.getTimezoneOffset()*6e4).toISOString().slice(0,10);
const adm=()=>ROLE==='admin';
const isAsset=e=>/^asset/i.test(String(e.Kind||''));     // company assets (domain, laptop…) are paid by investors / project fund, never deducted from profit
const opEx=a=>a.filter(e=>!isAsset(e));
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove('show'),2600)}
/* Period picker: Year (All years / 2026 / 2025…) + Month (Whole year / Jan…Dec). fn = setFY or setDash */
function perYears(){
  const ys=new Set([today().slice(0,4)]);
  ['Projects','Docs','Payments','Expenses','CompanyExp','Content','TeamPay','Payouts','Ads','Recharges'].forEach(k=>(D[k]||[]).forEach(r=>{const y=String(r.Date||r.StartDate||'').slice(0,4);if(/^\d{4}$/.test(y))ys.add(y)}));
  return [...ys].sort().reverse();
}
function perPicker(cur,fn){
  cur=cur||'all';const y=cur==='all'?'all':cur.slice(0,4),m=cur.length===7?cur.slice(5):'';
  return `<span class="per"><select aria-label="Year" onchange="${fn}(this.value==='all'?'all':this.value+'${m?'-'+m:''}')"><option value="all">All years</option>${perYears().map(x=>`<option value="${x}" ${x===y?'selected':''}>${x}</option>`).join('')}</select>`+
    `<select aria-label="Month" ${y==='all'?'disabled':''} onchange="${fn}(this.value?'${y}-'+this.value:'${y}')"><option value="">${y==='all'?'All months':'Whole year'}</option>${MONTHS.map((n,i)=>{const v=String(i+1).padStart(2,'0');return `<option value="${v}" ${v===m?'selected':''}>${n}</option>`}).join('')}</select></span>`;
}
function setFY(v){FY=v||'all';render()}
function setDash(v){F.dash=v;render()}

function stat(label,value,cls='',note=''){return `<div class="stat"><small>${label}</small><b class="${cls}">${value}</b>${note?`<em>${note}</em>`:''}</div>`}

/* ---------- Loader: covers the screen while the server is working ---------- */
let BUSY=0,_ldShow,_ldHide;
const LDMSG={login:'Logging in…',session:'Opening your accounts…',getData:'Loading your accounts…',saveRow:'Saving…',deleteRow:'Deleting…',saveSettings:'Saving settings…',issueReceipt:'Issuing receipt number…',markPaid:'Updating…',changePassword:'Changing password…',saveUser:'Saving user…',deleteUser:'Removing user…',restructure:'Restructuring your records… this can take a minute'};
function busy(on,msg){
  const l=$('loader');if(!l)return;
  BUSY=Math.max(0,BUSY+(on?1:-1));
  if(BUSY){clearTimeout(_ldHide);if(msg)$('ldmsg').textContent=msg;if(!l.classList.contains('on')){clearTimeout(_ldShow);_ldShow=setTimeout(()=>l.classList.add('on'),120)}}
  else{clearTimeout(_ldShow);clearTimeout(_ldHide);_ldHide=setTimeout(()=>{if(!BUSY){l.classList.remove('on');l.classList.remove('full')}},90)}
}
const QUIET=['logout','listUsers'];
async function api(fn,...args){
  const show=!QUIET.includes(fn);if(show)busy(true,LDMSG[fn]||'Working…');
  try{return await callApi(fn,...args)}finally{if(show)busy(false)}
}

/* ---------- Server ---------- */
async function callApi(fn,...args){
  if(!/^https:\/\/script\.google\.com\//.test(API_URL))throw new Error('Set API_URL in js/config.js to your Apps Script Web App URL.');
  let last='';
  for(let attempt=0;attempt<3;attempt++){
    let r,text;
    try{r=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({fn,args})});text=await r.text()}
    catch(e){last='Could not reach the server. Check your internet connection.';continue}
    let j=null;try{j=JSON.parse(text)}catch(e){}
    if(!j||typeof j!=='object'){last=`The server replied with something unexpected (status ${r.status}). If this keeps happening, check the Web App is deployed with access “Anyone”. Reply: ${text.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,120)}`;continue}
    if(j.error){const msg=String(j.error).replace(/^SESSION:\s*/,'');if(/^SESSION:/.test(j.error)&&fn!=='login')endSession(msg);throw new Error(msg)}
    if(!('result' in j))throw new Error('The server did not send any data for “'+fn+'”. Deploy a new version of the Apps Script (Deploy → Manage deployments → Edit → New version). Reply: '+text.slice(0,120));
    return j.result;
  }
  throw new Error(last);
}

/* ---------- Login & session ---------- */
async function doLogin(){
  const u=$('lu').value.trim(),pw=$('lp').value;
  if(!u||!pw){$('lerr').textContent='Enter your username and password.';return}
  $('lbtn').disabled=true;$('lbtn').textContent='Logging in…';$('lerr').textContent='';
  try{const r=await api('login',u,pw);TOKEN=r.token;sessionStorage.setItem('nf_tok',TOKEN);$('lp').value='';await enter(r)}
  catch(e){$('lerr').textContent=e.message||e}
  finally{$('lbtn').disabled=false;$('lbtn').textContent='Log in'}
}
async function enter(r){
  ME=r;ROLE=r.role;SCHEMA={Organizations:ORG_COLS,...(r.schema||{})};BACKEND_OK=!!(r.schema&&r.schema.Organizations);TEAM_OK=!!(r.schema&&r.schema.Team);PAY_OK=!!(r.schema&&r.schema.TeamPay);
  $('login').hidden=true;$('app').hidden=false;
  $('uname').textContent=r.name||r.user;$('urole').textContent=adm()?'Admin':ROLE==='team'?'Team member':'View only';
  const sb=document.querySelector('.search');if(sb)sb.style.display=ROLE==='team'?'none':'';
  if(ROLE==='team'&&location.hash!=='#team')location.hash='team';
  await load();
  if(r.mustChange)changePw(true);
}
async function restore(){try{await enter(await api('session',TOKEN))}catch(e){endSession('')}}
function endSession(msg){
  sessionStorage.removeItem('nf_tok');TOKEN='';ME={};D=null;closeM();
  $('app').hidden=true;$('login').hidden=false;$('lerr').textContent=msg||'';
}
function logout(){const t=TOKEN;endSession('');if(t)api('logout',t).catch(()=>{})}

async function load(){
  if(!D)main('<div class="loading">Loading your accounts…</div>');
  try{
    const d=await api('getData',TOKEN);
    if(!d||typeof d!=='object')throw new Error('The server sent no data. Deploy a new version of the Apps Script and try again.');
    ['Clients','Organizations','Projects','Docs','Payments','Expenses','Ads','Recharges','Content','CompanyExp','Payouts','Team','TeamPay','InvestorPlans','Log'].forEach(k=>{if(!Array.isArray(d[k]))d[k]=[]});
    d.Settings=d.Settings||{};D=d;
    render();
  }catch(e){main(`<div class="notice"><b>Couldn't load your accounts.</b><br>${esc(e.message||e)}</div><button class="btn" onclick="load()">Try again</button>`)}
}

/* ---------- Lookups & calculations ---------- */
const clientNames=()=>[...new Set(D.Clients.map(c=>c.Name).concat(D.Projects.map(p=>p.Client)).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
const orgNames=()=>[...new Set(D.Organizations.map(o=>o.Name).concat(D.Projects.map(p=>p.Organization),D.Docs.map(d=>d.Organization)).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
const orgOf=name=>D.Organizations.find(o=>o.Name===name)||{Name:name||'',BillingName:name||''};
const docOrg=d=>d.Organization||(D.Projects.find(p=>p.Project===d.Project)||{}).Organization||'';
const orgsFor=client=>orgNames().filter(n=>{const c=orgOf(n).Client;return !client||!c||c===client||D.Projects.some(p=>p.Organization===n&&p.Client===client)});

/* ---------- Recent-first helpers + in-house ---------- */
const INHOUSE='In-house';
const isInhouse=c=>!String(c||'').trim()||/^in[\s-]?house$/i.test(String(c).trim());
const dkey=v=>String(v||'').slice(0,10);
const maxD=a=>a.map(dkey).filter(Boolean).sort().pop()||'';
/* newest date touching a client: its projects, invoices, quotations and payments */
function lastByClient(n){
  const pr=D.Projects.filter(p=>p.Client===n),pn=new Set(pr.map(p=>p.Project)),inv=D.Docs.filter(d=>d.Client===n),nos=new Set(inv.map(d=>d.No));
  return maxD(pr.map(p=>p.Date).concat(inv.map(d=>d.Date),D.Payments.filter(x=>pn.has(x.Project)||nos.has(x.InvoiceNo)).map(x=>x.Date)));
}
function lastByOrg(n){
  const pr=D.Projects.filter(p=>p.Organization===n),pn=new Set(pr.map(p=>p.Project)),inv=D.Docs.filter(d=>docOrg(d)===n),nos=new Set(inv.map(d=>d.No));
  return maxD(pr.map(p=>p.Date).concat(inv.map(d=>d.Date),D.Payments.filter(x=>pn.has(x.Project)||nos.has(x.InvoiceNo)).map(x=>x.Date)));
}
const recentFirst=(a,b)=>String(b.Last||'').localeCompare(String(a.Last||''))||String(a.Name).localeCompare(String(b.Name));
const clientOf=name=>D.Clients.find(c=>c.Name===name)||{Name:name||'',BillingName:name||''};
const projClient=proj=>(D.Projects.find(p=>p.Project===proj)||{}).Client||'';
const items=d=>{try{const a=JSON.parse(d.Items||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}};
const docs=t=>D.Docs.filter(d=>d.Type===t);
const payClient=p=>projClient(p.Project)||(docs('Invoice').find(d=>d.No===p.InvoiceNo)||{}).Client||'';
function invCalc(d){
  const pays=D.Payments.filter(p=>p.InvoiceNo&&p.InvoiceNo===d.No).sort((a,b)=>String(a.Date).localeCompare(b.Date));
  const paid=sum(pays,'Amount'),bal=(+d.Total||0)-paid;
  const overdue=d.Status!=='Cancelled'&&bal>0&&d.ValidDate&&d.ValidDate<today();
  const st=d.Status==='Cancelled'?'Cancelled':bal<=0?'Paid':overdue?'Overdue':paid>0?'Partly paid':'Unpaid';
  return {...d,Paid:paid,Balance:bal,State:st,pays,Title:items(d).map(x=>x.title).filter(Boolean).join(', ')};
}
/* ---------- Team payments (work tracker) ---------- */
const tids=p=>String(p.Tasks||'').split(',').map(x=>x.trim()).filter(Boolean);
const paidTP=p=>p.Status!=='Pending';
const reasonOf=p=>p.Reason==='Other'?(p.ReasonOther||'Other'):(p.Reason||'');
const periodTxt=p=>p.FromDate?(p.ToDate&&p.ToDate!==p.FromDate?fmtD(p.FromDate).replace(/ \d{4}$/,'')+' – '+fmtD(p.ToDate):fmtD(p.FromDate)):'';
function people(){return [...new Set(D.Team.map(t=>t.Name).concat(D.Content.map(c=>c.DesignedBy),D.TeamPay.map(p=>p.Member),D.Expenses.filter(e=>e.Category==='Team').map(e=>e.PaidTo)).map(x=>String(x||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b))}
/* How a work-tracker task was paid: task-based, inside a weekly payment, marked paid earlier, or not yet */
function taskPay(c){
  const L=D.TeamPay.filter(p=>tids(p).includes(String(c.ID)));
  const paid=L.filter(paidTP).sort((a,b)=>String(b.Date).localeCompare(a.Date))[0],pend=L.find(p=>!paidTP(p));
  if(paid){const t=paid.PayType==='Task-Based';return {State:t?'Paid · task':'Paid · weekly',Key:t?'task':'weekly',Amt:t?+paid.Amount||0:0,PaidOn:paid.Date,Pay:paid,How:t?'Task payment '+fmtD(paid.Date):'Weekly payment'+(paid.FromDate?' · '+periodTxt(paid):'')+' · paid '+fmtD(paid.Date)}}
  if(pend)return {State:'Payment pending',Key:'pending',Amt:pend.PayType==='Task-Based'?+pend.Amount||0:0,PaidOn:'',Pay:pend,How:pend.PayType+' payment recorded as pending'};
  if(c.Status==='Paid')return {State:'Paid (earlier)',Key:'earlier',Amt:0,PaidOn:c.PaymentDate,How:'Marked paid'+(c.PaymentDate?' '+fmtD(c.PaymentDate):'')+' (before team payments)'};
  return {State:'Not paid',Key:'unpaid',Amt:0,PaidOn:'',How:+c.Rate?'Rate '+inr(c.Rate):''};
}
/* Paid team payments as project costs: to the payment's project, else split over the projects of the tasks it covers */
function teamAlloc(){
  const C={},out=[];D.Content.forEach(c=>C[c.ID]=c);
  D.TeamPay.filter(paidTP).forEach(p=>{
    const a=+p.Amount||0;if(!a)return;
    if(p.Project){out.push({ID:'tp-'+p.ID,Date:p.Date,Project:p.Project,Category:'Team payment',PaidTo:p.Member,Amount:a,Pay:p});return}
    const ts=tids(p).map(i=>C[i]).filter(c=>c&&c.Project);if(!ts.length)return;
    const by={};ts.forEach(c=>by[c.Project]=(by[c.Project]||0)+a/ts.length);
    Object.keys(by).forEach(k=>out.push({ID:'tp-'+p.ID+'-'+k,Date:p.Date,Project:k,Category:'Team payment',PaidTo:p.Member,Amount:Math.round(by[k]*100)/100,Pay:p}));
  });
  return out;
}

/* ---------- Hands-On Money: cash the company actually holds ----------
   Received from clients − project costs − team payments − company running expenses − assets paid from the project fund − investor payouts.
   Same formula as the "Hands-on" column of the old sheet (Received − Spent − investor shares paid), extended to company-level money. */
const paidPO=x=>x.Status!=='Pending';
function handsOn(p){
  const f=r=>inPer(r,p);
  const rec=sum(D.Payments.filter(f),'Amount'),proj=sum(D.Expenses.filter(f),'Amount'),team=sum(D.TeamPay.filter(paidTP).filter(f),'Amount');
  const comp=sum(opEx(D.CompanyExp).filter(f),'Amount'),fund=sum(D.CompanyExp.filter(isAsset).filter(a=>/project fund/i.test(a.FundedBy||'')).filter(f),'Amount');
  const inv=sum(D.Payouts.filter(paidPO).filter(f),'Amount');
  return {rec,proj,team,comp,fund,inv,net:rec-proj-team-comp-fund-inv};
}
function hoRows(H){return [['Received from clients',H.rec,1],['Project costs',H.proj],['Team payments',H.team],['Company running expenses',H.comp],['Assets paid from the project fund',H.fund],['Investor payouts',H.inv]].filter(r=>r[2]||r[1])
  .map(([l,v,plus])=>`<tr><td>${plus?'':'− '}${l}</td><td class="n">${inr(v)}</td></tr>`).join('')+`<tr class="tot"><td>Hands-On Money</td><td class="n ${H.net<0?'due':'in'}">${inr(H.net)}</td></tr>`}

function calc(){
  const by=a=>a.reduce((m,x)=>{(m[x.Project]=m[x.Project]||[]).push(x);return m},{});
  const pay=by(D.Payments),exp=by(D.Expenses.concat(teamAlloc())),po=by(D.Payouts.filter(paidPO)),ad=by(D.Ads);
  return D.Projects.map(p=>{
    const rec=sum(pay[p.Project]||[],'Amount'),sp=sum(exp[p.Project]||[],'Amount'),ho=+p.HandsOn||0;
    const pct=p.Inv1Pct===''?75:+p.Inv1Pct,profit=rec-sp-ho,bal=(+p.Budget||0)-rec,pos=po[p.Project]||[];
    return {...p,Received:rec,Spent:sp,Balance:bal,Profit:profit,Margin:rec?Math.round(profit/rec*100):0,
      Inv1:profit*pct/100,Inv2:profit*(100-pct)/100,
      Paid1:sum(pos.filter(x=>x.Investor==='Investor 1'),'Amount'),Paid2:sum(pos.filter(x=>x.Investor==='Investor 2'),'Amount'),
      HandsOnMoney:rec-sp-sum(pos,'Amount'),
      Age:bal>0?daysSince(p.Date):0,
      AdTracked:sum(ad[p.Project]||[],'Total'),AdBooked:sum((exp[p.Project]||[]).filter(e=>/Ads/.test(e.Category)),'Amount')};
  });
}
const wallet=()=>sum(D.Recharges,'Amount')-sum(D.Ads,'Total');

/* ---------- Routing ---------- */
function go(h){if(location.hash==='#'+h)render();else location.hash=h}
function parseRoute(){
  const h=decodeURIComponent(location.hash.slice(1)||'dashboard').split('/');
  R.v=h[0]||'dashboard';R.p=h[1]||'';R.t=h[2]||'';
  if(R.v==='client'){R.p=h.slice(1).join('/');R.t=''}
  if(R.v==='organization'){R.p=h.slice(1).join('/');R.t=''}
  if(R.v==='member'){R.p=h.slice(1).join('/');R.t=''}
  const ok=['dashboard','clients','client','organizations','organization','projects','work','team','member','invoices','quotations','payments','expenses','reports','settings'];
  if(!ok.includes(R.v))R.v='dashboard';
  if(R.v==='settings'&&!adm())R.v='dashboard';
  if(ROLE==='team')R.v='team';                 // team logins only ever see their own Team page
}
addEventListener('hashchange',()=>{if(D){render();scrollTo(0,0)}});

/* ---------- Shell ---------- */
function render(){
  if(!D)return;
  parseRoute();closeMenus();
  charts.forEach(c=>c.destroy());charts=[];MENUS=[];LISTS=[];
  const due=docs('Invoice').map(invCalc).filter(d=>d.State==='Overdue').length;
  const navs=ROLE==='team'?NAV.filter(n=>n[0]==='team'):NAV.filter(n=>n[0]!=='settings'||adm());
  $('nav').innerHTML=navs.map(([k,l,i])=>`<a href="#${k}" class="${(R.v===k||(R.v==='client'&&k==='clients')||(R.v==='organization'&&k==='organizations')||(R.v==='member'&&k==='team'))?'on':''}">${ico(i)}<span>${ROLE==='team'&&k==='team'?'My projects':l}</span>${k==='invoices'&&due?`<em class="count">${due}</em>`:''}</a>`).join('');
  const tb=ROLE==='team'?[['team','My projects','team']]:[['dashboard','Home','home'],['clients','Clients','users'],['invoices','Invoices','invoice'],['payments','Payments','wallet']];
  $('tabbar').innerHTML=tb.map(([k,l,i])=>`<a href="#${k}" class="${(R.v===k||(R.v==='client'&&k==='clients'))?'on':''}">${ico(i)}${l}</a>`).join('')+
    `<button class="${['organizations','organization','projects','work','team','member','quotations','expenses','reports','settings'].includes(R.v)?'on':''}" onclick="moreSheet()">${ico('more')}More</button>`;
  const pageT=(R.v==='client'||R.v==='organization'||R.v==='member')?R.p:(ROLE==='team'?'My projects':TITLES[R.v]);
  $('ptitle').textContent=pageT;
  // period filter (All / Year / Month) for lists; the dashboard and reports carry their own picker
  $('fy').innerHTML=ROLE==='team'?'':perPicker(FY,'setFY');
  $('fy').style.display=['dashboard','reports','settings','client','organization'].includes(R.v)||ROLE==='team'?'none':'';
  document.title=pageT+' – NanoFly InfoTech Accounts';
  buildNewMenu();
  ({dashboard,clients,client:clientPage,organizations,organization:organizationPage,projects,work,team,member:memberRoute,invoices,quotations,payments,expenses,reports,settings})[R.v]();
}
function moreSheet(){
  openSheet('More',`<div class="quick full">${(ROLE==='team'?[]:[['organizations','Organization','building'],['projects','Projects','folder'],['work','Work tracker','task'],['team','Team','team'],['quotations','Quotations','quote'],['expenses','Expenses','out'],['reports','Reports','chart']]).concat(adm()?[['settings','Settings','gear']]:[]).map(([k,l,i])=>`<button onclick="closeM();go('${k}')">${ico(i)}${l}</button>`).join('')}
    ${installBtn('',true)}<button onclick="closeM();changePw()">${ico('gear')}Change password</button><button onclick="closeM();logout()">${ico('back')}Log out</button></div>
    <p class="hint">Logged in as ${esc(ME.name||ME.user)} (${adm()?'admin':ROLE==='team'?'team member':'view only'}).</p>`,null);
}
function buildNewMenu(){
  $('newbtn').parentElement.hidden=!adm();
  $('newmenu').innerHTML=[['invoice','Invoice',"newDoc('Invoice')"],['wallet','Payment received',"edit('Payments')"],['quote','Quotation',"newDoc('Quotation')"],['users','Client',"edit('Clients')"],['building','Organization',"edit('Organizations')"],['folder','Project',"edit('Projects')"],['out','Project expense',"edit('Expenses')"],['out','Company expense',"edit('CompanyExp',null,{Kind:'Expense'},'Add company expense')"],['building','Company asset',"newAsset()"],
    ['task','Work item (task)',"edit('Content')"],['coins','Team payment',"payTeam()"],['team','Investor payout',"edit('Payouts')"]]
    .map(([i,l,f])=>`<button onclick="closeMenus();${f}">${ico(i)}${l}</button>`).join('');
}
function toggleNew(e){e.stopPropagation();const m=$('newmenu'),h=m.hidden;closeMenus();m.hidden=!h}
function closeMenus(){$('newmenu')&&($('newmenu').hidden=true);document.querySelectorAll('.rowmenu').forEach(m=>m.remove());$('qres')&&($('qres').hidden=true)}
document.addEventListener('click',e=>{if(!e.target.closest('.menu,.newwrap,.more,.search'))closeMenus()});
addEventListener('scroll',()=>{const t=document.querySelector('.top');if(t)t.classList.toggle('scrolled',scrollY>4)},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenus();if(!$('modal').hidden)closeM()}
  if(e.key==='/'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)&&D){e.preventDefault();$('q').focus()}});

/* ---------- Search ---------- */
function search(q){
  const box=$('qres');q=q.trim().toLowerCase();
  if(q.length<2||!D){box.hidden=true;return}
  const hit=s=>String(s||'').toLowerCase().includes(q),res=[];
  clientNames().forEach(n=>{const c=clientOf(n);if(hit(n)||hit(c.BillingName)||hit(c.Phone))res.push([`client/${n}`,n,'Client'])});
  orgNames().forEach(n=>{const o=orgOf(n);if(hit(n)||hit(o.BillingName)||hit(o.Phone)||hit(o.Contact))res.push([`organization/${n}`,n,'Organization'+(o.Client?' · '+o.Client:'')])});
  D.Projects.forEach(p=>{if(hit(p.Project))res.push([`client/${p.Client}`,p.Project,'Project · '+p.Client])});
  D.Docs.forEach(d=>{if(hit(d.No)||hit(d.Client)||items(d).some(i=>hit(i.title)))res.push([d.Type==='Invoice'?'invoices':'quotations',`${d.No} – ${d.Client}`,d.Type+' · '+inr(d.Total),d.ID])});
  D.Payments.forEach(p=>{if(hit(p.ReceiptNo)||hit(p.InvoiceNo)||String(p.Amount)===q.replace(/[₹,\s]/g,''))res.push(['payments',`${inr(p.Amount)} on ${fmtD(p.Date)}`,'Payment · '+payClient(p)])});
  box.innerHTML=res.length?res.slice(0,14).map(([h,t,s,id])=>`<a href="#${esc(h)}" onclick="closeMenus();$('q').value='';${id?`setTimeout(()=>printDoc('${id}'),50)`:''}"><span>${esc(t)}</span><small>${esc(s)}</small></a>`).join(''):'<p>No matches.</p>';
  box.hidden=false;
}

/* ---------- Tables ---------- */
// cols: [key,label,type,opts]  type: text|money|date|pill|num|pct
function table(rows,cols,opt={}){
  const id=LISTS.push({rows,cols,opt})-1;
  if(!rows.length)return `<div class="empty">${opt.empty||'Nothing here yet.'}</div>`;
  const head=cols.map(([k,l,t],i)=>`<th class="${/money|num|pct/.test(t)?'n':''}" onclick="srt(this,${i})">${l}</th>`).join('')+(opt.act?'<th></th>':'');
  const body=rows.map((r,ri)=>{
    const href=opt.href?opt.href(r):'';
    return `<tr class="${href?'click':''}" ${href?`onclick="if(!event.target.closest('button,a'))go(${js(href)})"`:''}>`+cols.map(([k,l,t,o],ci)=>cellH(r,k,l,t,o,ci===0)).join('')+(opt.act?`<td class="acts">${opt.act(r,ri)}</td>`:'')+'</tr>'}).join('');
  const tot=opt.total?`<tfoot><tr>${cols.map(([k,l,t],i)=>i===0?`<td data-label="">Total (${rows.length})</td>`:(t==='money'&&opt.total.includes(k)?`<td class="n" data-label="${esc(l)}">${inr(sum(rows,k))}</td>`:'<td></td>')).join('')}${opt.act?'<td></td>':''}</tr></tfoot>`:'';
  return `<div class="tw"><table class="t"><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${tot}</table></div>`;
}
const PILL={'Paid · task':'ok','Paid · weekly':'ok','Paid (earlier)':'ok','Not paid':'bad','Payment pending':'warn',Due:'bad',Settled:'ok',Overpaid:'warn',Closed:'','Task-Based':'',Weekly:'',Paid:'ok',Completed:'ok',Accepted:'ok',Active:'',Issued:'',Unpaid:'bad',Overdue:'bad',Rejected:'bad',Killed:'bad',Cancelled:'','Partly paid':'warn',Sent:'warn',Pending:'warn',Running:'warn','On Hold':'warn',Draft:''};
function cellH(r,k,l,t,o={},lead){
  let v=typeof k==='function'?k(r):r[k],h,s=v;
  if(t==='money'&&o&&o.blank&&!(+v)){h='';s=0}
  else if(t==='money'){const n=+v||0;h=inr(n);s=n;const cls=(o&&o.color&&n>0)?o.color:(k==='Profit'&&n<0)||(k==='Balance'&&n>0&&!(o&&o.plain))?'due':'';h=`<span class="${cls}">${h}</span>`}
  else if(t==='num'){s=+v||0;h=String(s)}
  else if(t==='pct'){s=+v||0;h=s+'%'}
  else if(t==='date'){h=fmtD(v);s=v||''}
  else if(t==='pill'){h=v?`<span class="pill ${PILL[v]??''}">${esc(v)}</span>`:''}
  else h=esc(v);
  if(o&&o.sub){const sub=typeof o.sub==='function'?o.sub(r):r[o.sub];if(sub)h+=`<span class="sub">${esc(sub)}</span>`}
  if(lead)h=`<span class="strong">${h}</span>`;
  return `<td class="${/money|num|pct/.test(t)?'n':''} ${lead?'lead':''}" data-label="${esc(l)}" data-s="${esc(s)}">${h}</td>`;
}
function srt(th,i){const tb=th.closest('table').tBodies[0],asc=th.dataset.a!=='1';th.dataset.a=asc?'1':'0';
  const v=tr=>{const s=tr.cells[i]?.dataset.s??'';return s!==''&&!isNaN(s)?+s:s.toLowerCase()};
  [...tb.rows].sort((a,b)=>{const x=v(a),y=v(b);return(x>y?1:x<y?-1:0)*(asc?1:-1)}).forEach(r=>tb.appendChild(r))}
function filt(inp){const q=inp.value.toLowerCase();inp.closest('.panel').querySelectorAll('tbody tr').forEach(tr=>tr.hidden=!tr.textContent.toLowerCase().includes(q))}
// row "⋯" menu
function more(items){const k=MENUS.push(items.filter(Boolean))-1;return `<span class="more"><button class="btn sm" aria-label="More actions" onclick="rowMenu(event,${k})">${ico('more')}</button></span>`}
function rowMenu(e,k){
  e.stopPropagation();const open=document.querySelector('.rowmenu');closeMenus();if(open&&open.dataset.k==k)return;
  const m=document.createElement('div');m.className='menu rowmenu';m.dataset.k=k;
  m.innerHTML=MENUS[k].map(([l,f],i)=>`<button onclick="closeMenus();${f}">${l}</button>`).join('');
  document.body.appendChild(m);const b=e.currentTarget.getBoundingClientRect();
  m.style.position='fixed';m.style.top=Math.min(b.bottom+4,innerHeight-m.offsetHeight-8)+'px';m.style.left=Math.max(8,Math.min(b.right-m.offsetWidth,innerWidth-m.offsetWidth-8))+'px';
}
function chips(key,list,cur){return `<div class="chips">${list.map(([v,l,n])=>`<button class="chip ${cur===v?'on':''}" onclick="F['${key}']=${js(v)};render()">${l}${n!=null?`<b>${n}</b>`:''}</button>`).join('')}</div>`}
const tabs=(base,list,cur)=>`<div class="tabs">${list.map(([k,l])=>`<a href="#${base}/${k}" class="${cur===k?'on':''}">${l}</a>`).join('')}</div>`;

/* ---------- Dashboard: All time, one year or one month (opens on the current month) ---------- */
function dashboard(){
  const cur=today().slice(0,7),curY=cur.slice(0,4),m=F.dash||cur,isAll=m==='all',isY=m.length===4,isCur=m===cur;
  const inM=r=>inPer(r,m),mn=perLabel(m);
  const per=isAll?'overall':isY?'in '+m:isCur?'this month':'in '+monthName(m),perS=isAll?'overall':isY?'this year':'this month';
  const P=calc().filter(inM),billed=sum(P,'Budget'),got=sum(P,'Received'),due=Math.max(0,billed-got);
  const PAY=D.Payments.filter(inM).map(p=>({...p,Client:payClient(p)})),rec=sum(PAY,'Amount');
  const TP=D.TeamPay.filter(inM),tp=sum(TP.filter(paidTP),'Amount'),tpPend=sum(TP.filter(p=>!paidTP(p)),'Amount');
  const pex=sum(D.Expenses.filter(inM),'Amount'),ho=sum(P,'HandsOn'),co=sum(opEx(D.CompanyExp.filter(inM)),'Amount'),assets=sum(D.CompanyExp.filter(inM).filter(isAsset),'Amount');
  const cost=pex+tp+ho+co,net=rec-cost;
  const PO=D.Payouts.filter(inM),poPaid=sum(PO.filter(paidPO),'Amount');
  const INVm=docs('Invoice').filter(inM).map(invCalc).filter(d=>d.State!=='Cancelled');
  const INV=docs('Invoice').map(invCalc).filter(d=>d.State!=='Cancelled');
  const w=wallet(),pct=billed?Math.min(100,got/billed*100):0,days=isY||isAll?0:new Date(+m.slice(0,4),+m.slice(5,7),0).getDate(),dayN=isY||isAll?0:isCur?+today().slice(8,10):m<cur?days:0;

  // Hands-On Money: overall, the year and the month in view
  const Y=isAll?curY:m.slice(0,4),lastM=[...new Set([].concat(D.Payments,D.Expenses,D.CompanyExp,D.TeamPay,D.Payouts).map(r=>String(r.Date||'').slice(0,7)).filter(x=>x.startsWith(Y)))].sort().pop();
  const M=m.length===7?m:Y===curY?cur:(lastM||Y+'-12');
  const H=handsOn(m),Hall=isAll?H:handsOn('all'),HY=handsOn(Y),HM=handsOn(M);
  const IR=investorRows('all'),invDue=sum(IR.filter(r=>r.Pending>0),'Pending');

  // needs attention (kept for every period – these are things to act on today)
  const A=[];
  INV.filter(d=>d.State==='Overdue').forEach(d=>A.push([2,`Invoice ${d.No} is overdue`,`${d.Client} · ${inr(d.Balance)} due since ${fmtD(d.ValidDate)}`,`<button class="btn sm" onclick="remindInv('${d.ID}')">${ico('chat')}Remind</button>`]));
  INV.filter(d=>d.State!=='Overdue'&&d.Balance>0&&!d.ValidDate&&daysSince(d.Date)>15).forEach(d=>A.push([1,`Invoice ${d.No} unpaid for ${daysSince(d.Date)} days`,`${d.Client} · ${inr(d.Balance)} balance`,`<button class="btn sm" onclick="remindInv('${d.ID}')">${ico('chat')}Remind</button>`]));
  docs('Quotation').filter(q=>q.Status==='Sent'&&daysSince(q.Date)>10).forEach(q=>A.push([1,`Quotation ${q.No} waiting ${daysSince(q.Date)} days`,`${q.Client} · ${inr(q.Total)}`,`<button class="btn sm" onclick="go('quotations')">Open</button>`]));
  const pend=D.Content.filter(c=>taskPay(c).Key==='unpaid');if(pend.length)A.push([1,`${pend.length} work item${pend.length>1?'s':''} not yet paid to the team`,[...new Set(pend.map(c=>c.DesignedBy))].join(', '),`<button class="btn sm" onclick="F.wtask='unpaid';go('work/tasks')">Open</button>`]);
  const tpP=D.TeamPay.filter(p=>!paidTP(p));if(tpP.length)A.push([1,`${tpP.length} team payment${tpP.length>1?'s':''} pending · ${inr(sum(tpP,'Amount'))}`,[...new Set(tpP.map(p=>p.Member))].join(', '),`<button class="btn sm" onclick="F.wpay='Pending';go('work/pay')">Open</button>`]);
  if(invDue>1)A.push([1,`Investor payouts pending: ${inr(invDue)}`,IR.filter(r=>r.Pending>1).map(r=>r.Investor).filter((x,i,a)=>a.indexOf(x)===i).join(', '),`<button class="btn sm" onclick="go('team/payouts')">Open</button>`]);
  if(w<500)A.push([w<0?2:1,`Ad wallet is ${w<0?'negative':'low'}: ${inr(w)}`,'Recharge before running more ads','<button class="btn sm" onclick="go(\'expenses/ads\')">Open</button>']);
  A.sort((a,b)=>b[0]-a[0]);

  const cl={};PAY.forEach(p=>cl[p.Client||'Other']=(cl[p.Client||'Other']||0)+(+p.Amount||0));const top=Object.entries(cl).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,6),mx=top.length?top[0][1]:1;
  const hoBtn=(p,l,v)=>`<button class="ho-cell ${p===m?'on':''}" onclick="setDash('${p}')"><small>${esc(l)}</small><b class="${v<0?'due':''}">${inr(v)}</b></button>`;

  main(`<div class="month-head"><h2>${esc(mn)}</h2><span class="dpick-wrap">${perPicker(m,'setDash')}</span><span class="muted">${isAll?'All years together':isY?`${P.length} project${P.length===1?'':'s'} started`:isCur?`Day ${dayN} of ${days}`:''}</span>${m!==cur?`<button class="btn sm" onclick="F.dash='';render()">Back to this month</button>`:''}</div>
  <section class="ho">
    <div class="ho-main"><small>Hands-On Money · ${esc(isAll?'overall':mn)}</small><div class="ho-fig ${H.net<0?'due':''}">${inr(H.net)}</div>
      <div class="ho-sub">${isAll?'money in hand after every cost and payout so far':'added to money in hand '+per+' (received minus everything paid out)'}</div></div>
    <div class="ho-cells">${hoBtn('all','Overall',Hall.net)}${hoBtn(Y,Y,HY.net)}${hoBtn(M,monthName(M),HM.net)}</div>
    <details class="ho-calc"><summary>How ${esc(isAll?'the overall figure':'this figure')} is worked out</summary><table>${hoRows(H)}</table></details>
  </section>
  <section class="band">
    <div class="band-top"><div><div class="band-fig">${inr(got)}</div><div class="band-sub">collected of <b>${inr(billed)}</b> billed ${per} (${P.length} project${P.length===1?'':'s'})</div></div>
    <div class="band-side"><div class="band-fig">${inr(due)}</div><div class="band-sub">still to collect on that work</div></div></div>
    <div class="bar" role="img" aria-label="${Math.round(pct)}% collected"><i class="b-in" style="width:${pct}%"></i><i class="b-due" style="width:${billed?100-pct:0}%"></i></div>
    <div class="legend"><span style="--c:#3DBE95">Collected ${Math.round(pct)}%</span><span style="--c:var(--brand)">To collect</span>${isCur?`<span style="--c:#ffffff40">Month ${Math.round(dayN/days*100)}% gone</span>`:''}</div>
  </section>
  <div class="stats">
    ${stat('Received '+perS,inr(rec),'in',`${PAY.length} payment${PAY.length===1?'':'s'}${rec!==got?' · incl. earlier work':''}`)}
    ${stat('Costs '+perS,inr(cost),'',`${inr(pex+ho)} project · ${inr(tp)} team · ${inr(co)} company`)}
    ${stat('Net profit '+perS,inr(net),net<0?'due':'in',assets?`${inr(assets)} assets not deducted`:'received minus costs')}
    ${stat('Invoiced '+perS,inr(sum(INVm,'Total')),'',`${INVm.length} invoice${INVm.length===1?'':'s'} · ${inr(sum(INVm,'Balance'))} unpaid`)}
    ${stat('Team payments '+perS,inr(tp),'',`${TP.filter(paidTP).length} paid${tpPend?' · '+inr(tpPend)+' pending':''}`)}
    ${stat('Investor payouts '+perS,inr(poPaid),'',invDue>1?inr(invDue)+' pending overall':'nothing pending')}
  </div>
  <div class="grid2">
    <section class="panel"><div class="panel-head"><h2>Needs attention</h2><span class="pill ${A.length?'warn':'ok'}">${A.length||'All clear'}</span></div>
      ${A.length?`<ul class="attn">${A.slice(0,9).map(([lv,t,s,b])=>`<li><span class="dot ${lv>1?'bad':''}"></span><div class="txt">${esc(t)}<small>${esc(s)}</small></div>${b}</li>`).join('')}</ul>`:'<div class="empty">Nothing needs your attention right now.</div>'}
    </section>
    <section class="panel"><h2>${isAll?'Month by month, all years':isY?'Month by month, '+m:isCur?esc(monthName(m).split(' ')[0])+' so far':'Day by day, '+esc(monthName(m))}</h2><div class="chartbox"><canvas id="c1" aria-label="Money received and spent"></canvas></div></section>
  </div>
  <div class="grid2 mt">
    <section class="panel"><h2>Received ${per} by client</h2>${top.length?`<div class="hbars">${top.map(([n,v])=>`<a class="hbar" href="#client/${esc(encodeURIComponent(n))}" style="text-decoration:none"><span>${esc(n)}</span><i style="width:${Math.max(4,v/mx*100)}%"></i><b>${inr(v)}</b></a>`).join('')}</div>`:`<div class="empty">No payments ${per}.</div>`}</section>
    ${adm()?`<section class="panel"><h2>Quick actions</h2><div class="quick">
      <button onclick="newDoc('Invoice')">${ico('invoice')}New invoice</button><button onclick="edit('Payments')">${ico('wallet')}Record payment</button>
      <button onclick="payTeam(null,{PayType:'Weekly'})">${ico('coins')}Weekly team pay</button><button onclick="edit('Content')">${ico('task')}Add work item</button>
      <button onclick="edit('Expenses')">${ico('out')}Add expense</button><button onclick="go('reports/summary')">${ico('chart')}Reports</button></div></section>`:''}
  </div>`);
  if(window.Chart){Chart.defaults.font.family="'Red Hat Display',system-ui,sans-serif";Chart.defaults.color='#6F6670'}
  if(!window.Chart||!$('c1'))return;
  const yTicks={callback:v=>'₹'+(v>=1e5?(v/1e5)+'L':v>=1e3?(v/1e3)+'k':v)};
  const outRows=()=>D.Expenses.filter(inM).concat(opEx(D.CompanyExp.filter(inM)),D.TeamPay.filter(paidTP).filter(inM));
  const barChart=(labels,inA,outA)=>charts.push(new Chart($('c1'),{type:'bar',data:{labels,
      datasets:[{label:'Received',data:inA,backgroundColor:'#0F7B5F',borderRadius:4},{label:'Spent',data:outA,backgroundColor:'#ED5B2D',borderRadius:4}]},
      options:{maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{boxWidth:10,boxHeight:10}},tooltip:{callbacks:{label:c=>c.dataset.label+': '+inr(c.raw)}}},scales:{x:{grid:{display:false}},y:{beginAtZero:true,grid:{color:'#E8E6D6'},ticks:yTicks}}}}));
  if(isAll){   // all years: received and spent per month, every month that has data
    const ks=[...new Set(PAY.concat(outRows()).map(x=>String(x.Date||'').slice(0,7)).filter(x=>/^\d{4}-\d{2}$/.test(x)))].sort();
    const ix=Object.fromEntries(ks.map((k,i)=>[k,i])),inA=ks.map(()=>0),outA=ks.map(()=>0);
    PAY.forEach(x=>{const i=ix[String(x.Date).slice(0,7)];if(i!=null)inA[i]+=+x.Amount||0});outRows().forEach(x=>{const i=ix[String(x.Date).slice(0,7)];if(i!=null)outA[i]+=+x.Amount||0});
    barChart(ks.map(k=>MONTHS[+k.slice(5)-1]+' '+k.slice(2,4)),inA,outA);return;
  }
  if(isY){   // whole year: received and spent per month
    const inA=new Array(12).fill(0),outA=new Array(12).fill(0),put=(arr,d,v)=>{const i=+String(d).slice(5,7)-1;if(i>=0&&i<12)arr[i]+=+v||0};
    PAY.forEach(x=>put(inA,x.Date,x.Amount));outRows().forEach(x=>put(outA,x.Date,x.Amount));
    barChart(MONTHS,inA,outA);return;
  }
  // one month: running totals, day by day
  const n=dayN||days,inD=new Array(n).fill(0),outD=new Array(n).fill(0),put=(arr,d,v)=>{const i=+String(d).slice(8,10)-1;if(i>=0&&i<n)arr[i]+=+v||0};
  PAY.forEach(x=>put(inD,x.Date,x.Amount));outRows().forEach(x=>put(outD,x.Date,x.Amount));
  const cum=a=>a.reduce((o,v,i)=>(o.push((o[i-1]||0)+v),o),[]);
  charts.push(new Chart($('c1'),{type:'line',data:{labels:inD.map((_,i)=>String(i+1)),
    datasets:[{label:'Received',data:cum(inD),borderColor:'#0F7B5F',backgroundColor:'#0F7B5F22',fill:true,tension:.25,pointRadius:0,borderWidth:2.5},{label:'Spent',data:cum(outD),borderColor:'#ED5B2D',backgroundColor:'#ED5B2D18',fill:true,tension:.25,pointRadius:0,borderWidth:2.5}]},
    options:{maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10,boxHeight:10}},tooltip:{callbacks:{title:c=>c[0].label+' '+mn,label:c=>c.dataset.label+': '+inr(c.raw)}}},scales:{x:{grid:{display:false},ticks:{maxTicksLimit:8}},y:{beginAtZero:true,grid:{color:'#E8E6D6'},ticks:yTicks}}}}));
}

/* ---------- Clients ---------- */
function clientRows(){
  const P=calc(),INV=docs('Invoice').map(invCalc).filter(d=>d.State!=='Cancelled');
  return clientNames().map(n=>{const c=clientOf(n),ps=P.filter(p=>p.Client===n),iv=INV.filter(d=>d.Client===n);
    return {...c,Name:n,Projects:ps.length,Billed:sum(ps,'Budget'),Received:sum(ps,'Received'),Balance:sum(ps.filter(p=>p.Balance>0),'Balance')+sum(iv.filter(d=>!ps.some(p=>p.Project===d.Project)),'Balance'),Missing:!c.ID,Last:lastByClient(n)}}).sort(recentFirst);
}
function clients(){
  const all=clientRows(),f=F.clients||'all';
  const rows=f==='due'?all.filter(r=>r.Balance>0):f==='missing'?all.filter(r=>r.Missing):all;
  main(`<section class="panel">
    <div class="toolbar"><input class="filter" type="search" placeholder="Filter clients" oninput="filt(this)">
      ${chips('clients',[['all','All',all.length],['due','To collect',all.filter(r=>r.Balance>0).length],['missing','Missing details',all.filter(r=>r.Missing).length]],f)}
      <span class="spacer"></span>${adm()?`<button class="btn primary" onclick="edit('Clients')">${ico('plus')}Add client</button>`:''}<button class="btn" onclick="csv('Clients')">Export</button></div>
    ${table(rows,[['Name','Client','text',{sub:r=>r.Missing?'No billing details yet':String(r.BillingName||'').replace(/\s+/g,' ')}],['Phone','Phone'],['Projects','Projects','num'],['Last','Latest activity','date'],['Billed','Billed','money'],['Received','Received','money'],['Balance','To collect','money']],
      {total:['Billed','Received','Balance'],href:r=>'client/'+r.Name,act:r=>`<button class="btn sm" onclick="go(${js('client/'+r.Name)})">Open</button>`})}
  </section>`);
}
function clientPage(){
  const n=R.p,c=clientOf(n),P=calc().filter(p=>p.Client===n);
  const INV=docs('Invoice').filter(d=>d.Client===n).map(invCalc),Q=docs('Quotation').filter(d=>d.Client===n);
  const pn=new Set(P.map(p=>p.Project)),invNos=new Set(INV.map(d=>d.No));
  const PAY=D.Payments.filter(p=>pn.has(p.Project)||invNos.has(p.InvoiceNo)).sort((a,b)=>String(b.Date).localeCompare(a.Date));
  const extra=INV.filter(d=>d.State!=='Cancelled'&&!pn.has(d.Project));
  const billed=sum(P,'Budget')+sum(extra,'Total'),rec=sum(PAY,'Amount'),bal=billed-rec;
  const t=F['client:'+n]||'projects',ph=c.Phone||((P.find(p=>p.Phone)||{}).Phone);
  const ORG=orgNames().filter(x=>orgOf(x).Client===n||P.some(p=>p.Organization===x));
  const link=(href,i,l)=>`<a class="btn sm" href="${esc(href)}" target="_blank" rel="noopener">${ico(i)}${l}</a>`;
  main(`<a class="back" href="#clients">${ico('back')}All clients</a>
  <div class="chead"><div class="avatar">${esc((n[0]||'?').toUpperCase())}</div>
    <div><h2>${esc(n)}</h2>${c.BillingName&&c.BillingName!==n?`<div class="bn">${esc(c.BillingName)}</div>`:''}<div class="muted">${esc([c.City,c.Email,c.GSTIN&&'GSTIN '+c.GSTIN].filter(Boolean).join(' · '))}</div>
      <div class="row" style="margin-top:10px">${ph?link('tel:'+ph,'phone',esc(ph)):''}${ph?link('https://wa.me/'+waPhone(ph),'chat','WhatsApp'):''}${c.Email?link('mailto:'+c.Email,'mail','Email'):''}${c.Website?link('https://'+String(c.Website).replace(/^https?:\/\//,''),'globe','Website'):''}</div>
      ${ORG.length?`<div class="orgs"><small>Organizations</small>${ORG.map(x=>`<a href="#organization/${esc(encodeURIComponent(x))}">${esc(x)}</a>`).join('')}</div>`:''}</div>
    <div class="acts row">${adm()?`<button class="btn primary" onclick="newDoc('Invoice',{Client:${js(n)}})">${ico('invoice')}New invoice</button><button class="btn" onclick="edit('Payments',null,{Project:${js((P.find(p=>p.Balance>0)||P[0]||{}).Project||'')}})">${ico('wallet')}Record payment</button>`:''}
      ${more([['Print statement',`statement(${js(n)})`],bal>0?['WhatsApp balance reminder',`remindClient(${js(n)})`]:null,adm()?['New quotation',`newDoc('Quotation',{Client:${js(n)}})`]:null,adm()?['New project',`edit('Projects',null,{Client:${js(n)}})`]:null,adm()?['Add organization',`edit('Organizations',null,{Client:${js(n)}})`]:null,adm()?[c.ID?'Edit client details':'Add billing details',c.ID?`edit('Clients','${c.ID}')`:`edit('Clients',null,{Name:${js(n)},BillingName:${js(n)}})`]:null,adm()&&c.ID?['Delete client',`del('Clients','${c.ID}')`]:null])}</div></div>
  <div class="stats">${stat('Billed',inr(billed))}${stat('Received',inr(rec),'in')}${stat('To collect',inr(Math.max(0,bal)),bal>0?'due':'')}${stat('Projects',P.length,'',`${P.filter(p=>p.Status==='Active').length} active`)}</div>
  <section class="panel">
    <div class="tabs">${[['projects','Projects',P.length],['invoices','Invoices',INV.length],['quotations','Quotations',Q.length],['payments','Payments',PAY.length]].map(([k,l,c])=>`<a href="javascript:void 0" class="${t===k?'on':''}" onclick="F['client:'+${js(n)}]='${k}';render()">${l} (${c})</a>`).join('')}</div>
    ${t==='projects'?projTable(P):t==='invoices'?invTable(INV):t==='quotations'?quoteTable(Q):payTable(PAY.map(p=>({...p,Client:n})))}
  </section>`);
}

/* ---------- Organization ---------- */
function orgStats(n,P){
  const ps=P.filter(p=>p.Organization===n),pn=new Set(ps.map(p=>p.Project));
  const INV=docs('Invoice').filter(d=>docOrg(d)===n).map(invCalc),invNos=new Set(INV.map(d=>d.No));
  const PAY=D.Payments.filter(p=>pn.has(p.Project)||invNos.has(p.InvoiceNo)).sort((a,b)=>String(b.Date).localeCompare(a.Date));
  const extra=INV.filter(d=>d.State!=='Cancelled'&&!pn.has(d.Project));
  const billed=sum(ps,'Budget')+sum(extra,'Total'),rec=sum(PAY,'Amount');
  return {ps,INV,PAY,extra,billed,rec,bal:billed-rec,due:sum(ps.filter(p=>p.Balance>0),'Balance')+sum(extra,'Balance')};
}
function orgRows(){
  const P=calc();
  return orgNames().map(n=>{const o=orgOf(n),S=orgStats(n,P);
    return {...o,Name:n,Client:o.Client||(S.ps[0]||{}).Client||'',Projects:S.ps.length,Billed:S.billed,Received:S.rec,Balance:S.due,Missing:!o.ID,Last:lastByOrg(n)}}).sort(recentFirst);
}
const noBackend=()=>BACKEND_OK?'':`<div class="notice"><b>Organization needs the updated backend.</b><br>Paste the new <code>apps-script/Code.gs</code> into Apps Script, run <b>NanoFLY App → 1. Setup app sheets</b>, then Deploy → Manage deployments → Edit → New version. Until then organizations can't be saved.</div>`;
function organizations(){
  const all=orgRows(),f=F.orgs||'all';
  const rows=f==='due'?all.filter(r=>r.Balance>0):f==='missing'?all.filter(r=>r.Missing):all;
  main(`${noBackend()}<section class="panel">
    <div class="toolbar"><input class="filter" type="search" placeholder="Filter organizations" oninput="filt(this)">
      ${chips('orgs',[['all','All',all.length],['due','To collect',all.filter(r=>r.Balance>0).length],['missing','Missing details',all.filter(r=>r.Missing).length]],f)}
      <span class="spacer"></span>${adm()?`<button class="btn primary" onclick="edit('Organizations')">${ico('plus')}Add organization</button>`:''}<button class="btn" onclick="csv('Organizations')">Export</button></div>
    ${table(rows,[['Name','Organization','text',{sub:r=>r.Missing?'No details yet':[r.Contact,r.City].filter(Boolean).join(' · ')}],['Client','Client'],['Projects','Projects','num'],['Last','Latest activity','date'],['Billed','Billed','money'],['Received','Received','money'],['Balance','To collect','money']],
      {total:['Billed','Received','Balance'],href:r=>'organization/'+r.Name,empty:'No organizations yet. Add one, then choose it on projects and invoices.',act:r=>`<button class="btn sm" onclick="go(${js('organization/'+r.Name)})">Open</button>`})}
  </section>`);
}
function organizationPage(){
  const n=R.p,o=orgOf(n),P=calc(),S=orgStats(n,P),Q=docs('Quotation').filter(d=>docOrg(d)===n);
  const client=o.Client||(S.ps[0]||{}).Client||'',t=F['org:'+n]||'projects',ph=o.Phone;
  const link=(href,i,l)=>`<a class="btn sm" href="${esc(href)}" target="_blank" rel="noopener">${ico(i)}${l}</a>`;
  const pre={Client:client,Organization:n};
  main(`${noBackend()}<a class="back" href="#organizations">${ico('back')}All organizations</a>
  <div class="chead"><div class="avatar">${esc((n[0]||'?').toUpperCase())}</div>
    <div><h2>${esc(n)}</h2>${o.BillingName&&o.BillingName!==n?`<div class="bn">${esc(o.BillingName)}</div>`:''}<div class="muted">${esc([o.Contact,o.City,o.Email,o.GSTIN&&'GSTIN '+o.GSTIN].filter(Boolean).join(' · '))}</div>
      <div class="row" style="margin-top:10px">${ph?link('tel:'+ph,'phone',esc(ph)):''}${ph?link('https://wa.me/'+waPhone(ph),'chat','WhatsApp'):''}${o.Email?link('mailto:'+o.Email,'mail','Email'):''}${o.Website?link('https://'+String(o.Website).replace(/^https?:\/\//,''),'globe','Website'):''}</div>
      ${client?`<div class="orgs"><small>Client</small><a href="#client/${esc(encodeURIComponent(client))}">${esc(client)}</a></div>`:''}</div>
    <div class="acts row">${adm()?`<button class="btn primary" onclick="newDoc('Invoice',${esc(JSON.stringify(pre))})">${ico('invoice')}New invoice</button><button class="btn" onclick="edit('Projects',null,${esc(JSON.stringify(pre))})">${ico('folder')}New project</button>`:''}
      ${more([adm()?['Record payment',`edit('Payments',null,{Project:${js((S.ps.find(p=>p.Balance>0)||S.ps[0]||{}).Project||'')}})`]:null,adm()?['New quotation',`newDoc('Quotation',${esc(JSON.stringify(pre))})`]:null,client?['Open client',`go(${js('client/'+client)})`]:null,
        adm()?[o.ID?'Edit organization details':'Add organization details',o.ID?`edit('Organizations','${o.ID}')`:`edit('Organizations',null,{Name:${js(n)},BillingName:${js(n)},Client:${js(client)}})`]:null,adm()&&o.ID?['Delete organization',`del('Organizations','${o.ID}')`]:null])}</div></div>
  <div class="stats">${stat('Billed',inr(S.billed))}${stat('Received',inr(S.rec),'in')}${stat('To collect',inr(Math.max(0,S.bal)),S.bal>0?'due':'')}${stat('Projects',S.ps.length,'',`${S.ps.filter(p=>p.Status==='Active').length} active`)}</div>
  <section class="panel">
    <div class="tabs">${[['projects','Projects',S.ps.length],['invoices','Invoices',S.INV.length],['quotations','Quotations',Q.length],['payments','Payments',S.PAY.length]].map(([k,l,c])=>`<a href="javascript:void 0" class="${t===k?'on':''}" onclick="F['org:'+${js(n)}]='${k}';render()">${l} (${c})</a>`).join('')}</div>
    ${t==='projects'?projTable(S.ps):t==='invoices'?invTable(S.INV):t==='quotations'?quoteTable(Q):payTable(S.PAY.map(p=>({...p,Client:payClient(p)})))}
  </section>`);
}

/* ---------- Projects ---------- */
function projTable(P){
  return table(P,[['Project','Project','text',{sub:'Client'}],['Date','Started','date'],['Budget','Value','money'],['Received','Received','money'],['Balance','To collect','money'],['Profit','Profit','money'],['HandsOnMoney','Hands-on','money'],['Status','Status','pill']],
    {total:['Budget','Received','Balance','Profit','HandsOnMoney'],act:r=>(adm()&&r.Balance>0?`<button class="btn sm" onclick="payFor('${r.ID}')">${ico('wallet')}Payment</button>`:'')+more([
      adm()?['Create invoice',`invFromProject('${r.ID}')`]:null,r.Balance>0?['WhatsApp reminder',`remind('${r.ID}')`]:null,adm()?['Repeat next month',`repeatProject('${r.ID}')`]:null,
      ['Open client',`go(${js('client/'+r.Client)})`],adm()?['Edit',`edit('Projects','${r.ID}')`]:null,adm()?['Delete',`del('Projects','${r.ID}')`]:null]),
     empty:'No projects here.'});
}
function projects(){
  const all=calc().filter(inFY).sort((a,b)=>String(b.Date).localeCompare(a.Date)),f=F.projects||'Active';
  const cnt=s=>all.filter(p=>p.Status===s).length;
  const rows=f==='all'?all:f==='due'?all.filter(p=>p.Balance>0):all.filter(p=>p.Status===f);
  main(`<section class="panel"><div class="toolbar"><input class="filter" type="search" placeholder="Filter projects" oninput="filt(this)">
    ${chips('projects',[['Active','Active',cnt('Active')],['due','To collect',all.filter(p=>p.Balance>0).length],['Completed','Completed',cnt('Completed')],['all','All',all.length]],f)}
    <span class="spacer"></span>${adm()?`<button class="btn primary" onclick="edit('Projects')">${ico('plus')}New project</button>`:''}<button class="btn" onclick="csv('Projects')">Export</button></div>
    ${projTable(rows)}</section>`);
}
function repeatProject(id){
  const p=D.Projects.find(x=>x.ID===id);let name=p.Project.trim();
  const m=name.match(/^(.*?)(\d+)\s*$/);name=m?m[1]+(+m[2]+1):name+' – '+new Date(addMonths(p.Date,1)+'T00:00:00').toLocaleDateString('en-IN',{month:'short',year:'numeric'});
  edit('Projects',null,{...p,ID:'',Project:name,Date:addMonths(p.Date,1),Status:'Active',Notes:''},'Repeat project for next month');
}

/* ---------- Work tracker & team payments ----------
   Work completed = tasks in the work tracker (App_Content).  How it was paid = team payments (App_TeamPay):
   Task-Based (one task → one payment) or Weekly (one consolidated payment for a member's week, tasks optional). */
const noPayBackend=()=>PAY_OK?'':`<div class="notice"><b>Team payments need the updated backend.</b><br>Paste the new <code>apps-script/Code.gs</code> into Apps Script, then Deploy → Manage deployments → Edit → New version. Your existing work log still shows below.</div>`;
function taskRows(){return D.Content.filter(inFY).map(c=>({...c,...taskPay(c),Person:c.DesignedBy||'Unassigned'})).sort((a,b)=>String(b.Date).localeCompare(a.Date))}
function teamPayRows(rows){
  const C={};D.Content.forEach(c=>C[c.ID]=c);
  return rows.map(p=>{const t=tids(p);return {...p,Why:reasonOf(p),Period:periodTxt(p),
    Covers:p.PayType==='Task-Based'?(C[t[0]]?C[t[0]].Content+(C[t[0]].Project?' · '+C[t[0]].Project:''):'Task removed from tracker'):(t.length?t.length+' task'+(t.length>1?'s':'')+' ticked':'No tasks ticked')+(p.Project?' · '+p.Project:'')}})
    .sort((a,b)=>String(b.Date).localeCompare(a.Date));
}
function teamPayTable(rows,opt={}){
  return table(teamPayRows(rows),[['Member','Team member','text',{sub:'Why'}],['PayType','Type','pill'],['Period','Week / period','text',{sub:'Covers'}],['Date','Paid on','date'],['Status','Status','pill'],['Amount','Amount','money']],
    {total:['Amount'],empty:opt.empty||'No team payments here.',act:adm()?r=>more([['Edit',`payTeam('${r.ID}')`],['Delete',`del('TeamPay','${r.ID}')`]]):null});
}
function memberPayRows(){
  const m={},get=k=>m[k]=m[k]||{Person:k,Tasks:0,Unpaid:0,TaskPaid:0,WeeklyPaid:0,OtherPaid:0,Pending:0,Last:''};
  D.Content.filter(inFY).forEach(c=>{const o=get(c.DesignedBy||'Unassigned'),k=taskPay(c).Key;o.Tasks++;if(k==='unpaid')o.Unpaid++});
  D.TeamPay.filter(inFY).forEach(p=>{const o=get(p.Member||'Unassigned'),a=+p.Amount||0;
    if(!paidTP(p)){o.Pending+=a;return}
    if(p.PayType==='Task-Based')o.TaskPaid+=a;else if(p.Reason==='Weekly Work Payment'||!p.Reason)o.WeeklyPaid+=a;else o.OtherPaid+=a;
    if(String(p.Date)>o.Last)o.Last=p.Date});
  return Object.values(m).map(o=>({...o,Total:o.TaskPaid+o.WeeklyPaid+o.OtherPaid})).sort((a,b)=>b.Total-a.Total||b.Tasks-a.Tasks);
}
function work(){
  const t=['tasks','pay','members'].includes(R.p)?R.p:'tasks',T=[['tasks','Tasks (work done)'],['pay','Team payments'],['members','By member']];
  let h='';
  if(t==='tasks'){
    const all=taskRows(),mem=F.wmem||'',byM=mem?all.filter(r=>r.Person===mem):all,f=F.wtask||'all';
    const cnt=k=>byM.filter(r=>r.Key===k).length,rows=f==='all'?byM:byM.filter(r=>r.Key===f);
    const ppl=[...new Set(all.map(r=>r.Person))].sort();
    h=`<div class="stats">${stat('Tasks',byM.length,'',perLabel(FY))}${stat('Not paid yet',cnt('unpaid'),cnt('unpaid')?'due':'')}${stat('Paid per task',cnt('task'),'',inr(sum(byM.filter(r=>r.Key==='task'),'Amt')))}${stat('Paid in a weekly payment',cnt('weekly'),'',cnt('earlier')?cnt('earlier')+' paid earlier':'')}</div>
    <section class="panel"><div class="toolbar"><input class="filter" type="search" placeholder="Filter tasks" oninput="filt(this)">
      <select style="width:auto" aria-label="Team member" onchange="F.wmem=this.value;render()"><option value="">Everyone</option>${ppl.map(p=>`<option ${p===mem?'selected':''}>${esc(p)}</option>`).join('')}</select>
      <span class="spacer"></span>${adm()?`<button class="btn" onclick="payTeam(null,{PayType:'Weekly',Member:${js(mem)}})">${ico('coins')}Weekly payment</button><button class="btn primary" onclick="edit('Content',null,{DesignedBy:${js(mem)}})">${ico('plus')}Add task</button>`:''}</div>
      ${chips('wtask',[['all','All',byM.length],['unpaid','Not paid',cnt('unpaid')],['task','Paid · task',cnt('task')],['weekly','Paid · weekly',cnt('weekly')],['pending','Pending',cnt('pending')],['earlier','Paid earlier',cnt('earlier')]],f)}
      <div style="height:12px"></div>
      ${table(rows,[['Content','Task / work item','text',{sub:'Project'}],['Date','Done on','date'],['Person','Team member'],['State','Payment','pill',{sub:'How'}],['Amt','Task payment','money',{color:'in',blank:1}]],
        {total:['Amt'],empty:'No tasks here.',act:adm()?r=>(r.Key==='unpaid'?`<button class="btn sm" onclick="payTask('${r.ID}')">${ico('coins')}Pay task</button>`:'')+more([r.Pay?['Open payment',`payTeam('${r.Pay.ID}')`]:null,['Edit task',`edit('Content','${r.ID}')`],['Delete task',`del('Content','${r.ID}')`]]):null})}</section>`;
  }else if(t==='pay'){
    const all=D.TeamPay.filter(inFY),f=F.wpay||'all',paid=all.filter(paidTP);
    const rows=f==='all'?all:f==='Pending'?all.filter(p=>!paidTP(p)):all.filter(p=>p.PayType===f);
    const old=D.Expenses.filter(inFY).filter(e=>e.Category==='Team').sort((a,b)=>String(b.Date).localeCompare(a.Date));
    h=`<div class="stats">${stat('Paid to the team',inr(sum(paid,'Amount')),'',perLabel(FY))}${stat('Task-based',inr(sum(paid.filter(p=>p.PayType==='Task-Based'),'Amount')),'',paid.filter(p=>p.PayType==='Task-Based').length+' payments')}${stat('Weekly',inr(sum(paid.filter(p=>p.PayType==='Weekly'),'Amount')),'',paid.filter(p=>p.PayType==='Weekly').length+' payments')}${stat('Pending',inr(sum(all.filter(p=>!paidTP(p)),'Amount')),all.some(p=>!paidTP(p))?'due':'')}</div>
    <section class="panel"><div class="toolbar"><input class="filter" type="search" placeholder="Filter payments" oninput="filt(this)">
      ${chips('wpay',[['all','All',all.length],['Task-Based','Task-based',all.filter(p=>p.PayType==='Task-Based').length],['Weekly','Weekly',all.filter(p=>p.PayType==='Weekly').length],['Pending','Pending',all.filter(p=>!paidTP(p)).length]],f)}
      <span class="spacer"></span>${adm()?`<button class="btn" onclick="payTeam(null,{PayType:'Task-Based'})">Task payment</button><button class="btn primary" onclick="payTeam(null,{PayType:'Weekly'})">${ico('plus')}Weekly payment</button>`:''}<button class="btn" onclick="csv('TeamPay')">Export</button></div>
      ${teamPayTable(rows,{empty:'No team payments recorded yet. Record a weekly payment, or pay a single task from the Tasks tab.'})}</section>
    ${old.length?`<section class="panel"><div class="panel-head"><h2>Earlier team costs</h2></div><p class="muted" style="margin-top:-6px">Amounts paid to team members that were entered as project costs (from your old Spent Details sheet). They stay in each project's costs. Record new payments above, not as project costs, so nothing is counted twice.</p>
      ${table(old,[['PaidTo','Team member','text',{sub:'Project'}],['Date','Date','date'],['Amount','Amount','money']],{total:['Amount']})}</section>`:''}`;
  }else{
    const rows=memberPayRows();
    h=`<section class="panel"><div class="panel-head"><h2>Work and pay by team member</h2><span class="muted">${esc(perLabel(FY))}</span></div>
    ${table(rows,[['Person','Team member','text',{sub:r=>r.Last?'Last paid '+fmtD(r.Last):''}],['Tasks','Tasks done','num'],['Unpaid','Not paid','num'],['TaskPaid','Task-based','money'],['WeeklyPaid','Weekly','money'],['OtherPaid','Other (advance, bonus…)','money'],['Total','Total paid','money',{color:'in'}],['Pending','Pending','money',{color:'due'}]],
      {total:['TaskPaid','WeeklyPaid','OtherPaid','Total','Pending'],empty:'Nothing recorded for this period.',
       act:adm()?r=>`<button class="btn sm" onclick="payTeam(null,{PayType:'Weekly',Member:${js(r.Person)}})">${ico('coins')}Pay week</button>`+more([['Show tasks',`F.wmem=${js(r.Person)};F.wtask='all';go('work/tasks')`]]):null})}</section>`;
  }
  main(noPayBackend()+tabs('work',T,t)+h);
}
function tkAll(v){document.querySelectorAll('.tk').forEach(x=>{x.checked=v;x.dispatchEvent(new Event('change',{bubbles:true}))})}
function payTask(id){const c=D.Content.find(x=>x.ID===id);if(!c)return;payTeam(null,{PayType:'Task-Based',Tasks:c.ID,Member:c.DesignedBy||'',Project:c.Project||'',Amount:+c.Rate||'',Reason:'Specialized Task'})}
/* Monday – Sunday week that contains date d */
function weekOf(d){const x=new Date(String(d||today()).slice(0,10)+'T00:00:00'),s=new Date(x);s.setDate(x.getDate()-(x.getDay()+6)%7);const e=new Date(s);e.setDate(s.getDate()+6);return [iso(s),iso(e)]}
function payTeam(id,preset={}){
  if(!adm())return;
  if(!PAY_OK){alert('Update the Apps Script backend first (paste the new Code.gs and deploy a new version).');return}
  const p=id?{...D.TeamPay.find(x=>x.ID===id)}:{PayType:'Weekly',Date:today(),Status:'Paid',Mode:'UPI',...preset};
  if(!p.PayType)p.PayType='Weekly';
  if(p.Project){const pj=D.Projects.find(x=>x.Project===p.Project);if(pj)p.TPClient=isInhouse(pj.Client)?INHOUSE:pj.Client}
  if(!id&&!p.Reason)p.Reason=p.PayType==='Weekly'?'Weekly Work Payment':'Specialized Task';
  if(!id&&p.PayType==='Weekly'&&!p.FromDate){const w=weekOf(p.Date);p.FromDate=w[0];p.ToDate=w[1]}
  const mine=new Set(id?tids(p):[]),opt=(a,v)=>a.map(o=>`<option ${o===v?'selected':''}>${esc(o)}</option>`).join('');
  openSheet(id?'Edit team payment':'Record team payment',`
  <label>Payment type<select name="PayType">
    <option value="Task-Based" ${p.PayType==='Task-Based'?'selected':''}>Task-based – pay for one task</option>
    <option value="Weekly" ${p.PayType==='Weekly'?'selected':''}>Weekly – one payment for the week</option></select></label>
  <label>Team member<input name="Member" list="dl_mem" value="${esc(p.Member||'')}" autocomplete="off"><datalist id="dl_mem">${people().map(x=>`<option value="${esc(x)}">`).join('')}</datalist></label>
  <label class="full" id="tp_task">Task / work item<select name="Tasks"></select></label>
  <label>${p.PayType==='Weekly'?'Week from':'Period from (optional)'}<input type="date" name="FromDate" value="${esc(p.FromDate||'')}"></label>
  <label>${p.PayType==='Weekly'?'Week to':'Period to (optional)'}<input type="date" name="ToDate" value="${esc(p.ToDate||'')}"></label>
  <div class="full" id="tp_week"></div>
  <label>Client<select name="TPClient"><option value="">All clients</option><option value="${INHOUSE}">${INHOUSE} (our own work)</option>${clientNames().filter(n=>!isInhouse(n)).map(n=>`<option ${n===p.TPClient?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
  <label>Project (optional)<select name="Project"></select></label>
  <label>Amount (₹)<input type="number" inputmode="decimal" step="any" name="Amount" value="${esc(p.Amount??'')}"></label>
  <label>Payment date<input type="date" name="Date" value="${esc(p.Date||'')}"></label>
  <label>Payment status<select name="Status">${opt(STATUS.TeamPay,p.Status||'Paid')}</select></label>
  <label>Paid by<select name="Mode"><option value=""></option>${opt(OPTS.Mode,p.Mode)}</select></label>
  <label>Reason for payment<select name="Reason">${opt(REASONS,p.Reason)}</select></label>
  <label id="tp_other">Type the reason<input name="ReasonOther" value="${esc(p.ReasonOther||'')}"></label>
  <label class="full">Notes<textarea name="Notes">${esc(p.Notes||'')}</textarea></label>`,
  async o=>{
    const rec={...p,...o,ID:id||''};delete rec.TPClient;
    if(rec.PayType==='Weekly')rec.Tasks=[...$('mb').querySelectorAll('.tk:checked')].map(x=>x.value).join(',');
    if(!rec.Member)throw new Error('Choose the team member.');
    if(rec.PayType==='Task-Based'&&!rec.Tasks)throw new Error('Choose the task this payment is for. (Add the task in the work tracker first if it is not there.)');
    if(!(+rec.Amount>0))throw new Error('Enter the amount.');
    if(rec.Reason==='Other'&&!rec.ReasonOther)throw new Error('Type the reason for this payment.');
    if(rec.FromDate&&rec.ToDate&&rec.ToDate<rec.FromDate)throw new Error('The period ends before it starts.');
    await api('saveRow',TOKEN,'TeamPay',rec);toast('Team payment saved');await load();
  },'Save payment',true);
  const q=n=>$('mb').querySelector(`[name=${n}]`);
  const avail=c=>{const k=taskPay(c);return mine.has(String(c.ID))||k.Key==='unpaid'};
  const sel=id?new Set(mine):null,unt=new Set();   // editing: keep what is ticked · new: every unpaid task ticked unless you untick it
  $('tp_week').onchange=e=>{const x=e.target;if(!x.classList.contains('tk'))return;if(sel){x.checked?sel.add(x.value):sel.delete(x.value)}else{x.checked?unt.delete(x.value):unt.add(x.value)}};
  /* Client -> Project: pick the client first, only their projects (newest first) are listed; In-house = projects with no client */
  const fillProj=(keep)=>{
    const cl=q('TPClient').value,cur=keep!==undefined?keep:q('Project').value;
    let L=D.Projects.slice().sort((a,b)=>String(b.Date).localeCompare(String(a.Date)));
    if(cl===INHOUSE)L=L.filter(x=>isInhouse(x.Client));else if(cl)L=L.filter(x=>x.Client===cl);
    const act=L.filter(x=>x.Status==='Active'||x.Project===cur),rest=L.filter(x=>!(x.Status==='Active'||x.Project===cur));
    const o=x=>`<option value="${esc(x.Project)}" ${x.Project===cur?'selected':''}>${esc(x.Project)}${x.Status&&x.Status!=='Active'?' ('+esc(x.Status)+')':''}</option>`;
    q('Project').innerHTML=`<option value="">${cl?(L.length?'No single project / general work':'No projects for this client'):'No single project / general work'}</option>`+act.map(o).join('')+(rest.length?`<optgroup label="Completed / other">${rest.map(o).join('')}</optgroup>`:'');
    if(cur&&!L.some(x=>x.Project===cur))q('Project').insertAdjacentHTML('beforeend',`<option value="${esc(cur)}" selected>${esc(cur)}</option>`);
  };
  q('TPClient').onchange=()=>{fillProj('');sync()};
  q('Project').onchange=()=>{const pj=D.Projects.find(x=>x.Project===q('Project').value);if(pj&&!q('TPClient').value)q('TPClient').value=isInhouse(pj.Client)?INHOUSE:pj.Client;sync()};
  fillProj(p.Project||'');
  const inScope=c=>{const pr=q('Project').value,cl=q('TPClient').value;if(pr)return c.Project===pr;if(!cl)return true;
    const nm=new Set(D.Projects.filter(x=>cl===INHOUSE?isInhouse(x.Client):x.Client===cl).map(x=>x.Project));return nm.has(c.Project)||(cl===INHOUSE&&!c.Project)};
  const sync=()=>{
    const type=q('PayType').value,mem=q('Member').value.trim(),weekly=type==='Weekly';
    $('tp_task').style.display=weekly?'none':'';
    q('FromDate').parentNode.firstChild.textContent=weekly?'Week from':'Period from (optional)';q('ToDate').parentNode.firstChild.textContent=weekly?'Week to':'Period to (optional)';
    $('tp_other').style.display=q('Reason').value==='Other'?'':'none';
    if(!weekly){
      const cur=q('Tasks').value||tids(p)[0]||'',list=D.Content.filter(c=>(!mem||c.DesignedBy===mem)&&avail(c)&&(mine.has(String(c.ID))||inScope(c))).sort((a,b)=>String(b.Date).localeCompare(a.Date));
      q('Tasks').innerHTML=`<option value="">${list.length?'Choose the task':'No unpaid tasks'+(mem?' for '+esc(mem):'')}</option>`+list.map(c=>`<option value="${esc(c.ID)}" ${String(c.ID)===String(cur)?'selected':''}>${esc(fmtD(c.Date))} · ${esc(c.Content)}${c.Project?' · '+esc(c.Project):''}${mem?'':' · '+esc(c.DesignedBy||'')}${+c.Rate?' · '+inr(c.Rate):''}</option>`).join('');
      $('tp_week').innerHTML='';return;
    }
    const f=q('FromDate').value,t=q('ToDate').value;
    const list=mem?D.Content.filter(c=>c.DesignedBy===mem&&(mine.has(String(c.ID))||(avail(c)&&inScope(c)&&(!f||c.Date>=f)&&(!t||c.Date<=t)))).sort((a,b)=>String(a.Date).localeCompare(b.Date)):[];
    $('tp_week').innerHTML=`<div class="tklist"><div class="tkhead"><b>Work this payment covers</b><span class="muted">${mem?`${list.length} unpaid task${list.length===1?'':'s'} by ${esc(mem)} in this period`:'Choose the team member to see their tasks'}</span>
      ${list.length?`<button type="button" class="btn sm" onclick="tkAll(true)">All</button><button type="button" class="btn sm" onclick="tkAll(false)">None</button>`:''}</div>
      ${list.map(c=>`<label class="tk-row"><input type="checkbox" class="tk" value="${esc(c.ID)}" ${(sel?sel.has(String(c.ID)):!unt.has(String(c.ID)))?'checked':''}><span>${esc(c.Content)}<small>${esc(fmtD(c.Date))}${c.Project?' · '+esc(c.Project):''}</small></span></label>`).join('')}
      <p class="hint">Ticking tasks is optional. Ticked tasks show as <b>paid by this weekly payment</b> in the work tracker; the amount is one total for the week, not per task.</p></div>`;
  };
  q('PayType').onchange=()=>{const w=q('PayType').value==='Weekly';
    if(!id){q('Reason').value=w?'Weekly Work Payment':'Specialized Task';if(w&&!q('FromDate').value){const k=weekOf(q('Date').value);q('FromDate').value=k[0];q('ToDate').value=k[1]}}sync()};
  q('Member').onchange=sync;q('Member').oninput=()=>{if(people().includes(q('Member').value.trim()))sync()};
  q('FromDate').onchange=()=>{if(q('PayType').value==='Weekly'&&q('FromDate').value){const k=weekOf(q('FromDate').value);if(q('FromDate').value===k[0]&&!q('ToDate').value)q('ToDate').value=k[1]}sync()};
  q('ToDate').onchange=sync;q('Reason').onchange=sync;
  q('Tasks').onchange=()=>{const c=D.Content.find(x=>String(x.ID)===q('Tasks').value);if(!c)return;if(!q('Amount').value&&+c.Rate)q('Amount').value=+c.Rate;if(!q('Project').value&&c.Project){const pj=D.Projects.find(x=>x.Project===c.Project);if(pj){q('TPClient').value=isInhouse(pj.Client)?INHOUSE:pj.Client;fillProj(c.Project)}}if(!q('Member').value&&c.DesignedBy){q('Member').value=c.DesignedBy;sync()}};
  sync();
}

/* ---------- Team: members, and the projects each one holds a share in ---------- */
const slotsOf=(p,name)=>[p.Investor1===name&&'Investor 1',p.Investor2===name&&'Investor 2'].filter(Boolean);
function stake(p,name){
  const a=p.Investor1===name,b=p.Investor2===name,pc=p.Inv1Pct===''?75:+p.Inv1Pct;
  const share=(a?p.Inv1:0)+(b?p.Inv2:0),paid=(a?p.Paid1:0)+(b?p.Paid2:0);
  return {Pct:(a?pc:0)+(b?100-pc:0),Share:share,Paid:paid,Due:share-paid};
}
function memberRows(name){
  return calc().filter(p=>inFY(p)&&slotsOf(p,name).length).map(p=>{const k=stake(p,name);return {...p,MyPct:k.Pct,MyShare:k.Share,MyPaid:k.Paid,MyDue:k.Due}})
    .sort((a,b)=>String(b.Date).localeCompare(a.Date));
}
function team(){
  if(ROLE==='team')return memberPage(ME.member);
  if(!TEAM_OK){main('<div class="notice"><b>Update the Apps Script backend to use Team.</b><br>Paste the new <code>apps-script/Code.gs</code>, then Deploy → Manage deployments → Edit → New version. Nothing in your sheet is moved or deleted.</div>');return}
  const TT=[['members','Members'],['payouts','Investor payouts']];
  if(R.p==='payouts'){main(tabs('team',TT,'payouts')+(PAY_OK?'':noPayBackend().replace('Team payments','Investor payout structures'))+investorView(FY));return}
  const rows=D.Team.map(t=>{const m=memberRows(t.Name);return {...t,Projects:m.length,Active:m.filter(p=>p.Status==='Active').length,Share:sum(m,'MyShare'),Paid:sum(m,'MyPaid'),Due:sum(m,'MyDue')}}).sort((a,b)=>a.Name.localeCompare(b.Name));
  const open=calc().filter(inFY).filter(p=>!p.Investor1&&!p.Investor2&&p.Status!=='Cancelled');
  main(tabs('team',TT,'members')+`<div class="stats">${stat('Team members',rows.length)}${stat('Profit share earned',inr(sum(rows,'Share')))}${stat('Paid out',inr(sum(rows,'Paid')),'in')}${stat('Still to pay out',inr(sum(rows,'Due')),sum(rows,'Due')>0?'due':'')}</div>
  ${open.length?`<div class="notice"><b>${open.length} project${open.length>1?'s have':' has'} no investor assigned.</b> Their profit share will not show on anyone's Team page. Open the project → Edit → choose Investor 1 / Investor 2. <button class="btn sm" onclick="go('projects')">Open projects</button></div>`:''}
  <section class="panel"><div class="panel-head"><h2>Members</h2><input class="filter" style="max-width:220px" type="search" placeholder="Filter" oninput="filt(this)">${adm()?`<button class="btn primary" onclick="edit('Team')">${ico('plus')}Add member</button>`:''}</div>
  <p class="muted" style="margin-top:-4px">Each member sees only the projects where they are Investor 1 or Investor 2. Open a member to see exactly what they see.</p>
  ${table(rows,[['Name','Member','text',{sub:r=>[r.Role,r.Phone].filter(Boolean).join(' · ')}],['Projects','Projects','num'],['Share','Profit share','money'],['Paid','Paid out','money',{color:'in'}],['Due','To pay out','money']],
    {total:['Share','Paid','Due'],href:r=>'member/'+r.Name,empty:'No team members yet. Add one, then choose them as Investor 1 / Investor 2 on a project.',
     act:r=>`<button class="btn sm" onclick="go(${js('member/'+r.Name)})">Open</button>`+(adm()?more([['Edit',`edit('Team','${r.ID}')`],['Create login',`editUser(null,{role:'team',member:${js(r.Name)}})`],['Delete',`del('Team','${r.ID}')`]]):'')})}
  </section>`);
}
function memberRoute(){memberPage(R.p)}
function memberPage(name){
  const self=ROLE==='team',t=D.Team.find(x=>x.Name===name);
  if(!t&&!self){main(`<a class="back" href="#team">${ico('back')}All team</a><div class="empty">There is no team member called ${esc(name)}.</div>`);return}
  const T=t||{Name:name},P=memberRows(name);
  const share=sum(P,'MyShare'),paid=sum(P,'MyPaid'),due=share-paid,ph=T.Phone;
  const hasPlans=D.InvestorPlans.some(x=>x.Investor===name)||D.Payouts.some(x=>x.Member===name&&!x.Project);
  const link=(href,i,l)=>`<a class="btn sm" href="${esc(href)}" target="_blank" rel="noopener">${ico(i)}${l}</a>`;
  main(`${self?'':`<a class="back" href="#team">${ico('back')}All team</a>`}
  <div class="chead"><div class="avatar">${esc((name[0]||'?').toUpperCase())}</div>
    <div><h2>${esc(name)}</h2><div class="muted">${esc([T.Role,T.Email,T.JoinDate&&'Joined '+fmtD(T.JoinDate)].filter(Boolean).join(' · '))}</div>
    ${!self&&(ph||T.Email)?`<div class="row" style="margin-top:10px">${ph?link('tel:'+ph,'phone',esc(ph)):''}${ph?link('https://wa.me/'+waPhone(ph),'chat','WhatsApp'):''}${T.Email?link('mailto:'+T.Email,'mail','Email'):''}</div>`:''}</div>
    <div class="acts row noprint"><button class="btn" onclick="print()">${ico('print')}Print statement</button>${adm()&&T.ID?more([['Edit details',`edit('Team','${T.ID}')`],['Create login',`editUser(null,{role:'team',member:${js(name)}})`],['Delete member',`del('Team','${T.ID}')`]]):''}</div></div>
  <div class="stats">${stat(self?'Your projects':'Projects',P.length,'',`${P.filter(p=>p.Status==='Active').length} active`)}${stat('Profit share',inr(share),share<0?'due':'','from money received so far')}${stat('Paid out',inr(paid),'in',self?'paid to you':'')}${stat(self?'Still to receive':'Still to pay out',inr(due),due>0?'due':'')}</div>
  <section class="panel"><div class="panel-head"><h2>${self?'Projects you hold a share in':'Projects '+esc(name)+' holds a share in'}</h2><input class="filter" style="max-width:220px" type="search" placeholder="Filter" oninput="filt(this)"></div>
  ${table(P,[['Project','Project','text',{sub:r=>r.Client+' · '+fmtD(r.Date)}],['Status','Status','pill'],['Budget','Value','money'],['Received','Received','money',{color:'in'}],['Profit','Profit','money'],['MyPct',self?'Your %':'Share %','pct'],['MyShare','Share','money'],['MyPaid','Paid','money',{color:'in'}],['MyDue','Due','money']],
    {total:['Budget','Received','Profit','MyShare','MyPaid','MyDue'],empty:self?'No projects are assigned to you yet. Please ask the admin.':'No projects assigned yet. Open a project → Edit → set Investor 1 / Investor 2.',
     act:r=>`<button class="btn sm" onclick="teamProject('${r.ID}',${js(name)})">Details</button>`})}</section>
  <h2 style="margin:22px 0 12px">${self?'Your investment and payouts':'Investment and payouts'}</h2>
  ${investorView(FY,{member:name,readonly:self,noStats:!hasPlans})}`);
}
function teamProject(id,name){
  const p=calc().find(x=>x.ID===id);if(!p)return;
  const k=stake(p,name),self=ROLE==='team',slots=slotsOf(p,name);
  const pays=D.Payments.filter(x=>x.Project===p.Project).sort((a,b)=>String(b.Date).localeCompare(a.Date));
  const exps=D.Expenses.concat(teamAlloc()).filter(x=>x.Project===p.Project).sort((a,b)=>String(b.Date).localeCompare(a.Date));
  const pos=D.Payouts.filter(x=>x.Project===p.Project&&paidPO(x)&&slots.includes(x.Investor)).sort((a,b)=>String(b.Date).localeCompare(a.Date));
  openSheet(p.Project,`<div class="full">
    <div class="muted" style="margin-bottom:12px">${esc([p.Client,p.Type,p.Organization,'Started '+fmtD(p.Date)].filter(Boolean).join(' · '))} <span class="pill ${PILL[p.Status]??''}">${esc(p.Status)}</span></div>
    <div class="stats">${stat('Project value',inr(p.Budget))}${stat('Received',inr(p.Received),'in',p.Balance>0?inr(p.Balance)+' still to come from the client':'fully received')}${stat('Costs',inr(p.Spent),'',p.HandsOn?'+ '+inr(p.HandsOn)+' team share':'')}${stat('Profit',inr(p.Profit),p.Profit<0?'due':'in',p.Margin+'% margin')}</div>
    <div class="stats">${stat(self?'Your share':'Share',inr(k.Share),k.Share<0?'due':'',k.Pct+'% of the profit')}${stat('Paid out',inr(k.Paid),'in')}${stat(self?'Still to receive':'Still to pay out',inr(k.Due),k.Due>0?'due':'')}</div>
    <h3>Payments received from the client</h3>${table(pays,[['Date','Date','date'],['Mode','Mode'],['Amount','Amount','money',{color:'in'}]],{total:['Amount'],empty:'No payments received yet.'})}
    <h3 style="margin-top:18px">Project costs</h3>${table(exps,[['Date','Date','date'],['Category','Category','text',{sub:'PaidTo'}],['Amount','Amount','money']],{total:['Amount'],empty:'No costs recorded.'})}
    <h3 style="margin-top:18px">Payouts ${self?'to you':'to '+esc(name)}</h3>${table(pos,[['Date','Date','date'],['Notes','Notes'],['Amount','Amount','money',{color:'in'}]],{total:['Amount'],empty:'No payouts recorded yet.'})}
  </div>`,null,'Save',true);
}

/* ---------- Investor payout structure ----------
   App_InvestorPlans holds each investor's arrangement (investment, structure, rate, payout period).
   Payable:  Profit share → their share of each project's profit (as set on the project: Investor 1 / 2 and share %)
             Fixed return % → investment × rate % for every payout period that has fallen due
             Fixed amount → the fixed ₹ for every payout period that has fallen due
             Manual → the "Amount payable" you enter on each payout entry
   Paid = payouts recorded (status Paid / Partly paid). Pending = payable − paid.                                 */
const FREQ_M={Monthly:1,Quarterly:3,'Half-yearly':6,Yearly:12};
function poMember(x){if(x.Member)return x.Member;const p=D.Projects.find(q=>q.Project===x.Project);return p?(x.Investor==='Investor 1'?p.Investor1:x.Investor==='Investor 2'?p.Investor2:'')||'':''}
function planDues(pl){
  const st=String(pl.StartDate||pl.InvestDate||'').slice(0,10);if(!st)return[];
  const lim=pl.EndDate&&pl.EndDate<today()?pl.EndDate:today();
  const base=pl.Structure==='Fixed return %'?(+pl.Investment||0)*(+pl.Rate||0)/100:pl.Structure==='Fixed amount'?(+pl.Rate||0):0;
  if(!base)return[];
  if(pl.Frequency==='One-time'){const d=pl.EndDate||st;return d<=today()?[{Date:d,Amount:base}]:[]}
  const n=FREQ_M[pl.Frequency]||1,out=[];
  for(let k=1;k<1200;k++){const d=addMonths(st,k*n);if(d>lim)break;out.push({Date:d,Amount:base})}
  return out;
}
const FREQ_TXT={Monthly:'per month',Quarterly:'per quarter','Half-yearly':'per half year',Yearly:'per year','One-time':'one time','Per project':'per project'};
const planText=pl=>{const f=FREQ_TXT[pl.Frequency]||'per month';return pl.Structure==='Profit share'?'Share of project profit (as set on each project)':pl.Structure==='Fixed return %'?`${+pl.Rate||0}% of ${inr(pl.Investment)} ${f}`:
  pl.Structure==='Fixed amount'?`${inr(pl.Rate)} ${f}`:'Payable entered on each payout'};
function investorRows(p){
  p=p||'all';const P=calc(),out=[],f=r=>inPer(r,p);
  const withPlan=new Set(D.InvestorPlans.filter(x=>x.Structure==='Profit share').map(x=>x.Investor));
  const shareOf=name=>{const ps=P.filter(x=>f(x)&&slotsOf(x,name).length).map(x=>stake(x,name));return {pay:sum(ps,'Share'),paid:sum(ps,'Paid'),n:ps.length}};
  const POs=id=>D.Payouts.filter(x=>String(x.Plan)===String(id));
  D.InvestorPlans.forEach(pl=>{
    const mine=POs(pl.ID).filter(f),last=POs(pl.ID).concat(pl.Structure==='Profit share'?D.Payouts.filter(x=>!x.Plan&&poMember(x)===pl.Investor):[]).filter(paidPO).map(x=>x.Date).sort().pop()||'';
    let pay=0,paid=sum(mine.filter(paidPO),'Amount');
    if(pl.Structure==='Profit share'){const s=shareOf(pl.Investor);pay=s.pay;paid+=s.paid}
    else if(pl.Structure==='Manual'||pl.Frequency==='Per project')pay=sum(mine,'Payable')||sum(mine.filter(x=>!x.Payable),'Amount');
    else pay=sum(planDues(pl).filter(f),'Amount');
    out.push({...pl,Plan:pl,Text:planText(pl),Period:[pl.Frequency,pl.StartDate&&'from '+fmtD(pl.StartDate),pl.EndDate&&'to '+fmtD(pl.EndDate)].filter(Boolean).join(' · '),
      Payable:pay,Paid:paid,Pending:Math.max(0,pay-paid),Over:Math.max(0,paid-pay),Last:last,State:pl.Status==='Closed'&&Math.abs(pay-paid)<1?'Closed':pay-paid>1?'Due':pay-paid<-1?'Overpaid':'Settled'});
  });
  // investors who hold project shares but have no structure yet still appear (profit share)
  [...new Set(D.Projects.flatMap(x=>[x.Investor1,x.Investor2]).filter(Boolean))].filter(n=>!withPlan.has(n)).forEach(n=>{
    const s=shareOf(n);if(!s.n)return;
    const last=D.Payouts.filter(x=>!x.Plan&&poMember(x)===n&&paidPO(x)).map(x=>x.Date).sort().pop()||'';
    out.push({ID:'',Investor:n,Investment:'',Structure:'Profit share',Text:'Share of project profit (no structure added yet)',Period:'Per project',Payable:s.pay,Paid:s.paid,Pending:Math.max(0,s.pay-s.paid),Over:Math.max(0,s.paid-s.pay),Last:last,State:s.pay-s.paid>1?'Due':s.pay-s.paid<-1?'Overpaid':'Settled',Virtual:1});
  });
  return out.sort((a,b)=>a.Investor.localeCompare(b.Investor));
}
function payoutRows(p){
  const PL={};D.InvestorPlans.forEach(x=>PL[x.ID]=x);
  return D.Payouts.filter(r=>inPer(r,p)).map(x=>{const pl=PL[x.Plan];return {...x,Who:poMember(x)||x.Investor||'',Under:pl?pl.Structure+(pl.Structure!=='Profit share'?' · '+planText(pl):''):x.Project?'Profit share':'',
    Period:periodTxt(x),PayableAmt:x.Payable===''||x.Payable==null?+x.Amount||0:+x.Payable,PaidAmt:paidPO(x)?+x.Amount||0:0,St:x.Status||'Paid'}})
    .sort((a,b)=>String(b.Date).localeCompare(a.Date));
}
function investorView(p,opt={}){
  const rows=investorRows(p),led=payoutRows(p),only=opt.member?r=>r.Investor===opt.member:()=>true,R2=rows.filter(only),L2=led.filter(r=>!opt.member||r.Who===opt.member);
  const act=adm()&&!opt.readonly;
  return `${opt.noStats?'':`<div class="stats">${stat('Invested',inr(sum(R2.filter(r=>!r.Virtual),'Investment')),'',R2.filter(r=>!r.Virtual).length+' structure'+(R2.filter(r=>!r.Virtual).length===1?'':'s'))}${stat('Payable',inr(sum(R2,'Payable')),'',perLabel(p))}${stat('Paid',inr(sum(R2,'Paid')),'in')}${stat('Pending',inr(sum(R2.filter(r=>r.Pending>0),'Pending')),sum(R2.filter(r=>r.Pending>0),'Pending')>1?'due':'')}</div>`}
  <section class="panel"><div class="panel-head"><h2>Payout structure</h2>${act?`<button class="btn" onclick="edit('InvestorPlans',null,{Investor:${js(opt.member||'')}})">${ico('plus')}Add structure</button><button class="btn primary" onclick="edit('Payouts',null,{Member:${js(opt.member||'')}})">${ico('plus')}Record payout</button>`:''}</div>
  ${table(R2,[['Investor','Investor','text',{sub:'Text'}],['Investment','Investment','money',{blank:1}],['Period','Payout period'],['Payable','Payable','money'],['Paid','Paid','money',{color:'in'}],['Pending','Pending','money',{color:'due',blank:1}],['Last','Last paid','date'],['State','Status','pill',{sub:r=>r.Over>1?inr(r.Over)+' paid extra'+(r.Notes?' · '+r.Notes:''):r.Notes}]],
    {total:['Investment','Payable','Paid','Pending'],empty:'No investors yet. Add a payout structure, or set Investor 1 / Investor 2 on projects.',
     act:act?r=>(r.Pending>1?`<button class="btn sm" onclick="edit('Payouts',null,{Member:${js(r.Investor)},Plan:${js(r.ID||'')},Payable:${Math.round(r.Pending*100)/100},Amount:${Math.round(r.Pending*100)/100}})">${ico('wallet')}Pay</button>`:'')+more([r.Virtual?['Add structure',`edit('InvestorPlans',null,{Investor:${js(r.Investor)},Structure:'Profit share',Frequency:'Per project'})`]:['Edit structure',`edit('InvestorPlans','${r.ID}')`],['Open member',`go(${js('member/'+r.Investor)})`],r.Virtual?null:['Delete structure',`del('InvestorPlans','${r.ID}')`]]):null})}
  <p class="muted" style="font-size:13px;margin:10px 0 0">Profit share uses each project's Investor 1 / Investor 2 and share %, on money received so far. Fixed returns fall due at the end of each payout period from the start date.</p></section>
  <section class="panel"><div class="panel-head"><h2>Payout entries</h2><input class="filter" style="max-width:220px" type="search" placeholder="Filter" oninput="filt(this)">${opt.readonly?'':`<button class="btn" onclick="csv('Payouts')">Export</button>`}</div>
  ${table(L2,[['Who','Investor','text',{sub:r=>[r.Under,r.Project].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i).join(' · ')}],['Period','Payout period'],['PayableAmt','Payable','money'],['PaidAmt','Paid','money',{color:'in'}],['Date','Payment date','date'],['St','Status','pill',{sub:'Notes'}]],
    {total:['PayableAmt','PaidAmt'],empty:'No payouts in this period.',act:act?r=>more([['Edit',`edit('Payouts','${r.ID}')`],['Delete',`del('Payouts','${r.ID}')`]]):null})}</section>`;
}

/* ---------- Invoices ---------- */
function invTable(I){
  return table(I,[['No','Invoice','text',{sub:r=>r.Client+(r.Title?' · '+r.Title:'')}],['Date','Date','date'],['ValidDate','Due','date'],['Total','Total','money'],['Paid','Paid','money',{color:'in'}],['Balance','Balance','money'],['State','Status','pill']],
    {total:['Total','Paid','Balance'],act:r=>`<button class="btn sm" onclick="printDoc('${r.ID}')">${ico('print')}View</button>`+more([
      adm()&&r.Balance>0&&r.State!=='Cancelled'?['Record payment',`payInvoice('${r.ID}')`]:null,r.Balance>0&&r.State!=='Cancelled'?['WhatsApp reminder',`remindInv('${r.ID}')`]:null,
      ['Open client',`go(${js('client/'+r.Client)})`],adm()?['Duplicate',`dupDoc('${r.ID}')`]:null,adm()?['Edit',`editDoc('${r.ID}')`]:null,adm()?['Delete',`del('Docs','${r.ID}')`]:null]),
     empty:'No invoices here.'});
}
function invoices(){
  const all=docs('Invoice').filter(inFY).map(invCalc).sort((a,b)=>String(b.Date).localeCompare(a.Date)||String(b.No).localeCompare(a.No));
  const live=all.filter(d=>d.State!=='Cancelled'),f=F.invoices||'all';
  const sets={all:all,open:live.filter(d=>d.Balance>0),Overdue:all.filter(d=>d.State==='Overdue'),Paid:all.filter(d=>d.State==='Paid'),Cancelled:all.filter(d=>d.State==='Cancelled')};
  main(`<div class="stats">${stat('Invoiced',inr(sum(live,'Total')),'',`${live.length} invoices`)}${stat('Collected',inr(sum(live,'Paid')),'in')}${stat('Balance due',inr(sum(live,'Balance')),sum(live,'Balance')>0?'due':'')}${stat('Overdue',sets.Overdue.length,sets.Overdue.length?'due':'')}</div>
  <section class="panel"><div class="toolbar"><input class="filter" type="search" placeholder="Filter invoices" oninput="filt(this)">
    ${chips('invoices',[['all','All',all.length],['open','Unpaid',sets.open.length],['Overdue','Overdue',sets.Overdue.length],['Paid','Paid',sets.Paid.length],['Cancelled','Cancelled',sets.Cancelled.length]],f)}
    <span class="spacer"></span>${adm()?`<button class="btn primary" onclick="newDoc('Invoice')">${ico('plus')}New invoice</button>`:''}</div>
    ${invTable(sets[f]||all)}</section>`);
}

/* ---------- Quotations ---------- */
function quoteTable(Q){
  return table(Q,[['No','Quotation','text',{sub:r=>r.Client+' · '+items(r).map(x=>x.title).join(', ')}],['Date','Date','date'],['Plan','Plan'],['Total','Amount','money'],['Status','Status','pill']],
    {total:['Total'],act:r=>`<button class="btn sm" onclick="printDoc('${r.ID}')">${ico('print')}View</button>`+more([
      adm()&&r.Status!=='Accepted'?['Convert to invoice',`quoteToInvoice('${r.ID}')`]:null,adm()&&r.Status==='Draft'?['Mark as sent',`setQStatus('${r.ID}','Sent')`]:null,
      adm()&&r.Status==='Sent'?['Mark as rejected',`setQStatus('${r.ID}','Rejected')`]:null,['Share on WhatsApp',`shareQuote('${r.ID}')`],
      adm()?['Duplicate',`dupDoc('${r.ID}')`]:null,adm()?['Edit',`editDoc('${r.ID}')`]:null,adm()?['Delete',`del('Docs','${r.ID}')`]:null]),empty:'No quotations here.'});
}
function quotations(){
  const all=docs('Quotation').filter(inFY).sort((a,b)=>String(b.Date).localeCompare(a.Date)||String(b.No).localeCompare(a.No)),f=F.quotations||'all';
  const c=s=>all.filter(q=>q.Status===s),dec=c('Accepted').length+c('Rejected').length;
  main(`<div class="stats">${stat('Open quotes',inr(sum(all.filter(q=>q.Status==='Draft'||q.Status==='Sent'),'Total')),'',`${c('Draft').length} draft · ${c('Sent').length} sent`)}${stat('Won',inr(sum(c('Accepted'),'Total')),'in',`${c('Accepted').length} accepted`)}${stat('Win rate',dec?Math.round(c('Accepted').length/dec*100)+'%':'—')}</div>
  <section class="panel"><div class="toolbar"><input class="filter" type="search" placeholder="Filter quotations" oninput="filt(this)">
    ${chips('quotations',[['all','All',all.length],['Draft','Draft',c('Draft').length],['Sent','Sent',c('Sent').length],['Accepted','Accepted',c('Accepted').length],['Rejected','Rejected',c('Rejected').length]],f)}
    <span class="spacer"></span>${adm()?`<button class="btn primary" onclick="newDoc('Quotation')">${ico('plus')}New quotation</button>`:''}</div>
    ${quoteTable(f==='all'?all:c(f))}</section>`);
}
async function setQStatus(id,s){const q=D.Docs.find(x=>x.ID===id);try{await api('saveRow',TOKEN,'Docs',{...q,Status:s});toast('Quotation marked '+s.toLowerCase());await load()}catch(e){alert(e.message||e)}}

/* ---------- Payments ---------- */
function payTable(rows){
  return table(rows,[['Client','Client','text',{sub:'Project'}],['Date','Date','date'],['InvoiceNo','Invoice'],['Mode','Mode'],['ReceiptNo','Receipt'],['Amount','Amount','money',{color:'in'}]],
    {total:['Amount'],act:r=>(r.ReceiptNo||adm()?`<button class="btn sm" onclick="receipt('${r.ID}')">${ico('print')}Receipt</button>`:'')+(adm()?more([['Edit',`edit('Payments','${r.ID}')`],['Delete',`del('Payments','${r.ID}')`]]):''),empty:'No payments here.'});
}
function payments(){
  const all=D.Payments.filter(inFY).map(p=>({...p,Client:payClient(p)})).sort((a,b)=>String(b.Date).localeCompare(a.Date));
  const rows=all;
  main(`<div class="stats">${stat('Received · '+perLabel(FY),inr(sum(rows,'Amount')),'in',`${rows.length} payments`)}${stat('Receipts issued',rows.filter(r=>r.ReceiptNo).length)}${stat('Not linked to an invoice',rows.filter(r=>!r.InvoiceNo).length,'','link them so invoices show paid')}</div>
  <section class="panel"><div class="toolbar"><input class="filter" type="search" placeholder="Filter payments" oninput="filt(this)">
    <span class="spacer"></span>${adm()?`<button class="btn primary" onclick="edit('Payments')">${ico('plus')}Record payment</button>`:''}<button class="btn" onclick="csv('Payments')">Export</button></div>
    ${payTable(rows)}</section>`);
}

/* ---------- Expenses ---------- */
function listPanel(name,title,rows,cols,opt={}){
  return `<section class="panel"><div class="panel-head"><h2>${title}</h2><input class="filter" style="max-width:220px" type="search" placeholder="Filter" oninput="filt(this)">
    ${adm()?`<button class="btn primary" onclick="edit('${name}')">${ico('plus')}Add</button>`:''}<button class="btn" onclick="csv('${name}')">Export</button></div>
    ${table(rows,cols,{total:cols.filter(c=>c[2]==='money').map(c=>c[0]),act:adm()?r=>more([['Edit',`edit('${name}','${r.ID}')`],['Delete',`del('${name}','${r.ID}')`]]):null,...opt})}</section>`;
}
function expenses(){
  if(R.p==='team'||R.p==='design'){location.replace('#work/'+(R.p==='team'?'pay':'tasks'));return}   // moved to Work tracker
  const t=R.p||'project',byDate=a=>a.filter(inFY).sort((x,y)=>String(y.Date||y.StartDate).localeCompare(x.Date||x.StartDate));
  const T=[['project','Project costs'],['company','Company expenses'],['ads','Ads & wallet']];
  let h='';
  if(t==='project')h=listPanel('Expenses','Project costs',byDate(D.Expenses),[['Project','Project','text',{sub:r=>r.Category+(r.PaidTo?' · '+r.PaidTo:'')}],['Date','Date','date'],['Category','Category'],['Amount','Amount','money']]);
  else if(t==='company'){
    const all=byDate(D.CompanyExp),ex=opEx(all),as=all.filter(isAsset),by=k=>sum(as.filter(a=>(a.FundedBy||'Not set')===k),'Amount');
    const funds=[...new Set(as.map(a=>a.FundedBy||'Not set'))];
    const look=ex.filter(e=>/domain|hosting|server|laptop|computer|mobile|camera|software|licen/i.test(e.Reason+' '+e.PaidFor));
    const act=(r,k)=>adm()?more([['Edit',`edit('CompanyExp','${r.ID}')`],k==='a'?['Change to running expense',`setKind('${r.ID}','Expense')`]:['Change to company asset',`setKind('${r.ID}','Asset')`],['Delete',`del('CompanyExp','${r.ID}')`]]):'';
    h=`<div class="stats">${stat('Running expenses',inr(sum(ex,'Amount')),'',`${ex.length} entr${ex.length===1?'y':'ies'} · deducted from profit`)}${stat('Company assets',inr(sum(as,'Amount')),'',`${as.length} entr${as.length===1?'y':'ies'} · not deducted from profit`)}${funds.map(f=>stat('Assets settled by '+esc(f),inr(by(f)),f==='Not set'?'due':'')).join('')}</div>
    ${look.length&&adm()?`<div class="notice warn">${look.length} running expense${look.length>1?'s look':' looks'} like a company asset (${look.slice(0,3).map(e=>esc(e.Reason)).join(', ')}${look.length>3?'…':''}). Use ⋯ → <b>Change to company asset</b> so ${look.length>1?'they are':'it is'} not deducted from profit.</div>`:''}
    <section class="panel"><div class="panel-head"><h2>Running expenses</h2><input class="filter" style="max-width:220px" type="search" placeholder="Filter" oninput="filt(this)">${adm()?`<button class="btn primary" onclick="edit('CompanyExp',null,{Kind:'Expense'},'Add company expense')">${ico('plus')}Add</button>`:''}<button class="btn" onclick="csv('CompanyExp')">Export</button></div>
    <p class="muted" style="margin-top:-6px">Day-to-day costs (internet, rent, tools). These are deducted from company profit.</p>
    ${table(ex,[['Reason','Reason','text',{sub:'PaidFor'}],['Date','Date','date'],['PaidTo','Paid to'],['Amount','Amount','money']],{total:['Amount'],act:r=>act(r,'e'),empty:'No running expenses.'})}</section>
    <section class="panel"><div class="panel-head"><h2>Company assets</h2><input class="filter" style="max-width:220px" type="search" placeholder="Filter" oninput="filt(this)">${adm()?`<button class="btn primary" onclick="newAsset()">${ico('plus')}Add asset</button>`:''}</div>
    <p class="muted" style="margin-top:-6px">Things the company owns – domain, hosting, laptop, software. Settled by the investors or the company's project fund, so they are <b>not</b> deducted from company profit.</p>
    ${table(as,[['Reason','Asset','text',{sub:'PaidFor'}],['Date','Date','date'],['FundedBy','Settled by'],['PaidTo','Paid to'],['Amount','Amount','money']],{total:['Amount'],act:r=>act(r,'a'),empty:'No company assets yet. Add a domain, hosting or equipment here.'})}</section>`;
  }
  else{
    const A=D.Ads.filter(inFY),w=wallet();
    h=`<div class="stats">${stat('Wallet balance',inr(w),w<500?'due':'','all time')}${stat('Recharged',inr(sum(D.Recharges.filter(inFY),'Amount')))}${stat('Ad spend incl. GST',inr(sum(A,'Total')))}${stat('Running ads',A.filter(a=>a.Result==='Running').length)}</div>`+
      listPanel('Ads','Ad campaigns',byDate(D.Ads),[['AdSet','Ad','text',{sub:r=>r.Project+' · '+r.Platform}],['StartDate','Started','date'],['Result','Result','pill'],['Total','Spent incl. GST','money']])+
      listPanel('Recharges','Wallet recharges',byDate(D.Recharges),[['Project','Project','text',{sub:'Platform'}],['Date','Date','date'],['Amount','Amount','money']]);
  }
  main(tabs('expenses',T,t)+(t==='project'?`<p class="muted" style="margin:-4px 0 12px">Team payments and the work log are under <a href="#work/pay">Work tracker</a>.</p>`:'')+h);
}

function newAsset(){edit('CompanyExp',null,{Kind:'Asset',FundedBy:'Project fund'},'Add company asset')}
async function setKind(id,k){const r=D.CompanyExp.find(x=>x.ID===id);if(!r)return;
  if(k==='Asset'){edit('CompanyExp',id,{},'Change to company asset');const q=$('mb').querySelector('[name=Kind]');if(q)q.value='Asset';const f=$('mb').querySelector('[name=FundedBy]');if(f&&!f.value)f.value='Project fund';return}
  try{await api('saveRow',TOKEN,'CompanyExp',{...r,Kind:'Expense',FundedBy:''});toast('Changed to running expense');await load()}catch(e){alert(e.message||e)}}

/* ---------- Reports: every tab follows the same period (All / Year / Month) ---------- */
function reports(){
  let t=R.p||'summary';if(t==='monthly')t='summary';
  const T=[['summary','Financial summary'],['team','Team payments'],['work','Work tracker'],['expenses','Expenses'],['investors','Investor payouts'],['health','Health check']].concat(adm()?[['activity','Activity log']]:[]);
  if(!T.some(x=>x[0]===t))t='summary';
  const noPer=['health','activity'].includes(t);
  main(tabs('reports',T,t)+(noPer?'':`<div class="toolbar noprint"><span class="muted" style="font-weight:600">Period</span>${perPicker(FY,'setFY')}${FY!=='all'?`<button class="btn sm" onclick="setFY('all')">All years</button>`:''}<span class="spacer"></span><button class="btn" onclick="print()">${ico('print')}Print report</button></div>
    <h2 class="rep-title">${esc(T.find(x=>x[0]===t)[1])} · ${esc(perLabel(FY))}</h2>`)+`<div id="rep"></div>`);
  ({summary:repSummary,team:repTeam,work:repWork,expenses:repExpenses,investors:repInvestors,health:repHealth,activity:repActivity})[t]();
}
const grpSum=(a,k,v)=>{const o={};a.forEach(x=>{const n=(typeof k==='function'?k(x):x[k])||'Other';o[n]=(o[n]||0)+(+x[v]||0)});return Object.entries(o).filter(x=>x[1]).sort((a,b)=>b[1]-a[1])};
const hbarsH=(list,empty)=>{const mx=list.length?Math.abs(list[0][1])||1:1;return list.length?`<div class="hbars">${list.map(([n,v])=>`<div class="hbar"><span>${esc(n)}</span><i style="width:${Math.max(4,Math.abs(v)/mx*100)}%"></i><b>${inr(v)}</b></div>`).join('')}</div>`:`<div class="empty">${empty||'Nothing in this period.'}</div>`};
/* sub-periods of the chosen period: all → years, a year → its months */
function subPeriods(p){
  if(p.length===7)return[];
  const ks=new Set();[D.Payments,D.Expenses,D.CompanyExp,D.TeamPay,D.Payouts].forEach(a=>a.forEach(r=>{const d=String(r.Date||'');if(inPer(r,p)&&/^\d{4}-\d{2}/.test(d))ks.add(p==='all'?d.slice(0,4):d.slice(0,7))}));
  return [...ks].sort().reverse();
}
function repSummary(){
  const p=FY,f=r=>inPer(r,p),H=handsOn(p),Hall=handsOn('all');
  const pays=D.Payments.filter(f).map(x=>({...x,Client:payClient(x)})),ex=D.Expenses.filter(f),tp=D.TeamPay.filter(f).filter(paidTP),cx=opEx(D.CompanyExp.filter(f)),ax=D.CompanyExp.filter(f).filter(isAsset);
  const inv=docs('Invoice').filter(f).map(invCalc).filter(d=>d.State!=='Cancelled'),qs=docs('Quotation').filter(f);
  const cost=H.proj+H.team+H.comp,net=H.rec-cost;
  const rows=subPeriods(p).map(k=>{const h=handsOn(k);return {Per:k.length===4?k:monthName(k),Key:k,Received:h.rec,Proj:h.proj,Team:h.team,Comp:h.comp+h.fund,Inv:h.inv,Net:h.net}});
  $('rep').innerHTML=`<div class="stats">${stat('Received',inr(H.rec),'in',`${pays.length} payment${pays.length===1?'':'s'}`)}${stat('Costs',inr(cost),'',`${inr(H.proj)} project · ${inr(H.team)} team · ${inr(H.comp)} company`)}${stat('Net profit',inr(net),net<0?'due':'in',ax.length?inr(sum(ax,'Amount'))+' company assets not deducted':'received minus costs')}${stat('Invoices raised',inr(sum(inv,'Total')),'',`${inv.length} invoices · ${qs.length} quotations`)}</div>
  <div class="grid2"><section class="panel ho-panel"><h2>Hands-On Money</h2><div class="ho-fig sm ${H.net<0?'due':''}">${inr(H.net)}</div><p class="muted" style="margin:2px 0 10px">${p==='all'?'Money in hand now, after every cost and payout.':'Added to money in hand in this period.'+` Overall: <b>${inr(Hall.net)}</b>`}</p><table class="calc">${hoRows(H)}</table></section>
  <section class="panel"><h2>Where the money went</h2>${hbarsH([['Project costs',H.proj],['Team payments',H.team],['Company expenses',H.comp],['Assets (project fund)',H.fund],['Investor payouts',H.inv]].filter(x=>x[1]).sort((a,b)=>b[1]-a[1]))}</section></div>
  ${rows.length?`<section class="panel mt"><h2>${p==='all'?'Year by year':'Month by month'}</h2>${table(rows,[['Per',p==='all'?'Year':'Month'],['Received','Received','money',{color:'in'}],['Proj','Project costs','money'],['Team','Team payments','money'],['Comp','Company exp.','money'],['Inv','Investor payouts','money'],['Net','Hands-on','money']],
    {total:['Received','Proj','Team','Comp','Inv','Net'],act:r=>`<button class="btn sm noprint" onclick="setFY('${r.Key}')">Open</button>`})}</section>`:''}
  <div class="grid2 mt"><section class="panel"><h2>Received by client</h2>${hbarsH(grpSum(pays,'Client','Amount').slice(0,10))}</section><section class="panel"><h2>Costs by type</h2>${hbarsH(grpSum(ex.concat(tp.map(x=>({...x,Category:'Team payments'})),cx.map(c=>({...c,Category:'Company: '+(c.Reason||'Other')}))),'Category','Amount').slice(0,10))}</section></div>
  ${p!=='all'?`<section class="panel mt"><h2>Payments received</h2>${payTable(pays.sort((a,b)=>String(b.Date).localeCompare(a.Date)))}</section>`:''}
  <p class="muted" style="font-size:13px">Hands-On Money = received − project costs − team payments − company running expenses − assets paid from the project fund − investor payouts. Project costs from your old sheet are dated on each project's start date.</p>`;
}
function repTeam(){
  const all=D.TeamPay.filter(inFY),paid=all.filter(paidTP),M=memberPayRows().filter(r=>r.Total||r.Pending);
  const tot=t=>sum(paid.filter(x=>x.PayType===t),'Amount');
  $('rep').innerHTML=`${noPayBackend()}<div class="stats">${stat('Paid to the team',inr(sum(paid,'Amount')),'',paid.length+' payments')}${stat('Task-based',inr(tot('Task-Based')))}${stat('Weekly',inr(tot('Weekly')))}${stat('Pending',inr(sum(all.filter(x=>!paidTP(x)),'Amount')),all.some(x=>!paidTP(x))?'due':'')}</div>
  <div class="grid2"><section class="panel"><h2>By team member</h2>${hbarsH(grpSum(paid,'Member','Amount'))}</section><section class="panel"><h2>By reason</h2>${hbarsH(grpSum(paid,reasonOf,'Amount'))}</section></div>
  <section class="panel mt"><h2>Team members</h2>${table(M,[['Person','Team member'],['TaskPaid','Task-based','money'],['WeeklyPaid','Weekly','money'],['OtherPaid','Other','money'],['Total','Total paid','money',{color:'in'}],['Pending','Pending','money',{color:'due'}]],{total:['TaskPaid','WeeklyPaid','OtherPaid','Total','Pending'],empty:'No team payments in this period.'})}</section>
  <section class="panel"><h2>All team payments</h2>${teamPayTable(all)}</section>`;
}
function repWork(){
  const T=taskRows(),M=memberPayRows().filter(r=>r.Tasks);
  const P={};T.forEach(c=>{const o=P[c.Project||'No project']=P[c.Project||'No project']||{Project:c.Project||'No project',Tasks:0,Unpaid:0,Task:0,Weekly:0,Cost:0};o.Tasks++;if(c.Key==='unpaid')o.Unpaid++;if(c.Key==='task')o.Task++;if(c.Key==='weekly')o.Weekly++});
  teamAlloc().filter(inFY).forEach(a=>{if(P[a.Project])P[a.Project].Cost+=a.Amount});
  const k=x=>T.filter(r=>r.Key===x).length;
  $('rep').innerHTML=`<div class="stats">${stat('Tasks done',T.length)}${stat('Paid per task',k('task'),'',inr(sum(T,'Amt')))}${stat('Paid in weekly payments',k('weekly'))}${stat('Not paid yet',k('unpaid'),k('unpaid')?'due':'',k('earlier')?k('earlier')+' paid before team payments':'')}</div>
  <section class="panel"><h2>By team member</h2>${table(M.map(r=>({...r,Paid:r.Tasks-r.Unpaid})),[['Person','Team member'],['Tasks','Tasks','num'],['Paid','Paid','num'],['Unpaid','Not paid','num'],['TaskPaid','Task-based ₹','money'],['WeeklyPaid','Weekly ₹','money'],['Total','Total paid','money',{color:'in'}]],{total:['TaskPaid','WeeklyPaid','Total'],empty:'No work logged in this period.'})}</section>
  <section class="panel"><h2>By project</h2>${table(Object.values(P).sort((a,b)=>b.Tasks-a.Tasks),[['Project','Project'],['Tasks','Tasks','num'],['Task','Paid · task','num'],['Weekly','Paid · weekly','num'],['Unpaid','Not paid','num'],['Cost','Team cost (paid)','money']],{total:['Cost'],empty:'No work logged in this period.'})}</section>`;
}
function repExpenses(){
  const f=inFY,ex=D.Expenses.filter(f),tp=D.TeamPay.filter(f).filter(paidTP),cx=opEx(D.CompanyExp.filter(f)),ax=D.CompanyExp.filter(f).filter(isAsset),ads=D.Ads.filter(f),rc=D.Recharges.filter(f);
  const byP=grpSum(ex.concat(teamAlloc().filter(f)),'Project','Amount');
  $('rep').innerHTML=`<div class="stats">${stat('Project costs',inr(sum(ex,'Amount')),'',ex.length+' entries')}${stat('Team payments',inr(sum(tp,'Amount')),'',tp.length+' payments')}${stat('Company running expenses',inr(sum(cx,'Amount')),'','deducted from profit')}${stat('Company assets',inr(sum(ax,'Amount')),'','not deducted from profit')}</div>
  <div class="grid2"><section class="panel"><h2>Project costs by type</h2>${hbarsH(grpSum(ex,'Category','Amount'))}</section><section class="panel"><h2>Costs by project</h2>${hbarsH(byP.slice(0,12))}</section></div>
  <div class="grid2 mt"><section class="panel"><h2>Company expenses</h2>${hbarsH(grpSum(cx,'Reason','Amount').slice(0,12))}</section><section class="panel"><h2>Ads</h2><div class="stats" style="margin:0">${stat('Ad spend incl. GST',inr(sum(ads,'Total')))}${stat('Wallet recharged',inr(sum(rc,'Amount')))}</div></section></div>
  <section class="panel mt"><h2>Company running expenses</h2>${table(cx.sort((a,b)=>String(b.Date).localeCompare(a.Date)),[['Reason','Reason','text',{sub:'PaidFor'}],['Date','Date','date'],['PaidTo','Paid to'],['Amount','Amount','money']],{total:['Amount'],empty:'No company expenses in this period.'})}</section>
  ${ax.length?`<section class="panel"><h2>Company assets</h2>${table(ax,[['Reason','Asset','text',{sub:'PaidFor'}],['Date','Date','date'],['FundedBy','Settled by'],['Amount','Amount','money']],{total:['Amount']})}</section>`:''}`;
}
function repInvestors(){
  const P=calc().filter(inFY),e1=sum(P,'Inv1'),e2=sum(P,'Inv2'),p1=sum(P,'Paid1'),p2=sum(P,'Paid2'),d1=e1-p1,d2=e2-p2;
  let s='Project profit shares are fully settled.';
  if(Math.abs(d1)>1||Math.abs(d2)>1){s=`Investor 1 ${d1>=0?'is still due '+inr(d1):'has received '+inr(-d1)+' extra'}. Investor 2 ${d2>=0?'is still due '+inr(d2):'has received '+inr(-d2)+' extra'}.`;
    if(d1>0&&d2<0)s+=` To settle, Investor 2 pays Investor 1 ${inr(Math.min(d1,-d2))}.`;else if(d2>0&&d1<0)s+=` To settle, Investor 1 pays Investor 2 ${inr(Math.min(d2,-d1))}.`}
  $('rep').innerHTML=investorView(FY,{readonly:!adm()})+`<h2 style="margin:22px 0 12px">Project profit shares</h2>
  <div class="stats">${stat('Investor 1 share',inr(e1),'',`received ${inr(p1)}`)}${stat('Investor 1 balance',inr(d1),d1>0?'due':'')}${stat('Investor 2 share',inr(e2),'',`received ${inr(p2)}`)}${stat('Investor 2 balance',inr(d2),d2>0?'due':'')}</div>
  <section class="panel"><p style="margin:0">${s}</p></section>
  <section class="panel"><h2>By project</h2>${table(P.filter(p=>p.Inv1||p.Inv2||p.Paid1||p.Paid2),[['Project','Project','text',{sub:r=>[r.Client,r.Investor1&&'Inv 1: '+r.Investor1,r.Investor2&&'Inv 2: '+r.Investor2].filter(Boolean).join(' · ')}],['Profit','Profit','money'],['Inv1Pct','Inv 1 %','pct'],['Inv1','Inv 1 share','money'],['Paid1','Inv 1 paid','money',{plain:1}],['Inv2','Inv 2 share','money'],['Paid2','Inv 2 paid','money',{plain:1}],['HandsOnMoney','Hands-on','money']],{total:['Profit','Inv1','Paid1','Inv2','Paid2','HandsOnMoney']})}</section>`;
}
function repHealth(){
  const P=calc(),names=new Set(P.map(p=>p.Project)),I=[],add=(hi,t)=>I.push([hi,t]);
  P.filter(p=>p.Balance>0&&p.Age>30).forEach(p=>add(p.Age>90,`<b>${esc(p.Project)}</b>: ${inr(p.Balance)} outstanding for ${p.Age} days.`));
  P.filter(p=>p.Status==='Completed'&&p.Balance>0).forEach(p=>add(1,`<b>${esc(p.Project)}</b> is marked Completed but ${inr(p.Balance)} is still unpaid.`));
  P.filter(p=>p.Profit<0).forEach(p=>add(1,`<b>${esc(p.Project)}</b> is at a loss of ${inr(-p.Profit)} (spent ${inr(p.Spent)}, received ${inr(p.Received)}).`));
  P.filter(p=>p.Balance<0).forEach(p=>add(1,`<b>${esc(p.Project)}</b>: received ${inr(-p.Balance)} more than the project value.`));
  P.map(p=>p.Project).filter((n,i,a)=>a.indexOf(n)!==i).forEach(n=>add(1,`Two projects share the name <b>${esc(n)}</b>.`));
  const cIds=new Set(D.Content.map(c=>String(c.ID)));
  D.TeamPay.filter(p=>tids(p).some(i=>!cIds.has(i))).forEach(p=>add(0,`A ${esc(p.PayType.toLowerCase())} payment to <b>${esc(p.Member)}</b> on ${fmtD(p.Date)} points to a task that was deleted from the work tracker.`));
  D.TeamPay.filter(p=>p.PayType==='Weekly'&&!p.FromDate).forEach(p=>add(0,`Weekly payment to <b>${esc(p.Member)}</b> on ${fmtD(p.Date)} has no week set.`));
  D.Content.filter(c=>D.TeamPay.filter(p=>paidTP(p)&&tids(p).includes(String(c.ID))).length>1).forEach(c=>add(1,`"${esc(c.Content)}" by ${esc(c.DesignedBy)} is linked to more than one paid team payment – check it is not paid twice.`));
  ['Payments','Expenses','Ads','Recharges','Content','Payouts','TeamPay'].forEach(s=>{const bad=D[s].filter(r=>r.Project&&!names.has(r.Project));if(bad.length)add(1,`${bad.length} ${s} record(s) point to a project that doesn't exist: ${[...new Set(bad.map(b=>esc(b.Project)))].join(', ')}`)});
  const invNos=new Set(docs('Invoice').map(d=>d.No));D.Payments.filter(p=>p.InvoiceNo&&!invNos.has(p.InvoiceNo)).forEach(p=>add(1,`A payment of ${inr(p.Amount)} on ${fmtD(p.Date)} points to invoice ${esc(p.InvoiceNo)}, which doesn't exist.`));
  docs('Invoice').map(invCalc).filter(d=>d.Balance<0).forEach(d=>add(1,`Invoice <b>${esc(d.No)}</b> has received ${inr(-d.Balance)} more than its total.`));
  clientNames().filter(n=>!D.Clients.some(c=>c.Name===n)).forEach(n=>add(0,`Client <b>${esc(n)}</b> has no billing details yet.`));
  P.filter(p=>p.AdTracked&&Math.abs(p.AdBooked-p.AdTracked)>100).forEach(p=>add(0,`<b>${esc(p.Project)}</b>: ads logged ${inr(p.AdTracked)}, ad costs booked ${inr(p.AdBooked)}.`));
  const w=wallet();if(w<0)add(1,`The ad wallet is negative (${inr(w)}); a recharge may be missing.`);
  D.Content.filter(c=>c.PaymentDate&&c.Date&&c.PaymentDate<c.Date).forEach(c=>add(0,`"${esc(c.Content)}" by ${esc(c.DesignedBy)} has a payment date before its design date.`));
  I.sort((a,b)=>b[0]-a[0]);
  $('rep').innerHTML=`<section class="panel"><div class="panel-head"><h2>${I.length?I.length+' things to check':'Everything looks good'}</h2></div>${I.map(([h,t])=>`<div class="issue"><span class="attn"><span class="dot ${h?'bad':''}" style="display:inline-block;margin-top:7px"></span></span><div>${t}</div></div>`).join('')}</section>`;
}
function repActivity(){
  $('rep').innerHTML=`<section class="panel"><h2>Recent activity</h2>${table(D.Log||[],[['Action','Action','text',{sub:r=>[r.Sheet,r.Details].filter(Boolean).join(' · ').slice(0,90)}],['Time','When'],['User','User']],{empty:'No activity yet.'})}</section>`;
}

/* ---------- Settings ---------- */
function settings(){
  const s=ST();
  main(`<section class="panel"><h2>Users and passwords</h2><p class="muted" style="margin-top:-6px">Admins can add and change everything. Viewers can see everything but can't change anything. Team members see only the projects they hold a share in (add the person under Team first).</p><div id="users" class="loading">Loading…</div></section>
  <section class="panel"><h2>Install the app</h2><p class="muted" style="margin-top:-6px">Use the portal as an app on your phone (Android / iPhone) and computer (Windows / Mac) – it opens in its own window with the NanoFly icon. Everything stays in sync because it is the same portal.</p>
  <div class="row">${installBtn('btn primary')}<span class="muted" id="instnote">${installNote()}</span></div></section>
  <section class="panel"><h2>Restructure old records</h2><p class="muted" style="margin-top:-6px">Brings your earlier entries into the new format: invoices, quotations and receipts are renumbered by date as <b>${esc(ST().InvPrefix)}-YEAR-NN</b>, <b>${esc(ST().QuoPrefix)}-YEAR-NN</b> and <b>${esc(ST().RecPrefix)}-YEAR-NN</b> (counting restarts every January), payments follow their invoice's new number, ad platforms become Google / Meta, and blank types/statuses are filled. The old number is kept in the sheet (OldNo column), and a backup copy of every sheet is made first. Safe to run again.</p>
  <div class="row"><button class="btn primary" onclick="restructureNow()">Restructure old records</button></div><div id="rsres"></div></section>
  <section class="panel"><h2>Company and documents</h2><p class="muted" style="margin-top:-6px">These details print on every invoice, quotation, receipt and statement.</p>
  <div class="form" id="setf" style="padding:0">
  ${SET_FIELDS.map(([h,ks])=>`<h3>${h}</h3>`+ks.map(k=>`<label>${SLABEL[k]||lbl(k)}<input name="${k}" value="${esc(s[k])}"></label>`).join('')).join('')}
  <h3>Signature</h3><label class="full">Upload a signature (PNG with a transparent background works best)<input type="file" accept="image/*" onchange="sigUp(this)"></label>
  <div class="full row"><img id="sigp" class="sigprev" alt="Signature" src="${esc(s.Signature||SIGN)}"><button class="btn sm" onclick="$('sigp').src=SIGN;$('sigp').dataset.v=''">Use default</button></div>
  </div><div class="row" style="justify-content:flex-end;margin-top:16px"><button class="btn primary" onclick="saveSet()">Save settings</button></div></section>`);
  $('sigp').dataset.v=D.Settings.Signature||'';
  usersCard();
}
function sigUp(inp){const f=inp.files[0];if(!f)return;const img=new Image();img.onload=()=>{const w=Math.min(400,img.width),h=Math.round(img.height*w/img.width),c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);const u=c.toDataURL('image/png');$('sigp').src=u;$('sigp').dataset.v=u};img.src=URL.createObjectURL(f)}
async function saveSet(){const o={};$('setf').querySelectorAll('input[name]').forEach(e=>o[e.name]=e.value.trim());o.Signature=$('sigp').dataset.v||'';
  try{await api('saveSettings',TOKEN,o);toast('Settings saved');await load()}catch(e){alert(e.message||e)}}
async function restructureNow(){
  if(!confirm('Renumber all invoices, quotations and receipts into the new format and tidy old records?\n\nA backup copy of each sheet is made first. Documents you already sent keep their old number only on paper – the sheet keeps it in the OldNo column.'))return;
  try{const r=await api('restructure',TOKEN);await load();go('settings');
    setTimeout(()=>{const b=$('rsres');if(b)b.innerHTML=`<div class="notice ok" style="margin:14px 0 0">Done. Renumbered ${r.invoices} invoice(s), ${r.quotations} quotation(s), ${r.receipts} receipt(s); ${r.paymentsRelinked} payment(s) moved to the new invoice number; ${r.platforms} ad platform(s) set to Google/Meta; ${r.filled} blank field(s) filled. Backup sheets: “${esc(r.backup)} – …” (hidden in your Google Sheet).</div>`},60)}
  catch(e){alert((e.message||e)+(/Unknown action/.test(e.message||e)?'\n\nPaste the new apps-script/Code.gs and deploy a new version first.':''))}}
async function usersCard(){
  const box=$('users');if(!box)return;
  try{const U=await api('listUsers',TOKEN);USERS=U;box.classList.remove('loading');
    box.innerHTML=`<div class="toolbar"><span class="spacer"></span><button class="btn primary" onclick="editUser()">${ico('plus')}Add user</button></div>`+
      table(U.map(u=>({...u,Access:u.role==='admin'?'Admin':u.role==='team'?'Team · '+u.member:'Viewer',State:u.mustChange?'Temporary password':'Active'})),[['username','Username','text',{sub:'name'}],['Access','Access'],['State','Password','pill']],
      {act:(r,i)=>`<button class="btn sm" onclick="editUser(${i})">Edit</button>`+(r.username!==ME.user?more([['Remove user',`delUser(${i})`]]):'')});
  }catch(e){box.innerHTML='<p class="err">'+esc(e.message||e)+'</p>'}
}
function editUser(i,preset){
  const u=i==null?{role:'viewer',...(preset||{})}:USERS[i],isNew=i==null;
  openSheet(isNew?'Add user':'Edit '+u.username,`<label>Username<input name="username" value="${esc(u.username||'')}" autocomplete="off" autocapitalize="none"></label>
  <label>Name<input name="name" value="${esc(u.name||'')}"></label>
  <label>Access<select name="role"><option value="admin" ${u.role==='admin'?'selected':''}>Admin – can change everything</option><option value="viewer" ${u.role==='viewer'?'selected':''}>Viewer – read only</option>${TEAM_OK?`<option value="team" ${u.role==='team'?'selected':''}>Team member – sees only their own projects</option>`:''}</select></label>
  <label id="memlab" style="${u.role==='team'?'':'display:none'}">Team member<select name="member"><option value="">Choose…</option>${D.Team.map(t=>`<option ${t.Name===u.member?'selected':''}>${esc(t.Name)}</option>`).join('')}</select></label>
  <label>${isNew?'Password (6+ characters)':'New password (leave blank to keep)'}<input type="text" name="password" autocomplete="new-password"></label>
  <p class="hint">${isNew?'Give this password to the person. They will be asked to choose their own when they first log in.':'If you set a new password for someone else, they will be asked to change it at their next login.'}</p>`,
  async o=>{o.original=isNew?'':u.username;if(o.role==='team'&&!o.member)throw new Error('Choose which team member this login is for.');await api('saveUser',TOKEN,o);toast('User saved');
    if(!isNew&&u.username===ME.user&&o.username.toLowerCase()!==u.username){endSession('Username changed. Log in as '+o.username.toLowerCase()+'.');return}usersCard()});
  const rs=$('mb').querySelector('[name=role]');rs.onchange=()=>{$('memlab').style.display=rs.value==='team'?'':'none'};
  if(preset&&preset.member){const n=$('mb').querySelector('[name=name]');if(n&&!n.value)n.value=preset.member}
}
async function delUser(i){const u=USERS[i];if(!confirm(`Remove ${u.username}? They will be logged out.`))return;try{await api('deleteUser',TOKEN,u.username);toast('User removed');usersCard()}catch(e){alert(e.message||e)}}
function changePw(first){
  openSheet(first?'Choose your own password':'Change password',`${first?'<p class="hint">You are using a temporary password. Choose a new one to keep your accounts safe.</p>':''}
  <label class="full">Current password<input type="password" name="old" autocomplete="current-password"></label>
  <label>New password (6+ characters)<input type="password" name="n1" autocomplete="new-password"></label>
  <label>Repeat new password<input type="password" name="n2" autocomplete="new-password"></label>`,
  async o=>{if(o.n1.length<6)throw new Error('The new password needs at least 6 characters.');if(o.n1!==o.n2)throw new Error("The new passwords don't match.");
    await api('changePassword',TOKEN,o.old,o.n1);ME.mustChange=false;toast('Password changed')},'Change password');
}

/* ---------- Dialog ---------- */
function openSheet(title,html,onSave,saveLabel='Save',wide=false){
  $('modal').classList.toggle('wide',wide);$('mt').textContent=title;$('mb').innerHTML=html;
  $('msave').hidden=!onSave;$('msave').textContent=saveLabel;$('msave').previousElementSibling.textContent=onSave?'Cancel':'Close';
  $('msave').onclick=onSave?async()=>{const o={};$('mb').querySelectorAll('[name]').forEach(e=>o[e.name]=e.value.trim?e.value.trim():e.value);
    $('msave').disabled=true;try{await onSave(o);closeM()}catch(e){alert(e.message||e)}finally{$('msave').disabled=false}}:null;
  $('modal').hidden=false;setTimeout(()=>{const f=$('mb').querySelector('input:not([type=hidden]),select,textarea');f&&innerWidth>720&&f.focus()},30);
}
function closeM(){$('modal').hidden=true}
$('modal')&&$('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeM()});

/* ---------- Record forms ---------- */
const FORM_HIDE=['ID','ReceiptNo','OldNo','OldReceiptNo'];
function edit(name,id,preset={},title){
  if(!adm())return;
  if(name==='Organizations'&&!BACKEND_OK){alert('Update the Apps Script backend first (see the note on the Organization page).');return}
  if(name==='Team'&&!TEAM_OK){alert('Update the Apps Script backend first (see the Team section in the README).');return}
  if(name==='TeamPay')return payTeam(id,preset);
  if(name==='InvestorPlans'&&!PAY_OK){alert('Update the Apps Script backend first (paste the new Code.gs and deploy a new version).');return}
  const rec=id?{...D[name].find(r=>r.ID===id)}:{...preset};
  if(name==='CompanyExp'&&!rec.Kind)rec.Kind='Expense';
  if(!id){if(SCHEMA[name].includes('Date')&&!rec.Date)rec.Date=today();if(name==='Projects'){rec.Inv1Pct??=75;rec.Status??='Active'}if(name==='Team')rec.JoinDate??=today();if(name==='Content')rec.Status??='Pending';if(name==='Ads')rec.Result??='Running';if(name==='CompanyExp')rec.Kind??='Expense';if(name==='Payments')rec.Mode??='UPI';if(name==='Payouts')rec.Status??='Paid';if(name==='InvestorPlans'){rec.Status??='Active';rec.Structure??='Profit share';rec.Frequency??='Monthly';rec.StartDate??=today()}
    if(name==='Payments'&&rec.Project&&rec.Amount==null){const c=calc().find(p=>p.Project===rec.Project);if(c&&c.Balance>0)rec.Amount=c.Balance}}
  const pl=D.Projects.map(p=>p.Project),cl=clientNames();
  const people=[...new Set(D.Content.map(c=>c.DesignedBy).concat(D.Expenses.filter(e=>e.Category==='Team').map(e=>e.PaidTo)).filter(Boolean))];
  const invs=docs('Invoice').map(invCalc).filter(d=>d.State!=='Cancelled'&&(d.Balance>0||d.No===rec.InvoiceNo));
  const names={TeamPay:'team payment',InvestorPlans:'investor payout structure',Team:'team member',Docs:'document',Payments:'payment',Clients:'client',Organizations:'organization',Projects:'project',Expenses:'project cost',CompanyExp:'company expense',Content:'work item',Ads:'ad campaign',Recharges:'wallet recharge',Payouts:'investor payout'};
  const ORDER={Payments:['Date','InvoiceNo','Project','Amount','Mode','Notes'],Payouts:['Member','Plan','Project','FromDate','ToDate','Payable','Amount','Date','Status','Notes'],
    InvestorPlans:['Investor','Investment','InvestDate','Structure','Rate','Frequency','StartDate','EndDate','Status','Notes'],Content:['Date','DesignedBy','Content','Project','Rate','Status','PaymentDate']}[name];
  const hide=FORM_HIDE.concat(name==='Payouts'&&PAY_OK?['Investor']:[]);
  const fields=SCHEMA[name].filter(c=>!hide.includes(c)).sort((a,b)=>ORDER?(ORDER.indexOf(a)+1||99)-(ORDER.indexOf(b)+1||99):0);
  const teamNames=D.Team.map(t=>t.Name);
  const html=fields.map(c=>{
    const v=esc(rec[c]??''),opts=c==='Status'?STATUS[name]:(c==='Investor1'||c==='Investor2'||(c==='Member'&&name==='Payouts')||(c==='Investor'&&name==='InvestorPlans'))?teamNames:c==='FundedBy'?['Project fund','Investors (shared)'].concat(teamNames):OPTS[c];let inp,cls='';
    if(c==='Plan')inp=`<select name="Plan"><option value="">${'None – project profit share'}</option>${D.InvestorPlans.map(x=>`<option value="${esc(x.ID)}" data-m="${esc(x.Investor)}" ${String(x.ID)===String(rec.Plan)?'selected':''}>${esc(x.Investor)} · ${esc(planText(x))}</option>`).join('')}</select>`;
    else if(c==='InvoiceNo')inp=`<select name="InvoiceNo"><option value="">Not linked</option>${invs.map(d=>`<option value="${esc(d.No)}" data-p="${esc(d.Project)}" data-b="${d.Balance}" ${d.No===rec.InvoiceNo?'selected':''}>${esc(d.No)} – ${esc(d.Client)} (due ${inr(d.Balance)})</option>`).join('')}</select>`;
    else if(opts)inp=`<select name="${c}"><option value=""></option>${opts.concat(rec[c]&&!opts.includes(rec[c])?[rec[c]]:[]).map(o=>`<option ${o==rec[c]?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
    else if(/Date$/.test(c))inp=`<input type="date" name="${c}" value="${v}">`;
    else if(NUMK.includes(c))inp=`<input type="number" inputmode="decimal" step="any" name="${c}" value="${v}">`;
    else if(c==='Notes'||c==='Address'||c==='BillingName'){inp=`<textarea name="${c}">${v}</textarea>`;cls='full'}
    else{const dl={Project:name==='Projects'?null:pl,Client:cl,Organization:orgNames(),DesignedBy:people,PaidTo:people}[c];
      inp=`<input name="${c}" value="${v}" ${dl?`list="dl_${c}"`:''} ${c==='Phone'?'inputmode="tel"':''} ${c==='Email'?'type="email"':''}>${dl?`<datalist id="dl_${c}">${dl.map(o=>`<option value="${esc(o)}">`).join('')}</datalist>`:''}`}
    return `<label class="${cls}">${(name==='Organizations'&&{Name:'Organization name',Client:'Client (owner)',Contact:'Contact person',BillingName:'Billing name on documents (Enter = new line)'}[c])||(FLABEL[name]||{})[c]||lbl(c)}${inp}</label>`;
  }).join('');
  openSheet(title||(id?'Edit ':'Add ')+(names[name]||name),html,async o=>{
    o={...rec,...o,ID:id||''};
    if(name==='Projects'&&!o.Project)throw new Error('Give the project a name.');
    if(name==='Projects'&&o.Investor1&&o.Investor1===o.Investor2)throw new Error('Investor 1 and Investor 2 cannot be the same person.');
    if((name==='Clients'||name==='Organizations'||name==='Team')&&!o.Name)throw new Error('Give the '+names[name]+' a name.');
    if(name==='CompanyExp'){if(o.Kind!=='Asset')o.FundedBy='';else if(!o.FundedBy)throw new Error('Choose who settles this asset (investors or project fund).')}
    if(name==='InvestorPlans'){if(!o.Investor)throw new Error('Choose the investor (add them under Team first).');if(!o.Structure)throw new Error('Choose the payout structure.');
      if(/^Fixed/.test(o.Structure)&&!(+o.Rate>0))throw new Error(o.Structure==='Fixed return %'?'Enter the return % per payout period.':'Enter the fixed amount per payout period.');
      if(o.Structure==='Fixed return %'&&!(+o.Investment>0))throw new Error('Enter the investment amount.')}
    if(name==='Payouts'){
      if(!o.Member&&o.Plan){const pl=D.InvestorPlans.find(x=>String(x.ID)===o.Plan);if(pl)o.Member=pl.Investor}
      const pr=o.Project&&D.Projects.find(x=>x.Project===o.Project);
      if(pr&&o.Member)o.Investor=pr.Investor1===o.Member?'Investor 1':pr.Investor2===o.Member?'Investor 2':o.Investor||'';
      if(pr&&!o.Member&&o.Investor)o.Member=o.Investor==='Investor 1'?pr.Investor1:pr.Investor2;
      if(!o.Member&&!o.Investor)throw new Error('Choose the investor.');
      if(pr&&o.Member&&!slotsOf(pr,o.Member).length&&!confirm(`${o.Member} is not Investor 1 or 2 on "${o.Project}". Save anyway?`))throw new Error('Not saved.');
      if(!(+o.Amount>0)&&!(+o.Payable>0))throw new Error('Enter the amount paid (or the amount payable for a pending payout).');
      if(o.Status==='Pending')o.Amount=o.Amount||0;
    }
    if(name!=='Projects'&&o.Project&&!pl.includes(o.Project)&&!confirm(`There is no project called "${o.Project}". Save anyway?`))throw new Error('Not saved.');
    await api('saveRow',TOKEN,name,o);toast('Saved');await load();
  });
  const q=n=>$('mb').querySelector(`[name=${n}]`);
  if(name==='Ads')q('Amount').oninput=()=>{const n=+q('Amount').value||0;q('GST').value=(n*.18).toFixed(2);q('Total').value=Math.round(n*1.18)};
  if(name==='CompanyExp'&&q('Kind')&&q('FundedBy')){const fl=q('FundedBy').closest('label'),sync=()=>{fl.style.display=q('Kind').value==='Asset'?'':'none'};q('Kind').onchange=()=>{if(q('Kind').value==='Asset'&&!q('FundedBy').value)q('FundedBy').value='Project fund';sync()};sync()}
  if(name==='Payouts'&&q('Plan')&&q('Member')){const syncP=()=>{const m=q('Member').value;[...q('Plan').options].forEach(o=>{if(o.value)o.hidden=!!m&&o.dataset.m!==m})};q('Member').onchange=()=>{const o=q('Plan').selectedOptions[0];if(o&&o.value&&o.dataset.m!==q('Member').value)q('Plan').value='';syncP()};
    q('Plan').onchange=()=>{const o=q('Plan').selectedOptions[0];if(o&&o.dataset.m&&!q('Member').value){q('Member').value=o.dataset.m;syncP()}};syncP()}
  if(name==='InvestorPlans'){const syncS=()=>{const st=q('Structure').value,show=(n,v)=>{const l=q(n)&&q(n).closest('label');if(l)l.style.display=v?'':'none'};show('Rate',/^Fixed/.test(st));
      const r=q('Rate').closest('label');if(r)r.firstChild.textContent=st==='Fixed return %'?'Return % per payout period':'Fixed amount per payout period (₹)';};q('Structure').onchange=syncS;syncS()}
  if(name==='Payments')q('InvoiceNo').onchange=()=>{const o=q('InvoiceNo').selectedOptions[0];if(o&&o.dataset.p&&!q('Project').value)q('Project').value=o.dataset.p;if(o&&o.dataset.b&&!q('Amount').value)q('Amount').value=o.dataset.b};
}
async function del(name,id){
  let msg='Delete this record? This cannot be undone.';
  if(name==='Docs'){const d=D.Docs.find(x=>x.ID===id);const n=D.Payments.filter(p=>p.InvoiceNo&&p.InvoiceNo===d.No).length;msg=`Delete ${d.Type.toLowerCase()} ${d.No}?`+(n?`\n\n${n} payment(s) are linked to it. They stay recorded but will no longer be linked. You could set the invoice to Cancelled instead.`:'')}
  if(!confirm(msg))return;try{await api('deleteRow',TOKEN,name,id);toast('Deleted');if(name==='Clients')location.hash='clients';if(name==='Organizations')location.hash='organizations';await load()}catch(e){alert(e.message||e)}}
function payFor(id){const c=calc().find(x=>x.ID===id);edit('Payments',null,{Project:c.Project,Amount:c.Balance>0?c.Balance:''})}
function payInvoice(id){const d=invCalc(D.Docs.find(x=>x.ID===id));edit('Payments',null,{Project:d.Project,InvoiceNo:d.No,Amount:d.Balance>0?d.Balance:''})}
async function payDesigner(i){
  const d=window._DS[i],ids=D.Content.filter(c=>(c.DesignedBy||'Unassigned')===d.DesignedBy&&c.Status!=='Paid').map(c=>c.ID);
  if(!ids.length||!confirm(`Mark ${ids.length} design(s) by ${d.DesignedBy} as paid today?`))return;
  try{const n=await api('markPaid',TOKEN,ids,today());toast(n+' marked paid');await load()}catch(e){alert(e.message||e)}
}

/* ---------- Invoice / quotation editor ---------- */
function newDoc(type,preset={}){if(!adm())return;editDoc(null,{Type:type,Date:today(),Status:type==='Invoice'?'Issued':'Draft',Plan:type==='Quotation'?'Monthly':'',ValidDate:'',Items:JSON.stringify([{title:'',points:[],amount:''}]),...preset})}
function invFromProject(id){const p=D.Projects.find(x=>x.ID===id);newDoc('Invoice',{Client:p.Client,Organization:p.Organization||'',Project:p.Project,Items:JSON.stringify([{title:p.Project,points:[],amount:p.Budget}])})}
function quoteToInvoice(id){const q=D.Docs.find(x=>x.ID===id);newDoc('Invoice',{Client:q.Client,Organization:q.Organization||'',Project:q.Project,Items:q.Items,Notes:'From quotation '+q.No,_fromQuote:id})}
function dupDoc(id){const d=D.Docs.find(x=>x.ID===id);editDoc(null,{...d,ID:'',No:'',Date:today(),ValidDate:'',Status:d.Type==='Invoice'?'Issued':'Draft',Notes:'Copy of '+d.No})}
function editDoc(id,preset){
  const d=id?{...D.Docs.find(x=>x.ID===id)}:{...preset},T=d.Type,isQ=T==='Quotation';
  const cl=clientNames(),pl=D.Projects.filter(p=>!d.Client||p.Client===d.Client).map(p=>p.Project);
  openSheet((id?'Edit ':'New ')+T.toLowerCase()+(id?' '+d.No:''),`
  <label>Client<select name="Client"><option value="">Choose a client</option>${cl.map(c=>`<option ${c===d.Client?'selected':''}>${esc(c)}</option>`).join('')}</select></label>
  <label>Organization (optional)<input name="Organization" list="dl_og" value="${esc(d.Organization||docOrg(d))}" placeholder="Bill a specific organization"><datalist id="dl_og">${orgsFor(d.Client).map(x=>`<option value="${esc(x)}">`).join('')}</datalist></label>
  <label>Project (optional)<input name="Project" list="dl_dp" value="${esc(d.Project)}"><datalist id="dl_dp">${pl.map(p=>`<option value="${esc(p)}">`).join('')}</datalist></label>
  <label>Date<input type="date" name="Date" value="${esc(d.Date)}"></label>
  <label>${isQ?'Valid till (optional)':'Due date (optional)'}<input type="date" name="ValidDate" value="${esc(d.ValidDate)}"></label>
  <label>${T} number<input name="No" value="${esc(d.No)}" placeholder="Next number: ${esc(ST()[isQ?'QuoPrefix':'InvPrefix'])}-${new Date().getFullYear()}-NN"></label>
  ${isQ?`<label>Plan tag<select name="Plan">${['','Monthly','Yearly'].map(o=>`<option value="${o}" ${o===d.Plan?'selected':''}>${o||'None'}</option>`).join('')}</select></label>`:''}
  <label>Status<select name="Status">${DOCSTATUS[T].map(o=>`<option ${o===d.Status?'selected':''}>${o}</option>`).join('')}</select></label>
  <label class="${isQ?'full':''}">Private note (not printed)<input name="Notes" value="${esc(d.Notes)}"></label>
  <h3>${isQ?'Packages':'Services'}</h3><div id="its" style="display:contents"></div>
  <div class="full"><button class="btn sm" type="button" onclick="addIt()">${ico('plus')}Add ${isQ?'package':'service'}</button></div>
  <div class="total-line" id="dtot"></div>
  ${!isQ&&id?`<p class="hint">Payments for this invoice are recorded in Payments; they print on the invoice automatically.</p>`:''}`,
  async o=>{
    const its=[...$('its').querySelectorAll('.item')].map(b=>({title:b.querySelector('.it').value.trim(),amount:b.querySelector('.ia').value===''?'':+b.querySelector('.ia').value,points:b.querySelector('.ip').value.split('\n').map(s=>s.replace(/^\s*[•\-*]\s*/,'').trim()).filter(Boolean)})).filter(x=>x.title||x.points.length||x.amount!=='');
    ['it','ia','ip'].forEach(k=>delete o[k]);
    const rec={...d,...o,ID:id||''};delete rec._fromQuote;
    if(!rec.Client)throw new Error('Choose a client.');
    if(!its.length)throw new Error('Add at least one '+(isQ?'package':'service')+'.');
    rec.Items=JSON.stringify(its);rec.Total=its.reduce((s,x)=>s+(+x.amount||0),0);
    const newId=await api('saveRow',TOKEN,'Docs',rec);
    if(d._fromQuote){const q=D.Docs.find(x=>x.ID===d._fromQuote);if(q&&q.Status!=='Accepted')await api('saveRow',TOKEN,'Docs',{...q,Status:'Accepted'})}
    toast(T+' saved');await load();printDoc(newId);
  },'Save '+T.toLowerCase(),true);
  items(d).forEach(addIt);if(!items(d).length)addIt();
  $('mb').querySelector('[name=Client]').onchange=e=>{$('dl_dp').innerHTML=D.Projects.filter(p=>p.Client===e.target.value).map(p=>`<option value="${esc(p.Project)}">`).join('');$('dl_og').innerHTML=orgsFor(e.target.value).map(x=>`<option value="${esc(x)}">`).join('')};
  $('mb').querySelector('[name=Project]').onchange=e=>{const pr=D.Projects.find(x=>x.Project===e.target.value),og=$('mb').querySelector('[name=Organization]');if(pr&&pr.Organization&&og&&!og.value)og.value=pr.Organization};
  docTot();
}
function addIt(x={}){
  const isQ=/quotation/.test($('mt').textContent),div=document.createElement('div');div.className='item';
  div.innerHTML=`<input class="it" aria-label="Title" placeholder="${isQ?'Package, e.g. Professional portal for college':'Service, e.g. Website creation & maintenance'}" value="${esc(x.title||'')}">
  <input class="ia" aria-label="Amount" type="number" inputmode="decimal" step="any" placeholder="Amount ₹" value="${esc(x.amount??'')}" oninput="docTot()">
  <button class="btn sm danger" type="button" aria-label="Remove" onclick="this.parentNode.remove();docTot()">×</button>
  <textarea class="ip" aria-label="Points" placeholder="One point per line, e.g.&#10;Website creation&#10;1 year domain&#10;SEO optimisation">${esc((x.points||[]).join('\n'))}</textarea>`;
  $('its').appendChild(div);
}
function docTot(){const t=[...$('its').querySelectorAll('.ia')].reduce((s,e)=>s+(+e.value||0),0);$('dtot').textContent='Total '+inr(t)}

/* ---------- WhatsApp & export ---------- */
const waPhone=(...a)=>{let ph=String(a.find(Boolean)||'').replace(/\D/g,'');if(ph.length===10)ph='91'+ph;return ph};
const wa=(ph,msg)=>window.open(`https://wa.me/${waPhone(ph)}?text=${encodeURIComponent(msg)}`,'_blank');
const payLine=s=>`You can pay to ${s.AccName}, ${s.BankName}, A/c ${s.AccNo}, IFSC ${s.IFSC}, or GPay ${s.GPay}.`;
function remind(id){const p=calc().find(x=>x.ID===id),s=ST();wa(p.Phone||clientOf(p.Client).Phone,`Hello ${p.Client}, a gentle reminder from ${s.CompanyName} about "${p.Project}". We have received ${inr(p.Received)} of ${inr(p.Budget)}, so ${inr(p.Balance)} is pending. ${payLine(s)} Thank you!`)}
function remindInv(id){const d=invCalc(D.Docs.find(x=>x.ID===id)),c=clientOf(d.Client),s=ST();
  wa(c.Phone,`Hello ${String(c.BillingName||c.Name).replace(/\s+/g,' ')}, a gentle reminder from ${s.CompanyName} for invoice ${d.No} dated ${dmy(d.Date)}${d.ValidDate?` (due ${dmy(d.ValidDate)})`:''}. Total ${inr(d.Total)}, received ${inr(d.Paid)}, balance ${inr(d.Balance)}. ${payLine(s)} Thank you!`)}
function remindClient(n){const P=calc().filter(p=>p.Client===n&&p.Balance>0),s=ST(),c=clientOf(n);
  wa(c.Phone||(P.find(p=>p.Phone)||{}).Phone,`Hello ${n}, a gentle reminder from ${s.CompanyName}. Pending amounts: ${P.map(p=>`${p.Project} ${inr(p.Balance)}`).join('; ')}. Total ${inr(sum(P,'Balance'))}. ${payLine(s)} Thank you!`)}
function shareQuote(id){const q=D.Docs.find(x=>x.ID===id),c=clientOf(q.Client),s=ST();
  wa(c.Phone,`Hello ${String(c.BillingName||c.Name).replace(/\s+/g,' ')}, here is our quotation ${q.No} from ${s.CompanyName}: ${items(q).map(i=>`${i.title}${i.amount!==''?' – '+inr(i.amount):''}`).join('; ')}${q.Plan?' ('+q.Plan.toLowerCase()+')':''}. We'd be glad to get started. Thank you!`)}
function csv(name){
  const rows=name==='Projects'?calc().filter(inFY):(name==='Clients'||name==='Organizations')?D[name]:D[name].filter(inFY);
  const cols=name==='Projects'?['Date','Client','Project','Status','Budget','Received','Balance','Spent','HandsOn','Profit','HandsOnMoney','Phone','Notes']:SCHEMA[name];
  const lines=[cols.join(',')].concat(rows.map(r=>cols.map(c=>`"${String(r[c]??'').replace(/"/g,'""')}"`).join(',')));
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['﻿'+lines.join('\n')],{type:'text/csv'}));a.download=`NanoFly_${name}_${today()}.csv`;a.click();
}

/* ---------- Installable app (PWA): phone + desktop ---------- */
let INSTALL=null;
const standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
addEventListener('beforeinstallprompt',e=>{e.preventDefault();INSTALL=e;document.querySelectorAll('.inst').forEach(b=>b.hidden=false)});
addEventListener('appinstalled',()=>{INSTALL=null;document.querySelectorAll('.inst').forEach(b=>b.hidden=true);toast('NanoFly Accounts installed')});
function installBtn(cls,menu){if(standalone())return '';return `<button class="inst ${cls}" ${INSTALL||isIOS()?'':'hidden'} onclick="${menu?'closeM();':''}installApp()">${ico('out')}Install app</button>`}
function installNote(){if(standalone())return 'You are using the installed app.';if(location.protocol==='file:')return 'Upload the portal folder to your website (https) to install it – it cannot be installed from a file on your computer.';
  if(isIOS())return 'iPhone / iPad: open in Safari → Share → Add to Home Screen.';return INSTALL?'':'Chrome / Edge: use the install icon in the address bar, or menu → Install NanoFly Accounts. On Android: menu → Add to Home screen / Install app.'}
async function installApp(){
  if(INSTALL){INSTALL.prompt();const r=await INSTALL.userChoice;if(r.outcome==='accepted')INSTALL=null;return}
  if(isIOS()){openSheet('Install on iPhone / iPad','<ol class="full steps"><li>Open this portal in <b>Safari</b>.</li><li>Tap the <b>Share</b> button (square with an arrow).</li><li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li></ol><p class="hint">NanoFly Accounts then opens full-screen from its own icon.</p>',null);return}
  alert(installNote());
}
function initApp(){
  document.querySelectorAll('.brand-logo').forEach(i=>i.src=i.hasAttribute('data-on-dark')?LOGO_UI_WHITE:LOGO_UI);
  if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))navigator.serviceWorker.register('sw.js').catch(()=>{});
  if(TOKEN)restore();else{$('login').hidden=false;busy(true);busy(false)}
}
