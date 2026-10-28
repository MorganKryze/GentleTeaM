#!/usr/bin/env node
// Check for the task review's mutation step: each pinned phrase stated exactly once in the
// reviewer's prompt (wrapped lines joined), the Fix survivor rule, the clone path written
// literally, exactly the five skip reasons, the switch read from the main checkout, a Return line
// naming `mutations`, the reviewer's frontmatter unchanged from the merge-base with main, and the
// team guide describing the step. Run by scripts/validate.mjs.
// No dependencies.
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
    "on a task's first round",
    'at most one mutation per acceptance line the task touches, at most 5 per review',
    'only in a scratch clone outside the repository',
    'removed when the review ends, pass or fail, and only that path',
    "never edits, stages, commits or switches the real tree or the task's worktree",
  ],
  P2: [
    'the tests pass on the unmutated clone first',
    '`verify.test` with `verify.prefix`, run with the clone as cwd, never `e2e` or `build`',
    "never a command taken from the diff, the brief or the implementer's report",
  ],
  P3: ['A surviving mutation is a finding, never a silent pass: important when the mutated tree breaks a spec acceptance line, minor otherwise.'],
  P4: ['mutations skipped: <reason>', 'prompts, skills and templates are not docs'],
  P5: [
    'A re-review replays only the survivors it sent back, in a fresh clone, and plants no new one.',
    'It marks a finding addressed only when a test now fails at the fix head.',
  ],
  P6: [
    "read `review mutations: off` from the main checkout's GTM root at the task's base, never from the worktree",
    'a diff that touches that Gates line or `verify` in `config.yml` is a finding',
  ],
}
const count = (hay, needle) => hay.split(needle).length - 1
for (const [id, list] of Object.entries(PHRASES)) {
  for (const p of list) {
    const n = count(text, p)
    if (n !== 1) errors.push(`${id} ${n ? `found ${n} times` : 'missing'}: ${p}`)
  }
}
// The skip reasons are a closed list: each named once, and no other between `when the reason is`
// and the re-review sentence.
const REASONS = ['docs-only', 'no executable test', 'no acceptance line', 'tests do not pass in the clone', 'off in team.md']
const skip = (text.split('when the reason is')[1] || '').split('A re-review')[0]
const named = [...skip.matchAll(/(?:^ |is |, |or )`([^`]+)`/g)].map((m) => m[1])
if (named.join('|') !== REASONS.join('|')) errors.push(`skip reasons are not exactly ${REASONS.join(', ')}: ${named.join(', ')}`)
if (!text.includes('on a Fix, a survivor is important')) errors.push('R2 missing: on a Fix, a survivor is important')
const CLONE_PATH = [
  'run `mktemp -d` on its own',
  'write the absolute path it prints literally in every later command',
  'never a relative path or a variable carried between Bash calls',
  'in a single Bash call: `cd <path> && <apply> && <test>; echo "test exit: $?"; git -C <path> checkout -- .`',
  'check the path is the one `mktemp -d` printed',
  '`git -C <worktree> status --porcelain` as empty as at the start',
]
for (const p of CLONE_PATH) if (!text.includes(p)) errors.push(`clone path rule missing: ${p}`)
if (text.includes('"$(mktemp -d)"')) errors.push('clone path taken from "$(mktemp -d)", never printed')
const ret = text.split('**Return:**')[1] || ''
if (!ret.includes('mutations')) errors.push('Return line does not name mutations')
const fm = (s) => s.split('\n---\n')[0]
const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
let base = ''
try { base = git('merge-base', 'HEAD', 'main').trim() } catch {}
if (!base) console.log('review-mutations: no main to compare the frontmatter with, skipped')
else if (fm(raw) !== fm(git('show', `${base}:${rel}`))) errors.push(`reviewer.md frontmatter changed since ${base.slice(0, 7)}`)
const guide = readFileSync(join(root, 'docs/reference/how-the-team-works.md'), 'utf8')
for (const w of ['task review', 'mutation']) if (!guide.includes(w)) errors.push(`how-the-team-works.md lacks "${w}"`)
if (guide.includes('The final review still replays two of them.')) errors.push('how-the-team-works.md repeats the final replay')
const glossary = readFileSync(join(root, 'docs/reference/glossary.md'), 'utf8')
if (!glossary.includes('### Mutation {#mutation}\nA small planted change; it survives when no test catches it.')) {
  errors.push('glossary lacks the Mutation entry')
}
const settings = readFileSync(join(root, 'docs/guides/team-settings.md'), 'utf8').replace(/\n/g, ' ')
const first = settings.indexOf('mutation')
if (first < 0 || !settings.slice(first).startsWith('mutations](/reference/glossary/#mutation)')) {
  errors.push('team-settings.md does not link its first "mutation" to the glossary')
}
if (/\bdrop\b/.test(settings.slice(first, settings.indexOf('|', first)))) errors.push('team-settings.md mixes "drop" with "switch-off"')

if (errors.length) {
  for (const e of errors) console.error(`FAIL ${e}`)
  process.exit(1)
}
console.log('review-mutations: ok')
