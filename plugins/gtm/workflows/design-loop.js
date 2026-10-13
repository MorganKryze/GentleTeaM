export const meta = {
  name: 'design-loop',
  description: 'Designer drafts mockup boards, the critic scores them, repeat until the bar is met (default 3 rounds, 8/10, zero must-fix)',
  whenToUse: 'Feature or Milestone that changes screens, before the spec. args: {brief, outDir, screens?: [slug], guideline?, threshold?, maxRounds?, team?: {designer: {model, effort}, "design-critic": {...}}}',
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

// A critic whose dispatch throws (its verdict lost) gets one more dispatch on a budget; a second
// throw is logged and stops the loop as before. Its model and effort stay the same. A null is a
// blocked spawn, a human's skip or an API error already logged: it stops the loop, never retried.
const RETRY = '\n\nThis is a retry: your previous run ended without the structured result. Use at most 25 tool calls, write no report file, and make the structured output call your last action.'
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

// One screen's loop: its own designer, critic and rounds. Without a screen it is today's loop on
// the whole brief and folder; with one, each prompt and label names it and its folder is its own.
async function loop(screen) {
  const tag = screen ? ` · ${screen}` : ''
  const only = screen ? `\nScreen: ${screen}. Draw this screen alone; the brief's other screens are drawn apart.` : ''
  const out = screen ? `${A.outDir}/${screen}` : A.outDir
  // A designer that throws on one screen ends that screen only, never its siblings.
  const draw = screen ? attempt : agent
  let board = null
  let verdict = null
  const scores = []
  for (let round = 1; round <= MAX; round++) {
    const previous = verdict
      ? `\n\nThe critic's verdict on your previous board. Fix every must-fix, consider the should-fix:\n${JSON.stringify(verdict, null, 2)}\n\nYour previous hand-back:\n${board}`
      : ''
    board = await draw(
      `Brief:\n${A.brief}${only}\n\nDesign guideline: ${GUIDE}\nOutput folder: ${out}\nRound ${round} of ${MAX}.${previous}`,
      as('designer', { label: `designer${tag} · round ${round}`, phase: 'Design' }),
    )
    if (!board) {
      if (screen) log(`${screen}: the designer returned nothing, this screen ends not passed`)
      break
    }
    verdict = await retried(
      `Score this board${screen ? `, the screen ${screen} alone,` : ''} against ${GUIDE}. Pass bar: ${BAR}/10 with zero must-fix.\n\nBrief:\n${A.brief}${only}\n\nDesigner hand-back (PNG and HTML paths inside):\n${board}`,
      as('design-critic', { schema: SCORE, label: `critic${tag} · round ${round}`, phase: 'Critique' }),
    )
    if (!verdict) break
    scores.push(verdict.score)
    log(`${screen ? `${screen}: ` : ''}Round ${round}: ${verdict.score}/10, ${verdict.mustFix.length} must-fix`)
    if (verdict.score >= BAR && verdict.mustFix.length === 0) {
      return { passed: true, rounds: round, scores, verdict, board }
    }
  }
  return { passed: false, rounds: scores.length, scores, verdict, board }
}

// Two screens or more: all at once, each below the bar redrawn alone; the run passes only when
// every screen passed. A screen named twice, or not a slug, would share or escape a folder: nothing runs.
const SCREENS = A.screens || []
if (SCREENS.length < 2) return await loop(null)
const wrong = SCREENS.find((s, i) => SCREENS.indexOf(s) !== i || !/^[a-z0-9][a-z0-9-]*$/.test(s))
if (wrong !== undefined) {
  log(`Screen "${wrong}" is listed twice or is not a slug (a-z, 0-9, -): nothing runs`)
  return { passed: false, screens: [], error: `screen "${wrong}" listed twice or not a slug` }
}
const results = await parallel(SCREENS.map((s) => () => loop(s)))
const screens = results.map((r, i) => ({ screen: SCREENS[i], ...r }))
return { passed: screens.every((s) => s.passed), screens }
