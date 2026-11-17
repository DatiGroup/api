
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { loginPayloadSchema, LoginPayloadType, loginReponseSchema, passwordResetSchema, refreshTokenReponseSchema, refreshTokenSchema, RefreshTokenType, ResetPasswordPayloadType, SentLinkPayloadType, sentLinkSchema } from './schema';
import { SwaggerSectionTags } from '../../../../manual/swagger';

import zodToJsonSchema from 'zod-to-json-schema';
import { login, logout, refresh } from './handlers/authHandler';
import { crudReponseSchema } from '../../../../sharedShema/response';
import { resetPassword, sendResetLink } from './handlers/passwordHandler';


const AuthRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const server = fastify

  server.post<{ Body: LoginPayloadType }>('/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      }
    },
    preValidation: server.zodValidate(loginPayloadSchema),
    schema: {
      tags: [SwaggerSectionTags.auth.name],
      summary: 'Login using keycloack user',
      body: zodToJsonSchema(loginPayloadSchema),
      response: { 200: zodToJsonSchema(loginReponseSchema) }
    },
    handler: login
  });

  server.post<{ Body: RefreshTokenType }>('/refresh', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      }
    },
    schema: {
      tags: [SwaggerSectionTags.auth.name],
      summary: 'Refresh token',
      body: zodToJsonSchema(refreshTokenSchema),
      response: { 200: zodToJsonSchema(refreshTokenReponseSchema) }
    },
    handler: refresh
  });

  server.post<{ Body: RefreshTokenType }>('/logout', {
    onRequest: server.protect(),
    schema: {
      tags: [SwaggerSectionTags.auth.name],
      summary: 'Logout user',
      body: zodToJsonSchema(refreshTokenSchema),
      response: { 200: zodToJsonSchema(crudReponseSchema) }
    },
    handler: logout
  });



  server.post<{ Body: SentLinkPayloadType }>('/send-link', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
      }
    },
    preValidation: server.zodValidate(sentLinkSchema),
    schema: {
      tags: [SwaggerSectionTags.auth.name],
      summary: 'Send passsword reset link to user email',
      body: zodToJsonSchema(sentLinkSchema),
      response: { 200: zodToJsonSchema(crudReponseSchema) }
    },
    handler: sendResetLink
  });


  server.post<{ Body: ResetPasswordPayloadType }>('/reset-password', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '10 minute',
      }
    },
    schema: {
      tags: [SwaggerSectionTags.auth.name],
      summary: 'Reset user password',
      body: zodToJsonSchema(passwordResetSchema),
      response: { 200: zodToJsonSchema(crudReponseSchema) }
    },
    handler: resetPassword
  });


}

export default AuthRoutes; 