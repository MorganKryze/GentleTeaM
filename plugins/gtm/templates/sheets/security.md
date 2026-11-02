# Security

> Helps any role that designs, builds, ships or answers for software decide what to protect, gate
> what can be measured, and respond in time when a weakness is exploited.

## When it applies
- A change touches authentication, authorization, sessions, or data that belongs to another user or
  tenant.
- A new interface, integration, data flow or trust boundary is designed.
- An error, timeout, retry or fallback path is written or changed.
- A dependency, a build or release step, or CI permissions are added or changed.
- A release is prepared for customers or for a public registry.
- A vulnerability report, a dependency advisory or a sign of exploitation arrives.
- A secret or credential, a deployment or environment setting, or a security log or alert is added
  or changed.

## Method
1. Early in the change, model it from varied viewpoints: what are we working on, what can go wrong,
   what are we going to do about it, did we do a good enough job. Record the answers and revisit
   them as the design changes.
2. Review authorization first: for each operation, who may do it on which object, checked on the
   server. Outbound requests to user-supplied addresses belong to this review.
3. Review error, timeout and fallback paths as security paths; the current awareness list gives
   mishandling of exceptional conditions a category of its own.
4. Select the in-scope requirements of the verification standard (ASVS, by level) and cite each
   version-prefixed ID where it is tested or reviewed.
5. Keep the supply chain checkable: dependencies declared and pinned, CI tokens read-only, no
   dangerous CI patterns, an update tool running, known-vulnerable dependencies blocked.
6. Release with integrity: protected branches, reviewed changes, and signed releases or build
   provenance that consumers verify. Aim for a level on the build and source tracks (SLSA).
7. Verify with access to internal artifacts: black-box testing alone is insufficient.
8. Map each confirmed flaw to its root-cause weakness at Base or Variant level whenever possible
   (CWE), then feed it back into the threat model and the gates.
9. Publish a security policy. Where the EU Cyber Resilience Act applies, keep a runbook for actively
   exploited vulnerabilities and severe incidents: early warning within 24 hours of becoming aware,
   notification within 72 hours, final report no later than 14 days after a corrective measure is
   available, or one month after notification for an incident.
10. Keep secrets out of code, history and logs: catch them before commit and scan the whole history.
    Prefer federated or short-lived credentials over stored static secrets, with pipeline
    credentials that expire when the job ends. On a leak, first revoke the key, then rotate it, then
    remove it from code and logs. Removing it from the history is time-intensive and often
    unnecessary once the key is revoked.
11. Ship and deploy secure by default: no default accounts or passwords, no unused features, ports,
    pages or samples, no stack traces shown to users, and security settings and headers set to
    secure values. Build every environment from one repeatable hardening process, give each its own
    credentials, and check the settings automatically in all of them.
12. Make exploitation visible: ensure every failed login, access-control denial and server-side
    input-validation failure can be logged with enough user context to investigate. Write logs in a
    format log tools can parse, encode log data against injection, keep secrets and personal data
    out, protect logs against tampering and keep a copy off the host. Give each alert a threshold
    and an escalation path. A penetration test or scan that raises no alert points to this failure.

## Reflexes
- On the error, timeout or partial-failure path, what access or state is left behind?
- Which outside code does this change trust, pinned to what, and who checks where it was built?
- Which version-prefixed requirement IDs does this change touch, and which are tested rather than
  only reviewed?
- If the change adds an AI component, which separate requirements cover it, since the general
  verification standard leaves AI out?
- Is this ranking move real, or an effect of unnormalized mappings?
- If this flaw were exploited tomorrow, who files the 24-hour early warning, and through which
  channel?

## What is measured
- Known vulnerabilities in shipped dependencies at or above the written severity threshold: zero. A
  `verify` step runs the team's dependency audit and fails on any hit.
- Untriaged static-analysis findings at or above the written severity threshold: zero. A `verify`
  step runs the analyzer and fails otherwise.
- Repository hygiene (pinned dependencies, read-only CI tokens, no dangerous CI patterns): checked
  by a `verify` step. A 0-10 practice score does not pass or fail anything by itself, so the team
  writes the threshold.
- Requirement traceability: every in-scope requirement ID is cited by a test or a dated review note.
  `verify` fails on any gap and on an empty scope list.
- Release integrity: every published artifact carries verifiable provenance or a signature. `verify`
  checks each one and fails closed when there is nothing to check.
- Security policy present and non-empty: a one-line `verify` check.
- Untriaged secret-scanner hits across the repository and its history: zero. A `verify` step runs
  the scanner and fails otherwise. A real secret counts as triaged only once it has been revoked.
- Secure configuration: `verify` compares each environment's settings with the hardening baseline
  (no default credentials, no unused or debug features, security headers set) and fails on any
  deviation. A setting that cannot be checked automatically should get a dated manual review at
  least once a year.
- Security events: for failed logins, access-control denials and server-side input-validation
  failures, a test asserts a parseable log entry with user context, and `verify` runs those tests.
  Whether alerts are received and reviewed in time stays judgment, tested by whether penetration
  tests and scans raise one.
- Judgment, not gate: the quality of a threat model, whether a vulnerability is actively exploited
  or an incident severe, the choice of verification level, and priorities drawn from rankings.

## Sources
- [OWASP Top 10:2025](https://top10.owasp.org/2025), 2026-11-01: the ten 2025 categories and the
  list's awareness role.
- [MITRE, 2025 CWE Top 25 Key
  Insights](https://cwe.mitre.org/top25/archive/2025/2025_key_insights.html), 2026-11-01: rising
  authorization weaknesses, mapping caveats, Base or Variant root-cause mapping.
- [OWASP ASVS](https://asvs.owasp.org/), 2026-11-01: version 5.0.0 and version-prefixed requirement
  IDs.
- [SoftwareMill, What's new in ASVS 5.0](https://softwaremill.com/whats-new-in-asvs-5-0/),
  2026-11-01: level changes, black-box testing alone insufficient, AI left to a separate standard.
- [SLSA specification](https://slsa.dev/spec/), 2026-11-01: v1.2 approved with Build and Source
  tracks.
- [SLSA v1.2, What's new](https://slsa.dev/spec/v1.2/whats-new), 2026-11-01: the Source track and
  its levels 2 and 3.
- [OpenSSF Scorecard](https://github.com/ossf/scorecard), 2026-11-01: repository practice checks,
  risk weights, no described pass threshold.
- [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/), 2026-11-01: the four
  questions, early and frequent analysis, following design changes, varied viewpoints, recording
  what was understood.
- [European Commission, CRA
  reporting](https://digital-strategy.ec.europa.eu/en/policies/cra-reporting), 2026-11-01: what to
  report, deadlines and channel.
- [Orca Security, OWASP Top 10 2025 key
  changes](https://orca.security/resources/blog/owasp-top-10-2025-key-changes/), 2026-11-01: SSRF
  folded into access control, server-side access checks.
- [OWASP Secrets Management Cheat
  Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html),
  2026-11-01: detection before commit, false positives, pipeline credentials that expire after the
  job, secrets never logged, revocation then rotation then removal.
- [GitHub Docs, About secret
  scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning),
  2026-11-01: scanning the entire history, rotating a leaked credential at once, history cleanup
  often unnecessary once the credential is revoked.
- [OWASP Top 10:2025, A02 Security
  Misconfiguration](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration), 2026-11-01:
  move up to second place with every tested application affected, default accounts, unused features,
  stack traces, security headers, repeatable hardening, automated checks in all environments or a
  yearly manual review, federated short-lived credentials.
- [OWASP Top 10:2025, A09 Security Logging and Alerting
  Failures](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures),
  2026-11-01: failures to log with user context, parseable and encoded logs, tamper-protected trails
  not kept only on the host, alert thresholds and escalation, scans that raise no alert, difficulty
  of testing.
