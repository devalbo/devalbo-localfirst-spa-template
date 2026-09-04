# Documentation guidelines

How to write and maintain markdown in this repo — READMEs, design docs, and the principles
set.

## Write the doc the code can't replace

**Code is the primary artifact.** Before writing, check which kind of doc this is:

- **Mechanics** — how the code works, what a function does, what the file layout is. This
  duplicates the code and will drift out of sync with it. Don't write it; make the code
  readable instead ([CODING_GUIDELINES.md](CODING_GUIDELINES.md) → Code is the primary
  artifact).
- **Decisions** — why an approach was chosen, what was rejected and why, what we commit to,
  what we deliberately don't. The code cannot hold these. **This is what docs are for.**

When a doc must reference implementation, reference it by name and let the reader go read
it. Don't paste code that then has two homes.

## One rule, one home

**Every rule is stated in full in exactly one doc. Everywhere else is a pointer.**

A rule restated with its rationale in two docs is a rule that will eventually be edited in
one of them. Then they disagree, and nobody can tell which is authoritative — the same drift
problem as docs versus code, with none of the signals that catch it.

| Form                                | Where                                       | Example                                                 |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------- |
| **Canonical** — rule plus reasoning | The one doc that owns the topic             | `DESIGN_AND_DEVELOPMENT` owns fail-loudly               |
| **Pointer** — one line, then a link | Anywhere a reader needs the rule in context | "Throw on impossible states → `DESIGN_AND_DEVELOPMENT`" |
| **Restatement with rationale**      | Nowhere                                     | —                                                       |

Pointers are encouraged, not grudgingly tolerated: a reader shouldn't need to already know a
rule to follow the doc in front of them. What they shouldn't find is the _argument_ for it
twice.

Two deliberate exceptions:

- **[SUMMARY.md](../SUMMARY.md)** restates every rule compactly by design — it's the map, and a
  map that pointed at itself would be useless.
- **[AGENT_CONDUCT.md](../AGENT_CONDUCT.md)** states its rules imperatively so an agent can read
  it standalone at the start of work. It still links out for reasoning rather than repeating it.

Before adding a rule to a doc, check whether another doc already owns it. If one does, link.
If none does, you're establishing the canonical home — say so plainly enough that the next
person recognizes it as such.

## Structure and clarity

- **Start with purpose.** The first paragraph states what the doc is for and who it's for.
- **Headings make a hierarchy.** `##` for main sections, `###` for subsections. Keep the
  depth shallow enough that the outline stays scannable.
- **One idea per paragraph.** Short paragraphs; lists for steps, tables for comparisons.
- **Tables for comparisons.** When weighing options or contrasting behaviors, a table beats
  prose.

## Acronyms and terms

- **Introduce every acronym in the doc that uses it**, near the top — a short **Terms**
  section or on first use: **SemVer** (Semantic Versioning) is …
- After the first use, the acronym alone is fine.
- If a term is defined in another doc, link there — but still introduce it here, so the
  reader isn't forced to jump away to understand a first mention.

## Links

- **Link other docs with relative paths**: `[TESTING.md](../testing/TESTING.md)`, or to a section:
  `[gate vs. report](../architecture/TOOLING.md#gate-vs-report)`.
- **Link external specs and library docs** so readers can follow up.
- **No bare URLs in prose.** Use `[link text](url)`, except in code or config where the URL
  is the value.
- **A link to a file that doesn't exist is a bug.** Broken cross-references make a doc set
  untrustworthy faster than anything else in this list.

## Code examples

- **Fenced blocks with a language** for highlighting: ` ```ts `, ` ```bash `.
- **Minimal and runnable.** Trim to the relevant part. Note anything that must be changed
  for real use.
- **Label pseudocode** so nobody expects it to run.

## Tone

- **Write for a future reader, including yourself.** Assume basic context, not the details
  of this project.
- **Active voice, present tense.** "The store persists on write," not "the store will
  persist."
- **Be consistent** with terms used elsewhere in the repo. Reusing a name for a different
  thing is how a doc set becomes confusing.

## Maintenance

**Change the doc in the same commit as the code that invalidates it.** A stale doc is worse
than a missing one — it's confidently wrong, and an agent will follow it.

See [SDLC_PROCESS.md](SDLC_PROCESS.md) → Keeping docs honest for the periodic review.

## Where this applies

- **`docs/`** — all markdown.
- **`README.md`** — overview and getting started.
- **`AGENTS.md` / `CLAUDE.md`** — instructions for AI assistants; same rules, so agents and
  humans read the same thing.

Inline code comments follow [CODING_GUIDELINES.md](CODING_GUIDELINES.md); this doc covers
standalone documentation.
