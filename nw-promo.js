/* Nano Wealth pop-up for the home page. Shows once per browser session, never blocks the page. */
(function(){
  var pop=document.getElementById('nw-pop'); if(!pop) return;
  var KEY='nw-pop-seen';
  function seen(){try{return sessionStorage.getItem(KEY)==='1'}catch(e){return false}}
  function mark(){try{sessionStorage.setItem(KEY,'1')}catch(e){}}
  function close(){pop.classList.remove('on');pop.setAttribute('aria-hidden','true');mark();document.removeEventListener('keydown',esc)}
  function esc(e){if(e.key==='Escape')close()}
  function open(){pop.classList.add('on');pop.removeAttribute('aria-hidden');document.addEventListener('keydown',esc)}
  pop.querySelector('.nw-x').addEventListener('click',close);
  // Pop-up -> section on this page (smooth scroll + brief highlight)
  pop.querySelector('[data-nw-section]').addEventListener('click',function(e){
    var t=document.getElementById('nano-wealth'); close(); if(!t) return;
    e.preventDefault(); t.scrollIntoView({behavior:'smooth',block:'start'});
    t.classList.add('nw-flash'); setTimeout(function(){t.classList.remove('nw-flash')},1600);
    if(history.replaceState)history.replaceState(null,'','#nano-wealth');
  });
  pop.querySelector('[data-nw-app]').addEventListener('click',mark);
  if(!seen()) setTimeout(open,3500);
})();
