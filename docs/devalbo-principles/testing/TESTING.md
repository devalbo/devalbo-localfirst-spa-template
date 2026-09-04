# Testing philosophy

Why we test the way we do. For the concrete rules — what must have tests, coverage
expectations, what to test at each layer — see [TEST_PLAN.md](TEST_PLAN.md).

## Tests are a design tool first

The primary value of a test is not catching regressions. It's the feedback it gives you
while writing it.

**Hard to test means badly factored.** If a test needs extensive setup, deep mocking, or
knowledge of unrelated systems, the code is telling you it does too much or depends on too
much. The answer is almost always to refactor the code, not to build more test
infrastructure.

Ask, in order:

- Is this unit doing too much? → split it
- Too many dependencies? → inject them, or extract the pure logic
- State and behavior tangled? → separate them
- Testing internals? → test behavior instead

If you can't imagine a simple test for something, simplify the design before the
implementation gets complicated.

## Tests document usage

A test shows how an API is meant to be called — and unlike prose, it fails when it goes
stale. This makes readable tests the most durable documentation in the codebase, which is
why a hard-to-read test is a warning about the API, not just the test.

## Behavior, not implementation

Test what a unit promises, not how it currently delivers it. A test that breaks on every
refactor is measuring the wrong thing and will eventually be deleted or ignored.

## Automated tests are necessary, not sufficient

A green suite means the cases you thought of behave as you expected. It does not mean the
feature works. End-to-end confirmation is a human using the app — see
[SDLC_PROCESS.md](../practices/SDLC_PROCESS.md).

## Design principles that make tests possible

**Inversion of control.** Accept dependencies as parameters rather than constructing them
internally. Inject the clock and any randomness — a unit calling `Date.now()` directly is a
unit with a nondeterministic test.

**Arrange / Act / Assert.** Three visible phases. When a failure happens, the structure
tells you which phase broke.

**Parameterized cases.** Same logic, table of inputs. Removes duplication and makes the
covered range legible at a glance.

**Coverage is a map, not a target.** Use it to find untested paths. Code deliberately left
uncovered should be marked as excluded, so the exclusion reads as a decision someone made
rather than an oversight.

## Higher-level testing

Broad behavioral tests — Gherkin scenarios over full user journeys — are the strongest
signal that a system is worth deploying, and remain the intended direction here.

**Not currently set up.** This template ships unit tests only ([Vitest](https://vitest.dev/)).
When browser E2E is added, the decision already made is `playwright-bdd` — Playwright for
the browser, Gherkin for the scenarios, one tool rather than two.

Whatever the tooling, keep the **automated-versus-manual boundary explicit**: a written
statement of what the suite covers and what is left to manual verification. Without it,
nobody can tell the difference between "tested and passing" and "never tested".
