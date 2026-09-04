# Documentation

Engineering doctrine for a **local-first, peer-to-peer TypeScript SPA**. These docs record
_decisions and their reasoning_ — the things code can't express. Anything explaining how the
code works belongs in the code.

## Start here

| If you're…                               | Read                                                                                                                                   |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| New to the project                       | [principles/PRINCIPLES_AND_GOALS.md](principles/PRINCIPLES_AND_GOALS.md) — what this commits to and why                                |
| Deciding something not covered elsewhere | [SUMMARY.md](SUMMARY.md) — the decision guide, with a "when in doubt" table                                                            |
| An AI coding agent                       | [AGENT_CONDUCT.md](AGENT_CONDUCT.md) — read this first, before touching anything                                                       |
| Setting up a new project                 | [operations/SETUP_NEW.md](operations/SETUP_NEW.md)                                                                                     |
| About to write code                      | [architecture/PROJECT_LAYOUT.md](architecture/PROJECT_LAYOUT.md) then [practices/CODING_GUIDELINES.md](practices/CODING_GUIDELINES.md) |
| Looking for what's unsolved              | [SUMMARY.md](SUMMARY.md) → Not addressed                                                                                               |

**[SUMMARY.md](SUMMARY.md) is the map.** It restates every rule compactly and points at the
doc that owns it. If you read one file, read that one.

## The doc set

### Root — entry points

| Doc                                  | Covers                                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [SUMMARY.md](SUMMARY.md)             | North-star principles, decision guides by situation, settled decisions, open gaps              |
| [AGENT_CONDUCT.md](AGENT_CONDUCT.md) | How AI agents operate here: autonomy by reversibility, never push or deploy, prove before done |

### `principles/` — why the project is the way it is

| Doc                                                           | Covers                                                                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [PRINCIPLES_AND_GOALS.md](principles/PRINCIPLES_AND_GOALS.md) | Local-first, data ownership, sync-later, what we commit to and don't                                 |
| [PROTOTYPE_BASELINE.md](principles/PROTOTYPE_BASELINE.md)     | The concrete defaults: TinyBase, Trystero P2P, keypair identity, signed envelopes, whole-user export |

### `architecture/` — how the system is shaped

| Doc                                                                 | Covers                                                                                |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [PROJECT_LAYOUT.md](architecture/PROJECT_LAYOUT.md)                 | Layer-based structure and the enforced dependency direction                           |
| [COMMAND_LAYER.md](architecture/COMMAND_LAYER.md)                   | Operations as commands returning structured results; injected adapters                |
| [SERIALIZATION.md](architecture/SERIALIZATION.md)                   | Protobuf vs Zod division of labor, the sign-the-bytes rule, wire/store/export formats |
| [BRANDED_TYPES.md](architecture/BRANDED_TYPES.md)                   | Branded strings and numbers, structured IDs, boundary rules                           |
| [DESIGN_AND_DEVELOPMENT.md](architecture/DESIGN_AND_DEVELOPMENT.md) | Stack rationale and error & failure semantics — fail loudly                           |
| [TOOLING.md](architecture/TOOLING.md)                               | Portability as a selection criterion; linting and static analysis                     |

### `practices/` — how we work

| Doc                                                                  | Covers                                                                        |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [CODING_GUIDELINES.md](practices/CODING_GUIDELINES.md)               | Code as the primary artifact; TypeScript, React, function and file rules      |
| [SDLC_PROCESS.md](practices/SDLC_PROCESS.md)                         | Reason / acceptance criteria / testing strategy; assume broken until verified |
| [DOCUMENTATION_GUIDELINES.md](practices/DOCUMENTATION_GUIDELINES.md) | Which docs to write at all; one rule, one home                                |

### `testing/`

| Doc                                    | Covers                                                            |
| -------------------------------------- | ----------------------------------------------------------------- |
| [TESTING.md](testing/TESTING.md)       | Philosophy — tests as a design tool, behavior over implementation |
| [TEST_PLAN.md](testing/TEST_PLAN.md)   | Requirements — the mandate, what to test per layer, coverage      |
| [unit-tests.md](testing/unit-tests.md) | Vitest commands, layout, helper conventions                       |

### `operations/` — running the project

| Doc                                         | Covers                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| [SETUP_NEW.md](operations/SETUP_NEW.md)     | Dependencies, strict config, gated scripts, cold verification              |
| [MAINTENANCE.md](operations/MAINTENANCE.md) | Dependency selection, update cadence, audit triage, pin-vs-latest          |
| [VERSIONING.md](operations/VERSIONING.md)   | SemVer plus git and UTC build info, injected at build and shown in the app |

## Conventions for these docs

- **One rule, one home.** Each rule is stated in full in exactly one doc; everywhere else is a
  pointer. `SUMMARY.md` and `AGENT_CONDUCT.md` are the two deliberate exceptions —
  [practices/DOCUMENTATION_GUIDELINES.md](practices/DOCUMENTATION_GUIDELINES.md).
- **Decisions, not mechanics.** A doc explaining how the code works duplicates the code and
  will drift. Write the doc the code can't replace.
- **Change docs in the same commit as the code that invalidates them.**
- **A link to a file that doesn't exist is a bug.**
