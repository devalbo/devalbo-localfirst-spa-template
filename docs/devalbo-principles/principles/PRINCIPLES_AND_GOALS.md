# Principles and Goals

Why this template is built the way it is. These are the commitments that shape every
other doc in `docs/devalbo-principles/`: what the software must do for the user, and what the
codebase must do for the people (and agents) maintaining it.

This is the **why**. For the concrete defaults that implement it, see
[PROTOTYPE_BASELINE.md](PROTOTYPE_BASELINE.md); for how changes get made and verified,
see [SDLC_PROCESS.md](../practices/SDLC_PROCESS.md).

---

## Vision

Give users ownership of their data in web applications — starting from the first page
load with no server required, with sync and sharing available later as an addition, never
a prerequisite.

---

## Core Principles

### 1. Local-first from day one

**The app works without any server or account from the first page load.**

- Users can create and edit data immediately — no signup, no login, no network request.
- All state lives in the browser (TinyBase + IndexedDB/LocalStorage).
- The experience is instant and reliable; the app never waits for a server to render what
  the user already has.

This is a **hard requirement**, not a fallback. Local-first is the default and the only
required path to start.

### 2. User data ownership

**Users control their data. It lives where they choose.**

- Data is stored on the user's device by default — not on our servers.
- Data can be exported as a portable, self-describing blob at any time, and imported back.
- Export is **whole-user**, not piecemeal: identity, profile, content, and settings restore
  together on another device.
- No vendor lock-in: prefer established, documented formats over app-private ones.

### 3. Sync is additive, never required

**Local-first does not mean local-only.**

Adding a sync or sharing target — a peer, a server, another device — must not break
local-only use. A user who never turns sync on should never notice it exists. Concretely:

- Core features never gain a network precondition.
- Remote state is cached locally and marked stale on disconnect, never deleted.
- Conflict handling is designed _before_ sync ships, not retrofitted.

### 4. Interoperable by default

**Prefer established formats and vocabularies so data outlives the app.**

When data leaves the app — export, sync, or handoff to another tool — it should be
readable without this codebase. Use a documented schema (Zod is the source of truth; JSON
Schema can be generated from it) and standard vocabularies where one fits the domain.
Avoid custom-only formats whose meaning lives only in our source.

### 5. Offline-first

**The app works entirely offline.**

- No network requests for core functionality.
- Reactive local persistence means state survives reload, tab close, and flight mode.
- Network is an enhancement layer: it syncs _changes_, it does not gate _reads_.

### 6. Minimal setup

**Starting a project from this template should be one clone and one install.**

No backend, no database, no accounts, no environment configuration to see the app run.
Anything that requires setup is opt-in and documented as such.

### 7. AI-augmented and low-barrier by design

**This template welcomes experimentation, hacking, and building with AI assistance.**

- **Low barrier to trying things.** No accounts, no deploy, no config — open the app and
  start. Experimenting breaks nothing.
- **Legible to agents.** Clear types, consistent patterns, a stable command surface, and
  explicit conduct rules ([AGENT_CONDUCT.md](../AGENT_CONDUCT.md)) make the codebase readable
  by coding agents as well as humans.
- **Iterate fast.** Local persistence means reload-tweak-retry with no setup cost. Export a
  snapshot when you want to keep one.
- **Vision over polish.** Working software that solves the problem beats a polished
  half-feature. Rough edges are acceptable; broken foundations are not.

This is about **lowering the barrier**: whether you're a seasoned developer, someone
learning to code, or someone driving an AI assistant, the structure should help rather
than gate.

### 8. Operations as a composable command layer

**Model app operations as commands that return structured results.**

Decomposing interactions into commands gives you pieces that can be called from a UI event
handler, invoked programmatically by an agent or a script, chained into workflows, and —
critically — tested in isolation.

**Decomposability drives testability.** A command testable without UI, browser mocks, or
elaborate fixtures is a command you can reason about. It behaves the same from a unit test,
a button click, and an agent call.

This is a **foundational pattern, not a mandate** — direct store access is fine for simple
cases. See [COMMAND_LAYER.md](../architecture/COMMAND_LAYER.md) for the shape and rules.

### 9. Testability equals maintainability

**If it's hard to test, it's hard to maintain.** Testability is not a testing concern — it's
the property that keeps the project changeable, which is why it sits here among the
commitments rather than only in the testing docs.

This is what lets the project live a long time at low cost, and lets new participants — human
or agent — change things without high risk. A codebase nobody can safely modify is finished,
whatever state it's in.

The philosophy is in [TESTING.md](../testing/TESTING.md); the requirements are in
[TEST_PLAN.md](../testing/TEST_PLAN.md).

### 10. Fail loudly

**A state that "can't happen" should throw, not degrade quietly.**

Defaults and fallbacks are for genuinely optional values. Using them to paper over an
impossible state converts a bug into silently-wrong behavior that surfaces far from its
cause. See [DESIGN_AND_DEVELOPMENT.md](../architecture/DESIGN_AND_DEVELOPMENT.md) for the full rule.

---

## Design Goals

### For users

1. **Immediate value** — create and manage real data from the first page load.
2. **No lock-in** — export anytime; sync to somewhere you own when ready.
3. **Privacy** — data stays on your device until you choose otherwise.
4. **Reliability** — works offline; no server dependency for core features.

### For developers

1. **Minimal integration** — clone, install, run.
2. **Stable contracts** — the store layout (table, index, and value names) is an API; it
   does not change without a migration.
3. **Extensible** — new data types follow the existing schema pattern.
4. **Future-proof** — adding sync is an extension, not a rewrite.
5. **Agent-ready** — the command layer is a usable surface for coding agents with no
   custom integration.

### For the project

1. **Principle-first** — design docs start from principles and requirements, not
   implementation details.
2. **Verification** — a feature is broken until verified ([SDLC_PROCESS.md](../practices/SDLC_PROCESS.md)).
3. **Coherent docs** — design, implementation, and test docs are kept in sync, and
   divergence is recorded deliberately rather than discovered later.

---

## What we commit to

| Commitment                         | What it means                                                                                                                   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Local-first always works**       | No future change will require a server for first use.                                                                           |
| **Export/import always available** | Users can always get their whole state out in a portable form.                                                                  |
| **Schemas are the contract**       | Zod defines stored and local shapes; Protobuf defines the wire. Types are derived from both, never hand-maintained in parallel. |
| **Store layout is stable**         | Table names, index names, and value keys won't break without a migration.                                                       |
| **Sync is additive**               | Adding a sync target does not break local-only use.                                                                             |

---

## What we do not commit to (yet)

Named honestly so nobody is surprised. Each is a real gap, not a decision:

- **Conflict resolution beyond last-write-wins.** The signed-timestamp LWW rule in
  [PROTOTYPE_BASELINE.md](PROTOTYPE_BASELINE.md) is the whole story today; richer merge
  (CRDTs, MergeableStore) is named but not designed.
- **Schema evolution and data migration.** The store layout is declared a contract, but the
  migration mechanism when it changes is unspecified.
- **Authorization.** Identity is modeled; a permission model is not.
- **Multi-user collaboration and real-time sync.** Peer sync is broadcast-and-apply, not
  collaborative editing.
- **Large-object storage.** Browser storage quotas apply; chunking and streaming are not
  implemented.
- **Accessibility and internationalization.** Absent despite a React/UI focus.

The fuller, prioritized gap list lives in
[SUMMARY.md](../SUMMARY.md) → Not addressed. If you make a real decision in any of
these areas, capture it and promote it out of the gap list so the next person inherits the
reasoning.

---

## Summary

| Principle                         | One-liner                                                                 |
| --------------------------------- | ------------------------------------------------------------------------- |
| **Local-first**                   | Works from first page load, no server required.                           |
| **Data ownership**                | Users own and control their data; whole-user export always available.     |
| **Sync later**                    | Additive by construction; local-only use never breaks.                    |
| **Interoperable**                 | Documented schemas and standard formats; data outlives the app.           |
| **Offline-first**                 | No network needed for core features.                                      |
| **Minimal setup**                 | Clone, install, run. No backend.                                          |
| **AI-augmented**                  | Legible types and a stable command surface; low barrier to trying things. |
| **Command layer**                 | Operations are composable, structured, testable in isolation.             |
| **Testability = maintainability** | Hard to test means refactor. Tests enable safe change.                    |
| **Fail loudly**                   | Impossible states throw; no silent fallbacks.                             |

---

## Related documents

- **[PROTOTYPE_BASELINE.md](PROTOTYPE_BASELINE.md)** — the concrete defaults that implement these principles.
- **[COMMAND_LAYER.md](../architecture/COMMAND_LAYER.md)** — the command surface: shape, rules, environment-agnostic logic.
- **[SDLC_PROCESS.md](../practices/SDLC_PROCESS.md)** — how changes are documented and verified.
- **[CODING_GUIDELINES.md](../practices/CODING_GUIDELINES.md)** — code style and practices.
- **[TESTING.md](../testing/TESTING.md)** / **[TEST_PLAN.md](../testing/TEST_PLAN.md)** — testing philosophy and requirements.
- **[SUMMARY.md](../SUMMARY.md)** — the situation-oriented decision guide across all of these.
