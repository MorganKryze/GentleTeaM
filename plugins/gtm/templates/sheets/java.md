# Java and Spring

> Helps a role plan, upgrade and review Java services built on Spring Boot so they stay on a
> supported generation, check their nullness contracts, prove their concurrency choices under load
> and keep their module boundaries.

## When it applies
- Starting, reviewing or extending a service built on Spring Boot and Spring Framework.
- Upgrading Spring Boot across a generation (3.x to 4.x) or a minor version, or upgrading the JDK
  underneath it.
- Turning on virtual threads, or explaining a throughput drop after doing so.
- Adding or reviewing nullness contracts in existing code.
- Writing integration tests that need a database, a broker or another external service.
- Keeping a modular monolith inside its declared module boundaries.

## Method
1. Inventory the stack: Boot and JDK versions, dependency versions pinned outside Boot's management,
   servlet container, packaging (executable jar, container image, native image), custom JSON
   configuration.
2. Read the support status of the Boot branch in the Spring team's release announcements; once a
   branch has shipped its last OSS release, upgrading is planned work, not backlog.
3. Upgrade in steps: latest patch of the current branch with deprecation warnings cleared and
   managed versions no longer overridden, then the next generation on a branch with small commits;
   review any automated rewrite as production code.
4. After the jump, move to explicit per-technology starters and their test starters, then remove the
   temporary stopgaps (classic starters, properties migrator, legacy JSON compatibility module).
5. Check JSON compatibility on real payloads; a clean startup is not a JSON compatibility test.
6. Mark packages as null-marked, annotate the type usages that may be null, and run a build-time
   nullness checker; widen coverage package by package.
7. Enable virtual threads only on a JDK where synchronized blocks no longer pin (24 or later);
   load-test with a flight recording, read pinned-thread events, and rebuild any limit that a pool
   size used to enforce.
8. Test against real dependencies in disposable containers wired through service connections, each
   container living as long as the cached test context that uses it.
9. State module boundaries as a test that fails on cycles, access to another module's internals or
   undeclared dependencies.
10. Expose over HTTP only the management endpoints the service needs, naming each one rather than
    all; once the service defines its own security filter chain, Boot stops securing them, so give
    every exposed endpoint other than health an explicit authorisation rule or keep it off the
    public network, and keep environment and configuration values masked, or shown only to a
    configured role, since any authenticated user counts as authorised by default.
11. Keep a bill of materials for every component in the packaged artifact, transitive dependencies
    included, and scan it in CI against public vulnerability databases; staying on a supported
    branch does not cover libraries pinned outside Boot's management or flaws disclosed between
    patch releases. Remove a dependency nothing uses rather than patching it.

## Reflexes
- Is this Boot branch still getting OSS releases, and which minor is the next target?
- What does the next minor remove that the current one only deprecated?
- Does a build flag, an image recipe or a runbook rely on something that changed meaning or was
  removed: test skipping, jar modes, launch scripts, an embedded server, a JVM diagnostic property?
- Where can this value be null, and does its type say so?
- What can still pin a virtual thread here: native callbacks, class loading, class initialisation?
- Which downstream resource did a pool size protect that virtual threads no longer bound?
- Does each test container live exactly as long as the context that uses it?
- Which module reaches into another module's internals?
- Does each call to a transactional method arrive through the proxy, or from inside the same class,
  where no transaction starts, or from initialisation code, where transactional behaviour should not
  be relied on?
- Which exceptions roll this transaction back, and would a checked exception commit the work done so
  far?

## What is measured
- Supported generation: the Boot version packaged in the artifact against a floor; a verify step
  fails under the floor. Setting the floor from the Spring team's announcements stays judgment.
- Migration stopgaps: stopgap artifacts still declared in build files, target 0 after the migration;
  a verify step searches the build files.
- Nullness: build-time nullness errors, target 0, enforced by the compile step; share of main
  packages declared null-marked, kept at or above an agreed ratchet by a verify step.
- Pinning: pinned-virtual-thread events in a load-test flight recording, at or under an agreed
  maximum; a verify step reads the recording. Whether throughput and latency are acceptable stays
  judgment.
- Module boundaries: violations found by the module verification test, target 0; the test is the
  verify step.
- Integration: the containerised integration suite passes in CI; which dependencies deserve a
  container stays judgment.
- JSON compatibility across a serialisation library upgrade: stays judgment, by comparing real
  payloads.
- Management endpoints: exposed endpoints other than health that answer an unauthenticated request,
  target 0; a verify step in the integration suite calls each one without credentials and fails on
  any successful response. Which endpoints a service needs stays judgment.
- Known vulnerabilities: findings at or above an agreed severity in a scan of the artifact's full
  dependency tree, target 0; a verify step runs the scan in CI. Whether a finding is reachable in
  this service, and how fast to patch it, stays judgment.
- Transaction boundaries: each write path that must be all-or-nothing has an integration test that
  fails it part-way, with a checked exception where one can be thrown, and asserts nothing was
  committed; the containerised suite is the verify step. Which paths must be atomic stays judgment.

## Sources
- [Spring Boot 3.5.16 available
  now](https://spring.io/blog/2026/06/25/spring-boot-3-5-16-available-now/), 2026-11-01: last OSS
  release of the 3.5.x line.
- [Spring Boot 4.0 Migration
  Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide),
  2026-11-01: baselines, removals, modular starters, stopgaps.
- [Spring Boot 4.0 Release
  Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Release-Notes),
  2026-11-01: platform additions of 4.0.
- [Spring Boot 4.1 Release
  Notes](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.1-Release-Notes),
  2026-11-01: removals and changed build behaviour in 4.1.
- [Null-safe applications with Spring Boot
  4](https://spring.io/blog/2025/11/12/null-safe-applications-with-spring-boot-4/), 2026-11-01:
  null-marking method, build-time checking, known limits.
- [JEP 491](https://openjdk.org/jeps/491), 2026-11-01: end of pinning in synchronized, remaining
  pinning cases.
- [Spring Boot reference:
  SpringApplication](https://docs.spring.io/spring-boot/reference/features/spring-application.html),
  2026-11-01: virtual-thread setting and its caveats.
- [Spring Boot reference:
  Testcontainers](https://docs.spring.io/spring-boot/reference/testing/testcontainers.html),
  2026-11-01: service connections and container lifecycle.
- [Spring Modulith reference: Verifying Application Module
  Structure](https://docs.spring.io/spring-modulith/reference/verification.html), 2026-11-01: module
  verification rules.
- [Spring Boot 3.5 to 4 Migration
  Playbook](https://blog.vaadin.com/spring-boot-4-migration-playbook-for-teams-upgrading-from-3.5),
  2026-11-01: practitioner order of steps, limits of automated rewrites.
- [Spring Boot reference:
  Endpoints](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html), 2026-11-01:
  default exposure, endpoint security backing off under a custom filter chain, opt-in access, value
  masking and who counts as authorised.
- [Spring Framework reference: Using
  @Transactional](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html),
  2026-11-01: interception only through the proxy, self-invocation, initialisation code.
- [Spring Framework reference: Rolling Back a Declarative
  Transaction](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html),
  2026-11-01: rollback only on unchecked exceptions by default, rollback rules for checked ones.
- [OWASP Top 10:2025 A03 Software Supply Chain
  Failures](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures), 2026-11-01:
  inventory including transitive components, bill of materials, monitoring of vulnerability
  databases, composition analysis, removing unused dependencies.
