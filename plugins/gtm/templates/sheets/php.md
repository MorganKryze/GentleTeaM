# PHP and Laravel

> Helps a developer or reviewer keep a Laravel application on supported versions, behind automated
> quality and security gates, and clear of the framework's silent failure modes.

## When it applies
- Building, reviewing or upgrading a web application or package written in PHP with the Laravel
  framework.
- Planning a PHP or Laravel upgrade, or checking how long the versions in use stay supported.
- Adding or tightening continuous-integration checks: code style, static analysis, dependency audit,
  architecture or mutation tests.
- Reviewing Eloquent data access or request handling for performance traps and security flaws.
- Handling the application key or `.env` files, record-level authorization, or queued work
  dispatched inside a database transaction.

## Method
1. Read the official support tables first: note the security end date of the PHP branch and of the
   Laravel major in use, and schedule the next upgrade before it.
2. Upgrade on a dedicated branch: runtime first, then the framework constraint, then the automated
   refactoring sets matched to the installed version; review the diff like any change and run the
   full suite.
3. Keep a style check and static analysis in continuous integration at an explicit level; freeze
   existing errors in a baseline, raise the level step by step, and treat any growth of the baseline
   as a reviewed decision.
4. Audit dependencies on every change and on a daily schedule; keep the blocking of vulnerable
   versions on; give every ignored advisory a reason and a review date.
5. Write architecture rules as tests (no debug calls, no risky functions, framework conventions);
   add mutation testing with a minimum score where a wrong result costs most.
6. Turn on Eloquent strictness outside production in steps: lazy loading and silently discarded
   attributes first, missing attributes once the suite is clean.
7. Review security against the framework cheat sheet: debug off in production, only validated or
   filtered input in mass assignment, bound parameters in raw queries and allowlisted column names,
   escaped output, no user-supplied redirect target, request forgery protection kept on.
8. Treat the application key as a secret: generate it with `php artisan key:generate`, never commit
   an unencrypted `.env` file or a per-environment copy of it, and after any exposure rotate the key
   rather than only deleting the commit, since anyone holding it can craft encrypted payloads that
   the framework decrypts and unserializes, a path to remote code execution; a key listed in
   `APP_PREVIOUS_KEYS` is still tried on decryption, so a leaked one stays there only until data
   encrypted with it has been re-encrypted.
9. Make queued work wait for the commit: set `after_commit` to true on the queue connection, or
   chain `afterCommit()` on each dispatch made inside a transaction; otherwise a worker can run the
   job before the commit and find its records missing or stale. With the option on, jobs from a
   transaction rolled back by an exception are discarded, and queued listeners, mail, notifications
   and broadcast events wait as well.

## Reflexes
- Does this code call framework methods with named arguments, which the backward-compatibility
  guidelines do not cover?
- Is a relation loaded inside a loop, and would a test fail if it were?
- Can user input reach a column name, a raw query without bindings, unescaped output, a redirect
  target or a shell command?
- Can a signed-in user read or change another user's record by editing the key in the URL: does the
  action authorize through a policy, a gate or the route's `can` middleware, and is a nested binding
  scoped to its parent with `scopeBindings` when it has no custom key?

## What is measured
- Supported versions: the runtime branch and the framework major are inside their security window on
  the day of the run; a dated table kept in the repository turns this into a `verify` step that
  fails once a date passes.
- Code style: zero violations in check mode; the formatter's check mode exits non-zero on any
  violation, which is the `verify` step.
- Static analysis: zero errors at the configured level outside the baseline, as a `verify` step;
  level and baseline size are tracked, and raising the level stays judgment.
- Dependencies: no unignored advisory and no abandoned package in the audit, as a `verify` step on
  each change and on a schedule; whether an ignore is justified stays judgment.
- Architecture rules: the preset and custom expectations pass inside the test suite's `verify` step.
- Mutation score: at least the agreed minimum on targeted classes, as a `verify` step; choosing the
  minimum stays judgment.
- Eloquent strictness: the suite passes with strict mode on outside production; telling a real bug
  from a false positive stays judgment.
- Authorization: every route that reads or changes a record has a feature test where a second user
  is refused (403, or 404 where the policy hides the record), run inside the test suite's `verify`
  step; such tests catch basic flaws only, so route coverage and subtler access rules stay judgment.
- Secrets: the repository tracks no unencrypted `.env` file or per-environment copy, a file check
  run as a `verify` step, with continuous secret scanning on top; whether an exposed key was really
  rotated stays judgment.
- Queued work and transactions: a test asserting the queue connection's `after_commit` option is on
  runs inside the suite's `verify` step; where per-dispatch `afterCommit()` is used instead, finding
  a dispatch inside a transaction without it stays judgment.
- Redirect targets, upload handling and raw HTML output have no reliable automated check here: they
  stay judgment, reviewed by a person.

## Sources
- [PHP Supported Versions](https://www.php.net/supported-versions.php), 2026-11-01: branch dates and
  the two-plus-two-year support policy.
- [Laravel 13.x Release Notes](https://laravel.com/docs/13.x/releases), 2026-11-01: support table,
  Laravel 13 changes, named-argument caveat.
- [Laravel 13.x Pint](https://laravel.com/docs/13.x/pint), 2026-11-01: check, repair and diff modes.
- [PHPStan Rule Levels](https://phpstan.org/user-guide/rule-levels), 2026-11-01: levels 0 to 10,
  baseline, gradual raising.
- [Larastan](https://github.com/larastan/larastan), 2026-11-01: framework-aware analysis, sample
  level, baseline.
- [rector-laravel](https://github.com/driftingly/rector-laravel), 2026-11-01: upgrade sets driven by
  the installed version.
- [Pest Architecture Testing](https://pestphp.com/docs/arch-testing), 2026-11-01: presets and
  exclusions.
- [Pest Mutation Testing](https://pestphp.com/docs/mutation-testing), 2026-11-01: targeting, minimum
  score, cost.
- [Composer Config](https://getcomposer.org/doc/06-config.md), 2026-11-01: audit and policy keys,
  blocking defaults.
- [OWASP Laravel Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Laravel_Cheat_Sheet.html), 2026-11-01:
  threats and countermeasures.
- [Amit Merchant, Eloquent strict mode](https://amitmerchant.com/eloquent-strict-mode-in-laravel),
  2026-11-01: the three strict protections, off in production.
- [Chisonm on DEV, strict mode and
  tests](https://dev.to/chisonm/i-enabled-strict-mode-in-laravel-12-and-my-tests-started-failing-everywhere-2ekh),
  2026-11-01: false positives and the defaults workaround.
- [Laravel 13.x Authorization](https://laravel.com/docs/13.x/authorization), 2026-11-01: policies,
  gates and route can middleware, 403 on denial or 404 to hide a record.
- [Laravel 13.x Routing](https://laravel.com/docs/13.x/routing), 2026-11-01: implicit binding by URL
  key, automatic child scoping only with a custom key, scopeBindings.
- [OWASP Authorization Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), 2026-11-01:
  per-request checks on the specific object, automated access-control tests and their limits, 2021
  ranking.
- [Laravel 13.x Configuration](https://laravel.com/docs/13.x/configuration), 2026-11-01: environment
  file kept out of source control, encrypted environment files.
- [Laravel 13.x Encryption](https://laravel.com/docs/13.x/encryption), 2026-11-01: key generation,
  rotation with previous keys tried on decryption.
- [GitGuardian, public APP_KEY
  leaks](https://blog.gitguardian.com/exploiting-public-app_key-leaks/), 2026-11-01: leak sources,
  decryption unserializing into code execution, rotation over deletion, monitoring.
- [Laravel 13.x Queues](https://laravel.com/docs/13.x/queues), 2026-11-01: jobs and database
  transactions, after_commit, afterCommit, discard on rollback, listeners and mail included.
