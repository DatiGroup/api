
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

import zodToJsonSchema from 'zod-to-json-schema';
import { infoEmailSchema } from './schema';
import { getAdminEmail, updateAdminEmail } from './handler';
import { RoleEnum } from '../../../../../types/role';
import { SwaggerSectionTags } from '../../../../../manual/swagger';
import { crudReponseSchema } from '../../../../../sharedShema/response';

const AdminInfoRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const server = fastify;


    server.get('/email', {
        onRequest: server.protect([RoleEnum.portalAdminUserView]),
        schema: {
            tags: [SwaggerSectionTags.adminInfo.name],
            summary: 'Get info email',
            response: { 200: zodToJsonSchema(infoEmailSchema) }
        },
        handler: getAdminEmail
    });

    server.post('/email', {
        onRequest: server.protect([RoleEnum.portalAdminUserEdit]),
        schema: {
            tags: [SwaggerSectionTags.adminInfo.name],
            summary: 'Update info email',
            body: zodToJsonSchema(infoEmailSchema),
            response: { 200: zodToJsonSchema(crudReponseSchema) }
        },
        handler: updateAdminEmail
    });


}

export default AdminInfoRoutes; 