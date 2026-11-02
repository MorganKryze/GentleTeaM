# C# and .NET

> Helps a developer or reviewer keep C# code on a supported .NET runtime, free of warnings, with
> audited dependencies and tests that really run, and keep libraries ready for trimming.

## When it applies
- Creating, upgrading or reviewing a C# project, library or solution built with the .NET SDK.
- Changing the target framework, the language version or the SDK version.
- Adding, updating or auditing NuGet packages, direct or transitive.
- Writing or changing the build, test or publish steps of a .NET pipeline, including trimmed or
  Native AOT output.
- Enabling nullable reference types in existing code.
- Patching what runs in production to the latest .NET servicing update.
- Shipping a library as a package, or readying it for trimmed or AOT apps.

## Method
1. Check every target framework against the published support dates and plan upgrades from those
   dates. Standard Term Support (STS) releases now get 24 months of support.
2. Before raising the framework, language or SDK version, read its breaking changes and the analyzer
   rules it turns on by default.
3. Keep shared build settings at the repository root:
   - nullable enabled;
   - an analysis mode chosen and the analysis level pinned;
   - code style enforced at build through .editorconfig severities;
   - warnings treated as errors in the configuration that CI builds.
4. Migrate legacy code to nullable file by file, leaf types first, until no file opts out and no
   placeholder null-forgiving value remains.
5. Manage dependencies centrally:
   - keep package versions in one file;
   - use one feed, or map each package to its source;
   - keep the vulnerability audit on, transitive packages included;
   - declare an audit source that serves vulnerability data, nuget.org or its data-only index,
     because without one the feeds stand in and a feed with no data raises no warning;
   - update the package closest to the direct reference first.
6. Run every test project through one runner. Require a minimum test count, fail empty runs, and
   keep coverage as an artifact.
7. For libraries used by trimmed or AOT apps:
   - declare compatibility;
   - prefer source generation to reflection;
   - annotate what must stay dynamic;
   - publish a trimming test app that roots the library.
8. Treat each suppression (warning, advisory, trim warning) as debt: it needs a reason, a tracking
   link and a review date.
9. Keep what runs in production on the latest servicing update of its .NET version, not only on a
   supported version. Updates come about once a month, and each one ends support for the one before:
   - a framework-dependent app by default rolls forward to the newest patch on its host, so patch
     the host;
   - a self-contained app, Native AOT included, by default carries the runtime patch of the SDK that
     published it, so republish it after each update;
   - move the SDK, and its global.json pin if there is one, to each new update.
10. Validate each library shipped as a package against its last stable release when packing, so a
    public API break or a dropped target framework fails the pack. Record an accepted break in the
    committed suppression file, where the pull request reviews it; once that release ships, move the
    baseline to it and clear the file.

## Reflexes
- Does this code use reflection to reach members that a trimmer cannot see?
- Would code compiled against our last release still run against this version without a rebuild?

## What is measured
- Supported targets: no project names an out-of-support framework, and the end-of-life diagnostic is
  never switched off. Verify: scan project and props files against a deny list updated at each end
  of support, and fail on any match.
- Patched runtime: every self-contained or Native AOT artifact in production carries the latest
  runtime patch of its version, and builds use an SDK with no known vulnerabilities. Verify: a
  scheduled job compares the runtime patch recorded at each publish with the latest patch in the
  official machine-readable release files and fails when a newer one exists; with a released .NET 11
  SDK or later, builds also set CheckSdkVulnerabilities and treat NETSDK1238, NETSDK1239 and
  NETSDK1240 as errors, once CI confirms that the release-metadata cache the check reads is filled,
  because an empty cache emits nothing.
- Warning-free release build: the release build exits zero with warnings as errors. Verify: a build
  step in release configuration with warnings as errors, with audit codes excluded.
- Nullable progress: the number of files opting out of nullable never rises. Verify: count the
  opt-out directives and compare the count with a committed baseline.
- Known-vulnerable packages: no audit finding at or above the chosen severity, transitive packages
  included, and every project audited. Verify: a restore job where audit warnings are errors, plus a
  check that the audited and restored project counts match.
- Audit data source: a source that serves no vulnerability data, or cannot be reached, fails the
  audit job instead of passing it. Verify: audit sources declared in the repository's NuGet
  configuration, and NU1900 and NU1905 treated as errors in the audit job along with NU1901 to
  NU1904.
- Tests executed: the run reaches the expected minimum, and an empty run fails. Verify: a test step
  with a minimum expected test count and a strict zero-test policy.
- Trim and AOT readiness of libraries: zero trim or AOT warnings in the library build and in the
  trimming test app publish. Verify: build and publish steps that fail on any such warning.
- Library compatibility: no unreviewed public API break or dropped target framework against the last
  stable release. Verify: a pack step with EnablePackageValidation and
  PackageValidationBaselineVersion set to the last stable version that fails on any compatibility
  error, with accepted breaks only in the committed suppression file.
- Coverage level, the quality of suppressions and the nullability contract of public APIs stay
  judgment: a person reviews them, and no sourced threshold exists.

## Sources
- [.NET 8 and .NET 9 end of
  support](https://devblogs.microsoft.com/dotnet/dotnet-8-9-end-of-support/), 2026-11-01:
  end-of-support date, 24-month rule, .NET 10 support window.
- [What's new in C# 15](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-15),
  2026-11-01: C# 15 features and which one still needs preview.
- [What's new in .NET
  11](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-11/overview), 2026-11-01:
  release status, runtime async, hardware floor, SDK and test changes.
- [NETSDK1138](https://learn.microsoft.com/en-us/dotnet/core/tools/sdk-errors/netsdk1138),
  2026-11-01: end-of-life target diagnostic and the switch that hides it.
- [Code analysis in
  .NET](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/overview), 2026-11-01:
  analysis modes and levels, code style at build, warnings as errors.
- [Nullable migration
  strategies](https://learn.microsoft.com/en-us/dotnet/csharp/nullable-migration-strategies),
  2026-11-01: migration order and end state.
- [TreatWarningsAsErrors without sabotaging dev builds (.NET
  10)](https://startdebugging.net/2026/01/treatwarningsaserrors-without-sabotaging-dev-builds-net-10/),
  2026-11-01: errors in release builds only, suppressions with a tracking link.
- [Auditing package dependencies for security
  vulnerabilities](https://learn.microsoft.com/en-us/nuget/concepts/auditing-packages), 2026-11-01:
  audit modes and codes, dedicated audit job, audited-project check.
- [Central Package
  Management](https://learn.microsoft.com/en-us/nuget/consume-packages/central-package-management),
  2026-11-01: central versions, transitive pinning caveat, source mapping warning.
- [dotnet test](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-test), 2026-11-01: test
  runner selection and default.
- [dotnet test with MTP](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-test-mtp),
  2026-11-01: minimum test count, zero-test policy, coverage, exit codes.
- [Prepare .NET libraries for
  trimming](https://learn.microsoft.com/en-us/dotnet/core/deploying/trimming/prepare-libraries-for-trimming),
  2026-11-01: trim and AOT flags, trimming test app, annotation advice.
- [Self-contained deployment runtime roll
  forward](https://learn.microsoft.com/en-us/dotnet/core/deploying/runtime-patch-selection),
  2026-11-01: a self-contained publish by default takes the runtime patch the publishing SDK has,
  and only a republish brings a newer one.
- [.NET releases, patches, and
  support](https://learn.microsoft.com/en-us/dotnet/core/releases-and-support), 2026-11-01: monthly
  servicing updates, support limited to the latest one, default patch roll-forward of
  framework-dependent apps.
- [Native AOT deployment
  overview](https://learn.microsoft.com/en-us/dotnet/core/deploying/native-aot/), 2026-11-01: Native
  AOT output is self-contained and carries its own runtime.
- [NETSDK1238](https://learn.microsoft.com/en-us/dotnet/core/tools/sdk-errors/netsdk1238),
  2026-11-01: opt-in SDK vulnerability check and its sibling codes, cache that stays silent when
  never filled, availability from .NET 11 Preview 5, global.json update.
- [.NET release notes](https://github.com/dotnet/core/blob/main/release-notes/README.md),
  2026-11-01: machine-readable release index and per-version release files, monthly patches often
  carrying CVE fixes.
- [Audit sources](https://learn.microsoft.com/en-us/nuget/concepts/auditing-packages#audit-sources),
  2026-11-01: package feeds used and NU1905 hidden when no audit source is declared, data-only
  nuget.org index.
- [NU1905](https://learn.microsoft.com/en-us/nuget/reference/errors-and-warnings/nu1905),
  2026-11-01: meaning of the warning and making it an error when vulnerability checks cannot run.
- [Baseline package
  validator](https://learn.microsoft.com/en-us/dotnet/fundamentals/apicompat/package-validation/baseline-version-validator),
  2026-11-01: baseline version, breaking changes and dropped frameworks failing the pack, committed
  suppression file, baseline moved after release.
- [Breaking changes and .NET
  libraries](https://learn.microsoft.com/en-us/dotnet/standard/library-guidance/breaking-changes),
  2026-11-01: binary breaking changes and their effect on consumers.
