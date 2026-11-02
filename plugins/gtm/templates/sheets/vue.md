# Vue

> Helps a developer or reviewer build, test, secure, measure and upgrade Vue 3 applications: gates
> for what can be checked, method for the rest.

## When it applies
- Writing or reviewing Vue single-file components, composables, stores or routes.
- Setting up or tightening the checks a Vue project runs before merge.
- Rendering user-provided HTML, URLs or styles in a Vue view.
- Diagnosing slow page loads or slow updates in a Vue application.
- Rendering a Vue app on the server, building views for keyboard and assistive technology, or
  wiring error tracking.
- Upgrading Vue, its router or its build and test tooling, or trialling Vapor Mode.

## Method
1. Pin the ground: note the stable Vue line and its companions' versions, read release notes and
   migration guides before touching code, and run release candidates only in a scheduled canary.
2. Check statically first: a Vite-based build only transpiles, so run a type check that understands
   single-file components and templates, and the Vue lint rules at a chosen tier with every finding
   an error; where `verify` lacks them, propose them rather than adding them.
3. Write components with script setup and the Composition API; keep global state in the officially
   recommended store (Pinia); derive values in the parent so the props children receive stay stable;
   move logic that needs thorough tests into composables or plain functions.
4. Test through the public interface: for given props and slots, assert what the user sees and which
   events are emitted, acting as a user would; no private state, no mocked children, no snapshot
   alone. Test composables directly, or inside a host app when they use lifecycle hooks or
   injection. Use a real browser only where layout, styles or native events matter; keep end-to-end
   tests for multi-page flows on a production build.
5. Keep templates trusted: never build one from user input or mount the app over server HTML that
   holds user content; review every raw-HTML sink; have the backend sanitize URLs before storing
   them; let users set only specific style properties, or sandbox their content in an iframe.
6. Measure before optimizing: field LCP and INP for loading, a profiler trace for updates. Then
   apply the matching remedy: server or static rendering for content pages, lazy routes and async
   components, stable props, v-once or v-memo, computed values that return the previous object when
   nothing changed, shallow refs for large immutable data, virtualized lists, fewer wrapper
   components in long lists.
7. Adopt Vapor Mode only from a stable release, one isolated region at a time (script setup only; no
   Options API, global properties, instance access, or Suspense in Vapor-only trees), and compare
   with the baseline measures before widening.
8. Build every view for keyboard and assistive technology: native form elements, an explicit type on
   every button inside a form, a label tied to each input rather than a placeholder, headings nested
   in rank order, page regions marked with landmark elements, and a skip link at the top of the app;
   after each route change, move focus back to the top of the page, just before the skip link.
9. When rendering on the server, create the app, router and store afresh for every request and hand
   the store down by app-level provide, keeping no mutable state at module scope; set up timers and
   subscriptions, and touch browser-only globals, only in mounted hooks, which the server never
   runs; make the first client render match the server's (valid HTML nesting, no random values,
   timestamps turned into local time only after mount); escape the state serialized into the page.
10. Before the first release, wire the app-level error handler (app.config.errorHandler) to the
    team's error tracker: it receives uncaught errors from renders, event handlers, lifecycle hooks,
    setup and watchers, and in production its info argument is a short code to look up. Tabs still
    running the previous build will request lazy chunks a deploy may have removed: handle Vite's
    preload error event, for instance by reloading, and serve the HTML with Cache-Control no-cache
    so the reload fetches the new build.

## Reflexes
- Would this test still pass if the component's internals were rewritten, or compiled in Vapor Mode?
- By which path can user content reach v-html, innerHTML, an href or a style, and who sanitized it,
  where?
- Which prop change makes every item of this list re-render?
- If this code runs on the server, what outlives the request, and whose data could the next request
  see?

## What is measured
- Type errors in single-file components, templates included, when the project is typed: zero. The
  `verify` step runs the SFC-aware type check without emitting.
- Lint findings at the chosen tier of the Vue rules, all as errors: zero. The `verify` step lints
  the whole tree.
- Accessibility violations an automated checker finds at the WCAG version and level the team
  chooses, on each route and key component state: zero. The `verify` step runs the checker inside
  the real-browser tests and fails on any violation. Automated rules catch only part of WCAG, so
  results marked for manual review, keyboard use and screen-reader passes stay judgment, checked in
  review.
- Raw-HTML sinks outside a reviewed allowlist: zero. The `verify` step searches the sources for
  them. URL and style sanitization stays judgment, agreed with the backend.
- Data leaking between server-rendered requests: none. The `verify` step renders two requests
  carrying different user data in one server process and fails if either response holds the other's
  data. Mutable module-scope state stays judgment, checked in review.
- Shipped script size, compressed: within a budget the team sets. The `verify` step sums the
  compressed size of the built scripts. Field LCP and INP are tracked in production, not gated.
- Uncaught runtime errors in production: all reported to the tracker, their rate compared before and
  after each release, not gated. The `verify` step mounts the app with a component that throws and
  asserts the reporting call received the error.
- Next-minor compatibility: the full gate against the latest release candidate, on a schedule. The
  `verify` step reports without blocking; a human triages.

## Sources
- [Vue core releases](https://github.com/vuejs/core/releases), 2026-11-01: 3.6 still in release
  candidates, 3.5 the stable line.
- [Vue 3.6.0-beta.1 release notes](https://github.com/vuejs/core/releases/tag/v3.6.0-beta.1),
  2026-11-01: Vapor opt-in, limits and adoption advice.
- [Vue: Testing](https://vuejs.org/guide/scaling-up/testing.html), 2026-11-01: public-interface
  testing, composable testing.
- [Vue: Security](https://vuejs.org/guide/best-practices/security.html), 2026-11-01: trusted
  templates, injection sinks.
- [Vue: Performance](https://vuejs.org/guide/best-practices/performance.html), 2026-11-01: load
  versus update, profiling, remedies.
- [Vue: Using Vue with TypeScript](https://vuejs.org/guide/typescript/overview.html), 2026-11-01:
  transpile-only build, separate type check.
- [eslint-plugin-vue User Guide](https://eslint.vuejs.org/user-guide/), 2026-11-01: rule tiers,
  all-error variants.
- [Announcing Vitest 4.0](https://voidzero.dev/posts/announcing-vitest-4), 2026-11-01: stable
  real-browser testing.
- [The State of Vue.js Report–Key Takeaways for Businesses in
  2026](https://monterail.com/blog/state-of-vue-2025-key-takeaways), 2026-11-01: Pinia as the
  recommended store.
- [Vue: Server-Side Rendering](https://vuejs.org/guide/scaling-up/ssr.html), 2026-11-01:
  cross-request state pollution and the per-request app, router and store; hooks that never run on
  the server; hydration mismatch causes.
- [Pinia: Server Side Rendering](https://pinia.vuejs.org/ssr/), 2026-11-01: escaping serialized
  state because it can carry user content.
- [Vue: Accessibility](https://vuejs.org/guide/best-practices/accessibility.html), 2026-11-01: skip
  link and focus after route change, heading order, landmarks, labelled form controls, explicit
  button types, no placeholders as labels.
- [axe-core](https://github.com/dequelabs/axe-core), 2026-11-01: automated rules per WCAG version
  and level, catching only part of WCAG issues, uncertain results left for manual review, use inside
  existing tests.
- [Vue: Production Deployment](https://vuejs.org/guide/best-practices/production-deployment.html),
  2026-11-01: the app-level error handler as the hook for error tracking.
- [Vue: Application API](https://vuejs.org/api/application.html), 2026-11-01: error sources the
  handler captures, shortened info codes in production.
- [Vite: Building for Production](https://vite.dev/guide/build.html), 2026-11-01: preload error when
  a deploy has removed old chunks, no-cache on the HTML.
