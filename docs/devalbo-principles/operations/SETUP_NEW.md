# Project setup

Standing up a new project from this template. Replace `$PROJECT_NAME` throughout.

If you cloned the template, most of this is already done — read it to understand _why_ each
piece is there, and use it as the checklist when something needs rebuilding.

**Target:** a local-first browser SPA. No backend, no accounts, no environment config
required to see it run.

## Prerequisites

Node on the **current Active LTS** line, and npm. Not the Current (odd-numbered) line — it
gets no long-term support window — and not a maintenance or EOL line.

Pin it so builds are reproducible:

```bash
node --version                      # confirm you're on the Active LTS line
node -p "process.versions.node.split('.')[0]" > .nvmrc
```

Deriving `.nvmrc` from the interpreter you verified beats copying a number out of a doc,
which is how a template ends up pinning a dead runtime. To check which line is current:

```bash
curl -s https://nodejs.org/dist/index.json | jq -r 'map(select(.lts))[0] | "\(.lts) \(.version)"'
```

Re-check on the cadence in [MAINTENANCE.md](MAINTENANCE.md) — an LTS line goes EOL roughly
every year, and a pinned EOL runtime stops getting security fixes silently.

## Initialize

```bash
npm create vite@latest $PROJECT_NAME -- --template react-ts
cd $PROJECT_NAME
npm install
```

Vite's React+TS template gives you ES modules, JSX, and a dev server out of the box.

## Dependencies

Everything the documented stack needs, in one place. Install the groups you want; the first
two are the baseline, the rest are opt-in by concern.

```bash
# Runtime — local-first core
npm install react react-dom zod tinybase @tanstack/react-router

# Quality gates — type-aware linting and formatting
npm install -D oxlint oxlint-tsgolint oxfmt

# Tests
npm install -D vitest @vitest/coverage-v8 jsdom \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event

# Build
npm install -D vite @vitejs/plugin-react @tanstack/router-plugin typescript \
  @types/react @types/react-dom @types/node

# Peer-to-peer — only if the project actually needs peers
npm install trystero

# Protobuf wire contract — only if you're serializing across the wire
npm install -D @bufbuild/buf ts-proto

```

**Why each group is here:**

| Group                                      | Rationale                                                                                                                                   |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `zod`                                      | Source of truth for stored and local shapes; types derived via `z.infer` → [SERIALIZATION.md](../architecture/SERIALIZATION.md)             |
| `tinybase`                                 | Reactive local store with persisters — what makes local-first practical                                                                     |
| `oxlint` + `oxlint-tsgolint`               | Type-aware rules catch floating promises and unsafe `any` flow; tsgolint runs on `typescript-go` → [TOOLING.md](../architecture/TOOLING.md) |
| `oxfmt`                                    | Formatting, gated. Same toolchain family as the linter → [TOOLING.md](../architecture/TOOLING.md)                                           |
| `@tanstack/react-router` + `router-plugin` | File-based routing with per-route code splitting                                                                                            |
| Vitest set                                 | jsdom environment plus Testing Library → [TEST_PLAN.md](../testing/TEST_PLAN.md)                                                            |
| `trystero`                                 | The P2P transport the baseline assumes → [PROTOTYPE_BASELINE.md](../principles/PROTOTYPE_BASELINE.md)                                       |
| `buf` + `ts-proto`                         | Wire schema, codegen, and breaking-change detection → [SERIALIZATION.md](../architecture/SERIALIZATION.md)                                  |

If you cloned the template these are already installed; the list exists so you can rebuild it
from nothing and so each group's _reason_ is recorded.

**Styling needs no dependency.** CSS Modules are native to Vite; tokens are CSS custom
properties in `src/styles/tokens.css`.

**No version numbers here on purpose.** `npm install` resolves the current stable release and
writes it to `package.json` and the lockfile; a version transcribed into a doc is stale the
day after it's written ([MAINTENANCE.md](MAINTENANCE.md)).

> **After the first install, `package.json` is the dependency list.** This section exists to
> get an empty project to a working one and to explain _why_ each group is present. Don't
> maintain it as an inventory — a second list drifts from the real one
> ([DOCUMENTATION_GUIDELINES.md](../practices/DOCUMENTATION_GUIDELINES.md) → One rule, one home). Add a
> group here only when adding a new _concern_, and only with its rationale.

## TypeScript configuration

Strict mode plus the flags that make unhandled cases visible:

```jsonc
// tsconfig.json — compilerOptions
{
  "strict": true,
  "noUncheckedIndexedAccess": true, // makes "impossible" indexes visible
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "verbatimModuleSyntax": true,
}
```

`noUncheckedIndexedAccess` is not optional here — it's what surfaces the cases that
[DESIGN_AND_DEVELOPMENT.md](../architecture/DESIGN_AND_DEVELOPMENT.md) requires you to throw on rather than
assume away.

Add a path alias so imports don't encode file locations:

```jsonc
// tsconfig.json
{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
```

Mirror it in `vite.config.ts` under `resolve.alias`.

## Linting

Type-aware rules catch floating promises, misused promises, and unsafe `any` flow, which
syntax-only linting cannot. They need `--type-aware`, and several must be named explicitly —
the categories alone don't enable them:

The three categories cover most type-aware rules already; only name the ones they miss:

```jsonc
// .oxlintrc.json
{
  "ignorePatterns": ["dist", "coverage", "src/gen"],
  "categories": { "correctness": "error", "suspicious": "error", "pedantic": "error" },
  "rules": {
    // outside the baseline categories — see TOOLING.md for why each
    "typescript/no-explicit-any": "error",
    "typescript/no-non-null-assertion": "error",
    "typescript/no-unnecessary-condition": "error",
  },
}
```

Don't enable the `style` or `restriction` categories wholesale — `no-async-await` forbids
`async` outright and `no-magic-numbers` fires on every literal. Rule placement and the
`nursery` caveat: [TOOLING.md](../architecture/TOOLING.md).

See [TOOLING.md](../architecture/TOOLING.md) for the gate-versus-report distinction and how to adopt strict
linting on code that isn't clean yet.

## Testing

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: { thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 } },
  },
});
```

`tests/setup.ts` registers jest-dom matchers and any browser API stubs the suite needs.
Layout and helper conventions: [testing/unit-tests.md](../testing/unit-tests.md).

## Scripts

**The default command does the correct thing; speed is an explicit opt-in.** This is the
governing rule — the default is what everyone reaches for without thinking, so its worst
case must be "slower than necessary", never "silently wrong".

```jsonc
{
  "scripts": {
    "dev": "vite --force",
    "dev:fast": "vite",

    "build": "npm run format:check && npm run lint && npm run typecheck && vite build",
    "build:dev": "vite build",

    "lint": "oxlint --type-aware",
    "format": "oxfmt --ignore-path .gitignore --ignore-path .oxfmtignore",
    "format:check": "oxfmt --check --ignore-path .gitignore --ignore-path .oxfmtignore",
    "typecheck": "tsc --noEmit",

    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",

    "preview": "vite preview",
  },
}
```

`build` is **gated** — formatting, lint, and type-check must pass before it emits anything. `dev --force`
re-optimizes dependencies so a stale Vite cache can't serve you a phantom failure.

Keep build-critical tooling in `dependencies`, not `devDependencies`, if your deploy runs a
production-only install — otherwise the gate silently vanishes in CI.

## Project structure

Layer-based, with an enforced dependency direction → [PROJECT_LAYOUT.md](../architecture/PROJECT_LAYOUT.md).

Two things to set up while you're here:

- **The `@/*` alias** (above), so cross-layer imports don't encode file positions.
- **Layer-boundary enforcement.** oxlint has `import/no-restricted-paths`; verify it covers
  your layer rules before relying on it, and treat the direction as intended-but-unchecked
  until you've confirmed it fails on a violation.

## Build info

Inject version and build metadata via Vite's `define` so a deployed build can identify
itself. See [VERSIONING.md](VERSIONING.md).

## Verify

From a cold state, all of these must pass before you call the setup done:

```bash
rm -rf node_modules dist && npm install
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run dev          # then open the app and confirm it renders
```

A gated build that passes from cold is the bar. Anything that only works with warm caches
or a partial install isn't set up yet.

## Next

- [PRINCIPLES_AND_GOALS.md](../principles/PRINCIPLES_AND_GOALS.md) — what this template commits to.
- [PROTOTYPE_BASELINE.md](../principles/PROTOTYPE_BASELINE.md) — the local-first defaults and the decision
  checklist for a new prototype.
- [SUMMARY.md](../SUMMARY.md) — the decision guide when a situation isn't covered elsewhere.
