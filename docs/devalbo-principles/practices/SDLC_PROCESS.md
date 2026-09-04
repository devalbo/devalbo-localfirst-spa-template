# Development Process

How changes are introduced, documented, and verified. Written for a **small or solo team
working with AI coding agents** — the process assumes few people, no formal QA, and an
agent doing a meaningful share of the editing.

Ceremony is kept to the minimum that survives that setup. Every step here exists because
skipping it costs more than doing it.

---

## The core rule: assume it's broken

**Every feature is broken until verified.**

Automated tests are necessary and not sufficient. They confirm the units you thought to
test behave as you expected; they do not confirm the feature works end-to-end in a real
browser. Passing tests plus an unverified feature equals an unverified feature.

This applies with extra force to agent-authored changes: an agent reporting "done" is
reporting that its own checks passed, which is exactly the necessary-not-sufficient case.
See [AGENT_CONDUCT.md](../AGENT_CONDUCT.md) §7 — diagnose, then prove.

---

## Lifecycle

| Stage              | What happens                                                        | Output                                                 |
| ------------------ | ------------------------------------------------------------------- | ------------------------------------------------------ |
| **Requirements**   | Capture why, what "done" means, how it'll be checked                | Reason, acceptance criteria, testing strategy          |
| **Design**         | Decide the approach; note anything consequential or hard to reverse | A decision recorded where the next person will find it |
| **Implementation** | Code and doc changes together                                       | Working code, updated docs, tests                      |
| **Verification**   | Automated tests, then manual confirmation                           | Green suite + a human who actually used the feature    |

The stages are a sequence of _concerns_, not a workflow tool. For a one-line fix, three of
them take ten seconds in your head. For a new feature, write them down.

---

## Documenting a change

Before writing code, state three things. In a commit message, a scratch file, or the prompt
you give an agent — the medium doesn't matter, the discipline does.

### 1. Reason

**Why is this needed? What problem does it solve?** If you can't state the problem, you're
not ready to solve it. This is also the single highest-leverage thing to give an agent: a
task with a stated reason produces a change that addresses the reason, rather than one that
matches the literal words of the request.

### 2. Acceptance criteria

**What does "done" look like?**

```markdown
- [ ] User can [specific action]
- [ ] [Specific state] appears when [condition]
- [ ] Data survives a page refresh
```

Criteria must be:

- **Specific** — not "works correctly" but "the contact's name appears in the list".
- **Testable** — a human can check it by using the app.
- **Independent** — each verifiable on its own, so a partial failure is legible.

### 3. Testing strategy

**How will this be verified?** Which units get tests, what you'll click through manually,
and what existing behavior needs re-checking because this change could plausibly break it.

---

## Verification workflow

### New feature

1. **Document** — reason, acceptance criteria, testing strategy.
2. **Implement** — code and docs in the same change.
3. **Test** — unit tests for the new behavior. Required, not optional
   ([TEST_PLAN.md](../testing/TEST_PLAN.md)).
4. **Verify** — use the feature in a browser, against the acceptance criteria.
5. **Record** — check off the criteria; note anything you deliberately left undone.

### Bug fix

1. **Reproduce first.** A fix for a bug you haven't reproduced is a guess.
2. **Find the root cause** — not the nearest place the symptom disappears.
3. **Fix it**, then confirm the original reproduction is gone.
4. **Re-verify neighbors** — whatever shares code with the fix.
5. **Add a regression test** if the bug could plausibly return.

### Refactor

1. **State why.** "Cleaner" is not a reason; "this is hard to test / hard to change / has
   duplicated validation" is.
2. **Note the current state** — what works now is what must still work after.
3. **Refactor**, keeping behavior fixed.
4. **Re-verify** everything the refactor touched. A refactor that changes behavior is not a
   refactor; it's an undocumented feature change.

### When to do a full manual pass

- Before a release or a demo.
- After upgrading dependencies.
- After changes to core infrastructure (store, persistence, routing, build).
- When automated tests pass but something feels wrong. Trust that feeling.

---

## Manual verification checklists

For anything beyond a trivial app, keep a **dependency-ordered checklist** of what should
work — foundational items first, features after:

```
0. App loads          → if broken, skip everything
1. Store persists     → if broken, skip all features
2. Navigation works   → if broken, skip feature UIs
3+. Features, in dependency order
```

The ordering is the point: when an early item fails, everything below it is unverifiable,
so you stop rather than generating a list of meaningless failures.

The checklist serves two jobs — verifying new work, and **defining behavior that must be
preserved**. Before changing something, look at the items it could affect; those represent
working functionality that a change should not regress.

Keep it next to the project it describes, not here — this template can't know your
features. Add items as features land, uncheck them when something breaks, and annotate
known breakage inline rather than silently leaving a box unchecked.

---

## Don't auto-fix a broken test

When a change breaks a test, **stop and decide** which is wrong:

- The **code** is wrong → fix the code.
- The **test's expectation** is now wrong → update the test, deliberately, having decided
  the new behavior is correct.

Never silently adjust a test to match new behavior. That converts a signal into noise and
is the fastest way to end up with a suite that asserts whatever the code currently does.

This rule is aimed squarely at agents, which are strongly inclined to make the red thing
green — and at anyone under time pressure, which is everyone eventually.

_This doc is the canonical home for this rule; other docs point here._

---

## Recording decisions

When you make a real decision — a trade-off, a rejected alternative, something a future
reader would otherwise re-litigate — write down **what you decided, what you rejected, and
why.** Two sentences is usually enough.

The failure mode is not "wrong decision", it's "decision made twice". A rejected approach
that isn't recorded gets re-proposed in three months by someone (or some agent) who has no
way to know it was already considered.

Where it goes:

- **Shapes the whole project** → the relevant doc in `docs/devalbo-principles/`, edited in
  place — **but only in the template repo itself.** In a project that inherited this doc set,
  never edit it: the folder is replaced wholesale on update and your edit is destroyed. Record
  the departure in `docs/decisions/` instead, naming the inherited rule you're overriding and
  why.
- **Local to one area** → a comment at the seam, explaining _why_, not what.
- **Still open** → [SUMMARY.md](../SUMMARY.md) → Not addressed, so it's a known gap
  rather than an accidental omission.

There is no ADR template here yet — [SUMMARY.md](../SUMMARY.md) lists that as an open gap.
Until there is one, the rule is just: write it down somewhere the next reader will look.

---

## Keeping docs honest

Docs drift from code silently, and stale docs are worse than missing ones — they're
confidently wrong, and an agent will follow them.

Two habits are enough at this scale:

**Change docs in the same commit as the code.** If a change makes a doc wrong, the change
isn't finished. This is the whole discipline; the rest is cleanup for when it slips.

**Review the doc set when the shape of the project changes** — after a major feature, before
starting a new phase, or when you notice you've stopped trusting a doc. Read them as a set
and ask:

1. **Does any doc contradict another?** Pick the winner and record which — a resolved
   contradiction is a decision worth keeping (see the Reconciliation section in
   [SUMMARY.md](../SUMMARY.md) for the format).
2. **Does any doc contradict the code?** The code is the fact. Fix the doc or fix the code,
   but don't leave them disagreeing.
3. **What's referenced but missing?** Dead cross-references and docs promising sections that
   don't exist.
4. **What's real but undocumented?** Decisions living only in someone's head, or only in a
   chat log.

Output one prioritized list and work it. That's the entire process — the point is that it
produces a checklist someone acts on, not a review artifact that gets filed.

---

## Related documents

| Document                                                                      | Purpose                                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [PRINCIPLES_AND_GOALS.md](../principles/PRINCIPLES_AND_GOALS.md)              | Core principles and project goals                                   |
| [AGENT_CONDUCT.md](../AGENT_CONDUCT.md)                                       | How AI agents operate here — autonomy, verification, accountability |
| [CODING_GUIDELINES.md](CODING_GUIDELINES.md)                                  | Code style and practices                                            |
| [TESTING.md](../testing/TESTING.md) / [TEST_PLAN.md](../testing/TEST_PLAN.md) | Testing philosophy and concrete requirements                        |
