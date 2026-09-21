// LOCAL-DEV-ONLY STUB — always-allow fixed identity, not real authentication. Do not use in any deployed environment.
const stubIdentity = Object.freeze({
  actorId: 'local-stub',
  permissions: ['reference-data.read', 'reference-data.write']
})

export function getStubIdentity() {
  return stubIdentity
}
