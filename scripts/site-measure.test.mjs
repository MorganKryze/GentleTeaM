#!/usr/bin/env node
// Measures the built docs site in a real browser against the docs-site spec's rendered rules:
// A8 one visible pager with a Next card, A15 the loop's edges at 360, A17 overflow, A18 diagram
// labels, A19 the home figure row, A20 the Roles term list, A21 measure and side bands, A22
// contrast (search dialog included), A23 targets, A24 amber, A25 dark diagrams and the toggle,
// A26 one h1, heading order and the menu control, A27 fonts from the site's origin, and
// tables at 360 and 390 whose second column starts inside the viewport. Requests to
// other origins are listed, not failed.
// A axe-core pass runs the WCAG 2.1 A and AA rules on every page, width and mode: 0 violations.
// Needs the build (`npx -y @docmd/core@0.9.7 build` in <repo>), Playwright 1.64.0 and axe-core
// 4.10.3, found by normal module resolution or in the folder PLAYWRIGHT_PATH names:
//   npm i --prefix <folder> playwright@1.64.0 axe-core@4.10.3
// No other dependencies.
//
// Usage: node scripts/site-measure.test.mjs <repo> [--pages /,/reference/roles/] [--widths 360,1920]
//                                          [--only A17,A19,axe] [--json <file>]
// One PASS or FAIL line per line, details indented; exit 1 on any FAIL.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync, writeFileSync } from 'node:fs';
import { join, extname, resolve as resolvePath, sep } from 'node:path';
import { createRequire } from 'node:module';

const argv = process.argv.slice(2);
const opt = k => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
const repo = argv[0];
if (!repo || repo.startsWith('-')) { console.error('usage: node scripts/site-measure.test.mjs <repo> [--pages ...] [--widths ...] [--only ...] [--json f]'); process.exit(2); }
const root = resolvePath(repo, 'site');
if (!existsSync(join(root, 'index.html'))) { console.error('no build: run `npx -y @docmd/core@0.9.7 build` in the repo first'); process.exit(2); }
const BASE = '/GentleTeaM';
const widths = (opt('--widths') || '360,390,1280,1440,1920,2560').split(',').map(Number);
const only = opt('--only') ? opt('--only').split(',') : null;
const want = id => !only || only.includes(id);
let pages = opt('--pages') ? opt('--pages').split(',') : null;
if (!pages) {
  const walk = (d, out = []) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) { if (!['okf', 'assets', '_docmd-search'].includes(n)) walk(p, out); } else if (n === 'index.html') out.push(p); } return out; };
  pages = walk(root).map(p => p.slice(root.length).replace(/index\.html$/, '') || '/').sort();
}

// A module from normal resolution first, then from the folder PLAYWRIGHT_PATH names.
const requirers = [createRequire(import.meta.url)];
if (process.env.PLAYWRIGHT_PATH) requirers.push(createRequire(join(process.env.PLAYWRIGHT_PATH, 'package.json')));
const resolve = name => { for (const r of requirers) { try { return { mod: r(name), path: r.resolve(name) }; } catch {} } return null; };
const pw = resolve('playwright'); const axe = resolve('axe-core');
if (!pw || !axe) {
  console.error('Playwright or axe-core not found: npm i --prefix <folder> playwright@1.64.0 axe-core@4.10.3, then set PLAYWRIGHT_PATH=<folder>');
  process.exit(2);
}
const { chromium } = pw.mod;
const AXE_SRC = readFileSync(join(axe.path, '..', 'axe.min.js'), 'utf8');

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain', '.ico': 'image/x-icon', '.xml': 'application/xml' };
const server = createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(404).end(); return; }
  if (!p.startsWith(BASE)) { res.writeHead(404).end(); return; }
  // A decoded `..` may climb out of the build: serve nothing outside it.
  p = resolvePath(root, '.' + p.slice(BASE.length));
  if (p !== root && !p.startsWith(root + sep)) { res.writeHead(404).end(); return; }
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }).end(readFileSync(p));
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

// Runs in the page. Returns raw measures; the checks below judge them.
const inPage = ({ w, page }) => {
  const vw = innerWidth;
  const parse = s => { if (!s) return null; let m = s.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; } m = s.match(/color\(srgb ([^)]+)\)/); if (m) { const p = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] ?? 1]; } return null; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return +((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2); };
  const over = (t, b) => [0, 1, 2].map(i => t[i] * t[3] + b[i] * (1 - t[3])).concat(1);
  const bgOf = el => { const layers = []; for (let p = el; p && p.nodeType === 1; p = p.parentElement) { const c = parse(getComputedStyle(p).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } } let b = [255, 255, 255, 1]; for (const l of layers.reverse()) b = over(l, b); return b; };
  const vis = el => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity !== 0 && b.width > 0 && b.height > 0 && !el.closest('[hidden],[aria-hidden=true]'); };
  const desc = el => { const c = typeof el.className === 'string' ? el.className : el.className?.baseVal || ''; return el.tagName.toLowerCase() + (c.trim() ? '.' + c.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' "' + (el.textContent || '').trim().slice(0, 24).replace(/\s+/g, ' ') + '"'; };
  const scroller = el => { for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) { if (['auto', 'scroll'].includes(getComputedStyle(p).overflowX)) return p; } return null; };
  const hsl = c => { const [r, g, b] = c.slice(0, 3).map(v => v / 255); const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return [0, 0, l, d]; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; if (h < 0) h += 360; return [h, s, l, d]; };
  const amber = s => { const c = parse(s); if (!c || c[3] < 0.15) return false; const [h, sat, , d] = hsl(c); return h >= 20 && h <= 50 && sat >= 0.3 && d >= 0.11; };
  const out = { docOverflow: document.documentElement.scrollWidth - vw };
  const main = document.querySelector('.main-content') || document.body;

  // A17: elements past the right edge outside a scroll box
  out.over = [];
  for (const el of document.querySelectorAll('body *')) { if (!vis(el)) continue; const b = el.getBoundingClientRect(); if (b.right > vw + 0.5 && !scroller(el)) out.over.push(desc(el) + ' right=' + Math.round(b.right)); }
  out.over = out.over.slice(0, 6);

  // A18, A15: diagram label size, edges inside their frame
  out.diag = [...main.querySelectorAll('.mermaid svg[aria-roledescription]')].filter(vis).map(svg => {
    const vb = svg.viewBox.baseVal; const sc = vb && vb.width ? svg.getBoundingClientRect().width / vb.width : 1;
    let min = 99; for (const t of svg.querySelectorAll('text, foreignObject div, foreignObject span')) { if (!t.textContent.trim() || t.closest('defs')) continue; min = Math.min(min, parseFloat(getComputedStyle(t).fontSize) * (t.tagName === 'text' || t.closest('text') ? sc : 1)); }
    const frame = svg.closest('.docmd-mermaid-container') || svg.closest('.mermaid'); const fr = frame.getBoundingClientRect();
    const clipped = [...svg.querySelectorAll('.flowchart-link, .edgePath path, path.relation')].filter(p => { const b = p.getBoundingClientRect(); return b.width + b.height > 0 && (b.right > fr.right + 1 || b.left < fr.left - 1); }).length;
    return { min: +min.toFixed(1), clipped, loop: /correction round/i.test(svg.textContent), nodes: svg.querySelectorAll('g.node').length, h: Math.round(svg.getBoundingClientRect().height) };
  });

  // A19: the home figure card and the three explanations
  if (page === '/') {
    const fig = main.querySelector('.docmd-mermaid-container') || main.querySelector('.mermaid');
    const grids = [...main.querySelectorAll('.grids')].find(g => fig && (fig.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING));
    const items = grids ? [...grids.children].filter(e => e.classList.contains('grid-item')) : [];
    if (fig) { const F = fig.getBoundingClientRect(); out.row = { items: items.length, bad: items.map((e, i) => { const E = e.getBoundingClientRect(); const v = E.top < F.bottom - 1 && E.bottom > F.top + 1; const hz = !(E.left >= F.right - 1 || E.right <= F.left + 1); return v && !hz ? null : `explanation ${i + 1}: ${v ? '' : 'not beside the figure'}${hz ? ' overlaps it' : ''}`; }).filter(Boolean) }; }
  }

  // Characters per visual row of an element
  // A character starting below the current row's bottom opens a new row (code chips sit a few
  // pixels off the baseline, so a fixed grid would split them into rows of their own).
  const rows = el => { const r = []; let bottom = -1e9; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const rg = document.createRange(); let n; while ((n = tw.nextNode())) { for (let i = 0; i < n.length; i++) { rg.setStart(n, i); rg.setEnd(n, i + 1); const b = rg.getClientRects()[0]; if (!b || !b.width) continue; if (b.top >= bottom - 3) { r.push(0); bottom = b.bottom; } else bottom = Math.max(bottom, b.bottom); r[r.length - 1]++; } } return r; };

  // A20: Roles term list, median full line
  if (page === '/reference/roles/') {
    const h = [...main.querySelectorAll('h2')].find(e => /^who does what/i.test(e.textContent.trim()));
    let ul = h; while (ul && ul.tagName !== 'UL') ul = ul.nextElementSibling;
    if (ul) { const full = []; for (const li of ul.children) { const rs = rows(li); full.push(...rs.slice(0, -1)); } full.sort((a, b) => a - b); out.terms = { median: full.length ? full[Math.floor(full.length / 2)] : 0, lines: full.length }; }
  }

  // A21: longest row of body paragraphs, side bands
  if (w >= 1280) {
    out.measure = [...main.querySelectorAll(':scope > p, :scope > ul > li, :scope > ol > li')].filter(vis).map(el => { const rs = rows(el); return { t: el.textContent.trim().slice(0, 30), max: Math.max(0, ...rs), n: rs.length }; }).filter(x => x.n > 1);
    const sb = document.querySelector('.sidebar'); const S = sb && vis(sb) ? sb.getBoundingClientRect() : { width: 0, right: 0 };
    let right = 0, left = vw; for (const el of document.querySelectorAll('.main-content *, .toc-container *')) { if (!vis(el)) continue; const b = el.getBoundingClientRect(); right = Math.max(right, b.right); left = Math.min(left, b.left); }
    out.bands = { sidebar: Math.round(S.width), left: Math.round(left - S.right), right: Math.round(vw - right) };
  }

  // A22: text contrast, diagram labels and fills
  out.lowText = []; out.lowGraphic = []; const labels = [];
  const svgs = [...main.querySelectorAll('.mermaid svg[aria-roledescription]')].filter(vis);
  const large = s => { const px = parseFloat(s.fontSize), wt = +s.fontWeight || 400; return px >= 24 || (px >= 18.66 && wt >= 700); };
  for (const el of document.querySelectorAll('body *')) {
    if (el.closest('svg') || !vis(el)) continue;
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) continue;
    const s = getComputedStyle(el); const fg = parse(s.color); if (!fg) continue;
    const bg = bgOf(el); const r = ratio(over(fg, bg), bg); const min = large(s) ? 3 : 4.5;
    if (r < min) out.lowText.push(`${desc(el)} ${r}:1 < ${min}`);
  }
  for (const svg of svgs) {
    const frameBg = bgOf(svg.parentElement);
    for (const t of svg.querySelectorAll('text, foreignObject div, foreignObject span')) {
      if (!t.textContent.trim() || [...t.children].some(c => c.textContent.trim() === t.textContent.trim())) continue;
      const node = t.closest('g.node'); const lab = t.closest('.edgeLabel');
      let bg = frameBg;
      if (node) { const sh = node.querySelector('rect, polygon, path, circle'); const f = sh && parse(getComputedStyle(sh).fill); if (f && f[3] > 0) bg = over(f, frameBg); }
      else if (lab) { const rc = lab.querySelector('rect') || lab.parentElement?.querySelector('rect.labelBkg'); const f = rc && parse(getComputedStyle(rc).fill); if (f && f[3] > 0) bg = over(f, frameBg); }
      const s = getComputedStyle(t); const fg = parse(t.tagName === 'text' || t.closest('text') ? s.fill : s.color); if (!fg) continue;
      const r = ratio(over(fg, bg), bg); labels.push({ t: t.textContent.trim().slice(0, 24), fg: lum(over(fg, bg)), bg: lum(bg) });
      if (r < 4.5) out.lowText.push(`diagram label "${t.textContent.trim().slice(0, 24)}" ${r}:1 < 4.5`);
    }
    for (const n of svg.querySelectorAll('g.node.you')) { const sh = n.querySelector('rect, polygon, path, circle'); const f = sh && parse(getComputedStyle(sh).fill); if (f && ratio(over(f, frameBg), frameBg) < 3) out.lowGraphic.push(`amber node "${n.textContent.trim().slice(0, 24)}" ${ratio(over(f, frameBg), frameBg)}:1 < 3`); }
    for (const p of svg.querySelectorAll('.flowchart-link, .edgePath path')) { const c = parse(getComputedStyle(p).stroke); if (c && ratio(over(c, frameBg), frameBg) < 3) { out.lowGraphic.push(`diagram edge ${ratio(over(c, frameBg), frameBg)}:1 < 3`); break; } }
  }
  out.lowText = [...new Set(out.lowText)].slice(0, 8); out.lowGraphic = [...new Set(out.lowGraphic)].slice(0, 6);

  // A24: amber only on the reader's elements, each carrying a word
  out.amber = [];
  const allowed = el => {
    const node = el.closest('g.node.you'); if (node) return /\byou\b|checkpoint/i.test(node.textContent) ? null : 'amber diagram node that does not say "you"';
    const ok = el.closest('.gtm-tracker li.is-you, li.step-item:has(.callout-you), .callout-you, .gtm-tree li.you');
    if (ok) return ok.textContent.trim() ? null : 'amber element with no word';
    const btn = el.closest('.docmd-button');
    if (btn) { let p = btn.previousElementSibling; while (p && !p.classList.contains('docmd-button')) p = p.previousElementSibling; return p ? 'a second button in amber' : (btn.textContent.trim() ? null : 'button with no word'); }
    return 'amber outside the reader\'s elements';
  };
  for (const el of document.querySelectorAll('body *')) {
    if (!vis(el) && !(el instanceof SVGElement && el.closest('svg') && vis(el.closest('svg')))) continue;
    const s = getComputedStyle(el); const props = [];
    if ([...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) props.push(s.color);
    props.push(s.backgroundColor);
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) if (parseFloat(s[`border${side}Width`]) > 0) props.push(s[`border${side}Color`]);
    if (el instanceof SVGElement) { if (s.fill !== 'none') props.push(s.fill); if (s.stroke !== 'none' && parseFloat(s.strokeWidth) > 0) props.push(s.stroke); }
    for (const ps of ['::before', '::after']) { const p = getComputedStyle(el, ps); if (p.content && p.content !== 'none' && p.display !== 'none') { props.push(p.backgroundColor); if (parseFloat(p.borderTopWidth) > 0) props.push(p.borderTopColor); } }
    if (props.some(amber)) { const why = allowed(el); if (why) out.amber.push(`${desc(el)}: ${why}`); }
  }
  out.amber = [...new Set(out.amber)].slice(0, 8);

  // A25: diagrams in dark
  out.dark = [];
  if (document.documentElement.getAttribute('data-theme') === 'dark') {
    for (const svg of svgs) {
      if (!svg.querySelectorAll('g.node').length || svg.getBoundingClientRect().height < 20) out.dark.push('an empty diagram');
      for (const n of svg.querySelectorAll('g.node:not(.you)')) { const sh = n.querySelector('rect, polygon, path, circle'); const f = sh && parse(getComputedStyle(sh).fill); if (f && f[3] > 0.5 && lum(f) > 0.25) { out.dark.push(`light-filled node "${n.textContent.trim().slice(0, 24)}"`); break; } }
    }
    for (const l of labels) if (l.fg < 0.1 && l.bg < 0.1) { out.dark.push(`dark text on a dark ground "${l.t}"`); break; }
    if (!svgs.length && main.querySelectorAll('.mermaid, pre.mermaid').length) out.dark.push('a diagram did not render');
  }

  // Tables at phone widths: the second column starts inside the viewport, with no scrolling
  out.tables = [];
  if (vw <= 390) for (const t of main.querySelectorAll('table')) {
    if (!vis(t)) continue; const row = t.rows[0]; const c = row && row.cells[1]; if (!c) continue;
    for (let p = t; p && p !== document.body; p = p.parentElement) p.scrollLeft = 0;
    const left = Math.round(c.getBoundingClientRect().left);
    if (left >= vw - 80) out.tables.push(`table "${(row.cells[0].textContent || '').trim().slice(0, 24)}": second column starts at ${left}px`);
  }

  // A26: one h1, headings in order
  const hs = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter(vis);
  out.h1 = hs.filter(h => h.tagName === 'H1').length;
  const pagers = [...document.querySelectorAll('.page-navigation')].filter(vis);
  out.pager = { n: pagers.length, next: pagers.some(p => [...p.querySelectorAll('.next-page')].some(vis)) };
  out.jumps = []; let prev = 0; for (const h of hs) { const l = +h.tagName[1]; if (prev && l > prev + 1) out.jumps.push(`h${prev} -> h${l} "${h.textContent.trim().slice(0, 24)}"`); prev = l; }
  return out;
};

// Targets at 360 and 390: visible controls, then the open menu, then the search dialog.
const targets = () => {
  const vis = el => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity !== 0 && b.width > 0 && b.height > 0; };
  const small = [];
  for (const el of document.querySelectorAll('a, button, [role=button], summary, input, select, .sidebar-menu-button, .toc-title, .theme-toggle-button, .docmd-search-trigger, .docmd-search-close')) {
    if (!vis(el) || (el.classList.contains('toc-title') && !el.querySelector('.toc-menu-button'))) continue;
    if (el.classList.contains('toc-title') && getComputedStyle(el.querySelector('.toc-menu-button')).display === 'none') continue;
    if (el.tagName === 'A' && el.closest('.main-content p, .main-content li, .main-content td') && !el.closest('.gtm-tracker li, .page-navigation, .docmd-button')) continue;
    if (el.tagName === 'A' && el.closest('.heading-anchor, .toc-container')) continue;
    if (el.tagName === 'INPUT' && el.closest('label')) continue;
    const b = el.getBoundingClientRect();
    if (b.width >= 44 && b.height >= 44) continue;
    // A stretched link (its card is the hit area) counts at its card's size.
    let hit = false; el.scrollIntoView({ block: 'center' });
    for (let a = el.parentElement, k = 0; a && k < 4 && !hit; a = a.parentElement, k++) { const r = a.getBoundingClientRect(); if (r.width < 44 || r.height < 44) continue; hit = [[0.5, 0.5], [0.5, 0.75]].every(([x, y]) => { const e = document.elementFromPoint(r.left + r.width * x, r.top + r.height * y); return e && (e === el || el.contains(e)); }); }
    if (!hit) small.push(`${el.tagName.toLowerCase()}.${(typeof el.className === 'string' ? el.className : '').trim().split(/\s+/)[0]} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20)}" ${Math.round(b.width)}x${Math.round(b.height)}`);
  }
  return small;
};

const results = {}; const notes = new Set(); const raw = {};
const fail = (id, msg) => { (results[id] ||= []).push(msg); };
const browser = await chromium.launch();

const jobs = [];
for (const p of pages) for (const w of widths) for (const mode of ['light', 'dark']) jobs.push([p, w, mode]);

const run = async ([p, w, mode]) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, colorScheme: mode });
  const page = await ctx.newPage();
  const tag = `${p} ${w} ${mode}`;
  page.on('request', r => { const u = new URL(r.url()); if (u.origin !== origin && !u.protocol.startsWith('data')) { if (r.resourceType() === 'font') fail('A27', `${tag}: font from ${u.origin}`); else notes.add(`${r.resourceType()} ${u.origin}${u.pathname}`); } });
  await page.goto(origin + BASE + p, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const m = await page.evaluate(inPage, { w, page: p }); raw[tag] = m;
  if (want('A17') && (m.docOverflow > 0 || m.over.length)) fail('A17', `${tag}: page scrolls by ${m.docOverflow}px; ${m.over.join('; ')}`);
  if (want('A18') && w === 360) for (const d of m.diag) if (d.min < 12) fail('A18', `${tag}: diagram label at ${d.min}px`);
  if (want('A15') && w === 360) for (const d of m.diag) if (d.loop && d.clipped) fail('A15', `${tag}: ${d.clipped} edge(s) of the correction loop outside its frame`);
  if (want('A19') && p === '/' && w >= 1440) { if (!m.row || m.row.items !== 3) fail('A19', `${tag}: ${m.row ? m.row.items : 0} explanations after the figure, want 3`); else for (const b of m.row.bad) fail('A19', `${tag}: ${b}`); }
  if (want('A20') && p === '/reference/roles/' && w === 1920) { if (!m.terms) fail('A20', `${tag}: no term list after "Who does what"`); else if (m.terms.median < 60 || m.terms.median > 75) fail('A20', `${tag}: median full line ${m.terms.median} characters (${m.terms.lines} lines)`); }
  if (want('A21') && [1280, 1920, 2560].includes(w)) {
    // The rule is the column's measure, not each paragraph's wrap: a two-line paragraph's longest
    // row moves by a few characters with the platform's text rendering (Linux CI wraps 1-3 earlier).
    const rows = m.measure || [];
    for (const x of rows) if (x.max > 75) fail('A21', `${tag}: "${x.t}" longest line ${x.max}`);
    const sorted = rows.map(x => x.max).sort((a, b) => a - b);
    const col = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    if (rows.length && col < 60) fail('A21', `${tag}: text column measure ${col} characters (median of the paragraphs' longest lines)`);
    if (w >= 1920 && m.bands && (m.bands.left > m.bands.sidebar || m.bands.right > m.bands.sidebar)) fail('A21', `${tag}: empty band left ${m.bands.left}px, right ${m.bands.right}px, sidebar ${m.bands.sidebar}px`);
  }
  if (want('A22')) { for (const x of m.lowText) fail('A22', `${tag}: ${x}`); for (const x of m.lowGraphic) fail('A22', `${tag}: ${x}`); }
  if (want('A24')) for (const x of m.amber) fail('A24', `${tag}: ${x}`);
  if (want('A25')) for (const x of m.dark) fail('A25', `${tag}: ${x}`);
  if (want('tables')) for (const x of m.tables) fail('tables', `${tag}: ${x}`);
  if (want('A8') && (m.pager.n !== 1 || !m.pager.next)) fail('A8', `${tag}: ${m.pager.n} visible pager(s)${m.pager.next ? '' : ', no Next card'}`);
  if (want('axe')) {
    await page.addScriptTag({ content: AXE_SRC });
    const v = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }).then(r => r.violations.map(x => `${x.id}: ${x.nodes.slice(0, 3).map(n => n.target.join(' ')).join(', ')}${x.nodes.length > 3 ? ` (+${x.nodes.length - 3})` : ''}`)));
    for (const x of v) fail('axe', `${tag}: ${x}`);
  }
  if (want('A26')) { if (m.h1 !== 1) fail('A26', `${tag}: ${m.h1} visible h1`); for (const j of m.jumps) fail('A26', `${tag}: heading jump ${j}`); }

  // A26 menu control and A23 targets at phone widths
  if (w <= 390 && (want('A23') || want('A26'))) {
    if (want('A23')) for (const s of await page.evaluate(targets)) fail('A23', `${tag}: ${s}`);
    const mc = await page.evaluate(() => { const b = document.querySelector('.sidebar-menu-button'); if (!b) return null; return { button: b.tagName === 'BUTTON' || b.getAttribute('role') === 'button', name: (b.getAttribute('aria-label') || b.textContent || '').trim(), tab: b.tabIndex, expanded: b.getAttribute('aria-expanded') }; });
    if (want('A26')) {
      if (!mc) fail('A26', `${tag}: no menu control`);
      else {
        if (!mc.button) fail('A26', `${tag}: the menu control is not a button`);
        if (!mc.name) fail('A26', `${tag}: the menu control has no name`);
        if (mc.tab < 0) fail('A26', `${tag}: the menu control is not focusable`);
        let reached = false;
        for (let i = 0; i < 25 && !reached; i++) { await page.keyboard.press('Tab'); reached = await page.evaluate(() => document.activeElement?.closest?.('.sidebar-menu-button') !== null && document.activeElement?.closest?.('.sidebar-menu-button') !== undefined); }
        if (!reached) fail('A26', `${tag}: the menu control is not reached with Tab`);
        else {
          const before = await page.evaluate(() => [...document.querySelectorAll('.sidebar-nav a')].filter(a => a.getBoundingClientRect().height > 0 && getComputedStyle(a).visibility !== 'hidden').length);
          await page.keyboard.press('Enter'); await page.waitForTimeout(500);
          const after = await page.evaluate(() => [...document.querySelectorAll('.sidebar-nav a')].filter(a => { const b = a.getBoundingClientRect(); return b.height > 0 && b.bottom > 0 && b.top < innerHeight && getComputedStyle(a).visibility !== 'hidden'; }).length);
          if (!(after > before || (before === 0 && after > 0))) fail('A26', `${tag}: Enter on the menu control does not open the menu (${before} -> ${after} links)`);
          await page.keyboard.press('Escape');
        }
      }
    }
    if (want('A23')) {
      await page.goto(origin + BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(800);
      if (await page.$('.sidebar-menu-button')) { await page.click('.sidebar-menu-button'); await page.waitForTimeout(500); for (const s of await page.evaluate(targets)) fail('A23', `${tag} menu open: ${s}`); }
      if (p === '/' && await page.$('.docmd-search-trigger')) { await page.click('.docmd-search-trigger'); await page.waitForTimeout(700); for (const s of (await page.evaluate(targets)).filter(s => /search/i.test(s))) fail('A23', `${tag} search open: ${s}`); }
    }
  }

  // A22 search dialog and A25 theme toggle, once per mode at 1280 on the home page
  if (w === 1280 && p === '/' && want('A22') && await page.$('.docmd-search-trigger')) {
    await page.click('.docmd-search-trigger'); await page.waitForTimeout(700); await page.keyboard.type('checkpoint'); await page.waitForTimeout(1200);
    const s = await page.evaluate(inPage, { w, page: '/search' });
    for (const x of s.lowText.filter(x => !(raw[tag].lowText || []).includes(x))) fail('A22', `${tag} search open: ${x}`);
    const ph = await page.evaluate(() => { const i = document.querySelector('.docmd-search-modal input'); if (!i) return null; const parse = s => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; }; let bg; for (let e = i; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { bg = c; break; } } return { fg: parse(getComputedStyle(i, '::placeholder').color), bg }; });
    if (ph && ph.fg && ph.bg) { const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); }; const a = ph.fg[3] ?? 1; const fg = [0, 1, 2].map(i => ph.fg[i] * a + ph.bg[i] * (1 - a)); const r = (Math.max(lum(fg), lum(ph.bg)) + 0.05) / (Math.min(lum(fg), lum(ph.bg)) + 0.05); if (r < 4.5) fail('A22', `${tag} search placeholder ${r.toFixed(2)}:1 < 4.5`); }
  }
  if (want('A25') && w === 1280 && mode === 'light' && await page.$('.mermaid svg')) {
    await page.goto(origin + BASE + p, { waitUntil: 'networkidle' }); await page.waitForTimeout(1200);
    if (await page.$('.theme-toggle-button')) {
      await page.click('.theme-toggle-button'); await page.waitForTimeout(2500);
      const t = await page.evaluate(inPage, { w, page: p });
      const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
      if (theme !== 'dark') fail('A25', `${tag}: the toggle did not switch to dark (${theme})`);
      for (const x of t.dark) fail('A25', `${tag} after the toggle: ${x}`);
    } else fail('A25', `${tag}: no theme toggle`);
  }
  await ctx.close();
};

const pool = 4; let i = 0;
await Promise.all(Array.from({ length: pool }, async () => { while (i < jobs.length) { const j = jobs[i++]; try { await run(j); } catch (e) { fail('crash', `${j.join(' ')}: ${e.message.split('\n')[0]}`); } } }));
await browser.close(); server.close();

const ids = ['A8', 'A15', 'A17', 'A18', 'A19', 'A20', 'A21', 'A22', 'A23', 'A24', 'A25', 'A26', 'A27', 'tables', 'axe', 'crash'].filter(id => id === 'crash' ? results.crash : want(id));
let failed = 0;
console.log(`${pages.length} pages x ${widths.join('/')} px x light/dark = ${jobs.length} loads`);
for (const id of ids) {
  const f = results[id] || []; if (f.length) failed++;
  console.log(`${f.length ? 'FAIL' : 'PASS'} ${id}${f.length ? ` (${f.length})` : ''}`);
  for (const x of f.slice(0, 20)) console.log(`  ${x}`);
  if (f.length > 20) console.log(`  ... ${f.length - 20} more`);
}
if (notes.size) { console.log('Requests to other origins (listed, not failed):'); for (const n of notes) console.log(`  ${n}`); }
if (opt('--json')) writeFileSync(opt('--json'), JSON.stringify({ results, notes: [...notes], raw }, null, 1));
process.exit(failed ? 1 : 0);
