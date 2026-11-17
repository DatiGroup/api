import { FastifyRequest } from "fastify";
import { CrudReponseType } from "../../../../sharedShema/response";
import { AdminActionEnum } from "../../../../types/adminActionEnum";
import { EntityEnum } from "../../../../types/EntityEnum";
import { SentOtpPayloadType } from "./schema";
import { createUserError } from "../../../../utils/errors";
import { translate } from "../../../../utils/translate";


export async function sendOtpCode(
    request: FastifyRequest<{
        Body: SentOtpPayloadType;
    }>): Promise<CrudReponseType> {


    const { token, recaptchaToken } = request.body;

    const rechaptchaPassed = await request.server.services.hcaptchaService.verifyHcaptcha(recaptchaToken);

    if (!rechaptchaPassed) {
        throw createUserError(
            request.server.httpErrors.forbidden(translate('errors.auth.captchaFailed', request.defaultLanguage))
        );
    }

    const result = await request.server.services.otpService.sendOtp({
        token,
        lng: request.defaultLanguage,
        agent: request.agent
    });

    await request.server.services.adminActivityLogService.logActivity({
        agentId: request.agent?.agentId || 0,
        entityType: EntityEnum.USERS,
        action: AdminActionEnum.USER_OTP,
        createdBy: result.user.userId,
        details: {
            userId: result.user.userId,
            email: result.user.email,
            userName: result.user.userName,
            fullName: ([result.user?.profile?.firstName, result.user?.profile?.lastName].filter(Boolean).join(' ')),
        },
        entityId: result.user.userId,
        api: request.raw.url,
        requestId: request.id,
    });

    return result;

}

export async function sendInviteOtpCode(
    request: FastifyRequest<{
        Body: { invitationCode: string; recaptchaToken: string };
    }>): Promise<CrudReponseType> {

    const { invitationCode, recaptchaToken } = request.body;

    // Verify captcha
    const rechaptchaPassed = await request.server.services.hcaptchaService.verifyHcaptcha(recaptchaToken);
    if (!rechaptchaPassed) {
        throw createUserError(
            request.server.httpErrors.forbidden(
                translate('errors.auth.captchaFailed', request.defaultLanguage)
            )
        );
    }

    const result = await request.server.services.otpService.sendOtpForInvitation({
        invitationCode,
        lng: request.defaultLanguage,
        agent: request.agent
    });

    await request.server.services.adminActivityLogService.logActivity({
        agentId: request.agent?.agentId || 0,
        entityType: EntityEnum.USERS,
        action: AdminActionEnum.USER_OTP,
        createdBy: result.user.userId,
        details: {
            userId: result.user.userId,
            email: result.user.email,
            invitationId: result.invitationId
        },
        entityId: result.user.userId,
        api: request.raw.url,
        requestId: request.id,
    });

    return result;
}