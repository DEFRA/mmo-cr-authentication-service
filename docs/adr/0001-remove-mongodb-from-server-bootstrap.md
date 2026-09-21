# 1. Remove MongoDB from server bootstrap

Date: 2026-09-20

## Status

Accepted

## Context

The service was scaffolded from the DEFRA CDP Node.js backend template, which ships MongoDB, `mongo-locks`
and a `/example` route/service as removable reference scaffolding. This service has no persistence
requirement today: `POST /validate` is a local-dev-only stub that returns a fixed identity, and no other
route reads or writes data. The Mongo plugin, `mongo-locks` helper, `mongo` convict config block and
`/example` route/service were therefore unused surface area — extra config to validate, an extra service
dependency (and Docker Compose container) to run locally, and extra code to maintain and secure for no
functional benefit.

## Decision

Remove the `mongoDb` plugin registration, the `mongo-locks` helper, the `validate-mongo-uri` convict format,
the `mongo` config block, and the `/example` route and service (plus their tests and test infrastructure)
from the server bootstrap. `POST /validate` becomes an unconditional always-allow stub: Joi still validates
the request headers (`authorization` optional, unknown headers allowed, shared `failAction`), but the
handler always returns `200` with a single fixed identity
(`{ actorId: 'local-stub', permissions: ['reference-data.read', 'reference-data.write'] }`) regardless of
what (if anything) is sent.

This aligns with the DEFRA standards precedence (DEFRA > GDS > community): it reduces the deployed service's
attack surface and dependency footprint (Secure by Design), and keeps boundary validation on every route per
the [security instructions](../../.github/instructions/security.instructions.md), while being explicit that
`/validate` is not a real authentication mechanism. `mongodb`, `mongo-locks` and `vitest-mongodb` remain
listed in `package.json` (unused, per explicit user instruction) so they can be reinstated quickly if
persistence is added later.

## Consequences

### Positive

- Zero external runtime dependencies for the service to boot and serve `/health` and `/validate` — no
  MongoDB instance required locally or in any deployed environment.
- Smaller attack surface and less config to validate/secure (no Mongo URI, no lock collection).
- Simpler local development — nothing to run besides the Node process.

### Negative / Trade-offs

- Loses the Mongo-backed `/example` route, `ExampleFind` service and `mongo-locks` reference patterns.
  Mitigated: fully recoverable via git history if persistence is added later.
- `POST /validate` now authorises every request unconditionally and must not be relied on outside local
  development — a real authentication mechanism (JWT/OAuth or equivalent) must replace it before any
  non-local deployment. Flagged in the README and in code comments.
- CDP may still provision a MongoDB instance for this service; if so, the connection simply goes unused
  (harmless, no code references it).

### Compliance & Governance

- DEFRA standard(s) referenced: [security standards](https://defra.github.io/software-development-standards/standards/security_standards/)
  (Secure by Design, minimise attack surface), [Node.js standards](https://defra.github.io/software-development-standards/standards/node_standards/).
- Governance exception: None — fully compliant. `/validate`'s always-allow behaviour is a deliberate,
  documented local-dev-only stub and does not authorise anything in a deployed environment.

## Alternatives considered

- **Keep MongoDB wired but unused.** Rejected — carries the config/attack-surface cost of an unused
  dependency with no offsetting benefit.
- **Keep the token-map stub with `401`s for unknown tokens.** Rejected per explicit user request for a
  minimal, always-allow stub with a single fixed identity.
