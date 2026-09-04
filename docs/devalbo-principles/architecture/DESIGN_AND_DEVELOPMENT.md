# Design and development

The stack, and the rule that governs how failure is handled.

## Type systems

A type is documentation the compiler enforces. It communicates the author's intent and
semantics to the next reader, and unlike a comment it cannot quietly become false.

Two consequences shape library choices here:

- **Make illegal states unrepresentable** rather than catching them at runtime.
- **Serialization of types is first-class.** Persisting and transmitting data is not a
  separate concern bolted onto the type system — tools that treat schema and type as one
  artifact (Zod) are preferred over ones that make you maintain both by hand.

## Error & failure semantics

**Fail loudly on the unexpected.** When a value or state "should not happen" — an
out-of-bounds index, a missing required entry, an unreachable branch — **throw**.

Do not paper it over with a default or sentinel. A default turns a bug into silently-wrong
behavior that surfaces far from its cause; an exception fails at the source, where it can
be diagnosed.

- Reserve `?? fallback` for genuinely _optional_ values, not for cases that indicate a
  programming error.
- Prefer typed, throwing accessors (an `elementAt(arr, i)` that throws on out-of-range) over
  `arr[i]!` or `arr[i] ?? fallback`.
- **Do not suppress the type checker or linter** to make an "impossible" case compile — no
  disabled rules, no casts to silence a warning. Model the possibility honestly and handle
  it, usually by throwing. This is why `noUncheckedIndexedAccess` is on: it makes the
  possibility _visible_ so it must be handled rather than assumed away.
- **Validate untrusted input at boundaries** (parse/assert); treat invariant violations
  _inside_ trusted code as exceptions, not recoverable conditions.

The distinction that matters: _expected failure_ (bad input from outside) is a return value;
_programming error_ (a broken invariant inside) is a throw. Blurring them makes both harder
to handle.

## Language and stack

**TypeScript**, for the reason that also drives everything else here: it runs natively in the
browser and in Node, and compiles toward WASM. Avoid Node-specific decisions; prefer choices
that keep more than one environment open.

| Tool                                              | Role                                                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **[TypeScript](https://www.typescriptlang.org/)** | The language. Strict mode, always.                                                                                               |
| **[Vite](https://vite.dev/)**                     | Build, dev server, and config. Also the injection point for build metadata ([VERSIONING.md](../operations/VERSIONING.md)).       |
| **[Zod](https://zod.dev/)**                       | Runtime validation. Source of truth for stored and local-only shapes; types derive via `z.infer`, never the reverse.             |
| **[Protobuf](https://protobuf.dev/)**             | Wire format and schema evolution for peer messages. See [SERIALIZATION.md](SERIALIZATION.md) for the division of labor with Zod. |
| **[React](https://react.dev/)**                   | UI and execution framework ([TOOLING.md](TOOLING.md)).                                                                           |
| **[TinyBase](https://tinybase.org/)**             | Reactive local persistence — what makes local-first practical.                                                                   |
| **[Vitest](https://vitest.dev/)**                 | Unit tests ([TEST_PLAN.md](../testing/TEST_PLAN.md)).                                                                            |

Version policy for all of these — latest stable, pinned for reproducibility — is in
[MAINTENANCE.md](../operations/MAINTENANCE.md).
