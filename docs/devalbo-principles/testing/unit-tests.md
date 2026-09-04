# Unit tests (Vitest)

Unit tests use [Vitest](https://vitest.dev/) with
[Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and jsdom.

For the requirements these satisfy, see [TEST_PLAN.md](TEST_PLAN.md).

## Commands

| Command                 | What it does                                                  |
| ----------------------- | ------------------------------------------------------------- |
| `npm test`              | Watch mode                                                    |
| `npm run test:run`      | Single run — use this in CI and before calling something done |
| `npm run test:coverage` | Single run with coverage → `coverage/`                        |

## Layout

```
vitest.config.ts        jsdom environment, 80% coverage thresholds
tests/setup.ts          jest-dom matchers, browser API stubs
tests/helpers/          shared factories and render wrappers
tests/unit/
  schemas/              Zod schema validation and factories
  utils/                pure functions
  commands/             command execution and structured results
  components/           rendering and interaction
```

Test files mirror the structure of what they test, so the test for `src/utils/foo.ts` lives
at `tests/unit/utils/foo.test.ts`. Mirroring rather than colocating is the one deliberate
exception to the colocation rule in [PROJECT_LAYOUT.md](../architecture/PROJECT_LAYOUT.md) — it keeps the
test tree separately navigable and gives shared helpers an obvious home.

## Helpers

Two helpers carry most of the setup cost. Build them once and use them everywhere:

- **A store factory** — creates a store with the real schema and optional sample data, so
  tests exercise the actual store rather than a hand-built double that can drift from it.
- **A render wrapper** — renders a component inside the providers the app uses, so component
  tests don't each reassemble the provider tree.

If a test needs setup beyond these, that's the signal from [TESTING.md](TESTING.md): the
code under test probably needs restructuring, not a bigger fixture.

## Conventions

- **Arrange / Act / Assert**, visibly separated.
- **Inject the clock and randomness.** A test that calls `Date.now()` or `crypto.randomUUID()`
  transitively is a test that fails on a bad day.
- **Parameterize** with `it.each` when the same logic takes a table of inputs.
- **Assert on behavior**, not internals — a test that breaks on every refactor is measuring
  the wrong thing.
