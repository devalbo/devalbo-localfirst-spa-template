# Testing requirements

The concrete bar. For _why_ these rules exist, see [TESTING.md](TESTING.md).

## The rule

**Every feature has unit tests before it is considered complete.** No exceptions.

A feature without tests is not done, regardless of whether it works when you click it.

## What to test, by layer

| Layer          | What                                      | Example                                                                |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| **Schemas**    | Validation, factory functions, edge cases | `MySchema.safeParse()` rejects a malformed row                         |
| **Utilities**  | Pure functions, transformations           | key normalization, date formatting, merge logic                        |
| **Commands**   | Execution and structured results          | a command returns `success: false` with the expected code on bad input |
| **Components** | Rendering and user interaction            | a list renders its items; a form calls its handler with parsed values  |

Schemas and utilities are tested in isolation. Components are tested through the same
helpers the app uses, so the test exercises the real store rather than a hand-built double.

## Coverage

- **80% threshold**, enforced in `vitest.config.ts`.
- Coverage identifies untested paths; it is not the goal. 80% with the risky paths tested
  beats 95% of trivial getters.
- **Deliberately uncovered code is explicitly excluded**, so the exclusion is visible as a
  decision. An untested path should never be indistinguishable from an overlooked one.

## Required test kinds

**Unit tests** — required for every feature, as above.

**Regression tests** — required when fixing a bug that could plausibly return. Write it so
it fails against the unfixed code.

**Manual verification** — required before release, after dependency upgrades, and after
changes to the store, persistence, routing, or build. See [SDLC_PROCESS.md](../practices/SDLC_PROCESS.md).

## Process rules

**When a change breaks a test, decide which is wrong** — never silently adjust the test.
→ [SDLC_PROCESS.md](../practices/SDLC_PROCESS.md)

**Refactor over elaborate tests.** → [TESTING.md](TESTING.md)

**Exception for performance-critical code.** Code whose structure is dictated by performance
may be tested at its boundary rather than internally, only if it is (1) explicitly marked
with the reason, (2) small and focused, and (3) isolated behind a clear interface. The
isolation requirement is what stops hard-to-test code from spreading.

## Tooling

[Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
and jsdom. Commands and layout: [testing/unit-tests.md](unit-tests.md).

Browser E2E is not set up. When it is, the decision on record is `playwright-bdd`
([TESTING.md](TESTING.md) → Higher-level testing).
