
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { FromSchema } from "json-schema-to-ts";
import { SwaggerSectionTags } from '../manual/swagger';

const rootSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
  },
} as const;

type RootQuery = FromSchema<typeof rootSchema>;

const RootRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.get<{ Querystring: RootQuery }>('/health-check', {
    schema: {
      tags: [SwaggerSectionTags.root.name],
      summary: 'GET Hello Route',
      querystring: rootSchema,
      response: {
        200: {
          health: { type: 'string' }
        }
      }
    }
  }, (req) => {
    return { health: req.query.name || 'ok' }
  })
}


export default fp(RootRoutes)
