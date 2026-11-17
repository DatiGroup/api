
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

import zodToJsonSchema from 'zod-to-json-schema';
import { adminActivityParamsSchema, adminActivityResponseSchema } from './schema';
import { getAdminActivityHandler } from './handler';
import { RoleEnum } from '../../../../../types/role';
import { SwaggerSectionTags } from '../../../../../manual/swagger';

const AdminLogRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const server = fastify;


    server.get('/user/:entityId', {
        onRequest: server.protect([RoleEnum.portalAdminUserView]),
        schema: {
            tags: [SwaggerSectionTags.approve.name],
            summary: 'Get user details',
            params: zodToJsonSchema(adminActivityParamsSchema),
            response: { 200: zodToJsonSchema(adminActivityResponseSchema) }
        },
        handler: getAdminActivityHandler
    });

}

export default AdminLogRoutes; 