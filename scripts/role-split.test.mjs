#!/usr/bin/env node
// Fixture test for plugins/gtm/scripts/role-split.mjs. Each scenario under
// scripts/fixtures/role-split/ holds run folders, args.json (folders relative to the scenario)
// and expected.json ({ exit, stdout }). Three more scenarios are built here, since git keeps no
// link to a planted file: an agent file that is a link, a run folder that is a link, an agent
// file that is a folder. In every scenario the planted secret is absent from stdout and stderr,
// and stdout is role names and numbers only. Run by scripts/validate.mjs. No dependencies.
import { readFileSync, readdirSync, mkdtempSync, cpSync, rmSync, symlinkSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'

const root = new URL('..', import.meta.url).pathname
const fixtures = join(root, 'scripts/fixtures/role-split')
const script = join(root, 'plugins/gtm/scripts/role-split.mjs')
const SECRET = 'planted-secret-7f3a'
const ROLE = '[a-z0-9-]+(?::[a-z0-9-]+)?'
const TEXT = new RegExp(`^roles (?:\\?|${ROLE} \\d+%(?:, ${ROLE} \\d+%)*)$`)
const errors = []

function split(cwd, args) {
  try {
    const stdout = execFileSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return { exit: 0, stdout, stderr: '' }
  } catch (e) { return { exit: e.status, stdout: e.stdout || '', stderr: e.stderr || '' } }
}

function numbersOnly(stdout) {
  const { roles, total, ...rest } = JSON.parse(stdout)
  const keys = (o, k) => Object.keys(o).sort().join() === k
  return !Object.keys(rest).length && keys(total, 'agents,seconds,tokens') && Number.isSafeInteger(total.tokens)
    && roles.every((r) => keys(r, 'agents,role,seconds,share,tokens') && new RegExp(`^${ROLE}$`).test(r.role)
      && [r.agents, r.seconds, r.tokens, r.share].every(Number.isSafeInteger))
}

function check(name, got, expected) {
  const out = got.stdout.replace(/\n$/, '')
  if (got.exit !== expected.exit || out !== expected.stdout) {
    errors.push(`${name}: expected exit ${expected.exit} "${expected.stdout}", got exit ${got.exit} "${out}"`)
  }
  if ((got.stdout + got.stderr).includes(SECRET)) errors.push(`${name}: the planted secret reached the output`)
  if (got.exit === 0 && !(out.startsWith('{') ? numbersOnly(out) : TEXT.test(out))) errors.push(`${name}: output is not role names and numbers only`)
  if (got.exit !== 0 && out !== 'roles ?') errors.push(`${name}: a failure printed more than "roles ?"`)
}

const names = readdirSync(fixtures, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
for (const name of names) {
  const dir = join(fixtures, name)
  const expected = JSON.parse(readFileSync(join(dir, 'expected.json'), 'utf8'))
  check(name, split(dir, JSON.parse(readFileSync(join(dir, 'args.json'), 'utf8'))), expected)
}

const tmp = mkdtempSync(join(tmpdir(), 'gtm-role-split-'))
try {
  const planted = join(tmp, 'planted.jsonl')
  writeFileSync(planted, readFileSync(join(fixtures, 'one-run/run-a/agent-aefece30d91ad34a2.jsonl'), 'utf8').replace('Fixture prompt.', SECRET))
  const copy = (to) => { cpSync(join(fixtures, 'one-run/run-a'), join(tmp, to), { recursive: true }); return join(tmp, to) }
  const linkFile = copy('link-file')
  rmSync(join(linkFile, 'agent-aefece30d91ad34a2.jsonl'))
  symlinkSync(planted, join(linkFile, 'agent-aefece30d91ad34a2.jsonl'))
  check('link-file', split(tmp, ['link-file']), { exit: 1, stdout: 'roles ?' })
  symlinkSync(copy('real-folder'), join(tmp, 'link-folder'))
  check('link-folder', split(tmp, ['link-folder']), { exit: 1, stdout: 'roles ?' })
  const folderEntry = copy('folder-entry')
  rmSync(join(folderEntry, 'agent-aefece30d91ad34a2.jsonl'))
  mkdirSync(join(folderEntry, 'agent-aefece30d91ad34a2.jsonl'))
  check('folder-entry', split(tmp, ['folder-entry']), { exit: 1, stdout: 'roles ?' })
} finally { rmSync(tmp, { recursive: true, force: true }) }

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log(`role split: ${names.length + 3} scenarios OK`)
