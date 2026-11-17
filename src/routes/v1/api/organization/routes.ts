import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { SwaggerSectionTags } from "../../../../manual/swagger";
import zodToJsonSchema from "zod-to-json-schema";
import { z } from "zod";
import { getActiveOrg, getUsers, switchOrg } from "./handler";
import { RoleEnum } from "../../../../types/role";
import { activeOrgSchema, orgUserSchema, switchOrgScheme } from "./schema";
import { crudReponseSchema } from "../../../../sharedShema/response";


const OrganizationRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const server = fastify;

    server.get('/users', {
        onRequest: server.protect([RoleEnum.portalClientView]),
        schema: {
            tags: [SwaggerSectionTags.organization.name],
            summary: 'Get list of organization users',
            // response: { 200: zodToJsonSchema(z.array(orgUserSchema)) }
        },
        handler: getUsers
    });

    server.post('/switch-org', {
        onRequest: server.protect([RoleEnum.portalClientView]),
        schema: {
            tags: [SwaggerSectionTags.organization.name],
            summary: 'Switch active organization',
            body: zodToJsonSchema(switchOrgScheme),
            response: {
                200: zodToJsonSchema(crudReponseSchema)
            }
        },
        handler: switchOrg
    });

    server.get('/active', {
        onRequest: server.protect([RoleEnum.portalClientView]),
        schema: {
            tags: [SwaggerSectionTags.organization.name],
            summary: 'Get active organization',
            response: {
                200: zodToJsonSchema(activeOrgSchema)
            }
        },
        handler: getActiveOrg
    })

}

export default OrganizationRoutes;