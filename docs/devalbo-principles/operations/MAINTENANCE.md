# Maintenance and dependencies

How dependencies get chosen, updated, and retired — and how often to look.

Software rots while you aren't touching it. A project that builds today and is untouched for
a year does not build in a year: transitive dependencies publish breaking patches, a runtime
goes end-of-life, a lockfile pins something with a published CVE. The cost of staying
current is roughly linear; the cost of catching up is not.

---

## Latest, but pinned

Two rules that sound contradictory and aren't:

1. **Run the latest stable version of everything.** Don't pin to old majors. Resolve
   peer-dependency conflicts **forward** — upgrade the thing that's behind, never downgrade
   the thing that's ahead.
2. **Pin the exact versions you build with.** Commit the lockfile, pin the runtime
   (`.nvmrc`), pin CI images by digest where you can.

The first is about **which version you choose**; the second is about **making the build you
chose reproducible**. Pinning is not staying behind — it's knowing exactly what you're on,
which is a precondition for upgrading deliberately rather than discovering you drifted.

A pin you never revisit is the failure mode. That's what the cadence below is for.

## What "latest" means, by kind

| Kind                   | Target                                | Why                                                                                                                                                                     |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime (Node)**     | Current **Active LTS** line           | The Current (odd) line gets no long-term support window; a maintenance line is already winding down. Active LTS is the only one with both recency and a support runway. |
| **Libraries**          | Latest stable release                 | No prereleases, no release candidates, no pinning to an old major to avoid a migration.                                                                                 |
| **Build/lint tooling** | Latest stable                         | These gate correctness; running an old linter means silently not getting rules that catch real bugs.                                                                    |
| **CI images**          | Pinned by digest, bumped deliberately | An unpinned image makes your build non-reproducible in a way no lockfile can fix.                                                                                       |

**Verify, never recite.** Any version number written in a doc is stale the moment it's
written. Check the source:

```bash
node --version                                   # what you're actually running
npm outdated                                     # direct deps behind latest
npm view <pkg> version                           # latest published
curl -s https://nodejs.org/dist/index.json \
  | jq -r 'map(select(.lts))[0] | "\(.lts) \(.version)"'   # current Active LTS
```

## Cadence

| When                        | Do                                                       |
| --------------------------- | -------------------------------------------------------- |
| **Every dependency change** | `npm audit` — you're touching the tree anyway            |
| **Monthly**                 | `npm outdated` + `npm audit`; take patch and minor bumps |
| **Quarterly**               | Review majors; check the Node LTS line hasn't rolled     |
| **Before a release**        | `npm audit`, full test suite, gated build from cold      |
| **On a CVE affecting you**  | Immediately, out of band                                 |

Monthly is the floor, not a target to beat. The point is that the interval is _bounded_ —
an unscheduled "we'll update when something breaks" policy means you update under
time pressure, during an incident, with no idea which of forty changes caused the problem.

## Applying updates

**Patch and minor** — take them in a batch, run the gated build and the full suite, done.
If the suite is green and the app runs, that's the verification.

**Major** — one at a time, each in its own commit. A batch of majors that breaks gives you
no bisection. Read the migration notes first; budget real time.

**Never downgrade to resolve a conflict.** If package A needs an old version of B, the
options are: upgrade A, replace A, or accept the pin _with a comment recording why and what
would let you remove it_. Silently sitting on an old major is how a project becomes
unupgradable.

### When the ecosystem lags a foundational tool

"Latest stable" assumes the ecosystem has caught up. Sometimes it hasn't: a new major of
something foundational — a compiler, a runtime — outpaces the tools built on it, and
"upgrade A" isn't available because A doesn't exist yet.

That's a real fork. Decide **which of the two you'd rather lose**, rather than defaulting to
whichever avoids work:

1. **Pin the foundational tool back and keep the tooling.** Cheap and reversible, and correct
   when the tooling is load-bearing — but it puts you a major behind, and the pin must carry
   its exit condition or it becomes permanent through inattention.
2. **Move to the latest and replace the lagging tool.** Right when a viable replacement
   exists and the lag looks structural rather than temporary.

This template hit exactly that: TypeScript 7 shipped, `typescript-eslint` declared
`typescript <6.1.0`, and no published version supported it. Both branches were taken in turn —
first pinning TypeScript to 6.0.3 to keep type-aware linting, then moving to TS 7 and
replacing the linter with oxlint, whose type-aware rules run on the same `typescript-go`
compiler ([TOOLING.md](../architecture/TOOLING.md)).

The part worth keeping: **a pin taken for this reason is a dated decision, not a setting.**
Write down what would lift it, and check it on the quarterly review.

**Verify manually after upgrading.** Dependency upgrades are exactly the case where a green
suite is least trustworthy — the tests exercise your code, not the changed behavior
underneath it. [SDLC_PROCESS.md](../practices/SDLC_PROCESS.md) lists dependency upgrades as a trigger for
a full manual pass.

## Adding a dependency

Before adding one, ask whether you need it. A dependency is a permanent maintenance
obligation, a supply-chain surface, and a constraint on every future upgrade. Some things are
cheaper to write than to depend on.

If you do need it:

- **Prefer first-party TypeScript** with strict typing over loose, hand-maintained `@types`.
- **Check it's alive** — recent releases, open issues being answered, more than one
  maintainer if it's load-bearing.
- **Check it doesn't foreclose an environment** ([TOOLING.md](../architecture/TOOLING.md) → Portability).
- **Prefer fewer, larger, well-maintained** over many small unmaintained ones.

**Agents ask before installing anything.** Propose what and why; install after approval.
The lockfile is a reviewable, semi-irreversible change
([AGENT_CONDUCT.md](../AGENT_CONDUCT.md) §10).

## Removing a dependency

Dead dependencies are not free — they're audit noise, install time, and upgrade friction.

- When you delete the last use of something, **remove it in the same commit**.
- During the quarterly review, check for packages nothing imports any more.
- The same rule applies to config and dead code: delete it when you find it, don't route
  around it.

## Vulnerabilities

`npm audit` reports against your **whole** tree, including dev-only and transitive packages.
Triage rather than reflexively fixing:

1. **Does it reach production?** A dev-only vulnerability in a build tool is not the same
   risk as one in shipped code — but it isn't zero either, since build tooling runs with
   your credentials.
2. **Is the vulnerable path reachable** from how you actually use the package?
3. **Is there a fix?** If yes, take it. If not, record the decision — which advisory, why
   it's tolerable, what would change that.

**Never leave audit findings undocumented.** Open findings with no recorded triage are
indistinguishable from findings nobody looked at, and after a few months that's exactly what
they are.

## Keeping this honest

The build should tell you when it drifts, rather than relying on someone remembering:

- **`engines` in `package.json`** so an unsupported Node fails loudly at install.
- **`.nvmrc`** so contributors and CI land on the same runtime.
- **The gated build** (`lint` → `typecheck` → `build`) run from a cold, clean install
  regularly — not just from a warm cache that hides a broken dependency tree.

Automated update PRs (Dependabot, Renovate) are worth turning on once the suite is
trustworthy enough that a green run means something. Until then they generate noise you'll
learn to ignore, which is worse than not having them.
