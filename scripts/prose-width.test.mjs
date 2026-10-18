#!/usr/bin/env node
// Checks prose width: no line of a tracked Markdown file runs past 100 characters, outside YAML
// frontmatter, fenced code blocks and table rows (scripts/fixtures/ and dot folders are skipped).
// Files that already had long lines are frozen at their count in FROZEN, which may only go down:
// a file over its count fails, a file under it fails until its number is lowered, and a mapped
// file that no longer exists fails. Run by scripts/validate.mjs. No dependencies.
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const LIMIT = 100
const FROZEN = Object.freeze({
  'docs/index.md': 1,
  'docs/reference/gtm-folder.md': 13,
  'docs/reference/settings.md': 3,
  'docs/tutorial/first-feature.md': 9,
  'docs/why/credits.md': 2,
  'docs/why/positions.md': 8,
  'plugins/gtm/agents/analyst.md': 11,
  'plugins/gtm/agents/architect.md': 13,
  'plugins/gtm/agents/data-reviewer.md': 7,
  'plugins/gtm/agents/design-critic.md': 10,
  'plugins/gtm/agents/designer.md': 8,
  'plugins/gtm/agents/final-reviewer.md': 8,
  'plugins/gtm/agents/implementer.md': 7,
  'plugins/gtm/agents/release-qa.md': 8,
  'plugins/gtm/agents/reviewer.md': 9,
  'plugins/gtm/agents/security-reviewer.md': 9,
  'plugins/gtm/agents/ux-qa.md': 6,
  'plugins/gtm/skills/brief-me/SKILL.md': 1,
  'plugins/gtm/skills/deliver/SKILL.md': 1,
  'plugins/gtm/skills/design/SKILL.md': 2,
  'plugins/gtm/skills/gtm/SKILL.md': 4,
  'plugins/gtm/skills/plan/SKILL.md': 1,
  'plugins/gtm/skills/retro/SKILL.md': 2,
  'plugins/gtm/skills/ship/SKILL.md': 4,
  'plugins/gtm/skills/spec/SKILL.md': 1,
  'plugins/gtm/templates/brief.md': 1,
  'plugins/gtm/templates/briefing.md': 1,
  'plugins/gtm/templates/guidelines/code.md': 1,
  'plugins/gtm/templates/guidelines/design.md': 2,
  'plugins/gtm/templates/guidelines/docs.md': 2,
  'plugins/gtm/templates/guidelines/git.md': 2,
  'plugins/gtm/templates/guidelines/i18n.md': 1,
  'plugins/gtm/templates/team.md': 9,
  'README.md': 4,
})

const errors = []
const fail = (msg) => errors.push(msg)

const files = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '-z', '*.md'], { cwd: root, encoding: 'utf8' })
  .split('\0')
  .filter((f) => f && !f.startsWith('scripts/fixtures/') && !f.split('/').some((part) => part.startsWith('.')))
  .filter((f) => existsSync(join(root, f)))

const longLines = (text) => {
  const lines = text.split(/\r?\n/)
  const found = []
  let i = 0
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1)
    if (end > 0) i = end + 1
  }
  let fenced = false
  for (; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*```/.test(line)) { fenced = !fenced; continue }
    if (fenced || /^\s*\|/.test(line)) continue
    const n = [...line].length
    if (n > LIMIT) found.push({ line: i + 1, n })
  }
  return found
}

for (const file of files) {
  const found = longLines(readFileSync(join(root, file), 'utf8'))
  const allowed = FROZEN[file] ?? 0
  if (found.length > allowed) {
    for (const { line, n } of found) fail(`${file}:${line} is ${n} characters (at most ${LIMIT})`)
  } else if (found.length < allowed) {
    fail(`${file}: ${found.length} long lines, frozen at ${allowed}: lower its number in scripts/prose-width.test.mjs`)
  }
}
for (const file of Object.keys(FROZEN)) {
  if (!files.includes(file)) fail(`${file}: in the prose-width map but no longer tracked: remove it`)
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log(`prose-width: ${files.length} Markdown files within ${LIMIT} characters or their frozen count`)
