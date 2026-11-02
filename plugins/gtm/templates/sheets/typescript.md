# TypeScript

> Helps a role configure, check and ship TypeScript so that the type checker, not production, finds
> the defect.

## When it applies
- Writing or reviewing TypeScript code, type definitions or compiler configuration.
- Upgrading the compiler across a major version, or changing module, resolution, target or
  project-reference settings.
- Running TypeScript files directly on a runtime that strips types, with no build step.
- Publishing a package with type declarations, or sharing types between teams.
- Bringing untrusted data (requests, messages, files, environment) into typed code.
- Investigating slow type checking.

## Method
1. Make the compiler configuration explicit: set `strict`, `types`, `module`, `target`, and
   `rootDir` when the project emits; keep no deprecated option and no `ignoreDeprecations`.
2. Add `noUncheckedIndexedAccess` and `noImplicitOverride` on top of `strict`; turn on
   `verbatimModuleSyntax`, and `erasableSyntaxOnly` for code that a type-stripping runtime executes.
3. Upgrade one major version at a time. Get the code clean on 6.0 and compare its declaration output
   under the new type ordering. Then move the check to 7.0, and keep the 6.0 API only for tools that
   still load it.
4. Check types in the gate with the compiler in no-emit mode, with checker parallelism pinned to the
   same value on every machine.
5. Run type-aware lint rules for unhandled promises, unsafe `any` flows and unbound methods, and
   know which compiler version the linter loads.
6. At every trust boundary, validate the value at runtime with a schema whose inferred output is the
   static type; in shared code, accept a library-neutral schema interface.
7. Write code that the checker handles cheaply: annotate the return types of exported functions,
   extend interfaces instead of stacking intersections, prefer a base type to a very large union,
   and name complex conditional types.
8. For published types, write type assertion tests and check the packed package's type resolution in
   every module mode consumers use.
9. When checking slows down, measure before changing anything: extended diagnostics first, then file
   inclusion explanations, then a trace.
10. Configure the checker for the host that runs the code: `module` and `moduleResolution` for the
    runtime or bundler that loads it, `target` and `lib` no newer than the oldest runtime supported,
    and type packages for the runtime at the version deployed; `lib` declares APIs and never
    supplies them.
11. When the configuration uses project references, run the gate's type check in build mode over the
    solution configuration: a no-emit check of one configuration skips the projects it references,
    and one that only lists references checks nothing.
12. Make the checker prove every union member is handled: give each switch over a union or enum a
    default branch that assigns the narrowed value to `never`, and run the type-aware switch
    exhaustiveness rule without counting a default branch as handling a member.

## Reflexes
- Does this project rely on a default that changed in 6.0: `strict`, `types`, `rootDir`, `module` or
  `target`?
- Would this file still run if every type annotation became whitespace?
- Does this `any`, `as` assertion or expected-error directive hide the error I care about, or just a
  typo?

## What is measured
- Errors from the compiler's no-emit check under the strict configuration: zero. A `verify` step
  runs the check and fails on any error.
- Deprecated or removed compiler options in configuration files, `ignoreDeprecations` included:
  zero. A `verify` step scans the configuration files.
- Type-aware lint findings for unhandled promises and unsafe `any` flows: zero. A `verify` step runs
  the linter in type-aware mode.
- Type assertion tests: all pass. A `verify` step runs the compiler over the type test files.
- Type resolution problems in the packed package under the chosen resolution profile: zero. This
  becomes a `verify` step once the checker's exit code is confirmed.
- Type-check time and memory from the compiler's extended diagnostics: recorded on every build. The
  threshold that triggers work stays judgment.
- Trust boundaries covered by runtime validation: judgment at review; no tool measures it.
- `target`, `lib`, module settings and runtime type package versions matched to the oldest host the
  code ships to: judgment at review; once they match, the no-emit check rejects APIs that host lacks
  and imports it cannot resolve.
- Projects in the reference graph left out of the gate's type check: zero. A `verify` step runs the
  check in build mode over the solution configuration.
- Switches over a union or enum that miss a member: zero. A `verify` step runs the type-aware switch
  exhaustiveness rule with default branches not counted as exhaustive.

## Sources
- [Announcing TypeScript 6.0](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/),
  2026-11-01: changed defaults, deprecated options, the type-ordering flag.
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/),
  2026-11-01: native compiler, hard errors, missing API, migration path, parallelism flags.
- [Node.js, Modules: TypeScript](https://nodejs.org/api/typescript.html), 2026-11-01: type stripping
  limits and recommended compiler options.
- [typescript-eslint issue
  10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940), 2026-11-01: status of
  type-aware linting on the native compiler.
- [Oxc, Type-Aware Linting](https://oxc.rs/docs/guide/usage/linter/type-aware.html), 2026-11-01:
  native type-aware rule coverage and its limits.
- [Standard Schema](https://standardschema.dev/), 2026-11-01: the shared validation interface and
  its result contract.
- [Vitest, Testing Types](https://vitest.dev/guide/testing-types.html), 2026-11-01: type assertion
  tests and the expected-error pitfall.
- [arethetypeswrong
  CLI](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/packages/cli/README.md),
  2026-11-01: packed-package checks and resolution profiles.
- [TypeScript wiki, Performance](https://github.com/microsoft/TypeScript/wiki/Performance),
  2026-11-01: code shapes that check fast and the investigation flags.
- [TSConfig Cheat Sheet](https://www.totaltypescript.com/tsconfig-cheat-sheet), 2026-11-01:
  strictness flags beyond `strict` (page from 2024, used only for options unchanged since).
- [TypeScript Handbook, Modules: Choosing Compiler
  Options](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html),
  2026-11-01: module settings per host, bundler resolution letting through imports a runtime
  rejects, and `target` implying `lib`.
- [TSConfig Reference, lib](https://www.typescriptlang.org/tsconfig/lib.html), 2026-11-01: `lib` as
  type definitions for APIs the runtime or a polyfill must supply.
- [DefinitelyTyped
  README](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/README.md), 2026-11-01:
  type packages align their major and minor version with what they describe.
- [TypeScript Handbook, Project
  References](https://www.typescriptlang.org/docs/handbook/project-references.html), 2026-11-01:
  solution configurations with an empty file list, and referenced projects built only in build mode.
- [create-vue issue 159](https://github.com/vuejs/create-vue/issues/159), 2026-11-01: a no-emit
  check over a references configuration leaving referenced projects unchecked, and the move to build
  mode.
- [TypeScript Handbook, Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html),
  2026-11-01: exhaustiveness checking through a `never` assignment.
- [typescript-eslint,
  switch-exhaustiveness-check](https://typescript-eslint.io/rules/switch-exhaustiveness-check/),
  2026-11-01: the type-aware exhaustive switch rule and the option that keeps a default from
  counting as exhaustive.
