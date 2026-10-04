/* Share / save a printable (invoice, quotation, receipt, statement) as an image (PNG) or a PDF.
   Phones: opens the share sheet (WhatsApp, Gmail, Drive…). Computers: downloads the file. */
(function(){
  const LIB={h2c:'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',pdf:'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'};
  const load=src=>new Promise((ok,no)=>{if(document.querySelector(`script[src="${src}"]`))return ok();const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('Could not load the share tools – check your internet connection.'));document.head.appendChild(s)});
  const fname=ext=>(document.title||'NanoFly document').replace(/[\\/:*?"<>|]+/g,'').replace(/\s+/g,' ').trim()+'.'+ext;
  const cache={};let shot=null;
  const msg=t=>{const m=document.getElementById('shmsg');if(m){m.textContent=t||'';m.hidden=!t}};

  async function canvas(){
    if(shot)return shot;
    return shot=(async()=>{
      await load(LIB.h2c);if(document.fonts)await document.fonts.ready;
      const p=document.querySelector('.page'),w=document.querySelector('.pw'),keep=[p.style.transform,p.style.zoom,p.style.width,p.style.minHeight];
      p.style.transform='';p.style.zoom='';p.style.width='';p.style.minHeight='';if(w){w.style.width='';w.style.height=''}
      try{return await html2canvas(p,{scale:2,backgroundColor:'#FFFCF4',useCORS:true,logging:false,windowWidth:900,scrollX:0,scrollY:-window.scrollY})}
      finally{[p.style.transform,p.style.zoom,p.style.width,p.style.minHeight]=keep;if(window.scr)scr()}
    })().catch(e=>{shot=null;throw e});
  }
  async function make(kind){
    if(cache[kind])return cache[kind];
    const c=await canvas();
    if(kind==='png'){cache.png=await new Promise(r=>c.toBlob(r,'image/png'));return cache.png}
    await load(LIB.pdf);
    const {jsPDF}=window.jspdf,wmm=210,ih=c.height*wmm/c.width,hmm=ih<=300?297:ih;   // A4; a long statement becomes one tall page
    const doc=new jsPDF({unit:'mm',format:[wmm,hmm],compress:true});
    doc.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,wmm,ih<=300?297:ih);
    return cache.pdf=doc.output('blob');
  }
  function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
  async function send(kind,btn){
    const type=kind==='png'?'image/png':'application/pdf',name=fname(kind);
    const label=btn.textContent;btn.disabled=true;btn.textContent='Preparing…';
    try{
      const blob=await make(kind),file=new File([blob],name,{type});
      if(navigator.canShare&&navigator.canShare({files:[file]})){
        try{await navigator.share({files:[file],title:name});msg('');return}
        catch(e){if(e.name==='AbortError')return;
          if(e.name==='NotAllowedError'){msg('Ready – tap “'+label.trim()+'” again to share.');return}}   // the phone needs a fresh tap after preparing
      }
      download(blob,name);msg('Saved to your downloads: '+name);
    }catch(e){alert(e.message||e)}
    finally{btn.disabled=false;btn.textContent=label}
  }
  window.shareDoc=(kind,btn)=>send(kind,btn);
  // prepare the image in the background so sharing is instant
  addEventListener('load',()=>setTimeout(()=>{canvas().catch(()=>{})},700));
})();
