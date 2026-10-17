export const meta = {
  name: 'deliver-task',
  description: 'Implement one plan task, run only the reviews its diff needs, fix until clean (default 3 fix rounds)',
  whenToUse: 'Each task of an approved plan, or a Fix. args: {brief, report, branch, base, worktree?, mockup?, track?, triggers?: {role: [regex]}, team?: {role: {model, effort}}, fixRounds?, fixCeiling?, tier?, cadence?, standardRounds?, review?: range|branch, head?, files?}',
  phases: [{ title: 'Implement' }, { title: 'Review' }, { title: 'Fix' }],
}

const A = args || {}
const TEAM = A.team || {}
const ROUNDS = A.fixRounds ?? 3
const ROLES = ['analyst', 'designer', 'design-critic', 'architect', 'implementer', 'reviewer',
  'security-reviewer', 'data-reviewer', 'ux-qa', 'final-reviewer', 'release-qa']
const LEVELS = ['low', 'medium', 'high', 'xhigh']
const IMPL = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['DONE', 'DONE_WITH_CONCERNS', 'BLOCKED'] },
    head: { type: 'string' },
    files: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    concerns: { type: 'string' },
  },
  required: ['status', 'head', 'files', 'summary'],
}
const REVIEW = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['approve', 'fix'] },
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['critical', 'important', 'minor'] },
          file: { type: 'string' },
          summary: { type: 'string' },
          status: { type: 'string', enum: ['addressed', 'open'] },
        },
        required: ['severity', 'summary'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['verdict', 'findings', 'summary'],
}

// Every task reviewer, every round, is told what a defect the diff did not introduce weighs, so a
// pre-existing one waits in the ledger instead of blocking a task that did not cause it.
// The scope rule reads against the task's whole range on every round: a re-review's diff is the
// fix, and every finding it re-checks was introduced by the task, never by the fix.
const SCOPE = (range) => `\nScope: a defect the task's diff ${range} did not introduce (it neither adds nor changes the faulty lines nor makes them newly reachable) is minor, its summary saying it predates the task, unless it is critical, a security hole or a data-integrity defect.`

// A task of a parallel wave runs in its own worktree: every prompt names it, so no agent reads or
// writes the delivery's tree. Without one, no prompt mentions a worktree.
const WT = A.worktree ? `\nWorktree: ${A.worktree}. Run every command after cd "${A.worktree}" and read every repository file there; paths given outside it stay as given.` : ''

// A GTM role is namespaced by the plugin; a project agent keeps its own type.
// The project's team profile wins over the agents' frontmatter defaults.
function as(role, extra) {
  const o = { agentType: ROLES.includes(role) ? `gtm:${role}` : role, ...extra }
  const t = TEAM[role] || {}
  if (t.model && t.model !== 'inherit' && !o.model) o.model = t.model
  if (t.effort && !o.effort) o.effort = t.effort
  return o
}
// Each fix round thinks one level harder than the last, capped at xhigh. An effort off that
// ladder, such as max, is kept: lowering it would undo the project's choice.
function raised(round) {
  const effort = (TEAM.implementer || {}).effort || 'low'
  const base = LEVELS.indexOf(effort)
  return base < 0 ? effort : LEVELS[Math.min(base + round, LEVELS.length - 1)]
}
// Specialists run only when the diff touches their ground. A bad regex runs the specialist anyway.
const triggers = {}
for (const [role, list] of Object.entries(A.triggers || {})) {
  triggers[role] = (list || []).map((src) => {
    try {
      return new RegExp(src)
    } catch {
      log(`Invalid trigger for ${role}: ${src}. ${role} runs on every task until it is fixed.`)
      return /./
    }
  })
}
const ground = (files) => Object.keys(triggers).filter((r) => files.some((f) => triggers[r].some((re) => re.test(f))))
// A role reviews per task unless the profile says per-wave or per-branch. An unknown cadence, or a
// lighter one for the security or data reviewer, reads as per-task; a cadence that is not a role
// map reads as per-task for every role. The reviewer joins the range review only, so its
// per-branch reads as per-wave.
const MAP = A.cadence && typeof A.cadence === 'object' && !Array.isArray(A.cadence) ? A.cadence : {}
if (A.cadence != null && MAP !== A.cadence) log('Cadence is not a role map, read as per-task for every role')
const CADENCE = {}
for (const r of new Set(['reviewer', ...Object.keys(triggers), ...Object.keys(MAP)])) {
  const c = MAP[r]
  const light = (c === 'per-wave' || c === 'per-branch') && !['security-reviewer', 'data-reviewer'].includes(r)
  CADENCE[r] = !light ? 'per-task' : r === 'reviewer' ? 'per-wave' : c
  if (c !== undefined && c !== CADENCE[r]) log(`Cadence ${c} for ${r} read as ${CADENCE[r]}`)
}
const per = (files, c) => ground(files).filter((r) => CADENCE[r] === c)

// A reviewer whose dispatch throws (its structured result lost) gets one more dispatch on a
// budget, with the same diff, findings, model and effort; a second throw is logged and left to the
// fallback below. A null is a blocked spawn, a human's skip or an API error already logged: it is
// never retried. An implementer is never retried (a second one could stack commits on a half-done
// attempt): a throw is BLOCKED, as nothing back is.
const RETRY = '\n\nThis is a retry: your previous run ended without the structured result. Use at most 25 tool calls, write no report file, and make the structured output call your last action. What you could not check within that budget is an important finding, never an approval.'
async function attempt(prompt, opts) {
  try {
    return await agent(prompt, opts)
  } catch {
    return null
  }
}
async function retried(prompt, opts) {
  try {
    const first = await agent(prompt, opts)
    if (first == null) log(`${opts.label}: returned nothing (a blocked spawn, a skip or an API error), not dispatched again`)
    return first
  } catch {
    log(`${opts.label}: lost its structured result, one retry with a 25-call budget`)
  }
  const second = await attempt(prompt + RETRY, { ...opts, label: `${opts.label} · retry` })
  if (second == null) log(`${opts.label}: no result after its retry, no third dispatch`)
  return second
}

phase('Implement')
// A deferred review implements nothing: its range and the files git lists in it are given. A mode,
// range or file list missing fails closed, as nothing reviewed is never a clean range.
if (A.review !== undefined && (!['range', 'branch'].includes(A.review) || !A.base || !A.head || !Array.isArray(A.files))) {
  log(`Deferred review ${A.review} not run: review range|branch, base, head and files are required`)
  return { status: 'BLOCKED', reason: 'a deferred review needs review range|branch, base, head and files' }
}
const impl = A.review ? { head: A.head, files: A.files } : await attempt(
  `Implement this task on branch ${A.branch} (base ${A.base}).\nBrief (read it first): ${A.brief}\nReport file: ${A.report}\nReturn head = the commit after your work, files = repo-relative paths changed since ${A.base}.${WT}`,
  as('implementer', { schema: IMPL, label: 'implement', phase: 'Implement' }),
)
if (!impl || impl.status === 'BLOCKED') return { status: 'BLOCKED', impl }

// A Fix escalates on size alone, counted over every file it has changed so far. On security or
// data ground it stays a Fix and that specialist reviews it, as on any task. A ceiling is a whole
// number, or a text that starts with one (`3 files`); any other value escalates every Fix.
const given = A.fixCeiling ?? 3
const lead = typeof given === 'number' ? given : Number((String(given).match(/^\s*(\d+)\b/) || [])[1])
const ceiling = Number.isSafeInteger(lead) && lead >= 0 ? lead : null
function escalation(files, at) {
  if (A.track !== 'fix' || (ceiling !== null && files.length <= ceiling)) return null
  const reason = ceiling === null ? `fix ceiling ${given} is not a number of files` : `${files.length} files > ${ceiling}`
  log(`Fix escalates to Feature: ${reason}`)
  return { status: 'ESCALATE', reason, head: at, files }
}
let changed = impl.files
const early = escalation(changed, impl.head)
if (early) return early
// A standard task off every per-task role's ground gets no review of its own: its range waits for
// the deferred one. Anything else, a Fix, or a profile with the reviewer per task, is guarded.
const guardedBy = per(impl.files, 'per-task')
const standard = !A.review && A.tier === 'standard' && A.track !== 'fix' && CADENCE.reviewer !== 'per-task'
if (standard && !guardedBy.length) return { status: 'GATED', tier: 'standard', head: impl.head, files: impl.files }
if (standard) log(`Tier rises to guarded: ${guardedBy.join(', ')}`)
const T = A.tier === 'standard' && !A.review ? { tier: 'guarded' } : {}
const reviewers = A.review === 'branch' ? per(impl.files, 'per-branch')
  : A.review ? ['reviewer', ...ground(impl.files).filter((r) => CADENCE[r] !== 'per-branch')]
  : ['reviewer', ...ground(impl.files)]
// A deferred review gets the standard fix rounds, the profile's once guarded ground is in it.
let limit = A.review && !guardedBy.length ? (A.standardRounds ?? 1) : ROUNDS
log(`Reviews for this task: ${reviewers.join(', ')}`)

let head = impl.head
let scope = `${A.base}..${head}`
let pending = reviewers.map((r) => ({ r, findings: null }))
const minors = []
const stats = {}
// A reviewer with no review is not an approval, and no fix round can answer it: its finding stays
// open to the end and it is not dispatched again, so a later round's diff never stands in for the
// task's own.
const unreviewed = []
let open = []
let round = 0
for (; round <= limit; round++) {
  phase('Review')
  const results = await parallel(
    pending.map((p) => () =>
      retried(
        `${round && !p.whole ? 'Re-review the fix round' : `Review the ${A.review ? 'range' : 'task'}`}: diff ${p.whole ? `${A.base}..${head}` : scope} on branch ${A.branch}.\nBrief: ${A.brief}\nImplementer report: ${A.report}` +
          (A.mockup ? `\nValidated mockup: ${A.mockup}` : '') +
          (p.findings ? `\nYour findings this fix must address. Return each with status "addressed" or "open", then only new breakage in the fix diff; approve when none is left open. Each finding sent keeps its severity until it is addressed:\n${JSON.stringify(p.findings, null, 2)}` : '') +
          SCOPE(`${A.base}..${head}`) + WT,
        as(p.r, { schema: REVIEW, label: `${p.r}${round ? ` · round ${round}` : ''}`, phase: 'Review' }),
      ),
    ),
  )
  open = []
  const still = []
  results.forEach((res, i) => {
    const r = pending[i].r
    // The findings its last fix round got go with the placeholder: nobody has checked them.
    if (!res) {
      unreviewed.push({ severity: 'important', summary: `${r} returned no review`, by: r },
        ...(pending[i].findings || []).map((f) => ({ ...f, by: r })))
      return
    }
    const blocking = []
    const count = (severity) => { stats[r] = stats[r] || { critical: 0, important: 0, minor: 0 }; stats[r][severity]++ }
    for (const f of res.findings) {
      // Only a reviewer sent findings to re-check can close one; anywhere else the severity decides.
      if (pending[i].findings && f.status === 'addressed') continue
      count(f.severity)
      // A status it may not set goes too, or the fix round and the re-review would read it as true.
      const { status, ...kept } = f
      if (f.severity === 'minor') minors.push({ ...kept, by: r })
      else blocking.push(kept)
    }
    // A fix verdict is never an approval, even with nothing blocking to show for it: its summary is
    // then the only reason given, so the fix round and the re-review get it, and it counts as one.
    if (res.verdict === 'fix' && !blocking.length) {
      count('important')
      blocking.push({ severity: 'important', summary: `${r} asked for a fix without a blocking finding: ${res.summary}` })
    }
    if (blocking.length) {
      open.push(...blocking.map((f) => ({ ...f, by: r })))
      still.push({ r, findings: blocking })
    }
  })
  if (!open.length && !unreviewed.length) return { status: 'CLEAN', head, fixRounds: round, reviewers, stats, minors, ...T }
  if (!open.length || round === limit) break
  log(`Fix round ${round + 1}: ${open.length} finding(s)`)
  const fix = await attempt(
    `Fix these review findings on branch ${A.branch} (head ${head}), test-first, one commit per fix; append a fix section to ${A.report}.\nBrief: ${A.brief}\nFindings:\n${JSON.stringify(open, null, 2)}\nReturn head = the commit after your fixes, files = paths changed in the fixes.${WT}`,
    as('implementer', { schema: IMPL, effort: raised(round + 1), label: `fix · round ${round + 1}`, phase: 'Fix' }),
  )
  if (!fix || fix.status === 'BLOCKED') return { status: 'BLOCKED', head, open: [...open, ...unreviewed], stats, minors, ...T }
  changed = [...new Set([...changed, ...fix.files])]
  // The findings this fix round got are not re-reviewed yet: they go with the escalation, so the
  // Feature flow checks them instead of losing them.
  const grown = escalation(changed, fix.head)
  if (grown) return { ...grown, open: [...open, ...unreviewed], reviewers, stats, minors }
  // A fix round on a specialist's ground goes back to that specialist, even after its approval,
  // on every track: a Fix has no final review, and a task's own review should not wait for it.
  for (const r of ground(fix.files)) {
    if (unreviewed.some((f) => f.by === r)) continue
    // In a deferred review, a fix on guarded ground gets that specialist on the whole range.
    const whole = Boolean(A.review) && CADENCE[r] === 'per-task'
    if (whole) limit = Math.max(limit, ROUNDS)
    if (!still.some((p) => p.r === r)) still.push({ r, findings: null, whole })
    if (!reviewers.includes(r)) reviewers.push(r)
  }
  scope = `${head}..${fix.head}`
  head = fix.head
  pending = still
}
return { status: 'OPEN', head, fixRounds: round, open: [...open, ...unreviewed], reviewers, stats, minors, ...T }
