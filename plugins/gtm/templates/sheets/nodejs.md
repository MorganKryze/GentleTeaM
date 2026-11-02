# Node.js

> Helps an engineer choose, run, test, secure and publish Node.js code against the current release
> schedule and today's supply-chain threats.

## When it applies
- Starting or upgrading a Node.js service, CLI, script or package, or choosing its runtime line.
- Adding, updating or auditing dependencies, or changing how CI installs them.
- Running TypeScript directly, choosing a module format, or setting up tests and coverage.
- Hardening an HTTP server or limiting what a process may touch.
- Publishing a package to the public registry.
- Keeping a server's event loop free, or deciding how a process reacts to an uncaught exception or
  unhandled rejection.

## Method
1. Pick the runtime line from the official release table: production only on LTS lines, recorded in
   the engines field. From v27, plan one upgrade a year and keep alpha lines out of production.
2. Make installs reproducible and slow to trust: a committed lockfile, the clean-install command
   only, exact versions, a minimum release age of at least one day, and dependency install scripts
   either off or limited to reviewed, version-pinned entries.
3. Choose the module format knowing that supported lines let CommonJS require() a fully synchronous
   ES module graph. Keep top-level await out of entry points meant for require() and the module
   graph they import, and use the "module.exports" string export when callers expect one default.
4. When Node.js strips TypeScript types, use erasable syntax only (no enum, parameter property,
   runtime namespace or decorator), explicit .ts extensions, type-only imports and "#" subpath
   imports. Type-check as a separate step, and publish compiled output.
5. Test with one process per file and enforce coverage thresholds. Features at stability 1
   (experimental) stay in CI tooling, never in production.
6. Harden HTTP servers: socket error handlers, header, request and keep-alive timeouts, a reverse
   proxy, never the insecure parser, constant-time comparison of secrets, prototype-less objects and
   own-property checks against prototype pollution, and no inspector in production.
7. Apply least privilege: inventory accesses in permission audit mode, then enforce minimal grants.
   Add OS-level isolation, because the permission model is a seat belt for trusted code that does
   not protect against malicious code.
8. Publish without long-lived tokens: a short-lived OIDC identity from CI with provenance, token
   publishing disallowed, 2FA required, a files allowlist and a reviewed dry-run.
9. Keep the event loop free on request paths: reject oversized input before parsing JSON, make no
   synchronous file, crypto, compression or child-process call in a server, keep regular expressions
   with nested quantifiers, overlapping alternations or backreferences away from user input, and
   split long CPU work into chunks or hand it to a bounded pool, never a new child process per
   request.
10. Treat an uncaught exception or unhandled rejection as fatal. A process-level listener replaces
    the default crash, so it may only log and release resources synchronously, then exit non-zero;
    never resume, and let an external supervisor restart the process.

## Reflexes
- Does the exact Node.js version I run have a published security fix I have not rolled out?
- If an install script were malicious, which secrets on this machine or CI runner could it read?
- Could crafted input hold the event loop in this handler: a backtracking regex, a huge JSON body, a
  synchronous call?

## What is measured
- Runtime line: a verify step fails unless the running major version is in an allowed list kept in
  line with the official LTS table. Which LTS to target, and when to move, stays judgment.
- Runtime patches: a verify step runs the Node.js project's is-my-node-vulnerable check, which
  reports the running version as vulnerable when it has a known vulnerability in the Node.js
  security database or is end-of-life. How fast to roll out a patch stays judgment.
- Install: a verify step fails without a committed lockfile, and installs only with the
  clean-install command, which errors on drift.
- Cooldown: a verify step fails unless the package-manager config sets a minimum release age of at
  least one day. The duration stays judgment.
- Install scripts: a verify step fails unless dependency install scripts are off or held to a strict
  reviewed allowlist. Approving a script stays judgment.
- Known vulnerabilities: the audit command exits non-zero at a chosen severity. The level stays
  judgment.
- Types: where Node.js strips types, a no-emit type-check that enforces erasable-only syntax must
  pass.
- Coverage: the test run exits non-zero below line, branch and function thresholds. The values stay
  judgment.
- Least privilege: tests pass with the permission model enforced and the committed grants. The
  grants stay judgment.
- Event loop: a load test with oversized and crafted inputs fails when a chosen percentile of
  event-loop delay, sampled with the perf_hooks delay histogram, exceeds a budget. The budget stays
  judgment.
- Crash handling: a test that starts the entry point and triggers an uncaught exception, then
  separately an unhandled rejection, passes only if the process exits non-zero each time. How the
  supervisor restarts it stays judgment.
- Publishing: a verify step fails without a files allowlist or when the dry-run lists secret-like
  files. Whether token publishing is disallowed stays a human check in the registry settings.

## Sources
- [Node.js: Node.js Releases](https://nodejs.org/en/about/previous-releases), 2026-11-01: LTS-only
  production rule and the annual cycle from v27.
- [GitHub: nodejs/is-my-node-vulnerable](https://github.com/nodejs/is-my-node-vulnerable),
  2026-11-01: checks the running version against the Node.js security database, treats end-of-life
  as vulnerable, intended as a CI step.
- [Node.js: Modules, TypeScript](https://nodejs.org/api/typescript.html), 2026-11-01: type stripping
  limits and recommended compiler settings.
- [Node.js: Modules, CommonJS](https://nodejs.org/api/modules.html), 2026-11-01: conditions for
  requiring ES modules.
- [Node.js: Test runner](https://nodejs.org/api/test.html), 2026-11-01: process isolation,
  reporters, coverage.
- [Node.js: Command-line API](https://nodejs.org/api/cli.html), 2026-11-01: coverage thresholds and
  their exit code.
- [Node.js: Command-line API,
  --unhandled-rejections](https://nodejs.org/api/cli.html#--unhandled-rejectionsmode), 2026-11-01:
  the default throw mode crashes only when no rejection listener is set.
- [Node.js: Process](https://nodejs.org/api/process.html), 2026-11-01: a listener replaces the
  default crash, resuming after an uncaught exception is unsafe, exit code 0 unless set, restart
  from an external monitor.
- [Node.js: Permissions](https://nodejs.org/api/permissions.html), 2026-11-01: grants, audit mode
  and the model's limits.
- [Node.js: Security Best
  Practices](https://nodejs.org/en/learn/getting-started/security-best-practices), 2026-11-01:
  threats, mitigations and a one-day cooldown.
- [Node.js: Don't Block the Event Loop (or the Worker
  Pool)](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop), 2026-11-01:
  ReDoS, JSON and synchronous-API blocking as denial of service, bounded input, partitioning and
  offloading without a child process per request.
- [Node.js: Performance measurement APIs](https://nodejs.org/api/perf_hooks.html), 2026-11-01: the
  event-loop delay histogram and its percentiles.
- [npm Docs: config v12](https://docs.npmjs.com/cli/v12/using-npm/config), 2026-11-01: release age,
  install-script policy, audit level.
- [npm Docs: Trusted publishing](https://docs.npmjs.com/trusted-publishers), 2026-11-01: OIDC
  publishing, provenance, disallowing tokens.
- [GitHub Blog: Our plan for a more secure npm supply
  chain](https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/),
  2026-11-01: the worm incident and token restrictions.
- [Datadog Security Labs: The case for dependency cooldowns in a post-axios
  world](https://securitylabs.datadoghq.com/articles/dependency-cooldowns/), 2026-11-01: incident
  windows and cooldown durations.
