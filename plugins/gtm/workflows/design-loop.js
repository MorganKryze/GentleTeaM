export const meta = {
  name: 'design-loop',
  description: 'Designer drafts mockups, the critic scores them, until the bar is met',
  whenToUse: 'Screens of a Feature, as /gtm:design passes its args.',
  phases: [{ title: 'Direction' }, { title: 'Design' }, { title: 'Critique' }],
}

const A = args || {}
const MAX = A.maxRounds || 3
const BAR = A.threshold || 8
const TASTE_BAR = A.tasteBar || 7
const GUIDE = A.guideline || '.gtm/guidelines/design.md'
const TEAM = A.team || {}
const SKILLS = Array.isArray(A.skills) ? A.skills : []
const STAGES = ['directions', 'draw']
const JOBS = ['brand', 'website', 'mobile']
const AXES = ['type', 'colour', 'structure', 'tone']
const TASTE = ['distinctiveness', 'faithfulness', 'hierarchy', 'typography', 'signature']
// With a picked direction the critic owes the taste grades, and the loop owes a round that goes
// further: goFurther: false is only for a direction already taken past that round. Without a
// direction neither applies: today's loop.
const DIRECTED = !!A.direction
const FURTHER = DIRECTED && A.goFurther !== false
const LAST = FURTHER ? Math.max(MAX, 2) : MAX
const GRADE = { type: 'number', minimum: 0, maximum: 10 }
const SCORE = {
  type: 'object',
  properties: {
    score: { type: 'number' },
    mustFix: { type: 'array', items: { type: 'string' } },
    shouldFix: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    taste: {
      type: 'object',
      properties: { ...Object.fromEntries(TASTE.map((k) => [k, GRADE])), notes: { type: 'array', items: { type: 'string' } } },
      required: [...TASTE, 'notes'],
    },
  },
  required: ['score', 'mustFix', 'shouldFix', 'summary', ...(DIRECTED ? ['taste'] : [])],
}
const DIRECTIONS = {
  type: 'object',
  properties: {
    directions: {
      type: 'array',
      items: {
        type: 'object',
        properties: { name: { type: 'string' }, idea: { type: 'string' }, ...Object.fromEntries(AXES.map((k) => [k, { type: 'string' }])), references: { type: 'array', items: { type: 'string' } } },
        required: ['name', 'idea', ...AXES, 'references'],
      },
    },
    page: { type: 'string' },
    summary: { type: 'string' },
  },
  required: ['directions', 'page', 'summary'],
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

// The taste score is the lowest of the five grades: a strong grade never buys back a weak one, and
// the workflow computes it, so a critic cannot round it up. Anything but five numbers in 0..10
// reads 0: a critic that gives no taste never passes it.
function lowest(verdict) {
  const grades = TASTE.map((k) => verdict.taste?.[k])
  return grades.every((n) => typeof n === 'number' && n >= 0 && n <= 10) ? Math.min(...grades) : 0
}

const said = (s) => String(s ?? '').trim().toLowerCase()
// What is wrong with a set of directions, by rule. A reference may be missing from all three (no
// network), never from one: the art director looked, or it did not.
function refused(all) {
  if (!Array.isArray(all) || all.length !== 3) return [`${Array.isArray(all) ? all.length : 0} directions, exactly 3 wanted`]
  const wrong = []
  for (const k of ['name', 'idea', ...AXES]) {
    if (all.some((d) => !said(d[k]))) wrong.push(`an empty ${k}`)
    else if (AXES.includes(k) && new Set(all.map((d) => said(d[k]))).size < 3) wrong.push(`two directions share their ${k}`)
  }
  const cited = all.filter((d) => (d.references || []).length).length
  if (cited && cited < 3) wrong.push('a direction cites no reference')
  return wrong
}

const CRAFT = A.craft ? `\nCraft: ${A.craft}` : ''
const OPTIONAL = SKILLS.length ? `\nOptional skills: ${SKILLS.join(', ')}` : ''
const LIBRARY = A.taste ? `\nTaste library: ${A.taste}` : ''

// The art-direction stage: three directions for the human to pick from, never a mockup. Refused
// directions go back once with the reasons; a second refusal ends the stage not passed.
async function directions() {
  const ask = `Brief:\n${A.brief}\n\nDesign guideline: ${GUIDE}\nOutput folder: ${A.outDir}${CRAFT}${OPTIONAL}${LIBRARY}`
  let out = null
  let wrong = []
  for (let round = 1; round <= 2; round++) {
    const again = wrong.length ? `\n\nYour previous directions were refused: ${wrong.join('; ')}. Send three that differ on ${AXES.join(', ')}.` : ''
    out = await retried(ask + again, as('art-director', { schema: DIRECTIONS, label: `art director · round ${round}`, phase: 'Direction' }))
    if (!out) return { passed: false, rounds: round, directions: [], error: 'the art director returned no directions' }
    wrong = refused(out.directions)
    if (!wrong.length) return { passed: true, rounds: round, directions: out.directions, page: out.page, summary: out.summary }
    log(`Art director, round ${round}: ${wrong.join('; ')}`)
  }
  return { passed: false, rounds: 2, directions: [], error: wrong.join('; ') }
}

const GO_FURTHER = '\n\nGo further: this round is not polish. Keep the picked direction and push its strongest idea past the safe version: a bolder scale, a harder structural move, more of what only this client has. Fix every must-fix on the way.'

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
  const tastes = []
  const graded = () => (DIRECTED ? { tastes } : {})
  const steer = DIRECTED ? `\n\nDirection, picked by the human: ${A.direction}${LIBRARY}` : ''
  for (let round = 1; round <= LAST; round++) {
    const previous = verdict
      ? `\n\nThe critic's verdict on your previous board. Fix every must-fix, consider the should-fix:\n${JSON.stringify(verdict, null, 2)}\n\nYour previous hand-back:\n${board}`
      : ''
    const further = FURTHER && round === 2 ? GO_FURTHER : ''
    board = await draw(
      `Brief:\n${A.brief}${only}\n\nDesign guideline: ${GUIDE}\nOutput folder: ${out}\nRound ${round} of ${LAST}.${CRAFT}${OPTIONAL}${steer}${further}${previous}`,
      as('designer', { label: `designer${tag} · round ${round}`, phase: 'Design' }),
    )
    if (!board) {
      if (screen) log(`${screen}: the designer returned nothing, this screen ends not passed`)
      break
    }
    verdict = await retried(
      `Score this board${screen ? `, the screen ${screen} alone,` : ''} against ${GUIDE}. Pass bar: ${BAR}/10 with zero must-fix.${DIRECTED ? ` Taste bar: ${TASTE_BAR}/10, the lowest of ${TASTE.join(', ')}.` : ''}\n\nBrief:\n${A.brief}${only}${CRAFT}${steer}\n\nDesigner hand-back (PNG and HTML paths inside):\n${board}`,
      as('design-critic', { schema: SCORE, label: `critic${tag} · round ${round}`, phase: 'Critique' }),
    )
    if (!verdict) break
    scores.push(verdict.score)
    const taste = lowest(verdict)
    if (DIRECTED) tastes.push(taste)
    log(`${screen ? `${screen}: ` : ''}Round ${round}: ${verdict.score}/10, ${verdict.mustFix.length} must-fix${DIRECTED ? `, taste ${taste}/10` : ''}`)
    const conforms = verdict.score >= BAR && verdict.mustFix.length === 0
    const pleases = !DIRECTED || taste >= TASTE_BAR
    if (conforms && pleases && (!FURTHER || round >= 2)) {
      return { passed: true, rounds: round, scores, ...graded(), verdict, board }
    }
  }
  return { passed: false, rounds: scores.length, scores, ...graded(), verdict, board }
}

// Two screens or more: all at once, each below the bar redrawn alone; the run passes only when
// every screen passed. A screen named twice, or not a slug string, would share or escape a
// folder: nothing runs; neither does a list that is not an array.
const SCREENS = A.screens || []
const bad = (s, i) => typeof s !== 'string' || SCREENS.indexOf(s) !== i || !/^[a-z0-9][a-z0-9-]*$/.test(s)
const at = Array.isArray(SCREENS) ? SCREENS.findIndex(bad) : -2
if (at !== -1) {
  const wrong = at === -2 ? SCREENS : SCREENS[at]
  log(`Screen "${wrong}" is listed twice or is not a slug (a-z, 0-9, -): nothing runs`)
  return { passed: false, screens: [], error: `screen "${wrong}" listed twice or not a slug` }
}
if (A.stage && !STAGES.includes(A.stage)) {
  log(`Stage "${A.stage}" is not one of ${STAGES.join(', ')}: nothing runs`)
  return { passed: false, screens: [], error: `stage "${A.stage}" unknown` }
}
if (A.craft && !JOBS.includes(A.craft)) {
  log(`Craft "${A.craft}" is not one of ${JOBS.join(', ')}: nothing runs`)
  return { passed: false, screens: [], error: `craft "${A.craft}" unknown` }
}
if (A.stage === 'directions') return await directions()
if (SCREENS.length < 2) return await loop(null)
const results = await parallel(SCREENS.map((s) => () => loop(s)))
const screens = results.map((r, i) => ({ screen: SCREENS[i], ...r }))
return { passed: screens.every((s) => s.passed), screens }
