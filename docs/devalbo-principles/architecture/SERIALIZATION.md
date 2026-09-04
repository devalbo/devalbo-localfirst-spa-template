# Serialization

What format data takes when it leaves memory — across the network, into storage, or out as an
export — and which tool owns which guarantee.

**Terms:** **Protobuf** (Protocol Buffers) — binary serialization with a schema language
(`.proto`) and field-number-based evolution. **Zod** — runtime validation library.
**Canonical encoding** — a rule guaranteeing the same value always produces the same bytes.

---

## Two jobs, two tools

The apparent conflict between "Protobuf" and "Zod as the single source of truth" dissolves
once you separate the jobs:

| Job                                              | Owner        | Why                                                                                             |
| ------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------- |
| **Structural** — right shape, and can it evolve? | **Protobuf** | Field numbers, `reserved`, wire-compatible add/remove. Zod has no evolution story.              |
| **Semantic** — is this value _acceptable_?       | **Zod**      | Ranges, patterns, cross-field invariants, brands, transforms. Proto can't express any of these. |

They stack. Proto validates structure at decode for free; Zod validates what proto
structurally cannot. Neither replaces the other.

## Who owns what

| Surface                          | Format                | Validation                                 |
| -------------------------------- | --------------------- | ------------------------------------------ |
| **Wire** (peer messages)         | Protobuf              | Decode, then Zod for semantic constraints  |
| **Local store** (TinyBase)       | Primitives / JSON-ish | Zod `parse` on every write                 |
| **Export blob**                  | JSON                  | Zod on import, plus a format version check |
| **Local-only** (forms, UI state) | —                     | Zod alone                                  |

---

## Protobuf: the wire

`.proto` is the **authored source** for anything crossing a peer boundary. TypeScript types
are generated from it; they are never hand-written alongside.

**Generate proto → TS. Never the reverse.** Generating `.proto` from Zod discards field
numbers, which is the entire reason to adopt protobuf.

### Evolution rules

These are the payoff — treat them as inviolable:

- **Never reuse or renumber a field.** Field numbers are the wire identity.
- **`reserved` every removed field number and name.** This is what stops a future developer
  from silently reusing one and making old data decode as garbage.
- **Adding an optional field is always safe.** Removing a required semantic is not — old
  peers keep sending it.
- **Run breaking-change detection in CI** (`buf breaking`). This mechanically enforces the
  "storage layout is a contract" commitment in
  [PRINCIPLES_AND_GOALS.md](../principles/PRINCIPLES_AND_GOALS.md), rather than leaving it to discipline.

### Zod on decoded messages

Keep these schemas **thin**. Validate only what proto can't express — a handle's character
set, a bounded count, a cross-field invariant. **Do not restate field types in Zod**; that's
the duplication [CODING_GUIDELINES.md](../practices/CODING_GUIDELINES.md) forbids, and it will drift.

If you'd rather keep constraints in the `.proto` itself, **protovalidate** (CEL-based
annotations) is the alternative — one artifact for wire types. Zod still owns form and UI
validation either way, where its transforms and error messages earn their place.

---

## Signing: sign the bytes, never the object

**Protobuf serialization is not canonical.** The specification does not guarantee
deterministic output across implementations or versions — map ordering, unknown-field
retention, and runtime differences all vary. Some runtimes offer a "deterministic" mode
that is explicitly documented as not stable across builds.

So a sign-the-object, re-serialize, verify-the-object flow **will** eventually fail on
semantically identical data. The same is true of `JSON.stringify`, which guarantees no key
ordering.

The fix is format-independent: **treat the signed payload as opaque bytes.**

```proto
message Envelope {
  bytes payload        = 1;  // opaque; signed and verified exactly as received
  bytes signature      = 2;
  bytes author_pubkey  = 3;
  int64 ts             = 4;  // author's signed timestamp
}
```

**The rule, in order:**

1. **Send:** serialize the payload once → sign _those bytes_ → transmit both.
2. **Receive:** verify the signature against _the bytes as received_ → only then decode →
   only then Zod-validate → only then touch state.
3. **Never re-serialize before verifying.** Never verify against a round-tripped object.

Anything that fails verification is dropped and logged — never coerced, never partially
applied ([PROTOTYPE_BASELINE.md](../principles/PROTOTYPE_BASELINE.md)).

This applies whatever the payload encoding is. It is the reason canonicalization never
becomes your problem.

---

## Local store: not protobuf

TinyBase cells hold primitives. Protobuf bytes would need base64 to live in one — a 33% size
penalty on a store already bounded by browser quota, and encoded fields stop being queryable.

**Keep local persistence primitive-shaped, with Zod `parse` on every write.** The store is a
boundary like any other; malformed data must not be able to land in it.

Brands are compile-time only and **do not survive serialization**. Re-apply them with
`parseX`/`assertX` when reading back ([BRANDED_TYPES.md](BRANDED_TYPES.md)).

---

## Export: JSON, versioned

Export stays **JSON**, deliberately, even though the wire is binary.

A protobuf blob is not self-describing — without the schema it's opaque, which is precisely
the lock-in that "data should outlive the app"
([PRINCIPLES_AND_GOALS.md](../principles/PRINCIPLES_AND_GOALS.md) §4) exists to prevent. The export is the
artifact most likely to be opened years later by something that isn't this app, and fidelity
is worth less than legibility there.

Every export carries a **format version** as a top-level field. On import: read the version
first, refuse what you can't handle with a clear message, and never attempt a best-effort
parse of an unknown format.

```jsonc
{ "formatVersion": 1, "exportedAt": "2026-09-03T14:22:10.500Z", "user": {/* … */} }
```

Export remains **whole-user** — identity, profile, content, settings in one blob. No
piecemeal paths.

---

## Timestamps

**ISO 8601 UTC in JSON; integer epoch milliseconds on the proto wire.** Convert to local time
only for display. This is the same rule as [VERSIONING.md](../operations/VERSIONING.md), applied to every
timestamp in the app.

Keep the two clocks distinct and never cross them: the author's **signed `ts`** decides
conflicts; the locally-stamped **`receivedAt`** drives staleness. A peer's wall clock is
never trusted for freshness ([PROTOTYPE_BASELINE.md](../principles/PROTOTYPE_BASELINE.md)).

---

## Libraries

| Package         | Role                                                   | Verdict                                                                                                           |
| --------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `ts-proto`      | Generates TS from `.proto`                             | **Use.** Emits plain interfaces and direct `encode`/`decode` — generated code reads like code you'd have written. |
| `@bufbuild/buf` | Schema lint, breaking-change detection, codegen driver | **Use.** Replaces `protoc` entirely; no system install, no plugin `PATH` juggling.                                |
| `zod`           | Semantic validation after decode                       | **Keep.** Already in the stack.                                                                                   |
| `protovalidate` | CEL constraint annotations in `.proto`                 | **Optional.** Take it only if you'd rather have one artifact for wire constraints.                                |

**buf and the codegen plugin are independent choices.** `buf lint`, `buf breaking`, and
`buf generate` are plugin-agnostic, so picking a generator costs nothing on the tooling side.
Use buf regardless of which generator you land on.

### Why `ts-proto` over `protobuf-es`

Both are good, and the trade-off is real rather than lopsided:

|                     | `ts-proto`                                            | `protobuf-es`                                               |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| **Output shape**    | Plain interfaces + `Msg.encode/decode`                | Plain objects + schema handles, `fromBinary(Schema, bytes)` |
| **Bundle at scale** | Codecs inlined per message — grows with message count | Fixed shared runtime + compact schemas — flatter curve      |
| **Configurability** | Extensive                                             | Opinionated, few knobs                                      |
| **Provenance**      | Community, very active                                | buf first-party, conformance-tested                         |

**Ergonomics win at this size.** A prototype trades in a few dozen message types, where the
bundle difference is noise and readable generated code pays off every time someone opens it.
That calculus inverts on a large schema — if message count grows into the hundreds,
re-evaluate, and treat `protobuf-es` as the documented alternative rather than a rewrite.

### Presence: decide it in the `.proto`

**Field presence is a property of the schema, not of the generator.** Get this right in the
`.proto` and the TypeScript follows; get it wrong and no generator flag can rescue it.

| Declaration                 | Can distinguish unset from default?                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------- |
| `string name = 1;`          | **No.** proto3 singular scalars have no presence — unset and `""` are identical on the wire. |
| `optional string name = 1;` | **Yes.** Explicit presence (a synthetic oneof under the hood).                               |
| `Profile profile = 2;`      | **Yes.** Message fields always have presence.                                                |
| `repeated string tags = 3;` | **No.** Empty and absent are the same.                                                       |

**The rule: if "unset" means something different from "empty" or "zero", declare it
`optional`.** Otherwise the zero value _is_ the meaning, and that's fine — say so deliberately.

What's forbidden is the middle ground: letting `0`, `""`, or an empty list stand in for
"missing" on a field with no presence. That's the sentinel anti-pattern
[DESIGN_AND_DEVELOPMENT.md](DESIGN_AND_DEVELOPMENT.md) rules out — a default silently standing
in for an absent value, which surfaces as wrong behavior far from its cause.

**Then set the generator to mirror the schema.** `ts-proto`'s `useOptionals` chooses only how
faithfully the emitted TypeScript reflects the presence the `.proto` already declares:
`messages` marks message fields optional, `all` marks everything optional including scalars
that cannot be absent, `none` marks everything required including fields that genuinely can be.
`all` and `none` both produce types that disagree with the wire — in opposite directions.

Pick the setting that matches your schema, pin it in `buf.gen.yaml`, and treat a change to it
as a decision worth recording. A generated type that misreports presence is a type that lies,
and [SUMMARY.md](../SUMMARY.md) stakes its first principle on types encoding intent.

**Install nothing globally.** Both `buf` and the generator are devDependencies, so the version
is pinned in the lockfile and CI uses exactly what you use. A globally installed `protoc` is
unreproducible by construction.

Install commands: [SETUP_NEW.md](../operations/SETUP_NEW.md) → Dependencies. Version policy:
[MAINTENANCE.md](../operations/MAINTENANCE.md).

## Repo layout

```
buf.yaml                module config: workspace modules, lint + breaking rulesets
buf.gen.yaml            codegen config: plugins, options, output path
proto/
  <package>/v1/*.proto  messages, in directories matching their package
```

The two config files sit at the **repo root**, not inside `proto/`. `buf generate` resolves
`buf.gen.yaml` from the working directory, so keeping both at the root makes every command
argument-free and run identically from a script, a shell, and CI.

`proto/` sits at the repo root rather than under `src/` — it's a language-neutral contract,
not TypeScript. Generated output lands in `src/gen/` and hand-written refinements in
`src/wire/` → [PROJECT_LAYOUT.md](PROJECT_LAYOUT.md).

### Multiple files and subdirectories

`proto/` is a **module root**: every `.proto` beneath it is discovered recursively, with no
per-file registration. Generated output mirrors the source tree
(`proto/devalbo/v1/envelope.proto` → `src/gen/devalbo/v1/envelope.ts`).

Three rules follow from that:

- **The directory path must match the `package`.** `package devalbo.v1;` lives at
  `devalbo/v1/`. This is enforced by lint (`PACKAGE_DIRECTORY_MATCH` in the `STANDARD`
  ruleset), not merely conventional — so the tree always tells you the package.
- **Imports are module-root-relative**, never file-relative:
  `import "devalbo/v1/envelope.proto";` from anywhere, never `../v1/envelope.proto`.
- **Generation is `clean`** — `src/gen` is emptied before each run, so deleting a `.proto`
  removes its generated file instead of orphaning one. This is what makes the no-diff CI check
  catch deletions as well as edits, and it's why nothing hand-written may live in `src/gen`.

Split files by domain as the schema grows (`devalbo/v1/identity.proto`,
`devalbo/v1/presence.proto`). Reach for a second **module** only if part of the schema needs
to version independently of the rest — one module is right until proven otherwise.

**Version the package path, not the file name** — `foo/v1/envelope.proto`. When a breaking
change is genuinely necessary, `v2` lives alongside `v1` and both can be served during a
migration window. Renaming a file gives you none of that.

## Workflow

**Changing a message:**

1. Edit the `.proto`. Add fields with new numbers; `reserved` anything you remove.
2. `npm run proto:lint` — catches naming and structural problems before they're baked in.
3. `npm run proto:breaking` — confirms the change is wire-compatible with `main`.
4. `npm run proto:gen` — regenerate TS.
5. Update the Zod refinement only if the _semantic_ constraints changed. Adding a proto field
   does not automatically require a Zod change.
6. Commit `.proto` and generated output **together**.

**Commit generated code.** It costs diff noise and buys three things worth more: clone-and-run
works without a codegen step (the minimal-setup principle in
[PRINCIPLES_AND_GOALS.md](../principles/PRINCIPLES_AND_GOALS.md)), wire-contract changes become visible in
review rather than hidden behind a build step, and a reviewer can see that a field number
moved.

The risk is drift — generated output diverging from the `.proto` that supposedly produced it.
Close it in CI rather than with discipline:

```bash
npm run proto:gen && git diff --exit-code src/gen
```

A non-empty diff fails the build. Regeneration is then verified, not assumed.

## Scripts

```jsonc
{
  "scripts": {
    "proto:gen": "buf generate",
    "proto:lint": "buf lint",
    "proto:format": "buf format -w",
    "proto:breaking": "buf breaking --against '.git#branch=main'",
    "proto:check": "npm run proto:lint && npm run proto:gen && git diff --exit-code src/gen",
  },
}
```

`proto:check` is the CI entry point — lint, regenerate, and fail if the committed output
doesn't match what the `.proto` files produce.

**`proto:lint` belongs in the gated `build`**; it's fast and self-contained, like every other
gate ([TOOLING.md](TOOLING.md)).

**`proto:breaking` belongs in CI, not the local build.** It needs a baseline ref to compare
against, so it's meaningless on a machine with uncommitted work and misleading on a detached
checkout.

## CI

Three checks, in this order:

1. **`proto:lint`** — schema hygiene.
2. **`proto:breaking` against the default branch** — the mechanical enforcement of "storage
   layout is a contract". This is the check that makes the commitment real; without it, the
   contract is a sentence in a doc.
3. **Regeneration produces no diff** — the drift gate above.

A deliberate breaking change is not a failure to route around silently: bump the package
version directory, and record the decision and its migration plan
([SDLC_PROCESS.md](../practices/SDLC_PROCESS.md) → Recording decisions).

## Testing the wire

Two properties are worth testing directly, because both fail silently in production:

- **Round-trip.** Encode → decode returns an equivalent message, for each message type.
- **Signature integrity.** A tampered `payload` byte fails verification, and a valid envelope
  survives encode/transmit/decode with its signature intact. This is the test that would catch
  a re-serialize-before-verify regression — the exact defect the envelope rule exists to
  prevent.

Both are pure logic with no React and no network, which is where
[PROTOTYPE_BASELINE.md](../principles/PROTOTYPE_BASELINE.md) says protocol code belongs.

## Cross-language

If a Rust or WASM component ever appears, the `.proto` is already the shared contract — that's
a real option this buys you, and it aligns with the portability bias in
[TOOLING.md](TOOLING.md). Don't adopt protobuf _for_ this reason alone; do note that adopting
it keeps the door open.

---

## Still open

**The local migration mechanism.** Protobuf gives the _wire_ a real evolution discipline, and
a format version gives _exports_ a compatibility gate. Neither answers what happens when a
user opens the app and their locally stored data predates the current schema — or postdates
it, because they ran a newer build on another device.

**The policy is now decided; the mechanism is not.** Migration is deliberately deferred during
discovery and becomes a release blocker at the first beta →
[PRINCIPLES_AND_GOALS.md → Data migration is a beta-gated concern](../principles/PRINCIPLES_AND_GOALS.md#data-migration-is-a-beta-gated-concern).
What that policy will eventually need and does not yet have is the machinery: stamping a version
on stored data, running ordered migrations on load, and handling data from the future.

One requirement lands from day one and belongs here: **stored data carries a `schemaVersion`,
and an unrecognized one is refused rather than best-effort parsed.** That is the rule this doc
already applies to the export blob's `formatVersion` — read the version first, refuse what you
can't handle, never guess at an unknown shape. Storage and export differ in _when migration
arrives_, not in whether an unknown version may be interpreted.
