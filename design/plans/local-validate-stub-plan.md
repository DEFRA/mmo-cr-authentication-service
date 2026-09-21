# Plan: Local `POST /validate` stub endpoint

Approved 2026-09-20. Source request: [design/github-prompts/local-stub-for-testing-prompt.md](../github-prompts/local-stub-for-testing-prompt.md).

Decision: route is **always registered** (not environment-gated), consistent with existing `/health` and `/example` routes. Marked clearly as a local-dev-only stub via code comments and a README note.

## Objective

Add a **local-dev-only** stub endpoint `POST /validate` to the Authentication Service that satisfies the token-validation contract the MMO Catch Recording Reference Data Service's HTTP client already expects, using a hard-coded in-memory token map. This is **not** real authentication — no JWT/OAuth, no persistence, no permissions management.

**In scope:** one new route module, a small in-memory token-lookup service, Joi header validation, Boom 401 error shape, router registration, Vitest `server.inject` tests, and clear "local-dev-only stub" marking (code comment + README note).

**Out of scope:** real token issuance/JWT/OAuth/login, roles/permissions management, any datastore wiring, restructuring existing scaffolding, deliberately implementing 403/502/503/504.

## Implementation steps

1. **[src/services/ValidateToken.js](../../src/services/ValidateToken.js)** (new) — frozen in-memory map + `validateToken(token)` lookup:

   ```js
   // LOCAL-DEV-ONLY STUB — fixed test tokens, not real authentication. Do not use in any deployed environment.
   const localDevTokens = Object.freeze({
     'read-token': {
       actorId: 'local-reader',
       permissions: ['reference-data.read']
     },
     'write-token': {
       actorId: 'local-writer',
       permissions: ['reference-data.read', 'reference-data.write']
     },
     'no-permission-token': { actorId: 'local-none', permissions: [] }
   })

   export function validateToken(token) {
     return localDevTokens[token] ?? null
   }
   ```

2. **[src/routes/validate.js](../../src/routes/validate.js)** (new) — `POST /validate`:
   - Joi header validation: `authorization` optional string, `.unknown(true)` to allow other headers.
   - Handler parses `Bearer <token>` from `authorization`; missing/malformed/unknown token → `Boom.unauthorized()`; found → `200 { actorId, permissions }`.
   - Echo `x-cdp-request-id` response header back if present in the request.

3. **[src/plugins/router.js](../../src/plugins/router.js)** (edit) — import and register the new route in the `server.route([...])` chain.

4. **[src/routes/validate.test.js](../../src/routes/validate.test.js)** (new) — Vitest + `server.inject`:
   - 200 for `read-token`, `write-token`, `no-permission-token` (assert exact body shape incl. empty `permissions` array).
   - 401 for unknown token, missing header, malformed header (no `Bearer` prefix).
   - Optional: assert `x-cdp-request-id` echoed back when supplied.
   - Optional small unit test for `validateToken` directly.

5. **[README.md](../../README.md)** (edit) — short section noting `/validate` is a local-dev-only stub, not production auth.

## Validation

- `npm test` (coverage), `npm run lint`, `npm run format:check`.
- Manual curl acceptance checks:

  ```
  curl -s -X POST http://localhost:<port>/validate -H "Authorization: Bearer read-token"
  # => 200 { "actorId": "local-reader", "permissions": ["reference-data.read"] }

  curl -s -X POST http://localhost:<port>/validate -H "Authorization: Bearer not-a-real-token"
  # => 401
  ```

## Risks

- Security-relevant surface even as a stub — mitigated via prominent comments + README note.
- Hard-coded tokens are fixed local-dev values, not secrets — acceptable to commit, but must not be mistaken for real credentials.
