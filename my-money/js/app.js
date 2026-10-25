(function () {
  'use strict';
  const EXP = ['Family Expenses', 'Self Expenses', 'Gift', 'EMI', 'Investment', 'Office Expenses', 'Bills & Utilities'];
  const INC = ['Income', 'Refund', 'Other income'];
  const CATCOL = { 'Family Expenses': 'var(--c1)', 'Self Expenses': 'var(--c2)', 'Gift': 'var(--c4)', 'EMI': 'var(--c5)', 'Investment': 'var(--c3)', 'Office Expenses': 'var(--c6)', 'Bills & Utilities': 'var(--c7)', 'Income': 'var(--good)', 'Refund': 'var(--good)', 'Other income': 'var(--good)' };
  const MN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const KEY = 'MyMoney.v1';
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const parse = s => { const [a, b, c] = s.split('-').map(Number); return new Date(a, b - 1, c) };
  const TODAY = iso(new Date());
  const dayDiff = (a, b) => Math.round((parse(a) - parse(b)) / 864e5);
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d) };
  const addMonths = (s, n, anchor) => { const d = parse(s); const day = anchor || d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + n); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); d.setDate(Math.min(day, last)); return iso(d) };
  const mLabel = m => MN[+m.slice(5) - 1] + ' ' + m.slice(0, 4);
  const fmtDate = s => { const d = parse(s); return d.getDate() + ' ' + MN[d.getMonth()] };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let RATE = 23.5;
  const inr = (n, w) => (n < 0 ? '-' : '') + (w === 'trip' ? 'RM ' : '₹') + Math.round(Math.abs(n)).toLocaleString('en-IN');
  const cmp = n => { n = Math.abs(n); return n >= 1e5 ? +(n / 1e5).toFixed(1) + 'L' : n >= 1e3 ? +(n / 1e3).toFixed(1) + 'k' : String(Math.round(n)) };
  const $ = s => document.querySelector(s);
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- state ---------- */
  function nextOn(day) { const d = parse(TODAY); let t = new Date(d.getFullYear(), d.getMonth(), Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); if (iso(t) < TODAY) { const n = new Date(d.getFullYear(), d.getMonth() + 1, 1); t = new Date(n.getFullYear(), n.getMonth(), Math.min(day, new Date(n.getFullYear(), n.getMonth() + 1, 0).getDate())) } return iso(t) }
  function seed() {
    return {
      v: 1, opening: 1500,
      txns: SEED.filter(r => r[5] !== 'trip').map((r, i) => ({ id: 't' + i, date: r[0], type: r[1] === 'i' ? 'in' : 'out', cat: r[2], note: r[3], amt: r[4], w: r[5], ...(r[2] === 'EMI' ? { debtId: 'd1' } : {}) })),
      bills: [
        { id: 'b1', name: 'Room rent', amt: 5000, cat: 'Family Expenses', freq: 'monthly', day: 1, nextDue: nextOn(1) },
        { id: 'b2', name: 'Post Office RD', amt: 2000, cat: 'Investment', freq: 'monthly', day: 1, nextDue: nextOn(1) },
        { id: 'b3', name: 'SIP', amt: 1000, cat: 'Investment', freq: 'monthly', day: 10, nextDue: nextOn(10) },
        { id: 'b4', name: 'Mobile recharge', amt: 400, cat: 'Bills & Utilities', freq: 'monthly', day: addDays(TODAY, 6).slice(8) * 1, nextDue: addDays(TODAY, 6) },
        { id: 'b5', name: 'Electricity', amt: 1250, cat: 'Bills & Utilities', freq: 'monthly', day: addDays(TODAY, 2).slice(8) * 1, nextDue: addDays(TODAY, 2), sample: true },
        { id: 'b6', name: 'Internet', amt: 499, cat: 'Bills & Utilities', freq: 'monthly', day: addDays(TODAY, -1).slice(8) * 1, nextDue: addDays(TODAY, -1), sample: true }
      ],
      debts: [{ id: 'd1', kind: 'loan', name: 'Bike loan', total: 144000, emi: 6000, day: 3, nextDue: nextOn(3), paidBefore: 0, est: true }],
      budgets: { 'Family Expenses': 15000, 'Self Expenses': 8000, 'Gift': 4500, 'Office Expenses': 1000, 'Bills & Utilities': 3000 },
      inv: {}, settings: { lead: 7, lowBal: 2000, browser: false, theme: '' }, dismissed: {}, month: null
    };
  }
  let S;
  try { const raw = localStorage.getItem(KEY); S = raw ? JSON.parse(raw) : null } catch (e) { S = null }
  if (!S || !S.txns) S = seed();
  S.txns = S.txns.filter(t => t.w !== 'trip');
  S.settings = Object.assign({ lead: 7, lowBal: 2000, browser: false, theme: '' }, S.settings || {});
  S.dismissed = S.dismissed || {}; Object.keys(S.dismissed).forEach(k => { if (S.dismissed[k] !== TODAY) delete S.dismissed[k] }); const DK = 'MyMoney.dirty';
  const CFG = window.MYMONEY_CONFIG || {}; const KK = 'MyMoney.key'; const getKey = () => { try { return localStorage.getItem(KK) || CFG.TOKEN || '' } catch (e) { return CFG.TOKEN || '' } }; const API = (CFG.API_URL || '').trim();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { } if (API) { try { localStorage.setItem(DK, '1') } catch (e) { } queuePush() } }
  /* ---------- Google Sheets sync (Apps Script web app, see apps-script/Code.gs) ---------- */
  let pushT, pushing = false, dirty = false;
  function setSync(txt, cls) { const el = document.getElementById('syncSt'); if (el) { el.textContent = txt; el.dataset.s = cls || '' } }
  function queuePush() { dirty = true; setSync('Saving to Google Sheets…', 'busy'); clearTimeout(pushT); pushT = setTimeout(push, 900) }
  async function push() {
    if (pushing) { queuePush(); return } pushing = true; dirty = false;
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'save', token: getKey(), data: Object.assign({}, S, { init: true }) }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error || 'Save failed'); push.f = false; if (!dirty) { try { localStorage.removeItem(DK) } catch (e) { } } setSync('Synced with Google Sheets', 'ok')
    }
    catch (e) { setSync('Not synced. Retrying shortly. Changes are kept in this browser.', 'err'); if (!push.f) toast('Could not save to Google Sheets: ' + e.message); if (/password|token/i.test(e.message)) relogin(); push.f = true; clearTimeout(push.r); push.r = setTimeout(queuePush, 10000) }
    pushing = false; if (dirty) queuePush()
  }
  async function pull(quiet) {
    let dd = null; try { dd = localStorage.getItem(DK) } catch (e) { } if (dd && S.txns && S.txns.length) { push(); return }
    setSync('Loading from Google Sheets…', 'busy');
    try {
      const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'load', token: getKey() }) }); const j = await r.json(); if (!j.ok) throw new Error(j.error || 'Load failed'); const d = j.data || {};
      if (d.init) { S = Object.assign(seed(), d) }
      else if (d.txns && d.txns.length) { S = Object.assign(seed(), { txns: d.txns }) }
      else { push(); return }
      S.settings = Object.assign({ lead: 7, lowBal: 2000, browser: false, theme: '' }, S.settings || {});
      S.txns = S.txns.filter(t => t.w !== 'trip');
      try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) { }
      MONTH = S.month && months().includes(S.month) ? S.month : months().filter(m => m <= TODAY.slice(0, 7)).pop();
      applyTheme(S.settings.theme); render(!quiet);
      if (d.init) setSync('Synced with Google Sheets', 'ok'); else push()
    }
    catch (e) { if (/password|token/i.test(e.message)) { relogin(); return } setSync('Could not reach Google Sheets. Showing data saved in this browser.', 'err'); toast('Google Sheets: ' + e.message) }
  }
  const months = () => { const set = new Set(S.txns.map(t => t.date.slice(0, 7))); set.add(TODAY.slice(0, 7)); return [...set].sort() };
  let VIEW = (location.hash || '').slice(1);
  if (!['overview', 'activity', 'bills', 'debts', 'investments'].includes(VIEW)) VIEW = 'overview';
  let MONTH = S.month && months().includes(S.month) ? S.month : months().filter(m => m <= TODAY.slice(0, 7)).pop();
  const F = { q: '', type: '', cat: '', w: 'main', m: '', limit: 60 };

  /* ---------- derived ---------- */
  const mine = w => S.txns.filter(t => t.w === w);
  function balanceAt(end, w = 'main') { let b = w === 'main' ? S.opening : 0; S.txns.forEach(t => { if (t.w === w && t.date <= end) b += t.type === 'in' ? t.amt : -t.amt }); return b }
  function mstats(m, w = 'main') {
    const r = { inc: 0, exp: 0, inv: 0, out: 0, bycat: {}, days: {} };
    S.txns.forEach(t => {
      if (t.w !== w || !t.date.startsWith(m)) return;
      if (t.type === 'in') { r.inc += t.amt } else {
        r.out += t.amt; r.bycat[t.cat] = (r.bycat[t.cat] || 0) + t.amt;
        if (t.cat === 'Investment') r.inv += t.amt; else { r.exp += t.amt; const d = +t.date.slice(8); r.days[d] = (r.days[d] || 0) + t.amt }
      }
    }); return r
  }
  const monthEnd = m => { const [y, mo] = m.split('-').map(Number); return iso(new Date(y, mo, 0)) };
  const debtPaid = d => d.paidBefore + S.txns.filter(t => t.debtId === d.id).reduce((a, t) => a + t.amt, 0);
  const debtLeft = d => Math.max(0, d.total - debtPaid(d));
  function advance(item) {
    if (item.freq === 'weekly') return addDays(item.nextDue, 7);
    if (item.freq === 'yearly') return addMonths(item.nextDue, 12, item.day);
    return addMonths(item.nextDue, 1, item.day)
  }
  function reminders() {
    const out = [];
    S.bills.filter(b => !b.done).forEach(b => out.push({ k: 'bill', id: b.id, name: b.name, amt: b.amt, due: b.nextDue, sample: b.sample }));
    S.debts.filter(d => d.kind === 'loan' && !d.closed && d.nextDue && debtLeft(d) > 0).forEach(d => out.push({ k: 'debt', id: d.id, name: d.name + ' EMI', amt: Math.min(d.emi, debtLeft(d)), due: d.nextDue }));
    return out.map(r => ({ ...r, days: dayDiff(r.due, TODAY) })).sort((a, b) => a.days - b.days)
  }
  function whenText(d) { return d < 0 ? 'Overdue ' + (-d) + (d === -1 ? ' day' : ' days') : d === 0 ? 'Due today' : d === 1 ? 'Due tomorrow' : 'In ' + d + ' days' }
  function whenCls(d) { return d < 0 ? 'crit' : d <= Math.min(2, S.settings.lead) ? 'warn' : 'info' }
  function alerts() {
    const a = [], lead = S.settings.lead, rem = reminders();
    rem.forEach(r => {
      if (r.days < 0) a.push({ key: 'ov-' + r.k + r.id + r.due, sev: 'crit', title: r.name + ' is overdue', text: inr(r.amt) + ' was due on ' + fmtDate(r.due), r });
      else if (r.days <= lead) a.push({ key: 'due-' + r.k + r.id + r.due, sev: r.days <= 2 ? 'warn' : 'info', title: r.name + ' · ' + whenText(r.days).toLowerCase(), text: inr(r.amt) + ' on ' + fmtDate(r.due), r })
    });
    const bal = balanceAt(TODAY), dueSum = rem.filter(r => r.days <= lead).reduce((s, r) => s + r.amt, 0);
    if (dueSum > bal) a.push({ key: 'short-' + TODAY, sev: 'warn', title: 'Payments are higher than your balance', text: inr(dueSum) + ' is due in the next ' + lead + ' days and your balance is ' + inr(bal) + '.' });
    else if (bal < S.settings.lowBal) a.push({ key: 'low-' + TODAY, sev: 'warn', title: 'Low balance', text: 'Your balance is ' + inr(bal) + ', under your ' + inr(S.settings.lowBal) + ' limit.' });
    const cm = TODAY.slice(0, 7), ms = mstats(cm);
    Object.keys(S.budgets).forEach(c => {
      const lim = S.budgets[c]; if (!lim) return; const sp = ms.bycat[c] || 0, p = sp / lim;
      if (p >= 1) a.push({ key: 'bo-' + c + cm, sev: 'crit', title: c + ' is over budget', text: inr(sp) + ' spent of ' + inr(lim) + ' this month.' });
      else if (p >= .85) a.push({ key: 'bw-' + c + cm, sev: 'warn', title: c + ' is at ' + Math.round(p * 100) + '% of budget', text: inr(lim - sp) + ' left for ' + MN[+cm.slice(5) - 1] + '.' })
    });
    return a.filter(x => S.dismissed[x.key] !== TODAY)
  }

  /* ---------- ui helpers ---------- */
  const ic = (n, c) => `<svg class="i ${c || ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const sw = c => `<span class="sw" style="background:${c}"></span>`;
  const catColor = c => CATCOL[c] || 'var(--c7)';
  let ANIM = true;
  function animate() { ANIM = true; document.body.classList.add('anim'); clearTimeout(animate.t); animate.t = setTimeout(() => { document.body.classList.remove('anim'); ANIM = false }, 1800) }
  function toast(msg, undoFn) {
    const el = document.createElement('div'); el.className = 'toast'; el.innerHTML = '<span>' + esc(msg) + '</span>';
    if (undoFn) { const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Undo'; b.onclick = () => { undoFn(); el.remove() }; el.appendChild(b) }
    $('#toasts').appendChild(el); setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 200) }, undoFn ? 6500 : 3200)
  }
  function commit(msg, keepAnim) { const snap = JSON.stringify(S); return { msg, snap } }
  function change(fn, msg, opts) {
    const snap = JSON.stringify(S); fn(); save(); render(opts && opts.anim); countUp(true);
    if (msg) toast(msg, () => { S = JSON.parse(snap); save(); render() })
  }
  function countUp(force) {
    document.querySelectorAll('.cu').forEach(el => {
      const v = +el.dataset.v, w = el.dataset.w, pre = el.dataset.pre || ''; if (reduce || (!ANIM && !force)) { return }
      const t0 = performance.now(), dur = 900; el.textContent = pre + inr(0, w);
      const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3); el.textContent = pre + inr(v * e, w); if (p < 1) requestAnimationFrame(step); else el.textContent = pre + inr(v, w) }; requestAnimationFrame(step)
    })
  }
  const cu = (v, w, pre) => `<span class="cu" data-v="${v}" data-w="${w || ''}" data-pre="${pre || ''}">${(pre || '') + inr(v, w)}</span>`;

  /* ---------- charts ---------- */
  const CH = {};
  function niceMax(v) { if (v <= 0) return 1000; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p }
  function drawCharts() { document.querySelectorAll('.cb[data-ch]').forEach(el => { const f = CH[el.dataset.ch]; if (!f) return; const W = Math.max(220, Math.floor(el.clientWidth)); el.innerHTML = f(W) }) }
  function barsSvg(W, ms) {
    const H = 230, pl = 44, pr = 8, pt = 12, pb = 28; const max = niceMax(Math.max(1, ...ms.flatMap(m => [m.inc, m.exp])));
    const y = v => pt + (1 - v / max) * (H - pt - pb), gw = (W - pl - pr) / ms.length, bw = Math.min(26, gw * .32); let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Income and spending by month"><g class="axis">`;
    for (let k = 0; k <= 4; k++) { const v = max * k / 4, yy = y(v); s += `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}"/><text x="${pl - 8}" y="${yy + 4}" text-anchor="end">${cmp(v)}</text>` }
    ms.forEach((m, i) => { const cx = pl + gw * i + gw / 2; s += `<text x="${cx}" y="${H - 8}" text-anchor="middle">${MN[+m.m.slice(5) - 1]}</text>` }); s += '</g>';
    ms.forEach((m, i) => {
      const cx = pl + gw * i + gw / 2;
      [[m.inc, 'var(--c3)', -bw - 1, 'Income'], [m.exp, 'var(--c1)', 1, 'Spent']].forEach(([v, c, dx, l], j) => {
        const h = Math.max(v ? 3 : 0, (H - pb) - y(v));
        s += `<rect class="bar" style="--d:${i * 2 + j}" data-tip="${mLabel(m.m)}|${l}: ${inr(v)}" x="${cx + dx}" y="${H - pb - h}" width="${bw}" height="${h}" rx="5" fill="${c}"/>`
      })
    });
    return s + '</svg>'
  }
  function areaSvg(W, id, vals, labels, fmt) {
    const H = 300, pl = 44, pr = 10, pt = 12, pb = 26, n = vals.length; const max = niceMax(Math.max(...vals, 1));
    const x = i => pl + (n < 2 ? 0 : i * (W - pl - pr) / (n - 1)), y = v => pt + (1 - v / max) * (H - pt - pb);
    let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Daily spending" data-area="${id}"><defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--c1)" stop-opacity=".35"/><stop offset="1" stop-color="var(--c1)" stop-opacity="0"/></linearGradient></defs><g class="axis">`;
    for (let k = 0; k <= 4; k++) { const v = max * k / 4, yy = y(v); s += `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${yy}" y2="${yy}"/><text x="${pl - 8}" y="${yy + 4}" text-anchor="end">${cmp(v)}</text>` }
    const step = Math.ceil(n / (W < 420 ? 6 : 10)); labels.forEach((l, i) => { if (i % step === 0 || i === n - 1) s += `<text x="${x(i)}" y="${H - 7}" text-anchor="middle">${l}</text>` }); s += '</g>';
    const pts = vals.map((v, i) => [x(i), y(v)]); const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
    s += `<path class="areafill" d="${d}L${x(n - 1)} ${y(0)}L${x(0)} ${y(0)}Z" fill="url(#g${id})"/><path class="line" pathLength="1" stroke-dasharray="1" d="${d}" fill="none" stroke="var(--c1)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;
    const mi = vals.indexOf(Math.max(...vals)); if (vals[mi] > 0) s += `<circle cx="${x(mi)}" cy="${y(vals[mi])}" r="4.5" fill="var(--c1)" stroke="var(--card)" stroke-width="2"/>`;
    s += `<line class="xh" y1="${pt}" y2="${H - pb}" stroke="var(--muted)" stroke-dasharray="3 3" opacity="0"/><circle class="xd" r="5" fill="var(--c1)" stroke="var(--card)" stroke-width="2" opacity="0"/><rect x="${pl}" y="0" width="${W - pl - pr}" height="${H - pb}" fill="transparent" class="hit"/></svg>`;
    AREA[id] = { pts, vals, labels, fmt, n }; return s
  }
  const AREA = {};
  function sparkSvg(W, vals) {
    const H = 64, n = vals.length; if (n < 2) return ''; const mn = Math.min(...vals), mx = Math.max(...vals), r = (mx - mn) || 1;
    const pts = vals.map((v, i) => [i * W / (n - 1), 8 + (1 - (v - mn) / r) * (H - 16)]); const d = 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L');
    return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><defs><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8A5C" stop-opacity=".45"/><stop offset="1" stop-color="#FF8A5C" stop-opacity="0"/></linearGradient></defs><path class="areafill" d="${d}L${W} ${H}L0 ${H}Z" fill="url(#gs)"/><path class="line" pathLength="1" stroke-dasharray="1" d="${d}" fill="none" stroke="#FF8A5C" stroke-width="2.2" stroke-linejoin="round"/><circle cx="${pts[n - 1][0] - 3}" cy="${pts[n - 1][1]}" r="4" fill="#FF8A5C" stroke="#3A2535" stroke-width="2"/></svg>`
  }
  function donut(parts, total, label, sizeId) {
    const R = 70, C = 2 * Math.PI * R; let off = 0, s = `<svg viewBox="0 0 176 176" width="176" height="176" role="img" aria-label="${esc(label)}"><circle cx="88" cy="88" r="${R}" fill="none" stroke="var(--card2)" stroke-width="24"/>`;
    parts.forEach(p => {
      const len = Math.max(0, p.v / total * C - (parts.length > 1 ? 2.5 : 0));
      s += `<circle class="arc" style="--C:${C.toFixed(2)}" data-tip="${esc(p.l)}|${inr(p.v)} · ${Math.round(p.v / total * 100)}%" cx="88" cy="88" r="${R}" fill="none" stroke="${p.c}" stroke-width="24" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 88 88)"/>`; off += p.v / total * C
    });
    return s + '</svg>'
  }
  function ringSvg(p, c) { const R = 40, C = 2 * Math.PI * R, len = Math.max(0, Math.min(1, p)) * C; return `<svg viewBox="0 0 96 96" width="96" height="96" aria-hidden="true"><circle cx="48" cy="48" r="${R}" fill="none" stroke="var(--card2)" stroke-width="10"/><circle class="arc" style="--C:${C.toFixed(2)}" cx="48" cy="48" r="${R}" fill="none" stroke="${c}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" transform="rotate(-90 48 48)"/></svg>` }

  /* ---------- views ---------- */
  const NAV = [['overview', 'home', 'Overview'], ['activity', 'list', 'Activity'], ['bills', 'bill', 'Bills'], ['debts', 'debt', 'Debts'], ['investments', 'trend', 'Investments']];
  function head(title, sub, extra) {
    const al = alerts();
    return `<header class="top rise" style="--i:0"><div class="ttl"><h1>${title}</h1><p>${sub}</p></div><div class="tools">${extra || ''}
  <button class="btn icon-btn ${al.length ? 'shake' : ''}" data-act="bell" type="button" aria-label="Notifications, ${al.length} new">${ic('bell')}${al.length ? `<span class="dot">${al.length}</span>` : ''}</button>
  <button class="btn icon-btn" data-act="settings" type="button" aria-label="Settings">${ic('gear')}</button>
  <button class="btn pri" data-act="add" type="button">${ic('plus')}<span>Add</span></button></div></header>`
  }
  const monthSel = () => `<select class="sel" id="monthSel" aria-label="Month">${months().map(m => `<option value="${m}" ${m === MONTH ? 'selected' : ''}>${mLabel(m)}</option>`).join('')}</select>`;
  function greet() { const h = new Date().getHours(), n = (CFG.USER_NAME || '').trim(); return (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + (n ? ', ' + esc(n) : '') }

  function viewOverview() {
    const m = MONTH, ms = mstats(m), isCur = m === TODAY.slice(0, 7), end = isCur ? TODAY : monthEnd(m);
    const bal = balanceAt(end), pm = months()[months().indexOf(m) - 1], ps = pm ? mstats(pm) : null;
    const net = ms.inc - ms.out, rate = ms.inc ? Math.round(net / ms.inc * 100) : 0;
    const dim = new Date(+m.slice(0, 4), +m.slice(5), 0).getDate(), upto = isCur ? +TODAY.slice(8) : dim;
    const dvals = [], dlab = []; for (let d = 1; d <= upto; d++) { dvals.push(ms.days[d] || 0); dlab.push(String(d)) }
    let run = balanceAt(addDays(m + '-01', -1)), bs = [run]; for (let d = 1; d <= upto; d++) { const ds = m + '-' + pad(d); S.txns.forEach(t => { if (t.w === 'main' && t.date === ds) run += t.type === 'in' ? t.amt : -t.amt }); bs.push(run) }
    const trend = ps && ps.exp > 0 ? Math.round((ms.exp - ps.exp) / ps.exp * 100) : null;
    const upcoming = reminders().filter(r => r.days <= 30).slice(0, 5), al = alerts().filter(a => a.r);
    const hist = months().filter(x => x <= m).slice(-6); const cash = hist.map(x => ({ m: x, ...mstats(x) }));
    CH.cash = W => barsSvg(W, cash); CH.daily = W => areaSvg(W, 'd', dvals, dlab); CH.spark = W => sparkSvg(W, bs);
    const cats = Object.entries(ms.bycat).sort((a, b) => b[1] - a[1]).map(([c, v]) => ({ l: c, v, c: catColor(c) })); const tot = cats.reduce((s, c) => s + c.v, 0);
    const worst = al.filter(a => a.sev === 'crit')[0] || al[0];
    return `${head(greet(), mLabel(m) + (isCur ? ' so far' : '') + ' · all amounts in rupees', monthSel())}
  ${worst ? `<div class="banner ${worst.sev === 'crit' ? 'crit' : 'warn'} rise" style="--i:1">${ic('alert')}<div class="t"><b>${esc(worst.title)}</b> · ${esc(worst.text)}</div><button class="btn sm" data-act="pay" data-k="${worst.r.k}" data-id="${worst.r.id}" type="button">Mark paid</button></div>` : ''}
  <section class="grid g-hero">
    <div class="card hero rise" style="--i:2"><div class="glow"></div><span class="l">${isCur ? 'Balance today' : 'Balance at month end'}</span>
      <span class="num big">${cu(bal)}</span>
      <span class="chip ${net >= 0 ? 'good' : 'crit'}" style="align-self:flex-start;background:rgba(255,255,255,.12);color:#fff">${net >= 0 ? '+' : ''}${inr(net)} this month${ms.inc ? ' · ' + rate + '% saved' : ''}</span>
      <div class="cb" data-ch="spark" style="height:64px"></div></div>
    <div class="kpis rise" style="--i:3">
      <div class="card kpi"><span class="l">${ic('down')}Money in</span><span class="num v pos">${cu(ms.inc)}</span><span class="hint">${S.txns.filter(t => t.w === 'main' && t.type === 'in' && t.date.startsWith(m)).length} deposits</span></div>
      <div class="card kpi"><span class="l">${ic('up')}Spent</span><span class="num v">${cu(ms.exp)}</span>${trend == null ? '<span class="hint">No earlier month</span>' : `<span class="chip ${trend > 0 ? 'warn' : 'good'}" style="align-self:flex-start">${trend > 0 ? '▲' : '▼'} ${Math.abs(trend)}% vs ${MN[+pm.slice(5) - 1]}</span>`}</div>
      <div class="card kpi"><span class="l">${ic('trend')}Invested</span><span class="num v" style="color:var(--accent)">${cu(ms.inv)}</span><span class="hint">${ms.inc ? Math.round(ms.inv / ms.inc * 100) + '% of income' : '—'}</span></div>
    </div></section>
  <section class="grid g-2">
    <div class="card rise" style="--i:4"><div class="chd"><div><h2>Money in and out</h2><p class="sub">Last ${cash.length} months</p></div><div class="legend"><span>${sw('var(--c3)')}Income</span><span>${sw('var(--c1)')}Spent</span></div></div><div class="cb" data-ch="cash" style="height:230px"></div></div>
    <div class="card rise" style="--i:5"><h2>Where it went</h2><p class="sub">${mLabel(m)} · ${inr(tot)} out</p>
      ${cats.length ? `<div class="donutwrap"><div class="donut">${donut(cats, tot, 'Spending by category')}<div class="mid"><b class="num" style="font-size:20px">${cmp(tot)}</b><small>total out</small></div></div>
      <div class="dleg">${cats.map(c => `<div>${sw(c.c)}<span class="n">${esc(c.l)}</span><b>${Math.round(c.v / tot * 100)}%</b></div>`).join('')}</div></div>` : '<div class="empty">No spending recorded for this month yet.</div>'}</div>
  </section>
  <section class="grid g-2">
    <div class="card rise" style="--i:6"><div class="chd"><div><h2>Daily spending</h2><p class="sub">Excludes investments · hover for the day's total</p></div></div><div class="cb" data-ch="daily" style="height:300px"></div></div>
    <div class="card rise" style="--i:7"><div class="chd"><div><h2>Upcoming payments</h2><p class="sub">Bills and EMIs in the next 30 days</p></div><button class="btn sm" data-go="bills" type="button">All bills</button></div>
      <div class="list">${upcoming.length ? upcoming.map(rem).join('') : '<div class="empty">Nothing due. Add a bill to get reminders.</div>'}</div></div>
  </section>
  <section class="grid g-3">
    <div class="card rise" style="--i:8"><div class="chd"><div><h2>Budgets</h2><p class="sub">${mLabel(m)}</p></div><button class="btn sm" data-act="budgets" type="button">Edit</button></div>${budgets(ms)}</div>
    <div class="card rise" style="--i:9"><div class="chd"><div><h2>Debts</h2><p class="sub">What you owe</p></div><button class="btn sm" data-go="debts" type="button">Open</button></div>${debtMini()}</div>
    <div class="card rise" style="--i:10"><div class="chd"><div><h2>Investments</h2><p class="sub">Total put away</p></div><button class="btn sm" data-go="investments" type="button">Open</button></div>${invMini()}</div>
  </section>
  <section class="grid g-2e">
    <div class="card rise" style="--i:11"><div class="chd"><div><h2>Recent activity</h2><p class="sub">Latest entries in ${mLabel(m)}</p></div><button class="btn sm" data-go="activity" type="button">See all</button></div>
      <div class="list tx">${S.txns.filter(t => t.w === 'main' && t.date.startsWith(m)).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map(txRow).join('') || '<div class="empty">No entries this month.</div>'}</div></div>
  </section>`}

  function rem(r) {
    const c = whenCls(r.days); return `<div class="row"><span class="ic ${c}">${ic(r.k === 'debt' ? 'debt' : 'bill')}</span>
  <div class="t"><b>${esc(r.name)}</b><small>${fmtDate(r.due)} · <span class="chip ${c}">${whenText(r.days)}</span>${r.sample ? '<span class="chip mut">Sample</span>' : ''}</small></div>
  <div class="r"><b class="num">${inr(r.amt)}</b><button class="btn sm" data-act="pay" data-k="${r.k}" data-id="${r.id}" type="button">${ic('check')}Paid</button></div></div>`
  }
  function budgets(ms) {
    const items = Object.entries(S.budgets).filter(([, v]) => v > 0); if (!items.length) return '<div class="empty">Set monthly limits to see progress.</div>';
    return `<div class="bud">${items.map(([c, lim], i) => {
      const sp = ms.bycat[c] || 0, p = sp / lim, col = p >= 1 ? 'var(--crit)' : p >= .85 ? 'var(--warn)' : 'var(--good)';
      return `<div><div class="h"><span class="cat">${sw(catColor(c))}${esc(c)}</span><span><b>${inr(sp)}</b> <span class="hint">of ${inr(lim)}</span></span></div>
    <div class="track" role="progressbar" aria-valuenow="${Math.round(p * 100)}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(c)} budget used"><div class="fill" style="--w:${Math.min(100, p * 100)}%;--c:${col};--d:${i}"></div></div>
    <div class="hint" style="margin-top:4px;color:${col}">${p >= 1 ? inr(sp - lim) + ' over' : inr(lim - sp) + ' left'}</div></div>`
    }).join('')}</div>`
  }
  function debtMini() {
    const ds = S.debts.filter(d => d.kind === 'loan' && !d.closed); const owe = ds.reduce((s, d) => s + debtLeft(d), 0), lent = S.debts.filter(d => d.kind === 'lent' && !d.closed).reduce((s, d) => s + debtLeft(d), 0);
    if (!ds.length && !lent) return '<div class="empty">No debts. Add a loan or money you lent.</div>';
    return `<div class="kpi"><span class="num v">${cu(owe)}</span><span class="hint">left to repay across ${ds.length} loan${ds.length === 1 ? '' : 's'}</span></div>
  ${ds.slice(0, 2).map(d => { const p = debtPaid(d) / d.total; return `<div style="margin-top:14px"><div class="h" style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px"><span>${esc(d.name)}</span><b>${Math.round(p * 100)}%</b></div><div class="track"><div class="fill" style="--w:${Math.min(100, p * 100)}%;--c:var(--c5)"></div></div></div>` }).join('')}
  ${lent ? `<p class="hint" style="margin:14px 0 0">Owed to you: <b>${inr(lent)}</b></p>` : ''}`
  }
  function holdings() {
    const g = {}; S.txns.filter(t => t.w === 'main' && t.cat === 'Investment' && t.type === 'out').forEach(t => { const k = t.note.trim().toLowerCase(); g[k] = g[k] || { name: t.note, invested: 0, n: 0, last: '', months: {} }; const h = g[k]; h.invested += t.amt; h.n++; if (t.date > h.last) h.last = t.date; const mm = t.date.slice(0, 7); h.months[mm] = (h.months[mm] || 0) + t.amt });
    return Object.entries(g).map(([k, h]) => ({ key: k, ...h, value: S.inv[k] != null ? S.inv[k] : h.invested })).sort((a, b) => b.invested - a.invested)
  }
  function invMini() {
    const h = holdings(); if (!h.length) return '<div class="empty">No investments yet.</div>'; const tot = h.reduce((s, x) => s + x.invested, 0);
    return `<div class="kpi"><span class="num v" style="color:var(--accent)">${cu(tot)}</span><span class="hint">across ${h.length} holdings</span></div>
  <div class="bud" style="margin-top:14px;gap:10px">${h.slice(0, 4).map((x, i) => `<div><div class="h" style="margin-bottom:4px"><span>${esc(x.name)}</span><b>${inr(x.invested)}</b></div><div class="track"><div class="fill" style="--w:${x.invested / h[0].invested * 100}%;--c:var(--c3);--d:${i}"></div></div></div>`).join('')}</div>`
  }

  function txRow(t) {
    const out = t.type === 'out', w = t.w; return `<div class="row clickable" data-act="edit" data-id="${t.id}" tabindex="0" role="button" aria-label="Edit ${esc(t.note)}">
  <span class="ic" style="color:${catColor(t.cat)}">${ic(out ? 'up' : 'down')}</span>
  <div class="t"><b>${esc(t.note)}</b><small>${sw(catColor(t.cat))}${esc(t.cat)} · ${fmtDate(t.date)}</small></div>
  <div class="r"><b class="num ${out ? 'neg' : 'pos'}">${out ? '-' : '+'}${inr(t.amt, w)}</b></div></div>`
  }

  function viewActivity() {
    const q = F.q.toLowerCase(); let list = S.txns.filter(t => t.w === F.w || F.w === 'all').filter(t => (!F.type || t.type === F.type) && (!F.cat || t.cat === F.cat) && (!F.m || t.date.startsWith(F.m)) && (!q || (t.note + ' ' + t.cat).toLowerCase().includes(q)));
    list.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    const inT = list.filter(t => t.type === 'in').reduce((s, t) => s + (t.w === 'trip' ? t.amt * RATE : t.amt), 0), outT = list.filter(t => t.type === 'out').reduce((s, t) => s + (t.w === 'trip' ? t.amt * RATE : t.amt), 0);
    let html = '', last = '', shown = list.slice(0, F.limit);
    shown.forEach(t => { if (t.date !== last) { last = t.date; const dn = list.filter(x => x.date === t.date).reduce((s, x) => s + (x.type === 'in' ? x.amt : -x.amt), 0); html += `<div class="dayh"><span>${fmtDate(t.date)} ${t.date.slice(0, 4)}</span><span>${dn >= 0 ? '+' : '-'}${inr(Math.abs(dn), t.w)}</span></div>` } html += txRow(t) });
    return `${head('Activity', list.length + ' entries · in ' + inr(inT) + ' · out ' + inr(outT))}
  <div class="toolbar rise" style="--i:1"><label class="search"><span class="sr" hidden>Search</span>${ic('search')}<input id="fq" type="search" placeholder="Search notes or categories" value="${esc(F.q)}" autocomplete="off"></label>
    <select class="sel" id="ft" aria-label="Type"><option value="">All types</option><option value="in" ${F.type === 'in' ? 'selected' : ''}>Money in</option><option value="out" ${F.type === 'out' ? 'selected' : ''}>Money out</option></select>
    <select class="sel" id="fc" aria-label="Category"><option value="">All categories</option>${[...EXP, ...INC].map(c => `<option ${F.cat === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
    <select class="sel" id="fm" aria-label="Month"><option value="">All months</option>${months().map(m => `<option value="${m}" ${F.m === m ? 'selected' : ''}>${mLabel(m)}</option>`).join('')}</select></div>
  <div class="card tx rise" style="--i:2">${html ? `<div class="list">${html}</div>` : '<div class="empty">No entries match these filters.</div>'}
  ${list.length > shown.length ? `<div style="text-align:center;margin-top:12px"><button class="btn" data-act="more" type="button">Show ${Math.min(60, list.length - shown.length)} more</button></div>` : ''}</div>`
  }

  function occurrences(b, from, to) { const out = []; let d = b.nextDue, guard = 0; while (d <= to && guard++ < 60) { if (d >= from) out.push(d); const nx = advance({ ...b, nextDue: d }); if (nx <= d) break; d = nx } return out }
  function viewBills() {
    const items = reminders().filter(r => r.k === 'bill'), all = reminders(); const overdue = all.filter(r => r.days < 0), dueSoon = all.filter(r => r.days >= 0 && r.days <= S.settings.lead);
    const monthly = S.bills.filter(b => !b.done).reduce((s, b) => s + (b.freq === 'weekly' ? b.amt * 4 : b.freq === 'yearly' ? b.amt / 12 : b.amt), 0);
    const dow = (parse(TODAY).getDay() + 6) % 7, start = addDays(TODAY, -dow), end = addDays(start, 34);
    const marks = {}; all.forEach(r => { const b = r.k === 'bill' ? S.bills.find(x => x.id === r.id) : { ...S.debts.find(x => x.id === r.id), freq: 'monthly', amt: r.amt }; occurrences(b, start, end).forEach(d => { (marks[d] = marks[d] || []).push({ n: r.name, a: r.amt }) }) });
    let cal = '';['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(x => cal += `<div class="h">${x}</div>`);
    for (let i = 0; i < 35; i++) {
      const d = addDays(start, i), mk = marks[d] || [], dd = dayDiff(d, TODAY);
      cal += `<div class="d ${d === TODAY ? 'today' : ''} ${dd < 0 ? 'past' : ''}"><b>${+d.slice(8)}${+d.slice(8) === 1 ? ' ' + MN[+d.slice(5, 7) - 1] : ''}</b>${mk.slice(0, 2).map(x => `<span class="p ${dd < 0 ? 'crit' : dd <= 2 ? 'warn' : ''}" data-tip="${esc(x.n)}|${inr(x.a)} · ${fmtDate(d)}">${esc(x.n)}</span>`).join('')}${mk.length > 2 ? `<span class="hint">+${mk.length - 2}</span>` : ''}</div>`
    }
    return `${head('Bills', 'Reminders appear ' + S.settings.lead + ' days before each due date', '<button class="btn" data-act="newbill" type="button">' + ic('plus') + '<span class="hide-m">New bill</span></button>')}
  <section class="grid g-3 rise" style="--i:1">
    <div class="card kpi"><span class="l">${ic('alert')}Overdue</span><span class="num v" style="color:${overdue.length ? 'var(--crit)' : 'var(--ink)'}">${cu(overdue.reduce((s, r) => s + r.amt, 0))}</span><span class="hint">${overdue.length} payment${overdue.length === 1 ? '' : 's'}</span></div>
    <div class="card kpi"><span class="l">${ic('clock')}Due in ${S.settings.lead} days</span><span class="num v">${cu(dueSoon.reduce((s, r) => s + r.amt, 0))}</span><span class="hint">${dueSoon.length} payment${dueSoon.length === 1 ? '' : 's'} · balance ${inr(balanceAt(TODAY))}</span></div>
    <div class="card kpi"><span class="l">${ic('bill')}Monthly commitments</span><span class="num v">${cu(monthly + S.debts.filter(d => d.kind === 'loan' && !d.closed).reduce((s, d) => s + d.emi, 0))}</span><span class="hint">bills plus loan EMIs</span></div></section>
  <section class="grid g-2">
    <div class="card rise" style="--i:2"><div class="chd"><div><h2>All payments</h2><p class="sub">Soonest first</p></div></div><div class="list">${all.length ? all.map(r => {
      const c = whenCls(r.days); const b = r.k === 'bill' ? S.bills.find(x => x.id === r.id) : null;
      return `<div class="row"><span class="ic ${c}">${ic(r.k === 'debt' ? 'debt' : 'bill')}</span><div class="t"><b>${esc(r.name)}</b><small>${fmtDate(r.due)} · ${b ? b.freq : 'monthly EMI'} · <span class="chip ${c}">${whenText(r.days)}</span>${r.sample ? '<span class="chip mut">Sample</span>' : ''}</small></div>
      <div class="r"><b class="num">${inr(r.amt)}</b><span style="display:flex;gap:6px"><button class="btn sm" data-act="pay" data-k="${r.k}" data-id="${r.id}" type="button">${ic('check')}Paid</button>${b ? `<button class="btn sm icon-btn" style="width:34px;min-height:34px" data-act="editbill" data-id="${r.id}" type="button" aria-label="Edit ${esc(r.name)}">${ic('edit')}</button>` : ''}</span></div></div>`
    }).join('') : '<div class="empty">No bills yet. Add rent, subscriptions or utilities.</div>'}</div></div>
    <div class="card rise" style="--i:3"><div class="chd"><div><h2>Next 5 weeks</h2><p class="sub">Every due date on one calendar</p></div></div><div class="cal">${cal}</div></div>
  </section>`}

  function viewDebts() {
    const loans = S.debts.filter(d => d.kind === 'loan'), lent = S.debts.filter(d => d.kind === 'lent');
    const owe = loans.filter(d => !d.closed).reduce((s, d) => s + debtLeft(d), 0), owed = lent.filter(d => !d.closed).reduce((s, d) => s + debtLeft(d), 0);
    const card = (d, i) => {
      const paid = debtPaid(d), left = debtLeft(d), p = paid / d.total, isLoan = d.kind === 'loan'; const mo = isLoan && d.emi ? Math.ceil(left / d.emi) : 0;
      return `<div class="card rise" style="--i:${i + 2}"><div class="chd"><div><h2>${esc(d.name)}</h2><p class="sub">${isLoan ? 'You owe' : 'Owed to you'}${d.est ? ' · <span class="chip warn">Estimated total, edit to match</span>' : ''}</p></div>${left === 0 ? '<span class="chip good">Cleared</span>' : ''}</div>
    <div class="loan"><div class="ring">${ringSvg(p, isLoan ? 'var(--c5)' : 'var(--c3)')}<div class="mid">${Math.round(p * 100)}%</div></div>
    <div class="info"><div><small>${isLoan ? 'Paid so far' : 'Received back'}</small><b>${inr(paid)}</b></div><div><small>Remaining</small><b>${inr(left)}</b></div>
    ${isLoan ? `<div><small>Monthly EMI</small><b>${inr(d.emi)}</b></div><div><small>Next due</small><b>${d.nextDue ? fmtDate(d.nextDue) : '—'}</b></div>${mo ? `<div style="grid-column:1/-1"><small>At this pace</small><b>Paid off by ${(() => { const dt = parse(addMonths(d.nextDue || TODAY, mo - 1)); return MN[dt.getMonth()] + ' ' + dt.getFullYear() })()}</b></div>` : ''}` : `<div><small>Total lent</small><b>${inr(d.total)}</b></div><div><small>Since</small><b>${d.since ? fmtDate(d.since) : '—'}</b></div>`}</div></div>
    <div class="acts">${left > 0 ? `<button class="btn pri sm" data-act="dpay" data-id="${d.id}" type="button">${isLoan ? 'Record payment' : 'Record repayment'}</button>` : ''}<button class="btn sm" data-act="editdebt" data-id="${d.id}" type="button">${ic('edit')}Edit</button></div></div>`
    };
    return `${head('Debts', 'Loans you repay and money others owe you', '<button class="btn" data-act="newdebt" type="button">' + ic('plus') + '<span class="hide-m">New debt</span></button>')}
  <section class="grid g-2e rise" style="--i:1"><div class="card kpi"><span class="l">${ic('debt')}You owe</span><span class="num v">${cu(owe)}</span><span class="hint">${loans.filter(d => !d.closed && debtLeft(d) > 0).length} active loans</span></div>
  <div class="card kpi"><span class="l">${ic('wallet')}Owed to you</span><span class="num v pos">${cu(owed)}</span><span class="hint">${lent.filter(d => debtLeft(d) > 0).length} people</span></div></section>
  <section class="grid g-2e">${S.debts.length ? S.debts.map(card).join('') : '<div class="card empty">No debts recorded. Add a loan to track EMIs and get reminders.</div>'}</section>`
  }

  function viewInvest() {
    const h = holdings(), tot = h.reduce((s, x) => s + x.invested, 0), val = h.reduce((s, x) => s + x.value, 0), gain = val - tot;
    const hist = months().slice(-6), by = hist.map(m => ({ m, v: mstats(m).inv }));
    CH.inv = W => {
      const H = 200, pl = 44, pr = 8, pt = 12, pb = 28, mx = niceMax(Math.max(1, ...by.map(b => b.v))), y = v => pt + (1 - v / mx) * (H - pt - pb), gw = (W - pl - pr) / by.length, bw = Math.min(34, gw * .5);
      let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Invested per month"><g class="axis">`; for (let k = 0; k <= 4; k++) { const v = mx * k / 4; s += `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text x="${pl - 8}" y="${y(v) + 4}" text-anchor="end">${cmp(v)}</text>` }
      by.forEach((b, i) => { s += `<text x="${pl + gw * i + gw / 2}" y="${H - 8}" text-anchor="middle">${MN[+b.m.slice(5) - 1]}</text>` }); s += '</g>';
      by.forEach((b, i) => { const hh = Math.max(b.v ? 3 : 0, H - pb - y(b.v)); s += `<rect class="bar" style="--d:${i}" data-tip="${mLabel(b.m)}|Invested ${inr(b.v)}" x="${pl + gw * i + gw / 2 - bw / 2}" y="${H - pb - hh}" width="${bw}" height="${hh}" rx="6" fill="var(--c3)"/>` }); return s + '</svg>'
    };
    const parts = h.map((x, i) => ({ l: x.name, v: x.invested, c: ['var(--c3)', 'var(--c1)', 'var(--c2)', 'var(--c4)', 'var(--c5)', 'var(--c6)', 'var(--c7)'][i % 7] }));
    return `${head('Investments', 'Everything you have put away, grouped by name', `<button class="btn" data-act="newinv" type="button">${ic('plus')}<span class="hide-m">Add investment</span></button>`)}
  <section class="grid g-3 rise" style="--i:1">
    <div class="card kpi"><span class="l">Invested</span><span class="num v">${cu(tot)}</span><span class="hint">${h.reduce((s, x) => s + x.n, 0)} contributions</span></div>
    <div class="card kpi"><span class="l">Current value</span><span class="num v" style="color:var(--accent)">${cu(val)}</span><span class="hint">edit each holding to update</span></div>
    <div class="card kpi"><span class="l">Gain</span><span class="num v ${gain >= 0 ? 'pos' : ''}" style="${gain < 0 ? 'color:var(--crit)' : ''}">${gain >= 0 ? '+' : ''}${cu(gain)}</span><span class="hint">${tot ? (gain / tot * 100).toFixed(1) + '% on invested' : '—'}</span></div></section>
  <section class="grid g-2">
    <div class="card rise" style="--i:2"><h2>Invested each month</h2><p class="sub">Last ${by.length} months</p><div class="cb" data-ch="inv" style="height:200px"></div></div>
    <div class="card rise" style="--i:3"><h2>Allocation</h2><p class="sub">Share of money invested</p>${h.length ? `<div class="donutwrap"><div class="donut">${donut(parts, tot, 'Allocation')}<div class="mid"><b class="num" style="font-size:20px">${cmp(tot)}</b><small>invested</small></div></div><div class="dleg">${parts.map(p => `<div>${sw(p.c)}<span class="n">${esc(p.l)}</span><b>${Math.round(p.v / tot * 100)}%</b></div>`).join('')}</div></div>` : '<div class="empty">Add your first investment.</div>'}</div></section>
  <section class="card rise" style="--i:4"><h2>Holdings</h2><p class="sub">Current value starts at what you invested. Tap edit after checking your app or passbook.</p><div class="list">${h.map(x => {
      const g = x.value - x.invested; return `<div class="row"><span class="ic" style="color:var(--c3)">${ic('trend')}</span><div class="t"><b>${esc(x.name)}</b><small>${x.n} contribution${x.n === 1 ? '' : 's'} · last ${fmtDate(x.last)}</small></div>
    <div class="r"><b class="num">${inr(x.value)}</b><span style="display:flex;gap:6px;align-items:center"><span class="hint">invested ${inr(x.invested)}</span><button class="btn sm icon-btn" style="width:34px;min-height:34px" data-act="editinv" data-key="${esc(x.key)}" type="button" aria-label="Edit value of ${esc(x.name)}">${ic('edit')}</button></span></div></div>`
    }).join('') || '<div class="empty">No investments yet.</div>'}</div></section>`
  }

  /* ---------- render ---------- */
  function render(anim) {
    RATE = +S.settings.rate > 0 ? +S.settings.rate : 23.5; if (anim) animate();
    $('#nav').innerHTML = NAV.map(([k, i, l]) => { const n = k === 'bills' ? alerts().filter(a => a.r).length : 0; return `<button type="button" data-go="${k}" ${VIEW === k ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${n ? `<span class="cnt">${n}</span>` : ''}</button>` }).join('');
    $('#tabbar').innerHTML = NAV.map(([k, i, l]) => { const n = k === 'bills' ? alerts().filter(a => a.r).length : 0; return `<button type="button" data-go="${k}" ${VIEW === k ? 'aria-current="page"' : ''}>${ic(i)}<span>${l}</span>${n ? `<span class="cnt">${n}</span>` : ''}</button>` }).join('');
    $('#view').innerHTML = ({ overview: viewOverview, activity: viewActivity, bills: viewBills, debts: viewDebts, investments: viewInvest })[VIEW]();
    drawCharts(); countUp();
    const th = S.settings.theme || document.documentElement.dataset.theme;
  }
  function go(v) { VIEW = v; try { history.replaceState(null, '', '#' + v) } catch (e) { } closeBell(); window.scrollTo({ top: 0 }); render(true) }

  /* ---------- modals ---------- */
  function modal(html, mount) { closeModal(true); const o = $('#overlay'); o.innerHTML = `<div class="scrim"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`; const f = o.querySelector('input,select,textarea'); if (mount) mount(o); setTimeout(() => { (o.querySelector('[autofocus]') || f) && (o.querySelector('[autofocus]') || f).focus() }, 30) }
  function closeModal(now) { const o = $('#overlay'), sc = o.firstChild; if (!sc) return; if (now || reduce) { o.innerHTML = ''; return } sc.classList.add('out'); setTimeout(() => { if (o.firstChild === sc) o.innerHTML = '' }, 170) }
  const fld = (l, id, inner, hint) => `<div class="f"><label for="${id}">${l}</label>${inner}${hint ? `<span class="hint">${hint}</span>` : ''}</div>`;
  const opts = (arr, sel) => arr.map(c => `<option ${c === sel ? 'selected' : ''}>${esc(c)}</option>`).join('');
  function txnModal(t, pre) {
    const edit = !!(t && t.id); t = t || { type: 'out', cat: 'Family Expenses', date: TODAY, note: '', amt: '', w: 'main' }; if (pre) t = { ...t, ...pre }; let type = t.type;
    modal(`<h2>${edit ? 'Edit entry' : 'Add entry'}</h2><div class="seg" role="group" aria-label="Entry type"><button type="button" id="sOut" aria-pressed="${type === 'out'}">Money out</button><button type="button" id="sIn" aria-pressed="${type === 'in'}">Money in</button></div>
  <div class="f2">${fld('Amount', 'ta', `<input id="ta" type="number" inputmode="decimal" min="0" step="any" value="${t.amt}" placeholder="0">`)}${fld('Date', 'td', `<input id="td" type="date" value="${t.date}">`)}</div>
  ${fld('Category', 'tc', `<select id="tc"></select>`)}${fld('Note', 'tn', `<input id="tn" type="text" value="${esc(t.note)}" placeholder="e.g. Groceries" list="notes">`)}
  <datalist id="notes">${[...new Set(S.txns.map(x => x.note))].slice(0, 200).map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    <p class="hint" id="terr" style="color:var(--crit);min-height:1.2em;margin:0 0 6px"></p>
  <div class="mact">${edit ? '<button class="btn danger" id="tdel" type="button" style="margin-right:auto">Delete</button>' : ''}<button class="btn" data-close="1" type="button">Cancel</button><button class="btn pri" id="tsave" type="button">${edit ? 'Save changes' : 'Add entry'}</button></div>`, o => {
      const fill = () => { const list = type === 'out' ? EXP : INC; const cur = list.includes(t.cat) ? t.cat : list[0]; $('#tc').innerHTML = opts(list, cur); $('#sOut').setAttribute('aria-pressed', type === 'out'); $('#sIn').setAttribute('aria-pressed', type === 'in'); t.cat = cur }; fill();
      $('#sOut').onclick = () => { type = 'out'; fill() }; $('#sIn').onclick = () => { type = 'in'; fill() };
      $('#tsave').onclick = () => {
        const amt = parseFloat($('#ta').value), date = $('#td').value, note = $('#tn').value.trim();
        if (!(amt > 0)) { $('#terr').textContent = 'Enter an amount greater than zero.'; return } if (!date) { $('#terr').textContent = 'Pick a date.'; return }
        const rec = { type, cat: $('#tc').value, date, note: note || $('#tc').value, amt, w: 'main' };
        change(() => { if (edit) Object.assign(S.txns.find(x => x.id === t.id) || (S.txns.push({ id: t.id }), S.txns[S.txns.length - 1]), rec); else S.txns.push({ id: uid('t'), ...rec }); if (!months().includes(MONTH)) MONTH = date.slice(0, 7) }, edit ? 'Entry updated' : 'Entry added'); closeModal()
      };
      if (edit) $('#tdel').onclick = () => { change(() => { S.txns = S.txns.filter(x => x.id !== t.id) }, 'Entry deleted'); closeModal() }
    })
  }

  function billModal(b) {
    const edit = !!b; b = b || { name: '', amt: '', cat: 'Bills & Utilities', freq: 'monthly', nextDue: addDays(TODAY, 7) };
    modal(`<h2>${edit ? 'Edit bill' : 'New bill'}</h2>${fld('Name', 'bn', `<input id="bn" type="text" value="${esc(b.name)}" placeholder="e.g. Electricity">`)}
  <div class="f2">${fld('Amount (₹)', 'ba', `<input id="ba" type="number" inputmode="decimal" min="0" step="any" value="${b.amt}">`)}${fld('Next due date', 'bd', `<input id="bd" type="date" value="${b.nextDue}">`)}</div>
  <div class="f2">${fld('Repeats', 'bf', `<select id="bf">${['monthly', 'weekly', 'yearly', 'once'].map(f => `<option ${f === b.freq ? 'selected' : ''}>${f}</option>`).join('')}</select>`)}${fld('Category', 'bc', `<select id="bc">${opts(EXP, b.cat)}</select>`)}</div>
  <p class="hint" id="berr" style="color:var(--crit);min-height:1.2em;margin:0 0 6px"></p>
  <div class="mact">${edit ? '<button class="btn danger" id="bdel" type="button" style="margin-right:auto">Delete</button>' : ''}<button class="btn" data-close="1" type="button">Cancel</button><button class="btn pri" id="bsave" type="button">${edit ? 'Save changes' : 'Add bill'}</button></div>`, () => {
      $('#bsave').onclick = () => {
        const name = $('#bn').value.trim(), amt = parseFloat($('#ba').value), due = $('#bd').value; if (!name) { $('#berr').textContent = 'Give the bill a name.'; return } if (!(amt > 0)) { $('#berr').textContent = 'Enter an amount greater than zero.'; return } if (!due) { $('#berr').textContent = 'Pick the next due date.'; return }
        const rec = { name, amt, nextDue: due, freq: $('#bf').value, cat: $('#bc').value, day: +due.slice(8), sample: false, done: false }; change(() => { if (edit) Object.assign(S.bills.find(x => x.id === b.id) || (S.bills.push({ id: b.id }), S.bills[S.bills.length - 1]), rec); else S.bills.push({ id: uid('b'), ...rec }) }, edit ? 'Bill updated' : 'Bill added'); closeModal()
      };
      if (edit) $('#bdel').onclick = () => { change(() => { S.bills = S.bills.filter(x => x.id !== b.id) }, 'Bill deleted'); closeModal() }
    })
  }

  function debtModal(d) {
    const edit = !!d; d = d || { kind: 'loan', name: '', total: '', emi: '', day: 5, nextDue: addDays(TODAY, 10), paidBefore: 0 };
    modal(`<h2>${edit ? 'Edit debt' : 'New debt'}</h2><div class="seg" role="group" aria-label="Debt type"><button type="button" id="kLoan" aria-pressed="${d.kind === 'loan'}">I owe</button><button type="button" id="kLent" aria-pressed="${d.kind === 'lent'}">Owed to me</button></div>
  ${fld('Name', 'dn', `<input id="dn" type="text" value="${esc(d.name)}" placeholder="e.g. Bike loan, or a friend's name">`)}
  <div class="f2">${fld('Total amount (₹)', 'dt', `<input id="dt" type="number" inputmode="decimal" min="0" step="any" value="${d.total}">`)}${fld('Already paid (₹)', 'dp', `<input id="dp" type="number" inputmode="decimal" min="0" step="any" value="${d.paidBefore || 0}">`, 'Paid before you started tracking')}</div>
  <div class="f2" id="emiRow">${fld('Monthly EMI (₹)', 'de', `<input id="de" type="number" inputmode="decimal" min="0" step="any" value="${d.emi || ''}">`)}${fld('Next EMI date', 'dd', `<input id="dd" type="date" value="${d.nextDue || addDays(TODAY, 10)}">`)}</div>
  <p class="hint" id="derr" style="color:var(--crit);min-height:1.2em;margin:0 0 6px"></p>
  <div class="mact">${edit ? '<button class="btn danger" id="ddel" type="button" style="margin-right:auto">Delete</button>' : ''}<button class="btn" data-close="1" type="button">Cancel</button><button class="btn pri" id="dsave" type="button">${edit ? 'Save changes' : 'Add debt'}</button></div>`, () => {
      let kind = d.kind; const sync = () => { $('#kLoan').setAttribute('aria-pressed', kind === 'loan'); $('#kLent').setAttribute('aria-pressed', kind === 'lent'); $('#emiRow').hidden = kind !== 'loan' }; sync();
      $('#kLoan').onclick = () => { kind = 'loan'; sync() }; $('#kLent').onclick = () => { kind = 'lent'; sync() };
      $('#dsave').onclick = () => {
        const name = $('#dn').value.trim(), total = parseFloat($('#dt').value), emi = parseFloat($('#de').value) || 0; if (!name) { $('#derr').textContent = 'Give this debt a name.'; return } if (!(total > 0)) { $('#derr').textContent = 'Enter the total amount.'; return } if (kind === 'loan' && !(emi > 0)) { $('#derr').textContent = 'Enter the monthly EMI so reminders work.'; return }
        const nd = $('#dd').value; const rec = { kind, name, total, emi, paidBefore: parseFloat($('#dp').value) || 0, nextDue: kind === 'loan' ? nd : null, day: kind === 'loan' ? +nd.slice(8) : null, est: false, since: d.since || TODAY };
        change(() => { if (edit) Object.assign(S.debts.find(x => x.id === d.id) || (S.debts.push({ id: d.id }), S.debts[S.debts.length - 1]), rec); else S.debts.push({ id: uid('d'), ...rec }) }, edit ? 'Debt updated' : 'Debt added'); closeModal()
      };
      if (edit) $('#ddel').onclick = () => { change(() => { S.debts = S.debts.filter(x => x.id !== d.id) }, 'Debt deleted'); closeModal() }
    })
  }
  function dpayModal(d) {
    const isLoan = d.kind === 'loan'; modal(`<h2>${isLoan ? 'Record payment' : 'Record repayment'}</h2><p class="hint" style="margin-top:-6px">${esc(d.name)} · ${inr(debtLeft(d))} remaining</p>
  <div class="f2">${fld('Amount (₹)', 'pa', `<input id="pa" type="number" inputmode="decimal" min="0" step="any" value="${isLoan ? Math.min(d.emi, debtLeft(d)) : ''}">`)}${fld('Date', 'pd', `<input id="pd" type="date" value="${TODAY}">`)}</div>
  <p class="hint" id="perr" style="color:var(--crit);min-height:1.2em;margin:0 0 6px"></p><div class="mact"><button class="btn" data-close="1" type="button">Cancel</button><button class="btn pri" id="psave" type="button">Save payment</button></div>`, () => {
      $('#psave').onclick = () => {
        const a = parseFloat($('#pa').value); if (!(a > 0)) { $('#perr').textContent = 'Enter an amount greater than zero.'; return }
        change(() => {
          const dd = S.debts.find(x => x.id === d.id); S.txns.push({ id: uid('t'), date: $('#pd').value || TODAY, type: isLoan ? 'out' : 'in', cat: isLoan ? 'EMI' : 'Income', note: isLoan ? d.name + ' EMI' : 'Repaid by ' + d.name, amt: a, w: 'main', debtId: d.id });
          if (isLoan && dd.nextDue && a >= Math.min(dd.emi, debtLeft(d))) dd.nextDue = advance({ nextDue: dd.nextDue, freq: 'monthly', day: dd.day })
        }, isLoan ? 'Payment saved' : 'Repayment saved')
        closeModal()
      }
    })
  }
  function invModal(key) {
    const h = holdings().find(x => x.key === key);
    modal(`<h2>Update value</h2><p class="hint" style="margin-top:-6px">${esc(h.name)} · ${inr(h.invested)} invested</p>${fld('Current value (₹)', 'iv', `<input id="iv" type="number" inputmode="decimal" min="0" step="any" value="${h.value}">`, 'Check your app or passbook for today\'s value.')}
  <div class="mact"><button class="btn" data-close="1" type="button" style="margin-right:auto" id="ireset">Reset to invested</button><button class="btn" data-close="1" type="button">Cancel</button><button class="btn pri" id="isave" type="button">Save value</button></div>`, () => {
      $('#isave').onclick = () => { const v = parseFloat($('#iv').value); if (!(v >= 0)) return; change(() => { S.inv[key] = v }, 'Value updated'); closeModal() }; $('#ireset').onclick = e => { e.stopPropagation(); change(() => { delete S.inv[key] }, 'Value reset'); closeModal() }
    })
  }
  function budgetModal() {
    modal(`<h2>Monthly budgets</h2><p class="hint" style="margin-top:-6px">Leave a field empty to switch that budget off.</p>${EXP.filter(c => c !== 'Investment').map((c, i) => fld(c, 'bg' + i, `<input id="bg${i}" type="number" inputmode="decimal" min="0" step="any" value="${S.budgets[c] || ''}" placeholder="No limit">`)).join('')}
  <div class="mact"><button class="btn" data-close="1" type="button">Cancel</button><button class="btn pri" id="bgs" type="button">Save budgets</button></div>`, () => {
      $('#bgs').onclick = () => { change(() => { EXP.filter(c => c !== 'Investment').forEach((c, i) => { const v = parseFloat($('#bg' + i).value); if (v > 0) S.budgets[c] = v; else delete S.budgets[c] }) }, 'Budgets saved', { anim: true }); closeModal() }
    })
  }
  function settingsModal() {
    modal(`<h2>Settings</h2>
  ${fld('Remind me before a payment is due', 'sl', `<select id="sl">${[1, 2, 3, 5, 7, 10, 14].map(n => `<option value="${n}" ${n === S.settings.lead ? 'selected' : ''}>${n} day${n > 1 ? 's' : ''} before</option>`).join('')}</select>`)}
  ${fld('Low balance warning (₹)', 'sb', `<input id="sb" type="number" min="0" step="any" value="${S.settings.lowBal}">`)}
  ${fld('Opening balance on 1 Jul 2026 (₹)', 'so', `<input id="so" type="number" step="any" value="${S.opening}">`, 'The "Previous balance" from your first month.')}
  <div class="f"><label>Phone and browser alerts</label><button class="btn" id="sn" type="button">${ic('bell')}<span id="snt">${S.settings.browser ? 'Alerts are on' : 'Turn on alerts'}</span></button><span class="hint" id="snh">Shows a system notification for bills due soon when you open My Money. Browsers that block this keep the in-app alerts.</span></div>
  <div class="f"><label>Your data</label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="sx" type="button">${ic('down')}Export backup</button><label class="btn sm" for="si" style="cursor:pointer">${ic('up')}Import backup</label><input id="si" type="file" accept="application/json" hidden></div>
  <span class="hint">${API ? 'Your data syncs to your Google Sheet. A backup file is a second copy.' : 'No Google Sheet connected yet. Data is saved in this browser only.'}</span></div>
  <div class="f"><label>Reset</label><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm" id="sc" type="button">Remove sample bills</button><button class="btn sm danger" id="sr" type="button">Reset to spreadsheet data</button></div><span class="hint" id="srh"></span></div>
  <div class="mact"><button class="btn" data-close="1" type="button">Cancel</button><button class="btn pri" id="ss" type="button">Save settings</button></div>`, () => {
      $('#ss').onclick = () => { change(() => { S.settings.lead = +$('#sl').value; S.settings.lowBal = parseFloat($('#sb').value) || 0; S.opening = parseFloat($('#so').value) || 0 }, 'Settings saved', { anim: true }); closeModal() };
      $('#sn').onclick = async () => { try { if (!('Notification' in window)) throw 0; const p = await Notification.requestPermission(); S.settings.browser = p === 'granted'; save(); $('#snt').textContent = p === 'granted' ? 'Alerts are on' : 'Turn on alerts'; $('#snh').textContent = p === 'granted' ? 'You will get a system notification for upcoming bills.' : 'Permission was not granted. In-app alerts still work.' } catch (e) { $('#snh').textContent = 'This view cannot show system notifications. In-app alerts and the bell still work.' } };
      $('#sx').onclick = async () => { const data = JSON.stringify(S, null, 2), name = 'mymoney-backup-' + TODAY + '.json'; try { if (window.claude && claude.use) { const dl = await claude.use('downloads'); if (dl) { await dl.save({ filename: name, data }); toast('Backup ready'); return } } const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Backup downloaded') } catch (e) { $('#srh').textContent = 'Could not create the backup file.' } };
      $('#si').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const d = JSON.parse(r.result); if (!d.txns) throw 0; d.txns = d.txns.filter(t => t.w !== 'trip'); S = d; save(); closeModal(); MONTH = months().filter(m => m <= TODAY.slice(0, 7)).pop(); render(true); toast('Backup imported') } catch (_) { $('#srh').textContent = 'That file is not a My Money backup.' } }; r.readAsText(f) };
      $('#sc').onclick = () => { change(() => { S.bills = S.bills.filter(b => !b.sample) }, 'Sample bills removed'); closeModal() };
      let armed = false; $('#sr').onclick = () => { if (!armed) { armed = true; $('#sr').textContent = 'Tap again to confirm'; $('#srh').textContent = 'This replaces every entry with the data from your spreadsheet.'; return } S = seed(); save(); closeModal(); MONTH = months().filter(m => m <= TODAY.slice(0, 7)).pop(); render(true); toast('Reset to spreadsheet data') }
    })
  }

  function pay(k, id) {
    if (k === 'bill') { const b = S.bills.find(x => x.id === id); if (!b) return; change(() => { S.txns.push({ id: uid('t'), date: TODAY, type: 'out', cat: b.cat, note: b.name, amt: b.amt, w: 'main', billId: b.id }); if (b.freq === 'once') b.done = true; else b.nextDue = advance(b) }, b.name + ' marked paid') }
    else { const d = S.debts.find(x => x.id === id); if (!d) return; const a = Math.min(d.emi, debtLeft(d)); change(() => { S.txns.push({ id: uid('t'), date: TODAY, type: 'out', cat: 'EMI', note: d.name + ' EMI', amt: a, w: 'main', debtId: d.id }); d.nextDue = advance({ nextDue: d.nextDue, freq: 'monthly', day: d.day }) }, d.name + ' EMI marked paid') }
  }

  /* ---------- bell ---------- */
  function closeBell(now) { const p = $('#bellPanel'); if (!p) return; if (now || reduce) { p.remove(); return } p.id = ''; p.classList.add('out'); setTimeout(() => p.remove(), 180) }
  function refreshBell() { const p = $('#bellPanel'); if (p) { p.remove(); openBell(true) } }
  function openBell(quiet) {
    if ($('#bellPanel')) { closeBell(); return } const al = alerts(); const el = document.createElement('div'); el.className = 'panel' + (quiet ? ' still' : ''); el.id = 'bellPanel';
    el.innerHTML = `<div class="chd"><div><h2 style="font-size:18px">Notifications</h2><p class="sub">${al.length ? al.length + ' need attention' : 'You are all caught up'}</p></div><button class="btn sm icon-btn" style="width:34px;min-height:34px" data-act="closebell" type="button" aria-label="Close">${ic('x')}</button></div>
  <div class="list">${al.length ? al.map((a, i) => `<div class="row"><span class="ic ${a.sev === 'info' ? 'info' : a.sev}">${ic(a.r ? 'bill' : 'alert')}</span><div class="t"><b style="white-space:normal">${esc(a.title)}</b><small>${esc(a.text)}</small></div><div class="r">${a.r ? `<button class="btn sm" data-act="pay" data-k="${a.r.k}" data-id="${a.r.id}" type="button">Paid</button>` : ''}<button class="btn sm" data-act="dismiss" data-key="${esc(a.key)}" type="button" aria-label="Dismiss for today">${ic('x')}</button></div></div>`).join('') : '<div class="empty">No bills or budgets need attention.</div>'}</div>`;
    document.body.appendChild(el)
  }
  async function systemNotify() { if (!S.settings.browser) return; try { const al = alerts().filter(a => a.r); if (!al.length || sessionStorage.getItem('MyMoney.n') === TODAY) return; new Notification('My Money · ' + al.length + ' payment' + (al.length > 1 ? 's' : '') + ' need attention', { body: al.slice(0, 3).map(a => a.title).join('\n') }); sessionStorage.setItem('MyMoney.n', TODAY) } catch (e) { } }

  /* ---------- events ---------- */
  let downEl = null; document.addEventListener('mousedown', e => { downEl = e.target }, true); document.addEventListener('touchstart', e => { downEl = e.target }, { passive: true, capture: true });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-act],[data-go],[data-close]');
    if (e.target.matches('.scrim')) { if (downEl === e.target) closeModal(); return }
    if (!t) { const p = $('#bellPanel'); if (p && !p.contains(e.target)) closeBell(); return }
    if (t.dataset.close) { closeModal(); return }
    if (t.dataset.go) { go(t.dataset.go); return }
    const a = t.dataset.act, id = t.dataset.id;
    if (a === 'bell') openBell(); else if (a === 'closebell') closeBell();
    else if (a === 'add') txnModal(); else if (a === 'edit') { const r = S.txns.find(x => x.id === id); r ? txnModal(r) : toast('That entry no longer exists') }
    else if (a === 'pay') { const had = !!$('#bellPanel'); pay(t.dataset.k, id); if (had) refreshBell() }
    else if (a === 'dismiss') { S.dismissed[t.dataset.key] = TODAY; save(); render(); refreshBell() }
    else if (a === 'settings') { closeBell(); settingsModal() } else if (a === 'budgets') budgetModal();
    else if (a === 'newbill') billModal(); else if (a === 'editbill') { const r = S.bills.find(x => x.id === id); r ? billModal(r) : toast('That bill no longer exists') }
    else if (a === 'newdebt') debtModal(); else if (a === 'editdebt' || a === 'dpay') { const r = S.debts.find(x => x.id === id); r ? (a === 'dpay' ? dpayModal(r) : debtModal(r)) : toast('That debt no longer exists') }
    else if (a === 'newinv') txnModal(null, { type: 'out', cat: 'Investment' }); else if (a === 'editinv') invModal(t.dataset.key);
    else if (a === 'more') { F.limit += 60; render() }
   
  });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches && e.target.matches('.modal input:not([type=file])') && e.target.id !== 'tn') { const b = e.target.closest('.modal').querySelector('.mact .btn.pri'); if (b) { e.preventDefault(); b.click() } } if (e.key === 'Escape') { closeModal(); closeBell() } if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.row.clickable')) { e.preventDefault(); e.target.click() } });
  document.addEventListener('change', e => {
    const id = e.target.id;
    if (id === 'monthSel') { MONTH = e.target.value; S.month = MONTH; save(); render(true) }
    else if (id === 'ft') { F.type = e.target.value; F.limit = 60; render() } else if (id === 'fc') { F.cat = e.target.value; F.limit = 60; render() } else if (id === 'fm') { F.m = e.target.value; F.limit = 60; render() } else if (id === 'fw') { F.w = e.target.value; F.limit = 60; render() }
  });
  let qt; document.addEventListener('input', e => { if (e.target.id === 'fq') { clearTimeout(qt); const v = e.target.value; qt = setTimeout(() => { F.q = v; F.limit = 60; render(); const i = $('#fq'); if (i) { i.focus(); i.setSelectionRange(v.length, v.length) } }, 180) } });
  /* tooltip */
  const tip = $('#tip');
  function showTip(html, x, y) { tip.innerHTML = html; tip.style.display = 'block'; const w = tip.offsetWidth, h = tip.offsetHeight; tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, x + 14)) + 'px'; tip.style.top = Math.max(8, y - h - 12) + 'px' }
  const tipHtml = s => s.split('|').map((p, i) => i ? `<span>${esc(p)}</span>` : `<b>${esc(p)}</b>`).join('');
  document.addEventListener('mousemove', e => {
    const ar = e.target.closest('[data-area]');
    if (ar) {
      const A = AREA[ar.dataset.area]; if (A) {
        const r = ar.getBoundingClientRect(), x = e.clientX - r.left; let bi = 0, bd = 1e9; A.pts.forEach((p, i) => { const d = Math.abs(p[0] - x); if (d < bd) { bd = d; bi = i } }); const p = A.pts[bi];
        const xh = ar.querySelector('.xh'), xd = ar.querySelector('.xd'); xh.setAttribute('x1', p[0]); xh.setAttribute('x2', p[0]); xh.setAttribute('opacity', '.6'); xd.setAttribute('cx', p[0]); xd.setAttribute('cy', p[1]); xd.setAttribute('opacity', '1');
        showTip(tipHtml('Day ' + A.labels[bi] + '|Spent ' + inr(A.vals[bi])), e.clientX, e.clientY); return
      }
    }
    const t = e.target.closest('[data-tip]'); if (t) showTip(tipHtml(t.dataset.tip), e.clientX, e.clientY); else tip.style.display = 'none'
  });
  document.addEventListener('mouseout', e => { if (e.target.closest && e.target.closest('[data-area]')) { const ar = e.target.closest('[data-area]'); ar.querySelector('.xh') && ar.querySelector('.xh').setAttribute('opacity', '0'); ar.querySelector('.xd') && ar.querySelector('.xd').setAttribute('opacity', '0'); tip.style.display = 'none' } });
  document.addEventListener('touchstart', () => { tip.style.display = 'none' }, { passive: true });
  /* theme */
  function applyTheme(t) { if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme }
  applyTheme(S.settings.theme);
  $('#themeBtn').onclick = () => { const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches; S.settings.theme = dark ? 'light' : 'dark'; applyTheme(S.settings.theme); save(); render() };
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(drawCharts, 120) });
  addEventListener('hashchange', () => { const v = location.hash.slice(1); if (['overview', 'activity', 'bills', 'debts', 'investments'].includes(v) && v !== VIEW) go(v) });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState !== 'visible') return; if (iso(new Date()) !== TODAY && !$('#overlay').firstChild) { location.reload(); return } if (API && !pushing && !dirty && !$('#overlay').firstChild) pull(true) });
  addEventListener('beforeunload', e => { if (dirty || pushing) { e.preventDefault(); e.returnValue = '' } });
  /* ---------- one-time sign-in: the key is saved on this device and there is no sign-out ---------- */
  function showLogin(done) {
    const L = $('#login'), f = $('#loginForm'), err = $('#lerr'), btn = $('#lgo'), dark = (S.settings.theme || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light')) === 'dark';
    document.querySelector('.llogo').src = dark ? 'img/logo-dark.png' : 'img/logo.png'; L.hidden = false; err.textContent = ''; setTimeout(() => $('#lkey').focus(), 50);
    $('#lshow').onclick = () => { const i = $('#lkey'), hid = i.type === 'password'; i.type = hid ? 'text' : 'password'; $('#lshow').textContent = hid ? 'Hide' : 'Show' };
    f.onsubmit = async e => {
      e.preventDefault(); const k = $('#lkey').value.trim(); if (!k) return; btn.disabled = true; btn.textContent = 'Checking…'; err.textContent = '';
      try {
        const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'load', token: k }) }); const j = await r.json(); if (!j.ok) throw new Error(j.error || 'Sign-in failed');
        try { localStorage.setItem(KK, k) } catch (x) { } try { navigator.storage && navigator.storage.persist && navigator.storage.persist() } catch (x) { }
        $('#lkey').value = ''; $('#lkey').type = 'password'; $('#lshow').textContent = 'Show'; L.hidden = true; done()
      } catch (x) { err.textContent = /password|token/i.test(x.message) ? 'Wrong password. Try again.' : 'Could not reach the server. Check your internet and try again.'; f.classList.remove('shakeX'); void f.offsetWidth; f.classList.add('shakeX') }
      btn.disabled = false; btn.textContent = 'Sign in'
    }
  }
  function relogin() { try { localStorage.removeItem(KK) } catch (e) { } setSync('Password changed. Sign in again.', 'err'); showLogin(() => pull(true)) }
  function boot() {
  render(true);
    if (API) pull(); else setSync('Saved in this browser only. Add your API_URL in js/config.js to use Google Sheets.', '');
    setTimeout(() => { const al = alerts().filter(a => a.r); if (al.length) toast(al.length + ' payment' + (al.length > 1 ? 's' : '') + ' need attention. Open the bell to see them.'); systemNotify() }, 900);
  }
  if (API && !getKey()) showLogin(boot); else boot();
})();
