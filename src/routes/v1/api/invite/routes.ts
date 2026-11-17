
import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import { SwaggerSectionTags } from '../../../../manual/swagger';
import zodToJsonSchema from 'zod-to-json-schema';
import { crudReponseSchema, idParamsSchema } from '../../../../sharedShema/response';
import { acceptInviteSchema, AcceptInviteType, getInvitationsResponseSchema, invitePayloadSchema, InvitePayloadType, resendPayloadSchema, ResendPayloadType } from './schema';
import { RoleEnum } from '../../../../types/role';
import { acceptInvite, getInvitations, inviteUser, resendInvite, revokeInvite } from './inviteHandler';
import { IdParamsType } from '../../../../sharedShema/sharedSchema';



const InviteRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const server = fastify

  // Step 1: Admin invites user - creates invitation, sends email
  server.post<{ Body: InvitePayloadType }>('/', {
    onRequest: server.protect([RoleEnum.portalClientEdit]),
    preValidation: server.zodValidate(invitePayloadSchema),
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 hour',
        keyGenerator: (request) => `invite:${request.user.userId}:${request.activeOrgId}`
      }
    },
    schema: {
      tags: [SwaggerSectionTags.userInvitation.name],
      summary: 'Invite user to join organization',
      body: zodToJsonSchema(invitePayloadSchema),
      response: { 200: zodToJsonSchema(crudReponseSchema) }
    },
    handler: inviteUser
  });

  server.post<{ Body: ResendPayloadType, Params: IdParamsType }>('/resend/:id', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour',
        keyGenerator: (request) => `invite:${request.user.userId}:${(request.params as IdParamsType).id}`
      }
    },
    onRequest: server.protect([RoleEnum.portalClientEdit]),
    schema: {
      tags: [SwaggerSectionTags.userInvitation.name],
      params: zodToJsonSchema(idParamsSchema),
      summary: 'Resend invite user to join organization',
      body: zodToJsonSchema(resendPayloadSchema),
      response: { 200: zodToJsonSchema(crudReponseSchema) }
    },
    handler: resendInvite
  });

  // User accepts invitation with OTP
  server.post<{ Body: AcceptInviteType }>('/accept', {
    config: {
      rateLimit: {
        max: 10,  // Per invitation code - prevents brute-forcing a specific invite
        timeWindow: '1 hour',
        keyGenerator: (request: FastifyRequest) => {
          const { invitationCode } = request.body as AcceptInviteType;
          return `accept:code:${invitationCode}`;
        }
      }
    },
    schema: {
      tags: [SwaggerSectionTags.userInvitation.name],
      summary: 'Accept invitation to join organization',
      body: zodToJsonSchema(acceptInviteSchema),
      response: { 200: zodToJsonSchema(crudReponseSchema) }
    },
    handler: acceptInvite
  });

  server.post<{ Params: IdParamsType }>('/revoke/:id', {
    onRequest: server.protect([RoleEnum.portalClientEdit]),
    schema: {
      tags: [SwaggerSectionTags.userInvitation.name],
      params: zodToJsonSchema(idParamsSchema),
      summary: 'Revoke',
      response: { 200: zodToJsonSchema(crudReponseSchema) }
    },
    handler: revokeInvite
  });

  server.get('/', {
    onRequest: server.protect([RoleEnum.portalClientEdit]),
    schema: {
      tags: [SwaggerSectionTags.userInvitation.name],
      summary: 'Get list of active invitations',
      response: { 200: zodToJsonSchema(getInvitationsResponseSchema) }
    },
    handler: getInvitations
  });




}

export default InviteRoutes; 