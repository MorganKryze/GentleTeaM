// UI gate: every route at every width, in light and dark, checked for serious or critical axe
// findings, horizontal page overflow, visible controls under 44 × 44 CSS px, and a dark theme that
// differs from the light one. Each failure names the route, width, theme and selector.
// Needs @playwright/test and @axe-core/playwright (dev dependencies). When nothing answers at
// baseURL, `start` is run through the shell and stopped after the run; no start command, or a
// missing package, fails the run: it never skips. No screenshot diff, no clock, no random input.
// Fill the block below; `exceptions` take a selector, the check they lift and the reason.
export const UI = {
  baseURL: 'http://127.0.0.1:3000',
  start: '',
  routes: ['/'],
  widths: [360, 390, 1280],
  themes: ['light', 'dark'],
  exceptions: [],
}

import { spawn } from 'node:child_process'
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe.configure({ mode: 'default', retries: 0 })

const CONTROLS = 'a, button, input, select, textarea, summary, [role=button], [tabindex]:not([tabindex="-1"])'
const POLLS = 60
let server = null

const answers = async () => {
  try { await fetch(UI.baseURL); return true } catch { return false }
}
const pause = (ms) => new Promise((done) => setTimeout(done, ms))

test.beforeAll(async () => {
  test.setTimeout((POLLS + 30) * 1000)
  if (await answers()) return
  if (!UI.start) throw new Error(`nothing answers at ${UI.baseURL} and UI.start is empty`)
  server = spawn(UI.start, { shell: true, stdio: 'ignore', detached: process.platform !== 'win32' })
  for (let i = 0; i < POLLS; i++) {
    if (await answers()) return
    await pause(1000)
  }
  throw new Error(`nothing answers at ${UI.baseURL} after ${POLLS} s of \`${UI.start}\``)
})

test.afterAll(async () => {
  if (!server) return
  try {
    if (process.platform === 'win32') server.kill()
    else process.kill(-server.pid, 'SIGTERM')
  } catch {}
  server = null
})

// Runs in the page: the colours the dark check compares.
function colours() {
  return ['html', 'body'].map((tag) => {
    const s = getComputedStyle(document.querySelector(tag))
    return `${s.backgroundColor} ${s.color}`
  }).join(' | ')
}

// Runs in the page: the selectors of what overflows and of the controls under 44 × 44.
function measure({ controls, exceptions }) {
  const lifted = (el, check) => exceptions.some((e) => e.check === check && el.closest(e.selector))
  const path = (el) => {
    if (el.id) return `#${CSS.escape(el.id)}`
    const parts = []
    for (let e = el; e && e.nodeType === 1 && e !== document.documentElement; e = e.parentElement) {
      if (e.id) { parts.unshift(`#${CSS.escape(e.id)}`); break }
      const same = [...e.parentElement.children].filter((c) => c.tagName === e.tagName)
      parts.unshift(same.length > 1 ? `${e.localName}:nth-of-type(${same.indexOf(e) + 1})` : e.localName)
    }
    return parts.join(' > ')
  }
  const scrollsItself = (el) => {
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(e).overflowX)) return true
    }
    return false
  }
  const width = window.innerWidth
  const overflow = []
  if (document.documentElement.scrollWidth > width) {
    const out = [...document.body.querySelectorAll('*')].filter((el) =>
      el.getBoundingClientRect().right > width + 0.5 && !scrollsItself(el) && !lifted(el, 'overflow'))
    const leaves = out.filter((el) => !out.some((o) => o !== el && el.contains(o)))
    overflow.push(...leaves.map(path))
  }
  const visible = (el) => {
    const s = getComputedStyle(el)
    return el.getClientRects().length > 0 && s.visibility !== 'hidden' && s.display !== 'none'
  }
  const inText = (el) => el.localName === 'a' && getComputedStyle(el).display === 'inline' &&
    el.parentElement.textContent.trim() !== el.textContent.trim()
  const big = (el) => { const r = el.getBoundingClientRect(); return r.width >= 44 && r.height >= 44 }
  const targets = []
  for (const el of document.querySelectorAll(controls)) {
    if (!visible(el) || inText(el) || lifted(el, 'target')) continue
    const around = el.parentElement && el.parentElement.closest('label, a, button')
    if (big(el) || (around && big(around))) continue
    const r = el.getBoundingClientRect()
    targets.push({ selector: path(el), size: `${Math.round(r.width)} × ${Math.round(r.height)}` })
  }
  return { overflow, targets }
}

for (const route of UI.routes) {
  for (const width of UI.widths) {
    for (const theme of UI.themes) {
      test(`${route} ${width} ${theme}`, async ({ page }) => {
        const where = `${route} · ${width}px · ${theme}`
        const failures = []
        await page.setViewportSize({ width, height: 800 })
        const url = new URL(route, UI.baseURL).href
        if (theme === 'dark') {
          await page.emulateMedia({ colorScheme: 'light' })
          await page.goto(url)
          const light = await page.evaluate(colours)
          await page.emulateMedia({ colorScheme: 'dark' })
          if (light === await page.evaluate(colours)) {
            failures.push(`${where} · html, body: dark theme not applied`)
          }
        } else {
          await page.emulateMedia({ colorScheme: theme })
          await page.goto(url)
        }
        const axe = await new AxeBuilder({ page }).analyze()
        for (const v of axe.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
          for (const node of v.nodes) failures.push(`${where} · ${node.target.join(' ')}: axe ${v.id} (${v.impact})`)
        }
        const found = await page.evaluate(measure, { controls: CONTROLS, exceptions: UI.exceptions })
        for (const s of found.overflow) failures.push(`${where} · ${s}: overflows the page horizontally`)
        for (const t of found.targets) {
          failures.push(`${where} · ${t.selector}: target under 44 × 44 CSS px (${t.size})`)
        }
        expect(failures, failures.join('\n')).toEqual([])
      })
    }
  }
}
