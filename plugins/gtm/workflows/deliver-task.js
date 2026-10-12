export const meta = {
  name: 'deliver-task',
  description: 'Implement one plan task, run only the reviews its diff needs, fix until clean (default 3 fix rounds)',
  whenToUse: 'Each task of an approved plan, or a Fix. args: {brief, report, branch, base, mockup?, track?, triggers?: {role: [regex]}, team?: {role: {model, effort}}, fixRounds?, fixCeiling?}',
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
        },
        required: ['severity', 'summary'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['verdict', 'findings', 'summary'],
}

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

phase('Implement')
const impl = await agent(
  `Implement this task on branch ${A.branch} (base ${A.base}).\nBrief (read it first): ${A.brief}\nReport file: ${A.report}\nReturn head = the commit after your work, files = repo-relative paths changed since ${A.base}.`,
  as('implementer', { schema: IMPL, label: 'implement', phase: 'Implement' }),
)
if (!impl || impl.status === 'BLOCKED') return { status: 'BLOCKED', impl }

const ground = (files) => Object.keys(triggers).filter((r) => files.some((f) => triggers[r].some((re) => re.test(f))))
// A Fix escalates on size alone, counted over every file it has changed so far. On security or
// data ground it stays a Fix and that specialist reviews it, as on any task.
const ceiling = A.fixCeiling ?? 3
function escalation(files, at) {
  if (A.track !== 'fix' || files.length <= ceiling) return null
  const reason = `${files.length} files > ${ceiling}`
  log(`Fix escalates to Feature: ${reason}`)
  return { status: 'ESCALATE', reason, head: at, files }
}
let changed = impl.files
const early = escalation(changed, impl.head)
if (early) return early
const reviewers = ['reviewer', ...ground(impl.files)]
log(`Reviews for this task: ${reviewers.join(', ')}`)

let head = impl.head
let scope = `${A.base}..${head}`
let pending = reviewers.map((r) => ({ r, findings: null }))
const minors = []
const stats = {}
let open = []
for (let round = 0; round <= ROUNDS; round++) {
  phase('Review')
  const results = await parallel(
    pending.map((p) => () =>
      agent(
        `${round ? 'Re-review the fix round' : 'Review the task'}: diff ${scope} on branch ${A.branch}.\nBrief: ${A.brief}\nImplementer report: ${A.report}` +
          (A.mockup ? `\nValidated mockup: ${A.mockup}` : '') +
          (p.findings ? `\nYour findings this fix must address (say ADDRESSED or NOT for each, then any new breakage in the fix diff only):\n${JSON.stringify(p.findings, null, 2)}` : ''),
        as(p.r, { schema: REVIEW, label: `${p.r}${round ? ` · round ${round}` : ''}`, phase: 'Review' }),
      ),
    ),
  )
  open = []
  const still = []
  results.forEach((res, i) => {
    const r = pending[i].r
    if (!res) {
      // A reviewer that died is not an approval.
      open.push({ severity: 'important', summary: `${r} returned no review`, by: r })
      still.push(pending[i])
      return
    }
    const blocking = []
    for (const f of res.findings) {
      stats[r] = stats[r] || { critical: 0, important: 0, minor: 0 }
      stats[r][f.severity]++
      if (f.severity === 'minor') minors.push({ ...f, by: r })
      else blocking.push(f)
    }
    if (blocking.length) {
      open.push(...blocking.map((f) => ({ ...f, by: r })))
      still.push({ r, findings: blocking })
    }
  })
  if (!open.length) return { status: 'CLEAN', head, fixRounds: round, reviewers, stats, minors }
  if (round === ROUNDS) break
  log(`Fix round ${round + 1}: ${open.length} finding(s)`)
  const fix = await agent(
    `Fix these review findings on branch ${A.branch} (head ${head}), test-first, one commit per fix; append a fix section to ${A.report}.\nBrief: ${A.brief}\nFindings:\n${JSON.stringify(open, null, 2)}\nReturn head = the commit after your fixes, files = paths changed in the fixes.`,
    as('implementer', { schema: IMPL, effort: raised(round + 1), label: `fix · round ${round + 1}`, phase: 'Fix' }),
  )
  if (!fix || fix.status === 'BLOCKED') return { status: 'BLOCKED', head, open, stats, minors }
  changed = [...new Set([...changed, ...fix.files])]
  // The findings this fix round got are not re-reviewed yet: they go with the escalation, so the
  // Feature flow checks them instead of losing them.
  const grown = escalation(changed, fix.head)
  if (grown) return { ...grown, open, reviewers, stats, minors }
  // A fix round on a specialist's ground goes back to that specialist, even after its approval:
  // a Fix has no final review to catch it later.
  for (const r of ground(fix.files)) {
    if (!still.some((p) => p.r === r)) still.push({ r, findings: null })
    if (!reviewers.includes(r)) reviewers.push(r)
  }
  scope = `${head}..${fix.head}`
  head = fix.head
  pending = still
}
return { status: 'OPEN', head, fixRounds: ROUNDS, open, reviewers, stats, minors }
