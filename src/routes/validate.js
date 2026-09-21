import Joi from 'joi'
import { getStubIdentity } from '#/services/ValidateToken.js'
import { failAction } from '#/common/helpers/fail-action.js'

export const validate = {
  method: 'POST',
  path: '/validate',
  options: {
    validate: {
      headers: Joi.object({
        authorization: Joi.string().optional()
      }).unknown(true),
      failAction
    }
  },
  handler: (request, h) => {
    const response = h.response(getStubIdentity())

    const requestId = request.headers['x-cdp-request-id']
    if (requestId) {
      response.header('x-cdp-request-id', requestId)
    }

    return response
  }
}
