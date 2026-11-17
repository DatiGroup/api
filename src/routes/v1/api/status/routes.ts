
import { FastifyInstance, FastifyPluginAsync, } from 'fastify';
import { appStatusHandler, getRegistrationCountries } from './handlers/appStatusHandler';
import { appStatusSchema } from './schema/appStatusSchema';
import { SwaggerSectionTags } from '../../../../manual/swagger';
import zodToJsonSchema from 'zod-to-json-schema';
import { fndLookupTlSchema } from '../lookups/schema';
import { RoleEnum } from '../../../../types/role';
import { UserSocketEventEnum } from '../../../../plugins/socket/_socketType';

const StatusRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const server = fastify;

  server.get('/', {
    schema: {
      tags: [SwaggerSectionTags.status.name],
      response: {
        200: appStatusSchema
      }
    },
    handler: appStatusHandler
  });

  server.get('/registration-countries', {
    schema: {
      tags: [SwaggerSectionTags.status.name],
      response: {
        200: zodToJsonSchema(fndLookupTlSchema)
      }
    },
    handler: getRegistrationCountries
  });

  // THIS IS TEST ROUTE ONLY, TO BE REMOVED LATER
  fastify.get('/socket-update', {
    onRequest: server.protect([RoleEnum.portalClientEdit]),
    schema: {
      tags: [SwaggerSectionTags.root.name],
      summary: 'Test socket',
    }
  }, (req) => {

    req.log.info('Socket update test called');
    req.server.userNsp.update({ eventType: UserSocketEventEnum.updateResource, userIds: [1, 2, 9, 4] })
    return { posted: 'ok' }
  });
}

export default StatusRoutes; 