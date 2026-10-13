#!/usr/bin/env node
// Runs each workflow in plugins/gtm/workflows against scripted agents and compares the returned
// value, the dispatches and the log lines with what each scenario expects. Every workflow needs
// at least one scenario. It also checks that each skill running a workflow passes every argument
// the workflow reads. Run by validate.mjs. No dependencies.
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

// The fields of a reply that its schema does not declare, by path. A real structured output
// refuses them, so a stub that holds one would test a reply no reviewer can give.
function undeclared(value, schema, at) {
  if (Array.isArray(value)) return value.flatMap((v, i) => undeclared(v, schema.items || {}, `${at}[${i}]`))
  if (!value || typeof value !== 'object' || !schema.properties) return []
  return Object.entries(value).flatMap(([k, v]) =>
    Object.hasOwn(schema.properties, k) ? undeclared(v, schema.properties[k], `${at}.${k}`) : [`${at}.${k}`])
}

// The context holds only what the workflow runtime provides, so a workflow that reaches for any
// other global fails here instead of in a session. It runs only this repository's own files.
async function run(name, src, args, reply) {
  const dispatches = []
  const logs = []
  const prompts = {}
  const extra = []
  const agent = async (prompt, opts = {}) => {
    if (dispatches.length >= MAX_DISPATCHES) throw new Error(`${name}: more than ${MAX_DISPATCHES} dispatches`)
    const d = { agentType: opts.agentType, label: opts.label }
    if (opts.model !== undefined) d.model = opts.model
    if (opts.effort !== undefined) d.effort = opts.effort
    dispatches.push(d)
    prompts[opts.label] = prompt
    const out = await reply(d)
    if (opts.schema) extra.push(...undeclared(out, opts.schema, opts.label))
    return out
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
    return { value, dispatches, logs, prompts, extra }
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
const critical = { severity: 'critical', file: 'scripts/x.mjs', summary: 'injection' }
const typo = { severity: 'minor', summary: 'typo' }
const TRIGGERS = { 'security-reviewer': ['^scripts/'], 'data-reviewer': ['^templates/'], 'ux-qa': ['^ui/'] }
const srcFiles = (n) => Array.from({ length: n }, (_, i) => `src/${i}.js`)
const implement = (agentType = 'gtm:implementer', extra = {}) => ({ agentType, label: 'implement', ...extra })
const reviewer = (label = 'reviewer', extra = {}) => ({ agentType: 'gtm:reviewer', label, ...extra })
// Re-review stubs: a finding sent back with its status, and the fragments every review request holds.
const addressed = { ...badFinding, status: 'addressed' }
const leak = { severity: 'important', file: 'src/b.js', summary: 'leak' }
const SCOPE = ['Scope: a defect the task\'s diff', 'did not introduce', 'unless it is critical, a security hole or a data-integrity defect']
const WORKTREE = ['Worktree: /tmp/wt/acme-t2.', 'Run every command after cd "/tmp/wt/acme-t2"', 'read every repository file there']
const STATUS = ['Return each with status "addressed" or "open"', 'only new breakage in the fix diff', 'approve when none is left open']

// Answers the implementer by label; every other dispatch goes to review(d).
function implementer(files, review, fixFiles = ['src/a.js']) {
  return (d) => {
    if (d.label === 'implement') return { status: 'DONE', head: 'h0', files, summary: 'done' }
    const fix = d.label.match(/^fix · round (\d+)$/)
    if (fix) return { status: 'DONE', head: `h${fix[1]}`, files: fixFiles, summary: 'fixed' }
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
    name: 'feature: a fix round that reaches security ground brings its specialist in',
    args: { triggers: TRIGGERS },
    reply: implementer(['src/a.js'], (d) => (d.label === 'reviewer' ? bad : ok), ['scripts/new.mjs']),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer', 'security-reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
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
    name: 'high effort: capped at xhigh from fix round 1',
    args: { team: { implementer: { effort: 'high' } } },
    reply: implementer(['src/a.js'], () => bad),
    returns: {
      status: 'OPEN', head: 'h3', fixRounds: 3, reviewers: ['reviewer'],
      open: [{ ...badFinding, by: 'reviewer' }],
      stats: { reviewer: { critical: 0, important: 4, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement('gtm:implementer', { effort: 'high' }), reviewer(),
      ...rounds(3, (n) => [
        { agentType: 'gtm:implementer', label: `fix · round ${n}`, effort: 'xhigh' },
        reviewer(`reviewer · round ${n}`),
      ]),
    ],
  },
  {
    name: 'max effort: kept on all 3 fix rounds',
    args: { team: { implementer: { effort: 'max' } } },
    reply: implementer(['src/a.js'], () => bad),
    returns: {
      status: 'OPEN', head: 'h3', fixRounds: 3, reviewers: ['reviewer'],
      open: [{ ...badFinding, by: 'reviewer' }],
      stats: { reviewer: { critical: 0, important: 4, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement('gtm:implementer', { effort: 'max' }), reviewer(),
      ...rounds(3, (n) => [
        { agentType: 'gtm:implementer', label: `fix · round ${n}`, effort: 'max' },
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
    name: 'fix: 3 files on security ground stay a Fix, its specialist reviews',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs', 'src/a.js', 'src/b.js'], () => ok),
    returns: { status: 'CLEAN', head: 'h0', fixRounds: 0, reviewers: ['reviewer', 'security-reviewer'], stats: {}, minors: [] },
    dispatches: [implement(), reviewer(), { agentType: 'gtm:security-reviewer', label: 'security-reviewer' }],
  },
  {
    name: 'fix: data ground stays a Fix until its specialist approves',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['templates/config.yml'], (d) => (d.label === 'data-reviewer' ? bad : ok)),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer', 'data-reviewer'],
      stats: { 'data-reviewer': { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:data-reviewer', label: 'data-reviewer' },
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      { agentType: 'gtm:data-reviewer', label: 'data-reviewer · round 1' },
    ],
  },
  {
    name: 'fix: 4 files on security ground escalate',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs', ...srcFiles(3)], () => ok),
    returns: { status: 'ESCALATE', reason: '4 files > 3', head: 'h0', files: ['scripts/x.mjs', ...srcFiles(3)] },
    dispatches: [implement()],
    log: ['Fix escalates to Feature: 4 files > 3'],
  },
  {
    name: 'fix: a fix round on security ground goes back to its specialist after an approval',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs', 'src/a.js', 'src/b.js'], (d) => (d.label === 'reviewer' ? bad : ok), ['scripts/x.mjs']),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer', 'security-reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer' },
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer · round 1' },
    ],
  },
  {
    name: 'fix: a fix round on the ground of a specialist with findings re-reviews it once',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs'], (d) => (d.label === 'security-reviewer' ? bad : ok), ['scripts/x.mjs']),
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
    name: 'fix: a fix round that reaches security ground brings its specialist in',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['src/a.js'], (d) => (d.label === 'reviewer' ? bad : ok), ['scripts/new.mjs']),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer', 'security-reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer · round 1' },
    ],
  },
  {
    name: 'fix: a fix round that grows the Fix past the ceiling escalates',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(srcFiles(3), (d) => (d.label === 'reviewer' ? bad : ok), ['src/0.js', 'src/9.js']),
    returns: {
      status: 'ESCALATE', reason: '4 files > 3', head: 'h1', files: [...srcFiles(3), 'src/9.js'],
      open: [{ ...badFinding, by: 'reviewer' }], reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [implement(), reviewer(), { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' }],
    log: ['Fix escalates to Feature: 4 files > 3'],
  },
  {
    name: 'fix: a test-first fix round past the ceiling escalates with the open security finding',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(
      ['scripts/x.mjs', 'src/a.js', 'src/b.js'],
      (d) => (d.label === 'security-reviewer' ? { verdict: 'fix', findings: [critical, typo], summary: 'fix' } : ok),
      ['scripts/x.mjs', 'scripts/x.test.mjs'],
    ),
    returns: {
      status: 'ESCALATE', reason: '4 files > 3', head: 'h1',
      files: ['scripts/x.mjs', 'src/a.js', 'src/b.js', 'scripts/x.test.mjs'],
      open: [{ ...critical, by: 'security-reviewer' }], reviewers: ['reviewer', 'security-reviewer'],
      stats: { 'security-reviewer': { critical: 1, important: 0, minor: 1 } },
      minors: [{ ...typo, by: 'security-reviewer' }],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer' },
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
    ],
    log: ['Fix escalates to Feature: 4 files > 3'],
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
  {
    name: 'lost review: a throw, then a retry with findings starts the fix round',
    args: { team: { reviewer: { model: 'opus', effort: 'medium' } } },
    reply: implementer(['src/a.js'], (d) => {
      if (d.label === 'reviewer') throw new Error('subagent completed without calling StructuredOutput')
      return d.label === 'reviewer · retry' ? bad : ok
    }),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(),
      reviewer('reviewer', { model: 'opus', effort: 'medium' }),
      reviewer('reviewer · retry', { model: 'opus', effort: 'medium' }),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1', { model: 'opus', effort: 'medium' }),
    ],
    log: ['reviewer: lost its structured result, one retry'],
  },
  {
    name: 'lost review: a specialist throws in a fix round, only it is retried and its approval counts',
    args: { triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs'], (d) => {
      if (d.label === 'security-reviewer · round 1') throw new Error('no structured output')
      return d.label === 'security-reviewer' ? bad : ok
    }),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer', 'security-reviewer'],
      stats: { 'security-reviewer': { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer' },
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer · round 1' },
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer · round 1 · retry' },
    ],
    log: ['security-reviewer · round 1: lost its structured result, one retry'],
  },
  {
    name: 'no review: a reviewer that returns null is an important finding, no fix round, not dispatched again',
    args: {},
    reply: implementer(['src/a.js'], () => null),
    returns: {
      status: 'OPEN', head: 'h0', fixRounds: 0, reviewers: ['reviewer'],
      open: [{ severity: 'important', summary: 'reviewer returned no review', by: 'reviewer' }],
      stats: {}, minors: [],
    },
    dispatches: [implement(), reviewer()],
    log: ['reviewer: returned nothing', 'not dispatched again'],
    unlogged: ['retry'],
  },
  {
    name: 'lost review twice: two throws are an important finding, no fix round, no third dispatch',
    args: {},
    reply: implementer(['src/a.js'], () => {
      throw new Error('subagent completed without calling StructuredOutput')
    }),
    returns: {
      status: 'OPEN', head: 'h0', fixRounds: 0, reviewers: ['reviewer'],
      open: [{ severity: 'important', summary: 'reviewer returned no review', by: 'reviewer' }],
      stats: {}, minors: [],
    },
    dispatches: [implement(), reviewer(), reviewer('reviewer · retry')],
    log: ['reviewer: no result after its retry, no third dispatch'],
  },
  {
    name: 'fix: a specialist with no review leaves the task OPEN, never CLEAN',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs'], (d) => (d.label === 'security-reviewer' ? null : ok), ['scripts/x.mjs']),
    returns: {
      status: 'OPEN', head: 'h0', fixRounds: 0, reviewers: ['reviewer', 'security-reviewer'],
      open: [{ severity: 'important', summary: 'security-reviewer returned no review', by: 'security-reviewer' }],
      stats: {}, minors: [],
    },
    dispatches: [implement(), reviewer(), { agentType: 'gtm:security-reviewer', label: 'security-reviewer' }],
    log: ['security-reviewer: returned nothing', 'not dispatched again'],
  },
  {
    name: 'no review: other findings get their fix round, the specialist is not re-dispatched on its ground',
    args: { triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs'], (d) => {
      if (d.label === 'security-reviewer') throw new Error('subagent completed without calling StructuredOutput')
      if (d.label === 'security-reviewer · retry') return null
      return d.label === 'reviewer' ? bad : ok
    }, ['scripts/x.mjs']),
    returns: {
      status: 'OPEN', head: 'h1', fixRounds: 1, reviewers: ['reviewer', 'security-reviewer'],
      open: [{ severity: 'important', summary: 'security-reviewer returned no review', by: 'security-reviewer' }],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer' },
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer · retry' },
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
    log: ['security-reviewer: no result after its retry, no third dispatch'],
  },
  {
    name: 'implementer throws: BLOCKED as for nothing back, never retried',
    args: {},
    reply: () => {
      throw new Error('no structured output')
    },
    returns: { status: 'BLOCKED', impl: null },
    dispatches: [implement()],
  },
  {
    name: 'fix round throws: BLOCKED with the open findings, never retried',
    args: {},
    reply: (d) => {
      if (d.label.startsWith('fix')) throw new Error('no structured output')
      return implementer(['src/a.js'], () => bad)(d)
    },
    returns: {
      status: 'BLOCKED', head: 'h0', open: [{ ...badFinding, by: 'reviewer' }],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [implement(), reviewer(), { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' }],
  },
  {
    name: 'verdict fix without a blocking finding: an important finding, a fix round and a re-review',
    args: {},
    reply: implementer(['src/a.js'], (d) => (d.label === 'reviewer' ? { verdict: 'fix', findings: [typo], summary: 'fix' } : ok)),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 0, minor: 1 } },
      minors: [{ ...typo, by: 'reviewer' }],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
  },
  {
    name: 'verdict fix without a blocking finding on every round: OPEN with that finding',
    args: { fixRounds: 1 },
    reply: implementer(['src/a.js'], () => ({ verdict: 'fix', findings: [], summary: 'execSync builds a shell string at x.mjs:12' })),
    returns: {
      status: 'OPEN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      open: [{
        severity: 'important', by: 'reviewer',
        summary: 'reviewer asked for a fix without a blocking finding: execSync builds a shell string at x.mjs:12',
      }],
      stats: {}, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
  },
  {
    name: 'verdict approve with a blocking finding: the finding blocks',
    args: {},
    reply: implementer(['src/a.js'], (d) => (d.label === 'reviewer' ? { ...bad, verdict: 'approve' } : ok)),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
  },
  {
    name: 'no re-review: the findings the fix round got stay open with the placeholder',
    args: { triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs'], (d) => {
      if (d.label === 'security-reviewer') return bad
      return d.label === 'security-reviewer · round 1' ? null : ok
    }, ['scripts/x.mjs']),
    returns: {
      status: 'OPEN', head: 'h1', fixRounds: 1, reviewers: ['reviewer', 'security-reviewer'],
      open: [
        { severity: 'important', summary: 'security-reviewer returned no review', by: 'security-reviewer' },
        { ...badFinding, by: 'security-reviewer' },
      ],
      stats: { 'security-reviewer': { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer' },
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer · round 1' },
    ],
    log: ['security-reviewer · round 1: returned nothing', 'not dispatched again'],
  },
  {
    name: 'fix: an escalation carries the specialist with no review in open',
    args: { track: 'fix', triggers: TRIGGERS },
    reply: implementer(['scripts/x.mjs', 'src/a.js'], (d) => (d.label === 'security-reviewer' ? null : bad), ['src/b.js', 'src/c.js']),
    returns: {
      status: 'ESCALATE', reason: '4 files > 3', head: 'h1', files: ['scripts/x.mjs', 'src/a.js', 'src/b.js', 'src/c.js'],
      open: [
        { ...badFinding, by: 'reviewer' },
        { severity: 'important', summary: 'security-reviewer returned no review', by: 'security-reviewer' },
      ],
      reviewers: ['reviewer', 'security-reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer' },
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
    ],
    log: ['Fix escalates to Feature: 4 files > 3'],
  },
  {
    name: 'fix round blocked: BLOCKED carries the specialist with no review in open',
    args: { triggers: TRIGGERS },
    reply: (d) => {
      if (d.label.startsWith('fix')) return { status: 'BLOCKED', head: 'h0', files: [], summary: 'stuck' }
      return implementer(['scripts/x.mjs'], (r) => (r.label === 'security-reviewer' ? null : bad))(d)
    },
    returns: {
      status: 'BLOCKED', head: 'h0',
      open: [
        { ...badFinding, by: 'reviewer' },
        { severity: 'important', summary: 'security-reviewer returned no review', by: 'security-reviewer' },
      ],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer' },
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
    ],
  },
  {
    name: 'review scope: every sent finding addressed ends CLEAN at round 1',
    args: {},
    reply: implementer(['src/a.js'], (d) => (d.label === 'reviewer' ? bad : { ...ok, findings: [addressed] })),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
  },
  {
    name: 'review scope: one of two addressed, the next round gets only the other',
    args: {},
    reply: implementer(['src/a.js'], (d) => {
      if (d.label === 'reviewer') return { ...bad, findings: [badFinding, leak] }
      if (d.label === 'reviewer · round 1') return { ...bad, findings: [addressed, { ...leak, status: 'open' }] }
      return ok
    }),
    returns: {
      status: 'CLEAN', head: 'h2', fixRounds: 2, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 3, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
      { agentType: 'gtm:implementer', label: 'fix · round 2', effort: 'high' },
      reviewer('reviewer · round 2'),
    ],
    prompts: { 'fix · round 2': ['"leak"'], 'reviewer · round 2': ['"leak"'] },
    unprompted: { 'fix · round 2': ['"bug"'], 'reviewer · round 2': ['"bug"'] },
  },
  {
    name: 'review scope: a re-listed finding without a status stays open',
    args: { fixRounds: 1 },
    reply: implementer(['src/a.js'], (d) => (d.label === 'reviewer' ? bad : { ...ok, findings: [badFinding] })),
    returns: {
      status: 'OPEN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      open: [{ ...badFinding, by: 'reviewer' }],
      stats: { reviewer: { critical: 0, important: 2, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
  },
  {
    name: 'review scope: a status on a first review is ignored',
    args: { fixRounds: 0 },
    reply: implementer(['src/a.js'], () => ({ ...ok, findings: [addressed] })),
    returns: {
      status: 'OPEN', head: 'h0', fixRounds: 0, reviewers: ['reviewer'],
      open: [{ ...badFinding, by: 'reviewer' }],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [implement(), reviewer()],
  },
  {
    name: 'review scope: an ignored status never reaches the fix round or the re-review',
    args: { fixRounds: 1 },
    reply: implementer(['src/a.js'], (d) => (d.label === 'reviewer' ? { ...bad, findings: [addressed] } : ok)),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
    prompts: { 'fix · round 1': ['"bug"'], 'reviewer · round 1': ['"bug"'] },
    unprompted: { 'fix · round 1': ['"status": "addressed"'], 'reviewer · round 1': ['"status": "addressed"'] },
  },
  {
    name: 'review scope: a re-review reads the scope rule against the task, findings keep their severity, a minor drops its status',
    args: { base: 'b0', fixRounds: 1 },
    reply: implementer(['src/a.js'], (d) =>
      (d.label === 'reviewer' ? bad : { ...ok, findings: [{ ...typo, status: 'open' }] })),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 1 } }, minors: [{ ...typo, by: 'reviewer' }],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
    prompts: {
      'reviewer · round 1': [
        'diff h0..h1', "Scope: a defect the task's diff b0..h1 did not introduce",
        'Each finding sent keeps its severity until it is addressed',
      ],
    },
  },
  {
    name: 'review scope: a status from a specialist called back is ignored',
    args: { triggers: TRIGGERS, fixRounds: 1 },
    reply: implementer(['src/a.js'], (d) => {
      if (d.label === 'reviewer') return bad
      if (d.label === 'security-reviewer · round 1') return { ...ok, findings: [{ ...critical, status: 'addressed' }] }
      return ok
    }, ['scripts/x.mjs']),
    returns: {
      status: 'OPEN', head: 'h1', fixRounds: 1, reviewers: ['reviewer', 'security-reviewer'],
      open: [{ ...critical, by: 'security-reviewer' }],
      stats: {
        reviewer: { critical: 0, important: 1, minor: 0 },
        'security-reviewer': { critical: 1, important: 0, minor: 0 },
      },
      minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer · round 1' },
    ],
  },
  {
    name: 'review scope: a fix verdict with every finding addressed still blocks',
    args: { fixRounds: 1 },
    reply: implementer(['src/a.js'], (d) =>
      (d.label === 'reviewer' ? bad : { verdict: 'fix', findings: [addressed], summary: 'still wrong' })),
    returns: {
      status: 'OPEN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      open: [{ severity: 'important', summary: 'reviewer asked for a fix without a blocking finding: still wrong', by: 'reviewer' }],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
  },
  {
    name: 'review scope: an addressed finding stays out of the stats and the minors',
    args: {},
    reply: implementer(['src/a.js'], (d) => (d.label === 'reviewer' ? bad : {
      ...ok, findings: [addressed, { ...typo, status: 'addressed' }, { severity: 'minor', summary: 'new nit' }],
    })),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 1 } },
      minors: [{ severity: 'minor', summary: 'new nit', by: 'reviewer' }],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
  },
  {
    name: 'review scope: every review request states the scope rule, a re-review asks for each status',
    args: { triggers: { ...TRIGGERS, 'acme-reviewer': ['^scripts/'] } },
    reply: implementer(['scripts/x.mjs'], (d) => (d.label === 'security-reviewer' ? bad : ok)),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer', 'security-reviewer', 'acme-reviewer'],
      stats: { 'security-reviewer': { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer' },
      { agentType: 'acme-reviewer', label: 'acme-reviewer' },
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      { agentType: 'gtm:security-reviewer', label: 'security-reviewer · round 1' },
    ],
    prompts: {
      reviewer: SCOPE, 'security-reviewer': SCOPE, 'acme-reviewer': SCOPE,
      'security-reviewer · round 1': [...SCOPE, ...STATUS],
    },
    unprompted: { reviewer: STATUS, 'security-reviewer': STATUS },
  },
  {
    name: 'worktree: every prompt names it as the directory for every command and read',
    args: { worktree: '/tmp/wt/acme-t2' },
    reply: implementer(['src/a.js'], (d) => (d.label === 'reviewer' ? bad : ok)),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
    prompts: Object.fromEntries(['implement', 'reviewer', 'fix · round 1', 'reviewer · round 1'].map((l) => [l, WORKTREE])),
  },
  {
    name: 'no worktree: no prompt names one',
    args: {},
    reply: implementer(['src/a.js'], (d) => (d.label === 'reviewer' ? bad : ok)),
    returns: {
      status: 'CLEAN', head: 'h1', fixRounds: 1, reviewers: ['reviewer'],
      stats: { reviewer: { critical: 0, important: 1, minor: 0 } }, minors: [],
    },
    dispatches: [
      implement(), reviewer(),
      { agentType: 'gtm:implementer', label: 'fix · round 1', effort: 'medium' },
      reviewer('reviewer · round 1'),
    ],
    unprompted: Object.fromEntries(['implement', 'reviewer', 'fix · round 1', 'reviewer · round 1'].map((l) => [l, ['Worktree', 'cd ']])),
  },
].map((s) => ({ workflow: 'deliver-task', ...s }))

// Answers the designer with `board <round>` and the critic with critique(round, label).
const designReply = (critique) => (d) => {
  const round = Number(d.label.match(/round (\d+)/)[1])
  return d.agentType === 'gtm:designer' ? `board ${round}` : critique(round, d.label)
}
const critic = (label, extra = {}) => ({ agentType: 'gtm:design-critic', label, ...extra })
const score = (n, mustFix = []) => ({ score: n, mustFix, shouldFix: [], summary: 's' })
const designRounds = (n, extra = {}, criticExtra = extra) =>
  rounds(n, (r) => [
    { agentType: 'gtm:designer', label: `designer · round ${r}`, ...extra },
    { agentType: 'gtm:design-critic', label: `critic · round ${r}`, ...criticExtra },
  ])

const screenRounds = (screen, n) =>
  rounds(n, (r) => [
    { agentType: 'gtm:designer', label: `designer · ${screen} · round ${r}` },
    { agentType: 'gtm:design-critic', label: `critic · ${screen} · round ${r}` },
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
  {
    name: 'design: a critic that throws is retried once, same model and effort, and passes',
    args: { team: { 'design-critic': { model: 'opus', effort: 'high' } } },
    reply: designReply((r, label) => {
      if (!label.endsWith('· retry')) throw new Error('subagent completed without calling StructuredOutput')
      return score(8)
    }),
    returns: { passed: true, rounds: 1, scores: [8], verdict: score(8), board: 'board 1' },
    dispatches: [
      ...designRounds(1, {}, { model: 'opus', effort: 'high' }),
      critic('critic · round 1 · retry', { model: 'opus', effort: 'high' }),
    ],
    log: ['critic · round 1: lost its structured result, one retry'],
  },
  {
    name: 'design: a critic that throws is retried once and its score counts against the bar',
    args: {},
    reply: designReply((r, label) => {
      if (label === 'critic · round 1') throw new Error('no structured output')
      return score(r === 1 ? 7 : 8)
    }),
    returns: { passed: true, rounds: 2, scores: [7, 8], verdict: score(8), board: 'board 2' },
    dispatches: [...designRounds(1), critic('critic · round 1 · retry'), ...designRounds(2).slice(2)],
    log: ['critic · round 1: lost its structured result, one retry'],
  },
  {
    name: 'design: a critic that returns null stops the loop not passed and is not dispatched again',
    args: {},
    reply: designReply(() => null),
    returns: { passed: false, rounds: 0, scores: [], verdict: null, board: 'board 1' },
    dispatches: designRounds(1),
    log: ['critic · round 1: returned nothing', 'not dispatched again'],
    unlogged: ['retry'],
  },
  {
    name: 'design: two throws stop the loop not passed, no third dispatch',
    args: {},
    reply: designReply(() => {
      throw new Error('subagent completed without calling StructuredOutput')
    }),
    returns: { passed: false, rounds: 0, scores: [], verdict: null, board: 'board 1' },
    dispatches: [...designRounds(1), critic('critic · round 1 · retry')],
    log: ['critic · round 1: no result after its retry, no third dispatch'],
  },
  {
    name: 'design screens: each screen drawn and judged alone, passed when every screen passed',
    args: { outDir: 'out', screens: ['home', 'search'] },
    reply: designReply((r, label) => score(label.includes('search') && r === 1 ? 7 : 8)),
    returns: {
      passed: true,
      screens: [
        { screen: 'home', passed: true, rounds: 1, scores: [8], verdict: score(8), board: 'board 1' },
        { screen: 'search', passed: true, rounds: 2, scores: [7, 8], verdict: score(8), board: 'board 2' },
      ],
    },
    dispatches: [...screenRounds('home', 1), ...screenRounds('search', 2)],
    prompts: {
      'designer · home · round 1': ['Screen: home. Draw this screen alone', 'Output folder: out/home\n'],
      'critic · search · round 2': ['the screen search alone', 'Screen: search.'],
      'designer · search · round 2': ['Output folder: out/search\n', "The critic's verdict on your previous board"],
    },
    unprompted: { 'designer · home · round 1': ['Screen: search'] },
  },
  {
    name: 'design screens: a screen below the bar gets its own full rounds, its sibling passed, the run fails',
    args: { screens: ['home', 'search'] },
    reply: designReply((r, label) => score(label.includes('home') ? 9 : 7)),
    returns: {
      passed: false,
      screens: [
        { screen: 'home', passed: true, rounds: 1, scores: [9], verdict: score(9), board: 'board 1' },
        { screen: 'search', passed: false, rounds: 3, scores: [7, 7, 7], verdict: score(7), board: 'board 3' },
      ],
    },
    dispatches: [...screenRounds('home', 1), ...screenRounds('search', 3)],
    log: ['search: Round 3: 7/10'],
  },
  {
    name: 'design screens: maxRounds 2 is each screen own cap',
    args: { maxRounds: 2, screens: ['a', 'b', 'c'] },
    reply: designReply((r, label) => score(label.includes(' b ') ? 9 : 6, label.includes(' b ') ? [] : ['overflow'])),
    returns: {
      passed: false,
      screens: [
        { screen: 'a', passed: false, rounds: 2, scores: [6, 6], verdict: score(6, ['overflow']), board: 'board 2' },
        { screen: 'b', passed: true, rounds: 1, scores: [9], verdict: score(9), board: 'board 1' },
        { screen: 'c', passed: false, rounds: 2, scores: [6, 6], verdict: score(6, ['overflow']), board: 'board 2' },
      ],
    },
    dispatches: [...screenRounds('a', 2), ...screenRounds('b', 1), ...screenRounds('c', 2)],
  },
  {
    name: 'design screens: a designer that throws or returns nothing, or a critic lost twice, ends that screen only',
    args: { screens: ['home', 'list', 'cart', 'search'] },
    reply: (d) => {
      if (d.label === 'designer · home · round 1') throw new Error('designer crashed')
      if (d.label === 'designer · list · round 1') return null
      if (d.label.startsWith('critic · cart')) throw new Error('subagent completed without calling StructuredOutput')
      return designReply(() => score(8))(d)
    },
    returns: {
      passed: false,
      screens: [
        { screen: 'home', passed: false, rounds: 0, scores: [], verdict: null, board: null },
        { screen: 'list', passed: false, rounds: 0, scores: [], verdict: null, board: null },
        { screen: 'cart', passed: false, rounds: 0, scores: [], verdict: null, board: 'board 1' },
        { screen: 'search', passed: true, rounds: 1, scores: [8], verdict: score(8), board: 'board 1' },
      ],
    },
    dispatches: [
      screenRounds('home', 1)[0], screenRounds('list', 1)[0],
      ...screenRounds('cart', 1), critic('critic · cart · round 1 · retry'), ...screenRounds('search', 1),
    ],
    log: ['list: the designer returned nothing, this screen ends not passed'],
  },
  {
    name: 'design screens: a screen listed twice runs nothing',
    args: { screens: ['home', 'search', 'home'] },
    reply: designReply(() => score(9)),
    returns: { passed: false, screens: [], error: 'screen "home" listed twice or not a slug' },
    dispatches: [],
    log: ['Screen "home" is listed twice', 'nothing runs'],
  },
  {
    name: 'design screens: a screen that is not a slug runs nothing',
    args: { screens: ['home', '../etc'] },
    reply: designReply(() => score(9)),
    returns: { passed: false, screens: [], error: 'screen "../etc" listed twice or not a slug' },
    dispatches: [],
  },
  {
    name: 'design screens: one screen runs the loop as today',
    args: { outDir: 'out', screens: ['home'] },
    reply: designReply(() => score(8)),
    returns: { passed: true, rounds: 1, scores: [8], verdict: score(8), board: 'board 1' },
    dispatches: designRounds(1),
    prompts: { 'designer · round 1': ['Output folder: out\n'] },
    unprompted: { 'designer · round 1': ['Screen:'], 'critic · round 1': ['Screen:', 'alone'] },
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
    const { value, dispatches, logs, prompts, extra } = await run(s.workflow, src, s.args, s.reply)
    if (canon(value) !== canon(s.returns)) differs(where, 'returned value', s.returns, value)
    if (canon(dispatches) !== canon(s.dispatches)) differs(where, 'dispatches', s.dispatches, dispatches)
    // Each expected entry is a set of fragments that one log line must hold together.
    if (s.log && !logs.some((line) => s.log.every((part) => line.includes(part)))) differs(where, 'log', s.log, logs)
    // And no log line may hold any of these.
    for (const part of s.unlogged || []) if (logs.some((line) => line.includes(part))) differs(where, `log without "${part}"`, [], logs)
    if (extra.length) failures.push(`${where}: reply fields the schema does not declare: ${extra.join(', ')}`)
    // The prompt sent to each listed label holds every fragment given for it, and none of the unprompted.
    for (const [label, parts] of Object.entries(s.prompts || {})) {
      for (const part of parts) if (!(prompts[label] || '').includes(part)) failures.push(`${where}: prompt of ${label} lacks "${part}"`)
    }
    for (const [label, parts] of Object.entries(s.unprompted || {})) {
      if (!(label in prompts)) failures.push(`${where}: no dispatch labelled ${label}`)
      for (const part of parts) if ((prompts[label] || '').includes(part)) failures.push(`${where}: prompt of ${label} holds "${part}"`)
    }
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

const S3 = 'self-check: a reply field the schema does not declare is named'
const PROBE = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: { summary: { type: 'string' } } } } } }
const caught = await run('probe', "void await agent('p', { label: 'x', schema: args })", PROBE,
  () => ({ findings: [{ summary: 's', status: 'addressed' }], note: 'n' }))
if (canon(caught.extra) !== canon(['x.findings[0].status', 'x.note'])) differs(S3, 'returned value', ['x.findings[0].status', 'x.note'], caught.extra)

const S2 = 'self-check: a workflow without scenario is named'
const probe = unscripted(['deliver-task.js', 'design-loop.js', 'extra.js'], scenarios)
if (canon(probe) !== canon(['extra.js'])) differs(S2, 'returned value', ['extra.js'], probe)
for (const file of unscripted(readdirSync(folder), scenarios)) failures.push(`${file}: no scenario in scripts/workflows.test.mjs`)

// A skill must hand a workflow every argument the workflow reads: one left out falls back to the
// workflow's default without a word. Every workflow must be run by one such argument block, so a
// reworded skill cannot slip past this check.
const skills = new URL('../plugins/gtm/skills/', import.meta.url).pathname
const RUN = /Run the workflow `gtm:([\w-]+)` with args:?\s*`\{([\s\S]*?)\}`/g
const handed = new Set()
for (const dir of readdirSync(skills)) {
  const text = readFileSync(join(skills, dir, 'SKILL.md'), 'utf8')
  for (const [, workflow, block] of text.matchAll(RUN)) {
    handed.add(workflow)
    const src = readFileSync(join(folder, `${workflow}.js`), 'utf8')
    for (const name of new Set([...src.matchAll(/\b(?:A|args)\.(\w+)/g)].map((m) => m[1]))) {
      if (!new RegExp(`\\b${name}\\b`).test(block)) failures.push(`skills/${dir}/SKILL.md: args for ${workflow} omit ${name}`)
    }
  }
}
for (const file of readdirSync(folder)) {
  if (file.endsWith('.js') && !handed.has(file.slice(0, -3))) failures.push(`${file}: no skill runs it with an args block`)
}

if (failures.length) {
  console.error(failures.join('\n\n'))
  process.exit(1)
}
console.log(`workflow test: ${scenarios.length} scenarios, 3 self-checks and ${handed.size} skill hand-offs OK`)
