/* Nano Wealth registry client — talks to the Apps Script web app (apps-script/Code.gs).
   The registry stores ACCOUNT METADATA ONLY: name, email, join date, last login, status.
   It never receives any spending data, sheet contents or even the sheet's ID. */
(function(){
const NS=window.NS;
const DEMO_KEY='ns_demo_registry';

function seedDemo(){
  const now=Date.now(), d=86400000;
  const names=[['Aarav Mehta','aarav.mehta'],['Diya Nair','diya.nair'],['Rohan Iyer','rohan.iyer'],['Sneha Kapoor','sneha.k'],['Vikram Rao','vikram.rao'],['Meera Joshi','meera.joshi'],['Karan Shah','karan.shah22'],['Ananya Das','ananya.das'],['Arjun Pillai','arjun.p'],['Isha Verma','isha.verma'],['Rahul Khanna','rahul.khanna'],['Pooja Menon','pooja.menon'],['Nikhil Bose','nikhil.bose'],['Tara Singh','tara.singh9']];
  return names.map((n,i)=>{ const joined=now-(Math.floor(Math.random()*34)+(i<4?0:1))*d - Math.random()*d; const last=now-Math.floor(Math.random()*(i%5===0?20:5))*d-Math.random()*d;
    return {sub:'demo-'+i,email:n[1]+'@gmail.com',name:n[0],picture:'',createdAt:new Date(joined).toISOString(),lastLoginAt:new Date(last).toISOString(),logins:Math.floor(Math.random()*40)+1,status:i===9?'suspended':'active',sheetLinked:i!==12,sheetLocked:i!==12&&i!==5}; })
   .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
function demoLoad(){ try{ let r=JSON.parse(localStorage.getItem(DEMO_KEY)||'null'); if(!r){ r=seedDemo(); localStorage.setItem(DEMO_KEY,JSON.stringify(r)); } return r; }catch(e){ return seedDemo(); } }
function demoSave(r){ localStorage.setItem(DEMO_KEY,JSON.stringify(r)); }

async function call(action,payload){
  const token=await NS.auth.token();
  const r=await fetch(NS.cfg.REGISTRY_URL,{method:'POST',body:JSON.stringify({action,token,...payload}),redirect:'follow'});
  const j=await r.json(); if(!j.ok) throw Object.assign(new Error(j.error||'Registry error'),{code:j.code}); return j;
}
NS.registry = {
  enabled: !!NS.cfg.REGISTRY_URL || NS.demo,
  /** Called on every sign-in. Returns {status:'active'|'suspended', isAdmin} */
  async touch(info){
    if(NS.demo){ const u=NS.auth.user; const r=demoLoad(); let me=r.find(x=>x.sub===u.sub);
      if(!me){ me={sub:u.sub,email:u.email,name:u.name,picture:'',createdAt:new Date().toISOString(),logins:0,status:'active'}; r.unshift(me); }
      const upd=info&&info.update; if(!upd){ me.lastLoginAt=new Date().toISOString(); me.logins=(me.logins||0)+1; } const i2={...(info||{})}; delete i2.update; Object.assign(me,i2); demoSave(r); return {status:me.status,isAdmin:true}; }
    if(!NS.cfg.REGISTRY_URL) return {status:'active',isAdmin:false};
    return call('touch',info||{});
  },
  async list(){ if(NS.demo) return {accounts:demoLoad()}; return call('list'); },
  async setStatus(sub,status){ if(NS.demo){ const r=demoLoad(); const a=r.find(x=>x.sub===sub); if(a) a.status=status; demoSave(r); return {ok:true}; } return call('setStatus',{sub,status}); },
  async remove(sub){ if(NS.demo){ demoSave(demoLoad().filter(x=>x.sub!==sub)); return {ok:true}; } return call('remove',{sub}); },
  async deleteMe(){ if(NS.demo){ demoSave(demoLoad().filter(x=>x.sub!==NS.auth.user.sub)); return {ok:true}; } if(!NS.cfg.REGISTRY_URL) return {ok:true}; return call('deleteMe'); }
};
})();
