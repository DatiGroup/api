
import { FastifyInstance, FastifyPluginAsync } from 'fastify';

import zodToJsonSchema from 'zod-to-json-schema';
import { approvalPayloadSchema, groupPayloadSchema, statusPayloadSchema, usersDetailsReponseSchema, usersStatusReponseSchema } from './userSchema';
import { SwaggerSectionTags } from '../../../../../manual/swagger';
import { changeUserStatus, getUserDetails, getUsersWithStatus } from './userHandlers';
import { RoleEnum } from '../../../../../types/role';
import { approveUserHandler, rejectUserHandler, userGroupUpdateHandler } from './userApprovalHandlers';
import { crudReponseSchema } from '../../../../../sharedShema/response';

const UserRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const server = fastify;

    server.get('/', {
        onRequest: server.protect([RoleEnum.portalAdminUserView]),
        schema: {
            tags: [SwaggerSectionTags.approve.name],
            summary: 'Approve user registration and send email to user',
            response: { 200: zodToJsonSchema(usersStatusReponseSchema) }
        },
        handler: getUsersWithStatus
    });
    server.get('/:userId', {
        onRequest: server.protect([RoleEnum.portalAdminUserView]),
        schema: {
            tags: [SwaggerSectionTags.approve.name],
            summary: 'Get user details',
            response: { 200: zodToJsonSchema(usersDetailsReponseSchema) }
        },
        handler: getUserDetails
    });

    server.post('/approve', {
        onRequest: server.protect([RoleEnum.portalAdminUserEdit]),
        schema: {
            tags: [SwaggerSectionTags.approve.name],
            summary: 'Approve user registration and send email to user',
            body: zodToJsonSchema(approvalPayloadSchema),
            response: { 200: zodToJsonSchema(crudReponseSchema) }
        },
        handler: approveUserHandler
    });

    server.post('/reject', {
        onRequest: server.protect([RoleEnum.portalAdminUserEdit]),
        schema: {
            tags: [SwaggerSectionTags.approve.name],
            summary: 'Reject user registration and send email to user',
            body: zodToJsonSchema(approvalPayloadSchema),
            response: { 200: zodToJsonSchema(crudReponseSchema) }
        },
        handler: rejectUserHandler
    });


    server.patch('/roles', {
        onRequest: server.protect([RoleEnum.portalAdminUserEdit]),
        schema: {
            tags: [SwaggerSectionTags.approve.name],
            summary: 'Update user roles',
            body: zodToJsonSchema(groupPayloadSchema),
            response: { 200: zodToJsonSchema(crudReponseSchema) }
        },
        handler: userGroupUpdateHandler
    });

    server.post('/status', {
        onRequest: server.protect([RoleEnum.portalAdminUserEdit]),
        schema: {
            tags: [SwaggerSectionTags.approve.name],
            summary: 'Update user status',
            body: zodToJsonSchema(statusPayloadSchema),
            response: { 200: zodToJsonSchema(crudReponseSchema) }
        },
        handler: changeUserStatus
    });

}

export default UserRoutes; 