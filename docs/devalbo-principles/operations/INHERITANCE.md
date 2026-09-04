# What you inherit

Which parts of a project created from this template keep tracking the template, and which are
yours from the first commit. [docs/README.md](../../README.md) covers the `docs/` half of this;
this doc is the canonical statement for the **whole repository**, and it lives inside the
inherited set deliberately — a contract that can't be corrected in derived projects is a
contract that rots.

---

## The one-line rule

> **`docs/devalbo-principles/` is inherited. Everything else is a starting point you own.**

`src/` is a **worked example**, not a library. It exists to show the stack running end to end —
schema → store → command → component — and to be deleted once your own features replace it.
Nothing in the template promises it will stay compatible with your project, because your project
is supposed to leave it behind.

---

## By path

| Path                                                            | Relationship                                      | On a template update                   |
| --------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| `docs/devalbo-principles/`                                      | **Inherited doctrine**                            | Replace wholesale. Never edit locally. |
| `docs/decisions/`                                               | Yours                                             | Never touched                          |
| `src/ids/` + `tests/unit/ids/`                                  | **Shared machinery** — generic, no domain content | Optional: diff and adopt deliberately  |
| `src/` — everything else                                        | Starting point / worked example                   | Nothing. Yours from commit one.        |
| `tests/` — everything else                                      | Follows your `src/`                               | Nothing                                |
| Config (`tsconfig`, `.oxlintrc`, `vite.config`, `package.json`) | Starting point that drifts fast                   | Cherry-pick, never bulk-copy           |
| `proto/`, `buf.*`                                               | Starting point                                    | Cherry-pick                            |
| `README.md`                                                     | Yours — describes your project, not the template  | Rewrite early                          |

**Never bulk-copy anything outside `docs/devalbo-principles/`.** An `rsync` over `src/` in a
project with real features destroys work and produces no conflict to warn you. The wholesale
replace is safe for the doctrine folder precisely because nothing local is allowed to live there.

---

## Delete the worked example

The greeting example — its schema, command, components, route, store table, and tests — is
scaffolding. **Delete it once your first real feature lands.** Not later, and not "when there's
time".

Leaving it costs more than the dead files suggest: it keeps a `greetings` table in a store layout
that is supposed to be a contract, keeps a route in your URL structure, and pads your coverage
numbers with tests for code no user reaches. The project's own rule is
[SUMMARY.md](../SUMMARY.md) → _found dead code, remove it now_.

Read it before you delete it. It is the shortest correct statement of four rules that are easy to
get subtly wrong, and re-deriving them from prose is slower than reading thirty lines of working
code:

- validating untrusted input once at the command boundary
- minting a branded structured ID from an injected id source
- storing primitives and re-branding on read
- returning a `CommandResult` rather than throwing at the UI

---

## `src/ids/` is the deliberate exception

It is the one part of `src/` worth keeping in step with the template, because it is pure
machinery: brand tags, key methodologies, and toolbox factories, with **no domain content by
construction** — [BRANDED_TYPES.md](../architecture/BRANDED_TYPES.md) puts domain brands beside
their schema, not here. Two projects' copies have no reason to diverge, so a fix upstream is
usually a fix you want.

**But tracking it is opt-in, not automatic.** There is no mechanism, no version stamp, and no
notification. If you want an upstream fix, diff the directory and take it deliberately.

**The moment you edit it, it is yours.** Record a decision naming what you changed and why —
otherwise the next person diffs against the template, sees a difference, and cannot tell a
deliberate improvement from drift. That is the same reasoning that keeps local edits out of
`docs/devalbo-principles/`, applied to the one code directory with the same property.

---

## Taking an update

1. **Replace `docs/devalbo-principles/` wholesale.** Read what changed upstream first — a
   principle can reverse, and a reversal can invalidate code written against the old rule.
2. **Re-read your `docs/decisions/`.** An override can become redundant when upstream adopts the
   same position, or newly wrong when upstream moves elsewhere.
3. **Diff `src/ids/` if you want machinery fixes.** Adopt deliberately; skip if you've diverged.
4. **Ignore the rest.** Cherry-pick a config change if you read it and want it. Never sweep.
5. **Run the gated build.** An inherited doc that now contradicts your code is a bug in one of
   them, and the code is the fact.
