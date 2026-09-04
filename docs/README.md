# Docs

Two kinds of documentation live here, and the split is the point.

> **Looking for what tracks the template across the whole repo — `src/`, config, the worked
> example?** That's
> [devalbo-principles/operations/INHERITANCE.md](devalbo-principles/operations/INHERITANCE.md).
> This file covers `docs/` only.

| Folder                                         | What it is                                                                | Who edits it                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------- |
| **[devalbo-principles/](devalbo-principles/)** | Inherited engineering doctrine — the shared devalbo principles            | **The template only.** Replaced wholesale on update. |
| **decisions/**                                 | This project's own decisions, including departures from the inherited set | This project                                         |

**Start at [devalbo-principles/README.md](devalbo-principles/README.md).**

## Why the split

`devalbo-principles/` is a **replaceable unit**. Updating it means overwriting the folder with
a newer copy — no merge, no conflict resolution, no archaeology about which local edits were
deliberate.

That only works if nothing local ever goes inside it. **Editing a file under
`devalbo-principles/` in a derived project destroys that edit on the next update**, silently,
and it will be the file that mattered most — the one where you disagreed.

So when a project needs to deviate, it doesn't change the inherited doc. It writes a decision
record in `decisions/` that names the rule it's overriding and why. The inherited set stays
pristine and updatable forever, and the divergence becomes documented reasoning instead of a
merge artifact — which is what
[SDLC_PROCESS.md](devalbo-principles/practices/SDLC_PROCESS.md) asks for anyway.

**Precedence:** a decision record in `decisions/` overrides the inherited doc it names. If
they conflict and no record explains it, the inherited doc wins and the conflict is a bug.

## Updating the inherited set

Replace the folder with a newer copy from the template repo. The template repo's history and
releases are the version record — this folder deliberately carries no copy of it, since a
stamp duplicated into every derived project is a second source that drifts.

Before adopting an update, read what changed upstream: a principle can **reverse**, and a
reversal can invalidate code already written against the old rule. Then re-read your
`decisions/` records — an override can become redundant when upstream adopts the same
position, or newly wrong when upstream moves somewhere else entirely.
