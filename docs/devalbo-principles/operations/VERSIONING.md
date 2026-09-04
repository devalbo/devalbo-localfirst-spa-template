# Versioning and Build Information

How the app knows — and shows — which build it is. A deployed SPA otherwise gives you no
way to answer "is the user looking at the fix I shipped?", and browser caching makes
guessing unreliable.

**Terms:** **SemVer** (Semantic Versioning) — MAJOR.MINOR.PATCH. **SHA** — the git commit
identifier; we use the short 7-character form. **UTC** (Coordinated Universal Time) — all
timestamps are generated and stored in UTC, converted to local time only for display.

---

## What gets tracked

Three things, from three sources:

1. **Release version** — SemVer from `package.json` (`0.1.0`).
2. **Build metadata** — git short SHA, branch, and build timestamp.
3. **Release tag** — optional git tag for a production release (`v0.1.0`), set by CI.

All injected at build time and surfaced in the UI.

## The constants

```ts
__APP_VERSION__; // "0.1.0" from package.json
__GIT_COMMIT_SHA__; // "abc1234" (short SHA)
__GIT_BRANCH__; // "main" or a feature branch name
__BUILD_TIMESTAMP__; // ISO 8601 UTC: "2026-01-31T18:30:45.123Z"
__BUILD_ENV__; // "development" | "production"
__RELEASE_TAG__; // "v0.1.0" | undefined
```

## Injection

Vite's `define` replaces these at build time — no runtime cost, no network fetch, and the
values are frozen into the bundle they describe:

```ts
// vite.config.ts
import { execSync } from "node:child_process";
import pkg from "./package.json" with { type: "json" };

const git = (cmd: string) => execSync(cmd).toString().trim();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_COMMIT_SHA__: JSON.stringify(git("git rev-parse --short HEAD")),
    __GIT_BRANCH__: JSON.stringify(git("git rev-parse --abbrev-ref HEAD")),
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    __BUILD_ENV__: JSON.stringify(process.env.NODE_ENV ?? "development"),
    __RELEASE_TAG__: JSON.stringify(process.env.VITE_RELEASE_TAG),
  },
});
```

Declare them so TypeScript knows they exist:

```ts
// src/vite-env.d.ts
/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __GIT_COMMIT_SHA__: string;
declare const __GIT_BRANCH__: string;
declare const __BUILD_TIMESTAMP__: string;
declare const __BUILD_ENV__: "development" | "production";
declare const __RELEASE_TAG__: string | undefined;
```

**A detached HEAD or a build from a tarball has no git context.** Decide what happens then —
fail the build, or substitute a marked placeholder like `"nogit"`. Don't let it silently
produce an empty string that renders as a blank badge.

---

## Time

`__BUILD_TIMESTAMP__` follows the app-wide rule — **stored in UTC, displayed in local time**
→ [SERIALIZATION.md](../architecture/SERIALIZATION.md).

```ts
const built = new Date(__BUILD_TIMESTAMP__);

built.toLocaleString(); // "1/31/2026, 10:30:45 AM" — user's timezone, for the UI
built.toISOString(); // "2026-01-31T18:30:45.123Z" — UTC, for bug reports
```

The one build-specific point: on a technical surface (an about panel, a diagnostics view)
show **both**, so a bug report from another timezone is unambiguous about which build it
came from.

---

## Display

Surface it somewhere always reachable — a footer badge, an about panel, or both:

```tsx
export function VersionBadge() {
  const version = __RELEASE_TAG__ ?? `v${__APP_VERSION__}`;
  const built = new Date(__BUILD_TIMESTAMP__).toLocaleDateString();
  return (
    <span>
      {version} • {__GIT_COMMIT_SHA__} • {built}
    </span>
  );
}
```

```
myapp v0.1.0  •  abc1234  •  Jan 31, 2026
```

In development, a **build age** indicator ("3h ago", "2d ago") is worth adding — it catches
the case where you're looking at a stale bundle and don't know it.

Show the branch when it isn't `main`; on a release build, prefer the tag over the raw
version.

---

## SemVer

- **MAJOR** — breaking changes.
- **MINOR** — new features, backward-compatible.
- **PATCH** — bug fixes, backward-compatible.

**Pre-1.0** (`0.x.y`) means the API is not stable and breaking changes can land in a minor
bump. Say so plainly rather than implying stability you haven't committed to.

## Cutting a release

Before: everything merged, tests passing, gated build succeeds locally, and you've decided
the bump.

```bash
npm version minor -m "Release v%s"   # bumps package.json, commits, tags
git push origin main
git push --tags                      # tag push triggers the release build
```

Then confirm the deployed app shows the expected version — that check is the entire reason
this doc exists.

**In CI**, set `VITE_RELEASE_TAG` from the pushed tag so tagged builds are distinguishable
from ordinary main builds. Everything else is derived from the checkout, so a CI build needs
full git history — a shallow clone yields the wrong branch and SHA.

---

## Notes

- **Version info is build-time, not runtime.** A rebuild is the only thing that changes it;
  if the badge looks stale after deploying, suspect the browser cache or the CDN before the
  injection.
- **Reproducibility matters more than the badge.** Pin the runtime (`.nvmrc`), commit the
  lockfile, and pin CI images — a version string is only useful if the build it names can
  be reproduced. See [SUMMARY.md](../SUMMARY.md) → Build, deploy & operations.
