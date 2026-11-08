/* Nano Wealth auth — Google Identity Services (token model). Non-sensitive scopes only.
   Demo mode (no client id) uses a local pretend account so you can explore everything. */
(function(){
const NS = window.NS;
const KEY=NS.demo?'ns_session_demo':'ns_session', TKEY='ns_tok';
let tokenClient=null, accessToken=null, expiresAt=0, gisReady=null, pending=null;

NS.auth = {
  user:null,
  isFile: location.protocol==='file:',
  /** Turn Google's terse errors into plain instructions. */
  explain(code,desc){
    const c=String(code||'');
    if(/popup_closed/.test(c)) return 'Sign-in was cancelled.';
    if(/popup_failed|blocked/.test(c)) return 'Your browser blocked the Google sign-in popup. Allow popups for this site (address bar icon) and try again.';
    if(/access_denied/.test(c)) return 'Google denied access. If your OAuth consent screen is in “Testing” mode, add this Google account under Test users (or publish the app) — see the help panel below.';
    if(/invalid_request|origin_mismatch|redirect_uri/.test(c)) return 'Google rejected this web address. Add '+location.origin+' to “Authorized JavaScript origins” of your OAuth client — see the help panel below.';
    if(/idpiframe|immediate_failed|interaction_required/.test(c)) return 'Google needs you to sign in again. Click the button once more.';
    return desc||c||'Sign-in failed. Please try again.';
  },
  helpHTML(){
    const here=location.origin==='null'?'(file — not allowed)':location.origin;
    return `<details class="help" ${this.isFile?'open':''}><summary>${NS.icon('info')} Trouble signing in?</summary><div class="hb">
      <div>Client ID in use: <b>${NS.esc(NS.cfg.GOOGLE_CLIENT_ID||'(none)')}</b></div><div>This page’s address is:</div><div class="codebox"><span id="oriVal">${NS.esc(here)}</span><button type="button" data-copy="${NS.esc(location.origin)}">Copy</button></div>
      <ol><li>The OAuth client must be of type <b>Web application</b> (not Desktop / Android / iOS).</li><li><b>Open it over http(s)</b>, never by double-clicking the file. Locally run <i>start-local.bat</i> (Windows) or <i>start-local.sh</i> (Mac/Linux), then open <b>http://localhost:8765</b>.</li>
      <li>In Google Cloud → <b>Credentials → your OAuth client</b>, add the address above (and <i>http://localhost:8765</i> for local testing) under <b>Authorized JavaScript origins</b>. Changes can take a few minutes.</li>
      <li>If the <b>OAuth consent screen</b> is in <i>Testing</i>, add your Google account under <b>Test users</b> — or click <b>Publish app</b>.</li>
      <li>Enable the <b>Google Drive API</b> and <b>Google Sheets API</b>.</li>
      <li>Allow pop-ups for this site.</li></ol>
      <a class="btn btn-soft btn-sm" style="align-self:flex-start" href="?demo=1">Preview with sample data instead</a></div></details>`;
  },
  /** Call after the gate is on screen: shows the file:// warning, wires copy buttons. */
  idProblem(){ const id=NS.cfg.GOOGLE_CLIENT_ID; if(!id) return ''; if(!/^\d{6,}-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(id)) return 'The client ID in js/config.js doesn’t look like a Google <b>Web</b> client ID (it should look like <i>1234567890-abc123.apps.googleusercontent.com</i>).'; return ''; },
  mountHelp(box,btn){
    const wrap=document.createElement('div'); wrap.style.cssText='display:flex;flex-direction:column;gap:1rem';
    if(this.isFile&&!NS.demo){ wrap.innerHTML=`<div class="alert bad">${NS.icon('alert')}<div><b>This page was opened as a file (file://).</b><br>Google sign-in only works from <b>http://localhost</b> or an <b>https://</b> website. Run <b>start-local.bat</b> (or <i>start-local.sh</i>) in this folder and open <b>http://localhost:8765/app.html</b> — or upload the site to your hosting.</div></div>`; if(btn){ btn.disabled=true; btn.style.opacity=.5; } }
    const prob=this.idProblem(); if(prob&&!NS.demo) wrap.insertAdjacentHTML('afterbegin',`<div class="alert bad">${NS.icon('alert')}<div>${prob}</div></div>`);
    if(!NS.demo) wrap.insertAdjacentHTML('beforeend',this.helpHTML());
    box.appendChild(wrap);
    NS.$$('[data-copy]',wrap).forEach(b=>b.onclick=()=>{ navigator.clipboard&&navigator.clipboard.writeText(b.dataset.copy); b.textContent='Copied ✓'; setTimeout(()=>b.textContent='Copy',1500); });
  },
  loadGIS(){
    if(NS.demo) return Promise.resolve();
    if(gisReady) return gisReady;
    gisReady = new Promise((res,rej)=>{
      if(window.google && google.accounts && google.accounts.oauth2) return res();
      const s=document.createElement('script'); s.src='https://accounts.google.com/gsi/client'; s.async=true;
      s.onload=()=>res(); s.onerror=()=>rej(new Error('Could not load Google sign-in. Check your connection.'));
      document.head.appendChild(s);
    });
    return gisReady;
  },
  /** Re-use a still-valid access token from the last visit so reopening the app needs no sign-in. */
  restore(){
    if(NS.demo) return !!this.saved();
    const s=this.saved(); if(!s) return false;
    try{ const k=JSON.parse(localStorage.getItem(TKEY)||'null'); if(k&&k.t&&k.e>Date.now()+120000){ accessToken=k.t; expiresAt=k.e; this.user=s; return true; } }catch(e){}
    return false;
  },
  /** True when a saved user exists but the token has expired (a click is needed to refresh quietly). */
  needsRefresh(){ return !NS.demo&&!!this.user&&!(accessToken&&Date.now()<expiresAt); },
  saved(){ try{ return JSON.parse(localStorage.getItem(KEY)||'null'); }catch(e){ return null; } },
  _request(scope,prompt,hint){
    return new Promise((resolve,reject)=>{
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: NS.cfg.GOOGLE_CLIENT_ID, scope: scope||NS.cfg.SCOPES, prompt: prompt,
        callback: r=>{ if(r.error) return reject(new Error(NS.auth.explain(r.error,r.error_description))); accessToken=r.access_token; expiresAt=Date.now()+(r.expires_in-60)*1000; try{ localStorage.setItem(TKEY,JSON.stringify({t:accessToken,e:expiresAt})); }catch(e){} resolve(accessToken); },
        error_callback: e=>reject(new Error(NS.auth.explain(e.type||e.message||'')))
      });
      tokenClient.requestAccessToken({prompt, hint: hint||undefined});
    });
  },
  /** Interactive sign-in (must be called from a click). */
  async signIn(opts={}){
    if(NS.demo){
      const u={sub:'demo-user',email:'demo@nanowealth.app',name:'Demo User',picture:'',demo:true};
      this.user=u; localStorage.setItem(KEY,JSON.stringify(u)); return u;
    }
    await this.loadGIS();
    await this._request(opts.scope,'select_account');
    return this._profile();
  },
  /** Quiet re-connect for returning users; may need a click if the browser blocks the popup. */
  async resume(opts={}){
    const s=this.saved(); if(!s) return null;
    if(NS.demo){ this.user=s; return s; }
    await this.loadGIS();
    await this._request(opts.scope,'',s.email);
    return this._profile();
  },
  async _profile(){
    const r=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+accessToken}});
    if(!r.ok) throw new Error('Could not read your Google profile');
    const p=await r.json(); const u={sub:p.sub,email:p.email,name:p.name||p.email,picture:p.picture||''};
    this.user=u; localStorage.setItem(KEY,JSON.stringify(u)); return u;
  },
  /** Always returns a fresh access token (refreshes silently when it is about to expire). */
  async token(){
    if(NS.demo) return 'demo';
    if(accessToken && Date.now()<expiresAt) return accessToken;
    if(pending) return pending;
    pending=this._request(null,'',this.user&&this.user.email).finally(()=>pending=null);
    return pending;
  },
  forceRefresh(){ accessToken=null; return this.token(); },
  async signOut(){
    const s=this.saved();
    try{ if(!NS.demo && accessToken && window.google) google.accounts.oauth2.revoke(accessToken,()=>{}); }catch(e){}
    accessToken=null; this.user=null; localStorage.removeItem(KEY); localStorage.removeItem(TKEY);
    try{ localStorage.removeItem('ns_sheet_'+(s&&s.sub)); }catch(e){}
  }
};
})();
