# Tooling

Why the tools are what they are, and how the quality gates work.

## User interface

**React.** It centers on data changes driving display updates, and it isn't bound to one
rendering target — the same model has been carried to several environments. That
portability is the reason it's the default here, not familiarity.

**TanStack Router** for routing, using **file-based routes** — the framework's documented
default. `src/routes/` maps to URLs, and `src/routeTree.gen.ts` is produced by the Vite
plugin. Following the convention matters more than usual in a template: people cloning it
expect the idiomatic setup, and coding agents have seen far more of the standard pattern than
of any local variant. `autoCodeSplitting` is on, so each route ships its own JS and CSS chunk.

The generated route tree is **committed** — `tsc` doesn't run Vite plugins, so a fresh clone
must typecheck without a build first — and excluded from the linter and formatter.

**Styling** is CSS Modules with custom-property design tokens, and no dependency. Reasoning
and the rejected alternatives: `docs/decisions/0001-css-modules-over-stylex.md`.

## Portability

**Prefer choices that don't lock the code to one environment.** How that constraint applies
to application logic — no `typeof window`, platform differences behind injected adapters — is
in [COMMAND_LAYER.md](COMMAND_LAYER.md).

Here it's a **library selection criterion**. The question to ask of any dependency is whether
adopting it forecloses an environment: does it assume Node built-ins, a bundler, a DOM? This
template targets the browser, but a library that runs only in a browser is a library you
can't call from a worker, a test harness, or a WASM target later. **WASM-friendly choices**
are preferred for the same reason.

## Linting & static analysis

Static analysis is a first-class quality tool, not an afterthought. Use the **most thorough**
option available and let it find real bugs, not just style nits.

### What to run

- **Type-aware linting.** Use **oxlint** with **oxlint-tsgolint** (`oxlint --type-aware`).
  Type-aware rules catch whole classes of real bugs — floating promises, misused promises,
  unsafe `any` flow, conditions that can never be false — that syntax-only linters cannot see.
  This is the reason linting is a gate at all; a linter without type information is a style
  checker.
- **Categories are the preset mechanism.** oxlint has no named rule sets — `extends` takes file
  paths, not preset names. `correctness` + `suspicious` + `pedantic` is the working baseline and
  already covers most type-aware rules: floating and misused promises, the unsafe-`any` family,
  `await-thenable`, `return-await`, `require-await`, `eqeqeq`. **Don't re-list those** — a
  hand-maintained rule inventory drifts from the categories that already contain it.
- **Name only what the baseline misses**, and know why each is outside it:

  | Rule                       | Lives in      | Why we enable it                                   |
  | -------------------------- | ------------- | -------------------------------------------------- |
  | `no-explicit-any`          | `restriction` | Stylistic tier upstream; non-negotiable here       |
  | `no-non-null-assertion`    | `restriction` | Same — `!` is banned by the fail-loudly rule       |
  | `no-unnecessary-condition` | **`nursery`** | Catches unreachable branches; see the caveat below |

  `prefer-readonly-parameter-types` comes from `pedantic` and is **turned off — on evidence,
  not preference.** It is philosophically the right rule here ("types encode intent" applied
  to mutation, which matters when payloads flow through signing and merge), and it was
  enabled first. Against real code it produced 15 errors, every one of them on a type we
  don't own: TinyBase's `Store` and `Row`, React's `FormEvent` and `ErrorInfo`, and `Error`
  itself. None can be made readonly, and the only escapes are casts — which the fail-loudly
  rule forbids. **Revisit if commands ever take a narrowed store interface** rather than
  TinyBase's `Store` directly; that would remove the largest source of violations.

- **Avoid the `style` and `restriction` categories wholesale.** They contain rules actively
  wrong for this codebase — `no-async-await` forbids `async` outright, `no-magic-numbers` fires
  on every literal. Take individual rules from them, never the category.

> **Caveat: `no-unnecessary-condition` is a `nursery` rule** — oxlint's experimental tier. It's
> enabled anyway because it's the rule most tightly bound to
> [DESIGN_AND_DEVELOPMENT.md](DESIGN_AND_DEVELOPMENT.md)'s "model the possibility honestly"
> rule: it catches branches that can never execute. Being in nursery means it may change
> behaviour or produce false positives across versions. If it starts costing more than it
> catches, turning it off is a legitimate call — record it rather than silently deleting the
> line.

> **Why oxlint rather than `typescript-eslint`.** typescript-eslint remains the more complete
> rule set and is the reference implementation most of these rules come from. It is not used
> here because it does not support TypeScript 7 (peer range `<6.1.0`), and pinning the compiler
> a major behind to keep a linter is the wrong trade. oxlint's type-aware rules run on
> `typescript-go` — the same compiler — so they track the language rather than lag it, and are
> substantially faster in a gate that runs on every build. The known gap is
> `restrict-plus-operands`, which the unsafe-`any` rules largely cover.

- **The compiler is part of static analysis.** Run `tsc --noEmit` alongside the linter, with
  strict flags enabled — notably **`noUncheckedIndexedAccess`**, which makes the "unexpected
  case" visible so it must be handled rather than assumed away (see
  [DESIGN_AND_DEVELOPMENT.md](DESIGN_AND_DEVELOPMENT.md) → Error & Failure Semantics).
- Scope type-aware rules to genuinely typed files (`.ts`/`.tsx`). Feeding the linter files
  whose types it can't resolve produces false positives that train people to ignore it.

## Formatting

**oxfmt**, run as the first step of the gated build (`format:check → lint → typecheck →
build`). Same toolchain family as the linter, so there's one formatter and one linter rather
than two vendors disagreeing about the same file.

- **Formatting is not a code-review topic.** The formatter decides; nobody argues about it in
  a diff. That's the entire value — it isn't that any particular style is better.
- **`format` writes, `format:check` verifies.** The gate uses `--check` so a build never
  silently rewrites your working tree.
- **It formats Markdown and CSS too**, not just TypeScript. Docs are covered deliberately —
  the same normalization that stops style debates in code stops them in prose.
- **Generated files are excluded** via `.oxfmtignore` (`src/gen/`, `src/routeTree.gen.ts`).
  Generated output is owned by its generator; reformatting it guarantees a diff on every
  regeneration.

There is no separate style guide, and there shouldn't be — a written style guide is a
formatter nobody can run.

### Gate vs. report

Linting serves two distinct purposes; keep them separate:

- **Gate** — the default build is gated on a clean lint (`build` = lint → typecheck →
  build). Code held to the bar ships only at **zero errors**.
- **Report** — a strict run can also be a _scorecard_ showing how far an area is from the
  bar without blocking. A `lint:report` script buckets findings per area so debt is visible
  and attributable. Reports are honest about shortcomings; they don't enforce.

### Adopting strict linting on existing code

Turning a strict bar on a mature codebase surfaces a lot at once. Adopt incrementally:

1. Hold **new and well-maintained code** to the full bar in the gate immediately.
2. **Quarantine** noisy legacy areas _out of the gate_ (non-blocking) with a visible warning,
   and track them in the report.
3. Clean each quarantined area to zero, then **fold it back into the gate** — the carve-out
   is transitional scaffolding, removed once the area is clean.

The failure mode this avoids is a permanently-red gate that everyone learns to bypass.

### Fixing, not suppressing

**Never disable a rule, cast, or add `!` just to make the linter pass.** Fix the code:
tighten a type at its source, model the possibility honestly, or throw on the truly
impossible case. Suppression hides the problem the tool exists to find.
