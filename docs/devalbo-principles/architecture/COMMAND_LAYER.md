# The Command Layer

How app operations are modeled. This doc specifies the composable command surface referred
to throughout the principles — the pattern that
[PRINCIPLES_AND_GOALS.md](../principles/PRINCIPLES_AND_GOALS.md) §8 names and
[CODING_GUIDELINES.md](../practices/CODING_GUIDELINES.md) points at.

**Scope note.** This template is a **browser SPA** — there is no Node CLI binary. The
command layer is kept anyway, because its value was never the terminal: it is a stable,
structured, testable surface that UI handlers, scripts, agents, and tests all share.

---

## The idea in one line

> Model operations as small, mostly stateless commands that take typed input, do one thing,
> and return a structured result — never as logic embedded in a click handler.

---

## Why keep it without a terminal

| Benefit                    | What it buys you                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| **Testability**            | A command runs in a unit test with no DOM, no mocks, no fixtures. This is the main reason. |
| **Consistent validation**  | Input is parsed once, in one place, for every entry point.                                 |
| **Unified error handling** | One error shape and one set of codes across UI, scripts, and agents.                       |
| **Single audit trail**     | Every mutation flows through one place — logging and debugging have one seam.              |
| **Agent-ready**            | An agent learns the command surface once instead of reverse-engineering handlers.          |
| **Parity**                 | A button click and a programmatic call take the identical path; they cannot drift.         |

---

## Structured results

Commands return a result, they do not render output:

```ts
interface CommandResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: { code: ErrorCode; message: string };
}
```

- **UI code** reads `data` and renders it however it likes.
- **Scripts and agents** consume the same object programmatically.
- **Tests** assert on it directly.
- **Chaining** works because one command's `data` can feed the next.

Error codes are a closed union, not free strings — a caller can branch on them, and a new
code is a deliberate, reviewable addition.

## Failure semantics

Distinguish the two kinds of failure, and don't blur them:

- **Expected failure** — untrusted or invalid input. Parse at the boundary and return
  `success: false` with a code. This is a normal, recoverable outcome.
- **Programming error** — an invariant violated inside trusted code. **Throw.** Do not
  encode "impossible" as a `CommandResult` error; that hides the bug behind a code path
  callers will handle.

See [DESIGN_AND_DEVELOPMENT.md](DESIGN_AND_DEVELOPMENT.md) → Error & Failure Semantics.

## Validate at the boundary

The command layer _is_ a boundary. Parse untrusted input into well-typed values once, on
the way in, with the Zod schema that owns that shape. Interior logic then works on trusted
types and never re-validates.

Choose `parseX` (returns a result; failure is expected) or `assertX` (throws; failure means
a bug) by which kind of failure it actually is. See [BRANDED_TYPES.md](BRANDED_TYPES.md).

---

## Environment-agnostic logic

**Command logic must not branch on its environment.** No `typeof window`, no
`process.env`, no direct platform API calls in the command body.

Platform differences live in **adapters** passed in as context:

```ts
interface CommandContext {
  store: Store; // the reactive store
  io: IoAdapter; // output, prompts, file save — implementation varies
  now: () => number; // injected clock, so tests are deterministic
}
```

This is dependency injection applied at the command seam, and it is what makes the "test
once, run anywhere" claim true rather than aspirational. It also keeps a future
environment — a worker, an Electron shell, a Node target if you ever add one — an
adapter away rather than a rewrite.

**Inject the clock and any randomness.** A command that calls `Date.now()` or
`crypto.randomUUID()` directly is a command with a nondeterministic test.

---

## Single source of truth for cross-cutting concerns

Anything every command needs — identifier resolution, path or key normalization, permission
checks once they exist — lives in exactly one module that all commands call. Duplicating
that logic per command is how validation rules drift apart.

If two commands need the same lookup, extract it rather than copying it.

---

## Exposing the surface

- **From the UI** — call commands from event handlers; keep components presentational.
- **From the dev console** — expose a single named object on `window` in development builds
  so a person (or an agent driving the browser) can drive the app without clicking. Keep it
  out of production builds unless you have decided otherwise deliberately.
- **From tests** — import and call directly. No harness required; that's the point.

---

## When _not_ to use it

This is a foundational pattern, not a mandate. Direct store access is fine when:

- The operation is a trivial single-field read or write with no validation.
- The logic is genuinely local to one component and will never be called from anywhere else.

Reach for a command when the operation has real input validation, mutates shared state,
needs to be tested, or will be invoked from more than one place. When in doubt, a command
costs little and converts easily; extracting one later from a tangled handler costs more.

---

## Persistence and identity

Commands mutate the store; they do not own persistence or identity. Those are defined in
[PROTOTYPE_BASELINE.md](../principles/PROTOTYPE_BASELINE.md) — the local store schema, whole-user export,
and keypair identity. Two rules where the layers meet:

- **Storage layout is a contract** — changing a table, index, or value name is a migration,
  not an edit → [PRINCIPLES_AND_GOALS.md](../principles/PRINCIPLES_AND_GOALS.md).
- **Identity-requiring operations fail clearly.** A command that needs a user identity and
  is invoked without one returns a clear error or falls back to a defined default — it never
  proceeds ambiguously.
