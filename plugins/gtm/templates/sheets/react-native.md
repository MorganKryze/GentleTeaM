# React Native and Expo

> Helps a mobile engineer or reviewer upgrade, test and ship a React Native app built with Expo
> without breaking the builds users already run.

## When it applies
- Building or reviewing features in a React Native app that uses the Expo SDK, CLI, router, or
  Expo's build and update services.
- Upgrading the Expo SDK or React Native, or adding, removing or bumping a library that ships native
  code.
- Deciding whether a change can go out as an over-the-air update or needs a new store build.
- Setting up or reviewing CI gates: dependency health, typed API, end-to-end smoke tests, update
  rollout.
- Diagnosing a regression after an engine, architecture or build-toolchain change.

## Method
1. Fix the baseline: record the Expo SDK, the React Native version and the toolchain minimums the
   release notes require. Read the deprecations, breaking changes and known regressions of every
   release you cross.
2. Treat native projects as generated output: native changes live in named config plugins, and the
   native folders are regenerated on each upgrade. Projects with hand-managed native code follow the
   native upgrade helper instead.
3. Before adopting a library with native code, check its New Architecture support and upkeep in the
   community directory. SDK 55 and later run entirely on the New Architecture, so a library
   incompatible with it is a blocker.
4. Upgrade on a branch: align dependencies with the SDK's installer, run the project health check,
   regenerate native code, make a fresh development build, then run the smoke flows.
5. Target a patch release that fixes the known regressions rather than the first publication of an
   SDK.
6. Choose the runtime-version policy on purpose. Before any over-the-air publish, compare the native
   fingerprint with the target build's: a change means a store build.
7. Publish updates to a preview channel on the same runtime first, then roll out in stages while
   watching error rates, ready to roll back.
8. Import React Native only through its public typed entry point, never through internal paths.
9. Develop and test on development builds. Expo Go follows one SDK at a time and suits trials, not
   production work.
10. Turn on the React compiler's automatic memoization incrementally, lint with its rules, and
    measure before deleting manual memoization.
11. Release each store build in stages. On Android, use a staged rollout: the submit profile can set
    its starting fraction, and the fraction only rises when someone raises it. On iOS, use the
    seven-day phased release. It only paces automatic updates, so anyone can still download the
    version manually. Watch each stage for crashes before widening it. Halting or pausing limits who
    gets a store binary next; on Android, users who already have it keep it, and a fix ships as a
    new release.

## Reflexes
- Does this change touch the native layer? Then it cannot reach installed builds over the air.
- Which dependency here ships native code, and when were its New Architecture status and upkeep last
  checked?
- Which API used here is deprecated in the target release, and when is it removed?
- Was this performance gain measured on our app and our weakest devices, or quoted from another
  team's single-app benchmark?
- If an update needs native code the binary lacks, what stops it before users see it, and how fast
  can it be rolled back?
- Which values does this bundle inline, and from where? Anyone who has the app or an update can read
  `EXPO_PUBLIC_` variables and anything else in client code, whatever visibility the build service
  gives them, so secrets stay on a server. An update inlines the values found where it is bundled,
  so name its target environment when publishing.
- Who wrote these sources?

## What is measured
- Dependency health: the project health check reports no failure (directory compatibility, upkeep,
  known issues). Verify step: run it on every change; any failure fails the step.
- Native and over-the-air compatibility: the native fingerprint at publish time equals the target
  store build's. Verify step: compute the project hash, compare it with the stored baseline, and
  block the publish on a mismatch.
- Typed public API: the type check passes and the config carries no legacy deep-import opt-out.
  Verify step: run the type check, then search the config for the opt-out condition.
- End-to-end smoke: the critical flows pass on a test build of the release configuration. Verify
  step: run them on each pull request and track the flake rate.
- Update health: the error rate of a staged rollout compared with the previous update. Verify step:
  halt the rollout when it rises; the threshold stays judgment.
- Upgrade lag: how many SDK releases behind the latest, and how much time is left in the support
  window. Verify step: compare the installed SDK major with the latest; when to take an optional
  release stays judgment.
- Store minimums: the release build's Android target API level and iOS build SDK, against each
  store's dated minimum for new apps and updates. Verify step: on every release, compare both with
  the stores' published minimums. Fail when the build is below a minimum already in force, because
  that store then refuses the upload, native fixes included. How early to move for the next dated
  minimum stays judgment.
- Performance: startup time and memory on the team's own low-end devices after an engine or compiler
  change. This stays judgment until a baseline exists, then becomes a threshold check.

## Sources
- [Expo SDK 58](https://expo.dev/changelog/sdk-58), 2026-11-01: current SDK, breaking changes,
  upgrade steps, default fingerprint preset.
- [Expo SDK 57](https://expo.dev/changelog/sdk-57), 2026-11-01: optional near-immediate upgrades,
  clean prebuild by default, patch versions fixing Hermes V1 regressions.
- [Expo SDK 56](https://expo.dev/changelog/sdk-56), 2026-11-01: Hermes V1 as default engine and the
  regressions it shipped with.
- [React Native 0.87](https://reactnative.dev/blog/2026/08/11/react-native-0.87), 2026-11-01: strict
  typed API by default and its opt-out window.
- [React Native blog](https://reactnative.dev/blog), 2026-11-01: release cadence and New
  Architecture timeline.
- [Expo: New Architecture](https://docs.expo.dev/guides/new-architecture/), 2026-11-01: no opt-out
  from SDK 55, directory check settings.
- [Expo: Continuous Native
  Generation](https://docs.expo.dev/workflow/continuous-native-generation/), 2026-11-01: generated
  native projects, config plugins, limits.
- [Expo: runtime versions](https://docs.expo.dev/eas-update/runtime-versions/), 2026-11-01: runtime
  policies, preview channels, staged rollouts.
- [Expo: Fingerprint](https://docs.expo.dev/versions/latest/sdk/fingerprint/), 2026-11-01: project
  hash, presets, caveats.
- [Expo: E2E tests on EAS Workflows](https://docs.expo.dev/eas/workflows/examples/e2e-tests/),
  2026-11-01: test build profile and flows on pull requests.
- [Expo: React Compiler](https://docs.expo.dev/guides/react-compiler/), 2026-11-01: incremental
  enablement, lint rules, exclusions.
- [Ditto: The State of React Native in
  2026](https://ditto.com/blog/the-state-of-react-native-in-2026), 2026-11-01: single-app
  performance figures, a reason to measure locally.
- [Google Play: staged
  rollouts](https://support.google.com/googleplay/android-developer/answer/6346149?hl=en),
  2026-11-01: rollout fraction raised by hand only, halting stops new recipients, existing
  recipients keep the version, fixes ship as a new release.
- [App Store Connect: phased
  release](https://developer.apple.com/help/app-store-connect/update-your-app/release-a-version-update-in-phases),
  2026-11-01: seven-day schedule for automatic updates only, manual downloads outside it, pauses
  capped at 30 days in total.
- [Expo: eas.json reference](https://docs.expo.dev/eas/json/), 2026-11-01: Android submit profile's
  initial rollout fraction, applied only with an in-progress release status.
- [Expo: environment variables](https://docs.expo.dev/guides/environment-variables/), 2026-11-01:
  public-prefixed variables inlined in plain text, no secrets in them, updates inline the env files
  present where they are bundled.
- [Expo: EAS environment variables](https://docs.expo.dev/eas/environment-variables/), 2026-11-01:
  client code is public whatever a variable's visibility, environment flag for update publishing.
- [Android: target API level
  requirements](https://developer.android.com/google/play/requirements/target-sdk), 2026-11-01: API
  36 for new apps and updates from 2026-08-31, extension to 2026-11-01, narrower availability for
  old targets.
- [Apple: upcoming requirements](https://developer.apple.com/news/upcoming-requirements/),
  2026-11-01: uploads built with Xcode 26 and the iOS 26 SDK since 2026-04-28.
