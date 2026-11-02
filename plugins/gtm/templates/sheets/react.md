# React

> Helps a developer or reviewer plan, write and check React code against current React practice:
> pure render, few Effects, a compiler adopted in steps, patched servers, measured performance.

## When it applies
- Writing, reviewing or refactoring React components, hooks or Effects.
- Writing or reviewing Server Components, Server Functions, error boundaries or raw HTML rendering.
- Enabling the React Compiler, or adding or removing manual memoization.
- Upgrading React, or acting on a React security advisory.
- Investigating a slow interaction, a stale value or an Effect that fires too often.

## Method
1. Note the React line in use and read every release post and security advisory since the last
   upgrade. If React renders on a server with Server Components, bring the React server packages and
   the framework that ships them to the patched floor before any other work.
2. Run the official hooks lint preset (Rules of Hooks, exhaustive dependencies and the
   compiler-derived rules) and fix its errors before changing behavior. It works without the
   compiler.
3. Keep render pure: derive values during render; never mutate props, state or globals; never read
   or write refs during render.
4. Put logic caused by the user in event handlers. Keep an Effect only to synchronize with an
   external system:
   - reset state with a key;
   - subscribe to external stores with useSyncExternalStore;
   - move the non-reactive part into an Effect Event, kept out of the dependency list;
   - prefer the framework's data loading, or else a fetch whose cleanup ignores stale responses.
5. Mark non-urgent updates as transitions, and animate only those, with ViewTransition. Keep hidden
   screens and their state with Activity. Have client-only components call use(browser()), so the
   server shows the nearest Suspense fallback.
6. Adopt the compiler in steps: clean lint, exact version pin, one area at a time, end-to-end tests
   on.
   - Leave existing memoization alone in that change, and remove it later only under tests.
   - Keep it, with a comment, where a library, an Effect or an outside listener needs a stable
     identity.
7. Profile the same scenario before and after any change sold as an optimization, reading the
   scheduler and component tracks. Treat published gains and devtools badges as hypotheses.
8. Keep secrets out of Server Function source; read them at runtime.
9. Where Server Components or Server Functions are in use, treat the boundary between server and
   client as public in both directions:
   - any client can call a Server Function with arguments of its choosing, so each one checks its
     arguments at runtime (static types are not enforced) and confirms the current user may take
     the action before doing anything;
   - props a Server Component passes to a Client Component are serialized to the browser, so pass
     only the fields it renders, never a whole record.
10. Put Error Boundaries at the level where a fallback message makes sense to the user, not around
    every component, since a rendering error no boundary catches takes the whole UI off the screen.
    Report errors through the root's onCaughtError, onUncaughtError and onRecoverableError options,
    or what the framework offers in their place. Event handlers and asynchronous callbacks bypass
    boundaries, except work inside a transition from useTransition, so handle their errors where
    they are thrown.
11. Feed dangerouslySetInnerHTML only HTML that comes from a trusted source and has been sanitized,
    and build its `__html` object as close as possible to where that HTML is produced, not inline at
    the prop. Where the site enforces Trusted Types, pass a TrustedHTML value made by the site's
    policy.

## Reflexes
- Does this code run because the component appeared, or because the user did something?
- If this part throws while rendering, what does the user still see, and does the error reach
  reporting?

## What is measured
- Hooks lint: zero errors under the official preset. A `verify` step runs the linter over the whole
  tree and fails on any error.
- Server package floor: where React renders on a server, installed React server packages sit at or
  above the patched floor of their line. A `verify` step reads installed versions and fails below
  the floor; the floor list is updated at each advisory.
- Compiler version: pinned to an exact version. A `verify` step fails on a version range.
- Opt-out debt: the number of files carrying the compiler opt-out directive does not grow. A
  `verify` step compares it with a committed baseline.
- End-to-end tests pass with the compiler on, forms and server actions included. This is a `verify`
  step.
- Performance: before and after profiles of one scenario. The comparison stays judgment (noise,
  machine, data). The 2.5 s "good" LCP threshold is a reference, not a gate, until measurement is
  stable.
- Need for an Effect: judgment at review, using the external-system test. The lint rule against
  synchronous state updates in Effects covers the mechanical part.
- Server Function exposure: each Server Function checks its arguments and the user's permission
  before acting, and Client Component props carry only rendered fields; both stay judgment at
  review. A `verify` step compares the files containing `'use server'` with a committed, reviewed
  list and fails on a new one, so no new endpoint skips that review.
- Raw HTML: the number of dangerouslySetInnerHTML uses does not grow unreviewed. A `verify` step
  compares it with a committed baseline; whether each input is trusted and sanitized stays judgment.

## Sources
- [React 19.3](https://react.dev/blog/2026/09/09/react-19-3), 2026-11-01: stable ViewTransition and
  Fragment refs, browser(), Strict Mode Effects during hydration.
- [React 19.2](https://react.dev/blog/2025/10/01/react-19-2), 2026-11-01: Activity, useEffectEvent,
  Performance Tracks, the 2.5 s LCP heuristic.
- [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1), 2026-11-01: adoption in
  steps, manual memoization, exact pinning.
- [eslint-plugin-react-hooks](https://react.dev/reference/eslint-plugin-react-hooks), 2026-11-01:
  the lint rules, usable without the compiler.
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect), 2026-11-01:
  the Effect decision rules.
- [Critical Security Vulnerability in React Server
  Components](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components),
  2026-11-01: who is exposed, upgrade path.
- [Denial of Service and Source Code Exposure in React Server
  Components](https://react.dev/blog/2025/12/11/denial-of-service-and-source-code-exposure-in-react-server-components),
  2026-11-01: patched floors, secrets kept out of source.
- [React releases](https://github.com/react/react/releases), 2026-11-01: latest patch of each line.
- [I let React Compiler handle
  memoization](https://blog.logrocket.com/react-compiler-memoization-what-actually-broke/),
  2026-11-01: failure modes, memoization worth keeping.
- ['use server'](https://react.dev/reference/rsc/use-server), 2026-11-01: Server Functions as
  exposed endpoints, client-controlled arguments, validation and a permission check in every
  function.
- [How to Think About Security in
  Next.js](https://nextjs.org/blog/security-nextjs-server-components-actions), 2026-11-01: props to
  Client Components exposed to the browser, minimal props, type annotations not enforced at runtime,
  audit of use server and use client files.
- [Component](https://react.dev/reference/react/Component), 2026-11-01: UI removed on an uncaught
  render error, boundary granularity, errors that boundaries do not catch.
- [createRoot](https://react.dev/reference/react-dom/client/createRoot), 2026-11-01: root error
  options for reporting caught, uncaught and recoverable errors.
- [Common components](https://react.dev/reference/react-dom/components/common), 2026-11-01:
  dangerouslySetInnerHTML only with trusted, sanitized HTML, the object built where the HTML is
  made, TrustedHTML under Trusted Types.
