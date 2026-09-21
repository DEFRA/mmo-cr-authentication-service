import { health } from '#/routes/health.js'
import { validate } from '#/routes/validate.js'

export const router = {
  plugin: {
    name: 'router',
    register: (server, _options) => {
      server.route([health, validate])
    }
  }
}
