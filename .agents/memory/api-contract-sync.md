---
name: API contract sync
description: Keeping api-server route handlers consistent with the OpenAPI spec and generated clients.
---

The OpenAPI spec (`lib/api-spec/openapi.yaml`) is the source of truth. Generated zod (`lib/api-zod`) and react-query hooks (`lib/api-client-react`) are produced from it.

**Rule:** Express route handlers in `artifacts/api-server/src/routes/` must match the spec's HTTP method, path, AND documented side-effects exactly.

**Why:** Generated client hooks (e.g. `useUpdateTransaction`) hardcode the method/URL from the spec. If the server uses a different verb (PATCH vs PUT) the hook fails at runtime (Cannot PUT/404/405) even though both server and client typecheck independently — it's a silent integration break. Same for documented behavior: spec said delete-all clears transactions AND budgets, but handler only cleared transactions, leaving stale state.

**How to apply:** When editing a route, grep the spec for its operationId and confirm method, path params, and the `description` (side effects). Test the actual generated client path with curl against `$REPLIT_DEV_DOMAIN/api/...`, not just the server in isolation.
