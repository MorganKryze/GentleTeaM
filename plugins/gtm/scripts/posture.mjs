#!/usr/bin/env node
// Posture: reads a repository's CI/CD posture and prints each gap as `<id> <where>`, never a
// workflow's content or a secret. It reads the workflow files (.github/workflows,
// .forgejo/workflows) and the repository's own files, and, when the remote is GitHub and `gh`
// answers, the rules on each long-lived branch, through read-only `gh api` calls. It writes
// nothing. Gaps are findings, not failures: exit 0; a usage error exits 2. No dependencies.
//
// node posture.mjs [--json] [--branches <glob>,...] <repo>
// --branches adds long-lived branch patterns (`dev`, `release/*`) to the default branch.
// What `gh` cannot read is `rules.unknown` or `secrets.unknown`: check it by hand.
import { readdirSync, readFileSync, lstatSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const argv = process.argv.slice(2)
const usage = () => { console.error('usage: node posture.mjs [--json] [--branches <glob>,...] <repo>'); process.exit(2) }
const bi = argv.indexOf('--branches')
const rest = argv.filter((a, i) => !(bi >= 0 && i === bi + 1))
const flags = rest.filter((a) => a.startsWith('--'))
const pos = rest.filter((a) => !a.startsWith('--'))
if (pos.length !== 1 || flags.some((f) => !['--json', '--branches'].includes(f)) || new Set(flags).size !== flags.length) usage()
if (bi >= 0 && !/^[A-Za-z0-9._/*-]+(,[A-Za-z0-9._/*-]+)*$/.test(argv[bi + 1] || '')) usage()
const repo = pos[0]
try { if (!lstatSync(repo).isDirectory()) usage() } catch { usage() }
const json = flags.includes('--json')
const patterns = bi >= 0 ? argv[bi + 1].split(',') : []

const gaps = []
const gap = (id, where = '') => gaps.push({ id, where })
const indent = (l) => l.match(/^ */)[0].length
const blankOrComment = (l) => /^\s*(#.*)?$/.test(l)
const uncomment = (l) => l.replace(/(^|\s)#.*$/, '')

// A top-level key's value, comments out: the rest of its line and the indented lines under it.
const topBlock = (lines, key) => {
  const head = new RegExp(`^["']?${key}["']?:`)
  const i = lines.findIndex((l) => head.test(l))
  if (i < 0) return null
  let end = i + 1
  while (end < lines.length && (blankOrComment(lines[end]) || /^\s/.test(lines[end]))) end++
  return lines.slice(i, end).map(uncomment).join('\n').replace(head, '')
}

// The workflow files, regular files only.
const workflows = []
for (const d of ['.github/workflows', '.forgejo/workflows']) {
  let names = []
  try { names = readdirSync(join(repo, d)) } catch { continue }
  for (const n of names.filter((n) => /\.ya?ml$/.test(n)).sort()) {
    const p = join(repo, d, n)
    try { if (lstatSync(p).isFile()) workflows.push({ file: `${d}/${n}`, text: readFileSync(p, 'utf8') }) } catch {}
  }
}
const all = workflows.map((w) => w.text).join('\n')

// The checks a pull request runs, by the name GitHub gives them; a name built from an expression
// cannot be read here and is left out.
const prJobs = []
for (const { file, text } of workflows) {
  const lines = text.split('\n')
  lines.forEach((l, i) => {
    const m = /^\s*(?:-\s+)?uses:\s*["']?([^\s"'#]+)/.exec(l)
    if (!m || m[1].startsWith('./')) return
    const ok = m[1].startsWith('docker://') ? /@sha256:[0-9a-f]{64}$/.test(m[1]) : /@[0-9a-f]{40}$/.test(m[1])
    if (!ok) gap('wf.unpinned', `${file}:${i + 1}`)
    if (!/^actions\/checkout@/.test(m[1])) return
    // This step's own lines: up to the next step or the next top-level key.
    let end = i + 1
    while (end < lines.length && !/^\s*-\s/.test(lines[end]) && !/^\S/.test(lines[end])) end++
    if (!lines.slice(i + 1, end).some((n) => /persist-credentials:\s*false\b/.test(uncomment(n)))) gap('wf.credentials', `${file}:${i + 1}`)
  })
  // Top-level permissions: missing, or any write, leaves the token wider than read.
  const perm = topBlock(lines, 'permissions')
  if (perm === null || /write/.test(perm)) gap('wf.permissions', file)
  const on = topBlock(lines, 'on') || ''
  if (/\bpull_request_target\b/.test(on) && /github\.event\.pull_request\.head\.(sha|ref)|github\.head_ref/.test(text)) gap('wf.prt-checkout', file)
  if (!/\bpull_request\b(?!_target)/.test(on)) continue
  const j = lines.findIndex((l) => /^jobs:/.test(l))
  let ind = null
  for (let k = j + 1; j >= 0 && k < lines.length; k++) {
    if (blankOrComment(lines[k])) continue
    if (/^\S/.test(lines[k])) break
    if (ind === null) ind = indent(lines[k])
    const key = indent(lines[k]) === ind && /^\s*([\w-]+):\s*(#.*)?$/.exec(lines[k])
    if (!key) continue
    let end = k + 1
    while (end < lines.length && (blankOrComment(lines[end]) || indent(lines[end]) > ind)) end++
    const body = lines.slice(k + 1, end).filter((b) => !blankOrComment(b))
    const prop = body.length ? indent(body[0]) : 0
    const named = body.find((b) => indent(b) === prop && /^\s*name:/.test(b))
    const name = named ? uncomment(named).replace(/^\s*name:\s*/, '').replace(/^["']|["']$/g, '').trim() : key[1]
    if (!name.includes('${{')) prJobs.push(name)
  }
}

const has = (re) => re.test(all) || ['.pre-commit-config.yaml', '.pre-commit-config.yml'].some((f) => existsSync(join(repo, f)) && re.test(readFileSync(join(repo, f), 'utf8')))
const any = (files) => files.some((f) => existsSync(join(repo, f)))
if (!any(['.github/dependabot.yml', '.github/dependabot.yaml', 'renovate.json', 'renovate.json5', '.renovaterc', '.renovaterc.json', '.github/renovate.json', '.github/renovate.json5'])) gap('deps.no-updates')
if (!has(/osv-scanner|govulncheck|pip-audit|npm audit|pnpm audit|yarn npm audit|cargo audit|cargo deny|trivy (fs|repo)|dependency-review-action|grype|snyk/)) gap('deps.no-scan')
if (!has(/codeql-action|opengrep|semgrep/)) gap('sast.none')
const image = any(['Dockerfile', 'Containerfile', 'docker/Dockerfile'])
const pkg = /npm publish|twine upload|cargo publish|goreleaser|uv publish|poetry publish/.test(all)
if (image && !/trivy image|trivy-action|grype|docker scout/.test(all)) gap('image.no-scan')
if ((image || pkg) && !/cosign|attest-build-provenance|sigstore/.test(all)) gap('release.no-signature')
if ((image || pkg) && !/syft|sbom/i.test(all)) gap('release.no-sbom')
const secretTool = has(/gitleaks|trufflehog/)

// The branch rules, through the owner's own `gh`, read-only; any failure reads as unknown.
const ghText = (path, ...more) => {
  try { return execFileSync('gh', ['api', path, ...more], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000 }) } catch { return undefined }
}
const gh = (path) => { const t = ghText(path); try { return t === undefined ? undefined : JSON.parse(t) } catch { return undefined } }
let remote = ''
try { remote = execFileSync('git', ['-C', repo, 'remote', 'get-url', 'origin'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch {}
const slug = /github\.com[:/]([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/.exec(remote)
const info = slug && gh(`repos/${slug[1]}/${slug[2]}`)
let rules = 'unknown'
if (!info || typeof info.default_branch !== 'string') {
  gap('rules.unknown', 'check by hand')
  if (!secretTool) gap('secrets.unknown', 'check by hand')
} else {
  rules = 'read'
  const base = `repos/${slug[1]}/${slug[2]}`
  // Push protection shows only to an admin; an absent field is unread, not off.
  const push = info.security_and_analysis?.secret_scanning_push_protection?.status
  if (!secretTool) push === undefined ? gap('secrets.unknown', 'check by hand') : push !== 'enabled' && gap('secrets.none')
  if (info.visibility === 'public' && !/scorecard-action/.test(all)) gap('public.no-scorecard')
  const glob = (p) => new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*')}$`)
  const names = [info.default_branch]
  if (patterns.length) {
    // --paginate prints one JSON array a page, side by side.
    const t = ghText(`${base}/branches`, '--paginate')
    let known
    try { known = t === undefined ? undefined : JSON.parse(`[${t.trim().replace(/\]\s*\[/g, '],[')}]`).flat().map((b) => b.name) } catch {}
    if (!Array.isArray(known)) for (const p of patterns) gap('rules.unknown', p)
    else for (const p of patterns) for (const n of known) if (glob(p).test(n) && !names.includes(n)) names.push(n)
  }
  for (const b of names) {
    const got = gh(`${base}/rules/branches/${encodeURIComponent(b)}`)
    if (!Array.isArray(got)) { gap('rules.unknown', b); continue }
    if (!got.length) {
      const br = gh(`${base}/branches/${encodeURIComponent(b)}`)
      gap(!br || typeof br.protected !== 'boolean' ? 'rules.unknown' : br.protected ? 'rules.legacy' : 'rules.none', b)
      continue
    }
    const types = new Set(got.map((r) => r.type))
    if (!types.has('non_fast_forward')) gap('rules.force-push', b)
    const req = got.filter((r) => r.type === 'required_status_checks').flatMap((r) => r.parameters?.required_status_checks || []).map((c) => c.context)
    // A matrix job reports `job (values)`, a reusable workflow's `job / inner`.
    const covered = (job) => req.some((c) => c === job || c.startsWith(`${job} (`) || c.startsWith(`${job} / `))
    if (!req.length) gap('rules.no-required-checks', b)
    else for (const job of prJobs) if (!covered(job)) gap('ci.not-required', `${b} ${job}`)
  }
}

if (json) console.log(JSON.stringify({ rules, gaps }))
else {
  console.log(`posture: ${gaps.length} gaps, rules ${rules}`)
  for (const g of gaps) console.log(g.where ? `${g.id} ${g.where}` : g.id)
}
