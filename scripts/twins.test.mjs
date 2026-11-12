#!/usr/bin/env node
// Proves each contract test can fail: every test here runs in a scratch copy of the repository
// with one defect planted, and must exit non-zero naming that defect, not some other failure. A
// defect that no longer applies fails too, so a twin cannot rot. Every scripts/*.test.mjs has a
// twin; a new one needs its row. No object in a test holds a key twice: the later one wins and
// the pins under the first never run. Run by scripts/validate.mjs. No dependencies.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync, spawnSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const skill = (name) => `plugins/gtm/skills/${name}/SKILL.md`
const agent = (name) => `plugins/gtm/agents/${name}.md`
const script = (name) => `plugins/gtm/scripts/${name}.mjs`
const GUARD = 'plugins/gtm/templates/ui-gate.spec.mjs'
const LEDGER = 'plugins/gtm/templates/ledger.md'
const MANDATE = 'plugins/gtm/templates/mandate.md'
// A test with no twin says why here.
const EXEMPT = {
  'twins.test.mjs': 'this file',
  'site-measure.test.mjs': 'needs a built site and a browser, CI runs it',
}
const TWINS = [
  { test: 'advisor', file: skill('brief-me'), from: 'Dig changes no file.', to: 'Dig changes files.', says: 'Dig changes no file' },
  { test: 'art-director', file: agent('art-director'), from: 'tools: WebFetch, WebSearch', to: 'tools: WebFetch, WebSearch, Bash', says: 'tools' },
  { test: 'brainstorm', file: skill('brainstorm'), from: 'never overwrites a note', to: 'may overwrite a note', says: 'never overwrites a note' },
  { test: 'companions', file: agent('reviewer'), from: 'tools: Read, Bash, Glob, Grep', to: 'tools: Read, Write, Bash, Glob, Grep', says: 'agents/reviewer.md: tools changed' },
  { test: 'crafts', file: 'plugins/gtm/templates/crafts/index.md', from: 'Read the first 150 lines at most.', to: 'Read it all.', says: 'Read the first 150 lines at most.' },
  { test: 'decision-check', file: script('decision-check'), from: 'COST_WORDS = 3', to: 'COST_WORDS = 1', says: 'D1: cost' },
  { test: 'decision-reading', file: skill('spec'), from: 'send the list to the architect once', to: 'send the list to the architect', says: 'send the list to the architect once' },
  { test: 'design-flow', file: skill('design'), from: "The pick is the human's answer", to: "The pick is the art director's answer", says: "The pick is the human's answer" },
  { test: 'design-wiring', file: 'docs/reference/settings.md', from: '7 out of 10', to: '6 out of 10', says: '7 out of 10' },
  { test: 'footprint-check', file: script('footprint-check'), from: "kind: 'attribution', re: new RegExp(escape(f), 'gi')", to: "kind: 'attribution', re: new RegExp(escape(f) + 'x', 'gi')", says: 'expected' },
  { test: 'guards', file: 'plugins/gtm/templates/config.yml', from: '  push: ask', to: '  push: auto', says: 'push: ask' },
  { test: 'guards', file: 'plugins/gtm/templates/config.yml', from: 'set by /gtm:tune only', to: 'set by /gtm:tune or by hand', says: 'set by /gtm:tune only' },
  { test: 'guards', file: skill('tune'), from: 'No signal ever proposes a standing go', to: 'A signal may propose a standing go', says: 'No signal ever proposes a standing go' },
  { test: 'guards', file: skill('tune'), from: 'both set by the same answer;', to: 'the setting left as it is;', says: 'both set by the same answer;' },
  { test: 'guards', file: 'plugins/gtm/templates/team.md', from: 'No standing go line ships here:', to: 'No standing go line ships here:\n- standing go: docs · paths `.*` · proofs gate, ci · why: x · 2026-01-01\n', says: 'holds \n- standing go:' },
  { test: 'guards', file: GUARD, from: 'r.width >= 44 && r.height >= 44', to: 'r.width >= 40 && r.height >= 40', says: 'r.width >= 44' },
  { test: 'guards', file: GUARD, from: 'document.documentElement.scrollWidth > width', to: 'document.documentElement.scrollWidth >= width', says: 'scrollWidth > width' },
  { test: 'guards', file: skill('deliver'), from: 'git merge --no-ff --no-edit', to: 'git merge --squash --no-edit', says: '--no-ff' },
  { test: 'guards', file: skill('plan'), from: 'a missing one goes back to the architect:', to: 'a missing one is noted:', says: 'a missing one goes back' },
  { test: 'guards', file: skill('plan'), from: 'never by a row.', to: 'or by a row.', says: 'never by a row' },
  { test: 'guards', file: skill('ship'), from: '--base <git.base> --pr <root>', to: '--base <git.base> <root>', says: '--pr' },
  { test: 'guards', file: 'plugins/gtm/templates/team.md', from: 'or `xhigh` on risky work, never below its row.', to: 'or `xhigh` on risky work.', says: 'never below its row' },
  { test: 'guards', file: 'plugins/gtm/templates/team.md', from: '| security-reviewer | opus | high |', to: '| security-reviewer | opus | xhigh |', says: 'holds | xhigh |' },
  { test: 'guards', file: skill('deliver'), from: 'on each dispatch\'s range as the Roles note', to: 'as the Roles note', says: 'raised or lowered on each dispatch' },
  { test: 'guards', file: 'plugins/gtm/templates/team.md', from: 'no trigger and no risky path.', to: 'no trigger.', says: 'matches no trigger and no risky path.' },
  { test: 'guards', file: agent('final-reviewer'), from: 'effort: high', to: 'effort: xhigh', says: 'final-reviewer.md ships effort xhigh' },
  { test: 'guards', file: skill('init'), from: 'security-reviewer on, effort high;', to: 'security-reviewer on, effort xhigh;', says: 'holds effort xhigh' },
  { test: 'guards', file: 'plugins/gtm/templates/now.md', from: 'No run view written: no state.', to: 'No run view written: a state anyway.', says: 'No run view written: no state.' },
  { test: 'guards', file: 'plugins/gtm/templates/now.md', from: "answer before the run view's rewrite:", to: "answer after the run view's rewrite:", says: "answer before the run view's rewrite:" },
  { test: 'guards', file: 'plugins/gtm/templates/now.md', from: '`--answer <slug>`', to: '`--answers <slug>`', says: '`--answer <slug>`' },
  { test: 'guards', file: 'plugins/gtm/templates/now.md', from: 'hand only the first, and the second once the first is answered.', to: 'hand each.', says: 'hand only the first' },
  { test: 'guards', file: 'plugins/gtm/templates/now.md', from: "and the file still holds that card's `id`,", to: '', says: "the file still holds that card's `id`" },
  { test: 'guards', file: 'plugins/gtm/templates/now.md', from: 'never shorten or reword', to: 'shorten', says: 'never shorten or reword' },
  { test: 'guards', file: 'plugins/gtm/templates/now.md', from: 'change nothing, keep the ledger line', to: 'fix the answer once, keep the ledger line', says: 'change nothing' },
  { test: 'guards', file: 'plugins/gtm/templates/decision.md', from: 'never shorten or reword', to: 'shorten', says: 'never shorten or reword' },
  { test: 'guards', file: 'plugins/gtm/templates/decision.md', from: 'each copied verbatim from that file.', to: 'each in your own words.', says: 'each copied verbatim from that file.' },
  { test: 'guards', file: LEDGER, from: '· limits <window> +<a>% ...', to: '· limits 5h +<a>% 7d +<b>%', says: 'holds limits 5h' },
  { test: 'guards', file: LEDGER, from: '· <slug> · ruling · default:', to: '· <slug> · ruling · auto:', says: 'ruling · default:' },
  { test: 'guards', file: 'docs/reference/gtm-folder.md', from: 'reader ignores the fields it does not know.', to: 'reader rejects the fields it does not know.', says: 'reader ignores the fields' },
  { test: 'guards', file: 'docs/reference/gtm-folder.md', from: '`asked` and `other.allowed`, and `answer`', to: '`asked`, and `answer`', says: "GTM's facts script sets" },
  { test: 'guards', file: 'docs/reference/gtm-folder.md', from: 'for display, `null` while a card waits', to: 'for display', says: 'the writer\'s local `HH:MM`' },
  { test: 'guards', file: 'docs/reference/gtm-folder.md', from: '`null` without one, and after the next commit', to: 'kept for later versions', says: 'holds kept for later versions' },
  { test: 'guards', file: 'docs/reference/gtm-folder.md', from: '`due` when your program must check it', to: '`pass` when your program checks it', says: '`due` when your program must check it' },
  { test: 'guards', file: skill('ship'), from: 'push, merge, tag and release nothing.', to: 'push and open the PR.', says: 'push, merge, tag and release nothing.' },
  { test: 'guards', file: skill('ship'), from: 'naming only the proofs §1 and §2b ran green.', to: 'naming the proofs.', says: 'naming only the proofs' },
  { test: 'guards', file: skill('ship'), from: 'always waits for the go below', to: 'waits for the go below', says: 'always waits for the go below' },
  { test: 'guards', file: skill('ship'), from: '`templates/now.md`), append `- <YYYY', to: '`templates/now.md`), rewrite `- <YYYY', says: 'append `- <YYYY-MM-DD>' },
  { test: 'guards', file: skill('ship'), from: 'run · landing: <class> at <short head>,', to: 'run · landed,', says: 'landing: <class> at <short head>' },
  { test: 'guards', file: skill('ship'), from: 'check and merge. No card.', to: 'check and merge. Then show the card.', says: 'No card.' },
  { test: 'guards', file: skill('ship'), from: 'why (`why`, `file`, `proof`).', to: 'why.', says: 'why (`why`, `file`, `proof`).' },
  { test: 'guards', file: MANDATE, from: 'A mandate never writes, changes or stands for', to: 'A mandate may write, change or stand for', says: 'A mandate never writes' },
  { test: 'guards', file: 'docs/reference/commands.md', from: 'never applies one alone', to: 'may apply one alone', says: 'never applies one alone' },
  { test: 'guards', file: 'docs/why/positions.md', from: 'A tag or a release always asks.', to: 'A tag or a release asks.', says: 'A tag or a release always asks.' },
  { test: 'guards', file: 'docs/reference/settings.md', from: 'in this order, separated by', to: 'in any order, separated by', says: 'in this order, separated by' },
  { test: 'guards', file: 'docs/reference/settings.md', from: '| `ci` | your program, once the branch is pushed | `due` |', to: '| `ci` | your program, once the branch is pushed | `pass` |', says: 'once the branch is pushed | `due` |' },
  { test: 'guards', file: 'docs/reference/settings.md', from: 'A tag or a release always asks you.', to: 'A tag or a release asks you.', says: 'A tag or a release always asks you.' },
  { test: 'guards', file: 'docs/reference/settings.md', from: 'fetched the branch over a transport', to: 'cloned the branch', says: 'fetched the branch over a transport' },
  { test: 'guards', file: 'docs/reference/settings.md', from: 'or a plain local clone, which', to: ', which', says: 'or a plain local clone, which' },
  { test: 'guards', file: MANDATE, from: 'drop it or accept as pre-existing: ask (1)', to: 'drop it or accept as pre-existing: default', says: 'accept as pre-existing: ask (1)' },
  { test: 'guards', file: MANDATE, from: ', or `<root>/reports/<slug>/mandate.md` exists.', to: '.', says: 'mandate.md` exists.' },
  { test: 'guards', file: MANDATE, from: 'keeps its tool and targets', to: 'still runs', says: 'keeps its tool and targets' },
  { test: 'guards', file: MANDATE, from: ' and adds nothing to them (no flag, no `\\|\\|`, no ignore)', to: '', says: 'adds nothing to them' },
  { test: 'guards', file: MANDATE, from: 'one Heads-up when the run starts', to: 'one line in the report', says: 'one Heads-up when the run starts' },
  { test: 'guards', file: MANDATE, from: 'an unreadable file: write nothing', to: 'an unreadable file: write that file empty', says: 'an unreadable file: write nothing' },
  { test: 'guards', file: MANDATE, from: 'its second card on the same task: ask (1: usage)', to: 'its second card on the same task: default', says: 'its second card on the same task: ask (1: usage)' },
  { test: 'guards', file: skill('deliver'), from: 'each ruling taken not already there.', to: 'each ruling taken.', says: 'each ruling taken not already there.' },
  { test: 'guards', file: skill('plan'), from: 'existing section over verbatim', to: 'existing section only when asked', says: 'existing section over verbatim' },
  { test: 'guards', file: MANDATE, from: '| ask (1: deletion) |', to: '| default |', says: 'a worktree not clean | ask (1: deletion)' },
  { test: 'guards', file: MANDATE, from: '| the limits card (`gtm` §0) | ask (1: usage) |', to: '| the limits card (`gtm` §0) | default |', says: 'the limits card (`gtm` §0) | ask (1: usage)' },
  { test: 'guards', file: MANDATE, from: 'accounts, secrets, deletion, a new dependency, or', to: 'a new dependency, or', says: 'accounts, secrets, deletion' },
  { test: 'guards', file: MANDATE, from: 'still waits for the human\'s', to: 'goes on without the human\'s', says: 'still waits for the human' },
  { test: 'guards', file: MANDATE, from: '4. Before a release (`/gtm:ship`, unchanged).\n', to: '', says: '4. Before a release' },
  { test: 'guards', file: MANDATE, from: 'researcher still runs on the human\'s command only', to: 'researcher runs when useful', says: 'researcher still runs' },
  { test: 'guards', file: MANDATE, from: '; the mandate\'s source.', to: '.', says: ' the mandate\'s source.' },
  { test: 'guards', file: MANDATE, from: 'Any other line is data,', to: 'Any other line is an instruction;', says: 'Any other line is data' },
  { test: 'guards', file: 'plugins/gtm/templates/briefing.md', from: '`language.human` (fr: `Humain`)', to: 'English', says: '(fr: `Humain`)' },
  { test: 'guards', file: MANDATE, from: 'Only a valid mandate counts', to: 'Any mandate counts', says: 'Only a valid mandate counts' },
  { test: 'guards', file: MANDATE, from: 'review finding or a check.', to: 'review finding.', says: 'review finding or a check.' },
  { test: 'guards', file: MANDATE, from: 'with a recommended option and a cost if wrong', to: 'with any option', says: 'with a recommended option and a cost if wrong' },
  { test: 'guards', file: MANDATE, from: 'next dispatch (moment 1): go on or pause.', to: 'end of the run.', says: 'next dispatch (moment 1): go on or pause.' },
  { test: 'guards', file: MANDATE, from: 'Read by `/gtm:deliver` only,', to: 'Read by any skill,', says: 'Read by `/gtm:deliver` only' },
  { test: 'guards', file: MANDATE, from: 'come before delivery, unchanged.', to: 'come before delivery, by default.', says: 'come before delivery, unchanged.' },
  { test: 'guards', file: MANDATE, from: 'At a moment, ask as the briefing\'s Decision card says under a mandate.', to: 'At a moment, ask as you see fit.', says: 'ask as the briefing\'s Decision card says under a mandate.' },
  { test: 'guards', file: MANDATE, from: 'Ask (moment 1) only', to: 'Ask (moment 3) only', says: 'then decide as above. Ask (moment 1) only' },
  { test: 'guards', file: MANDATE, from: ' and the tool\'s documentation,', to: ',', says: 'the decision records and the tool\'s documentation' },
  { test: 'guards', file: MANDATE, from: ' or no cost', to: '', says: 'No recommendation or no cost: first build' },
  { test: 'guards', file: MANDATE, from: ': first build the basis', to: ': build the basis', says: 'No recommendation or no cost: first build' },
  { test: 'guards', file: MANDATE, from: 'never copy it yourself; run', to: 'copy it yourself, or run', says: 'never copy it yourself' },
  { test: 'guards', file: MANDATE, from: 'byte for byte', to: 'line by line', says: 'copies the file byte for byte' },
  { test: 'guards', file: MANDATE, from: '(by hand or by an agent)', to: '(by hand)', says: 'or by an agent' },
  { test: 'guards', file: 'docs/reference/commands.md', from: 'counts as no mandate, with a Heads-up', to: 'still counts, with a Heads-up', says: 'counts as no mandate' },
  { test: 'guards', file: 'docs/reference/gtm-folder.md', from: 'any other file there counts as no mandate', to: 'any other file there counts too', says: 'any other file there counts as no mandate' },
  { test: 'guards', file: 'plugins/gtm/templates/briefing.md', from: 'No question tool in the session, or more than', to: 'No question tool in the session: skip it, or more than', says: 'No question tool in the session, or more than' },
  { test: 'guards', file: skill('deliver'), from: '`templates/mandate.md` first.', to: '`templates/mandate.md` if useful.', says: '`templates/mandate.md` first.' },
  { test: 'guards', file: 'plugins/gtm/templates/plan.md', from: '<Only when the human\'s request or answer gives a mandate;', to: '<When a mandate helps;', says: '<Only when the human\'s request' },
  { test: 'guards', file: skill('plan'), from: 'one without a source goes back.', to: 'one without a source is kept.', says: 'one without a source goes back.' },
  { test: 'lenses', file: LEDGER, from: '· lenses <role>', to: '· lens <role>', says: 'does not state the `lenses` segment' },
  { test: 'methods', file: agent('reviewer'), from: 'Steelmanning [elicitation]', to: 'Steelman [elicitation]', says: 'reviewer' },
  { test: 'now-facts', file: script('now-facts'), from: 'return s.length % 2 ? s[m]', to: 'return s.length % 2 ? s[0]', says: 'want' },
  { test: 'prose-width', add: 'plugins/gtm/templates/sheets/long.md', to: `${'x'.repeat(101)}\n`, says: 'long.md:1 is 101 characters' },
  { test: 'research', file: skill('research'), from: 'the skill never overwrites a report', to: 'the skill may overwrite a report', says: 'never overwrites a report' },
  { test: 'researcher', file: agent('researcher'), from: 'tools: WebFetch, WebSearch', to: 'tools: WebFetch, WebSearch, Bash', says: 'tools' },
  { test: 'review-mutations', file: agent('reviewer'), from: 'only in a scratch clone outside the repository', to: 'only in a scratch clone in the repository', says: 'P1 missing' },
  { test: 'role-split', file: script('role-split'), from: 'lstatSync', to: 'statSync', says: 'expected exit' },
  { test: 'run-mutations', file: LEDGER, from: '· mutations <planted>', to: '· mutants <planted>', says: 'does not state the `mutations` segment' },
  { test: 'sheet-paths', file: script('sheet-paths'), from: 'const MAX = 2', to: 'const MAX = 3', says: 'at most 2' },
  { test: 'sheets', file: 'plugins/gtm/templates/sheets/quality.md', from: '## Method', to: '## Approach', says: 'quality.md: sections' },
  { test: 'sheets', file: agent('reviewer'), from: 'line names, read as', to: 'line names, seen as', says: 'the card reading must say once' },
  { test: 'sheets', file: skill('retro'), from: 'retro never edits or deletes it', to: 'retro may edit or delete it', says: 'retro never edits or deletes it' },
  { test: 'sheets', file: skill('retro'), from: 'with fewer than 3 such runs, retro proposes nothing.', to: 'with fewer than 3 such runs, retro proposes a card.', says: 'with fewer than 3 such runs' },
  { test: 'sheets', file: skill('retro'), from: 'proposed again only after 3 runs that name it,', to: 'proposed again only after 3 runs,', says: '3 runs that name it, newer than that line' },
  { test: 'sheets', file: skill('retro'), from: 'with a standing remove ruling', to: 'with a standing keep ruling', says: 'with a standing remove ruling' },
  { test: 'site-checks', file: 'docmd.config.json', from: '"out": "site"', to: '"out": "dist"', says: 'docmd config src/out' },
  { test: 'size', file: script('size'), from: 'Math.ceil(', to: 'Math.floor(', says: 'want' },
  { test: 'taste', file: agent('design-critic'), from: "Put a rival's name on the board", to: 'Put a name on the board', says: "Put a rival's name on the board" },
  { test: 'ui-gate', file: GUARD, from: 'export const UI = {', to: 'export const UI2 = {', says: 'no top `export const UI' },
  { test: 'usage-line', file: script('usage-line'), from: 'flagged = projected >= 100', to: 'flagged = projected >= 1000', says: 'flag' },
  { test: 'workflows', file: 'plugins/gtm/workflows/design-loop.js', from: 'taste >= TASTE_BAR', to: 'taste >= 0', says: 'design-loop' },
  { test: 'workflows', file: 'plugins/gtm/workflows/deliver-task.js', from: 'const MAX_SHEETS = 2', to: 'const MAX_SHEETS = 3', says: 'a third entry in bound' },
  { test: 'workflows', file: 'plugins/gtm/workflows/deliver-task.js', from: "category: 'proof', summary: `${r} reported", to: "category: 'behaviour', summary: `${r} reported", says: 'trace: a surviving mutation' },
  { test: 'guards', file: 'plugins/gtm/templates/delivery.md', from: '· models <M> · causes <C>`', to: '· models <M>`', says: 'causes <C>' },
]
const ARGS = { 'site-checks': ['--source', '--lasting'] }
const errors = []

// Keys of one object sit at one indent; a line further left closes it.
// ponytail: line-based, a key on a line of its own only; a parser if a one-line map ever hides one.
const twiceKeyed = (src) => {
  const seen = new Map()
  const found = []
  for (const line of src.split('\n')) {
    if (!line.trim()) continue
    const indent = line.search(/\S/)
    for (const at of seen.keys()) if (at > indent) seen.delete(at)
    const key = /^ *(?:'([^']+)'|([\w-]+)): /.exec(line)
    if (!key) continue
    const keys = seen.get(indent) ?? new Set()
    if (keys.has(key[1] ?? key[2])) found.push(key[1] ?? key[2])
    seen.set(indent, keys.add(key[1] ?? key[2]))
  }
  return found
}
const GOOD = "const A = {\n  a: [\n    'x',\n  ],\n  b: {\n    c: 1,\n  },\n  d: {\n    c: 1,\n  },\n}\nconst B = {\n  a: 1,\n}\n"
const BAD = "const A = {\n  'a.md': [\n    'x',\n  ],\n  'a.md': [\n    'y',\n  ],\n}\n"
if (twiceKeyed(GOOD).length) errors.push(`key check refuses a clean map: ${twiceKeyed(GOOD)}`)
if (twiceKeyed(BAD).join() !== 'a.md') errors.push('key check misses a key given twice')

const tests = readdirSync(join(root, 'scripts')).filter((f) => f.endsWith('.test.mjs'))
for (const f of tests) {
  for (const key of twiceKeyed(readFileSync(join(root, 'scripts', f), 'utf8'))) errors.push(`${f}: key ${key} given twice`)
  if (!EXEMPT[f] && !TWINS.some((t) => `${t.test}.test.mjs` === f)) errors.push(`${f}: no broken twin`)
}

const scratch = mkdtempSync(join(tmpdir(), 'gtm-twins-'))
const git = (...a) => execFileSync('git', a, { cwd: scratch, stdio: 'pipe' })
try {
  const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
    .split('\0').filter((f) => f && existsSync(join(root, f)))
  for (const f of files) {
    mkdirSync(dirname(join(scratch, f)), { recursive: true })
    cpSync(join(root, f), join(scratch, f), { verbatimSymlinks: true })
  }
  git('init', '-q', '-b', 'main')
  git('add', '-A')
  git('-c', 'user.name=gtm', '-c', 'user.email=gtm@localhost', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'scratch')
  // One commit: marked shallow, as taste.test.mjs asks of a clone without its base.
  writeFileSync(join(scratch, '.git/shallow'), git('rev-parse', 'HEAD'))
  for (const t of TWINS) {
    const name = `${t.test}: ${t.add ?? `${t.file}, ${t.from}`}`
    const path = join(scratch, t.add ?? t.file)
    const before = t.add ? null : readFileSync(path, 'utf8')
    if (before !== null && !before.includes(t.from)) { errors.push(`${name}: no longer applies`); continue }
    writeFileSync(path, t.add ? t.to : before.replaceAll(t.from, t.to))
    const args = [join(scratch, 'scripts', `${t.test}.test.mjs`), ...(t.test in ARGS ? [`${scratch}/`, ...ARGS[t.test]] : [])]
    const r = spawnSync(process.execPath, args, { cwd: scratch, encoding: 'utf8' })
    const out = `${r.stdout}${r.stderr}`
    if (r.status === 0) errors.push(`${name}: the defect passed`)
    else if (!out.includes(t.says)) errors.push(`${name}: failed without saying "${t.says}":\n${out.slice(0, 400)}`)
    if (t.add) rmSync(path)
    else writeFileSync(path, before)
  }
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`twins: ${TWINS.length} planted defects caught, ${tests.length} tests, no key given twice`)
