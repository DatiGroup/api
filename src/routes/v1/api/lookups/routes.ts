
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { createClientLookupValue, createLookupCode, getCodes, getLanguages, getLookupValues, updateClientLookupValue, } from './handler';
import { createFndValuesSchema, editFndValuesSchema, fndCodesSchema, fndLanguagesSchema, fndLookupSchema, fndLookupTlSchema } from './schema';
import { SwaggerSectionTags } from '../../../../manual/swagger';
import zodToJsonSchema from 'zod-to-json-schema';
import { crudReponseSchema } from '../../../../sharedShema/response';
import { RoleEnum } from '../../../../types/role';


const LookupsRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const server = fastify;

  server.get('/languages', {
    onRequest: server.protect([RoleEnum.portalClientView]),
    schema: {
      request: {},
      tags: [SwaggerSectionTags.lookups.name],
      response: {
        200: zodToJsonSchema(fndLanguagesSchema)
      }
    },
    handler: getLanguages
  })


  server.get('/codes', {
    onRequest: server.protect([RoleEnum.portalClientView]),
    schema: {
      request: {},
      tags: [SwaggerSectionTags.lookups.name],
      response: {
        200: zodToJsonSchema(fndCodesSchema)
      }
    },
    handler: getCodes
  })

  server.post('/codes', {
    onRequest: server.protect([RoleEnum.portalAdminLookupEdit]),
    schema: {
      tags: [SwaggerSectionTags.lookups.name],
      summary: 'Creates a new lookup type',
      body: zodToJsonSchema(fndLookupSchema),
      response: {
        200: zodToJsonSchema(crudReponseSchema)
      }
    },
    handler: createLookupCode
  })

  server.get('/:lookupType', {
    onRequest: server.protect([RoleEnum.portalClientView]),
    schema: {
      request: {},
      tags: [SwaggerSectionTags.lookups.name],
      response: {
        200: zodToJsonSchema(fndLookupTlSchema)
      }
    },
    handler: getLookupValues
  })

  server.post('/:lookupType', {
    onRequest: server.protect([RoleEnum.portalAdminLookupEdit]),
    schema: {
      tags: [SwaggerSectionTags.lookups.name],
      body: zodToJsonSchema(createFndValuesSchema),
      response: {
        200: zodToJsonSchema(crudReponseSchema)
      }
    },
    handler: createClientLookupValue
  })

  server.patch('/:lookupType/:lookupValueId', {
    onRequest: server.protect([RoleEnum.portalAdminLookupEdit]),
    schema: {
      tags: [SwaggerSectionTags.lookups.name],
      body: zodToJsonSchema(editFndValuesSchema),
      response: {
        200: zodToJsonSchema(crudReponseSchema)
      }
    },
    handler: updateClientLookupValue
  })

}


export default LookupsRoutes;

