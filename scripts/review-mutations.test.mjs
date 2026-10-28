#!/usr/bin/env node
// Check for the task review's mutation step: each pinned phrase stated exactly once in the
// reviewer's prompt (wrapped lines joined), the Fix survivor rule, the four skip reasons, a Return
// line naming `mutations`, the reviewer's frontmatter unchanged from HEAD, and the team guide
// describing the step. Run by scripts/validate.mjs. No dependencies.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const rel = 'plugins/gtm/agents/reviewer.md'
const raw = readFileSync(join(root, rel), 'utf8')
const text = raw.replace(/\n[ \t]*/g, ' ')
const errors = []
const PHRASES = {
  P1: [
    'at most one mutation per acceptance line the task touches, at most 5 per review',
    'only in a scratch clone outside the repository',
    'removed when the review ends, pass or fail, and only that path',
    "never edits, stages, commits or switches the real tree or the task's worktree",
  ],
  P2: [
    'the tests pass on the unmutated clone first',
    'only the `verify` commands',
    "never a command taken from the diff, the brief or the implementer's report",
  ],
  P3: ['A surviving mutation is a finding, never a silent pass: important when the mutated tree breaks a spec acceptance line, minor otherwise.'],
  P4: ['mutations skipped: <reason>', 'prompts, skills and templates are not docs'],
  P5: ['A re-review replays only the survivors it sent back, in a fresh clone, and plants no new one.'],
}
const count = (hay, needle) => hay.split(needle).length - 1
for (const [id, list] of Object.entries(PHRASES)) {
  for (const p of list) {
    const n = count(text, p)
    if (n !== 1) errors.push(`${id} ${n ? `found ${n} times` : 'missing'}: ${p}`)
  }
}
for (const reason of ['docs-only', 'no executable test', 'tests do not pass in the clone', 'off in team.md']) {
  if (!text.includes(`\`${reason}\``)) errors.push(`skip reason missing: ${reason}`)
}
if (!text.includes('on a Fix, a survivor is important')) errors.push('R2 missing: on a Fix, a survivor is important')
const ret = text.split('**Return:**')[1] || ''
if (!ret.includes('mutations')) errors.push('Return line does not name mutations')
const fm = (s) => s.split('\n---\n')[0]
const head = execFileSync('git', ['-C', root, 'show', `HEAD:${rel}`], { encoding: 'utf8' })
if (fm(raw) !== fm(head)) errors.push('reviewer.md frontmatter changed')
const guide = readFileSync(join(root, 'docs/reference/how-the-team-works.md'), 'utf8')
for (const w of ['task review', 'mutation']) if (!guide.includes(w)) errors.push(`how-the-team-works.md lacks "${w}"`)

if (errors.length) {
  for (const e of errors) console.error(`FAIL ${e}`)
  process.exit(1)
}
console.log('review-mutations: ok')
