# Decisions

This project's own decisions — including deliberate departures from
[devalbo-principles/](../devalbo-principles/).

Nothing here is inherited, and nothing here is overwritten by a principles update. This is the
half of the docs that belongs to _this_ project.

## When to write one

- **Departing from an inherited rule.** Required. Name the doc and rule you're overriding, and
  say why it doesn't fit here.
- **A choice a future reader would otherwise re-litigate** — a rejected alternative, a
  non-obvious trade-off, a constraint that isn't visible in the code.
- **Closing a gap** listed in
  [SUMMARY.md → Not addressed](../devalbo-principles/SUMMARY.md#not-addressed).

Not for: anything the code already says, or anything the inherited docs already cover and you
agree with.

## Format

One file per decision, numbered, named for the outcome:

```
0001-json-export-not-protobuf.md
0002-feature-slices-instead-of-layers.md
```

```markdown
# 0001 — <the decision, as a statement>

**Status:** accepted | superseded by 0007
**Date:** YYYY-MM-DD
**Overrides:** devalbo-principles/architecture/SERIALIZATION.md → Export: JSON, versioned
(omit if this isn't a departure)

## Context

What forced the decision. The constraint, not the history.

## Decision

What we do now.

## Alternatives rejected

What else was considered and why it lost. **This is the part that stops the decision being
made twice** — a rejected option with no recorded reasoning gets re-proposed in six months.

## Consequences

What this costs, and what would make us revisit it.
```

Keep them short. Two paragraphs that capture the reasoning beat a page that captures the
meeting.

## Maintenance

- **Never delete a decision** — supersede it. Mark the old one `superseded by NNNN` and leave
  it; the reasoning is why the current state makes sense.
- **Re-read these after a principles update.** An override can become redundant when upstream
  adopts the same position, or newly wrong when upstream moves elsewhere.
