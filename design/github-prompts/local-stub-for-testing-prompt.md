I need a minimal local stub endpoint added to this Authentication Service template project —
just enough to unblock the MMO Catch Recording Reference Data Service, which is already built
and calls this service's token-validation contract. This is NOT a request to implement real
authentication, real token issuance, or real permission management — just the bare-minimum
endpoint shape the Reference Data Service's HTTP client already expects.

## Contract to implement (provisional — defined by the calling service, not yet confirmed by

## any real spec)

Endpoint:
POST /validate

Request:

- Header: `Authorization: Bearer <token>`
- Header: `x-cdp-request-id: <correlationId>` (optional, tracing — echo it back if easy, not
  required for the stub to work)
- No request body.

Successful response (200):
Content-Type: application/json
{
"actorId": "<string>",
"permissions": ["<string>", ...]
}
`actorId` must be a string and `permissions` must be an array of strings — the caller
rejects any other shape as "malformed" and fails closed.

Failure responses the caller already understands:

- 401 — token missing, unknown, or invalid/expired
- 403 — token is recognised but not authorised (the caller treats this the same as "no
  permission", so returning 401 for any unrecognised token is also fine for a stub)
- 502/503/504 — treated as transient/retryable service-unavailable by the caller (no need to
  implement these paths deliberately, just don't return them by accident)

## What to build

A single route/handler for `POST /validate` that:

1. Reads the bearer token from the `Authorization` header.
2. Looks it up in a small hard-coded map of fixed local dev tokens, e.g.:
   - `read-token` → `{ actorId: "local-reader", permissions: ["reference-data.read"] }`
   - `write-token` → `{ actorId: "local-writer", permissions: ["reference-data.read", "reference-data.write"] }`
   - `no-permission-token` → `{ actorId: "local-none", permissions: [] }`
3. Returns 200 with the matching `{ actorId, permissions }` body if the token is found.
4. Returns 401 with any small JSON error body if the token is missing or not in the map.

Keep it to the smallest possible implementation using whatever this project's existing web
framework/routing convention already is (inspect the existing template routes/controllers and
follow the same pattern — don't introduce a new framework or restructure the project). No
database, no real JWT/OAuth validation, no persistence — an in-memory token map is the whole
"identity store" for now.

## Explicitly out of scope

- Do not implement real token issuance, JWT signing/verification, OAuth, or a login flow.
- Do not add a permissions/roles management system.
- Do not wire this into any datastore.
- Do not remove or restructure existing template scaffolding — add the one endpoint alongside
  it, following the template's existing conventions (routing, validation, error format) as
  closely as possible.

## Acceptance check

Once added, this must succeed:
curl -s -X POST http://localhost:<port>/validate \
-H "Authorization: Bearer read-token" # => 200 { "actorId": "local-reader", "permissions": ["reference-data.read"] }

And this must fail with 401:
curl -s -X POST http://localhost:<port>/validate \
-H "Authorization: Bearer not-a-real-token"
