/* Invoice / Quotation / Receipt templates */
/* Who a document is billed to: the client, or – when an Organization is set – that organization's billing details */
const billTo=d=>{const c=clientOf(d.Client),n=docOrg(d);if(!n)return c;const o=orgOf(n),keep=Object.fromEntries(['City','Address','GSTIN','Phone','Email','Website'].filter(k=>o[k]).map(k=>[k,o[k]]));return {...c,...keep,BillingName:o.BillingName||n}};
/* ---------- Printable documents (Nanofly design) ---------- */
const money=n=>'₹ '+(+n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
const money0=n=>'₹'+(+n||0).toLocaleString('en-IN',{maximumFractionDigits:2});
function words(num){
  num=Math.round(+num||0);if(!num)return'Zero';
  const a=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'],b=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const two=x=>x<20?a[x]:b[Math.floor(x/10)]+(x%10?' '+a[x%10]:'');
  const three=x=>[x>=100?a[Math.floor(x/100)]+' Hundred':'',x%100?two(x%100):''].filter(Boolean).join(' ');
  const cr=Math.floor(num/1e7),l=Math.floor(num%1e7/1e5),t=Math.floor(num%1e5/1e3),h=num%1e3;
  return [cr?(cr>999?words(cr):three(cr))+' Crore':'',l?two(l)+' Lakh':'',t?two(t)+' Thousand':'',h?three(h):''].filter(Boolean).join(' ');
}
const ICON={mail:'<path d="M3 6h18v12H3z M3 6l9 7 9-7" fill="none" stroke="#ED5B2D" stroke-width="2" stroke-linejoin="round"/>',
  phone:'<path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z" fill="#ED5B2D"/>',
  web:'<circle cx="12" cy="12" r="9" fill="none" stroke="#ED5B2D" stroke-width="2"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" fill="none" stroke="#ED5B2D" stroke-width="2"/>'};
const ic=k=>`<span class="ic"><svg viewBox="0 0 24 24" width="17" height="17">${ICON[k]}</svg></span>`;
/* Printed documents use css/documents.css */
const DOC_CSS_URL=()=>new URL('css/documents.css',document.baseURI).href;
function docShell(title,body){
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700;900&family=Jost:wght@400;500;700;900&family=Poppins:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${new URL('css/brand-fonts.css',document.baseURI).href}"><link rel="stylesheet" href="${DOC_CSS_URL()}"></head>
<body><script>function fit(){const p=document.querySelector('.page');if(!p)return;p.style.zoom='';p.style.width='';p.style.minHeight='';p.style.transform='';const h=p.scrollHeight;document.documentElement.classList.toggle('one',h<1123*1.3);if(h>1124&&h<1123*1.3){const z=1116/h;p.style.width=(794/z)+'px';p.style.minHeight=(1121/z)+'px';p.style.zoom=z}scr()}
/* phones: shrink the A4 page to the screen width (printing is unaffected) */
function scr(){const p=document.querySelector('.page'),w=document.querySelector('.pw');if(!p||!w)return;p.style.transform='';w.style.width='';w.style.height='';const z=Math.min(1,(document.documentElement.clientWidth-16)/794);if(z<1){p.style.transform='scale('+z+')';const r=p.getBoundingClientRect();w.style.width=r.width+'px';w.style.height=r.height+'px'}}
addEventListener('load',()=>{fit();document.fonts&&document.fonts.ready.then(fit)});addEventListener('resize',scr);addEventListener('beforeprint',()=>{const p=document.querySelector('.page'),w=document.querySelector('.pw');if(p)p.style.transform='';if(w){w.style.width='';w.style.height=''}});addEventListener('afterprint',scr)<\/script><div class="tb"><b>${esc(title)}</b><button onclick="shareDoc('png',this)" title="Share or save as an image">🖼 Image</button><button onclick="shareDoc('pdf',this)" title="Share or save as a PDF">📄 PDF</button><button class="s" onclick="print()" title="Print">🖨 Print</button><button class="s" onclick="close()">Close</button></div><div id="shmsg" class="shmsg" hidden></div><div class="pw">${body}</div><script src="${new URL('js/share-doc.js',document.baseURI).href}"><\/script></body></html>`;
}
function footer(s){
  return `<div class="foot"><div class="short"></div><div class="tag2">${esc(s.Tagline1)}<br>${esc(s.Tagline2)}</div>
  <div class="fbar"><span>${ic('mail')}${esc(s.Email)}</span><span>${ic('phone')}${esc(s.Phone)}</span><span>${ic('web')}${esc(s.Website)}</span></div></div>`;
}
/* Background artwork taken from your sample formats: full-colour stacked logo as a faint watermark */
const DOC_LOGO=ASSET('doc-logo.png'),DOC_WM=ASSET('doc-watermark.png');
const WM=`<img class="wm" src="${DOC_WM}" alt="">`;
const metaHead=(rows)=>`<div class="hd"><div class="l"><div class="meta">${rows.map(([k,v])=>`<b>${k}</b><span>:</span><span>${esc(v)}</span>`).join('')}</div></div><div class="vr"></div><div class="r"><img class="logo" src="${DOC_LOGO}" alt="NanoFly InfoTech"></div></div>`;
/* "To" details exactly as the samples:  ORGANIZATION NAME, / website, phone number, / city   (the company's own address is never printed) */
function toLines(c){
  const name=String(c.BillingName||c.Name||'').trim(),web=String(c.Website||'').replace(/^https?:\/\//,'').replace(/\/$/,''),mid=[web,c.Phone].filter(Boolean).join(', '),city=String(c.City||'').trim();
  const L=[[name,'nm'],[mid,'ln'],[city,'ln']].filter(x=>x[0]);
  return L.map(([t,k],i)=>`<div class="${k}">${esc(t+(i<L.length-1&&!/,\s*$/.test(t)?',':'')).replace(/\n/g,'<br>')}</div>`).join('');
}
const toBlock=(label,c)=>`<div class="rule"></div><div class="to"><div class="k">${label}</div><div class="v">${toLines(c)}</div></div>`;
const signBlock=(s,title,lines)=>`<div class="thanks"><div class="t"><h3>${esc(title)}</h3>${lines}</div><div class="s"><img src="${s.Signature||SIGN}" alt="">${/^y/i.test(s.ShowMDName)&&s.MDName?`<div class="mdn">${esc(s.MDName)}</div>`:''}<div>${esc(s.SignLabel)}</div></div></div>`;
const svcBlock=its=>{const multi=its.length>1;return its.map(it=>`<h2>${esc(it.title)}</h2>${it.points.length?`<ul>${it.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}${multi&&it.amount!==''?`<div class="amt">${money(it.amount)}</div>`:''}`).join('')};

function invoiceHTML(d){
  const s=ST(),c=billTo(d),x=invCalc(d),its=items(d);
  const pl=x.pays.map((p,i)=>`(${dmy(p.Date)} - ${money0(p.Amount)})${i<x.pays.length-1?',':''}`);
  return docShell(`Invoice ${d.No} – ${c.Name}`,`<div class="page">${WM}
  ${metaHead([['Invoice No.',d.No],['Date',dmy(d.Date)]])}
  ${toBlock('To:',c)}<div class="rule"></div><div class="sh">SERVICES</div><div class="rule"></div>
  <div class="svc">${svcBlock(its)}</div><div class="rule"></div>
  <div class="totals"><div class="dl">${pl.length?`<span>Date:</span><small>${pl.join('<br>')}</small>`:''}</div>
  <div class="kv"><b>Total</b><span>:</span><span>${money(x.Total)}</span><b>Paid</b><span>:</span><span>${money(x.Paid)}</span></div></div>
  <div class="rule"></div><div class="bal"><div class="kv"><b>Balance</b><span>:</span><span>${money(Math.max(0,x.Balance))}</span></div></div><div class="rule"></div>
  ${signBlock(s,s.ThankTitle,`${esc(s.ThankText)}<br><b>${esc(s.CompanyName)}.</b>`)}
  ${footer(s)}</div>`);
}
/* the price circle keeps its size – long amounts step the type down so they stay inside */
const circSize=t=>t.length<=7?'':t.length<=9?'m':t.length<=11?'l':'xl';
function quotationHTML(d){
  const s=ST(),c=billTo(d),its=items(d);
  const head=`<div class="qhd"><div class="qto"><div class="k">To:</div>${toLines(c)}</div>
  <div class="vr"></div><div class="r"><img class="logo" src="${DOC_LOGO}" alt="NanoFly InfoTech"><div class="qno"><b>Quotation No.</b><span>:</span><span>${esc(d.No)}</span></div></div></div>`;
  const pill=d.Plan?`<div class="pill"><div class="${d.Plan==='Monthly'?'on':''}">Monthly</div><div class="${d.Plan==='Yearly'?'on':''}">Yearly</div></div>`:'<div style="height:40px"></div>';
  const btn=s.OrderText?(s.OrderLink?`<a class="order" href="${esc(s.OrderLink)}">${esc(s.OrderText)}</a>`:`<div class="order">${esc(s.OrderText)}</div>`):'';
  const cards=its.map(it=>`<div class="qcard">${WM}${it.amount!==''?`<div class="circ ${circSize(money0(it.amount))}">${money0(it.amount)}</div>`:''}<h2>${esc(it.title)}</h2><div class="ul"></div>
  ${it.points.length?`<ul>${it.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:''}${btn}</div>`).join('');
  const pd=[['Name',s.AccName],['Bank Name',s.BankName],['Account No',s.AccNo],['IFSC Code',s.IFSC],['GPay No.',s.GPay]].filter(r=>r[1]);
  return docShell(`Quotation ${d.No} – ${c.Name}`,`<div class="page q">${head}${pill}${cards}
  ${pd.length?`<div class="pd"><h3>PAYMENT DETAILS</h3><table>${pd.map(([k,v])=>`<tr><td>${k}</td><td>:</td><td>${esc(v)}</td></tr>`).join('')}</table></div>`:''}
  ${s.QuoteNote?`<div class="qnote">${esc(s.QuoteNote)}</div>`:''}
  ${footer(s)}</div>`);
}
function receiptHTML(p){
  const s=ST(),inv=docs('Invoice').find(d=>d.No===p.InvoiceNo),proj=D.Projects.find(x=>x.Project===p.Project);
  const c=inv?billTo(inv):billTo({Client:projClient(p.Project),Project:p.Project,Organization:proj&&proj.Organization||''});
  // what the payment was for: the invoice's services, else the project
  const its=inv&&items(inv).length?items(inv):[{title:p.Project||'Payment',points:[],amount:''}];
  // paid so far (up to and including this payment) against the invoice, or else against the project
  const pool=(inv?D.Payments.filter(q=>q.InvoiceNo===inv.No):D.Payments.filter(q=>q.Project&&q.Project===p.Project))
    .slice().sort((a,b)=>String(a.Date).localeCompare(b.Date)||String(a.ReceiptNo||'~').localeCompare(b.ReceiptNo||'~'));
  const upto=pool.slice(0,pool.findIndex(q=>q.ID===p.ID)+1),paid=upto.length?sum(upto,'Amount'):+p.Amount||0;
  const bill=inv?+inv.Total||0:proj?+proj.Budget||0:+p.Amount||0;
  return docShell(`Receipt ${p.ReceiptNo} – ${c.Name}`,`<div class="page">${WM}
  ${metaHead([['Receipt No.',p.ReceiptNo],['Date',dmy(p.Date)]])}
  ${toBlock('To:',c)}<div class="rule"></div><div class="sh">SERVICES</div><div class="rule"></div>
  <div class="svc rsvc">${svcBlock(its.map(x=>({...x,amount:''})))}</div><div class="rule"></div>
  <div class="paidnow"><div class="kv"><b>Paid Now</b><span>:</span><span>${money(p.Amount)}</span></div></div><div class="rule"></div>
  <div class="rsum"><div class="kv2"><b>For Invoice No.</b><span>:</span><span>${esc(inv?inv.No:'—')}</span><b>Total Bill</b><span>:</span><span>${money(bill)}</span></div><div class="vl"></div>
  <div class="kv2 r"><b>Totally Paid</b><span>:</span><span>${money(paid)}</span><b>Balance</b><span>:</span><span>${money(Math.max(0,bill-paid))}</span></div></div><div class="rule"></div>
  ${signBlock(s,s.ReceiptThank,`${esc(s.ThankText)}<br><b>${esc(s.CompanyName)}.</b>`)}
  ${footer(s)}</div>`);
}
function openDoc(html){const w=window.open('','_blank');if(!w)return alert('Please allow pop-ups for this page to view documents.');w.document.write(html);w.document.close()}
function printDoc(id){const d=D.Docs.find(x=>x.ID===id);if(d)openDoc(d.Type==='Quotation'?quotationHTML(d):invoiceHTML(d))}
async function receipt(id){
  let p=D.Payments.find(x=>x.ID===id);
  if(!p.ReceiptNo){if(ROLE!=='admin')return;const w=window.open('','_blank');if(w)w.document.write('<p style="font-family:sans-serif;padding:20px">Issuing receipt number…</p>');
    try{const no=await api('issueReceipt',TOKEN,id);p={...p,ReceiptNo:no};D.Payments=D.Payments.map(x=>x.ID===id?p:x);render();
      if(w){w.document.open();w.document.write(receiptHTML(p));w.document.close()}else openDoc(receiptHTML(p))}catch(e){if(w)w.close();alert(e)}
    return}
  openDoc(receiptHTML(p));
}

/* ---------- Client account statement ---------- */
function statementHTML(n){
  const s=ST(),c=clientOf(n),P=calc().filter(p=>p.Client===n),pn=new Set(P.map(p=>p.Project));
  const INV=docs('Invoice').filter(d=>d.Client===n&&d.Status!=='Cancelled'),extra=INV.filter(d=>!pn.has(d.Project)),invNos=new Set(INV.map(d=>d.No));
  const rows=[];
  P.forEach(p=>rows.push({d:p.Date,t:p.Project,dr:+p.Budget||0,cr:0}));
  extra.forEach(d=>rows.push({d:d.Date,t:'Invoice '+d.No+(items(d)[0]?' – '+items(d)[0].title:''),dr:+d.Total||0,cr:0}));
  D.Payments.filter(p=>pn.has(p.Project)||invNos.has(p.InvoiceNo)).forEach(p=>rows.push({d:p.Date,t:'Payment received'+(p.Mode?' ('+p.Mode+')':'')+(p.ReceiptNo?' – '+p.ReceiptNo:''),dr:0,cr:+p.Amount||0}));
  rows.sort((a,b)=>String(a.d).localeCompare(b.d)||b.dr-a.dr);
  let bal=0;const tr=rows.map(r=>{bal+=r.dr-r.cr;return `<tr><td>${dmy(r.d)}</td><td>${esc(r.t)}</td><td class="n">${r.dr?money(r.dr):''}</td><td class="n">${r.cr?money(r.cr):''}</td><td class="n">${money(bal)}</td></tr>`}).join('');
  const dr=rows.reduce((a,r)=>a+r.dr,0),cr=rows.reduce((a,r)=>a+r.cr,0);
  return docShell(`Statement – ${n}`,`<div class="page">${WM}
  ${metaHead([['Statement',dmy(today())],['Period',rows.length?dmy(rows[0].d)+' – '+dmy(today()):'—']])}
  ${toBlock('To:',c)}<div class="rule"></div><div class="sh">ACCOUNT STATEMENT</div><div class="rule"></div>
  <div class="stm"><table><thead><tr><th>Date</th><th>Particulars</th><th class="n">Billed</th><th class="n">Received</th><th class="n">Balance</th></tr></thead><tbody>${tr||'<tr><td colspan="5">No entries yet.</td></tr>'}</tbody>
  <tfoot><tr><td></td><td>Total</td><td class="n">${money(dr)}</td><td class="n">${money(cr)}</td><td class="n">${money(dr-cr)}</td></tr></tfoot></table></div>
  <div class="rule"></div><div class="bal"><div class="kv"><b>Balance</b><span>:</span><span>${money(Math.max(0,dr-cr))}</span></div></div><div class="rule"></div>
  ${signBlock(s,dr-cr>0?'Thank you for your business!':s.ThankTitle,dr-cr>0?`Kindly pay the balance to<br>${esc(s.AccName)}, ${esc(s.BankName)}<br>A/c ${esc(s.AccNo)}, IFSC ${esc(s.IFSC)}<br>GPay ${esc(s.GPay)}`:`${esc(s.ThankText)}<br><b>${esc(s.CompanyName)}.</b>`)}
  ${footer(s)}</div>`);
}
function statement(n){openDoc(statementHTML(n))}
