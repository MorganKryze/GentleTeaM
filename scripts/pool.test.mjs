#!/usr/bin/env node
// Checks scripts/pool.mjs: pool keeps the items' order and never has more than `jobs` pending;
// run gives a child's exit code and output, cuts a child at its timeout and never rejects. Its
// only children are `node -e` scripts. Run by scripts/validate.mjs. No dependencies.
import { join } from 'node:path'
import { pool, run } from './pool.mjs'

const errors = []
const wait = (ms) => new Promise((r) => setTimeout(r, ms))

// order: the second item ends first, the results still follow the items.
const got = await pool([60, 5, 30], 3, async (ms, i) => { await wait(ms); return i })
if (got.join() !== '0,1,2') errors.push(`order: results ${got.join()}, want 0,1,2`)

// at most: never more than `jobs` pending, each item called once.
for (const n of [2, 5]) {
  let pending = 0, peak = 0, calls = 0
  await pool(Array.from({ length: n }, (_, i) => i), 2, async () => {
    calls++
    peak = Math.max(peak, ++pending)
    await wait(20)
    pending--
  })
  if (peak > 2) errors.push(`at most: ${n} items had ${peak} pending, want at most 2`)
  if (calls !== n) errors.push(`at most: ${n} items called ${calls} times`)
}

// exit: a child's code and its output, stdout then stderr.
const exit = await run('-e', ['console.log("out"); console.error("err"); process.exit(3)'])
if (exit.code !== 3) errors.push(`exit: code ${exit.code}, want 3`)
if (exit.out !== 'out\nerr\n') errors.push(`exit: output ${JSON.stringify(exit.out)}`)

// timed out: a child sleeping 5 s with a 300 ms bound is cut well before.
const start = Date.now()
const slow = await run('-e', ['setTimeout(() => {}, 5000)'], { timeout: 300 })
if (!slow.timedOut || Date.now() - start > 2000 || slow.code === 0) errors.push(`timed out: ${JSON.stringify(slow)} after ${Date.now() - start} ms`)

// never rejects: a missing file is code 1.
try {
  const missing = await run(join(import.meta.dirname, 'no-such-file.mjs'))
  if (missing.code !== 1) errors.push(`never rejects: a missing file gave code ${missing.code}`)
} catch (e) { errors.push(`never rejects: rejected with ${e.message}`) }

if (errors.length) { console.error(errors.join('\n')); process.exit(1) }
console.log('pool: order, at most jobs pending, exit, timed out, never rejects OK')
