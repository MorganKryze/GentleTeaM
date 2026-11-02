#!/usr/bin/env node
// Turns a task brief's `Sheets:` line into the sheets a review is told to read, as
// templates/sheets/index.md requires: a name counts only with a row there, a path sits beside the
// index, at most 2 per brief, each once. A name with no row counts as missing and is dropped
// without a word; no line, or `none`, prints []. Prints JSON, [{ "name", "path" }, ...], and never
// a word of the brief. Exit 2 on usage or an unread file, nothing on stdout.
// Usage: sheet-paths.mjs --brief <file>. No dependencies.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const MAX = 2 // the index's "at most 2 sheets per task"
const ROW = /^\| `([a-z0-9-]+)` \| `\1\.md` \| \S.* \|$/gm // sheets.test.mjs freezes this form
const LINE = /^(?:\*\*)?Sheets:(?:\*\*)?(.*)$/m // the plan template's form, or plain

const [flag, brief, ...rest] = process.argv.slice(2)
if (flag !== '--brief' || !brief || rest.length) {
  console.error('usage: sheet-paths.mjs --brief <file>')
  process.exit(2)
}
const dir = fileURLToPath(new URL('../templates/sheets/', import.meta.url))
function read(file) {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    console.error(`sheet-paths: cannot read ${file}`)
    process.exit(2)
  }
}
const rows = new Set([...read(join(dir, 'index.md')).matchAll(ROW)].map((m) => m[1]))
const named = (LINE.exec(read(brief))?.[1] ?? '').split(',').map((s) => s.replaceAll('`', '').trim())
const names = [...new Set(named)].filter((n) => rows.has(n)).slice(0, MAX)
console.log(JSON.stringify(names.map((name) => ({ name, path: join(dir, `${name}.md`) }))))
