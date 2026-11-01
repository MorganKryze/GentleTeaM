# Go

> Helps a developer or reviewer keep Go code idiomatic, race-free and patched while the toolchain
> ships a release every six months.

## When it applies
- Writing, reviewing or refactoring code in a Go module.
- Upgrading the Go toolchain or raising the `go` line of go.mod.
- Adding or updating a dependency or a development tool.
- Testing code built on goroutines, timers, timeouts or network calls.
- Handling untrusted input: parsers, decoders, HTTP handlers, file paths.

## Method
1. Before an upgrade, read the release notes of every version crossed and list the behavior changes
   that touch the code: error texts, encoded or compressed bytes, removed GODEBUG values, stricter
   parsing, crypto randomness.
2. Run the gate with the target toolchain in a separate job, before and after raising the `go` line;
   raise the line in its own change, once green.
3. Then run the modernizer pass from a clean tree, twice, with one change per prolific analyzer and
   one pass per platform that has its own code; fix generators, not generated files; build and test
   after each pass.
4. Keep the gate blocking: vet, race-enabled tests, a reachable-vulnerability scan in a mode whose
   exit code carries the verdict, and the team's pinned linter on new code with report caps off.
5. Test timers, timeouts and goroutine coordination inside a synthetic-time bubble, not with real
   sleeps; start goroutines with `sync.WaitGroup.Go`.
6. Fuzz code that parses untrusted input; confine file access to a root directory when paths come
   from outside.
7. Pin development tools: the maintainers' tested binary when they advise against source builds,
   module-tracked tools for small helpers.
8. Review and test every dependency update; follow the security announcement list and apply point
   releases.
9. Treat announced performance gains as hypotheses: benchmark your own workload before and after.
10. Ship only binaries built by one of the two newest major releases: an older major gets no further
    security point release, and a patch reaches users only once each binary is rebuilt with the
    patched toolchain and redeployed.
11. Bound what a remote peer can hold: serve HTTP through a configured server with a header-read
    timeout and read, write and idle timeouts that fit its handlers, since the zero values and the
    package-level serve functions leave every timeout off; cap request bodies; give every outbound
    call a client timeout or a deadline, since the default client has none.

## Reflexes
- Does the module's `go` line allow the idiom I am writing, or the fix the tool proposes?
- Did this dependency update raise the `go` or `toolchain` line, and with it the GODEBUG defaults
  and the toolchain the go command switches to?
- Is a result used before its error is checked?
- Did a test execute this concurrent path, or only compile it?
- Could this vulnerable code be reached through reflection or unsafe code, where the scanner may
  miss it?
- Is this test waiting on the wall clock where a synthetic clock would do?
- Who waits for this goroutine, and what makes it stop?
- Will the next toolchain change an error text or a byte stream that a test compares?
- Does this tool belong in the module graph, or in a pinned binary?
- What does each source gain from its claim, which blind spot does it admit, and what survives both
  readings?

## What is measured
- Vet findings: zero. Verify: `go vet ./...` exits 0.
- Data races on executed paths: zero. Verify: `go test -race ./...` exits 0; how much concurrent
  code the tests reach stays judgment.
- Known vulnerabilities reachable from the code: zero. Verify: `govulncheck ./...` exits 0;
  machine-readable output exits 0 regardless of the number of vulnerabilities found and cannot be
  the gate.
- Known vulnerabilities in each shipped binary: zero. Verify: `govulncheck -mode binary` on the
  artifact exits 0; a source scan checks the standard library of the `go` command on the PATH, not
  that of the toolchain that built the release, and binary mode may flag code that is present but
  unreachable.
- Toolchain of each shipped binary: one of the two newest major releases. Verify: `go version` on
  the artifact names a major that the release history lists among the two newest.
- Pending modernizations for the declared language version: zero. Verify: `out=$(go fix -diff ./...)
  && test -z "$out"`.
- New lint findings against the main branch: zero, caps off. Verify: the pinned linter, limited to
  new code, exits 0.
- HTTP servers without a header-read timeout, or started by a serve function that cannot set one:
  zero. Verify: the pinned linter with gosec rules G112 and G114 enabled exits 0 on the whole
  module; body caps and client timeouts stay judgment.
- Gate on the target toolchain, before and after raising the `go` line: green. Verify: rerun the
  vet, race and vulnerability checks in a job whose toolchain is the target.
- `go` or `toolchain` line moved by a dependency update without the upgrade steps: zero. Verify: the
  go.mod diff of a dependency update leaves both lines unchanged; when one moves, steps 1 and 2
  apply and `go list -f '{{.DefaultGODEBUG}}'` on each main package is compared before and after.
- Goroutine leaks under a staging load: zero in the leak profile; judgment, since the detector may
  miss goroutines blocked on concurrency primitives reachable through globals.
- GC and allocation cost across an upgrade: compared on the team's own benchmark; no fixed
  threshold, judgment.

## Sources
- [Go 1.27 Release Notes](https://go.dev/doc/go1.27), 2026-11-01: upgrade behavior changes, leak
  profile, new vet and fix checks.
- [Go 1.26 Release Notes](https://go.dev/doc/go1.26), 2026-11-01: rewritten fix command, crypto
  randomness and URL parsing changes, default collector.
- [Go 1.25 Release Notes](https://go.dev/doc/go1.25), 2026-11-01: synthetic-time tests,
  WaitGroup.Go, nil-check fix, container-aware GOMAXPROCS.
- [Go 1.24 Release Notes](https://go.dev/doc/go1.24), 2026-11-01: tool directive, tests analyzer,
  root-confined file access.
- [Using go fix to modernize Go code](https://go.dev/blog/gofix), 2026-11-01: modernizer workflow,
  version gating, conflicts between fixes.
- [Security Best Practices for Go Developers](https://go.dev/doc/security/best-practices),
  2026-11-01: vulnerability scan, fuzzing, updates, race detector, vet.
- [govulncheck command](https://pkg.go.dev/golang.org/x/vuln/cmd/govulncheck), 2026-11-01: exit
  codes per output format, blind spots.
- [golangci-lint configuration file](https://golangci-lint.run/docs/configuration/file/),
  2026-11-01: new-code-only options and default report caps.
- [golangci-lint local installation](https://golangci-lint.run/docs/welcome/install/local/),
  2026-11-01: why a tested binary over a module-tracked install.
- [Results from the 2025 Go Developer Survey](https://go.dev/blog/survey2025), 2026-11-01: idioms as
  the top difficulty, AI review burden.
- [Modernizers & go fix](https://rednafi.com/go/gofix/), 2026-11-01: field failures of automated
  fixes and their use in CI.
- [Go Release History](https://go.dev/doc/devel/release), 2026-11-01: a major release is supported
  until two newer ones exist; security fixes ship as point releases of supported majors.
- [govulncheck command](https://pkg.go.dev/golang.org/x/vuln/cmd/govulncheck), 2026-11-01: binary
  mode, the toolchain whose standard library each mode checks, false positives in binaries.
- [go command](https://pkg.go.dev/cmd/go), 2026-11-01: go version on a file reports the toolchain
  that built it.
- [net/http package](https://pkg.go.dev/net/http), 2026-11-01: zero-value server timeouts mean none,
  client timeout semantics, request-body cap.
- [The complete guide to Go net/http
  timeouts](https://blog.cloudflare.com/the-complete-guide-to-golang-net-http-timeouts/),
  2026-11-01: slow clients exhausting descriptors, package-level serve functions and the default
  client without timeouts.
- [gosec rules](https://github.com/securego/gosec/blob/master/RULES.md), 2026-11-01: G112 and G114
  server-timeout checks.
- [golangci-lint linters configuration](https://golangci-lint.run/docs/linters/configuration/),
  2026-11-01: selecting gosec rules through includes.
- [Go Toolchains](https://go.dev/doc/toolchain), 2026-11-01: go get raises the go and toolchain
  lines to match dependencies; automatic toolchain switching.
- [Go, Backwards Compatibility, and GODEBUG](https://go.dev/doc/godebug), 2026-11-01: GODEBUG
  defaults follow the main module's go line; listing them with go list.
