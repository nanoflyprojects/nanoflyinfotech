/* Nano Wealth charts — dependency-free SVG with hover tooltips */
(function(){
const NS=window.NS;
const PAL=['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)','var(--c8)'];
NS.PAL=PAL;
let tip; const T=()=>tip||(tip=Object.assign(document.createElement('div'),{className:'ctip'}),document.body.appendChild(tip),tip);
function showTip(e,html){ const t=T(); t.innerHTML=html; t.style.opacity=1; const w=t.offsetWidth,h=t.offsetHeight; t.style.left=Math.min(innerWidth-w-8,Math.max(8,e.clientX+14))+'px'; t.style.top=Math.max(8,Math.min(innerHeight-h-8,e.clientY+16))+'px'; }
let tipTimer;
function hideTip(){ clearTimeout(tipTimer); if(tip) tip.style.opacity=0; }
NS.hideTip=hideTip;
document.addEventListener('touchstart',e=>{ if(!e.target.closest||!e.target.closest('[data-tip]')) hideTip(); },{passive:true});
document.addEventListener('scroll',hideTip,{passive:true,capture:true});
window.addEventListener('hashchange',hideTip);
function bind(el){ NS.$$('[data-tip]',el).forEach(n=>{ n.addEventListener('mousemove',e=>showTip(e,n.dataset.tip)); n.addEventListener('mouseleave',hideTip); n.addEventListener('touchstart',e=>{ showTip(e.touches[0],n.dataset.tip); clearTimeout(n._t); n._t=setTimeout(hideTip,2200); },{passive:true}); n.addEventListener('touchend',()=>{ clearTimeout(n._t); n._t=setTimeout(hideTip,1500); },{passive:true}); }); }
const nice=m=>{ if(m<=0) return 1; const p=Math.pow(10,Math.floor(Math.log10(m))); const f=m/p; return (f<=1?1:f<=2?2:f<=5?5:10)*p; };

/** grouped bars: data=[{label, a, b}] */
NS.chartBars=(el,data,{names=['Income','Expenses'],colors=['var(--good)','var(--orange)']}={})=>{
  const W=620,H=260,L=56,B=34,Tp=12,R=8; const max=nice(Math.max(1,...data.flatMap(d=>[d.a,d.b]))); const iw=W-L-R, ih=H-B-Tp; const gw=iw/data.length, bw=Math.min(26,gw/3.2);
  let s=`<svg viewBox="0 0 ${W} ${H}" class="chart" role="img">`;
  for(let i=0;i<=4;i++){ const y=Tp+ih-ih*i/4; s+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" class="grid"/><text x="${L-8}" y="${y+4}" text-anchor="end" class="ax">${NS.compact(max*i/4)}</text>`; }
  data.forEach((d,i)=>{ const cx=L+gw*i+gw/2; const ha=ih*d.a/max, hb=ih*d.b/max;
    const tip=`<b>${d.full||d.label}</b><br><span style="color:${colors[0]}">●</span> ${names[0]}: ${NS.money(d.a)}<br><span style="color:${colors[1]}">●</span> ${names[1]}: ${NS.money(d.b)}<br>Saved: <b>${NS.money(d.a-d.b)}</b>`;
    s+=`<g data-tip='${NS.esc(tip).replace(/'/g,"&#39;")}' class="bgrp"><rect x="${cx-gw/2}" y="${Tp}" width="${gw}" height="${ih}" fill="transparent"/>
      <rect class="bar" style="--d:${i*60}ms" x="${cx-bw-2}" y="${Tp+ih-ha}" width="${bw}" height="${Math.max(ha,0)}" rx="7" fill="${colors[0]}"/>
      <rect class="bar" style="--d:${i*60+30}ms" x="${cx+2}" y="${Tp+ih-hb}" width="${bw}" height="${Math.max(hb,0)}" rx="7" fill="${colors[1]}"/></g>
      <text x="${cx}" y="${H-10}" text-anchor="middle" class="ax">${d.label}</text>`; });
  el.innerHTML=s+'</svg>'; bind(el);
};
/** donut: data=[{label,value,color?}] */
NS.chartDonut=(el,data,{center='',sub='',size=190}={})=>{
  const tot=NS.sum(data,d=>d.value)||1; const r=70,c=2*Math.PI*r; let off=0;
  let s=`<svg viewBox="0 0 200 200" width="${size}" height="${size}" class="donut">`;
  if(!data.length||tot===0) s+=`<circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="26"/>`;
  data.forEach((d,i)=>{ const len=c*d.value/tot; const col=d.color||PAL[i%PAL.length];
    s+=`<circle class="seg" cx="100" cy="100" r="${r}" fill="none" stroke="${col}" stroke-width="26" stroke-dasharray="${Math.max(len-2,0.5)} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)" data-tip='<b>${NS.esc(d.label)}</b><br>${NS.money(d.value)} · ${(d.value/tot*100).toFixed(1)}%'/>`; off+=len; });
  s+=`<text x="100" y="${sub?96:105}" text-anchor="middle" class="dc">${center}</text>${sub?`<text x="100" y="116" text-anchor="middle" class="ds">${sub}</text>`:''}</svg>`;
  el.innerHTML=s; bind(el);
};
/** line/area: series=[{name,color,values[]}], labels[] */
NS.chartLine=(el,labels,series,{h=240,area=true,fmt=NS.compact}={})=>{
  const W=620,H=h,L=58,B=30,Tp=14,R=12; const all=series.flatMap(s=>s.values); const mx=Math.max(1,...all), mn=Math.min(0,...all); const max=nice(mx), min=mn<0?-nice(-mn):0;
  const iw=W-L-R, ih=H-B-Tp; const x=i=>L+(labels.length<2?iw/2:iw*i/(labels.length-1)); const y=v=>Tp+ih-ih*(v-min)/((max-min)||1);
  let s=`<svg viewBox="0 0 ${W} ${H}" class="chart">`;
  for(let i=0;i<=4;i++){ const v=min+(max-min)*i/4, yy=y(v); s+=`<line x1="${L}" x2="${W-R}" y1="${yy}" y2="${yy}" class="grid"/><text x="${L-8}" y="${yy+4}" text-anchor="end" class="ax">${fmt(v)}</text>`; }
  const step=Math.ceil(labels.length/8); labels.forEach((l,i)=>{ if(i%step===0) s+=`<text x="${x(i)}" y="${H-8}" text-anchor="middle" class="ax">${l}</text>`; });
  series.forEach((se,si)=>{ const pts=se.values.map((v,i)=>[x(i),y(v)]); const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
    if(area&&si===0) s+=`<defs><linearGradient id="g${si}${el.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${se.color}" stop-opacity=".28"/><stop offset="1" stop-color="${se.color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${x(labels.length-1)} ${y(min)} L${x(0)} ${y(min)}Z" fill="url(#g${si}${el.id})"/>`;
    s+=`<path class="ln" d="${d}" fill="none" stroke="${se.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`; });
  labels.forEach((l,i)=>{ const tip=`<b>${l}</b>`+series.map(se=>`<br><span style="color:${se.color}">●</span> ${se.name}: ${NS.money(se.values[i])}`).join(''); const w=iw/Math.max(1,labels.length-1);
    s+=`<rect x="${x(i)-w/2}" y="${Tp}" width="${w}" height="${ih}" fill="transparent" data-tip='${NS.esc(tip)}'/>`; });
  el.innerHTML=s+'</svg>'; bind(el);
};
/** score ring 0-100 */
NS.chartRing=(el,score,color)=>{ const r=54,c=2*Math.PI*r; el.innerHTML=`<svg viewBox="0 0 140 140" width="150" height="150"><circle cx="70" cy="70" r="${r}" fill="none" stroke="var(--surface-3)" stroke-width="14"/><circle class="ringfg" cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${c*score/100} ${c}" transform="rotate(-90 70 70)"/><text x="70" y="78" text-anchor="middle" class="rn">${Math.round(score)}</text></svg>`; };
})();
