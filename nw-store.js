/* Nano Wealth data layer.
   Production: each person's own Google Sheet, created BY THEM (their token) in THEIR Drive.
   Nobody else is ever added; a permission sweep removes any other access.
   Demo: same API on localStorage. */
(function(){
const NS=window.NS;

const SCHEMA = {
  income:     {tab:'Income',      cols:['id','date','source','category','amount','recurring','notes','endDate'], num:['amount']},
  expenses:   {tab:'Expenses',    cols:['id','date','description','category','amount','mode','notes','recurring','endDate','spentFor','forWho'], num:['amount']},
  investments:{tab:'Investments', cols:['id','name','type','invested','current','buyDate','notes','plan','sipAmount','sipDay','sipEnd','remind','rate'], num:['invested','current','sipAmount','sipDay','rate']},
  loans:      {tab:'Loans',       cols:['id','lender','type','principal','rate','tenure','startDate','paidEmis','notes'], num:['principal','rate','tenure','paidEmis']},
  debts:      {tab:'Debts',       cols:['id','party','type','direction','amount','paid','dueDate','notes'], num:['amount','paid']},
  goals:      {tab:'Goals',         cols:['id','name','target','saved','deadline','notes'], num:['target','saved']},
  recurring:  {tab:'Recurring',     cols:['id','kind','name','amount','frequency','day','startDate','endDate','category','target','lastRun','remind','active','notes'], num:['amount','day']},
  settings:   {tab:'Settings',    cols:['key','value'], num:[]}
};
NS.SCHEMA=SCHEMA;
const TABLES=['income','expenses','investments','loans','debts','goals','recurring'];

const state = { data:{}, settings:{}, sheetId:null, sheetUrl:null, tabIds:{}, loaded:false };
NS.data = state;

/* ---------- Google REST ---------- */
async function g(url,opts={},retry=true){
  const t=await NS.auth.token();
  const r=await fetch(url,{...opts,headers:{Authorization:'Bearer '+t,'Content-Type':'application/json',...(opts.headers||{})}});
  if(r.status===401 && retry){ await NS.auth.forceRefresh(); return g(url,opts,false); }
  if(r.status===204) return {};
  const j=await r.json().catch(()=>({}));
  if(!r.ok){ const e=new Error((j.error&&j.error.message)||('Request failed ('+r.status+')')); e.status=r.status; throw e; }
  return j;
}
const SHEETS='https://sheets.googleapis.com/v4/spreadsheets', DRIVE='https://www.googleapis.com/drive/v3/files';
const colL = n => String.fromCharCode(64+n);

const toRow = (tbl,item) => SCHEMA[tbl].cols.map(c=>item[c]??'');
function fromRow(tbl,row,rowNo){
  const o={_row:rowNo}; SCHEMA[tbl].cols.forEach((c,i)=>{ let v=row[i]; if(v===undefined||v==='') v=SCHEMA[tbl].num.includes(c)?0:''; if(SCHEMA[tbl].num.includes(c)) v=Number(v)||0; o[c]=v; }); return o;
}

/* ---------- Google backend ---------- */
const GoogleBackend = {
  async findOrCreate(){
    const user=NS.auth.user; const cacheKey='ns_sheet_'+user.sub;
    let id=null; try{ id=localStorage.getItem(cacheKey); }catch(e){}
    if(id){ try{ await g(`${DRIVE}/${id}?fields=id,trashed`).then(f=>{ if(f.trashed) id=null; }); }catch(e){ id=null; } }
    if(!id){
      const q=encodeURIComponent("appProperties has { key='nanospend' and value='1' } and trashed=false and 'me' in owners");
      const l=await g(`${DRIVE}?q=${q}&fields=files(id,name)&orderBy=createdTime&pageSize=5`);
      if(l.files&&l.files.length) id=l.files[0].id;
    }
    let created=false;
    if(!id){ id=await this.create(); created=true; }
    try{ localStorage.setItem(cacheKey,id); }catch(e){}
    state.sheetId=id; state.sheetUrl='https://docs.google.com/spreadsheets/d/'+id+'/edit';
    return {created};
  },
  async create(){
    const hdr = cols => cols.map(c=>({userEnteredValue:{stringValue:c},userEnteredFormat:{backgroundColor:{red:.16,green:.106,blue:.145},textFormat:{foregroundColor:{red:.965,green:.965,blue:.914},bold:true},horizontalAlignment:'LEFT'}}));
    const body={properties:{title:NS.cfg.SHEET_TITLE||'Nano Wealth — My Money Data'},
      sheets:Object.values(SCHEMA).map(s=>({properties:{title:s.tab,gridProperties:{frozenRowCount:1},tabColor:{red:.93,green:.357,blue:.176}},data:[{startRow:0,startColumn:0,rowData:[{values:hdr(s.cols)}]}]}))};
    const sp=await g(SHEETS,{method:'POST',body:JSON.stringify(body)});
    // tag the file so we can find it again (drive.file only ever sees files this app created)
    await g(`${DRIVE}/${sp.spreadsheetId}?fields=id`,{method:'PATCH',body:JSON.stringify({appProperties:{nanospend:'1'},description:'Private Nano Wealth data. Created by you, owned by you. Do not share.'})});
    return sp.spreadsheetId;
  },
  async meta(){
    const m=await g(`${SHEETS}/${state.sheetId}?fields=sheets.properties(sheetId,title)`);
    m.sheets.forEach(s=>state.tabIds[s.properties.title]=s.properties.sheetId);
    // self-heal: recreate any missing tab (e.g. someone deleted it)
    const missing=Object.values(SCHEMA).filter(s=>!(s.tab in state.tabIds));
    if(missing.length){
      await g(`${SHEETS}/${state.sheetId}:batchUpdate`,{method:'POST',body:JSON.stringify({requests:missing.map(s=>({addSheet:{properties:{title:s.tab}}}))})});
      for(const s of missing) await g(`${SHEETS}/${state.sheetId}/values/${s.tab}!A1:${colL(s.cols.length)}1?valueInputOption=RAW`,{method:'PUT',body:JSON.stringify({values:[s.cols]})});
      return this.meta();
    }
  },
  async healHeaders(){   // new versions add columns: make sure row 1 of every tab matches
    const ranges=Object.values(SCHEMA).map(s=>'ranges='+encodeURIComponent(s.tab+'!1:1')).join('&');
    const r=await g(`${SHEETS}/${state.sheetId}/values:batchGet?${ranges}`); const fix=[];
    Object.values(SCHEMA).forEach((s,i)=>{ const have=((r.valueRanges[i].values||[[]])[0])||[]; if(have.length<s.cols.length||s.cols.some((c,j)=>have[j]!==c)) fix.push({range:`${s.tab}!A1:${colL(s.cols.length)}1`,values:[s.cols]}); });
    if(fix.length) await g(`${SHEETS}/${state.sheetId}/values:batchUpdate`,{method:'POST',body:JSON.stringify({valueInputOption:'RAW',data:fix})});
  },
  async loadAll(){
    await this.meta(); if(!this._healed){ try{ await this.healHeaders(); this._healed=true; }catch(e){ console.warn('header heal',e); } }
    const ranges=Object.values(SCHEMA).map(s=>'ranges='+encodeURIComponent(s.tab+'!A2:'+colL(s.cols.length))).join('&');
    const r=await g(`${SHEETS}/${state.sheetId}/values:batchGet?${ranges}&valueRenderOption=UNFORMATTED_VALUE`);
    const out={};
    Object.keys(SCHEMA).forEach((k,i)=>{ const rows=(r.valueRanges[i].values||[]); out[k]=rows.map((row,j)=>({row,n:j+2})).filter(x=>x.row.length&&x.row[0]!=='').map(x=>fromRow(k,x.row,x.n)); });
    return out;
  },
  async insert(tbl,item){
    const s=SCHEMA[tbl];
    const r=await g(`${SHEETS}/${state.sheetId}/values/${s.tab}!A:${colL(s.cols.length)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:'POST',body:JSON.stringify({values:[toRow(tbl,item)]})});
    const m=/!A(\d+)/.exec(r.updates.updatedRange); item._row=m?Number(m[1]):null;
  },
  async insertMany(tbl,items){
    const s=SCHEMA[tbl];
    const r=await g(`${SHEETS}/${state.sheetId}/values/${s.tab}!A:${colL(s.cols.length)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:'POST',body:JSON.stringify({values:items.map(i=>toRow(tbl,i))})});
    const m=/!A(\d+)/.exec(r.updates.updatedRange); const start=m?Number(m[1]):null; items.forEach((it,i)=>it._row=start?start+i:null);
  },
  async locate(tbl,item){   // verify the row still holds this id (guards against edits from another device)
    const s=SCHEMA[tbl];
    if(item._row){ const r=await g(`${SHEETS}/${state.sheetId}/values/${s.tab}!A${item._row}?valueRenderOption=UNFORMATTED_VALUE`); if(r.values&&String(r.values[0][0])===String(item[s.cols[0]])) return item._row; }
    const all=await g(`${SHEETS}/${state.sheetId}/values/${s.tab}!A:A?valueRenderOption=UNFORMATTED_VALUE`);
    const idx=(all.values||[]).findIndex(v=>String(v[0])===String(item[s.cols[0]])); if(idx<0) throw new Error('That row no longer exists in your sheet'); item._row=idx+1; return item._row;
  },
  async update(tbl,item){
    const s=SCHEMA[tbl]; const row=await this.locate(tbl,item);
    await g(`${SHEETS}/${state.sheetId}/values/${s.tab}!A${row}:${colL(s.cols.length)}${row}?valueInputOption=RAW`,{method:'PUT',body:JSON.stringify({values:[toRow(tbl,item)]})});
  },
  async remove(tbl,item){
    const s=SCHEMA[tbl]; const row=await this.locate(tbl,item);
    await g(`${SHEETS}/${state.sheetId}:batchUpdate`,{method:'POST',body:JSON.stringify({requests:[{deleteDimension:{range:{sheetId:state.tabIds[s.tab],dimension:'ROWS',startIndex:row-1,endIndex:row}}}]})});
    (state.data[tbl]||[]).forEach(x=>{ if(x._row>row) x._row--; });
  },
  /** Remove every permission except the owner (the person themself). */
  async lockdown(){
    const r=await g(`${DRIVE}/${state.sheetId}/permissions?fields=permissions(id,type,role,emailAddress,displayName)&supportsAllDrives=false`);
    const others=(r.permissions||[]).filter(p=>p.role!=='owner');
    let removed=0;
    for(const p of others){ try{ await g(`${DRIVE}/${state.sheetId}/permissions/${p.id}`,{method:'DELETE'}); removed++; }catch(e){} }
    const after=await g(`${DRIVE}/${state.sheetId}/permissions?fields=permissions(id,type,role,emailAddress,displayName)`);
    return {removed,found:others.map(p=>p.emailAddress||p.type),permissions:after.permissions||[]};
  },
  async audit(){ const r=await g(`${DRIVE}/${state.sheetId}/permissions?fields=permissions(id,type,role,emailAddress,displayName)`); return r.permissions||[]; }
};

/* ---------- Demo backend ---------- */
const DKEY='ns_demo_data_v3';
function seed(){
  const t=new Date(), d=(m,day)=>NS.iso(new Date(t.getFullYear(),t.getMonth()-m,Math.min(day,28))), id=()=>NS.uid();
  const exp=[], inc=[
    {id:id(),date:d(6,1),source:'Nano Corp — Salary',category:'Salary',amount:85000,recurring:'Monthly',notes:'Credited on the 1st',endDate:''},
    {id:id(),date:d(4,5),source:'Flat rent received',category:'Rental',amount:14000,recurring:'Monthly',notes:'',endDate:''},
    {id:id(),date:d(2,10),source:'Tuition (daily wage side-gig)',category:'Business',amount:400,recurring:'Daily',notes:'Weekday classes',endDate:d(1,10)},
    {id:id(),date:d(5,12),source:'Freelance design',category:'Freelance',amount:16500,recurring:'No',notes:'',endDate:''},
    {id:id(),date:d(2,18),source:'Freelance logo project',category:'Freelance',amount:21000,recurring:'No',notes:'',endDate:''}];
  exp.push({id:id(),date:d(6,2),description:'House rent',category:'Rent',amount:22000,mode:'Bank transfer',notes:'',recurring:'Monthly',endDate:'',spentFor:'Family',forWho:'Home'});
  exp.push({id:id(),date:d(6,18),description:'Netflix & Spotify',category:'Subscriptions',amount:899,mode:'Credit card',notes:'',recurring:'Monthly',endDate:'',spentFor:'Self',forWho:''});
  for(let m=0;m<7;m++){
    exp.push({id:id(),date:d(m,3),description:'Home loan EMI',category:'EMI',amount:18420,mode:'Auto-debit',notes:'',recurring:'No',endDate:'',spentFor:'Self',forWho:''});
    exp.push({id:id(),date:d(m,6),description:'Electricity & internet',category:'Utilities',amount:3200+Math.round(Math.random()*900),mode:'UPI',notes:'',recurring:'No',endDate:'',spentFor:'Self',forWho:''});
    ['Big Basket groceries','Swiggy dinner','Weekend brunch','Farmers market'].forEach((n,i)=>exp.push({id:id(),date:d(m,7+i*5),description:n,category:'Food',amount:Math.round(900+Math.random()*2600),mode:'UPI',notes:'',recurring:'No',endDate:'',spentFor:'Self',forWho:''}));
    exp.push({id:id(),date:d(m,9),description:'Metro card + fuel',category:'Transport',amount:Math.round(1800+Math.random()*1200),mode:'UPI',notes:'',recurring:'No',endDate:'',spentFor:'Self',forWho:''});
    exp.push({id:id(),date:d(m,14),description:'Office supplies & ads',category:'Shopping',amount:Math.round(1500+Math.random()*5000),mode:'Credit card',notes:'',recurring:'No',endDate:'',spentFor:'Business',forWho:'Nano Fly shop'});
    if(m%2===1) exp.push({id:id(),date:d(m,21),description:'Doctor + pharmacy',category:'Health',amount:Math.round(1200+Math.random()*2500),mode:'UPI',notes:'',recurring:'No',endDate:'',spentFor:'Self',forWho:''});
    if(m===2) exp.push({id:id(),date:d(m,24),description:'Goa weekend trip',category:'Travel',amount:18500,mode:'Credit card',notes:'',recurring:'No',endDate:'',spentFor:'Family',forWho:'Family trip'});
  }
  const inv=(o)=>({id:id(),invested:0,current:0,notes:'',plan:'One-time',sipAmount:0,sipDay:'',sipEnd:'',remind:'',rate:0,...o});
  return {
    income:inc, expenses:exp,
    investments:[
      inv({name:'Nifty 50 Index Fund — SIP',type:'Mutual Fund',buyDate:d(14,5),plan:'Monthly',sipAmount:10000,sipDay:5,remind:'1',rate:12}),
      inv({name:'Post Office RD',type:'Recurring Deposit',buyDate:d(8,10),plan:'Monthly',sipAmount:5000,sipDay:10,remind:'2',rate:6.7}),
      inv({name:'HDFC Bank',type:'Stocks',invested:85000,current:96800,buyDate:d(9,10)}),
      inv({name:'Sovereign Gold Bond',type:'Gold',invested:60000,current:78200,buyDate:d(20,15)}),
      inv({name:'Fixed Deposit — SBI',type:'Fixed Deposit',invested:150000,current:158900,buyDate:d(8,1)}),
      inv({name:'PPF (yearly deposit)',type:'PPF / EPF',invested:100000,buyDate:d(30,5),plan:'Yearly',sipAmount:50000,sipDay:5,remind:'7',rate:7.1}),
      inv({name:'Bitcoin',type:'Crypto',invested:30000,current:26400,buyDate:d(5,8)})],
    loans:[
      {id:id(),lender:'HDFC Home Loan',type:'Home Loan',principal:1500000,rate:8.5,tenure:240,startDate:d(30,3),paidEmis:30,notes:''},
      {id:id(),lender:'Two-wheeler loan',type:'Vehicle Loan',principal:90000,rate:9.9,tenure:36,startDate:d(14,10),paidEmis:14,notes:''}],
    debts:[
      {id:id(),party:'ICICI Credit Card',type:'Credit Card',direction:'owe',amount:23400,paid:6000,dueDate:NS.iso(new Date(t.getFullYear(),t.getMonth(),t.getDate()+6)),notes:''},
      {id:id(),party:'Rohit (friend)',type:'Lent to someone',direction:'owed',amount:15000,paid:5000,dueDate:NS.iso(new Date(t.getFullYear(),t.getMonth()+1,2)),notes:''},
      {id:id(),party:'Dad — family loan',type:'Borrowed from someone',direction:'owe',amount:50000,paid:20000,dueDate:'',notes:''}],
    goals:[
      {id:id(),name:'Emergency fund (6 months)',target:400000,saved:265000,deadline:NS.iso(new Date(t.getFullYear()+1,2,31)),notes:''},
      {id:id(),name:'Europe trip',target:350000,saved:90000,deadline:NS.iso(new Date(t.getFullYear()+1,8,15)),notes:''},
      {id:id(),name:'New laptop',target:120000,saved:120000,deadline:'',notes:''}],
    settings:{openingBalance:'1500000',autoLock:'1',budgets:JSON.stringify({Food:12000,Transport:4000,Shopping:6000,Utilities:5000})}
  };
}
const DemoBackend={
  db(){ try{ return JSON.parse(localStorage.getItem(DKEY)); }catch(e){ return null; } },
  save(d){ localStorage.setItem(DKEY,JSON.stringify(d)); },
  async findOrCreate(){ let d=this.db(); const created=!d; if(!d){ d=seed(); this.save(d); } state.sheetId='demo'; state.sheetUrl=null; return {created}; },
  async loadAll(){ await new Promise(r=>setTimeout(r,350)); const d=this.db(); const out={}; Object.keys(SCHEMA).forEach(k=>out[k]=k==='settings'?Object.entries(d.settings||{}).map(([key,value])=>({key,value})):(d[k]||[])); return out; },
  async insert(t,i){ const d=this.db(); (d[t]=d[t]||[]).push(i); this.save(d); },
  async insertMany(t,a){ const d=this.db(); d[t]=(d[t]||[]).concat(a); this.save(d); },
  async update(t,i){ const d=this.db(); d[t]=d[t]||[]; const x=d[t].findIndex(r=>r.id===i.id); if(x>-1) d[t][x]=i; this.save(d); },
  async remove(t,i){ const d=this.db(); d[t]=(d[t]||[]).filter(r=>r.id!==i.id); this.save(d); },
  async lockdown(){ return {removed:0,found:[],permissions:[{role:'owner',emailAddress:NS.auth.user.email,type:'user'}]}; },
  async audit(){ return [{role:'owner',emailAddress:NS.auth.user.email,type:'user'}]; }
};
const B = () => NS.demo?DemoBackend:GoogleBackend;

NS.store = {
  tables:TABLES,
  async init(){ const r=await B().findOrCreate(); return r; },
  async load(){
    const all=await B().loadAll();
    TABLES.forEach(k=>state.data[k]=all[k]||[]);
    state.settings={}; (all.settings||[]).forEach(s=>state.settings[s.key]=s.value);
    state.loaded=true;
    if(state.settings.currency){ NS.currency=state.settings.currency; try{localStorage.setItem('ns_currency',NS.currency)}catch(e){} }
  },
  async add(tbl,item){ item.id=item.id||NS.uid(); state.data[tbl].push(item); try{ await B().insert(tbl,item); }catch(e){ state.data[tbl]=state.data[tbl].filter(x=>x!==item); throw e; } return item; },
  async update(tbl,item){ const arr=state.data[tbl]; const i=arr.findIndex(x=>x.id===item.id); const old=arr[i]; if(i>-1) arr[i]=item; item._row=old&&old._row; try{ await B().update(tbl,item); }catch(e){ if(i>-1) arr[i]=old; throw e; } return item; },
  async addMany(tbl,items){ items.forEach(i=>i.id=i.id||NS.uid()); state.data[tbl].push(...items); try{ await B().insertMany(tbl,items); }catch(e){ state.data[tbl]=state.data[tbl].filter(x=>!items.includes(x)); throw e; } return items; },
  async remove(tbl,item){ const arr=state.data[tbl]; const i=arr.findIndex(x=>x.id===item.id); if(i>-1) arr.splice(i,1); try{ await B().remove(tbl,item); }catch(e){ if(i>-1) arr.splice(i,0,item); throw e; } },
  get(k){ return state.data[k]||[]; },
  setting(k,def){ return state.settings[k]!==undefined&&state.settings[k]!==''?state.settings[k]:def; },
  async setSetting(key,value){
    value=String(value); state.settings[key]=value;
    if(NS.demo){ const d=DemoBackend.db(); d.settings[key]=value; DemoBackend.save(d); return; }
    const s=SCHEMA.settings; const all=await g(`${SHEETS}/${state.sheetId}/values/Settings!A:A`);
    const idx=(all.values||[]).findIndex(v=>v[0]===key);
    if(idx>0) await g(`${SHEETS}/${state.sheetId}/values/Settings!A${idx+1}:B${idx+1}?valueInputOption=RAW`,{method:'PUT',body:JSON.stringify({values:[[key,value]]})});
    else await g(`${SHEETS}/${state.sheetId}/values/Settings!A:B:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,{method:'POST',body:JSON.stringify({values:[[key,value]]})});
  },
  lockdown:()=>B().lockdown(), audit:()=>B().audit(),
  exportAll(){ const o={exportedAt:new Date().toISOString(),app:'Nano Wealth'}; TABLES.forEach(k=>o[k]=state.data[k].map(({_row,...r})=>r)); o.settings=state.settings; return JSON.stringify(o,null,2); },
  resetDemo(){ localStorage.removeItem(DKEY); }
};
})();
