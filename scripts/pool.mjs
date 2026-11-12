// Runs work a few at a time for the gate's tests: `pool` calls a function on each item with at
// most `jobs` pending and keeps the items' order; `run` runs a Node script as a child and always
// resolves to how it ended and what it printed. Used by scripts/validate.mjs and the slow tests.
// No dependencies.
import { spawn } from 'node:child_process'
import { availableParallelism } from 'node:os'

export const JOBS = Math.max(1, Math.min(4, availableParallelism()))

// Started in the items' order; the results land at their item's place, whatever ends first.
export async function pool(items, jobs, fn) {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, Math.min(jobs, items.length)) }, worker))
  return results
}

// `out` is the whole stdout then stderr. A timeout kills with SIGTERM, as execFileSync does. A
// spawn error is code 1 with its message, so the promise never rejects; a signal leaves code null.
export function run(file, args = [], { cwd, timeout } = {}) {
  return new Promise((resolve) => {
    let stdout = '', stderr = '', timedOut = false, timer
    let child
    try { child = spawn(process.execPath, [file, ...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'] }) }
    catch (e) { return resolve({ code: 1, signal: null, timedOut, out: e.message }) }
    child.stdout.setEncoding('utf8').on('data', (d) => { stdout += d })
    child.stderr.setEncoding('utf8').on('data', (d) => { stderr += d })
    if (timeout) timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM') }, timeout)
    child.on('error', (e) => { clearTimeout(timer); resolve({ code: 1, signal: null, timedOut, out: `${stdout}${stderr}${e.message}` }) })
    child.on('close', (code, signal) => { clearTimeout(timer); resolve({ code, signal, timedOut, out: `${stdout}${stderr}` }) })
  })
}
