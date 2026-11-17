import { zodToJsonSchema } from 'zod-to-json-schema'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { SwaggerSectionTags } from '../../../../manual/swagger'
import { getMeHandler, updatePreferredLanguageHandler } from './handler'
import { changePreferredLanguage, meReponseSchema } from './schemas'
import { crudReponseSchema } from '../../../../sharedShema/response'

const PersonMeRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const server = fastify;
  server.get('/', {
    onRequest: server.protect([]),
    schema: {
      tags: [SwaggerSectionTags.me.name],
      response: {
        200: zodToJsonSchema(meReponseSchema)
      }
    },
    handler: getMeHandler
  })

  server.patch('/language', {
    onRequest: server.protect([]),
    schema: {
      tags: [SwaggerSectionTags.me.name],
      body: zodToJsonSchema(changePreferredLanguage),
      response: {
        200: zodToJsonSchema(crudReponseSchema)
      }
    },
    handler: updatePreferredLanguageHandler
  })
}

export default PersonMeRoutes