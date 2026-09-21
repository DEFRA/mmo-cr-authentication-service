describe('#validate route', () => {
  let server

  beforeAll(async () => {
    // Dynamic import needed due to config being updated by vitest-mongodb
    const { createServer } = await import('#/server.js')

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should return 200 with the fixed stub identity for a normal Bearer token', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/validate',
      headers: { authorization: 'Bearer read-token' }
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual({
      actorId: 'local-stub',
      permissions: ['reference-data.read', 'reference-data.write']
    })
  })

  test('Should return 200 with the fixed stub identity for an unknown token', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/validate',
      headers: { authorization: 'Bearer not-a-real-token' }
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual({
      actorId: 'local-stub',
      permissions: ['reference-data.read', 'reference-data.write']
    })
  })

  test.each([
    ['is missing', undefined],
    ['has no Bearer prefix', 'read-token']
  ])(
    'Should return 200 with the fixed stub identity when the authorization header %s',
    async (_description, authorization) => {
      const { statusCode, result } = await server.inject({
        method: 'POST',
        url: '/validate',
        headers: authorization ? { authorization } : {}
      })

      expect(statusCode).toBe(200)
      expect(result).toEqual({
        actorId: 'local-stub',
        permissions: ['reference-data.read', 'reference-data.write']
      })
    }
  )

  test('Should echo x-cdp-request-id back as a response header when supplied', async () => {
    const { headers } = await server.inject({
      method: 'POST',
      url: '/validate',
      headers: {
        authorization: 'Bearer read-token',
        'x-cdp-request-id': 'test-request-id'
      }
    })

    expect(headers['x-cdp-request-id']).toBe('test-request-id')
  })
})
