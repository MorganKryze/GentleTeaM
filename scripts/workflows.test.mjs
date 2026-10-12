#!/usr/bin/env node
// Runs each workflow in plugins/gtm/workflows against scripted agents and compares the returned
// value, the dispatches and the log lines with what each scenario expects. Every workflow needs
// at least one scenario. Run by validate.mjs. No dependencies.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import vm from 'node:vm'

const folder = new URL('../plugins/gtm/workflows/', import.meta.url).pathname
const MAX_DISPATCHES = 50

const sorted = (v) =>
  Array.isArray(v)
    ? v.map(sorted)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sorted(v[k])]))
      : v
const canon = (v) => JSON.stringify(sorted(v), null, 2)

// The context holds only what the workflow runtime provides, so a workflow that reaches for any
// other global fails here instead of in a session. It runs only this repository's own files.
async function run(name, src, args, reply) {
  const dispatches = []
  const logs = []
  const agent = async (prompt, opts = {}) => {
    if (dispatches.length >= MAX_DISPATCHES) throw new Error(`${name}: more than ${MAX_DISPATCHES} dispatches`)
    const d = { agentType: opts.agentType, label: opts.label }
    if (opts.model !== undefined) d.model = opts.model
    if (opts.effort !== undefined) d.effort = opts.effort
    dispatches.push(d)
    return reply(d)
  }
  const parallel = async (thunks) => {
    const out = []
    for (const t of thunks) out.push(await t())
    return out
  }
  const context = vm.createContext({ args, agent, parallel, log: (line) => logs.push(String(line)), phase: () => {} })
  const body = src.replace(/^export const meta/m, 'const meta')
  try {
    const value = await vm.runInContext(`(async () => {\n${body}\n})()`, context, { filename: name })
    return { value, dispatches, logs }
  } catch (e) {
    // Errors from inside the context come from its own realm, so match on the name.
    const missing = e && e.name === 'ReferenceError' && /^(\S+) is not defined$/.exec(String(e.message))
    if (missing) throw new Error(`${name}: runtime global ${missing[1]} is not provided`)
    throw e
  }
}

function unscripted(files, scenarios) {
  const covered = new Set(scenarios.map((s) => s.workflow))
  return files.filter((f) => f.endsWith('.js') && !covered.has(f.slice(0, -3)))
}

// Shared stubs for the deliver-task scenarios.
const ok = { verdict: 'approve', findings: [], summary: 'ok' }
const badFinding = { severity: 'important', file: 'src/a.js', summary: 'bug' }
const bad = { verdict: 'fix', findings: [badFinding], summary: 'fix' }
const TRIGGERS = { 'security-reviewer': ['^scripts/'], 'data-reviewer': ['^templates/'], 'ux-qa': ['^ui/'] }
const srcFiles = (n) => Array.from({ length: n }, (_, i) => `src/${i}.js`)
const implement = (agentType = 'gtm:implementer', extra = {}) => ({ agentType, label: 'implement', ...extra })
const reviewer = (label = 'reviewer', extra = {}) => ({ agentType: 'gtm:reviewer', label, ...extra })

// Answers the implementer by label; every other dispatch goes to review(d).
function implementer(files, review) {
  return (d) => {
    if (d.label === 'implement') return { status: 'DONE', head: 'h0', files, summary: 'done' }
    const fix = d.label.match(/^fix · round (\d+)$/)
    if (fix) return { status: 'DONE', head: `h${fix[1]}`, files: ['src/a.js'], summary: 'fixed' }
    return review(d)
  }
}
const rounds = (n, each) => Array.from({ length: n }, (_, i) => each(i + 1)).flat()

const deliver = [
  {
    name: 'clean: a minor finding starts no fix',
    args: {},
    reply: implementer(['src/a.js'], () => ({ verdict: 'approve', findings: [{ severity: 'minor', summary: 'typo' }], summary: 'ok' })),
    returns: {
      status: 'CLEAN', head: 'h0', fixRounds: 0, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 0, minor: 1 } },
      minors: [{ severity: 'minor', summary: 'typo', by: 'reviewer' }],
    },
    dispatches: [implement(), reviewer()],
  },
  {
    name: 'one fix round: only open reviewers re-review',
    args: { triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs'], (d) => (d.label === 'security-reviewer' ? bad : ok)),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer', 'security-reviewer'],
      stats: { 'security-reviewer': { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer' },
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer · round 1' },
    ],
  },
  {
    name: 'default fix rounds: OPEN after 3, efforts raised from low',
    args: { team: { implementer: { model: 'opus', effort: 'low' }, reviewer: { model: 'inherit', effort: 'medium' } } },
    reply: implementer(['src/a.js'], () => bad),
    returns: {
      status: 'OPEN', head: 'h3', fixRounds: 3, reviewers: ['reviewer'],
      open: [{ ...badFinding, by: 'reviewer' }],
      stats: { reviewer: { critical: 0, important: 4, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement('gtm:implementer', { model: 'opus', effort: 'low' }),
      reviewer('reviewer', { effort: 'medium' }),
      ...rounds(3, (n) => [
        { agentType: 'gtm:implementer', label: `fix · round ${n}`, model: 'opus', effort: ['medium', 'high', 'xhigh'][n - 1] },
        reviewer(`reviewer · round ${n}`, { effort: 'medium' }),
      ]),
    ],
  },
  {
    name: 'fixRounds 2 passed: OPEN after 2, xhigh kept',
    args: { fixRounds: 2, team: { implementer: { effort: 'xhigh' } } },
    reply: implementer(['src/a.js'], () => bad),
    returns: {
      status: 'OPEN', head: 'h2', fixRounds: 2, reviewers: ['reviewer'],
      open: [{ ...badFinding, by: 'reviewer' }],
      stats: { reviewer: { critical: 0, important: 3, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement('gtm:implementer', { effort: 'xhigh' }), reviewer(),
      ...rounds(2, (n) => [
        { agentType: 'gtm:implementer', label: `fix · round ${n}`, effort: 'xhigh' },
        reviewer(`reviewer · round ${n}`),
      ]),
    ],
  },
  {
    name: 'fix: 4 files escalate at the default ceiling',
    args: { track: 'fix' },
    reply: implementer(srcFiles(4), () => ok),
    returns: { status: 'ESCALATE', reason: '4 files > 3', head: 'h0', files: srcFiles(4) },
    dispatches: [implement()],
  },
  {
    name: 'fix: 3 files off security and data ground stay a Fix',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['src/a.js', 'src/b.js', 'ui/c.css'], () => ok),
    returns: { status: 'CLEAN', head: 'h0', fixRounds: 0, reviewers: ['reviewer', 'ux-qa'], stats: {}, minors: [] },
    dispatches: [implement(), reviewer(), { agentType: 'gtm:ux-qa', label: 'ux-qa' }],
  },
  {
    name: 'fix: security ground escalates',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs'], () => ok),
    returns: { status: 'ESCALATE', reason: 'touches security-reviewer ground', head: 'h0', files: ['scripts/x.mjs'] },
    dispatches: [implement()],
  },
  {
    name: 'fix: data ground escalates',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['templates/config.yml'], () => ok),
    returns: { status: 'ESCALATE', reason: 'touches data-reviewer ground', head: 'h0', files: ['templates/config.yml'] },
    dispatches: [implement()],
  },
  {
    name: 'fix: fixCeiling 5 passed, 5 files stay a Fix',
    args: { track: 'fix', fixCeiling: 5 },
    reply: implementer(srcFiles(5), () => ok),
    returns: { status: 'CLEAN', head: 'h0', fixRounds: 0, reviewers: ['reviewer'], stats: {}, minors: [] },
    dispatches: [implement(), reviewer()],
  },
  {
    name: 'fix: fixCeiling 5 passed, 6 files escalate',
    args: { track: 'fix', fixCeiling: 5 },
    reply: implementer(srcFiles(6), () => ok),
    returns: { status: 'ESCALATE', reason: '6 files > 5', head: 'h0', files: srcFiles(6) },
    dispatches: [implement()],
  },
  {
    name: 'invalid trigger: logged, specialist runs',
    args: { triggers: { 'security-reviewer': ['('] } },
    reply: implementer(['README.md'], () => ok),
    returns: { status: 'CLEAN', head: 'h0', fixRounds: 0, reviewers: ['reviewer', 'security-reviewer'], stats: {}, minors: [] },
    dispatches: [implement(), reviewer(), { agentType: 'gtm:security-reviewer', label: 'security-reviewer' }],
    log: ['security-reviewer', '('],
  },
].map((s) => ({ workflow: 'deliver-task', ...s }))

// Answers the designer with `board <round>` and the critic with critique(round).
const designReply = (critique) => (d) => {
  const round = Number(d.label.match(/round (\d+)$/)[1])
  return d.agentType === 'gtm:designer' ? `board ${round}` : critique(round)
}
const score = (n, mustFix = []) => ({ score: n, mustFix, shouldFix: [], summary: 's' })
const designRounds = (n, extra = {}, criticExtra = extra) =>
  rounds(n, (r) => [
    { agentType: 'gtm:designer', label: `designer · round ${r}`, ...extra },
    { agentType: 'gtm:design-critic', label: `critic · round ${r}`, ...criticExtra },
  ])

const design = [
  {
    name: 'design: passes on round 2 at the default bar',
    args: { team: { designer: { model: 'opus', effort: 'medium' }, 'design-critic': { model: 'opus', effort: 'high' } } },
    reply: designReply((r) => score(r === 1 ? 7 : 8)),
    returns: { passed: true, rounds: 2, scores: [7, 8], verdict: score(8), board: 'board 2' },
    dispatches: designRounds(2, { model: 'opus', effort: 'medium' }, { model: 'opus', effort: 'high' }),
  },
  {
    name: 'design: one must-fix fails after the default rounds',
    args: {},
    reply: designReply(() => score(9, ['contrast'])),
    returns: { passed: false, rounds: 3, scores: [9, 9, 9], verdict: score(9, ['contrast']), board: 'board 3' },
    dispatches: designRounds(3),
  },
].map((s) => ({ workflow: 'design-loop', ...s }))

const scenarios = [...deliver, ...design]

const failures = []
const differs = (where, what, expected, actual) =>
  failures.push(`${where}: ${what} differs\nexpected:\n${canon(expected)}\nactual:\n${canon(actual)}`)

for (const s of scenarios) {
  const where = `${s.workflow} / ${s.name}`
  if (!('returns' in s) || !('dispatches' in s)) {
    failures.push(`${where}: scenario needs both returns and dispatches`)
    continue
  }
  try {
    const src = readFileSync(join(folder, `${s.workflow}.js`), 'utf8')
    const { value, dispatches, logs } = await run(s.workflow, src, s.args, s.reply)
    if (canon(value) !== canon(s.returns)) differs(where, 'returned value', s.returns, value)
    if (canon(dispatches) !== canon(s.dispatches)) differs(where, 'dispatches', s.dispatches, dispatches)
    // Each expected entry is a set of fragments that one log line must hold together.
    if (s.log && !logs.some((line) => s.log.every((part) => line.includes(part)))) differs(where, 'log', s.log, logs)
  } catch (e) {
    failures.push(`${where}: ${e.message}`)
  }
}

const S1 = 'self-check: a missing runtime global is named'
for (const [src, global] of [
  ['void process', 'process'],
  ['void fetch', 'fetch'],
  ['void require', 'require'],
]) {
  const want = `probe: runtime global ${global} is not provided`
  const got = await run('probe', src, {}, () => null).then(() => 'no error', (e) => e.message)
  if (got !== want) differs(S1, 'returned value', want, got)
}

const S2 = 'self-check: a workflow without scenario is named'
const probe = unscripted(['deliver-task.js', 'design-loop.js', 'extra.js'], scenarios)
if (canon(probe) !== canon(['extra.js'])) differs(S2, 'returned value', ['extra.js'], probe)
for (const file of unscripted(readdirSync(folder), scenarios)) failures.push(`${file}: no scenario in scripts/workflows.test.mjs`)

if (failures.length) {
  console.error(failures.join('\n\n'))
  process.exit(1)
}
console.log(`workflow test: ${scenarios.length} scenarios and 2 self-checks OK`)
