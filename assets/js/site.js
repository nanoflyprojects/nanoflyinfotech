/* NanoFLY InfoTech - site.js (no dependencies) */
(function(){
"use strict";
var d=document,root=d.documentElement,$=function(s,c){return (c||d).querySelector(s)},$$=function(s,c){return [].slice.call((c||d).querySelectorAll(s))};
var rm=matchMedia("(prefers-reduced-motion:reduce)").matches,fine=matchMedia("(hover:hover) and (pointer:fine)").matches;

/* ---------- theme ---------- */
var mq=matchMedia("(prefers-color-scheme:dark)"),tg=$("#tg");
function cur(){return root.getAttribute("data-theme")||(mq.matches?"dark":"light")}
function setTheme(t,save){root.setAttribute("data-theme",t);d.body.classList.add("theming");setTimeout(function(){d.body.classList.remove("theming")},400);
  if(save){try{localStorage.setItem("nano-theme",t)}catch(e){}}
  tg&&(tg.setAttribute("aria-pressed",t==="dark"),tg.setAttribute("aria-label",t==="dark"?"Switch to light mode":"Switch to dark mode"));
  var m=$('meta[name=theme-color]');m&&m.setAttribute("content",t==="dark"?"#150d13":"#F6F6E9")}
tg&&tg.addEventListener("click",function(){setTheme(cur()==="dark"?"light":"dark",true)});
mq.addEventListener&&mq.addEventListener("change",function(){var s=null;try{s=localStorage.getItem("nano-theme")}catch(e){}if(!s)setTheme(mq.matches?"dark":"light")});
setTheme(cur());

/* ---------- nav: scroll state, progress, spy, mobile menu ---------- */
var nav=$("#nav"),bar=$("#bar"),menu=$("#menu"),mb=$("#mb"),links=$$(".menu a.lk"),fab=$(".fab");
function onScroll(){var y=scrollY,H=root.scrollHeight-innerHeight;nav.classList.toggle("s",y>16||!!nav.dataset.solid);bar.style.transform="scaleX("+(H>0?y/H:0)+")"}
addEventListener("scroll",onScroll,{passive:true});onScroll();
function closeMenu(){menu.classList.remove("open");mb.setAttribute("aria-expanded","false");d.body.classList.remove("lock")}
mb.addEventListener("click",function(){var o=!menu.classList.contains("open");menu.classList.toggle("open",o);mb.setAttribute("aria-expanded",o);d.body.classList.toggle("lock",o)});
links.forEach(function(a){a.addEventListener("click",closeMenu)});
addEventListener("keydown",function(e){if(e.key==="Escape"){closeMenu();$("#lb")&&$("#lb").classList.remove("on")}});
addEventListener("resize",function(){if(innerWidth>900)closeMenu()});
if("IntersectionObserver" in window){
  var secs=links.filter(function(a){return a.getAttribute("href").charAt(0)==="#"}).map(function(a){return $(a.getAttribute("href"))}).filter(Boolean);
  var spy=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){links.forEach(function(a){a.removeAttribute("aria-current")});var a=$('.menu a.lk[href="#'+e.target.id+'"]');a&&a.setAttribute("aria-current","true")}})},{rootMargin:"-45% 0px -50% 0px"});
  secs.forEach(function(s){spy.observe(s)});
  var ct=$("#contact");if(ct&&fab)new IntersectionObserver(function(es){fab.classList.toggle("hide",es[0].isIntersecting)},{threshold:.25}).observe(ct)}

/* ---------- hero: stop advertising and you stop the clock ---------- */
var glow=$("#glow");
if(glow&&fine&&!rm){addEventListener("pointermove",function(e){glow.classList.add("on");glow.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)"},{passive:true})}

/* typed service line (full text is in the HTML for crawlers; typing starts after a pause) */
var W=["social media.","SEO and paid ads.","website.","custom software.","team's training."],rot=$("#rot");
if(rot&&!rm){var wi=0,ci=W[0].length,del=true;(function ty(){var w=W[wi];
  if(!del){ci++;rot.textContent=w.slice(0,ci);if(ci===w.length){del=true;return setTimeout(ty,1800)}}
  else{ci--;rot.textContent=w.slice(0,ci);if(!ci){del=false;wi=(wi+1)%W.length}}
  setTimeout(ty,del?35:75)})()}
function fmt(n){return Math.floor(n).toLocaleString("en-IN")}

/* the clock: advertising on = hands move and reach grows; off = clock stops and customers leak away */
var cb=$("#cb");
if(cb){
  var tk="",i,a,h,r1;for(i=0;i<60;i++){a=i*Math.PI/30;h=i%5===0;r1=h?122:132;
    tk+='<line class="tick'+(h?" h":"")+'" x1="'+(150+Math.sin(a)*r1)+'" y1="'+(150-Math.cos(a)*r1)+'" x2="'+(150+Math.sin(a)*142)+'" y2="'+(150-Math.cos(a)*142)+'"/>'}
  $("#ticks").innerHTML=tk;
  var sh=$("#sh"),mh=$("#mh"),hh=$("#hh"),rc=$("#reach"),ls=$("#lostn"),sw=$("#sw"),swl=$("#swl"),hero=$("#top");
  var run=true,off=0,reach=0,lost=0,last=performance.now(),vis=true;
  function paint(){sh.style.transform="rotate("+off*24+"deg)";mh.style.transform="rotate("+(off*.75+60)+"deg)";hh.style.transform="rotate("+(off*.0625+150)+"deg)";rc.textContent=fmt(reach);ls.textContent=fmt(lost)}
  function frame(n){var dt=Math.min(.1,(n-last)/1000);last=n;
    if(vis&&!d.hidden){if(run){off+=dt;reach+=dt*(38+Math.random()*14)}else lost+=dt*(21+Math.random()*9);paint()}
    requestAnimationFrame(frame)}
  paint();
  if(!rm)requestAnimationFrame(frame);
  if("IntersectionObserver" in window)new IntersectionObserver(function(es){vis=es[0].isIntersecting}).observe(cb);
  sw.addEventListener("click",function(){run=!run;d.body.classList.toggle("stopped",!run);sw.setAttribute("aria-pressed",!run);
    swl.textContent=run?"Advertising: running":"Advertising: stopped to save money";
    if(rm){if(run)reach+=3200;else lost+=2400;paint()}});
  /* chips open the matching service; gentle parallax on desktop */
  $$(".stage .chip").forEach(function(c){c.addEventListener("click",function(){openSvc(+c.dataset.s,true)})});
  if(fine&&!rm&&hero)hero.addEventListener("pointermove",function(e){var x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5;
    $$(".stage .chip").forEach(function(c,i){c.style.transform="translate("+x*(i%2?-24:24)+"px,"+y*18+"px)"});
    cb.style.transform="perspective(900px) rotateY("+x*7+"deg) rotateX("+(-y*7)+"deg)"});
}

/* ---------- quote: clock turns with scroll ---------- */
(function(){var q=$("#qsec");if(!q)return;var qt=$("#qt"),ws=qt.textContent.trim().split(/\s+/);
  qt.innerHTML=ws.map(function(w){return "<i"+(/clock|time|stops/i.test(w)?' class="hl"':"")+">"+w+"</i>"}).join(" ");
  var qi=$$("i",qt),g="",i,a,h;for(i=0;i<60;i++){a=i*Math.PI/30;h=i%5===0;g+='<line class="tk'+(h?" h":"")+'" x1="'+(150+Math.sin(a)*(h?122:132))+'" y1="'+(150-Math.cos(a)*(h?122:132))+'" x2="'+(150+Math.sin(a)*142)+'" y2="'+(150-Math.cos(a)*142)+'"/>'}
  $("#qt2").innerHTML=g;var hs=$("#qs2"),hm=$("#qm2"),hh=$("#qh"),pb=$("#qpb"),lab=$("#qlab");
  [hs,hm,hh].forEach(function(e){e.style.transformOrigin="150px 150px"});
  function f(){var r=q.getBoundingClientRect(),tot=r.height-innerHeight,p=rm?1:Math.min(1,Math.max(0,-r.top/tot)),pr=Math.min(1,p/.8);
    qi.forEach(function(e,i){e.classList.toggle("on",i/qi.length<pr*1.02)});pb.style.width=p*100+"%";
    var a=p*1080;hs.style.transform="rotate("+a+"deg)";hm.style.transform="rotate("+(a/12+40)+"deg)";hh.style.transform="rotate("+(a/144+200)+"deg)";
    var dn=p>.93;q.classList.toggle("done",dn);lab.textContent=dn?"Clock stopped":"Time is running"}
  addEventListener("scroll",f,{passive:true});addEventListener("resize",f);f()})();

/* ---------- services accordion ---------- */
var rows=$$(".row");
function setRow(r,o){r.classList.toggle("open",o);$("button",r).setAttribute("aria-expanded",o)}
function openSvc(i,scroll){var r=rows[i];if(!r)return;rows.forEach(function(x){setRow(x,x===r)});
  if(scroll){scrollTo({top:Math.max(0,r.getBoundingClientRect().top+scrollY-nav.offsetHeight-24),behavior:rm?"auto":"smooth"})}}
rows.forEach(function(r,i){$("button",r).addEventListener("click",function(){setRow(r,!r.classList.contains("open"));rows.forEach(function(x){if(x!==r)setRow(x,false)})})});

/* ---------- plans: tabs + spotlight ---------- */
var tabs=$$('.tabs [role=tab]');
function pickTab(t,focus){tabs.forEach(function(x){var on=x===t;x.setAttribute("aria-selected",on);x.tabIndex=on?0:-1;$("#"+x.getAttribute("aria-controls")).hidden=!on});focus&&t.focus()}
tabs.forEach(function(t,i){t.addEventListener("click",function(){pickTab(t)});t.addEventListener("keydown",function(e){var n=e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0;if(n){e.preventDefault();pickTab(tabs[(i+n+tabs.length)%tabs.length],true)}})});
if(fine&&!rm)$$(".pc").forEach(function(c){c.addEventListener("pointermove",function(e){var r=c.getBoundingClientRect();c.style.setProperty("--mx",e.clientX-r.left+"px");c.style.setProperty("--my",e.clientY-r.top+"px")})});

/* ---------- clients rail ---------- */
(function(){
  var rail=$("#rail");if(!rail||typeof NANO_CLIENTS==="undefined"||!NANO_CLIENTS.length)return;
  var vp=$(".rail-vp",rail),tr=$(".rail-tr",rail),list=NANO_CLIENTS,GAP=14,x=0,vel=0,paused=false,dragging=false,moved=0,per=5,single=0,target=null,last=performance.now();
  function esc(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")}
  function tile(c,clone){var inner='<div class="lg"><img src="'+esc(c.logo)+'" alt="'+(clone?"":esc(c.name)+" logo")+'" loading="lazy" decoding="async" draggable="false"></div><span class="nm">'+esc(c.name)+(c.url?"<i>Visit website ↗</i>":"")+"</span>";
    var a=clone?' aria-hidden="true" tabindex="-1"':"";
    return c.url?'<a class="k" href="'+esc(c.url)+'" target="_blank" rel="noopener noreferrer"'+a+' title="'+esc(c.name)+'">'+inner+"</a>":'<div class="k"'+a+' title="'+esc(c.name+(c.note?" · "+c.note:""))+'">'+inner+"</div>"}
  function perView(){var w=innerWidth;return w>=1100?5:w>=820?4:w>=560?3:2}
  function build(){
    per=perView();var w=vp.clientWidth,pad=0,kw=Math.floor((w-GAP*(per-1))/per);rail.style.setProperty("--kw",kw+"px");rail.style.setProperty("--gap",GAP+"px");
    var isStatic=list.length<=per;rail.classList.toggle("static",isStatic);
    if(isStatic){tr.innerHTML=list.map(function(c){return tile(c)}).join("");tr.style.transform="";return}
    var set=list.map(function(c){return tile(c)}).join(""),copies=Math.max(2,Math.ceil((w*2)/((kw+GAP)*list.length))+1),html=set;
    for(var i=1;i<copies;i++)html+=list.map(function(c){return tile(c,true)}).join("");
    tr.innerHTML=html;single=(kw+GAP)*list.length;x=((x%single)+single)%single;draw()}
  function draw(){tr.style.transform="translate3d("+(-x)+"px,0,0)"}
  function loop(t){var dt=Math.min(.05,(t-last)/1000);last=t;
    if(!rail.classList.contains("static")){
      if(target!==null){var diff=target-x;x+=diff*Math.min(1,dt*9);if(Math.abs(diff)<.5){x=target;target=null}}
      else if(!dragging&&!paused&&!rm&&!d.hidden){x+=42*dt}
      else if(!dragging&&Math.abs(vel)>1){x+=vel*dt;vel*=.93}
      if(single){var w=((x%single)+single)%single,sh=w-x;x=w;if(target!==null)target+=sh}draw()}
    requestAnimationFrame(loop)}
  build();requestAnimationFrame(loop);
  var rt;addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(build,120)});
  rail.addEventListener("pointerenter",function(e){if(e.pointerType==="mouse")paused=true});rail.addEventListener("pointerleave",function(e){if(e.pointerType==="mouse")paused=false});
  rail.addEventListener("focusin",function(){paused=true});rail.addEventListener("focusout",function(){paused=false});
  var sx=0,sxv=0,lx=0,lt=0;
  vp.addEventListener("pointerdown",function(e){if(rail.classList.contains("static"))return;dragging=true;moved=0;sx=e.clientX;sxv=x;lx=e.clientX;lt=performance.now();vel=0;target=null;vp.classList.add("drag")});
  addEventListener("pointermove",function(e){if(!dragging)return;var dx=e.clientX-sx;moved=Math.max(moved,Math.abs(dx));x=sxv-dx;var n=performance.now();if(n>lt)vel=(lx-e.clientX)/((n-lt)/1000);lx=e.clientX;lt=n});
  addEventListener("pointerup",function(){if(!dragging)return;dragging=false;vp.classList.remove("drag");if(performance.now()-lt>80)vel=0;vel=Math.max(-900,Math.min(900,vel))});
  vp.addEventListener("click",function(e){if(moved>6){e.preventDefault();e.stopPropagation()}},true);
  function step(n){if(rail.classList.contains("static"))return;var kw=parseFloat(getComputedStyle(rail).getPropertyValue("--kw"))+GAP;target=(target!==null?target:x)+n*kw}
  $("#rprev").addEventListener("click",function(){step(-1)});$("#rnext").addEventListener("click",function(){step(1)});
  var cnt=$("#kcount");cnt&&(cnt.textContent=list.length);
})();

/* ---------- magnetic buttons ---------- */
if(fine&&!rm)$$(".btn.mag").forEach(function(b){b.addEventListener("pointermove",function(e){var r=b.getBoundingClientRect();b.style.transform="translate("+((e.clientX-r.left-r.width/2)*.14)+"px,"+((e.clientY-r.top-r.height/2)*.22-2)+"px)"});b.addEventListener("pointerleave",function(){b.style.transform=""})});

/* ---------- plan buttons prefill the form select (secondary) / smooth anchors ---------- */
$$('a[href^="#"]').forEach(function(a){a.addEventListener("click",function(e){var id=a.getAttribute("href");if(id.length>1&&$(id)){e.preventDefault();$(id).scrollIntoView({behavior:rm?"auto":"smooth"});history.replaceState(null,"",id)}else if(id==="#top"){e.preventDefault();scrollTo({top:0,behavior:rm?"auto":"smooth"})}})});
$$("[data-svc]").forEach(function(a){a.addEventListener("click",function(){setTimeout(function(){openSvc(+a.dataset.svc,false)},50)})});
if(location.hash&&/^#service-\d$/.test(location.hash)){openSvc(+location.hash.slice(-1)-1,true)}

/* ---------- contact form (same Apps Script backend as before) ---------- */
var f=$("#nanofly-contact-form");
if(f)f.addEventListener("submit",function(e){e.preventDefault();if(f.botcheck.checked)return;var sb=$("#submit-btn"),rs=$("#res"),lab=sb.firstChild.textContent;
  sb.disabled=true;sb.firstChild.textContent="Sending…";rs.className="";rs.removeAttribute("style");
  var o={};new FormData(f).forEach(function(v,k){o[k]=v});o.page_url=location.href;o.submitted_at=new Date().toISOString();
  fetch("https://script.google.com/macros/s/AKfycbzytolPVf_Nzk0Hy5qT-oJO0IOaO87s1pf0QHXnf4-DEJaZf89Oxoi-X79SoIzDvZM/exec",{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(o)})
  .then(function(r){return r.json()}).then(function(j){if(j.result==="success"){rs.className="ok";rs.textContent="Thank you. Your message is on its way, and we will reply shortly.";f.reset()}else{rs.className="er";rs.textContent=j.message||"We could not send your message. Please check the form and try again."}})
  .catch(function(){rs.className="er";rs.textContent="We could not send your message. Try again, or reach us on WhatsApp or email."})
  .finally(function(){sb.disabled=false;sb.firstChild.textContent=lab;setTimeout(function(){rs.className=""},9000)})});

/* ---------- lightbox + copy link (certificate pages) ---------- */
var lbi=$("#dimg");if(lbi)lbi.addEventListener("click",function(){$("#lbi").src=lbi.querySelector("img").src;$("#lb").classList.add("on")});
if($("#lb"))$("#lb").addEventListener("click",function(){this.classList.remove("on")});
var cp=$("#cp");if(cp)cp.addEventListener("click",function(){var b=this,u=location.href;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){b.textContent="Link copied"},function(){prompt("Copy this link",u)});setTimeout(function(){b.textContent="Copy verification link"},2200)});
/* certificate filter + search */
var cards=$$(".cc"),role="all",qi=$("#q");
function flt(){var q=(qi&&qi.value||"").toLowerCase().trim(),n=0;cards.forEach(function(c){var ok=(role==="all"||c.dataset.role===role)&&(!q||c.dataset.name.indexOf(q)>-1);c.classList.toggle("hide",!ok);if(ok)n++});$("#none").style.display=n?"none":"block"}
$$(".fc").forEach(function(b){b.addEventListener("click",function(){$$(".fc").forEach(function(x){x.classList.remove("on")});b.classList.add("on");role=b.dataset.r;flt()})});if(qi)qi.addEventListener("input",flt);
})();
