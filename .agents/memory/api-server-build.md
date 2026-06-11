---
name: api-server build/typecheck
description: TS project-reference gotcha when changing shared schema/contract in this monorepo.
---

`artifacts/api-server` uses TS project references. After changing shared packages (`lib/db` schema, generated zod/client), a stale `.tsbuildinfo` can make typecheck fail with TS2305 (module has no exported member) even though the export exists.

**Fix:** `cd artifacts/api-server && npx tsc --build --force` to refresh, or run `pnpm -r run typecheck`.

**Note:** The dev workflow bundles via esbuild (not project refs), so the running server can be fine while typecheck is stale, or vice-versa. Always restart the api-server workflow after route changes to load new code.
