# Software principles — decision guide

A situation-oriented summary of the engineering principles in this template. Use it to make
consistent decisions when the detailed docs don't address your exact case. When a section
here conflicts with a deep-dive doc, **the deep-dive wins** — this is the map, not the
territory.

**Scope:** a local-first browser SPA — TypeScript, Vite, React, Zod, TinyBase, Vitest. No
backend, no accounts, no server required for core features.

---

## North-star principles

1. **Types encode intent.** A type is documentation the compiler enforces. Make illegal
   states unrepresentable rather than catching them at runtime. Strict mode always; avoid
   `any` (prefer `unknown` + narrowing). → `DESIGN_AND_DEVELOPMENT.md`, `BRANDED_TYPES.md`,
   `CODING_GUIDELINES.md`
2. **Code is the primary artifact.** Write code designed to be read; don't rely on comments
   or docs to carry meaning the code should carry. A comment explaining _what_ code does is
   a bug report against that code — rename, restructure, or split until it's unnecessary.
   Comment only what code can't say: why a non-obvious choice was made. → `CODING_GUIDELINES.md`
3. **Fix problems at the source, not the call site.** Tighten a function's declared type
   rather than casting where it's used. If a cast is truly unavoidable, keep it minimal and
   comment _why_.
4. **Fail loudly on the unexpected.** A state that "can't happen" should **throw**, not fall
   back to a default that hides the bug. Don't suppress the type checker or linter to make an
   impossible case compile — model it and throw. (`noUncheckedIndexedAccess` is on so these
   cases are visible.) → `DESIGN_AND_DEVELOPMENT.md`
5. **Validate at boundaries, trust the interior.** Parse untrusted input once at the edge into
   well-typed values; keep internal code on trusted types and storage on primitives.
   → `BRANDED_TYPES.md`, `COMMAND_LAYER.md`
6. **Local-first, offline-first, data-sovereign.** The app works from first load with no
   server, stores data the user owns, and treats sync as an _additive_ later step — never a
   prerequisite. Export is whole-user and portable. → `PRINCIPLES_AND_GOALS.md`,
   `PROTOTYPE_BASELINE.md`
7. **Layered and composable.** Model operations as small, mostly stateless commands returning
   structured results. One command surface serves UI, scripts, agents, and tests.
   **Decomposability drives testability.** → `COMMAND_LAYER.md`
8. **Testability = maintainability.** Unit tests required for every feature — no exceptions.
   Hard to test is a signal to refactor, not to write a more elaborate test. → `TESTING.md`,
   `TEST_PLAN.md`
9. **Assume features are broken until verified.** Automated tests are necessary, not
   sufficient. End-to-end behavior is confirmed by manual verification. → `SDLC_PROCESS.md`
10. **The safe path is the default path.** `build`, scripts, and workflows do the checked
    thing by default; opting _out_ for speed is the explicit choice (`:dev`, `:fast`).
11. **Portability over convenience.** Core logic must not branch on `typeof window` or
    `process.env`; isolate platform differences in adapters. → `TOOLING.md`, `COMMAND_LAYER.md`
12. **Latest, but pinned.** Run current versions; pin exactly what you build with. Pinning
    makes builds reproducible — it is not an excuse to fall behind. → `MAINTENANCE.md`
13. **Adopt incrementally, retire deliberately.** Add rigor where risk justifies it; remove
    abstractions when their justification lapses. Document limitations honestly.
    → `BRANDED_TYPES.md`

---

## Decision guides by situation

### Choosing a language or tool

- **Default to TypeScript.** **Vite** for build/dev, **Zod** for validation and
  (de)serialization, **React** for UI, **TinyBase** for reactive local persistence,
  **Vitest** for tests. → `DESIGN_AND_DEVELOPMENT.md`, `TOOLING.md`
- Prefer **first-party-TypeScript / strictly-typed** libraries over ones leaning on loose,
  hand-maintained `@types`. Ask: _does this lock us to one environment?_ → `MAINTENANCE.md`
- **Ask before adding a dependency.** A dependency is a permanent obligation, not a
  convenience. → `MAINTENANCE.md`, `AGENT_CONDUCT.md` §10

### Designing types & data

- **Zod schemas are the source of truth** for stored and local-only shapes; derive TS types
  with `z.infer`. Never maintain a type in parallel with its schema. Avoid
  `Record<string, unknown>` in public APIs — name your properties.
- **For anything crossing the wire, the `.proto` owns the shape** — field numbers, `reserved`,
  breaking-change detection — and Zod adds only the semantic constraints proto can't express.
  Don't restate proto field types in Zod. → `SERIALIZATION.md`
- **Sign bytes, never objects.** Verify a signature against the payload bytes as received,
  then decode, then validate. Neither Protobuf nor `JSON.stringify` guarantees canonical
  output, so any re-serialize-then-verify flow eventually fails on identical data.
- Give **public APIs explicit** parameter/return types; let inference handle obvious locals.
- Reach for **branded types** when same-shaped values are realistically confusable
  (`ContactId` vs `GroupId`, `Milliseconds` vs `Seconds`), cross boundaries, or are
  security-sensitive. Brands are compile-time only; store primitives, re-brand on read.
  → `BRANDED_TYPES.md`
- Don't brand low-risk freeform text or generic counters.

### Structuring code, modules & boundaries

- **Small everything.** Short functions (one responsibility; options object beyond a few
  params), small components, custom `useSomething` hooks for stateful logic, composition over
  branchy mega-components. Split files past ~200–300 lines. → `CODING_GUIDELINES.md`
- **Command layer:** model operations as commands returning `CommandResult { success, data?,
error? }`; keep command logic environment-agnostic; inject the clock and randomness;
  centralize cross-cutting resolution in one module. → `COMMAND_LAYER.md`
- Keep a **single source of truth** for shared concerns.

### Validation & error handling

- Validate untrusted input **once, at the boundary**; choose `parseX` (graceful) vs `assertX`
  (abort) by whether failure is expected. → `BRANDED_TYPES.md`
- **Throw on invariant violations.** Distinguish _expected_ failure (untrusted input →
  recoverable, returns an error result) from _programming errors_ (an "impossible" state in
  trusted code → throw). Prefer a throwing accessor over `!` or `?? fallback`.
- Commands return **consistent error codes** and flow through one place — one audit trail,
  unified handling across every entry point. → `COMMAND_LAYER.md`

### Persistence, identity & data ownership

- **Local-first is a hard requirement:** works offline, no server for core features, instant
  render. Persist to a reactive store with a real persister. → `PRINCIPLES_AND_GOALS.md`
- **Sync is additive** — adding a peer or a remote target must not break local-only use.
  Always offer portable **whole-user export/import**. → `PROTOTYPE_BASELINE.md`
- **Storage layout is a contract** (table/index/value names). Don't break it without a
  migration — and note that the migration mechanism is still an open gap.
- **Identity is a keypair.** Sign every outbound message, verify every inbound one. Two
  clocks: signed `ts` for conflict resolution, local `receivedAt` for staleness — never cross
  them. → `PROTOTYPE_BASELINE.md`

### Testing

- **Unit tests required for every feature.** Test schemas, pure utilities, command results,
  and component rendering/interaction. Apply **Arrange/Act/Assert**, **dependency injection**,
  **parameterized** cases. → `TEST_PLAN.md`, `TESTING.md`
- Treat hard-to-test code as a **design smell** → refactor (split units, inject deps, separate
  state from behavior, test behavior not internals).
- **Manual verification is the source of truth for "does it actually work."** Keep a
  dependency-ordered checklist; re-verify after changes, before releases, and after dependency
  upgrades. → `SDLC_PROCESS.md`
- Higher-level **BDD/E2E is intended but not set up**; the decision on record is
  `playwright-bdd` when it lands. → `TESTING.md`
- _Performance-critical exception:_ code optimized for speed may be tested at the boundary
  only if explicitly marked, well-bounded, and isolated.

### Build, deploy & operations

- **Gate the default `build`** (format-check → lint → type-check → build); add a fast `build:dev` opt-out.
  Keep build-critical tooling resolvable under a production-only install.
- **Static analysis is thorough and gated.** Type-aware linting (oxlint + tsgolint) + strict compiler flags; fix,
  never suppress. Quarantine noisy legacy _out of the gate_ and track it in a report until
  it's clean, then fold it back in. → `TOOLING.md`
- **Reproducible builds:** pin the runtime (`.nvmrc`, Active LTS line), commit the lockfile,
  pin CI images. → `MAINTENANCE.md`
- **Versioning & build info:** SemVer from `package.json` + git short-SHA + branch + UTC build
  timestamp + environment, injected via Vite `define` and surfaced in the app. Store UTC,
  display local. → `VERSIONING.md`

### Process & lifecycle

- **Document before coding:** state the **Reason**, **Acceptance Criteria** (specific,
  testable, independent), and **Testing Strategy** for any change. → `SDLC_PROCESS.md`
- **Don't auto-fix a test that a change broke.** Decide whether the _code_ is wrong (fix it)
  or the _test's expectation_ is now wrong (update it deliberately) — never silently adjust a
  test to match new behavior. → `CODING_GUIDELINES.md`, `SDLC_PROCESS.md`
- **Record decisions**, including rejected alternatives. The failure mode isn't a wrong
  decision, it's the same decision made twice.
- **Review the doc set** when the shape of the project changes; produce one prioritized list
  and work it. → `SDLC_PROCESS.md`
- **Be honest about limits.** Maintain the "what we do _not_ commit to (yet)" list so nobody
  is surprised. → `PRINCIPLES_AND_GOALS.md`, **Not addressed** below

### Documentation

- **Write the doc the code can't replace.** Decisions and rationale, not mechanics —
  mechanics duplicate the code and drift. → `DOCUMENTATION_GUIDELINES.md`
- **Start with purpose.** Heading hierarchy, one idea per paragraph, tables for comparisons.
- **Introduce every acronym** on first use, in the doc that uses it. Relative links between
  repo docs; no bare URLs in prose. A link to a file that doesn't exist is a bug.
- **Change the doc in the same commit as the code that invalidates it.**

---

## When in doubt

| Situation                                           | Default move                                                               |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| Type error at a call site                           | Fix the type at its definition; minimal commented cast only as last resort |
| Reaching for `any`                                  | Use `unknown` + narrow, or define an interface                             |
| Two similar values easy to confuse                  | Brand them (if the risk is real and they cross boundaries)                 |
| Untrusted input arrives                             | Parse/assert at the boundary; trust it afterward                           |
| A value "can't" be missing but the type says it can | Throw; don't `!` it or default it away                                     |
| Writing a comment to explain what code does         | Rename or restructure until the comment is unnecessary                     |
| Adding a new operation                              | Model it as a command returning a structured result                        |
| A change breaks a test                              | Decide: wrong code or wrong expectation? Don't silently edit the test      |
| Hard to write a test                                | Refactor the code, don't grow the test                                     |
| "Is it done?"                                       | Not until manually verified against the acceptance criteria                |
| Adding a quality check to the build                 | Fold it into the default script; add a `:dev` fast path                    |
| Choosing a library                                  | Portable, first-party-TypeScript, actively maintained — and ask first      |
| A dependency conflict                               | Resolve forward (upgrade), never by downgrading                            |
| Found dead code / stale config / an unused dep      | Remove it now                                                              |
| Made a real decision                                | Write it down, including what you rejected and why                         |

---

## Settled decisions

Conflicts that were genuinely open at some point and are now resolved. Recorded so the
divergence is deliberate rather than re-litigated.

| Topic                  | Decision                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Casts**              | **Source-fix first.** A cast is allowed only when genuinely unavoidable, and must be minimal and commented.                                                                        |
| **Type-check gating**  | **Gate the default `build`** (format-check → lint → typecheck → build), or enforce equivalently in CI.                                                                             |
| **Verification**       | **Both, layered.** Automated tests are required but necessary-not-sufficient; manual verification gates releases.                                                                  |
| **BDD tooling**        | **`playwright-bdd`** if and when E2E is added — one tool unifying browser E2E and Gherkin, not two.                                                                                |
| **Test artifacts**     | Ephemeral, gitignored output is fine locally; persist and publish artifacts in CI or audit contexts.                                                                               |
| **Terminal CLI**       | **Dropped.** Browser-only, but the **command layer is kept** — its value was testability and composability, not the terminal.                                                      |
| **Pinning vs. latest** | **Both.** Choose the latest stable version; pin exactly what you build with. Pinning is for reproducibility, not for staying behind.                                               |
| **Node version**       | **Active LTS line**, not Current, not maintenance. Derive `.nvmrc` from a verified interpreter rather than copying a number from a doc.                                            |
| **Serialization**      | **Protobuf on the wire, JSON+Zod in the store, JSON for export.** Proto owns structure and evolution; Zod owns semantics. Not a compromise — two different jobs.                   |
| **Canonicalization**   | **Sidestepped, not solved.** Sign and verify opaque payload bytes; never re-serialize before verifying.                                                                            |
| **Protobuf codegen**   | **`ts-proto`** for readable output at this schema size, driven by **`buf`** (lint + breaking detection). `protobuf-es` is the documented alternative if message count grows large. |
| **Linter**             | **oxlint + oxlint-tsgolint**, not typescript-eslint — the latter has no TypeScript 7 support, and pinning the compiler a major behind to keep a linter is the wrong trade.         |
| **Formatter**          | **oxfmt**, the first step of the gated build. One toolchain family; formatting is never a review topic.                                                                            |
| **Routing**            | **TanStack Router, file-based** — the framework's documented default, with `autoCodeSplitting`. The generated route tree is committed so a fresh clone typechecks.                 |
| **Styling**            | **CSS Modules + CSS custom-property tokens**, no dependency. Revisit StyleX at 1.0 with first-party Vite support (`docs/decisions/0001`).                                          |

---

## Not addressed

Open gaps, roughly in the order they'll hurt. This is the single list — when one gets
decided, write it in the doc that owns it and strike it here.

### Will cost you data or trust

1. **Local data migration.** The wire has an evolution discipline (proto field numbers +
   `buf breaking`) and exports carry a format version, but nothing specifies what happens when
   a user's _stored_ data predates the current schema — or postdates it, from a newer build on
   another device. **The sharpest gap in the project:** the data is on the user's device with
   no server-side migration to fall back on, so shipping a store schema change without this is
   shipping irreversible data loss.
2. **Cryptography & key management.** Algorithms are chosen (Ed25519 via WebCrypto); rotation,
   revocation, recovery, and loss are not. Keys are generated extractable so they can be backed
   up — a deliberate trade-off whose exposure has never been reasoned about.
3. **Security hardening.** Input sanitization, secrets handling, supply-chain triage beyond
   `npm audit`, and a threat model for a browser app holding a private key.
4. **Conflict resolution.** Signed-timestamp LWW is specified; LWW silently discards concurrent
   edits. Real merge (CRDTs, MergeableStore) is named, not designed.

### Will slow you down

5. **Git workflow & CI/CD** — branching, commit/PR conventions, pipeline, release automation.
   `AGENT_CONDUCT` §3 covers _who commits_, not how the repo is organized.
6. **A concrete ADR mechanism** — decisions are told to be recorded, with no format or home.
7. **Concurrency & async** — races, cancellation, idempotency, retries, ordering, timeouts.
   Directly relevant once peers exchange state.
8. **Authorization** — identity is modeled; a permission model is not, and there's no server
   to enforce one.
9. **Performance & storage limits** — budgets, profiling, code-splitting; browser storage
   quotas are real, hit quietly, and unaddressed.

### Worth doing, not yet urgent

10. **Accessibility (a11y)** and **i18n/l10n** — absent despite a React/UI focus. `jsx-a11y`
    is in the lint config; that's a linter, not a policy.
11. **Observability** — structured logging and error reporting, constrained by the project's
    own data-ownership stance. The tension is the interesting part.
12. **Privacy & telemetry** — same tension, from the other side.
13. **API/contract design & versioning** for any public surface; deprecation policy.
14. **Reliability & DR** — degradation, backup/restore, recovery.
15. **Responsive and layout standards** — breakpoints and layout primitives. Styling
    mechanism and design tokens are settled (CSS Modules + custom properties); how the app
    behaves across viewport sizes is not.

**Adding one:** say what's missing and _why it matters here_, not just the topic name. A bare
heading is a label, not a gap.

> If you make a real decision in any of these areas, capture it and promote it from "gap" to
> a principle so the next person inherits the reasoning.

---

## Document index

| Doc                           | Covers                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `PRINCIPLES_AND_GOALS.md`     | The **why**: local-first, data ownership, sync-later, what we commit to and don't                                               |
| `PROTOTYPE_BASELINE.md`       | The **concrete defaults**: TinyBase, Trystero P2P, WebCrypto keypair identity, signed envelopes, whole-user export              |
| `DESIGN_AND_DEVELOPMENT.md`   | Stack rationale and **error & failure semantics** (fail loudly)                                                                 |
| `COMMAND_LAYER.md`            | Command surface: `CommandResult`, environment-agnostic logic, injected adapters                                                 |
| `SERIALIZATION.md`            | Protobuf-vs-Zod division of labor, the sign-the-bytes envelope rule, wire/store/export formats, `buf` + `ts-proto` workflow     |
| `BRANDED_TYPES.md`            | Branded strings/numbers, structured IDs, constructor tiers, boundary rules                                                      |
| `CODING_GUIDELINES.md`        | Code-as-primary-artifact, TypeScript/React/function rules, "don't auto-fix tests"                                               |
| `TOOLING.md`                  | React and portability rationale; **linting & static analysis** (type-aware linting via oxlint, rule placement, gate vs. report) |
| `TESTING.md`                  | Testing **philosophy**: tests as a design tool, behavior over implementation                                                    |
| `TEST_PLAN.md`                | Testing **requirements**: the mandate, what to test per layer, coverage, process rules                                          |
| `testing/unit-tests.md`       | Vitest commands, layout, helper conventions                                                                                     |
| `SETUP_NEW.md`                | Standing up a new project: dependencies, strict config, gated scripts, cold verification                                        |
| `MAINTENANCE.md`              | Dependency selection, update cadence, audit triage, pin-vs-latest, removal                                                      |
| `VERSIONING.md`               | SemVer + git/branch/UTC build info injected at build, surfaced in the app                                                       |
| `SDLC_PROCESS.md`             | Reason/Acceptance/Testing-Strategy, "assume broken", verification workflows, doc review                                         |
| `AGENT_CONDUCT.md`            | How AI agents operate here: autonomy by reversibility, never push/deploy, prove before done                                     |
| `DOCUMENTATION_GUIDELINES.md` | Which docs to write at all, structure, acronyms, links, tone                                                                    |
