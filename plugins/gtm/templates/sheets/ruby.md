# Ruby on Rails

> Helps a developer or reviewer build, secure, upgrade and tune a Rails application on current
> framework defaults, behind a merge gate that proves it.

## When it applies
- Adding or changing models, controllers, views, mailers or jobs in a Rails application.
- Upgrading Rails or Ruby, or switching on a newer release's framework defaults.
- Reviewing a Rails change for security, queries or job safety.
- Defining the checks a Rails change must pass before merge.
- Tuning processes, threads, JIT or memory of a Rails deployment.
- Writing or reviewing a schema migration or data backfill on a live application.

## Method
1. Place the app in time: Rails series and its security end date, Ruby version against that series'
   minimum, `config.load_defaults` value, any pending `new_framework_defaults_X_Y.rb`.
2. Run the merge gate before editing: setup, style, dependency advisory audits, static security
   analysis failing on any warning, tests, seed replant.
3. Build with the framework's guards: placeholder or hash query conditions, escaped output,
   allow-list sanitizing, forgery protection on, secrets in encrypted credentials, sensitive
   parameters filtered from logs, session reset at login, explicit password-length validation.
4. Read the queries each touched request or job emits; remove repeated queries from one call stack.
5. Enqueue jobs after the transaction commits; split long jobs into resumable steps so that after a
   deploy restart a job continues from the last completed step rather than the beginning.
6. Upgrade in small steps: Ruby first and separately, then one Rails minor at a time from its latest
   patch; hold new deprecations at zero, run the suite on the next version alongside, switch new
   defaults on one by one across deploys, then raise `load_defaults`.
7. Tune from measurements only: a dedicated load tool on production-like hosts, warmed up, reading
   P50, P95 or P99, and throughput; keep the production JIT on and a fragmentation-resistant
   allocator; change one setting at a time.
8. Change the schema so the code still running survives each migration: ignore a column in the model
   and deploy that before the migration that drops it; build indexes on populated tables without
   blocking writes; keep data backfills apart from the schema change, in throttled batches outside a
   transaction; give migrations a short lock timeout and a long statement timeout.

## Reflexes
- Can user input reach SQL, HTML, a redirect, a header or a file path unescaped?
- Is every record this action reads or changes found through what the current user may access, never
  by a bare id from the request?
- Is each uniqueness validation also a unique index over the same columns and scope, so two
  concurrent saves cannot both pass?
- If the process dies mid-job or the transaction rolls back, what happens to this job?

## What is measured
- Security window: days left before the running series loses security fixes; a `verify` step fails
  past the date.
- Static security analysis: zero warnings; a `verify` step runs it in fail-on-warning mode.
- Dependency advisories: zero known-vulnerable packages, server and browser side; a `verify` step
  runs both audits.
- Authorization: every action checks access or skips the check explicitly; a `verify` step adds an
  after-action check so tests raise when an action ends without one; whether each rule is right
  stays judgment.
- Tests and seeds: suite green and seed replant passing; one `verify` step each.
- Migration safety: no flagged operation outside an explicit override; a `verify` step runs new
  migrations under a safety checker that stops on dangerous operations; backfills, which it does not
  detect, stay judgment.
- Deprecations: none beyond the saved baseline; a `verify` step runs the suite in compare mode.
- Repeated queries: none from one call stack beyond the recorded to-do list; a `verify` step makes
  tests raise on them.
- Uniqueness: every uniqueness validation backed by a matching unique index; a `verify` step runs
  the linter with its rule for this switched on, since the default rule set leaves it off; the rule
  does nothing without the Ruby schema file.
- Next version: the suite on the next Rails release; a `verify` step that blocks once the upgrade is
  scheduled, a date that stays judgment.
- Browser system tests in the gate: judgment; the current default leaves them out.
- Latency percentiles and throughput under load: judgment guiding tuning; a `verify` step only once
  a latency budget and a repeatable load run exist.

## Sources
- [Ruby on Rails Maintenance Policy](https://rubyonrails.org/maintenance), 2026-11-01: support
  windows per series.
- [Upgrading Ruby on Rails](https://guides.rubyonrails.org/upgrading_ruby_on_rails.html),
  2026-11-01: upgrade order and gradual defaults.
- [Securing Rails Applications](https://guides.rubyonrails.org/security.html), 2026-11-01: framework
  guards and dependency duty.
- [Tuning Performance for
  Deployment](https://guides.rubyonrails.org/tuning_performance_for_deployment.html), 2026-11-01:
  load-test method, threads, JIT, allocator.
- [Rails 8.1 CI
  template](https://raw.githubusercontent.com/rails/rails/8-1-stable/railties/lib/rails/generators/rails/app/templates/config/ci.rb.tt),
  2026-11-01: default gate steps.
- [Rails 8.1 release post](https://rubyonrails.org/2025/10/22/rails-8-1), 2026-11-01: resumable jobs
  and deprecated associations.
- [Rails 8.2 edge release notes](https://edgeguides.rubyonrails.org/8_2_release_notes.html),
  2026-11-01: enqueue after commit, upcoming removals.
- [Ruby 4.0.0 Released](https://www.ruby-lang.org/en/news/2025/12/25/ruby-4-0-0-released/),
  2026-11-01: which JIT runs in production.
- [next_rails](https://github.com/fastruby/next_rails), 2026-11-01: dual boot and deprecation
  baseline.
- [Prosopite](https://github.com/charkost/prosopite), 2026-11-01: repeated-query detection in tests.
- [Securing Rails Applications: Privilege
  Escalation](https://guides.rubyonrails.org/security.html#privilege-escalation), 2026-11-01: record
  lookups scoped to the current user, since any parameter can be changed.
- [Pundit](https://github.com/varvet/pundit), 2026-11-01: after-action check that each action
  authorized or skipped explicitly, a reminder rather than a safeguard.
- [Strong Migrations](https://github.com/ankane/strong_migrations), 2026-11-01: dangerous migration
  operations blocked by default, safer sequences, backfills not detected, lock and statement
  timeouts.
- [ActiveRecord::ModelSchema::ClassMethods](https://api.rubyonrails.org/classes/ActiveRecord/ModelSchema/ClassMethods.html),
  2026-11-01: ignore a column and deploy before the migration that drops it.
- [Active Record Validations](https://guides.rubyonrails.org/active_record_validations.html),
  2026-11-01: uniqueness validation needs a unique index, scope columns included.
- [Rails/UniqueValidationWithoutIndex](https://raw.githubusercontent.com/rubocop/rubocop-rails/master/lib/rubocop/cop/rails/unique_validation_without_index.rb),
  2026-11-01: lint rule for uniqueness without a unique index, inert without the Ruby schema file.
- [rubocop-rails-omakase
  config](https://raw.githubusercontent.com/rails/rubocop-rails-omakase/main/rubocop.yml),
  2026-11-01: Rails lint rules off by default.
- [Rails 8.1 Gemfile
  template](https://raw.githubusercontent.com/rails/rails/8-1-stable/railties/lib/rails/generators/rails/app/templates/Gemfile.tt),
  2026-11-01: new apps get the omakase lint config.
