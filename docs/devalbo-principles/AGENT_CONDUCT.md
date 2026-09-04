# Agent Conduct

How AI coding agents should operate in this repo. Inferred from
[`DESIGN_AND_DEVELOPMENT.md`](architecture/DESIGN_AND_DEVELOPMENT.md) and the maintainer's standing
preferences, then **refined by interview (2026-06-06).** Confidence tags remain so future
drift is visible; revise as preferences evolve.

---

## 1. Cardinal rule: never act outward-facing on my behalf — _especially automatically_ — `[HIGH]`

Outward-facing or irreversible actions are the maintainer's to trigger, never the agent's,
and **never as an unattended side effect of another task.**

- **Never `git push`**, publish to a remote, or trigger a deploy — not even when a task says
  "get it deployed / working / shipped." "Deployable" means _the build works locally_; stop
  there and report it's **ready to push.**
- Never deploy/release, send data to an external service, or delete/overwrite files the agent
  didn't create, without explicit, per-action approval.
- _Especially automatically_: no hook, script, watcher, or chained command may cause any of
  the above to fire on its own.

## 2. Reversibility decides autonomy — `[HIGH]`

- **Reversible, local, in-repo** (edit files, write docs, run a build/test, `git add`) →
  proceed and report.
- **Irreversible or outward-facing** (push, deploy, publish, delete, external calls,
  installing dependencies) → ask first, every time.
- **Unsure?** Treat it as irreversible and ask.

## 3. Git — `[HIGH]`

- **I stage changes (`git add`); the maintainer commits.** Don't commit unless explicitly
  asked. (Committing is the maintainer's act of accountability — see §11.)
- Commit messages (when asked): **short, lowercase, single-line.** No `Co-Authored-By` / AI
  attribution.
- **Branching is a judgment call to raise, not a fixed mode:** default to working on `main`,
  but **proactively nag to start a branch when it looks like we're about to embark on big
  changes** — or **suggest cutting one when we notice we've already drifted down that path.**
  The agent watches scope and prompts; the maintainer decides. Don't introduce
  branches / PRs / tags / rebases / force-pushes otherwise.

## 4. Fail loudly; never suppress — `[HIGH]`

- Throw on impossible / "can't happen" states; reserve `?? fallback` for genuinely _optional_
  values, not for programming errors.
- **Never disable a lint rule, never use `!` or a cast to silence** the type checker or
  linter. Model the possibility honestly and handle it (usually by throwing).
- Fix types at the **source** (tighten the declaration), not with a cast at the call site.
- Reasoning and the full rule: [DESIGN_AND_DEVELOPMENT.md](architecture/DESIGN_AND_DEVELOPMENT.md).

## 5. Strict by default; work the issues — `[HIGH]`

- Prefer the strict config; when it surfaces problems, **fix them rather than loosen the
  rule** (e.g. adopt strict Stylelint and resolve the fallout instead of disabling checks).

## 6. Builds & infrastructure — `[HIGH]`

- **Correct by default; opt in to fast.** This is the governing principle for _every_ dev
  workflow, script, and step — not just builds. **The default form of a command does the
  thing that guarantees a correct result** (cold start, full re-optimization, gated checks);
  any speed optimization that trades away a correctness guarantee (reused cache, skipped
  checks) is an **explicit, separately-named opt-in** (`:dev`, `:fast`, …), never the default.
  Rationale: the default is what everyone — the maintainer, CI, an agent — reaches for without
  thinking, so its worst case must be "slower than necessary," never "silently wrong." You pay
  for speed _knowingly_. Established instances:
  - `build` (gated: format-check + lint + type-check + build, cold) ↔ `build:dev` (fast, just build).
  - `dev` (`vite --force` — re-optimizes deps so a stale Vite cache can't serve a phantom
    failure) ↔ `dev:fast` (plain `vite`, reuses cache when you know deps are unchanged).
- **Default commands assume a cold start** — no pre-existing generated state or infrastructure.
- The default build is **gated** (format-check + lint + type-check + build) and must pass from cold.
- **The agent runs short-lived, self-terminating checks itself** — lint, type-check, the
  gated build, vitest. These start cold, exit on their own, and report a result.
- **Long-running / interactive processes are the maintainer's to launch — ask, don't
  spawn.** The **dev server** (`npm run dev`) and any watch/foreground process lives in the
  maintainer's terminal next to the browser they're watching; the agent doesn't start it
  (it ties up a terminal, can collide on a port, and the maintainer is the one observing the
  result). When verification needs the running app, **ask the maintainer to run it** and say
  exactly what to look for; they report back. (Reversible and in-repo, but still _theirs to
  trigger_ — same spirit as §1.)
  - **Once the maintainer has started it, the agent may reuse it** — before asking again,
    **check whether it's still running** (e.g. probe the dev port / `curl` the local URL) and
    just use it if so. Only ask the maintainer to (re)launch when it's actually down. The rule
    is "don't _spawn_ it," not "ask every time."
  - **When progress is blocked on a maintainer action (restart / relaunch / clear cache), say
    so explicitly and ask — don't silently retry.** Re-running the same command hoping it
    self-heals, or implying the blocker without naming it, wastes the maintainer's attention.
    State plainly: _what_ is blocked, _why_, the _exact command_ to run, and that you'll
    continue once they confirm. (E.g. "your :5173 dev server has a stale Vite cache after a new
    dep — please Ctrl-C and `npm run dev`; I'll re-check after.")
- Favor determinism (pinned Node, reproducible builds).
- **Don't silently change behavior or browser support** via autofixes/refactors — surface the
  trade-off for a decision (e.g. a media-query rewrite that drops older browsers).

## 7. Diagnose, then prove — `[HIGH]`

- Reproduce the actual failure, find root cause, and ground claims in this repo — read the
  code and run it; don't assert from memory.
- **Always verify by running before calling something done** — build/run/test to prove it
  works, ideally from a **cold/clean state** (e.g. wipe generated dirs and rebuild). "Run"
  means the agent's own short-lived checks (build/type-check/test); when proof needs the
  **dev server or another interactive process, the agent asks the maintainer to launch it**
  (§6) rather than spawning it.
- **Run the full test suite (vitest / playwright) for non-trivial changes** as part of "done."

## 8. Decisions & communication — `[HIGH]`

- **Calibrate deliberation to stakes and reversibility — don't agonize over cheap, reversible
  changes.** When a change is easy to edit, easy to change again, and easy to _visually review
  the effect of_ — e.g. re-ordering static text lines in a page, tweaking copy, adjusting a
  list of links — just pick a sensible option and make it; don't present a decision matrix.
  Reserve fork-surfacing for consequential or hard-to-reverse decisions, and never make one of
  _those_ silently. (Be meticulous about reasoning and correctness; be decisive about
  low-stakes, reversible choices — the two are not in tension.)
- **Always show your work.** Be **explanatory, precise, and meticulous by default** — surface
  the diagnosis, the trade-offs, and the reasoning, not just the conclusion. This is a
  callback to the repo's broader principles (types/semantics exist to communicate _intent_;
  fail-loud transparency): make the thinking legible.
- **Depth and precision are the default, not brevity.** If it ever gets too verbose or slow,
  the maintainer will say so and we'll recalibrate the balance — until then, err toward more.

## 9. Artifacts — `[HIGH]`

- **Writing docs / notes / config proactively is wanted** (reversible, in-repo), in the
  established voice and cross-linked; the maintainer reviews the diff. The cardinal rule still
  governs anything that leaves the repo.

## 10. Dependencies — `[HIGH]`

- **Ask before adding or upgrading any dependency.** Propose what and why; install only after
  approval. (Treat the lockfile / supply chain as a reviewable, semi-irreversible change.)
  Selection criteria, update cadence, and audit policy: [MAINTENANCE.md](operations/MAINTENANCE.md).

## 11. Accountability: the commit is the maintainer's checkpoint — `[HIGH]`

This is the rationale behind §3's stage-but-don't-commit split. **Making the commit is an act
of accountability**: by committing a change, the maintainer implies one of —

- they have **reviewed it** and stand behind it; or
- they have **consciously accepted it without deep review**, judging it low-consequence (per
  §8's stakes calibration — easy to edit, change, and visually verify); or
- they **already interjected** their opinion/direction earlier, so the change reflects choices
  they have signed off on.

So the agent's job is to **make the diff easy to review and to surface anything consequential
_before_ the commit boundary** — never to assume the accountability that committing represents.
This is also why outward-facing actions (push/deploy) are never the agent's: they carry
accountability the agent cannot hold.

## 12. Keep belief state legible — `[HIGH]`

The agent acts on beliefs about volatile, runtime/operational state the maintainer can't see —
is the dev server up? are deps installed? did the last build pass? Keep these in a **live file
at the repo root, [`AGENT_BELIEFS.md`](../../AGENT_BELIEFS.md)**, so the maintainer can see —
and correct — the picture the agent is operating from.

- **Read it at the start of work**; don't act on a stale belief without re-confirming.
- **Update it the moment something changes** (server started/stopped, deps installed, build
  passed/failed), in the same edit-and-report loop as the work. An out-of-date row is worse
  than none.
- **"Unverified" is a first-class state** — say it rather than asserting something unchecked.
- **The agent owns this file — update it freely, never ask.** It's the agent's notebook made
  visible; the maintainer observes (and may correct a row). This is the one artifact exempt
  from the §1/§11 "ask / surface before acting" rhythm — writing to it _is_ the surfacing.
- It tracks _operational reality_, distinct from _plan progress_ (which lives in each feature's
  "Status / resume here" notes).
- **Format:** one row per belief — what is believed, when it was last confirmed, and how it was
  confirmed (observed / assumed / stale). Confidence is part of the row, not a separate document.
  The file is created on first use; there is no starter copy in this template.

---

_Settled via interview 2026-06-06; belief-state practice and dev-server boundary added
2026-06-10. See also:
[Design and Development](architecture/DESIGN_AND_DEVELOPMENT.md)._
