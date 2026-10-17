#!/usr/bin/env node
// Fixture test for plugins/gtm/templates/ui-gate.spec.mjs. Always checks the template's syntax.
// Then resolves @playwright/test and @axe-core/playwright from PLAYWRIGHT_PATH (a folder whose
// node_modules hold them), else from the repository; neither: prints a skip line and exits 0.
// Otherwise serves scripts/fixtures/ui-gate/ on 127.0.0.1, runs the template once per page with a
// UI block naming it, checks each verdict, and removes its temp folder. No dependencies.
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { createRequire } from 'node:module'
import { spawnSync, execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createServer } from 'node:http'

const root = new URL('..', import.meta.url).pathname
const template = join(root, 'plugins/gtm/templates/ui-gate.spec.mjs')
const fixtures = join(root, 'scripts/fixtures/ui-gate')
const errors = []
let cases = {}

const check = spawnSync(process.execPath, ['--check', template], { encoding: 'utf8' })
if (check.status !== 0) {
  console.error(`ui-gate: template syntax: ${(check.stderr || '').trim() || 'node --check failed'}`)
  process.exit(1)
}

// Every failure line the template writes must show its selector to the check below, even with
// spaces or colons in it (`html, body`, `main > a:nth-of-type(2)`). Runs without Playwright.
const namesSelector = (message) => / · (?:light|dark) · \S.*?: \S/.test(message)
for (const [, line] of readFileSync(template, 'utf8').matchAll(/failures\.push\(`(\$\{where\} · [^`]*)`/g)) {
  const sample = line.replace('${where}', '/a.html · 360px · dark').replace(/\$\{[^}]*\}/g, 'main > a:nth-of-type(2)')
  if (!namesSelector(sample)) errors.push(`template: "${line}" hides its selector from the check`)
}

function packageDir(name) {
  const from = process.env.PLAYWRIGHT_PATH ? join(process.env.PLAYWRIGHT_PATH, 'x.js') : join(root, 'x.js')
  const paths = createRequire(from).resolve.paths(name) || []
  const hit = paths.find((p) => existsSync(join(p, name, 'package.json')))
  return hit ? join(hit, name) : null
}
const pw = packageDir('@playwright/test')
const axe = packageDir('@axe-core/playwright')
if (errors.length) {
  for (const e of errors) console.error(`ui-gate: ${e}`)
  process.exit(1)
}
if (!pw || !axe) {
  console.log('ui-gate: skipped, Playwright not found')
  process.exit(0)
}

const types = { '.html': 'text/html; charset=utf-8' }
function serve(dir) {
  return new Promise((done) => {
    const server = createServer((req, res) => {
      let name = ''
      try { name = decodeURIComponent(new URL(req.url, 'http://x').pathname).slice(1) } catch {}
      if (!/^[a-z0-9-]+\.html$/.test(name) || !existsSync(join(dir, name))) {
        res.writeHead(404).end('not found')
        return
      }
      res.writeHead(200, { 'content-type': types['.html'] }).end(readFileSync(join(dir, name)))
    })
    server.listen(0, '127.0.0.1', () => done(server))
  })
}
const freePort = () => new Promise((done) => {
  const s = createServer().listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => done(p)) })
})
const answers = async (url) => { try { await fetch(url); return true } catch { return false } }

const work = mkdtempSync(join(tmpdir(), 'ui-gate-'))
const started = process.hrtime.bigint()
const server = await serve(fixtures)
const base = `http://127.0.0.1:${server.address().port}`
const source = readFileSync(template, 'utf8')
const block = /^export const UI = \{[\s\S]*?^\}$/m
if (!block.test(source)) errors.push('template: no top `export const UI = { … }` block ending in a lone `}`')

try {
  for (const [name, dir] of [['@playwright/test', pw], ['@axe-core/playwright', axe]]) {
    mkdirSync(join(work, 'node_modules', dirname(name)), { recursive: true })
    symlinkSync(dir, join(work, 'node_modules', name), 'dir')
  }
  writeFileSync(join(work, 'serve.mjs'), [
    "import { createServer } from 'node:http'",
    "import { readFileSync } from 'node:fs'",
    `const page = readFileSync(${JSON.stringify(join(fixtures, 'clean.html'))})`,
    "createServer((q, r) => r.writeHead(200, { 'content-type': 'text/html' }).end(page))",
    "  .listen(Number(process.argv[2]), '127.0.0.1')",
  ].join('\n'))

  // Async: the fixture server answers from this process while the runner works.
  const run = async (label, ui) => {
    const dir = join(work, label)
    mkdirSync(dir)
    writeFileSync(join(dir, 'ui-gate.spec.mjs'), source.replace(block, `export const UI = ${JSON.stringify(ui, null, 2)}`))
    writeFileSync(join(dir, 'playwright.config.mjs'),
      `export default { testDir: '.', workers: 1, reporter: [['json', { outputFile: 'report.json' }]] }\n`)
    await promisify(execFile)(process.execPath, [join(pw, 'cli.js'), 'test', '--config', join(dir, 'playwright.config.mjs')],
      { cwd: dir, timeout: 120000 }).catch(() => {})
    const out = { load: [], tests: {} }
    let report
    try { report = JSON.parse(readFileSync(join(dir, 'report.json'), 'utf8')) } catch { out.load.push('no report'); return out }
    for (const e of report.errors || []) out.load.push(e.message || String(e))
    const walk = (s) => {
      for (const spec of s.specs || []) {
        const r = spec.tests?.[0]?.results?.at(-1)
        out.tests[spec.title] = { status: r?.status, message: (r?.errors || []).map((e) => e.message).join('\n') }
      }
      for (const c of s.suites || []) walk(c)
    }
    for (const s of report.suites || []) walk(s)
    return out
  }
  const page = (name) => ({ baseURL: base, start: '', routes: [`/${name}.html`], widths: [360, 1280], themes: ['light', 'dark'], exceptions: [] })
  const titles = (name) => [360, 1280].flatMap((w) => ['light', 'dark'].map((t) => `/${name}.html ${w} ${t}`))
  // fail(title) = true when that route × width × theme must fail.
  cases = {
    clean: () => false,
    'target-43': () => true,
    'target-44': () => false,
    'axe-moderate': () => false,
    'axe-serious': () => true,
    'overflow-360': (t) => / 360 /.test(t),
    'dark-contrast': (t) => / dark$/.test(t),
    'dark-same': (t) => / dark$/.test(t),
  }
  for (const [name, fails] of Object.entries(cases)) {
    const out = await run(name, page(name))
    if (out.load.length) { errors.push(`${name}: did not load: ${out.load[0].split('\n')[0]}`); continue }
    for (const title of titles(name)) {
      const got = out.tests[title]
      if (!got) { errors.push(`${name}: no test titled "${title}"`); continue }
      const want = fails(title) ? 'failed' : 'passed'
      if (got.status !== want) errors.push(`${name}: "${title}" ${got.status}, expected ${want}`)
      if (want === 'failed') {
        const [route, width, theme] = title.split(' ')
        for (const part of [route, `${width}px`, theme]) {
          if (!got.message.includes(part)) errors.push(`${name}: "${title}" failure does not name ${part}`)
        }
        if (!namesSelector(got.message)) errors.push(`${name}: "${title}" failure names no selector`)
      }
    }
    if (name === 'dark-same' && !out.tests['/dark-same.html 360 dark']?.message.includes('dark theme not applied')) {
      errors.push('dark-same: failure does not say "dark theme not applied"')
    }
  }

  // A malformed escape in the path is a 404, never a crash of the fixture server.
  const bad = await fetch(`${base}/%E0%A4%A.html`).then((r) => r.status, () => 'no answer')
  if (bad !== 404) errors.push(`server: a malformed escape got ${bad}, expected 404`)

  // Nothing answers at baseURL: the start command is run, then stopped.
  const port = await freePort()
  const url = `http://127.0.0.1:${port}`
  const startCmd = `"${process.execPath}" "${join(work, 'serve.mjs')}" ${port}`
  const started1 = await run('start', { ...page('clean'), baseURL: url, start: startCmd, routes: ['/'] })
  const startPassed = Object.values(started1.tests)
  if (started1.load.length || !startPassed.length || startPassed.some((t) => t.status !== 'passed')) {
    errors.push(`start: expected every test to pass after the start command, got ${JSON.stringify(started1)}`.slice(0, 300))
  }
  if (await answers(url)) errors.push('start: the start command still answers after the run')

  // Nothing answers and no start command: fail, never skip.
  const port2 = await freePort()
  const none = await run('no-start', { ...page('clean'), baseURL: `http://127.0.0.1:${port2}`, routes: ['/'] })
  const noneTests = Object.values(none.tests)
  if (none.load.includes('no report')) errors.push('no-start: the runner wrote no report')
  else if (!none.load.length && (!noneTests.some((t) => t.status === 'failed') || noneTests.some((t) => t.status === 'passed'))) {
    errors.push(`no-start: expected a failure and no pass, got ${noneTests.map((t) => t.status).join(', ') || 'no test'}`)
  }
} finally {
  server.close()
  rmSync(work, { recursive: true, force: true })
}
if (existsSync(work)) errors.push('temp folder left behind')
const seconds = Number(process.hrtime.bigint() - started) / 1e9
if (seconds > 60) errors.push(`took ${seconds.toFixed(1)} s, over 60 s`)

if (errors.length) {
  console.error(`ui-gate: ${errors.length} failure(s)`)
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}
console.log(`ui-gate: ${Object.keys(cases).length + 2} runs passed in ${seconds.toFixed(1)} s`)
