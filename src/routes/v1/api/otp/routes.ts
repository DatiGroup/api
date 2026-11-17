

import { FastifyInstance, FastifyPluginAsync, FastifyRequest } from 'fastify';
import '@fastify/rate-limit';
import { SwaggerSectionTags } from '../../../../manual/swagger';
import zodToJsonSchema from 'zod-to-json-schema';
import { crudReponseSchema } from '../../../../sharedShema/response';
import { SentLinkPayloadType } from '../auth/schema';
import { sentInvitationOtpSchema, sentOtpSchema } from './schema';
import { sendOtpCode, sendInviteOtpCode } from './handler';

export const OTP_ATTEMPT_LIMIT = 8;
const OtpRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const server = fastify

    // OTP for password reset flow
    server.post<{ Body: SentLinkPayloadType }>('/send', {
        config: {
            rateLimit: {
                max: OTP_ATTEMPT_LIMIT,
                timeWindow: '1 minute',
            }
        },
        schema: {
            tags: [SwaggerSectionTags.auth.name],
            summary: 'Send OTP code for password reset',
            body: zodToJsonSchema(sentOtpSchema),
            response: { 200: zodToJsonSchema(crudReponseSchema) }
        },
        handler: sendOtpCode
    });

    // OTP for invitation acceptance flow
    server.post('/send-invite-otp', {
        config: {
            rateLimit: {
                max: 10,
                timeWindow: '1 hour',
                keyGenerator: (request: FastifyRequest) => {
                    const { invitationCode } = request.body as { invitationCode: string };
                    return `invite-otp:${invitationCode}`;
                }
            }
        },
        schema: {
            tags: [SwaggerSectionTags.auth.name],
            summary: 'Send OTP for invitation acceptance',
            body: zodToJsonSchema(sentInvitationOtpSchema),
            response: { 200: zodToJsonSchema(crudReponseSchema) }
        },
        handler: sendInviteOtpCode
    });
}

export default OtpRoutes; 