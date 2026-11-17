import { FastifyRequest } from "fastify";
import { ResetPasswordPayloadType, SentLinkPayloadType } from "../schema";
import { RequestStatusEnum, CrudReponseType } from "../../../../../sharedShema/response";
import { EntityEnum } from "../../../../../types/EntityEnum";
import { AdminActionEnum } from "../../../../../types/adminActionEnum";
import { ApprovalRequestStatusEnum } from "../../../../../types/ApprovalRequestStatusEnum";
import { generateResetToken } from "../../../../../utils/cryptoUtils";
import { translate } from "../../../../../utils/translate";
import { createUserError } from "../../../../../utils/errors";
import { TemplateType } from "../../../../../entities/public/templates.entity";

export async function sendResetLink(
    request: FastifyRequest<{
        Body: SentLinkPayloadType;
    }>): Promise<CrudReponseType> {

    const { email, recaptchaToken } = request.body;
    const rechaptchaPassed = await request.server.services.hcaptchaService.verifyHcaptcha(recaptchaToken);

    if (!rechaptchaPassed) {
        throw createUserError(
            request.server.httpErrors.forbidden(translate('errors.auth.captchaFailed', request.defaultLanguage))
        );
    }

    // Time-based throttle (60 seconds cooldown)
    await request.server.redisUtils.enforceThrottle(
        request,
        `sendResetLink_${email}`,
        60
    );

    // Internal operations - catch and suppress to prevent user enumeration
    try {

        const user = await getActiveUserOrThrow(request, email);
        const token = generateResetToken();

        await request.server.redisUtils.putObject(`oneTimeToken:${token}`, {
            token,
            email,
            agentId: request.agent.agentId
        }, request.server.config.RESET_TOKEN_EXPIRY);

        const parameters = request.agent?.parameters as any;
        const url = `${parameters?.portalUrl}/auth/reset-password?token=${token}`;

        await request.server.templates.sendPasswordResetRequest({
            agent: request.agent,
            user: user,
            payload: {
                name: [user?.profile?.firstName, user?.profile?.lastName]
                    .filter(Boolean)
                    .join(' '),
                resetLink: url,
            },
        });

        await request.server.services.adminActivityLogService.logActivity({
            agentId: request.agent?.agentId || 0,
            entityType: EntityEnum.USERS,
            action: AdminActionEnum.USER_PASSWORD_LINK,
            createdBy: user.userId,
            details: {
                userId: user.userId,
                email: email,
                userName: user.userName,
                fullName: ([user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ')),
            },
            entityId: user.userId,
            api: request.raw.url,
            requestId: request.id,
        });
    } catch (internalError) {
        request.log.error(internalError, 'Failed to send reset link (internal error)');
    }

    return { message: RequestStatusEnum.SUCCESS };
}



export async function resetPassword(
    request: FastifyRequest<{
        Body: ResetPasswordPayloadType;
    }>): Promise<CrudReponseType> {

    const { otpCode, newPassword, token } = request.body;

    const tokenFromRedis = await request.server.redisUtils.getObject(`oneTimeToken:${token}`) as { token: string, email: string, agentId?: number } | null;
    const email = tokenFromRedis?.email;

    if (!tokenFromRedis || !email) {
        throw createUserError(
            request.server.httpErrors.badRequest(translate('errors.auth.noRedisToken', request.defaultLanguage, { email }))
        );
    }

    // Validate agentId
    if (tokenFromRedis.agentId && tokenFromRedis.agentId !== request.agent.agentId) {
        throw createUserError(
            request.server.httpErrors.forbidden(translate('errors.auth.invalidResetToken', request.defaultLanguage))
        );
    }

    const user = await getActiveUserOrThrow(request, email);

    // Validate OTP using database (consumeOtp)
    const otpValid = await request.server.services.otpService.consumeOtp({
        userId: user.userId,
        type: TemplateType.EMAIL,
        otpCode: otpCode
    });

    if (!otpValid) {
        throw createUserError(
            request.server.httpErrors.badRequest(translate('errors.auth.otpExpired', request.defaultLanguage, { email }))
        );
    }

    try {
        await request.agent.keycloakAdminService.resetPasswordById(user.externalUserId, newPassword);

        await request.server.services.adminActivityLogService.logActivity({
            agentId: request.agent?.agentId || 0,
            entityType: EntityEnum.USERS,
            action: AdminActionEnum.USER_PASSWORD_RESET,
            createdBy: user.userId,
            details: {
                userId: user.userId,
                email: user.email,
                userName: user.userName,
                fullName: ([user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ')),
            },
            entityId: user.userId,
            api: request.raw.url,
            requestId: request.id,
        });

        await request.server.redisUtils.removeValue(`oneTimeToken:${token}`);

        return { message: RequestStatusEnum.SUCCESS };
    }
    catch (error) {
        request.log.error(error, 'Failed to process reset password request');
        throw request.server.httpErrors.badRequest(translate('errors.auth.generic', request.defaultLanguage));
    }
}

async function getActiveUserOrThrow(request: FastifyRequest, email: string) {
    const user = await request.server.services.userService.getUserDetailsByEmail({
        email,
        agentId: request.agent.agentId
    });

    if (!user || !user.userId) {
        throw request.server.httpErrors.notFound(`User not found: ${email}`);
    }

    if (user.endDateActive && user.endDateActive <= new Date()) {
        throw request.server.httpErrors.notFound(`Account disabled: ${email}`);
    }

    if (![ApprovalRequestStatusEnum.APPROVED, ApprovalRequestStatusEnum.INVITE].includes(user.approvalStatus)) {
        throw request.server.httpErrors.badRequest(`Reset password, user not approved: ${email}`);
    }


    return user;
}
