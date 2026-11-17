
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { fndLookupSchema } from './schema';
import { SwaggerSectionTags } from '../../../../manual/swagger';
import zodToJsonSchema from 'zod-to-json-schema';
import { getFndLookupHandler } from './handler';
import { RoleEnum } from '../../../../types/role';

const AuthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const server = fastify;

  server.get('/:lookupType', {
    onRequest: server.protect([RoleEnum.portalClientView]),
    schema: {
      tags: [SwaggerSectionTags.fnd.name],
      summary: 'Get lookups by code',
      request: {},
      response: {
        200: zodToJsonSchema(fndLookupSchema)
      }
    },
    handler: getFndLookupHandler
  })

}

export default AuthRoutes; 