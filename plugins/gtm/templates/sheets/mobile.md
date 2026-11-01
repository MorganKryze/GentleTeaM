# Mobile app engineering

> Helps a role plan, ship and run a phone or tablet app against the rules and field measures of its
> platforms and stores.

## When it applies
- Building or changing an app installed from a store on phones or tablets, whether native,
  cross-platform or hybrid.
- Preparing a store submission, a version update or a staged release.
- Investigating crashes, freezes, slow startup or memory problems seen in the field.
- Adding a third-party SDK, a permission, credentials, personal data or network calls.
- Designing or reviewing screens for accessibility.

## Method
1. Before planning work, check the build against each store rule in force or announced: target
   platform level, build SDK, minimum OS, declared reasons for listed APIs, third-party SDKs
   included.
2. Read quality as a store computes it: crash and not-responding rates per daily active user,
   overall and per device model, over a rolling window; set team thresholds below the published
   ones.
3. Budget startup and responsiveness: optimize cold start, measure time to initial and to full
   display (the app must signal the latter), and track memory per app state.
4. Treat every shipped binary as permanent: risky changes behind remotely switchable flags, a fixed
   release cadence with a named owner, progressive releases.
5. Promote a progressive release only when the exposed cohort is under threshold; otherwise halt,
   switch the flag off and ship a fixed version.
6. Take security and privacy requirements from the OWASP MASVS control groups, test against the
   chosen profile, and keep an inventory of third-party dependencies with the data and APIs they
   use.
7. Review new or changed screens against WCAG 2.2 A and AA as read for mobile: platform
   accessibility services, system text size, orientation, single-pointer gestures, target size,
   colour never alone.
8. Read background battery use as a store judges it: the share of user sessions whose combined wake
   locks held in the background or during a foreground service reach 2 hours in 24 (system-held
   locks with a clear user benefit that cannot be optimized further, such as audio playback, are
   exempt), over a rolling 28 days, against the published 5%; set a team threshold below it and
   investigate any lock whose 90th or 99th percentile hold passes 60 minutes.
9. Build version retirement into the first release: the app reports its version at launch and on
   every server call, the server keeps a minimum supported version it can raise, below it the app
   blocks behind an update prompt, and a soft prompt runs for months before any cut-off; keep server
   contracts working for every supported version, and force updates only for critical defects, legal
   duties or retiring a server interface.
10. Give every change to on-device stored data a migration path from each older schema version:
    export each schema into version control, test each migration and the whole chain on data seeded
    in the old schema, and check the data as well as the schema; a missing path raises an exception
    and a destructive fallback wipes the user's data for good.

## Reflexes
- If this version turns out bad, who already has it, and how do we switch the change off without a
  new binary?
- Which store rule takes effect before our next release, and does today's build meet it?
- Is this rate counted per user per day or per session, and which one does the store judge?
- What runs on the main thread at startup and on each tap, and can it wait or move off?
- Which third-party dependency is new here, what data does it collect, and is it declared?
- Does this screen work with a screen reader, at the largest system text size and in both
  orientations?

## What is measured
- Per-user crash and not-responding rates of the exposed version, overall and per device model above
  a user floor: a `verify` step reads the daily export and blocks promotion above team thresholds.
- Store rules (target platform level, build SDK, minimum OS): a `verify` step checks build values
  against a dated rules table, failing on rules in force and warning on announced ones.
- Cold start to initial and to full display on a reference device, median of several runs: a
  `verify` step against a versioned budget.
- Memory per app state on reference devices against the store's published limits: a `verify` step
  once lab measures exist.
- Third-party dependencies: a `verify` step fails on any dependency missing from the inventory.
- Security: MASVS-based tests can run as steps; the threat model and the choice of profile stay
  judgment.
- Accessibility: minimum target size can be counted; screen-reader and text-size walkthroughs stay
  judgment, recorded per screen.
- Share of sessions with excessive wake locks over 28 days, against a team threshold under the
  published 5%: read at each release review, and a `verify` step once the store's figure can be
  exported; which lock to shorten stays judgment.
- Minimum supported version: a `verify` step serves a minimum above the build's own version and
  expects the blocking update prompt, and the oldest supported version is tested against each server
  change; when to raise the minimum stays judgment.
- On-device data: a `verify` step fails when the stored schema changes without a newly exported
  version and its migration, when a migration test (each step and the whole chain, on seeded old
  data) fails its schema or data checks, or when a destructive fallback is not confined to listed
  versions.

## Sources
- [Android vitals](https://developer.android.com/topic/performance/vitals), 2026-11-01: per-user
  crash and ANR thresholds, memory thresholds from February 2027.
- [App startup time](https://developer.android.com/topic/performance/vitals/launch-time),
  2026-11-01: cold start, time to initial and to full display.
- [Release a version update in
  phases](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases),
  2026-11-01: 7-day phased release and its limits.
- [Staged rollouts](https://support.google.com/googleplay/android-developer/answer/6346149),
  2026-11-01: manual percentages, a halt keeps exposed users on the version.
- [Target API level
  requirements](https://developer.android.com/google/play/requirements/target-sdk), 2026-11-01:
  target level for new apps and updates from 31 August 2026.
- [Upcoming requirements](https://developer.apple.com/news/upcoming-requirements/), 2026-11-01:
  build SDK minimum, declared reasons for listed APIs.
- [OWASP MASVS](https://mas.owasp.org/MASVS/), 2026-11-01: eight control groups, weaknesses, testing
  guide, profiles.
- [OWASP Mobile Top 10 2024](https://owasp.github.io/www-project-mobile-top-10/2023-risks/),
  2026-11-01: final risk list.
- [WCAG2Mobile](https://www.w3.org/TR/wcag2mobile-22/), 2026-11-01: non-normative mobile reading of
  WCAG 2.2 A and AA.
- [Release
  trains](https://bitrise.io/blog/post/5-ways-the-best-mobile-teams-use-release-trains-for-increased-speed-and-efficiency),
  2026-11-01: fixed cadence, release owners, remote flags.
- [Excessive partial wake locks](https://developer.android.com/topic/performance/vitals/wakelock),
  2026-11-01: 2 or more combined hours in 24 counted in the background or during a foreground
  service, exemptions for locks with a clear user benefit, more than 5% of sessions over 28 days.
- [Excessive partial wake locks metric out of
  beta](https://developer.android.com/blog/posts/raising-the-bar-on-battery-performance-excessive-partial-wake-locks-metric-is-now-out-of-beta),
  2026-11-01: core vital, discovery and listing-warning impact from 1 March 2026, investigate locks
  with P90 or P99 over 60 minutes.
- [In-app updates](https://developer.android.com/guide/playcore/in-app-updates), 2026-11-01: a
  blocking full-screen update flow best for updates the app cannot do without.
- [What was the force upgrade process at
  Uber?](https://www.bitrise.io/blog/post/q-and-a-on-building-apps-at-scale-part-1), 2026-11-01:
  build forced update early, its uses (serious defects, retiring server interfaces, legal duties), a
  months-long grace period with soft prompts.
- [How to properly support older versions of your mobile
  app](https://www.mobilespoon.net/2018/05/the-long-tail-of-mobile-apps.html), 2026-11-01: app
  version on every call, startup check against a server minimum, version-aware server responses,
  sparing use.
- [Migrate your Room
  database](https://developer.android.com/training/data-storage/room/migrating-db-versions),
  2026-11-01: missing path fails, destructive fallback deletes all data, exported schemas, tests per
  migration and for the whole chain.
