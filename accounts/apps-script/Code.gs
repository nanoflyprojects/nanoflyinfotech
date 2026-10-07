/***** NanoFly InfoTech Accounts – Google Apps Script backend (API) *****
 * The portal itself is a normal website (index.html, css/, js/, assets/).
 * This script turns your Google Sheet into its database:
 *   Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone
 *   then paste the /exec URL into js/config.js (API_URL).
 * Every request needs a logged-in user (sample admin: admin / Nanofly@123 – change it after first login).
 *************************************************************************/
const TZ = Session.getScriptTimeZone() || 'Asia/Kolkata';
const PREFIX = 'App_';
const SCHEMA = {
  Clients:    ['ID','Name','BillingName','City','Address','Phone','Email','Website','GSTIN','Notes'],
  Organizations: ['ID','Name','Client','BillingName','Contact','Phone','Email','Website','City','GSTIN','Address','Notes'],
  // 'Organization' is appended as the LAST column so existing rows stay where they are
  // 'Investor1' / 'Investor2' (Team member names) are appended as the LAST columns so existing rows stay where they are
  Projects:   ['ID','Date','Client','Project','Type','Budget','HandsOn','Inv1Pct','Status','Phone','Notes','Organization','Investor1','Investor2'],
  // 'OldNo' / 'OldReceiptNo' keep the number a record had before Restructure (appended last, nothing moves)
  Docs:       ['ID','Type','No','Date','Client','Project','Items','Plan','Total','Status','ValidDate','Notes','Organization','OldNo'],
  Payments:   ['ID','Date','Project','Amount','Mode','Notes','InvoiceNo','ReceiptNo','OldReceiptNo'],
  Expenses:   ['ID','Date','Project','Category','PaidTo','Amount','Notes'],
  Ads:        ['ID','StartDate','EndDate','Project','Platform','AdSet','Amount','GST','Total','Result'],
  Recharges:  ['ID','Date','Project','Platform','Amount'],
  Content:    ['ID','Date','Project','Content','DesignedBy','Rate','PaymentDate','Status'],
  // v6: one kind of company expense. 'Kind' is kept only so old rows stay intact (always 'Expense' now).
  //   Project = project it was for (blank = in-house) · FundedBy = Company | Project fund | Investors
  //   FundProject = whose project fund paid (when FundedBy = Project fund) · PaidBy = investor name(s), comma separated (1 = paid by one, 2+ = shared equally)
  CompanyExp: ['ID','Date','Reason','PaidTo','PaidFor','Amount','Kind','FundedBy','Notes','Project','FundProject','PaidBy'],
  // Payouts: 'Member' … 'Plan' appended (v5) – Member = investor name, Payable = amount due for that period, Status = Paid / Partly paid / Pending
  Payouts:    ['ID','Date','Investor','Project','Amount','Notes','Member','FromDate','ToDate','Payable','Status','Plan'],
  // Team payments (v5): PayType = Task-Based (one task) | Weekly (one consolidated payment, tasks optional)
  //   Tasks = work-tracker (Content) IDs, comma separated · FromDate / ToDate = week or payment period
  TeamPay:    ['ID','Date','PayType','Member','Project','Tasks','FromDate','ToDate','Amount','Mode','Status','Reason','ReasonOther','Notes'],
  // Investor payout structure (v5): one row per investor arrangement
  //   Structure = Profit share | Fixed return % | Fixed amount | Manual · Rate = % or ₹ per period
  InvestorPlans: ['ID','Investor','Investment','InvestDate','Structure','Rate','Frequency','StartDate','EndDate','Status','Notes'],
  // v6: IsInvestor = Yes → this member can be chosen as an investor (project shares, payout structures, payouts, expenses)
  Team:       ['ID','Name','Role','Phone','Email','JoinDate','Notes','IsInvestor'],
  Log:        ['Time','User','Action','Sheet','ID','Details']
};
const NUM = ['Budget','HandsOn','Inv1Pct','Amount','GST','Total','Rate','Investment','Payable'];
const LINKED = ['Payments','Expenses','Ads','Recharges','Content','Payouts','Docs','TeamPay'];
const SETTINGS_SHEET = PREFIX + 'Settings';
/* Numbering: NF-Inv-2026-01, NF-Quo-2026-01, NF-Rec-2026-01 – counted per calendar year (Jan–Dec), restarts every January */
const DOC_PREFIX = { Invoice: ['InvPrefix', 'NF-Inv'], Quotation: ['QuoPrefix', 'NF-Quo'], Receipt: ['RecPrefix', 'NF-Rec'] };

function onOpen() {
  SpreadsheetApp.getUi().createMenu('NanoFLY App')
    .addItem('1. Setup app sheets', 'setup')
    .addItem('2. Import existing data (one time)', 'importLegacy')
    .addItem('3. Create client records from projects', 'syncClients')
    .addItem('4. Restructure old records (renumber + tidy, makes a backup first)', 'restructureMenu')
    .addToUi();
}

function setup() {
  const ss = SpreadsheetApp.getActive();
  Object.keys(SCHEMA).forEach(n => {
    const sh = ss.getSheetByName(PREFIX + n) || ss.insertSheet(PREFIX + n);
    sh.getRange(1, 1, 1, SCHEMA[n].length).setValues([SCHEMA[n]])
      .setFontWeight('bold').setBackground('#291B25').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  });
  const st = ss.getSheetByName(SETTINGS_SHEET) || ss.insertSheet(SETTINGS_SHEET);
  st.getRange(1, 1, 1, 2).setValues([['Key', 'Value']])
    .setFontWeight('bold').setBackground('#291B25').setFontColor('#ffffff');
  st.setFrozenRows(1);
  users_();   // creates the sample admin (admin / Nanofly@123) on first run
}

/* ---------- Web API ---------- */
const API_FNS = { login: login, session: session, logout: logout, getData: getData, saveRow: saveRow,
                  deleteRow: deleteRow, markPaid: markPaid, restructure: restructure, saveSettings: saveSettings, issueReceipt: issueReceipt,
                  changePassword: changePassword, listUsers: listUsers, saveUser: saveUser, deleteUser: deleteUser };

function doPost(e) {
  let out;
  try {
    const req = JSON.parse(e.postData.contents || '{}');
    const fn = API_FNS[req.fn];
    if (!fn) throw new Error('Unknown action');
    const res = fn.apply(null, Array.isArray(req.args) ? req.args : []);
    out = { result: res === undefined ? true : res };   // never send {} – the portal treats that as 'no data'
  } catch (err) {
    out = { error: String(err && err.message || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, app: 'NanoFly InfoTech Accounts API' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- Users & login ----------
 * Users live in Script Properties (not in the sheet), passwords are salted + SHA-256 hashed.
 * A sample admin is created automatically the first time:  username  admin   password  Nanofly@123
 * Change it after logging in: 🔑 Change password (top bar)  or  ⚙️ Settings → Users.
 */
const SAMPLE_ADMIN = { username: 'admin', password: 'Nanofly@123' };
const SESSION_SECS = 21600;            // 6 hours
let CURRENT_USER = 'System';

function users_() {
  const p = PropertiesService.getScriptProperties();
  let u = JSON.parse(p.getProperty('USERS') || '{}');
  if (!Object.keys(u).length) {         // first run → sample admin
    u[SAMPLE_ADMIN.username] = newPass_(SAMPLE_ADMIN.password, 'admin', 'Administrator');
    u[SAMPLE_ADMIN.username].mustChange = true;
    p.setProperty('USERS', JSON.stringify(u));
  }
  return u;
}
function saveUsers_(u) { PropertiesService.getScriptProperties().setProperty('USERS', JSON.stringify(u)); }
function hash_(salt, pw) {
  let h = salt + '|' + pw;
  for (let i = 0; i < 200; i++)
    h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + salt, Utilities.Charset.UTF_8));
  return h;
}
function newPass_(pw, role, name) {
  const salt = Utilities.getUuid();
  return { salt: salt, hash: hash_(salt, pw), role: role, name: name || '' };
}
function checkPw_(pw) {
  if (String(pw || '').length < 6) throw new Error('Password must be at least 6 characters.');
}
function cleanUser_(u) {
  u = String(u || '').trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,30}$/.test(u)) throw new Error('Username: 3–30 letters, numbers, dot, dash or underscore.');
  return u;
}

function login(username, password) {
  const c = CacheService.getScriptCache();
  const un = String(username || '').trim().toLowerCase();
  const key = 'fail_' + un, fails = Number(c.get(key) || 0);
  if (fails >= 5) throw new Error('Too many wrong attempts. Try again in 15 minutes.');
  const u = users_()[un];
  if (!u || hash_(u.salt, String(password || '')) !== u.hash) {
    c.put(key, String(fails + 1), 900);
    throw new Error('Wrong username or password.');
  }
  c.remove(key);
  const token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  c.put('sess_' + token, JSON.stringify({ u: un, role: u.role }), SESSION_SECS);
  CURRENT_USER = un; log_('Login', 'Users', '', un);
  return { token: token, user: un, name: u.name || un, role: u.role, member: u.member || '', mustChange: !!u.mustChange, schema: SCHEMA };
}
function session(token) {
  const s = sess_(token), u = users_()[s.u];
  return { user: s.u, name: u.name || s.u, role: s.role, member: u.member || '', mustChange: !!u.mustChange, schema: SCHEMA };
}
function logout(token) { CacheService.getScriptCache().remove('sess_' + token); return true; }

function sess_(token) {
  const c = CacheService.getScriptCache(), raw = token && c.get('sess_' + token);
  if (!raw) throw new Error('SESSION: Your session has ended – please log in again.');
  const s = JSON.parse(raw), u = users_()[s.u];
  if (!u) { c.remove('sess_' + token); throw new Error('SESSION: This user no longer exists.'); }
  s.role = u.role;                       // role changes apply immediately
  c.put('sess_' + token, JSON.stringify(s), SESSION_SECS);   // sliding expiry
  CURRENT_USER = s.u;
  return s;
}
function auth_(token) { return sess_(token).role; }
function requireAdmin_(token) { if (auth_(token) !== 'admin') throw new Error('View-only access'); }

function changePassword(token, oldPw, newPw) {
  const s = sess_(token), all = users_(), u = all[s.u];
  if (hash_(u.salt, String(oldPw || '')) !== u.hash) throw new Error('Current password is wrong.');
  checkPw_(newPw);
  all[s.u] = Object.assign(newPass_(newPw, u.role, u.name), u.member ? { member: u.member } : {});
  saveUsers_(all); log_('Password changed', 'Users', '', s.u);
  return true;
}
function listUsers(token) {
  requireAdmin_(token);
  const u = users_();
  return Object.keys(u).sort().map(k => ({ username: k, name: u[k].name || '', role: u[k].role, member: u[k].member || '', mustChange: !!u[k].mustChange }));
}
/* Add a user, or edit name / role / username, or reset password (leave password blank to keep it) */
function saveUser(token, obj) {
  requireAdmin_(token);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const all = users_(), me = CURRENT_USER;
    const un = cleanUser_(obj.username), old = obj.original ? String(obj.original).toLowerCase() : '';
    const role = obj.role === 'admin' ? 'admin' : obj.role === 'team' ? 'team' : 'viewer';
    const member = role === 'team' ? String(obj.member || '').trim() : '';
    if (role === 'team') {
      if (!member) throw new Error('Choose which team member this login belongs to.');
      if (!read_('Team').some(t => String(t.Name) === member)) throw new Error('Team member "' + member + '" does not exist. Add them under Team first.');
    }
    if (old && !all[old]) throw new Error('User not found');
    if (un !== old && all[un]) throw new Error('Username "' + un + '" is already taken.');
    let rec;
    if (old) {
      rec = all[old];
      if (rec.role === 'admin' && role !== 'admin' && Object.keys(all).filter(k => all[k].role === 'admin').length < 2)
        throw new Error('There must be at least one admin.');
      if (obj.password) { checkPw_(obj.password); rec = Object.assign(newPass_(obj.password, role, rec.name), { mustChange: old !== me }); }
      if (un !== old) delete all[old];
    } else {
      checkPw_(obj.password);
      rec = Object.assign(newPass_(obj.password, role), { mustChange: true });
    }
    rec.role = role; rec.name = String(obj.name || '').trim();
    if (member) rec.member = member; else delete rec.member;
    all[un] = rec; saveUsers_(all);
    log_(old ? 'Edit' : 'Add', 'Users', '', un + ' (' + role + ')' + (obj.password ? ' – password set' : ''));
    return true;
  } finally { lock.releaseLock(); }
}
function deleteUser(token, username) {
  requireAdmin_(token);
  const all = users_(), un = String(username).toLowerCase();
  if (!all[un]) throw new Error('User not found');
  if (un === CURRENT_USER) throw new Error('You cannot delete yourself.');
  if (all[un].role === 'admin' && Object.keys(all).filter(k => all[k].role === 'admin').length < 2)
    throw new Error('There must be at least one admin.');
  delete all[un]; saveUsers_(all); log_('Delete', 'Users', '', un);
  return true;
}
/* Emergency: run from the Apps Script editor to reset the sample admin (admin / Nanofly@123) */
function resetAdmin() {
  const all = users_();
  all[SAMPLE_ADMIN.username] = Object.assign(newPass_(SAMPLE_ADMIN.password, 'admin', 'Administrator'), { mustChange: true });
  saveUsers_(all);
}

/* Adds any new sheets / columns once after you paste a newer Code.gs (never touches existing data) */
const SCHEMA_VERSION = '6';   // 6 = one company-expense type + investor flag on Team · 5 = team payments, investor payout structure · 4 = new numbering, company assets, OldNo columns · 3 = Team · 2 = Organizations
function migrate_() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty('SCHEMA_V') === SCHEMA_VERSION) return;
  setup();
  upgradeSettings_();
  p.setProperty('SCHEMA_V', SCHEMA_VERSION);
}
/* v4: move saved settings that still hold the OLD defaults onto the new sample formats (custom values are left alone) */
function upgradeSettings_() {
  const st = settings_(), ch = {};
  const swap = (k, olds, nw) => { if (k in st && olds.indexOf(String(st[k]).trim()) > -1) ch[k] = nw; };
  swap('InvPrefix', ['NF', ''], 'NF-Inv'); swap('QuoPrefix', ['NFQ', ''], 'NF-Quo'); swap('RecPrefix', ['NFR', ''], 'NF-Rec');
  swap('Email', ['works@nanoflyinfotech.com'], 'nanofly.works@gmail.com');
  swap('Phone', ['+91 94877 72786'], '+91 9487772786');
  swap('ReceiptThank', ['Thank you for your payment!'], 'Thank you for your purchase!');
  swap('ShowMDName', ['Yes'], 'No');
  if (!Object.keys(ch).length && !('ShowAddress' in st)) return;
  const merged = Object.assign(st, ch); delete merged.ShowAddress;     // the company address is no longer printed
  const s = SpreadsheetApp.getActive().getSheetByName(SETTINGS_SHEET);
  const rows = Object.keys(merged).map(k => [k, merged[k]]);
  if (s.getLastRow() > 1) s.getRange(2, 1, s.getLastRow() - 1, 2).clearContent();
  if (rows.length) s.getRange(2, 1, rows.length, 2).setValues(rows);
  log_('Upgrade', 'Settings', '', Object.keys(ch).join(', '));
}

function getData(pin) {
  const s = sess_(pin), role = s.role, out = {};
  migrate_();
  if (role === 'team') return teamData_(users_()[s.u].member);   // team members NEVER receive the full dataset
  Object.keys(SCHEMA).forEach(n => { if (n !== 'Log' || role === 'admin') out[n] = read_(n); });
  if (out.Log) out.Log = out.Log.slice(-300).reverse();
  out.Settings = settings_();
  return out;
}


/* ---------- Team members: each one sees ONLY the projects they hold a share in ----------
 * Filtering happens here on the server, so a team login can never download other projects,
 * clients, invoices, bank details or the other investor's payouts.                          */
function teamData_(member) {
  const me = String(member || '').trim();
  const out = { Settings: {}, Clients: [], Organizations: [], Docs: [], Ads: [], Recharges: [], Content: [], CompanyExp: [], TeamPay: [], Log: [] };
  const mine = read_('Team').filter(t => String(t.Name) === me);
  out.Team = mine;
  const P = me ? read_('Projects').filter(p => String(p.Investor1) === me || String(p.Investor2) === me) : [];
  const by = {};
  P.forEach(p => { by[p.Project] = p; });
  out.Projects = P.map(p => ({
    ID: p.ID, Date: p.Date, Client: p.Client, Project: p.Project, Type: p.Type, Budget: p.Budget, HandsOn: p.HandsOn,
    Inv1Pct: p.Inv1Pct, Status: p.Status, Organization: p.Organization,
    Investor1: String(p.Investor1) === me ? me : '', Investor2: String(p.Investor2) === me ? me : '',   // co-investor names stay private
    Phone: '', Notes: ''
  }));
  out.Payments = read_('Payments').filter(x => by[x.Project])
    .map(x => ({ ID: x.ID, Date: x.Date, Project: x.Project, Amount: x.Amount, Mode: x.Mode }));
  out.Expenses = read_('Expenses').filter(x => by[x.Project])
    .map(x => ({ ID: x.ID, Date: x.Date, Project: x.Project, Category: x.Category, PaidTo: x.PaidTo, Amount: x.Amount }))
    // team payments count as project costs, so the member's profit figures match the admin's
    .concat(teamAlloc_().filter(x => by[x.Project]).map(x => ({ ID: x.ID, Date: x.Date, Project: x.Project, Category: 'Team', PaidTo: x.PaidTo, Amount: x.Amount })));
  out.Payouts = read_('Payouts').filter(x => {
    if (String(x.Member || '').trim()) return String(x.Member).trim() === me;
    const p = by[x.Project]; if (!p) return false;
    return (x.Investor === 'Investor 1' && String(p.Investor1) === me) || (x.Investor === 'Investor 2' && String(p.Investor2) === me);
  }).map(x => ({ ID: x.ID, Date: x.Date, Investor: x.Investor, Project: by[x.Project] ? x.Project : '', Amount: x.Amount, Notes: x.Notes,
                 Member: me, FromDate: x.FromDate, ToDate: x.ToDate, Payable: x.Payable, Status: x.Status, Plan: x.Plan }));
  out.InvestorPlans = read_('InvestorPlans').filter(x => String(x.Investor) === me);
  out.CompanyExp = cexpFor_(me, by);
  const st = settings_(), keep = ['CompanyName', 'Tagline', 'Phone', 'Phone2', 'Email', 'Website', 'MDName'];
  keep.forEach(k => { if (st[k]) out.Settings[k] = st[k]; });
  return out;
}

/* Company expenses an investor may see: ones they covered, and ones charged to a project they hold.
   Co-investor names never leave the server: shared rows only say how many people shared (Sharers) and name the member himself. */
function cexpFor_(me, by) {
  return read_('CompanyExp').map(e => {
    const f = String(e.FundedBy || '').trim(), fund = /project fund/i.test(f);
    const company = /^company/i.test(f) || (!f && !/^asset/i.test(String(e.Kind || '')));
    const who = String(e.PaidBy || '').split(',').map(x => x.trim()).filter(Boolean);
    const names = who.length ? who : (f && !fund && !company && !/^investors?\b/i.test(f) ? [f] : []);
    const mine = !!me && names.indexOf(me) > -1, charge = fund ? (e.FundProject || e.Project) : e.Project;
    if (!(mine || (charge && by[charge]))) return null;
    return { ID: e.ID, Date: e.Date, Reason: e.Reason, PaidTo: e.PaidTo, PaidFor: e.PaidFor, Amount: e.Amount, Kind: 'Expense',
      FundedBy: fund ? 'Project fund' : company ? 'Company' : f ? 'Investors' : '', PaidBy: mine ? me : '', Sharers: names.length,
      Project: by[e.Project] ? e.Project : '', FundProject: by[e.FundProject] ? e.FundProject : '', Notes: '' };
  }).filter(Boolean);
}

/* ---------- Settings (company, bank, document text) ---------- */
function settings_() {
  const s = SpreadsheetApp.getActive().getSheetByName(SETTINGS_SHEET), o = {};
  if (!s || s.getLastRow() < 2) return o;
  s.getRange(2, 1, s.getLastRow() - 1, 2).getValues().forEach(r => { if (r[0] !== '') o[String(r[0])] = String(r[1]); });
  return o;
}
function saveSettings(pin, obj) {
  requireAdmin_(pin);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const ss = SpreadsheetApp.getActive();
    const s = ss.getSheetByName(SETTINGS_SHEET) || (setup(), ss.getSheetByName(SETTINGS_SHEET));
    const merged = Object.assign(settings_(), obj);
    const rows = Object.keys(merged).map(k => {
      const v = String(merged[k] == null ? '' : merged[k]);
      if (v.length > 49000) throw new Error('"' + k + '" is too large (use a smaller image).');
      return [k, /^[=+@]/.test(v) ? "'" + v : v];
    });
    if (s.getLastRow() > 1) s.getRange(2, 1, s.getLastRow() - 1, 2).clearContent();
    if (rows.length) s.getRange(2, 1, rows.length, 2).setValues(rows);
    log_('Edit', 'Settings', '', Object.keys(obj).join(', ').slice(0, 300));
    return true;
  } finally { lock.releaseLock(); }
}

/* ---------- Document numbering: PREFIX-YYYY-NN (e.g. NF-2026-08) ---------- */
function nextNo_(type, date, values, col) {
  const def = DOC_PREFIX[type], st = settings_();
  const pre = (st[def[0]] || def[1]).trim();
  const y = String(date || '').slice(0, 4) || Utilities.formatDate(new Date(), TZ, 'yyyy');
  const re = new RegExp('^' + pre.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-' + y + '-(\\d+)$');
  let max = 0;
  values.forEach(r => { const m = String(r[col]).match(re); if (m) max = Math.max(max, +m[1]); });
  return pre + '-' + y + '-' + String(max + 1).padStart(2, '0');
}

/* Give a payment a receipt number (once) and return it */
function issueReceipt(pin, id) {
  requireAdmin_(pin);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sh_('Payments'), h = SCHEMA.Payments, r = findRow_(sh, id);
    if (!r) throw new Error('Payment not found');
    const ci = h.indexOf('ReceiptNo'), cur = String(sh.getRange(r, ci + 1).getValue());
    if (cur) return cur;
    const all = sh.getDataRange().getValues().slice(1);
    const d = sh.getRange(r, h.indexOf('Date') + 1).getValue();
    const no = nextNo_('Receipt', d instanceof Date ? Utilities.formatDate(d, TZ, 'yyyy-MM-dd') : String(d), all, ci);
    sh.getRange(r, ci + 1).setValue(no);
    log_('Receipt', 'Payments', id, no);
    return no;
  } finally { lock.releaseLock(); }
}

/* ---------- CRUD ---------- */
function saveRow(pin, n, obj) {
  requireAdmin_(pin);
  if (!SCHEMA[n] || n === 'Log') throw new Error('Invalid sheet');
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sh_(n), h = SCHEMA[n], isNew = !obj.ID;
    if (isNew) obj.ID = Utilities.getUuid().slice(0, 8);
    if (n === 'Docs') {
      if (!DOC_PREFIX[obj.Type] || obj.Type === 'Receipt') throw new Error('Invalid document type');
      const all = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, h.length).getValues() : [];
      const ci = h.indexOf('No');
      obj.No = String(obj.No || '').trim();
      if (!obj.No) obj.No = nextNo_(obj.Type, obj.Date, all, ci);
      if (all.some(r => String(r[ci]) === obj.No && String(r[0]) !== String(obj.ID)))
        throw new Error('Number ' + obj.No + ' is already used');
    }
    if (n === 'Clients') {
      obj.Name = String(obj.Name || '').trim();
      if (!obj.Name) throw new Error('Client name is required');
    }
    if (n === 'Organizations') {
      obj.Name = String(obj.Name || '').trim();
      if (!obj.Name) throw new Error('Organization name is required');
      const names = read_('Organizations');
      if (names.some(o => String(o.Name).toLowerCase() === obj.Name.toLowerCase() && String(o.ID) !== String(obj.ID)))
        throw new Error('An organization called "' + obj.Name + '" already exists.');
    }
    if (n === 'Team') {
      obj.Name = String(obj.Name || '').trim();
      if (!obj.Name) throw new Error('Team member name is required');
      if (read_('Team').some(t => String(t.Name).toLowerCase() === obj.Name.toLowerCase() && String(t.ID) !== String(obj.ID)))
        throw new Error('A team member called "' + obj.Name + '" already exists.');
    }
    if (n === 'Projects' && obj.Investor1 && obj.Investor1 === obj.Investor2)
      throw new Error('Investor 1 and Investor 2 cannot be the same person.');
    if (n === 'TeamPay') checkTeamPay_(obj);
    if (n === 'InvestorPlans') {
      obj.Investor = String(obj.Investor || '').trim();
      if (!obj.Investor) throw new Error('Choose the investor.');
      if (!obj.Structure) throw new Error('Choose the payout structure.');
    }
    if (n === 'Payouts') {
      if (!obj.Status) obj.Status = 'Paid';
      if (!String(obj.Member || '').trim() && !obj.Investor) throw new Error('Choose the investor.');
    }
    let oldTasks = '';
    const row = h.map(k => clean_(k, obj[k]));
    if (isNew) sh.appendRow(row);
    else {
      const r = findRow_(sh, obj.ID);
      if (!r) throw new Error('Record not found');
      if (n === 'Projects') {
        const old = String(sh.getRange(r, h.indexOf('Project') + 1).getValue());
        if (old && old !== String(obj.Project).trim()) renameProject_(old, String(obj.Project).trim());
      }
      if (n === 'Clients') {
        const old = String(sh.getRange(r, h.indexOf('Name') + 1).getValue());
        if (old && old !== obj.Name) renameIn_(['Projects', 'Docs', 'Organizations'], 'Client', old, obj.Name);
      }
      if (n === 'Organizations') {
        const old = String(sh.getRange(r, h.indexOf('Name') + 1).getValue());
        if (old && old !== obj.Name) renameIn_(['Projects', 'Docs'], 'Organization', old, obj.Name);
      }
      if (n === 'Team') {
        const old = String(sh.getRange(r, h.indexOf('Name') + 1).getValue());
        if (old && old !== obj.Name) {
          renameIn_(['Projects'], 'Investor1', old, obj.Name);
          renameIn_(['Projects'], 'Investor2', old, obj.Name);
          renameIn_(['Payouts', 'TeamPay'], 'Member', old, obj.Name);
          renameIn_(['InvestorPlans'], 'Investor', old, obj.Name);
          renamePaidBy_(old, obj.Name);
          const all = users_(); let ch = false;
          Object.keys(all).forEach(k => { if (all[k].member === old) { all[k].member = obj.Name; ch = true; } });
          if (ch) saveUsers_(all);
        }
      }
      if (n === 'TeamPay') oldTasks = String(sh.getRange(r, h.indexOf('Tasks') + 1).getValue());
      if (n === 'Docs' && obj.Type === 'Invoice') {
        const old = String(sh.getRange(r, h.indexOf('No') + 1).getValue());
        if (old && old !== obj.No) renameIn_(['Payments'], 'InvoiceNo', old, obj.No);
      }
      sh.getRange(r, 1, 1, h.length).setValues([row]);
    }
    if (n === 'TeamPay') syncTaskPay_(splitIds_(oldTasks).concat(splitIds_(obj.Tasks)));
    log_(isNew ? 'Add' : 'Edit', n, obj.ID, JSON.stringify(obj).slice(0, 300));
    return obj.ID;
  } finally { lock.releaseLock(); }
}

function deleteRow(pin, n, id) {
  requireAdmin_(pin);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sh_(n), r = findRow_(sh, id);
    if (!r) throw new Error('Record not found');
    if (n === 'Team') {
      const nm = String(sh.getRange(r, SCHEMA.Team.indexOf('Name') + 1).getValue());
      const used = read_('Projects').filter(p => String(p.Investor1) === nm || String(p.Investor2) === nm).length;
      if (used) throw new Error(nm + ' is set as an investor on ' + used + ' project(s). Change those projects first.');
      const us = users_(), k = Object.keys(us).filter(u => us[u].member === nm);
      if (k.length) throw new Error(nm + ' still has a login (' + k.join(', ') + '). Remove the login under Settings first.');
      if (read_('InvestorPlans').some(x => String(x.Investor) === nm)) throw new Error(nm + ' has an investor payout structure. Remove it under Team → Investor payouts first.');
      if (read_('CompanyExp').some(x => String(x.PaidBy).split(',').map(t => t.trim()).indexOf(nm) > -1 || String(x.FundedBy) === nm)) throw new Error(nm + ' is recorded as having covered a company expense. Edit that expense first.');
    }
    if (n === 'InvestorPlans') {
      const used = read_('Payouts').filter(x => String(x.Plan) === String(id)).length;
      if (used) throw new Error(used + ' payout(s) are recorded under this structure. Delete or move those payouts first.');
    }
    const tasks = n === 'TeamPay' ? String(sh.getRange(r, SCHEMA.TeamPay.indexOf('Tasks') + 1).getValue()) : '';
    const details = JSON.stringify(sh.getRange(r, 1, 1, SCHEMA[n].length).getValues()[0]).slice(0, 300);
    sh.deleteRow(r);
    if (tasks) syncTaskPay_(splitIds_(tasks));
    log_('Delete', n, id, details);
    return true;
  } finally { lock.releaseLock(); }
}

function markPaid(pin, ids, date) {
  requireAdmin_(pin);
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const sh = sh_('Content'), h = SCHEMA.Content;
    const rg = sh.getRange(1, 1, sh.getLastRow(), h.length), v = rg.getValues();
    const si = h.indexOf('Status'), pi = h.indexOf('PaymentDate');
    let count = 0;
    for (let r = 1; r < v.length; r++) {
      if (ids.indexOf(String(v[r][0])) > -1) { v[r][si] = 'Paid'; v[r][pi] = new Date(date + 'T00:00:00'); count++; }
    }
    rg.setValues(v);
    log_('Mark paid', 'Content', '', count + ' items');
    return count;
  } finally { lock.releaseLock(); }
}

/* ---------- Team payments ----------
 * Task-Based: one payment for one work-tracker task.  Weekly: one consolidated payment for a member's week
 * (ticking the tasks it covers is optional). Linked tasks are marked Paid / Pending in App_Content automatically. */
const PAY_TYPES = ['Task-Based', 'Weekly'];
function splitIds_(v) { return String(v || '').split(',').map(x => x.trim()).filter(Boolean); }
function checkTeamPay_(o) {
  if (PAY_TYPES.indexOf(o.PayType) < 0) throw new Error('Choose the payment type (Task-Based or Weekly).');
  o.Member = String(o.Member || '').trim();
  if (!o.Member) throw new Error('Choose the team member.');
  if (!(Number(o.Amount) > 0)) throw new Error('Enter the amount.');
  if (!o.Status) o.Status = 'Paid';
  if (!o.Reason) throw new Error('Choose the reason for the payment.');
  if (o.Reason === 'Other' && !String(o.ReasonOther || '').trim()) throw new Error('Type the reason for this payment.');
  if (o.Reason !== 'Other') o.ReasonOther = '';
  const t = splitIds_(o.Tasks);
  if (o.PayType === 'Task-Based' && t.length !== 1) throw new Error('A task-based payment must be linked to one task.');
  o.Tasks = t.join(',');
}
/* Mark each affected task Paid (with the payment date) or back to Pending, from the team payments that link it */
function syncTaskPay_(ids) {
  ids = ids.filter((x, i, a) => x && a.indexOf(x) === i);
  if (!ids.length) return;
  const pays = read_('TeamPay'), sh = sh_('Content'), h = SCHEMA.Content, last = sh.getLastRow();
  if (last < 2) return;
  const rg = sh.getRange(2, 1, last - 1, h.length), v = rg.getValues();
  const si = h.indexOf('Status'), pi = h.indexOf('PaymentDate'), ri = h.indexOf('Rate');
  v.forEach(r => {
    const id = String(r[0]);
    if (ids.indexOf(id) < 0) return;
    const link = pays.filter(p => splitIds_(p.Tasks).indexOf(id) > -1);
    const paid = link.filter(p => p.Status !== 'Pending').sort((a, b) => String(b.Date).localeCompare(String(a.Date)))[0];
    if (paid) {
      r[si] = 'Paid'; r[pi] = paid.Date ? new Date(paid.Date + 'T00:00:00') : '';
      if (paid.PayType === 'Task-Based') r[ri] = Number(paid.Amount) || r[ri];
    } else { r[si] = 'Pending'; r[pi] = ''; }
  });
  rg.setValues(v);
}
/* Paid team payments as project costs: a payment with a project goes to that project; otherwise it is
   split equally over the projects of the tasks it covers. Payments with neither stay company-level. */
function teamAlloc_() {
  const C = {}, out = [];
  read_('Content').forEach(c => { C[String(c.ID)] = c; });
  read_('TeamPay').forEach(p => {
    const amt = Number(p.Amount) || 0;
    if (!amt || p.Status === 'Pending') return;
    if (String(p.Project || '').trim()) { out.push({ ID: 'tp-' + p.ID, Date: p.Date, Project: p.Project, PaidTo: p.Member, Amount: amt }); return; }
    const ts = splitIds_(p.Tasks).map(id => C[id]).filter(c => c && String(c.Project || '').trim());
    if (!ts.length) return;
    const by = {};
    ts.forEach(c => { by[c.Project] = (by[c.Project] || 0) + amt / ts.length; });
    Object.keys(by).forEach(k => out.push({ ID: 'tp-' + p.ID + '-' + k, Date: p.Date, Project: k, PaidTo: p.Member, Amount: Math.round(by[k] * 100) / 100 }));
  });
  return out;
}

/* ---------- Helpers ---------- */
function sh_(n) {
  const s = SpreadsheetApp.getActive().getSheetByName(PREFIX + n);
  if (!s) throw new Error('Sheet ' + PREFIX + n + ' missing – run Setup first');
  return s;
}
function read_(n) {
  const v = sh_(n).getDataRange().getValues(), h = v.shift();
  return v.filter(r => r[0] !== '').map(r => {
    const o = {};
    h.forEach((k, i) => {
      let x = r[i];
      if (x instanceof Date) x = Utilities.formatDate(x, TZ, k === 'Time' ? 'yyyy-MM-dd HH:mm' : 'yyyy-MM-dd');
      o[k] = x;
    });
    return o;
  });
}
function clean_(k, v) {
  if (v === undefined || v === null || v === '') return '';
  if (/Date$/.test(k)) return new Date(v + 'T00:00:00');
  if (NUM.indexOf(k) > -1) return Number(v);
  const s = String(v).trim();
  if (k === 'Tasks') return "'" + s;        // keep task IDs as text (an ID like 1234e567 would otherwise turn into a number)
  return /^[=+@]/.test(s) ? "'" + s : s;   // block formula injection
}
function findRow_(sh, id) {
  if (sh.getLastRow() < 2) return 0;
  const ids = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues();
  const i = ids.findIndex(r => String(r[0]) === String(id));
  return i < 0 ? 0 : i + 2;
}
function renameProject_(oldName, newName) { renameIn_(LINKED.concat(['CompanyExp']), 'Project', oldName, newName); renameIn_(['CompanyExp'], 'FundProject', oldName, newName); }
function renameIn_(sheets, col, oldName, newName) {
  sheets.forEach(n => {
    const s = sh_(n), last = s.getLastRow();
    if (last < 2) return;
    const rg = s.getRange(2, SCHEMA[n].indexOf(col) + 1, last - 1, 1);
    rg.setValues(rg.getValues().map(x => [String(x[0]) === oldName ? newName : x[0]]));
  });
}
/* expenses covered by investors keep the investor names in one cell ("A, B") – rename inside that list */
function renamePaidBy_(oldName, newName) {
  const s = sh_('CompanyExp'), last = s.getLastRow();
  if (last < 2) return;
  const swap = v => { const parts = String(v).split(',').map(t => t.trim()); return parts.indexOf(oldName) > -1 ? parts.map(t => t === oldName ? newName : t).join(', ') : v; };
  [SCHEMA.CompanyExp.indexOf('PaidBy') + 1, SCHEMA.CompanyExp.indexOf('FundedBy') + 1].forEach(col => {
    const rg = s.getRange(2, col, last - 1, 1);
    rg.setValues(rg.getValues().map(x => [swap(x[0])]));
  });
}
function log_(action, n, id, details) {
  const s = SpreadsheetApp.getActive().getSheetByName(PREFIX + 'Log');
  if (s) s.appendRow([new Date(), CURRENT_USER, action, n, id, details]);
}
function toDate_(v) {
  if (v instanceof Date) return v;
  const n = Number(v);
  if (n > 20000) return new Date(Math.round((n - 25569) * 864e5)); // Excel serial
  return v ? new Date(v) : '';
}

/* Add a Clients row for every client name used in Projects that has no record yet */
function syncClients() {
  setup();
  const have = new Set(read_('Clients').map(c => c.Name));
  const add = [...new Set(read_('Projects').map(p => String(p.Client).trim()))]
    .filter(n => n && !have.has(n))
    .map(n => [Utilities.getUuid().slice(0, 8), n, n, '', '', '', '', '', '', '']);
  if (add.length) sh_('Clients').getRange(sh_('Clients').getLastRow() + 1, 1, add.length, SCHEMA.Clients.length).setValues(add);
  SpreadsheetApp.getActive().toast(add.length + ' client record(s) added.');
}

/* ---------- One-time import from your existing sheets ---------- */
function importLegacy() {
  setup();
  if (sh_('Projects').getLastRow() > 1) throw new Error('App_Projects already has data – import skipped.');
  const ss = SpreadsheetApp.getActive();
  const get = name => { const s = ss.getSheetByName(name); return s ? s.getDataRange().getValues() : []; };
  const id = () => Utilities.getUuid().slice(0, 8);
  const num = v => Number(v) || 0;
  const str = v => String(v === null || v === undefined ? '' : v).trim();
  const put = (n, rows) => {
    if (!rows.length) return;
    rows = rows.map(r => r.concat(new Array(Math.max(0, SCHEMA[n].length - r.length)).fill('')));   // pad to the current columns
    const s = sh_(n);
    s.getRange(s.getLastRow() + 1, 1, rows.length, SCHEMA[n].length).setValues(rows);
  };

  // Projects, client payments, investor payouts
  const acc = get('Nanofly Accounts'), H = acc[0].map(str), c = k => H.indexOf(k);
  const projects = [], payments = [], payouts = [], pDate = {}, byClient = {};
  acc.slice(1).forEach(r => {
    const name = str(r[c('Project')]);
    if (!name || !num(r[0])) return;
    const d = toDate_(r[c('Duration')]), client = str(r[c('Client')]);
    const profit = num(r[c('Profit')]), i1 = num(r[c('Investor 1 - 75%')]);
    const pct = profit ? Math.round(i1 / profit * 100) : (client === 'SIT' ? 75 : 100);
    projects.push([id(), d, client, name, '', num(r[c('Project Budget')]), num(r[c('Hands-on')]), pct,
      num(r[c('Balance')]) > 0 ? 'Active' : 'Completed', '', '', '', '', '']);
    if (num(r[c('Received')])) payments.push([id(), d, name, num(r[c('Received')]), 'Imported', 'Opening balance', '', '']);
    [['Investor 1', 'Received Share Investor -1'], ['Investor 2', 'Received Share Investor -2']].forEach(([inv, col]) => {
      const a = num(r[c(col)]);
      if (a) payouts.push([id(), d, inv, name, a, 'Imported']);
    });
    pDate[name] = d;
    (byClient[client] = byClient[client] || []).push({ name: name, d: d });
  });

  // Spent Details (wide) -> Expenses (one row per category/person)
  const sp = get('Spent Details'), SH = sp.length ? sp[0].map(str) : [];
  const cat = { 'Meta ADs': 'Meta Ads', 'Google ADs': 'Google Ads', 'Other Expenses': 'Other', 'SEO & Maintenance': 'SEO & Maintenance' };
  const skip = ['S No', 'Client', 'Project', 'Total', ''];
  const expenses = [];
  sp.slice(1).forEach(r => {
    const name = str(r[2]);
    if (!pDate[name]) return;
    SH.forEach((h, i) => {
      if (skip.indexOf(h) > -1) return;
      const a = num(r[i]);
      if (a) expenses.push([id(), pDate[name], name, cat[h] || 'Team', cat[h] ? '' : h, a, 'Imported']);
    });
  });

  // Ad campaigns
  const ads = [];
  get('ADs Report').forEach(r => {
    const name = str(r[3]), amt = num(r[10]);
    if (!pDate[name] || !amt) return;
    ads.push([id(), toDate_(r[0]), r[1] ? toDate_(r[1]) : '', name, str(r[5]), str(r[6]), amt,
      Math.round(num(r[11]) * 100) / 100, num(r[12]) || Math.round(amt * 1.18), str(r[13]) || 'Completed']);
  });

  // Recharges
  const rech = [];
  get('ADs Recharge').slice(1).forEach(r => {
    if (str(r[2]) && num(r[4])) rech.push([id(), toDate_(r[0]), str(r[2]), str(r[3]), num(r[4])]);
  });

  // Content / designer work (assign to latest project of that client started on or before the date)
  const projFor = (client, d) => {
    const l = (byClient[client] || []).filter(p => p.d <= d).sort((a, b) => b.d - a.d);
    return l.length ? l[0].name : client;
  };
  const paid = s => /paid/i.test(str(s)) ? 'Paid' : 'Pending';
  const content = [];
  get('SIT Payment - 2026').slice(1).forEach(r => {
    if (!str(r[3])) return;
    const d = toDate_(r[1]);
    content.push([id(), d, projFor('SIT', d), str(r[3]), str(r[4]), '', r[2] ? toDate_(r[2]) : '', paid(r[5])]);
  });
  get('Lajiba Payment').slice(1).forEach(r => {
    if (!str(r[2])) return;
    const d = toDate_(r[1]);
    content.push([id(), d, projFor('Dr Lajiba', d), str(r[2]), str(r[5]), '', '', paid(r[6])]);
  });
  get('Works Payment').slice(1).forEach(r => {
    if (!str(r[5])) return;
    content.push([id(), toDate_(r[1]), str(r[4]), str(r[5]), str(r[6]), '', r[2] ? toDate_(r[2]) : '', paid(r[7])]);
  });

  // Company expenses
  const cexp = [];
  get('Company Expenses').slice(1).forEach(r => {
    if (str(r[2]) && num(r[5])) cexp.push([id(), toDate_(r[1]), str(r[2]), str(r[3]), str(r[4]), num(r[5])]);
  });

  const clients = Object.keys(byClient).filter(Boolean).map(n => [id(), n, n, '', '', '', '', '', '', '']);
  if (sh_('Clients').getLastRow() < 2) put('Clients', clients);
  put('Projects', projects); put('Payments', payments); put('Payouts', payouts);
  put('Expenses', expenses); put('Ads', ads); put('Recharges', rech);
  put('Content', content); put('CompanyExp', cexp);
  log_('Import', 'All', '', projects.length + ' projects, ' + expenses.length + ' expenses, ' + content.length + ' content items');
  SpreadsheetApp.getActive().toast('Import complete: ' + projects.length + ' projects imported.');
}

/* ---------- Restructure old records so they follow the new format ----------
 * 1. Makes a backup copy of every sheet it touches ("Backup yyyy-MM-dd HH.mm – App_Docs" …).
 * 2. Renumbers invoices / quotations / receipts by date, per calendar year:
 *      NF-Inv-2026-01, NF-Quo-2026-01, NF-Rec-2026-01 …   (the previous number is kept in OldNo / OldReceiptNo)
 *    Payments linked to an invoice are moved to the invoice's new number.
 * 3. Ad platforms → Google / Meta (Instagram, Facebook → Meta · YouTube → Google).
 * 4. Fills blanks: company expense type (Expense), document status (Issued / Draft).
 * Safe to run again – a second run gives the same numbers.                                                     */
function restructureMenu() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Restructure old records?', 'Invoices, quotations and receipts will be renumbered as NF-Inv / NF-Quo / NF-Rec-YEAR-NN by date. A backup copy of each sheet is made first.', ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return;
  const r = restructure_();
  ui.alert('Done', JSON.stringify(r, null, 1).replace(/[{}"]/g, ''), ui.ButtonSet.OK);
}
function restructure(token) { requireAdmin_(token); return restructure_(); }
function restructure_() {
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    migrate_();
    const ss = SpreadsheetApp.getActive(), stamp = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd HH.mm');
    const touched = ['Docs', 'Payments', 'Ads', 'Recharges', 'CompanyExp'];
    touched.forEach(n => { const c = sh_(n).copyTo(ss); c.setName(('Backup ' + stamp + ' – ' + PREFIX + n).slice(0, 99)); c.hideSheet(); });
    const st = settings_(), pre = t => (st[DOC_PREFIX[t][0]] || DOC_PREFIX[t][1]).trim();
    const ymd = v => v instanceof Date ? Utilities.formatDate(v, TZ, 'yyyy-MM-dd') : String(v || '');
    const yearOf = (d, no) => (ymd(d).match(/^(\d{4})/) || String(no).match(/(20\d\d)/) || [0, Utilities.formatDate(new Date(), TZ, 'yyyy')])[1];
    const numIn = no => { const m = String(no).match(/(\d+)\s*$/); return m ? +m[1] : 0; };
    const grid = n => { const s = sh_(n), last = s.getLastRow(); return { s: s, h: SCHEMA[n], v: last > 1 ? s.getRange(2, 1, last - 1, SCHEMA[n].length).getValues() : [] }; };
    const out = { backup: 'Backup ' + stamp, invoices: 0, quotations: 0, receipts: 0, paymentsRelinked: 0, platforms: 0, filled: 0 };

    // --- Invoices & quotations
    const D = grid('Docs'), c = k => D.h.indexOf(k), invMap = {};
    ['Invoice', 'Quotation'].forEach(type => {
      const rows = D.v.map((r, i) => ({ r: r, i: i })).filter(x => x.r[0] !== '' && String(x.r[c('Type')]) === type);
      rows.sort((a, b) => ymd(a.r[c('Date')]).localeCompare(ymd(b.r[c('Date')])) || numIn(a.r[c('No')]) - numIn(b.r[c('No')]) || a.i - b.i);
      const count = {};
      rows.forEach(x => {
        const r = x.r, old = String(r[c('No')]).trim(), y = yearOf(r[c('Date')], old);
        count[y] = (count[y] || 0) + 1;
        const nw = pre(type) + '-' + y + '-' + String(count[y]).padStart(2, '0');
        if (old !== nw) {
          if (!String(r[c('OldNo')] || '').trim() && old) r[c('OldNo')] = old;
          r[c('No')] = nw; out[type === 'Invoice' ? 'invoices' : 'quotations']++;
        }
        if (type === 'Invoice' && old) invMap[old] = nw;
        if (!String(r[c('Status')]).trim()) { r[c('Status')] = type === 'Invoice' ? 'Issued' : 'Draft'; out.filled++; }
      });
    });
    if (D.v.length) D.s.getRange(2, 1, D.v.length, D.h.length).setValues(D.v);

    // --- Payments: follow the invoice's new number, then renumber receipts
    const P = grid('Payments'), pc = k => P.h.indexOf(k);
    P.v.forEach(r => { const o = String(r[pc('InvoiceNo')]).trim(); if (o && invMap[o] && invMap[o] !== o) { r[pc('InvoiceNo')] = invMap[o]; out.paymentsRelinked++; } });
    const rec = P.v.map((r, i) => ({ r: r, i: i })).filter(x => x.r[0] !== '' && String(x.r[pc('ReceiptNo')]).trim());
    rec.sort((a, b) => ymd(a.r[pc('Date')]).localeCompare(ymd(b.r[pc('Date')])) || numIn(a.r[pc('ReceiptNo')]) - numIn(b.r[pc('ReceiptNo')]) || a.i - b.i);
    const rc = {};
    rec.forEach(x => {
      const r = x.r, old = String(r[pc('ReceiptNo')]).trim(), y = yearOf(r[pc('Date')], old);
      rc[y] = (rc[y] || 0) + 1;
      const nw = pre('Receipt') + '-' + y + '-' + String(rc[y]).padStart(2, '0');
      if (old !== nw) { if (!String(r[pc('OldReceiptNo')] || '').trim()) r[pc('OldReceiptNo')] = old; r[pc('ReceiptNo')] = nw; out.receipts++; }
    });
    if (P.v.length) P.s.getRange(2, 1, P.v.length, P.h.length).setValues(P.v);

    // --- Ad platforms → Google / Meta
    ['Ads', 'Recharges'].forEach(n => {
      const G = grid(n), k = G.h.indexOf('Platform');
      G.v.forEach(r => {
        const v = String(r[k]).trim(), nw = /meta|face|fb|insta|ig\b|whatsapp/i.test(v) ? 'Meta' : /google|youtube|yt|gads|adwords/i.test(v) ? 'Google' : v;
        if (nw !== v) { r[k] = nw; out.platforms++; }
      });
      if (G.v.length) G.s.getRange(2, 1, G.v.length, G.h.length).setValues(G.v);
    });

    // --- Company expenses: every row gets a type
    const C = grid('CompanyExp'), kk = C.h.indexOf('Kind');
    C.v.forEach(r => { if (r[0] !== '' && !String(r[kk]).trim()) { r[kk] = 'Expense'; out.filled++; } });
    if (C.v.length) C.s.getRange(2, 1, C.v.length, C.h.length).setValues(C.v);

    log_('Restructure', 'All', '', JSON.stringify(out));
    return out;
  } finally { lock.releaseLock(); }
}
