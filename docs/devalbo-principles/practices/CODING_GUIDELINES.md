# Coding guidelines

Strict types, small units, simple components — and code written to be read.

## Code is the primary artifact

**Write code designed to be read. Don't rely on comments or documentation to carry meaning
the code should carry itself.**

A comment explaining what code does is a bug report against that code. The fix is to
rename, restructure, or split until the explanation is unnecessary.

- **Names do the work.** A well-named function needs no header comment. If you're writing
  one to explain the name, the name is wrong.
- **Types encode intent.** A signature that makes the illegal case unrepresentable
  communicates more reliably than prose, because the compiler enforces it. Reach for a
  branded type or a narrower union before reaching for a comment
  ([BRANDED_TYPES.md](../architecture/BRANDED_TYPES.md)).
- **Structure communicates.** Extracting a well-named helper beats a comment introducing
  the block it replaces.
- **Tests document usage.** A readable test shows how an API is meant to be called, and it
  can't go stale without failing. Prose can.

**Comment only what the code cannot say:** why a non-obvious choice was made, why a
tempting alternative is wrong, a link to the spec or bug that forced an odd branch. These
are facts about the world outside the file, and no amount of restructuring will surface
them.

The same test applies to docs. A doc explaining _how the code works_ duplicates the code
and will drift out of sync; a doc recording _a decision and its rationale_ holds something
the code cannot. Write the second kind. Delete the first when you find it.

## TypeScript

- **Strict mode always.** `strict: true` stays on. Don't relax it.
- **Avoid `any`.** Use `unknown` and narrow with a type guard, or define the interface. If
  a cast is genuinely unavoidable, keep it minimal and comment _why_ — this is one of the
  cases where the comment carries what the code can't.
- **Fix types at the source.** Tighten the declaration rather than casting at the call site.
- **Explicit types on public APIs** (exports, component props). Let inference handle obvious
  locals.
- **Zod schemas are the source of truth** for stored and local-only shapes; derive types with
  `z.infer`. Never hand-maintain a type alongside its schema. For types that cross the wire,
  the `.proto` owns the shape and Zod adds only semantic constraints
  ([SERIALIZATION.md](../architecture/SERIALIZATION.md)).
- **No sloppy object types.** Avoid `Record<string, unknown>` in public APIs unless you're
  genuinely handling arbitrary data. Name the properties.

## Functions

- **One responsibility, one level of abstraction.** If a function does several things, split
  it.
- **Extract helpers** for repeated or non-trivial logic — small, named, testable.
- **Limit parameters.** Past a few arguments, take an options object.

## React

- **Latest stable React**, current APIs over legacy patterns.
- **Custom hooks for stateful logic.** Non-trivial state or effects move into a
  `useSomething` hook; the component stays mostly presentational.
- **`useEffectEvent`** (React 19+) for callbacks an effect must call but shouldn't depend on.
  Keeps effect dependencies minimal and avoids stale closures.
- **Small components, composition over branches.** Many small components beat one large one
  with many conditionals.
- **Props typed, minimal, and readonly.** Declare props as `Readonly<{…}>` and arrays as
  `readonly T[]`. A component that can't mutate its inputs is one fewer place a bug can hide.
  This is a **convention, not a lint gate** — the rule that would enforce it can't be
  satisfied against third-party types ([TOOLING.md](../architecture/TOOLING.md)), so it
  relies on review. No spreading large objects "just in case."

```tsx
type WidgetProps = Readonly<{ items: readonly string[]; label: string }>;
```

## Files and naming

- **Clear, consistent names.** `handleSubmit` over `onClick` for handlers passed as props.
- **Split past ~200–300 lines** — by component, by feature, or into a folder.

## The command layer

Model non-trivial operations as commands returning a structured result rather than as logic
inside event handlers. Command logic stays environment-agnostic; platform differences live
in injected adapters. See [COMMAND_LAYER.md](../architecture/COMMAND_LAYER.md).

Foundational, not mandatory — direct store access is fine for simple cases.

## Failure

**Throw on impossible states; never suppress the checker to make one compile.**
→ [DESIGN_AND_DEVELOPMENT.md](../architecture/DESIGN_AND_DEVELOPMENT.md) (Error & failure semantics)

## Dependencies

Prefer libraries written in TypeScript with strict typing over ones relying on loose,
hand-maintained `@types`. Selection criteria, and the rule to ask before adding one:
→ [MAINTENANCE.md](../operations/MAINTENANCE.md)

## Tests

- **Required for every feature**, with coverage rules and the performance-critical exception
  → [TEST_PLAN.md](../testing/TEST_PLAN.md).
- **Hard to test means refactor** — treat testability as design feedback
  → [TESTING.md](../testing/TESTING.md).
- **Never silently fix a test a change broke** → [SDLC_PROCESS.md](SDLC_PROCESS.md).

---

These apply to `src/` and `tests/`. Tooling and config can be more permissive.
