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

  test('Should return 200 with actorId and permissions for read-token', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/validate',
      headers: { authorization: 'Bearer read-token' }
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual({
      actorId: 'local-reader',
      permissions: ['reference-data.read']
    })
  })

  test('Should return 200 with actorId and permissions for write-token', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/validate',
      headers: { authorization: 'Bearer write-token' }
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual({
      actorId: 'local-writer',
      permissions: ['reference-data.read', 'reference-data.write']
    })
  })

  test('Should return 200 with empty permissions for no-permission-token', async () => {
    const { statusCode, result } = await server.inject({
      method: 'POST',
      url: '/validate',
      headers: { authorization: 'Bearer no-permission-token' }
    })

    expect(statusCode).toBe(200)
    expect(result).toEqual({
      actorId: 'local-none',
      permissions: []
    })
  })

  test('Should return 401 for an unknown token', async () => {
    const { statusCode } = await server.inject({
      method: 'POST',
      url: '/validate',
      headers: { authorization: 'Bearer not-a-real-token' }
    })

    expect(statusCode).toBe(401)
  })

  test('Should return 401 when the authorization header is missing', async () => {
    const { statusCode } = await server.inject({
      method: 'POST',
      url: '/validate'
    })

    expect(statusCode).toBe(401)
  })

  test('Should return 401 when the authorization header has no Bearer prefix', async () => {
    const { statusCode } = await server.inject({
      method: 'POST',
      url: '/validate',
      headers: { authorization: 'read-token' }
    })

    expect(statusCode).toBe(401)
  })

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
