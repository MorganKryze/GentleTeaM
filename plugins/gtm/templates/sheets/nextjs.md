# Next.js

> Helps a developer or reviewer build, secure, migrate and verify a Next.js App Router application
> on a supported release line.

## When it applies
- Writing or reviewing routes, layouts, Server Components, Server Functions, route handlers or the
  proxy file of a Next.js app.
- Deciding what to prerender, cache, stream or prefetch, or migrating to Cache Components.
- Upgrading Next.js, applying a scheduled or out-of-band security release, or choosing where to host
  the app.
- Auditing authentication, authorization and data exposure in a Next.js codebase.

## Method
1. Check the installed version against the support policy and the latest security release, then book
   time for the next announced release. After a critical remote-code-execution fix, rotate secrets.
2. Use one data-access approach per project. For new projects, use a server-only data access layer:
   it alone reads secrets and the database, checks authorization and returns minimal objects.
3. Treat every Server Function as a public POST endpoint. Inside it, re-check identity and resource
   ownership, validate inputs and return only what the UI needs. The proxy only runs optimistic
   checks and is never the only gate.
4. Decide per component: static, cached ('use cache' with a cacheLife, plus a cacheTag when it gets
   invalidated), or rendered at request time inside a Suspense boundary. Push runtime reads as deep
   in the tree as possible.
5. Choose invalidation by the behaviour you need: updateTag when users must see their own write at
   once, revalidateTag with a profile for stale-while-revalidate.
6. Know where each cache entry lives (prerendered HTML, instance memory, shared handler or browser).
   These stores are scoped to one deployment: no 'use cache' entry carries over to the next, not
   even a remote one.
7. Migrate existing apps step by step: opt routes out, fix non-deterministic synchronous calls
   first, then convert one route at a time.
8. Lock intent: declare static guarantees on routes that must stay static, and cover key journeys
   with instant-navigation end-to-end tests.
9. Host on a verified adapter or on one that passes the adapter test suite. Self-hosted instances
   must keep cached content in sync; setting one Server Functions encryption key makes them all use
   the same key.
10. Put each access check where it runs for what it guards: the page, the component that shows the
    data, or the data access layer, never only a layout. A layout doesn't re-run on navigation, and
    hiding its children doesn't stop them rendering into the RSC payload. Neither the static shell
    nor a 'use cache' or 'use cache: remote' scope can read the session, so gated content renders at
    request time behind the check; per-user data cached on the server goes through an unexported
    cached function that receives the id of the user read from the session.
11. Treat every route handler as a public endpoint too: each exported method checks identity and
    resource ownership itself. It gets none of the Server Function defences (POST only, Origin
    compared with Host), so a cookie-authenticated handler that changes state needs its own CSRF
    protection, and a GET handler changes nothing.
12. Give a variable the 'NEXT_PUBLIC_' prefix only if its value may be published: the build inlines
    it into the client bundles and freezes it there, so a build promoted to another environment
    keeps the value it was built with. Read per-environment values on the server at request time.

## Reflexes
- Could someone call this Server Function directly, and does it check who they are and what they
  own?
- Could this prop or return value carry a field the client must not see?
- Does this runtime read sit inside a Suspense boundary, or does it block the static shell?
- Is this access check only in a layout, or does it guard content prerendered into the static shell
  or a server cache, where no check runs per request?
- Where is this cached value stored, and does it survive another instance or the next deploy?
- Is our version covered by the latest security release, and when is the next one?
- Is this performance figure a vendor benchmark, or did we measure it on our app?
- Scored on durability, performance, migration cost and operations, which option wins, and by how
  much?

## What is measured
- Version floor: a verify step fails when the installed framework version is below the team's
  security floor. When to raise the floor within the release window stays judgment.
- Confinement: a verify step fails when environment reads or database imports appear outside the
  data access layer. The check is heuristic, so each hit is reviewed.
- Public variables: a verify step fails when a 'NEXT_PUBLIC_' name matches the team's secret
  patterns, or when a secret's value turns up in the built client assets. Which values count as
  secret stays judgment.
- Server Function authorization: each function has a test that calls it without a session and on
  another user's resource, and expects a refusal both times. Whether the rules are complete stays
  judgment.
- Route handler authorization: each exported method that serves private data or changes state has a
  test that calls it without a session and on another user's resource, expecting a refusal both
  times; each state-changing method is also called with a valid session from a foreign origin and
  must refuse. Whether the rules are complete stays judgment.
- Gated content: a verify step requests each gated route with no session and with a session that
  lacks access, as a page load and as a client-side navigation, and fails if gated content appears
  anywhere in a response. Which content counts as gated stays judgment.
- Static intent: a static guarantee declared on the route or layout, checked by the production build
  run as a verify step.
- Instant navigation: end-to-end tests using the framework's instant helper on critical journeys,
  run as a verify step.
- Migration progress: a verify step fails when the number of segments opted out of instant
  validation goes up.
- Self-hosting: a verify step checks that the Server Functions encryption key is set and decodes to
  a valid AES key length.
- Performance: page-experience metrics and downloaded resource sizes measured in a real browser,
  plus bundle diffs. Build output size is not a measure. Thresholds stay judgment.

## Sources
- [Next.js 16.4](https://nextjs.org/blog/next-16-4), 2026-11-01: Cache Components as the recommended
  model, static guarantees, upgrade reminders.
- [Next.js Security Release and Our Next Patch
  Release](https://nextjs.org/blog/next-security-release-program), 2026-11-01: pre-announced
  security releases, roughly once a month.
- [Security Advisory CVE-2025-66478](https://nextjs.org/blog/CVE-2025-66478), 2026-11-01: no
  workaround; upgrade, then rotate secrets.
- [Support Policy](https://nextjs.org/support-policy), 2026-11-01: supported release lines and their
  end dates.
- [Data Security](https://nextjs.org/docs/app/guides/data-security), 2026-11-01: data access layer,
  Server Function checks, audit list, encryption key.
- [Caching](https://nextjs.org/docs/app/getting-started/caching), 2026-11-01: use cache, Suspense
  boundaries, where cache entries live.
- [Migrating to Cache Components](https://nextjs.org/docs/app/guides/migrating-to-cache-components),
  2026-11-01: step-by-step opt-out, behaviour changes, choice of invalidation.
- [Next.js 16.3](https://nextjs.org/blog/next-16-3), 2026-11-01: instant navigations and their
  end-to-end test helper.
- [How to upgrade to version 16](https://nextjs.org/docs/app/guides/upgrading/version-16),
  2026-11-01: proxy rename; build size figures dropped in favour of browser measures.
- [Testing](https://nextjs.org/docs/app/guides/testing), 2026-11-01: end-to-end rather than unit
  tests for async Server Components.
- [Next.js Across Platforms](https://nextjs.org/blog/nextjs-across-platforms), 2026-11-01: adapter
  contract, verified adapters, shared test suite.
- [Authentication](https://nextjs.org/docs/app/guides/authentication), 2026-11-01: layout checks
  neither re-run on navigation nor keep child segments out of the RSC payload; static routes escape
  request-time checks; route handlers are public endpoints.
- [Authentication with Cache
  Components](https://nextjs.org/docs/app/guides/authentication-with-cache-components), 2026-11-01:
  session reads never sit in the static shell or a server cache scope; per-user cached functions
  stay unexported, keyed by the session user's id.
- [How to Think About Security in
  Next.js](https://nextjs.org/blog/security-nextjs-server-components-actions), 2026-11-01: route
  handlers lack the Server Action CSRF defences, so protection there is manual; custom GET handlers
  might need extra auditing.
- [Environment Variables](https://nextjs.org/docs/app/guides/environment-variables), 2026-11-01:
  public-prefixed values inlined into client bundles at build time and frozen; per-environment
  values read on the server at request time.
