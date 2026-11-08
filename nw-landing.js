(function(){
const NS=window.NS,$=NS.$;
// icon placeholders NS_I_name
document.body.innerHTML=document.body.innerHTML.replace(/NS_I_(\w+)/g,(_,n)=>NS.icon(n));
$('#yr').textContent=new Date().getFullYear();
NS.applyTheme(); $('#themeBtn').onclick=NS.toggleTheme;
// features (from the brand kit "key highlights")
const F=[['invest','Track Investments','Stocks, mutual funds, FDs, gold, crypto — see value, returns and allocation at a glance.'],['expense','Manage Expenses','Log spending in seconds, set category budgets and see exactly where your money goes.'],['loan','Handle Loans','Auto-calculated EMIs, outstanding balance, payoff progress and due-date reminders.'],['debt','Monitor Debts','Credit cards, borrowed and lent money — settle step by step and never miss a due date.'],['calc','Calculate Income','Every income stream in one place, with savings rate and month-by-month comparison.'],['dashboard','Personalized Dashboard','Net worth, cash flow, health score and insights — built from your numbers alone.']];
$('#featGrid').innerHTML=F.map(f=>`<div class="feat reveal"><div class="ic">${NS.icon(f[0])}</div><h3>${f[1]}</h3><p>${f[2]}</p></div>`).join('');
// hero mock
const bars=[[60,40],[72,45],[55,38],[80,48],[66,42],[88,50]]; $('#mbars').innerHTML=bars.map((b,i)=>`<div><i style="height:${b[0]}%;background:var(--good);animation-delay:${i*90}ms"></i><i style="height:${b[1]}%;background:var(--orange);animation-delay:${i*90+40}ms"></i></div>`).join('');
setTimeout(()=>NS.countUp($('#mnw'),1124500,v=>'₹'+Math.round(v).toLocaleString('en-IN'),1600),400);
const mock=$('#mock'),card=$('#mcard');
mock.addEventListener('mousemove',e=>{ const r=mock.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5; card.style.transform=`rotateY(${x*10}deg) rotateX(${-y*10}deg)`; });
mock.addEventListener('mouseleave',()=>card.style.transform='');
// nav shadow
const nav=$('#nav'); const sc=()=>nav.classList.toggle('sc',scrollY>20); addEventListener('scroll',sc,{passive:true}); sc();
// reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }),{threshold:.12});
NS.$$('.reveal').forEach((el,i)=>{ el.style.transitionDelay=(i%3)*80+'ms'; io.observe(el); });
setTimeout(()=>NS.$$('.reveal').forEach(el=>{ const r=el.getBoundingClientRect(); if(r.top<innerHeight) el.classList.add('in'); }),100);
// projector
const sl=(id,l,min,max,step,v)=>`<div class="sl"><div class="top-r"><span>${l}</span><input class="inp" id="n_${id}" type="number" value="${v}" step="${step}"></div><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"></div>`;
$('#pin').innerHTML=sl('inc','Monthly income',10000,500000,1000,75000)+sl('exp','Monthly expenses',5000,400000,1000,48000)+sl('ret','Expected return (% p.a.)',4,18,.5,11)+sl('yrs','Years',1,30,1,10);
const ids=['inc','exp','ret','yrs'];
function upd(){ const v=Object.fromEntries(ids.map(i=>[i,+$('#n_'+i).value])); ids.forEach(i=>{ const r=$('#'+i); r.style.setProperty('--p',((r.value-r.min)/(r.max-r.min)*100)+'%'); });
  const save=Math.max(0,v.inc-v.exp), rate=v.inc?save/v.inc*100:0; const rows=NS.calc.sipFV(save,v.ret,v.yrs); const L=rows[rows.length-1]||{inv:0,fv:0};
  $('#pout').innerHTML=`<div class="res"><div><small>You save / month</small><b>${NS.money(save)}</b><small style="text-transform:none;letter-spacing:0">${rate.toFixed(0)}% of income</small></div><div><small>You invest</small><b>${NS.money(L.inv)}</b></div><div class="big"><small>In ${v.yrs} years</small><b>${NS.money(L.fv)}</b></div></div><div id="pl"></div><p class="muted" style="font-size:.78rem;margin-top:.6rem">Illustrative only — returns are not guaranteed.</p>`;
  NS.chartLine($('#pl'),rows.map(x=>'Y'+x.y),[{name:'Value',color:'var(--orange)',values:rows.map(x=>x.fv)},{name:'Invested',color:'var(--c2)',values:rows.map(x=>x.inv)}],{h:230}); }
ids.forEach(i=>{ const r=$('#'+i),n=$('#n_'+i); r.oninput=()=>{ n.value=r.value; upd(); }; n.oninput=()=>{ r.value=n.value; upd(); }; });
upd();
})();
