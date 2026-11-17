
import { FastifyInstance, FastifyPluginAsync, } from 'fastify';
import { SwaggerSectionTags } from '../../../../manual/swagger';
import { termsHandler } from './termsHandler';
import zodToJsonSchema from 'zod-to-json-schema';
import { termsResponseSchema } from './schema';

const TermsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const server = fastify;

  server.get('/', {
    schema: {
      tags: [SwaggerSectionTags.status.name],
      response: {
        200: zodToJsonSchema(termsResponseSchema)
      }
    },
    config: {
      rateLimit: {
        max: 50,
        timeWindow: '1 minute'
      }
    },
    handler: termsHandler
  });

}

export default TermsRoutes; 