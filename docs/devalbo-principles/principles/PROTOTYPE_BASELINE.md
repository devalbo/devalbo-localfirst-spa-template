# Prototype Baseline — local-first P2P web apps

The default stack and expectations for a new **local-first, peer-to-peer browser prototype**.
Start here so each prototype doesn't re-litigate the same decisions.

This is the **concrete** layer: [PRINCIPLES_AND_GOALS.md](PRINCIPLES_AND_GOALS.md) says
local-first and data ownership are required; this doc says what that means in code. Pairs with
[AGENT_CONDUCT.md](../AGENT_CONDUCT.md) (how to work) and [TESTING.md](../testing/TESTING.md).

---

## The baseline, in one line

> Local-first state in the browser, **strictly peer-to-peer** over Trystero, **keypair identity** via
> WebCrypto, **Zod as the single source of truth** for every type, latest-stable libraries, and a
> **modern-browser** baseline — with **fail-loud** behaviour throughout.

---

## Defaults

### Local-first

- State lives in the browser and renders **instantly with no network**. The network syncs _changes_;
  it is never required to read what you already have.
- **TinyBase** is the local store (reactive + `createIndexedDbPersister` for persistence). Hydrate on
  mount → instant offline render.
- Cache last-known remote state locally; don't delete on disconnect — mark stale/offline.

### Strictly peer-to-peer

- **Trystero** for the WebRTC mesh, **public signaling by default** (zero-infra, e.g. nostr/MQTT) —
  no backend to run. **No server-backed transport** — if a reference offers a hosted fallback (e.g.
  Durable Objects), we take only the P2P path.
- **Do not use TinyBase's synchronizer.** Cross-peer sync is **our own** signed broadcast over
  Trystero, so the only thing on the wire is signed, validated envelopes between peers.
- **Sync whole signed state events, not deltas.** A peer broadcasts its _current state_; the receiver
  applies it. Carry **two clocks**: the author's signed `ts` (authoritative for **last-write-wins**)
  and a local **`receivedAt`** stamped on arrival (drives **staleness/recency**, never trusts peer
  wall clocks). Never cross the two — `ts` for conflicts, `receivedAt` for freshness.
- Trystero already encrypts the channel (keyed off the room password), so **signing — not our own
  encryption — is the baseline**. Reach for NaCl/libsodium boxes only if per-recipient encryption is
  genuinely needed.

### Keypair identity ("you are your public key")

- **WebCrypto Ed25519** (`crypto.subtle`) — **no crypto dependency**. Public key (base64url) is the
  stable person id; pair it with a human **handle** chosen once and **reused across rooms**.
- **No passwords.** A shareable **invite code** (in the room link) gates entry; identity is separate
  from room access.
- Generate keys **extractable** so the _whole user_ can be exported/imported (see below). The more
  secure non-extractable option is rejected because it can't be backed up.
- **Sign every outbound message; verify every inbound one** against its claimed key before it touches
  state. Trust is **TOFU** + optional fingerprint verification (truncated SHA-256 of the pubkey).

### Rooms & sharing

- Rooms are **on-demand and shareable** (invite code embedded in a link), not fixed.
- **Joined rooms are saved per user** with a switcher; one active room at a time.
- **Sharing is an explicit action, off by default** — nothing broadcasts until the user opts in.
- **Audience defaults to "all users"** in the room; an **advanced option** allows **selective
  per-peer sharing** (Trystero targeted `send(data, peerIds)`). Identity announcements broadcast to
  all; sensitive payloads honour the audience.

### Presence

- **Live presence is ephemeral**, derived from the Trystero peer set (`onPeerJoin`/`onPeerLeave` +
  an identity `hello`) — _not_ persisted. It is distinct from data staleness: a peer can be present
  but idle, or absent with valid cached data.

### History

- Keep an **append-only, timestamped log** of remote updates per peer (not just last-known), bounded
  by row count / age so the persisted store doesn't grow unbounded.

### Portability

- **Export/import the entire user** as one blob — keypair + handle + profile + saved rooms + contact
  labels/verify state — so a person fully restores on another device. No piecemeal "export key" path.

---

## Typing & validation

- **Protobuf owns wire shape and evolution; Zod owns semantic constraints.** The `.proto` is
  the authored source for anything crossing a peer boundary (field numbers, `reserved`,
  breaking-change detection); Zod validates the decoded message for what proto can't express.
  Never restate proto field types in Zod. → [SERIALIZATION.md](../architecture/SERIALIZATION.md)
- **Zod remains the single source of truth for stored and local-only types.** Infer TS types
  with `z.infer`; never hand-maintain a parallel type list.
- **TinyBase leverages the Zod schema** — derive the `TablesSchema` from it, and **`parse` every row
  before write** so malformed data can't land in the store.
- **Verify, then decode, then validate.** Check the signature against the envelope's payload
  bytes _as received_ — never re-serialize before verifying — then decode, then Zod-validate,
  then touch state. Bad message → fail loudly, never coerce.
  → [SERIALIZATION.md](../architecture/SERIALIZATION.md) (Signing: sign the bytes, never the object)

## Libraries & platform

- Install the **latest stable version of every library**. No pinning to old majors; resolve peer-dep
  conflicts forward, not by downgrading. Full policy — including the runtime's Active-LTS rule,
  the update cadence, and why pinning and "latest" aren't in conflict — in
  [MAINTENANCE.md](../operations/MAINTENANCE.md).
- Assume a **modern browser** (current Chrome / Safari / Firefox). **Feature-detect** the hard
  requirements (WebCrypto Ed25519, etc.) on startup and show a clear "unsupported browser" message —
  never fail silently.

## Behaviour (see [AGENT_CONDUCT.md](../AGENT_CONDUCT.md))

- **Fail loudly, no suppression**; **fix types at source**, don't cast at call sites
  → [DESIGN_AND_DEVELOPMENT.md](../architecture/DESIGN_AND_DEVELOPMENT.md). The prototype-specific case:
  **drop unverifiable input _and log it_** — a dropped peer message must never be silent, or
  a protocol bug looks identical to an idle peer.
- **Ask before adding dependencies.** A new prototype's deps (Trystero, TinyBase, Zod, a map/render
  lib, …) get explicit sign-off before `npm install` ([MAINTENANCE.md](../operations/MAINTENANCE.md)).
- Keep it **lint-clean and type-clean** — the gated `npm run build` must pass.

## Code placement

Directory structure and dependency direction: [PROJECT_LAYOUT.md](../architecture/PROJECT_LAYOUT.md). Two
rules matter specifically for a P2P prototype:

- **Browser-only APIs never run outside the browser.** WebCrypto, WebRTC, Geolocation, and storage
  APIs must not execute during prerender, SSR, or a test's module-load — gate them behind a mount
  effect or a client-only boundary. A prototype that crashes at build time because it reached for
  `crypto.subtle` at import time is the standard version of this mistake.
- **Separate protocol from wiring.** Pure logic — envelope shapes, signing/verification, state merge,
  identity — lives in plain modules with no React and no network, and is unit-tested with
  **vitest**. UI wiring is verified by running the app.
- The split is not stylistic: the pure half is where the correctness risk lives, and it's only
  cheaply testable if it never touches a component or a socket.

---

## Decision checklist for a new prototype

1. What's the **local store schema** (Zod → TinyBase tables)?
2. What messages cross the wire (the **signed envelope** kinds)?
3. **Signing-only**, or is per-recipient **encryption** actually required?
4. **Room/invite** model and what's saved per user.
5. What's **shared explicitly**, and what's the **audience** model (all vs selective)?
6. What's **ephemeral** (presence) vs **persisted** (data, history)?
7. What goes in the **whole-user export**?
8. Which **browser features** are hard requirements to feature-detect?
