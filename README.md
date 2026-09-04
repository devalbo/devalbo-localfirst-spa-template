# devalbo-typescript-spa-template

A starter template for **local-first, peer-to-peer TypeScript single-page apps**.

The app works from first load with no server and no account. Data lives on the user's device
and belongs to them. Sync is something you add later, never a precondition for the app
working.

```bash
npm install
npm run dev          # http://localhost:5173
```

That's the whole setup. No backend, no database, no environment configuration.

## What's in the box

|             |                                                                                              |
| ----------- | -------------------------------------------------------------------------------------------- |
| **Build**   | Vite 8, TypeScript 7 (strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)      |
| **UI**      | React 19, TanStack Router (code-based routes)                                                |
| **Data**    | Zod schemas as the source of truth, TinyBase reactive store with browser persistence         |
| **Types**   | Branded types: structured prefix+key IDs and branded numbers, with compile-time misuse tests |
| **Wire**    | Protobuf via `buf` + `ts-proto`, with breaking-change detection                              |
| **Quality** | oxlint with type-aware rules (`oxlint-tsgolint`), Vitest, a gated build                      |

A worked example runs the full stack end to end — branded `GreetingId` → Zod schema → TinyBase
store → a command returning a structured result → a component that calls the command rather than
writing to the store. Add a greeting, reload, and it's still there. The id is minted from the
injected clock/id source, stored as a primitive, and re-branded on read, so the branded-type
boundary rules are demonstrated by running code rather than described in a doc.

## Scripts

| Command               | Does                                                             |
| --------------------- | ---------------------------------------------------------------- |
| `npm run dev`         | Dev server, cold (`--force`); `dev:fast` reuses the cache        |
| `npm run build`       | **Gated**: lint → typecheck → build. `build:dev` skips the gates |
| `npm run lint`        | oxlint with type-aware rules                                     |
| `npm run typecheck`   | `tsc --noEmit`                                                   |
| `npm run test`        | Vitest (watch); `test:run` once, `test:coverage` with thresholds |
| `npm run proto:gen`   | Regenerate TypeScript from `proto/` into `src/gen/`              |
| `npm run proto:check` | Lint protos, regenerate, fail if the committed output differs    |

**The default form of a command does the correct thing.** Anything faster that trades away a
correctness guarantee is a separate, explicitly-named script. You pay for speed knowingly.

## Layout

```
proto/      .proto wire contract (buf module)
src/
  gen/        generated from proto — committed, never hand-edited
  ids/        branding primitives: structured IDs and branded numbers
  schemas/    Zod schemas; source of truth for stored shapes
  store/      TinyBase setup; table and value names are a contract
  commands/   operations returning CommandResult
  components/ React components
  routes/     file-based routes; routeTree.gen.ts is generated
  styles/     tokens.css + global.css
  utils/      pure leaf helpers
tests/      mirrors src/
docs/       the doctrine — start at docs/README.md
```

Layer-based, with dependencies pointing **down only**: components → commands → store/schemas →
ids/utils. A schema can't import a component. See
[docs/devalbo-principles/architecture/PROJECT_LAYOUT.md](docs/devalbo-principles/architecture/PROJECT_LAYOUT.md).

## Documentation

The engineering doctrine lives in [`docs/`](docs/) and is a substantial part of what this
template is for. Start with [docs/README.md](docs/README.md).

- **[SUMMARY.md](docs/devalbo-principles/SUMMARY.md)** — the decision guide. If you read one
  file, read this one.
- **[AGENT_CONDUCT.md](docs/devalbo-principles/AGENT_CONDUCT.md)** — how AI coding agents
  should work in this repo. Point your agent here first.

`docs/devalbo-principles/` is **inherited doctrine** — replaced wholesale when the template
updates. Your project's own decisions and departures go in `docs/decisions/`, which is never
overwritten.

**That folder is the only thing you inherit.** `src/` is a worked example to learn from and then
delete, not a library to track — so never bulk-copy it from the template into a project with real
features. The full path-by-path breakdown, including the one opt-in exception (`src/ids/`), is in
[INHERITANCE.md](docs/devalbo-principles/operations/INHERITANCE.md).

## What this deliberately is not

- **Not a server-rendered app.** Browser-only by design.
- **Not for server-backed CRUD.** There's no data-fetching layer because there's no server;
  TanStack Query would be dead weight.
- **Not a UI kit.** No component library — just CSS Modules and a small token set.

## Known gaps

Tracked honestly in [SUMMARY.md → Not addressed](docs/devalbo-principles/SUMMARY.md#not-addressed).

The one to know before building on this: **there is no local data migration mechanism, and
during discovery that is deliberate.** Break the store layout freely while you're still learning
what the app is — the only data at risk is your own test rows. What the template does ask for is
cheap and impossible to retrofit: stamp a `schemaVersion`, refuse to load an unrecognized one,
tell the user their data is disposable, and keep export working.

**That deferral ends at your first beta.** From then on the store layout is a real contract, and
the migration mechanism — version stamping, ordered migrations on load, and handling data
written by a newer build on another device — is a release blocker that has to be designed. The
policy is in
[PRINCIPLES_AND_GOALS.md](docs/devalbo-principles/principles/PRINCIPLES_AND_GOALS.md#data-migration-is-a-beta-gated-concern);
the mechanism is still yours to build.

## Licence

**GNU AGPL v3** — see [LICENSE](LICENSE).

This is a deliberate choice, not a default. Attribution and sharing matter here: work derived
from this template stays open, including when it's offered to users over a network (AGPL §13).
If you need different terms for your project, decide that before you build on it — relicensing
after the fact is not straightforward.
