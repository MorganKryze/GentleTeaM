export const meta = {
  name: 'design-loop',
  description: 'Designer drafts mockup boards, the critic scores them, repeat until the bar is met (default 3 rounds, 8/10, zero must-fix)',
  whenToUse: 'Feature or Milestone that changes screens, before the spec. args: {brief, outDir, guideline?, threshold?, maxRounds?, team?: {designer: {model, effort}, "design-critic": {...}}}',
  phases: [{ title: 'Design' }, { title: 'Critique' }],
}

const A = args || {}
const MAX = A.maxRounds || 3
const BAR = A.threshold || 8
const GUIDE = A.guideline || '.gtm/guidelines/design.md'
const TEAM = A.team || {}
const SCORE = {
  type: 'object',
  properties: {
    score: { type: 'number' },
    mustFix: { type: 'array', items: { type: 'string' } },
    shouldFix: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
  },
  required: ['score', 'mustFix', 'shouldFix', 'summary'],
}

// The project's team profile wins over the agents' frontmatter defaults.
function as(role, extra) {
  const o = { agentType: `gtm:${role}`, ...extra }
  const t = TEAM[role] || {}
  if (t.model && t.model !== 'inherit' && !o.model) o.model = t.model
  if (t.effort && !o.effort) o.effort = t.effort
  return o
}

let board = null
let verdict = null
const scores = []
for (let round = 1; round <= MAX; round++) {
  const previous = verdict
    ? `\n\nThe critic's verdict on your previous board. Fix every must-fix, consider the should-fix:\n${JSON.stringify(verdict, null, 2)}\n\nYour previous hand-back:\n${board}`
    : ''
  board = await agent(
    `Brief:\n${A.brief}\n\nDesign guideline: ${GUIDE}\nOutput folder: ${A.outDir}\nRound ${round} of ${MAX}.${previous}`,
    as('designer', { label: `designer · round ${round}`, phase: 'Design' }),
  )
  if (!board) break
  verdict = await agent(
    `Score this board against ${GUIDE}. Pass bar: ${BAR}/10 with zero must-fix.\n\nBrief:\n${A.brief}\n\nDesigner hand-back (PNG and HTML paths inside):\n${board}`,
    as('design-critic', { schema: SCORE, label: `critic · round ${round}`, phase: 'Critique' }),
  )
  if (!verdict) break
  scores.push(verdict.score)
  log(`Round ${round}: ${verdict.score}/10, ${verdict.mustFix.length} must-fix`)
  if (verdict.score >= BAR && verdict.mustFix.length === 0) {
    return { passed: true, rounds: round, scores, verdict, board }
  }
}
return { passed: false, rounds: scores.length, scores, verdict, board }
