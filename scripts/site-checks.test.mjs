#!/usr/bin/env node
// Static checks for the docs-site branch: page set, coverage, vocabulary, diagram sources,
// glossary, numbers, font licences, manifests, the Pages workflow, the README, links in tracked
// files and in the built site, and the tutorial's state. The rendered rules (overflow, measure,
// contrast, targets, amber, dark diagrams, h1) are measure-site.mjs. Node standard library only.
//
// Usage: node site-checks.mjs <repo> [A1 A7 ...] [--base <rev>] [--final] [--source] [--lasting]
//   <repo>   the worktree; checks that read the build need `npx -y @docmd/core@0.9.7 build` first.
//   A<n>     run only these lines (default: all).
//   --base   the base branch, for A31 and A32 (default: main; diffs run from the merge base).
//   --final  A34's second half: the tutorial holds no illustrative block (and a mockup image,
//            unless it says checkpoint 1 is skipped because the project has no screens).
//   --source only the lines read from the sources and git: no build and no network needed.
//   --lasting skip the lines that judge this branch against its base (CHANGELOG and plugin
//            scope, banner redraw, illustrative tutorial): they hold until the merge only.
// One PASS or FAIL line per line, details indented; exit 1 on any FAIL.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, posix } from 'node:path';
import { execFileSync } from 'node:child_process';

const argv = process.argv.slice(2);
const repo = argv.find(a => !a.startsWith('-') && !/^A\d+$/.test(a));
if (!repo) { console.error('usage: node site-checks.mjs <repo> [A1 ...] [--source] [--lasting] [--base <rev>] [--final]'); process.exit(2); }
const only = argv.filter(a => /^A\d+$/.test(a));
const base = argv.includes('--base') ? argv[argv.indexOf('--base') + 1] : 'main';
const final = argv.includes('--final');
const source = argv.includes('--source');
// Lines that read the build: skipped with --source.
const BUILT = ['A8', 'A27', 'A33'];
// Lines that judge the branch against its base: skipped with --lasting (CI and the gate).
const DELIVERY = ['A31', 'A32', 'A34'];
const lasting = argv.includes('--lasting');
const SITE_URL = 'https://morgankryze.github.io/GentleTeaM';

// The site's pages in reading order: [path, url, source file under docs/, title].
const PAGES = [
  ['Start here', '/', 'index.md', 'What GTM is'],
  ['Start here', '/start/install/', 'start/install.md', 'Install'],
  ['Tutorial', '/tutorial/first-feature/', 'tutorial/first-feature.md', 'Your first Feature'],
  ['Guides', '/guides/which-size/', 'guides/which-size.md', 'Which size is my change?'],
  ['Guides', '/guides/team-settings/', 'guides/team-settings.md', 'Change your team settings'],
  ['Guides', '/guides/not-your-repo/', 'guides/not-your-repo.md', 'Work on a repository that is not yours'],
  ['Guides', '/guides/too-slow/', 'guides/too-slow.md', 'It is too slow or too costly: what now?'],
  ['Guides', '/guides/other-plugins/', 'guides/other-plugins.md', 'Use GTM with other plugins'],
  ['Reference', '/reference/roles/', 'reference/roles.md', 'Roles'],
  ['Reference', '/reference/commands/', 'reference/commands.md', 'Commands'],
  ['Reference', '/reference/settings/', 'reference/settings.md', 'Settings'],
  ['Reference', '/reference/how-the-team-works/', 'reference/how-the-team-works.md', 'How the team works'],
  ['Reference', '/reference/gtm-folder/', 'reference/gtm-folder.md', 'The .gtm/ folder'],
  ['Reference', '/reference/glossary/', 'reference/glossary.md', 'Glossary'],
  ['Reference', '/reference/contributing/', 'reference/contributing.md', 'Contributing'],
  ['Why', '/why/', 'why/index.md', 'Why GTM exists'],
  ['Why', '/why/principles/', 'why/principles.md', 'Principles'],
  ['Why', '/why/positions/', 'why/positions.md', 'Positions'],
  ['Why', '/why/credits/', 'why/credits.md', 'Where GTM comes from'],
];
const PATHS = ['Start here', 'Tutorial', 'Guides', 'Reference', 'Why'];

// Every `##` section of today's documentation (main a654a38), the page that covers it, and a
// phrase that page must hold. 'README.md' rows are checked in the README itself.
const COVER = [
  ['README', 'intro', 'index.md', /three (decisions|checkpoints)/i],
  ['README', 'Why GTM', 'why/index.md', /attention/i],
  ['README', 'How it works (diagram)', 'index.md', /checkpoint/i],
  ['README', 'How it works (tracks)', 'guides/which-size.md', /\bMilestone\b/],
  ['README', 'Install', 'start/install.md', /plugin marketplace add MorganKryze\/GentleTeaM/],
  ['README', 'Quick start', 'start/install.md', /\/gtm:gtm\b/],
  ['README', 'What it costs', 'guides/too-slow.md', /71 s\b/],
  ['README', 'Roles', 'reference/roles.md', /\beleven\b/i],
  ['README', 'Principles', 'why/positions.md', /light over complete/i],
  ['README', 'Docs', 'README.md', /morgankryze\.github\.io\/GentleTeaM/],
  ['README', 'Inspirations', 'why/credits.md', /github\.com\/github\/spec-kit/],
  ['README', 'License', 'README.md', /AGPL-3\.0/],
  ['manifesto', 'The problem', 'why/index.md', /\bproblem\b/i],
  ['manifesto', 'What GTM does about it', 'why/index.md', /\bcheckpoints?\b/i],
  ['manifesto', 'Who it is for', 'why/index.md', /who (it|GTM) is for/i],
  ['manifesto', 'What success looks like', 'why/index.md', /\bsuccess\b/i],
  ['manifesto', 'What GTM is not', 'why/index.md', /what (it|GTM) is not/i],
  ['positions', '1. Light over complete', 'why/positions.md', /light over complete/i],
  ['positions', '2. Three human touchpoints', 'why/positions.md', /three checkpoints/i],
  ['positions', '3. Evidence before claims', 'why/positions.md', /evidence before claims/i],
  ['positions', '4. Tests first', 'why/positions.md', /tests first/i],
  ['positions', '5. File-based hand-offs', 'why/positions.md', /reports on disk/i],
  ['positions', '6. Triggered specialists', 'why/positions.md', /specialists/i],
  ['positions', '7. One strong model, effort by role', 'why/positions.md', /effort by role/i],
  ['positions', '8. Weights are a project decision', 'why/positions.md', /\b(weights|priorities)\b/i],
  ['positions', '9. Security and data integrity', 'why/positions.md', /security and data/i],
  ['positions', '10. Nothing pushed without the go', 'why/positions.md', /without (your|the human's) go/i],
  ['positions', '11. Keep history, no squash', 'why/positions.md', /no squash/i],
  ['positions', '12. Plain language', 'why/positions.md', /plain language/i],
  ['positions', '13. Cite sources, credit inspirations', 'why/positions.md', /\/why\/credits\//],
  ['positions', '14. Accessibility is a rule', 'why/positions.md', /accessibility/i],
  ['positions', '15. GTM serves the project', 'why/positions.md', /does not sign/i],
  ['positions', '7-8 (team settings guide)', 'guides/team-settings.md', /\beffort\b/i],
  ['principles', '1. Every artifact starts with a summary', 'why/principles.md', /\bsummary\b/i],
  ['principles', '2. Decisions come as cards', 'why/principles.md', /decision cards?/i],
  ['principles', '3. Detail on demand', 'why/principles.md', /detail on demand/i],
  ['principles', '4. One briefing format, your language', 'why/principles.md', /\blanguage\b/i],
  ['principles', '5. Visuals over prose', 'why/principles.md', /visuals? over prose/i],
  ['principles', '6. Three checkpoints per Feature', 'why/principles.md', /three checkpoints/i],
  ['principles', 'The test', 'why/principles.md', /\btest\b/i],
  ['method', 'The loop', 'guides/which-size.md', /ask of me/i],
  ['method', 'Tracks', 'guides/which-size.md', /\bFix\b[\s\S]*\bFeature\b[\s\S]*\bMilestone\b/],
  ['method', 'Tracks: a small Feature', 'guides/which-size.md', /small Feature/i],
  ['method', 'Tracks: a Fix that grows', 'guides/which-size.md', /becomes a Feature/i],
  ['method', 'Artifacts', 'reference/gtm-folder.md', /brief\.md/],
  ['method', 'Roles', 'reference/roles.md', /\bimplementer\b/],
  ['method', 'Gates', 'reference/how-the-team-works.md', /\bgates?\b/i],
  ['method', 'Gates: re-reviews', 'reference/how-the-team-works.md', /re-review/i],
  ['method', 'Gates: parallel waves', 'reference/how-the-team-works.md', /\bwaves?\b/i],
  ['method', 'Gates: design loop', 'reference/how-the-team-works.md', /design loop/i],
  ['method', 'Hand-offs and hand-backs', 'reference/how-the-team-works.md', /hand-offs?/i],
  ['method', 'Team profile', 'guides/team-settings.md', /\/gtm:tune\b/],
  ['method', 'Team profile (fields)', 'reference/settings.md', /team\.md/],
  ['method', 'Conventions', 'reference/how-the-team-works.md', /conventions\.md/],
  ['method', 'Backlog', 'reference/how-the-team-works.md', /backlog\.md/],
  ['method', 'Ledger and the compound step', 'reference/how-the-team-works.md', /ledger\.md/],
  ['method', 'Stealth mode', 'guides/not-your-repo.md', /\bstealth\b/i],
  ['method', 'Stealth mode: project voice', 'guides/not-your-repo.md', /\bvoice\b/i],
  ['method', 'Stealth mode: footprint check', 'reference/how-the-team-works.md', /footprint check/i],
  ['method', 'Skills and effort ladder (cost levers)', 'guides/too-slow.md', /\beffort\b/i],
  ['method', 'Skills', 'reference/commands.md', /\/gtm:brief-me\b/],
  ['method', 'Workflows', 'reference/commands.md', /deliver-task/],
  ['roles', 'the role table', 'reference/roles.md', /\| `release-qa` \|/],
  ['roles', 'Severity scale', 'reference/roles.md', /\bcritical\b[\s\S]*\bimportant\b[\s\S]*\bminor\b/],
  ['roles', 'Hand-back contract', 'reference/roles.md', /hand-back/i],
  ['roles', 'Shared rules', 'reference/roles.md', /never pushes|read-only/i],
  ['roles', 'Plugin limits worth knowing', 'reference/roles.md', /permissionMode/],
  ['glossary', 'all terms', 'reference/glossary.md', /^### Logbook( \{#logbook\})?$/m],
  ['install', 'For yourself', 'start/install.md', /plugin install gtm@gentleteam/],
  ['install', 'For a whole project', 'start/install.md', /\.claude\/settings\.json/],
  ['install', 'Update', 'start/install.md', /plugin marketplace update gentleteam/],
  ['install', 'Pin', 'start/install.md', /GentleTeaM#v\d+\.\d+\.\d+/],
  ['install', 'Develop locally', 'reference/contributing.md', /--plugin-dir/],
  ['install', 'Version bump rule', 'reference/contributing.md', /plugin\.json/],
  ['install', 'Requirements', 'start/install.md', /\bPlaywright\b/],
  ['companions', 'Per role', 'guides/other-plugins.md', /superpowers/i],
  ['companions', 'Overlaps to avoid', 'guides/other-plugins.md', /\boverlap/i],
  ['companions', 'Licences', 'guides/other-plugins.md', /CC-BY-SA-4\.0/],
  ['contributing', 'Proposing a change', 'reference/contributing.md', /\bissue\b/i],
  ['contributing', 'What every change keeps', 'reference/contributing.md', /Math\.random\(\)/],
  ['contributing', 'Checks', 'reference/contributing.md', /validate\.mjs/],
  ['contributing', 'Versions', 'reference/contributing.md', /\bSemVer\b/],
  ['examples', 'Belay as the reference project', 'why/credits.md', /github\.com\/MorganKryze\/belay/i],
  ['examples', 'A minimal folder after /gtm:init', 'reference/gtm-folder.md', /conventions\.md/],
];

// Validated terms: glossary heading, anchor, what its entry must name (A5, A9).
const TERMS = [
  ['Checkpoint', /checkpoints?/i], ['Mockups', /mockups?/i], ['Summary', /\bSummary\b/],
  ['Decisions made for you', /decisions made for you/i], ['Logbook', /logbooks?/i, /`ledger\.md`/],
  ['Team settings', /team settings/i, /`team\.md`/], ['Correction round', /correction rounds?/i],
  ['File limit for a fix', /file limits? for a fix/i, /Fix track ceiling/], ['Dry run', /dry runs?/i],
  ['Brief', /\bBrief\b/], ['Tune', /\bTune\b/], ['Stealth', /\bstealth\b/i], ['Fix', /\bFix(es)?\b/],
  ['Feature', /\bFeatures?\b/], ['Milestone', /\bMilestones?\b/], ['Retro', /\bRetro\b/],
  ['Decision card', /decision cards?/i], ['Handoff', /\bhandoff\b/i, /`handoff\.md`/],
];
const INTERNAL = ['hand-off', 'hand-back', 'gate', 'minor', 'GTM root', 'footprint check', 'EARS', 'NEEDS CLARIFICATION'];
const RETIRED = [ // retired word, its search pattern, the plain word it points to
  ['Touchpoint', 'touchpoints?', /checkpoint/i], ['Board', 'boards?', /mockups/i],
  ['For you', '(?<!made )for you', /summary/i], ['Ruling', 'rulings?', /decisions made for you/i],
  ['Ledger', 'ledgers?', /logbook/i], ['Team profile', 'team profiles?', /team settings/i],
  ['Fix round', 'fix rounds?', /correction round/i], ['Fix ceiling', 'fix ceilings?', /file limit for a fix/i],
  ['Escalation', 'escalations?', /grows/i], ['Replay', 'replay(s|ed|ing)?', /dry run/i],
];
const INTERNAL_RE = ['hand-?offs?', 'hand-?backs?', 'gates?', 'minor', 'gtm root', 'footprint checks?', 'ears', 'needs clarification'];

const results = [];
const check = (id, fn) => {
  if (only.length && !only.includes(id)) return;
  if (source && BUILT.includes(id)) return;
  if (lasting && DELIVERY.includes(id)) return;
  let fails = [];
  try { fails = fn() || []; } catch (e) { fails = [`crashed: ${e.message}`]; }
  results.push([id, fails]);
};
const read = p => (existsSync(join(repo, p)) ? readFileSync(join(repo, p), 'utf8') : null);
const page = f => read(join('docs', f));
const git = (...a) => execFileSync('git', ['-C', repo, '-c', 'core.quotePath=false', ...a], { encoding: 'utf8' });
const built = url => read(join('site', url, 'index.html'));
const needBuild = () => { if (!existsSync(join(repo, 'site', 'index.html'))) throw new Error('no build: run `npx -y @docmd/core@0.9.7 build` first'); };
const walk = (dir, out = []) => {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) { const p = join(dir, n); statSync(p).isDirectory() ? walk(p, out) : out.push(p); }
  return out;
};

// Text a reader sees in prose: no frontmatter, code blocks, code spans, URLs or tags; Mermaid
// labels, alt texts, aria-labels and container titles kept.
const unfront = t => t.replace(/^---\n[\s\S]*?\n---\n/, '');
const mermaidText = body => body.replace(/^---\n[\s\S]*?\n---\n/, '').split('\n')
  .filter(l => !/^\s*(flowchart|graph|classDef|class|style|linkStyle|sequenceDiagram)\b/.test(l))
  .map(l => (l.match(/\[[^\]]*\]|\([^)]*\)|\{[^}]*\}|\|[^|]*\|/g) || []).join(' ')).join('\n').replace(/<br\s*\/?>/g, ' ');
const prose = (t, { mermaid = true } = {}) => unfront(t)
  .replace(/^(```+|~~~+)[ \t]*([\w-]*)[^\n]*\n([\s\S]*?)^\1[ \t]*$/gm, (m, f, lang, body) => (mermaid && lang === 'mermaid' ? mermaidText(body) : '\n'))
  .replace(/`[^`\n]*`/g, ' ')
  .replace(/<[^>]*?\b(?:alt|aria-label)="([^"]*)"[^>]*>/g, ' $1 ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\]\([^)]*\)/g, ']')
  .replace(/^:::.*$/gm, l => ' ' + (l.match(/"[^"]*"/g) || []).join(' ') + ' ');
const mermaids = t => [...unfront(t).matchAll(/^```mermaid[^\n]*\n([\s\S]*?)^```[ \t]*$/gm)].map(m => m[1].replace(/^---\n[\s\S]*?\n---\n/, ''));
// Mermaid nodes: id -> { label, you }
const nodes = src => {
  const out = {};
  for (const m of src.matchAll(/\b([A-Za-z]\w*)\s*(\(\[|\[\[|\[\(|\(\(|\[|\(|\{)([^\]\)\}]*)[\]\)\}]+(:::(\w+))?/g)) {
    out[m[1]] = { label: m[3].replace(/<br\s*\/?>/g, ' '), you: out[m[1]]?.you || m[5] === 'you' };
  }
  for (const m of src.matchAll(/^\s*class\s+([\w,]+)\s+you\b/gm)) for (const id of m[1].split(',')) if (out[id]) out[id].you = true;
  return out;
};
const edges = src => [...src.matchAll(/\b([A-Za-z]\w*)(?:\s*(?:\(\[|\[|\(|\{)[^\]\)\}]*[\]\)\}]+(?::::\w+)?)?\s*(?:-->|-\.->|==>|-\.-|---)\s*(?:\|[^|]*\|\s*)?([A-Za-z]\w*)/g)].map(m => [m[1], m[2]]);

check('A1', () => {
  const f = [];
  const cfg = JSON.parse(read('docmd.config.json') || '{}');
  const nav = cfg.navigation || [];
  const top = nav.map(n => n.title);
  const want = [...PATHS, 'GitHub'];
  if (JSON.stringify(top) !== JSON.stringify(want)) f.push(`sidebar order ${JSON.stringify(top)}, want ${JSON.stringify(want)}`);
  for (const p of PATHS) {
    const got = (nav.find(n => n.title === p)?.children || []).map(c => `${c.path}|${c.title}`);
    const exp = PAGES.filter(x => x[0] === p).map(x => `${x[1]}|${x[3]}`);
    if (JSON.stringify(got) !== JSON.stringify(exp)) f.push(`${p} children ${JSON.stringify(got)}, want ${JSON.stringify(exp)}`);
  }
  const files = walk(join(repo, 'docs')).filter(p => p.endsWith('.md')).map(p => p.slice(join(repo, 'docs').length + 1)).sort();
  const exp = PAGES.map(x => x[2]).sort();
  for (const x of files) if (!exp.includes(x)) f.push(`page outside every path: docs/${x}`);
  for (const x of exp) if (!files.includes(x)) f.push(`missing page: docs/${x}`);
  return f;
});

check('A2', () => {
  const f = [];
  for (const [src, sec, file, re] of COVER) {
    const t = file === 'README.md' ? read('README.md') : page(file);
    if (t === null) f.push(`${src} "${sec}" -> docs/${file}: page missing`);
    else if (!re.test(t)) f.push(`${src} "${sec}" -> ${file}: no ${re}`);
  }
  const cmds = page('reference/commands.md') || '';
  for (const s of ['gtm', 'init', 'design', 'spec', 'plan', 'deliver', 'ship', 'retro', 'tune', 'brief-me', 'status', 'pause']) {
    if (!new RegExp(`/gtm:${s}\\b`).test(cmds)) f.push(`commands.md lacks /gtm:${s}`);
  }
  return f;
});

check('A3', () => {
  const f = [];
  const want = [/^Which size is my change\?$/, /^Change your team settings$/, /^Work on a repository that is not yours$/, /^It is too slow or too costly: what now\?$/, /^Use GTM with other plugins$/];
  const guides = PAGES.filter(x => x[0] === 'Guides');
  if (guides.length !== 5) f.push(`${guides.length} guides`);
  guides.forEach(([, , file], i) => {
    const t = page(file);
    if (!t) return f.push(`missing docs/${file}`);
    const title = (t.match(/^title:\s*(.+)$/m) || [])[1]?.replace(/^["']|["']$/g, '');
    if (!want[i].test(title || '')) f.push(`${file} title "${title}"`);
  });
  return f;
});

check('A4', () => {
  const f = [];
  const why = page('why/index.md') || '', pos = page('why/positions.md') || '', pri = page('why/principles.md') || '', cred = page('why/credits.md') || '';
  for (const re of [/\bproblem\b/i, /who (it|GTM) is for/i, /what (it|GTM) is not/i]) if (!re.test(why)) f.push(`why/index.md lacks ${re}`);
  const costs = (pos.match(/<p class="gtm-cost">Cost: [^<]+<\/p>/g) || []).length;
  if (costs !== 15) f.push(`why/positions.md has ${costs} cost lines, want 15`);
  const heads = (unfront(pos).match(/^#{2,3} .+$/gm) || []).length;
  if (heads < 15) f.push(`why/positions.md has ${heads} headings, want one per position (15)`);
  const pheads = (unfront(pri).match(/^#{2,3} .+$/gm) || []).filter(h => !/the test/i.test(h)).length;
  if (pheads !== 6) f.push(`why/principles.md has ${pheads} principle headings, want 6`);
  for (const u of ['github.com/bmad-code-org/BMAD-METHOD', 'github.com/github/spec-kit', 'github.com/obra/superpowers', 'github.com/EveryInc/compound-engineering-plugin', 'github.com/buildermethods/agent-os', 'kiro.dev']) {
    if (!cred.includes(u)) f.push(`why/credits.md lacks a link to ${u}`);
  }
  if (!/\bBelay\b/.test(cred)) f.push('why/credits.md does not name Belay');
  return f;
});

const glossary = () => {
  const t = unfront(page('reference/glossary.md') || '');
  const entries = {};
  const parts = t.split(/^### /m).slice(1);
  for (const p of parts) { const [head, ...body] = p.split('\n'); entries[head.replace(/\s*\{#[^}]*\}\s*$/, '').trim()] = body.join('\n').split(/^#{2,3} /m)[0].trim(); }
  return { t, entries };
};

check('A5', () => {
  const f = [];
  const { t, entries } = glossary();
  // An explicit anchor must be its heading's slug, or links built from the term break (W7).
  for (const m of t.matchAll(/^#{2,3} (.+?)\s*\{#([^}]*)\}\s*$/gm)) {
    const slug = m[1].toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');
    if (m[2] !== slug) f.push(`"${m[1]}": anchor {#${m[2]}}, its slug is ${slug}`);
  }
  for (const [term, , must] of TERMS) {
    const body = entries[term];
    if (body === undefined) { f.push(`no "### ${term}" entry`); continue; }
    const lines = body.split('\n').filter(l => l.trim());
    if (lines.length > 2) f.push(`${term}: ${lines.length} lines, at most 2`);
    if (!/`[^`]+`/.test(body)) f.push(`${term}: names no file, command or setting (no code span)`);
    if (must && !must.test(body)) f.push(`${term}: does not name ${must}`);
  }
  return f;
});

check('A6', () => {
  const f = [];
  const { t } = glossary();
  const sec = re => { const m = t.split(/^## /m).find(s => re.test(s.split('\n')[0])); return m || null; };
  const internal = sec(/internal terms/i), retired = sec(/retired words/i);
  if (!internal) f.push('no "## Internal terms" section');
  else for (const w of INTERNAL) if (!new RegExp(`\\b${w}\\b`, 'i').test(internal)) f.push(`internal terms lack ${w}`);
  if (!retired) f.push('no "## Retired words" section');
  else for (const [w, , plain] of RETIRED) {
    const line = retired.split('\n').find(l => new RegExp(`\\b${w}\\b`, 'i').test(l));
    if (!line) f.push(`retired words lack ${w}`);
    else if (!plain.test(line)) f.push(`retired ${w} does not point to ${plain}`);
  }
  return f;
});

check('A7', () => {
  const f = [];
  const words = [...RETIRED.map(r => r[1]), ...INTERNAL_RE];
  for (const [path, , file] of PAGES) {
    if (path === 'Reference') continue;
    const t = page(file);
    if (t === null) continue;
    prose(t).split('\n').forEach((l, i) => {
      for (const w of words) {
        const m = l.match(new RegExp(`\\b${w}\\b`, 'i'));
        if (m) f.push(`${file}: "${m[0]}" in "${l.trim().slice(0, 70)}"`);
      }
    });
  }
  return f;
});

check('A8', () => {
  const f = [];
  needBuild();
  PAGES.forEach(([path, url, file], i) => {
    const t = page(file);
    if (t === null) return f.push(`missing docs/${file}`);
    const body = unfront(t).replace(/^\s*# .*\n/, '').trimStart();
    const sum = body.match(/^::: callout summary\n([\s\S]*?)\n:::/);
    if (!sum) f.push(`${file}: does not open with the summary block`);
    else for (const re of [/you will learn/i, /reading time:?\**:?\s*(about )?\d+ minutes?/i, /before this/i]) if (!re.test(sum[1])) f.push(`${file}: summary lacks ${re}`);
    const html = built(url);
    if (!html) return f.push(`${url}: not built`);
    const next = /<a[^>]+class="[^"]*\bnext-page\b[^"]*"[^>]*>|<a[^>]+href="[^"]+"[^>]*class="[^"]*\bnext-page\b/.test(html);
    const prev = /class="[^"]*\bprev-page\b/.test(html);
    if (!next) f.push(`${url}: no Next card`);
    if (i > 0 && !prev) f.push(`${url}: no Previous card`);
    if (/gtm-cost/.test(t) && !/gtm-pager/.test(t)) f.push(`${file}: docmd's pager is hidden here, but the page has no gtm-pager`);
    if (path === 'Reference' && !/\]\((\/|\/(start|tutorial|guides|why)\/[^)]*)\)|href="(\/|\.\.\/)+(start|tutorial|guides|why)?\/?/.test(unfront(t))) f.push(`${file}: no link back to a path`);
  });
  return f;
});

check('A9', () => {
  const f = [];
  for (const [, , file] of PAGES) {
    if (file === 'reference/glossary.md') continue;
    const t = page(file);
    if (t === null) continue;
    // Paragraphs a reader reads as prose: no headings, summary block, code, Mermaid, pager,
    // nor link texts that point elsewhere than the glossary.
    const paras = unfront(t)
      .replace(/^::: callout summary\n[\s\S]*?\n:::\n/m, '')
      .replace(/^(```+|~~~+)[\s\S]*?^\1[ \t]*$/gm, '')
      .replace(/<div class="page-navigation[\s\S]*?<\/div>/g, '')
      .replace(/^#{1,6} .*$/gm, '')
      .replace(/`[^`\n]*`/g, ' ')
      .replace(/<code>[\s\S]*?<\/code>/g, ' ')
      .split(/\n\s*\n/);
    for (const [term, re] of TERMS) {
      const anchor = term.toLowerCase().replace(/\s+/g, '-');
      for (const p of paras) {
        const visible = p.replace(/\[([^\]]*)\]\((?![^)]*glossary)[^)]*\)/g, ' ').replace(/<a [^>]*href="(?![^"]*glossary)[^"]*"[^>]*>[\s\S]*?<\/a>/g, ' ');
        if (!re.test(visible.replace(/<[^>]+>/g, ' ').replace(/\]\([^)]*\)/g, ']'))) continue;
        if (!new RegExp(`glossary/#${anchor}\\b`).test(p)) f.push(`${file}: first use of "${term}" not linked to glossary/#${anchor}: "${p.trim().replace(/\s+/g, ' ').slice(0, 60)}"`);
        break;
      }
    }
  }
  return f;
});

check('A10', () => {
  const f = [];
  for (const [, , file] of PAGES) {
    const t = page(file);
    if (t === null) continue;
    for (const m of unfront(t).matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) if (m[1].trim().split(/\s+/).length < 3) f.push(`${file}: image ${m[2]} alt "${m[1]}"`);
    for (const m of unfront(t).matchAll(/<img\b[^>]*>/g)) if (!/\balt="[^"]{8,}"/.test(m[0])) f.push(`${file}: ${m[0].slice(0, 60)} lacks alt text`);
    // gtm.css sets no highlight colours, so a highlighted block fails contrast: text or mermaid only.
    for (const m of unfront(t).matchAll(/^(?:```+|~~~+)[ \t]*([\w-]+)/gm)) if (!['text', 'mermaid'].includes(m[1])) f.push(`${file}: a \`${m[1]}\` code block is highlighted; use text`);
  }
  if (existsSync(join(repo, 'site', 'index.html'))) {
    for (const p of walk(join(repo, 'site')).filter(p => p.endsWith('.html'))) {
      for (const m of readFileSync(p, 'utf8').matchAll(/<img\b[^>]*>/g)) if (!/\balt="[^"]+"/.test(m[0]) && !/aria-hidden="true"/.test(m[0])) f.push(`${p.slice(repo.length)}: ${m[0].slice(0, 60)} lacks alt`);
    }
  }
  return f;
});

check('A11', () => {
  const f = [];
  const team = read('plugins/gtm/templates/team.md') || '';
  const rounds = +(team.match(/fix rounds per task: (\d+)/) || [])[1];
  const standard = +(team.match(/fix rounds per standard review: (\d+)/) || [])[1];
  const ceiling = +(team.match(/Fix track ceiling: (\d+) files/) || [])[1];
  const threshold = +(team.match(/design threshold: (\d+)\/10/) || [])[1];
  const agents = readdirSync(join(repo, 'plugins/gtm/agents')).filter(n => n.endsWith('.md'));
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
  const num = s => (/^\d+$/.test(s) ? +s : words[s.toLowerCase()]);
  const all = PAGES.map(([, , file]) => [file, prose(page(file) || '', { mermaid: true })]);
  // The session figure is size.mjs's total rounded to 10 (absent before the size check lands).
  const sizer = join(repo, 'plugins/gtm/scripts/size.mjs');
  let tokens = null;
  if (existsSync(sizer)) {
    let out = '';
    try { out = execFileSync(process.execPath, [sizer, '--plugin', join(repo, 'plugins/gtm')], { encoding: 'utf8' }); }
    catch (e) { out = (e.stdout || '').toString(); }
    const total = +(out.match(/^\s*(\d+)\s+total\b/m) || [])[1];
    if (total) tokens = (Math.round(total / 10) * 10).toLocaleString('en-GB');
    else f.push('size.mjs printed no total');
  }
  const dated = {};
  for (const [file, t] of all) {
    // Two defaults since 0.7.0: per task, and per standard review (a sentence about a wave or a standard task).
    for (const m of t.matchAll(/\b(\d+|one|two|three|four|five)\s+correction rounds?\b/gi)) {
      const sentence = t.slice(Math.max(0, t.lastIndexOf('.', m.index) + 1), t.indexOf('.', m.index) + 1 || undefined);
      const want = /\b(standard|wave)\b/i.test(sentence) ? standard : rounds;
      if (num(m[1]) !== want) f.push(`${file}: "${m[0]}", default is ${want}`);
    }
    for (const m of t.matchAll(/\b(\d+|three|four|five)[- ]files? (limit|at most)|file limit[^.]{0,40}?\b(\d+) files?/gi)) { const n = num(m[1] || m[3]); if (n !== ceiling) f.push(`${file}: "${m[0]}", default is ${ceiling}`); }
    for (const m of t.matchAll(/\b(\d+)\/10\b/g)) if (+m[1] !== threshold) f.push(`${file}: "${m[0]}", default is ${threshold}/10`);
    for (const m of t.matchAll(/\b(\d+|ten|eleven|twelve)\s+(role agents|roles)\b/gi)) if (num(m[1]) !== agents.length) f.push(`${file}: "${m[0]}", there are ${agents.length} agents`);
    if (tokens) for (const m of t.matchAll(/\b(about|around)\s+([\d,]+)\s+tokens\b/gi)) {
      if (m[2] !== tokens) f.push(`${file}: "${m[0]}", the measured figure is ${tokens}`);
      // A page that dates the figure dates it like every other page does.
      const v = (t.slice(m.index, m.index + 120).match(/\b(?:in|on)(?: GTM)?\s+(\d+\.\d+\.\d+)\b/) || [])[1];
      if (v) (dated[v] ||= []).push(file);
    }
  }
  const roles = page('reference/roles.md') || '';
  for (const a of agents) {
    const fm = readFileSync(join(repo, 'plugins/gtm/agents', a), 'utf8');
    const effort = (fm.match(/^effort:\s*(\w+)/m) || [])[1];
    const name = a.replace(/\.md$/, '');
    const row = roles.split('\n').find(l => l.startsWith(`| \`${name}\` |`));
    if (!row) f.push(`roles.md has no row for \`${name}\``);
    else if (!new RegExp(`\\|\\s*${effort}\\b`).test(row)) f.push(`roles.md row ${name} lacks its default effort ${effort}`);
  }
  if (Object.keys(dated).length > 1) f.push(`the token figure is dated to different versions: ${Object.entries(dated).map(([v, fs]) => `${v} (${fs.join(', ')})`).join(', ')}`);
  if (tokens && !all.some(([, t]) => new RegExp(`\\b${tokens} tokens\\b`).test(t))) f.push(`no page states about ${tokens} tokens per session`);
  if (!all.some(([, t]) => new RegExp(`\\b${threshold}/10\\b`).test(t))) f.push(`no page states the ${threshold}/10 design threshold`);
  // The cost guide's summary counts its lever table.
  const slow = unfront(page('guides/too-slow.md') || '');
  const said = (slow.match(/\b(\d+|\w+) levers that lower it\b/) || [])[1];
  const table = (slow.split(/^## /m).find(s => s.startsWith('Which levers')) || '').split('\n').filter(l => /^\| (?!Lever \||---)/.test(l));
  if (said && num(said) !== table.length) f.push(`too-slow.md: "${said} levers", the table has ${table.length}`);
  return f;
});

check('A12', () => {
  const f = [];
  const t = page('guides/which-size.md') || '';
  const first = mermaids(t)[0];
  if (!first) return ['which-size.md has no diagram'];
  if (!/^\s*(flowchart|graph) (TD|TB)\b/m.test(first)) f.push('the first diagram is not top-down');
  const leaves = Object.values(nodes(first)).map(n => n.label.trim());
  for (const w of ['Fix', 'Feature', 'Milestone']) if (!leaves.includes(w)) f.push(`the tree has no "${w}" node`);
  return f;
});

check('A13', () => {
  const f = [];
  const t = unfront(page('guides/which-size.md') || '');
  for (const track of ['Fix', 'Feature', 'Milestone']) {
    const sec = t.split(/^#{2,3} /m).find(s => new RegExp(`^What does a ${track} ask of me\\?`).test(s));
    if (!sec) { f.push(`no "What does a ${track} ask of me?" heading`); continue; }
    const src = mermaids(sec)[0];
    if (!src) { f.push(`${track}: no journey diagram`); continue; }
    const ns = Object.values(nodes(src));
    if (track === 'Fix' && ns.some(n => /final review/i.test(n.label))) f.push('the Fix journey has a final review node');
    if (!ns.some(n => n.you)) f.push(`${track}: no amber node`);
    for (const n of ns) {
      const says = /\byou\b|\byour\b|checkpoint/i.test(n.label);
      if (n.you && !says) f.push(`${track}: amber node "${n.label}" does not say it is yours`);
      if (!n.you && /^you\b|checkpoint/i.test(n.label.trim())) f.push(`${track}: checkpoint "${n.label}" is not amber`);
    }
  }
  return f;
});

check('A14', () => {
  const f = [];
  const t = unfront(page('tutorial/first-feature.md') || '');
  const after = t.replace(/^\s*# .*\n/, '').replace(/^\s*::: callout summary\n[\s\S]*?\n:::\s*/, '');
  if (!/^<nav class="gtm-tracker"/.test(after)) f.push('the tracker does not open the page (right after the summary)');
  const nav = (t.match(/<nav class="gtm-tracker"[\s\S]*?<\/nav>/) || [''])[0];
  const lis = nav.match(/<li\b[\s\S]*?<\/li>/g) || [];
  if (lis.length !== 6) f.push(`${lis.length} tracker cells, want 6`);
  if (lis.filter(l => /class="[^"]*\bis-you\b/.test(l)).length !== 3) f.push('want exactly 3 amber (is-you) cells');
  lis.forEach((l, i) => {
    if (!/<a [^>]*href="#[^"]+"/.test(l)) f.push(`cell ${i + 1} is not a link to its step`);
    if (!/class="w"[^>]*>\s*[^<\s][^<]*</.test(l)) f.push(`cell ${i + 1} does not name who works (span class="w")`);
  });
  const near = t.slice(t.indexOf('<nav class="gtm-tracker"'), t.indexOf('<nav class="gtm-tracker"') + nav.length + 400);
  if (!/reference\/roles\//.test(near)) f.push('no link to Roles in or right after the tracker');
  return f;
});

check('A15', () => {
  const f = [];
  const loop = mermaids(page('reference/roles.md') || '').find(s => /correction round/i.test(s));
  if (!loop) f.push('roles.md has no correction-loop diagram');
  else {
    const ns = nodes(loop), order = Object.keys(ns), es = edges(loop);
    if (!es.some(([a, b]) => /correction round/i.test(ns[a]?.label || '') && order.indexOf(b) < order.indexOf(a))) f.push('the correction loop has no edge back to the reviewers');
    if (!/\b3\b|three/i.test(loop)) f.push('the loop does not say three rounds');
    if (!Object.values(ns).some(n => n.you && /\byou\b/i.test(n.label))) f.push('the loop does not end with your choice, amber');
  }
  const grow = mermaids(page('guides/which-size.md') || '').find(s => /becomes a Feature/i.test(s));
  if (!grow) f.push('which-size.md has no "a Fix becomes a Feature" diagram');
  else if (!Object.values(nodes(grow)).some(n => n.you && /spec|summary/i.test(n.label))) f.push('the grown Fix does not continue at the spec checkpoint (amber)');
  return f;
});

check('A16', () => {
  const f = [];
  const t = page('reference/gtm-folder.md') || '';
  const tree = (t.match(/<figure class="gtm-tree"[\s\S]*?<\/figure>/) || [''])[0];
  const lis = (tree.match(/<li\b[\s\S]*?<\/li>/g) || []).slice(1);
  if (!lis.length) return ['no tree card'];
  const read = [];
  for (const l of lis) {
    const name = (l.match(/<code>([^<]+)<\/code>/) || [])[1];
    const badge = (l.match(/class="badge">([^<]+)</) || [])[1];
    if (!['read it', 'skip it'].includes(badge)) f.push(`${name}: badge "${badge}"`);
    if (badge === 'read it') read.push(name);
    if ((badge === 'read it') !== /class="[^"]*\byou\b/.test(l)) f.push(`${name}: badge and amber row disagree`);
  }
  const want = ['brief.md', 'team.md', 'backlog.md', 'specs/', 'mockups/', 'NOW.md'];
  if (JSON.stringify(read.sort()) !== JSON.stringify(want.sort())) f.push(`read it on ${read.join(', ')}, want ${want.join(', ')}`);
  const words = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 };
  for (const m of t.matchAll(/\b(one|two|three|four|five|six|seven|eight)\s+(?:you actually read|entries)\b|\bread\s+(one|two|three|four|five|six|seven|eight)\s+entries\b/gi)) {
    const n = words[(m[1] || m[2]).toLowerCase()];
    if (n !== read.length) f.push(`"${m[0]}", the tree marks ${read.length} read it`);
  }
  return f;
});

check('A18', () => {
  const f = [];
  for (const [, , file] of PAGES) {
    for (const src of mermaids(page(file) || '')) {
      const dir = (src.match(/^\s*(?:flowchart|graph)\s+(\w+)/m) || [])[1];
      if (!dir) continue;
      const n = Object.keys(nodes(src)).length;
      if (/^(LR|RL)$/.test(dir) && n > 4) f.push(`${file}: a ${dir} chart of ${n} nodes`);
      if (/^(TD|TB)$/.test(dir) === false && file.startsWith('guides/')) f.push(`${file}: a guide flowchart that is not top-down`);
    }
  }
  return f;
});

check('A27', () => {
  const f = [];
  const dir = join(repo, 'docs/assets/fonts');
  const fonts = walk(dir).filter(p => p.endsWith('.woff2'));
  if (!fonts.length) f.push('no font under docs/assets/fonts');
  for (const p of fonts) {
    const fam = p.split('/').pop().replace(/-latin.*$/, '');
    const lic = join(dir, `OFL-${fam}.txt`);
    if (!existsSync(lic)) { f.push(`${fam}: no OFL-${fam}.txt beside it`); continue; }
    const t = readFileSync(lic, 'utf8');
    if (!/SIL OPEN FONT LICENSE Version 1\.1/.test(t)) f.push(`OFL-${fam}.txt is not the OFL 1.1 text`);
    if (!/^Copyright .+/m.test(t)) f.push(`OFL-${fam}.txt has no copyright notice`);
  }
  if (walk(dir).some(p => p.endsWith('.md'))) f.push('a .md under docs/assets/fonts would render as a page');
  const css = read('docs/assets/css/gtm.css') || '';
  for (const m of css.matchAll(/@font-face\s*{[^}]*}/g)) if (/url\(["']?(https?:)?\/\//.test(m[0])) f.push('a @font-face loads from another origin');
  if (/fonts\.(googleapis|gstatic)|@import url\(["']?https?:/.test(css)) f.push('gtm.css imports from a font CDN');
  if (existsSync(join(repo, 'site', 'index.html'))) {
    for (const p of fonts) { const fam = p.split('/').pop().replace(/-latin.*$/, ''); if (!existsSync(join(repo, 'site/assets/fonts', `OFL-${fam}.txt`))) f.push(`the build does not ship OFL-${fam}.txt`); }
    if (walk(join(repo, 'site')).some(p => /\/OFL-[^/]*\/index\.html$|ofl-[^/]*\/index\.html$/i.test(p))) f.push('a licence is rendered as a page');
  }
  return f;
});

check('A28', () => {
  const f = [];
  const tracked = git('ls-files').split('\n');
  for (const p of tracked) if (/(^|\/)(package(-lock)?\.json|yarn\.lock|pnpm-lock\.yaml|npm-shrinkwrap\.json)$/.test(p)) f.push(`tracked manifest or lockfile: ${p}`);
  for (const p of tracked) if (/^site\//.test(p)) f.push(`tracked build output: ${p}`);
  try { git('check-ignore', '-q', 'site/index.html'); } catch { f.push('site/ is not ignored'); }
  const cfg = JSON.parse(read('docmd.config.json') || '{}');
  if (cfg.out !== 'site' || cfg.src !== 'docs') f.push(`docmd config src/out ${cfg.src}/${cfg.out}, want docs/site`);
  if (cfg.plugins?.ai !== false) f.push('the ai plugin is not off');
  if (cfg.markdown?.breaks !== false) f.push('markdown.breaks is not false');
  return f;
});

const wf = () => read('.github/workflows/pages.yml');
const jobs = t => {
  const out = {};
  const lines = t.split('\n');
  const start = lines.findIndex(l => /^jobs:\s*$/.test(l));
  let cur = null;
  for (const l of lines.slice(start + 1)) {
    if (/^\S/.test(l)) break;
    const m = l.match(/^  ([\w-]+):\s*$/);
    if (m) { cur = m[1]; out[cur] = ''; } else if (cur) out[cur] += l + '\n';
  }
  return out;
};
const perms = block => { const m = block.match(/^    permissions:\s*\n((?:      .+\n)+)/m); return m ? m[1].trim().split('\n').map(s => s.trim()).sort() : null; };

check('A29', () => {
  const t = wf();
  if (!t) return ['no .github/workflows/pages.yml'];
  const f = [];
  const on = (t.match(/^on:\s*\n((?:[ \t]+.*\n|\s*\n)+)/m) || [])[1] || '';
  if (!/^  pull_request:/m.test(on)) f.push('not run on pull_request');
  if (!/^  push:\s*\n\s+branches:\s*(\[\s*main\s*\]|\n\s+- main)/m.test(on)) f.push('not run on push to main only');
  const j = jobs(t);
  if (!j.build || !j.deploy) return [...f, `jobs ${Object.keys(j).join(', ')}, want build and deploy`];
  if (!/@docmd\/core@0\.9\.7 build/.test(j.build)) f.push('build job does not run the pinned docmd build');
  if (!/^    needs:\s*build\s*$/m.test(j.deploy)) f.push('deploy does not need build');
  if (!/^    if:\s*github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'\s*$/m.test(j.deploy)) f.push("deploy is not limited to a push to main (if: github.event_name == 'push' && github.ref == 'refs/heads/main')");
  if (/continue-on-error:\s*true/.test(t)) f.push('a step may fail without failing the check');
  return f;
});

check('A30', () => {
  const t = wf();
  if (!t) return ['no .github/workflows/pages.yml'];
  const f = [];
  const j = jobs(t);
  if (/pull_request_target/.test(t)) f.push('uses pull_request_target');
  if (!/^permissions:\s*\{\s*\}\s*$/m.test(t)) f.push('top-level permissions are not {}');
  if (JSON.stringify(perms(j.build || '')) !== JSON.stringify(['contents: read'])) f.push(`build permissions ${JSON.stringify(perms(j.build || ''))}, want contents: read only`);
  if (JSON.stringify(perms(j.deploy || '')) !== JSON.stringify(['id-token: write', 'pages: write'])) f.push(`deploy permissions ${JSON.stringify(perms(j.deploy || ''))}, want pages: write and id-token: write only`);
  if (!/^    environment:\s*\n\s+name:\s*github-pages\b/m.test(j.deploy || '')) f.push('deploy is not in the github-pages environment');
  if (/actions\/checkout|^\s*(- )?run:/m.test(j.deploy || '')) f.push('deploy runs a checkout or a command');
  if (!/persist-credentials:\s*false/.test(j.build || '')) f.push('build checkout persists its token');
  if (/secrets\.|github\.token|GITHUB_TOKEN/.test(j.build || '')) f.push('build job reads a secret or the token');
  // Set once for the whole job, so no step runs npm with install scripts on; npm reads the
  // variable in any case, so a step may not set it to anything else.
  if (!/^    env:\s*\n(?:      .+\n)*?      npm_config_ignore_scripts:\s*["']?true["']?\s*$/m.test(j.build || '')) f.push('package install scripts are not disabled for the whole build job (env: npm_config_ignore_scripts: true)');
  for (const m of (j.build || '').matchAll(/npm_config_ignore_scripts:\s*(.*)$/gim)) if (!/^["']?true["']?\s*$/.test(m[1])) f.push(`a build step sets npm_config_ignore_scripts to ${m[1].trim()}`);
  for (const m of t.matchAll(/uses:\s*([^\s#]+)/g)) if (!/@[0-9a-f]{40}$/.test(m[1])) f.push(`not pinned to a full SHA: ${m[1]}`);
  if (!/^    concurrency:\s*\n\s+group:\s*\S+\s*\n\s+cancel-in-progress:\s*false\s*$/m.test(j.deploy || '')) f.push('deploy has no concurrency group with cancel-in-progress: false');
  return f;
});

check('A31', () => {
  const f = [];
  // From the merge base to the working tree, so the check runs before the commit too.
  const range = git('merge-base', base, 'HEAD').trim();
  const changed = [...git('diff', '--name-only', range).split('\n'), ...git('ls-files', '--others', '--exclude-standard').split('\n')].filter(Boolean);
  for (const p of changed) if (p.startsWith('plugins/')) f.push(`changes ${p}`);
  if (changed.includes('.claude-plugin/marketplace.json')) f.push('changes the marketplace manifest');
  const log = read('CHANGELOG.md') || '';
  if ((log.match(/^## \[Unreleased\]$/gm) || []).length !== 1) f.push('CHANGELOG has not exactly one ## [Unreleased]');
  const diff = git('diff', '-U0', range, '--', 'CHANGELOG.md');
  if (/^\+## /m.test(diff)) f.push('the branch adds a ## heading to CHANGELOG');
  if (/^-(?!--)/m.test(diff)) f.push('the branch removes a CHANGELOG line');
  const unrel = (log.split(/^## \[Unreleased\]$/m)[1] || '').split(/^## \[/m)[0];
  for (const l of diff.split('\n').filter(l => /^\+[^+]/.test(l))) if (!unrel.includes(l.slice(1))) f.push(`a CHANGELOG line outside [Unreleased]: ${l.slice(1, 60)}`);
  if (!/^### Added\n(- [\s\S]*?)\bsite\b/m.test(unrel)) f.push('no ### Added line for the site under [Unreleased]');
  if (!/^### Changed\n[\s\S]*?README/m.test(unrel)) f.push('no ### Changed line for the README under [Unreleased]');
  return f;
});

check('A32', () => {
  const f = [];
  const t = read('README.md') || '';
  const heads = (t.match(/^## .+$/gm) || []).map(h => h.replace(/^## \W*\s*/u, ''));
  const allowed = /^(What GTM is|Install|What it costs|Documentation|Licen[cs]e)$/;
  for (const h of heads) if (!allowed.test(h)) f.push(`README section "${h}" is not one of: what GTM is, install, what it costs, documentation, licence`);
  for (const sec of t.split(/^## /m).slice(1)) {
    const name = sec.split('\n')[0];
    if (/licen[cs]e/i.test(name)) continue;
    if (!sec.includes(SITE_URL)) f.push(`README "${name.trim()}" does not link to the site`);
  }
  const intro = t.split(/^## /m)[0];
  if (!intro.includes(SITE_URL)) f.push('README intro (what GTM is) does not link to the site');
  const cost = (t.split(/^## .*cost.*$/im)[1] || '').split(/^## /m)[0];
  const rows = cost.split('\n').filter(l => /^\|/.test(l)).slice(2);
  if (!rows.length) f.push('no cost table');
  for (const r of rows) if (!/\b0\.\d+\.\d+\b/.test(r)) f.push(`cost row names no release: ${r.slice(0, 60)}`);
  if (/\]\(\.?\/?\.gtm\b|href="\.?\/?\.gtm\b/.test(t)) f.push('README links into a local folder');
  const alt = (t.match(/<img[^>]*alt="([^"]*)"/) || [])[1] || '';
  for (const w of [/\bmockups\b/i, /\bsummary\b/i, /\bgo\b/i]) if (!w.test(alt)) f.push(`banner alt lacks ${w}`);
  if (/\bboard\b|\bspec synthesis\b/i.test(alt)) f.push('banner alt keeps an old word');
  for (const b of ['docs/assets/banner-light.png', 'docs/assets/banner-dark.png']) {
    try { git('diff', '--quiet', git('merge-base', base, 'HEAD').trim(), '--', b); f.push(`${b} not redrawn`); } catch { /* changed */ }
  }
  return f;
});

check('A33', () => {
  const f = [];
  const removed = /docs\/(manifesto|positions|principles|method|roles|glossary|install|companions|contributing)(\.md)?\b/;
  for (const p of git('ls-files').split('\n').filter(Boolean)) {
    if (p.startsWith('docs/') || p.startsWith('scripts/fixtures/')) continue;
    let t;
    try { t = readFileSync(join(repo, p), 'utf8'); } catch { continue; }
    if (p === 'CHANGELOG.md') t = (t.split(/^## \[Unreleased\]$/m)[1] || '').split(/^## \[/m)[0];
    t.split('\n').forEach((l, i) => { if (removed.test(l)) f.push(`${p}:${i + 1} links a removed docs path`); });
  }
  needBuild();
  const root = join(repo, 'site');
  const htmls = walk(root).filter(p => p.endsWith('.html'));
  const ids = new Map();
  const idsOf = p => { if (!ids.has(p)) ids.set(p, new Set([...readFileSync(p, 'utf8').matchAll(/\bid="([^"]+)"/g)].map(m => m[1]))); return ids.get(p); };
  let n = 0;
  for (const p of htmls) {
    const html = readFileSync(p, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
    for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      let u = m[1];
      if (/^(mailto:|javascript:|data:|tel:)/.test(u)) continue;
      if (u.startsWith(SITE_URL)) u = posix.relative(posix.dirname(p.slice(root.length) || '/'), u.slice(SITE_URL.length) || '/') || '.';
      else if (/^[a-z]+:\/\//i.test(u) || u.startsWith('//')) continue;
      n++;
      const [pathPart, frag] = u.split('#');
      const clean = decodeURIComponent(pathPart.split('?')[0]);
      let target = clean === '' ? p : clean.startsWith('/') ? join(root, clean.replace(/^\/GentleTeaM/, '')) : join(dirname(p), clean);
      if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
      if (!existsSync(target)) { f.push(`${p.slice(root.length)}: broken ${m[1]}`); continue; }
      if (frag && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(frag))) f.push(`${p.slice(root.length)}: no #${frag} in ${target.slice(root.length)}`);
    }
  }
  if (!n) f.push('the crawl found no internal link');
  return f;
});

// The plugin's human-facing headings keep the site's plain words (B1): the briefing template, the
// templates' and skills' headings. Parsed lines (team.md Gates, workflow statuses) are not headings.
check('vocab', () => {
  const f = [];
  const retired = /\b(touchpoints?|boards?|(?<!made )for[- ]you|rulings?|team profile|fix rounds?|fix ceiling|replay)\b/i;
  const dir = join(repo, 'plugins', 'gtm');
  const files = ['templates/briefing.md', 'templates/spec.md', 'templates/plan.md', 'templates/team.md', 'templates/now.md', 'templates/handoff.md',
    ...readdirSync(join(dir, 'skills')).map(d => `skills/${d}/SKILL.md`)];
  for (const rel of files) {
    if (!existsSync(join(dir, rel))) continue;
    readFileSync(join(dir, rel), 'utf8').split('\n').forEach((l, i) => {
      const m = /^#{1,6} /.test(l) && l.match(retired);
      if (m) f.push(`plugins/gtm/${rel}:${i + 1}: "${m[0]}" in a heading`);
    });
  }
  return f;
});
check('A34', () => {
  const f = [];
  const t = page('tutorial/first-feature.md') || '';
  const blocks = t.split(/^::: callout see "In your terminal"$/m).slice(1).map(b => b.split(/^:::$/m)[0] + (b.split(/^:::$/m)[1] || '').slice(0, 300));
  if (!blocks.length) f.push('no "In your terminal" block');
  if (!final) {
    blocks.forEach((b, i) => { if (!/Illustrative text/.test(b)) f.push(`terminal block ${i + 1} has no "Illustrative text" note`); });
    return f;
  }
  if (/Illustrative text/i.test(t)) f.push('an illustrative block remains');
  if (!/github\.com\/MorganKryze\/(?!GentleTeaM|belay)[\w.-]+/.test(t)) f.push('no link to the sample repository');
  if (!/\b0\.\d+\.\d+\b/.test(t)) f.push('the run names no release');
  if (!/\b\d+(\.\d+)? (min|minutes|s)\b/.test(prose(t))) f.push('no measured time');
  // A run on a project without screens skips checkpoint 1 and has no mockup to show.
  const noScreens = /checkpoint 1 is skipped\s+because\s+the\s+project\s+has\s+no\s+screens/i.test(prose(t));
  if (!noScreens && !/!\[[^\]]{12,}\]\([^)]+\.(png|webp|jpg)\)/.test(t)) f.push('no mockup image with alt text');
  return f;
});

let failed = 0;
for (const [id, fails] of results) {
  if (fails.length) failed++;
  console.log(`${fails.length ? 'FAIL' : 'PASS'} ${id}${fails.length ? ` (${fails.length})` : ''}`);
  for (const x of fails.slice(0, 25)) console.log(`  ${x}`);
  if (fails.length > 25) console.log(`  ... ${fails.length - 25} more`);
}
console.log(`${results.length - failed} pass, ${failed} fail`);
process.exit(failed ? 1 : 0);
