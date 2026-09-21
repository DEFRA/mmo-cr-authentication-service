# Plan: Remove MongoDB + /example, always-allow /validate stub

Approved 2026-09-20 (follow-up to [local-validate-stub-plan.md](local-validate-stub-plan.md)).

Decisions confirmed: single fixed identity `{ actorId: 'local-stub', permissions: ['reference-data.read', 'reference-data.write'] }`; do NOT uninstall `mongodb`/`mongo-locks`/`vitest-mongodb` from package.json (leave dependencies installed but unused); full plan approved otherwise.

## Objective

Zero-external-dependency local stub:

1. `POST /validate` always returns `200` with the fixed identity above, for any request.
2. Remove MongoDB integration from server bootstrap entirely (plugin, mongo-locks, config, /example route+service, related tests/test infra).
3. Remain deployable on DEFRA CDP — keep all other CDP plugins, unauthenticated `GET /health`, secure headers, strict config validation.
4. Record the architectural decision as an ADR.

## File changes

- **Edit** [src/server.js](../../src/server.js) — drop `mongoDb` import + registration; keep `[requestLogger, requestTracing, metrics, secureContext, pulse, router]`.
- **Edit** [src/plugins/router.js](../../src/plugins/router.js) — drop `example` import/registration; `server.route([health, validate])`.
- **Edit** [src/config.js](../../src/config.js) — remove `mongo` config block + `convictValidateMongoUri` import/registration.
- **Edit** [src/routes/validate.js](../../src/routes/validate.js) — always-200 handler, no Boom/401 logic, keep `x-cdp-request-id` echo.
- **Edit** [src/services/ValidateToken.js](../../src/services/ValidateToken.js) — replace token map with single frozen identity + `getStubIdentity()`.
- **Edit** [src/routes/validate.test.js](../../src/routes/validate.test.js) — rewrite for always-200 (no header, garbage token, normal Bearer, request-id echo).
- **Edit** [vitest.config.js](../../vitest.config.js) — remove `.vite/mongo-memory-server.js` from `setupFiles`.
- **Edit** [README.md](../../README.md) — drop /example rows, rewrite /validate section for always-allow, remove MongoDB Locks helper section, drop Mongo from Compose feature list.
- **Add** `docs/adr/0001-remove-mongodb-from-server-bootstrap.md` (per template, capturing context/decision/consequences from the plan).
- **Delete**: [src/routes/example.js](../../src/routes/example.js), [src/services/ExampleFind.js](../../src/services/ExampleFind.js), [src/plugins/mongodb.js](../../src/plugins/mongodb.js), [src/plugins/mongodb.test.js](../../src/plugins/mongodb.test.js), [src/common/helpers/mongo-lock.js](../../src/common/helpers/mongo-lock.js), [src/common/helpers/mongo-lock.test.js](../../src/common/helpers/mongo-lock.test.js), [src/common/helpers/convict/validate-mongo-uri.js](../../src/common/helpers/convict/validate-mongo-uri.js), [src/common/helpers/convict/validate-mongo-uri.test.js](../../src/common/helpers/convict/validate-mongo-uri.test.js), `.vite/mongo-memory-server.js`.
- **package.json:** leave `mongodb`, `mongo-locks`, `vitest-mongodb` installed/listed — do NOT uninstall, per explicit user instruction.

## Contract impact

- `GET /example`, `GET /example/{exampleId}` removed — breaking, but template placeholders with no real consumers.
- `POST /validate` — no longer returns 401 for missing/unknown tokens; always 200 with the fixed identity. Deliberate breaking change to the error contract, recorded here and in the ADR.
- `GET /health` unchanged.

## Validation

- Rewrite `validate.test.js` per above.
- Confirm no remaining test imports `vitest-mongodb`/`mongodb`/`mongo-locks`.
- `npm run lint`, `npm run format:check`, `npm test` — must pass with no Mongo instance running.

## Risks

- Loses Mongo-backed example/mongo-lock reference patterns (recoverable via git history if persistence is added later).
- `/validate` now authorises everything — must not be relied on outside local dev; ADR + comments + README flag this.
- CDP may still provision Mongo; connection simply goes unused if so (harmless, no code references it).
