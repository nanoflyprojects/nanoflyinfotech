/**
 * My Money – Google Sheets backend (Google Apps Script)
 *
 * Open your Expenses spreadsheet → Extensions → Apps Script → paste this file.
 * Then run setup(), optionally importFromMonthSheets(), and deploy as a Web app.
 * See README.md for the full steps.
 *
 * Tabs this script creates and keeps in sync with the website:
 *   Transactions, Bills, Debts, Meta  (your July/August/... tabs are never changed)
 */

var TABS = {
  Transactions: ['id', 'date', 'type', 'cat', 'note', 'amt', 'wallet', 'debtId', 'billId'],
  Bills: ['id', 'name', 'amt', 'cat', 'freq', 'day', 'nextDue', 'sample', 'done'],
  Debts: ['id', 'kind', 'name', 'total', 'emi', 'day', 'nextDue', 'paidBefore', 'est', 'since', 'closed'],
  Meta: ['key', 'value']
};
var NUMBER_COLS = {
  Transactions: ['amt'],
  Bills: ['amt', 'day'],
  Debts: ['total', 'emi', 'day', 'paidBefore']
};
var TEXT_COLS = { Transactions: ['date'], Bills: ['nextDue'], Debts: ['nextDue', 'since'] };
var META_KEYS = ['init', 'opening', 'budgets', 'inv', 'settings', 'dismissed', 'month'];

// Used by importFromMonthSheets(): [tab name, month index 0-11]
var YEAR = 2026;
var MONTH_TABS = [['July', 6], ['August', 7], ['September', 8], ['October', 9]];

/* ------------------------------------------------------------------ */
/* Web app entry points                                                */
/* ------------------------------------------------------------------ */

function doGet(e) {
  return handle_(e && e.parameter ? e.parameter : {});
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'Bad request' }); }
  return handle_(body);
}

function handle_(p) {
  try {
    checkToken_(p.token);
    if (p.action === 'load') return json_({ ok: true, data: load_() });
    if (p.action === 'save') { save_(p.data || {}); return json_({ ok: true }); }
    return json_({ ok: true, message: 'My Money API is running. Use action=load or action=save.' });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Reads MYMONEY_TOKEN. If an older KHATA_TOKEN exists, it is moved to MYMONEY_TOKEN so your current token keeps working. */
function getToken_() {
  var props = PropertiesService.getScriptProperties();
  var t = props.getProperty('MYMONEY_TOKEN');
  if (!t) {
    var old = props.getProperty('KHATA_TOKEN');
    if (old) { props.setProperty('MYMONEY_TOKEN', old); props.deleteProperty('KHATA_TOKEN'); t = old; }
  }
  return t;
}

function hash_(pw) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'mymoney:' + pw, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

/**
 * Set or change the website password.
 * 1. Type the password between the quotes below.  2. Run setPassword.  3. Delete the password from this file again.
 */
function setPassword() {
  var PASSWORD = '';
  if (String(PASSWORD).length < 6) throw new Error('Type a password of at least 6 characters between the quotes, then run again.');
  PropertiesService.getScriptProperties().setProperty('MYMONEY_TOKEN', hash_(PASSWORD));
  Logger.log('Password saved. Remove it from the code now.');
}

function checkToken_(token) {
  var saved = getToken_();
  if (!saved) throw new Error('Run setPassword() once in the Apps Script editor first.');
  var t = String(token || '');
  if (t !== saved && hash_(t) !== saved) { Utilities.sleep(1000); throw new Error('Wrong password.'); }
}

/* ------------------------------------------------------------------ */
/* One-time setup                                                      */
/* ------------------------------------------------------------------ */

/** Run once. Creates the tabs and a private access token (shown in the log). */
function setup() {
  Object.keys(TABS).forEach(function (name) { sheet_(name); });
  var props = PropertiesService.getScriptProperties();
  var token = getToken_();
  if (!token) {
    token = Utilities.getUuid().replace(/-/g, '');
    props.setProperty('MYMONEY_TOKEN', token);
  }
  Logger.log('Setup done.\nYour TOKEN for js/config.js is:\n' + token);
  return token;
}

/**
 * Optional. Copies every row from your July–October tabs
 * into the Transactions tab. Run it once, before you open the website.
 * It replaces the Transactions tab, so do not run it after you start using the site.
 */
function importFromMonthSheets() {
  var ss = ss_();
  var out = [];
  var n = 0;

  function addFrom(tabName, monthIdx, wallet) {
    var sh = ss.getSheetByName(tabName);
    if (!sh) return;
    var rows = sh.getDataRange().getValues();
    var last = null;
    for (var i = 1; i < rows.length; i++) {
      var r = rows[i];
      if (r[0] instanceof Date) last = r[0];
      var res = String(r[1] || '').trim();
      var src = String(r[2] || '').replace(/\s+/g, ' ').trim();
      if (!res || /^previous balance$/i.test(src)) continue;
      var rec = Number(r[3]) || 0, sp = Number(r[4]) || 0;
      var amt = rec || sp;
      if (!amt) continue;
      var type = rec ? 'in' : 'out';
      if (res === 'Income' && type === 'out') continue;
      var date = last || new Date(YEAR, monthIdx, 1);
      out.push({
        id: 't' + (n++),
        date: dstr_(date),
        type: type,
        cat: res,
        note: tidyNote_(src) || res,
        amt: amt,
        w: wallet
      });
    }
  }

  MONTH_TABS.forEach(function (m) { addFrom(m[0], m[1], 'main'); });
  out.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  writeTab_('Transactions', out);
  Logger.log('Imported ' + out.length + ' transactions. Now deploy the web app and open the website.');
}

function tidyNote_(s) {
  if (!s) return '';
  var low = s.toLowerCase();
  if (low === 'nanofly') return 'NanoFLY';
  if (low === 'bus fair') return 'Bus fare';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------------------------------------------ */
/* Load and save                                                       */
/* ------------------------------------------------------------------ */

function load_() {
  var data = {
    txns: readTab_('Transactions'),
    bills: readTab_('Bills'),
    debts: readTab_('Debts')
  };
  var meta = readMeta_();
  META_KEYS.forEach(function (k) { if (meta[k] !== undefined) data[k] = meta[k]; });
  return data;
}

function save_(d) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var cur = sheet_('Transactions').getLastRow() - 1, inc = (d.txns || []).length;
    if (!d.force && cur > 10 && inc < cur * 0.5) throw new Error('Save refused: it would delete ' + (cur - inc) + ' of ' + cur + ' transactions. Reload the site and try again.');
    writeTab_('Transactions', d.txns || []);
    writeTab_('Bills', d.bills || []);
    writeTab_('Debts', d.debts || []);
    var rows = [];
    META_KEYS.forEach(function (k) {
      if (d[k] !== undefined) rows.push({ key: k, value: JSON.stringify(d[k]) });
    });
    writeTab_('Meta', rows);
  } finally {
    lock.releaseLock();
  }
}

/* ------------------------------------------------------------------ */
/* Sheet helpers                                                       */
/* ------------------------------------------------------------------ */

function ss_() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Open the script from inside your spreadsheet, or set SHEET_ID in Script properties.');
  return SpreadsheetApp.openById(id);
}

function sheet_(name) {
  var ss = ss_();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  var cols = TABS[name];
  var head = sh.getRange(1, 1, 1, cols.length);
  if (String(head.getValue()) !== cols[0]) {
    head.setValues([cols]).setFontWeight('bold').setBackground('#0E1B2E').setFontColor('#FFFFFF');
    sh.setFrozenRows(1);
  }
  return sh;
}

function field_(col) { return col === 'wallet' ? 'w' : col; }

function dstr_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, ss_().getSpreadsheetTimeZone(), 'yyyy-MM-dd');
  return String(v == null ? '' : v);
}

function readTab_(name) {
  var sh = sheet_(name);
  var last = sh.getLastRow();
  if (last < 2) return [];
  var cols = TABS[name];
  var values = sh.getRange(2, 1, last - 1, cols.length).getValues();
  var nums = NUMBER_COLS[name] || [];
  var texts = TEXT_COLS[name] || [];
  var items = [];
  values.forEach(function (row) {
    if (row[0] === '' || row[0] == null) return;
    var item = {};
    cols.forEach(function (c, i) {
      var v = row[i];
      if (v === '' || v == null) return;
      if (nums.indexOf(c) > -1) v = Number(v);
      else if (texts.indexOf(c) > -1) v = dstr_(v);
      else if (v instanceof Date) v = dstr_(v);
      else if (typeof v === 'string') v = v.trim();
      item[field_(c)] = v;
    });
    items.push(item);
  });
  return items;
}

function writeTab_(name, items) {
  var sh = sheet_(name);
  var cols = TABS[name];
  var textCols = TEXT_COLS[name] || [];
  var lastRow = Math.max(sh.getLastRow(), 2);
  sh.getRange(2, 1, lastRow - 1, cols.length).clearContent();
  if (!items.length) return;
  textCols.forEach(function (c) {
    sh.getRange(2, cols.indexOf(c) + 1, items.length, 1).setNumberFormat('@');
  });
  var rows = items.map(function (it) {
    return cols.map(function (c) {
      var v = it[field_(c)];
      return v === undefined || v === null ? '' : v;
    });
  });
  sh.getRange(2, 1, rows.length, cols.length).setValues(rows);
}

function readMeta_() {
  var sh = sheet_('Meta');
  var last = sh.getLastRow();
  var meta = {};
  if (last < 2) return meta;
  sh.getRange(2, 1, last - 1, 2).getValues().forEach(function (r) {
    if (!r[0]) return;
    try { meta[r[0]] = JSON.parse(r[1]); } catch (e) { meta[r[0]] = r[1]; }
  });
  return meta;
}
