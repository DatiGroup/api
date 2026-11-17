import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { SwaggerSectionTags } from '../../../../manual/swagger'

import zodToJsonSchema from 'zod-to-json-schema'
import { registerPayloadSchema, RegisterPayloadType } from './registerSchema'
import { crudReponseSchema } from '../../../../sharedShema/response'
import { registerUser } from './registerHandlers'

const RegisterRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const server = fastify

  server.post<{ Body: RegisterPayloadType }>('/', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      },
    },
    preValidation: server.zodValidate(registerPayloadSchema),
    schema: {
      tags: [SwaggerSectionTags.register.name],
      summary: 'Creates user in keycloak and in database',
      body: zodToJsonSchema(registerPayloadSchema),
      response: { 200: zodToJsonSchema(crudReponseSchema) },
    },
    handler: registerUser,
  })
}

export default RegisterRoutes
