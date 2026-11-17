import { DataSource, MoreThan } from "typeorm";
import { FastifyInstance } from "fastify";
import { UserOtpCodes } from "../entities/public/user.otp.codes.entity";
import { TemplateType } from "../entities/public/templates.entity";
import { UserInvitation } from "../entities/public/user.iniviation.entity";
import crypto from "crypto";
import { createUserError } from "../utils/errors";
import { translate } from "../utils/translate";
import { RequestStatusEnum } from "../sharedShema/response";
import { Agents } from "../entities/public/agents.entity";
import "../types/fastify";
import { OTP_ATTEMPT_LIMIT } from "../routes/v1/api/otp/routes";

export class OtpService {

    constructor(protected readonly orm: DataSource, protected readonly fastify: FastifyInstance) { }

    private repository = this.orm.getRepository(UserOtpCodes);


    private async generateOtp({ userId, type }: { userId: number, type: TemplateType }) {
        const endDate = new Date();
        const activeUserOtps = await this.repository.find({
            where: {
                userId: userId,
                type: type,
                used: false,
                expiredDate: MoreThan(endDate)
            }
        })
        const expireActive = activeUserOtps.map(p => ({ ...p, expiredDate: endDate }));
        await this.repository.save(expireActive);

        const expired = new Date(new Date().getTime() + 30 * 60000);
        // Generate 6-digit OTP (1 million combinations)
        const otp = crypto.randomInt(100000, 1000000);

        let newOtp = new UserOtpCodes();

        newOtp.userId = userId;
        newOtp.type = type;
        newOtp.expiredDate = expired;
        newOtp.otpCode = `${otp}`;
        newOtp.used = false;
        newOtp.createdBy = userId;
        newOtp.updatedBy = userId;
        newOtp = await this.repository.save(newOtp);

        // Cache in Redis for fast validation (1800 sec = 30 min)
        const redisKey = `otp:${userId}:${type}:${otp}`;
        await this.fastify.redisUtils.setValue(redisKey, 1800, 'valid');

        return newOtp.otpCode || '';
    }

    /**
     * Send OTP for password reset flow (uses oneTimeToken)
     */
    public async sendOtp({ token, lng, agent }: { token: string, lng: string, agent: Agents }) {

        // Throttle OTP attempts
        const otpAttemptsKey = `otpAttempts:${token}`;
        const attempts = await this.fastify.redisUtils.getValue(otpAttemptsKey) as number || 0;
        if (attempts >= OTP_ATTEMPT_LIMIT) {
            throw createUserError(
                this.fastify.httpErrors.badRequest(translate('errors.auth.tooManyOTPRequests', lng))
            );
        }

        await this.fastify.redisUtils.setValue(otpAttemptsKey, 600, attempts + 1); // 10 min window

        // Validate oneTimeToken exists and get email
        const tokenFromRedis = await this.fastify.redisUtils.getObject(`oneTimeToken:${token}`) as { token: string, email: string, agentId?: number } | null;
        const email = tokenFromRedis?.email;
        if (!tokenFromRedis || !email) {
            throw createUserError(
                this.fastify.httpErrors.badRequest(translate('errors.auth.invalidResetToken', lng))
            );
        }

        // Validate agentId to prevent cross-agent attacks
        if (tokenFromRedis.agentId && tokenFromRedis.agentId !== agent.agentId) {
            throw createUserError(
                this.fastify.httpErrors.forbidden(translate('errors.auth.invalidResetToken', lng))
            );
        }

        const user = await this.fastify.services.userService.getUserDetailsByEmail({
            email,
            agentId: agent.agentId
        });

        // Prevent user enumeration - use generic error
        if (!user || !user.userId) {
            throw createUserError(
                this.fastify.httpErrors.badRequest(translate('errors.auth.invalidResetToken', lng))
            );
        }

        // Generate and store OTP in database (no need for redundant Redis storage)
        const otp = await this.generateOtp({ userId: user.userId, type: TemplateType.EMAIL })

        await this.fastify.templates.sendOtp({
            agent: agent,
            user: user,
            payload: {
                name: [user?.profile?.firstName, user?.profile?.lastName]
                    .filter(Boolean)
                    .join(' '),
                otpCode: `${otp}`,
            },
        });

        return { message: RequestStatusEnum.SUCCESS, user };

    }

    /**
     * Send OTP for invitation acceptance flow (uses invitationCode)
     */
    public async sendOtpForInvitation({ invitationCode, lng, agent }: { invitationCode: string, lng: string, agent: Agents }) {

        // Validate invitation
        const invitationRepo = this.orm.getRepository(UserInvitation);
        const invitation = await invitationRepo.findOne({
            where: {
                invitationCode: invitationCode,
                used: false
            },
            relations: ["user", "user.profile"]
        });

        if (!invitation) {
            throw createUserError(
                this.fastify.httpErrors.badRequest(translate('userInvitation.invalidInvitationCode', lng))
            );
        }

        if (invitation.expiredDate && invitation.expiredDate < new Date()) {
            throw createUserError(
                this.fastify.httpErrors.badRequest(translate('userInvitation.expiredInvitation', lng))
            );
        }

        const user = invitation.user;
        if (!user) {
            throw createUserError(
                this.fastify.httpErrors.notFound(translate('userInvitation.userNotFound', lng))
            );
        }

        // Generate OTP
        const otp = await this.generateOtp({
            userId: user.userId,
            type: TemplateType.EMAIL
        });

        // Send OTP email
        await this.fastify.templates.sendOtp({
            agent: agent,
            user: user,
            payload: {
                name: [user.profile?.firstName, user.profile?.lastName]
                    .filter(Boolean)
                    .join(' '),
                otpCode: otp,
            },
        });

        return { message: RequestStatusEnum.SUCCESS, user, invitationId: invitation.invitationId };
    }

    public async consumeOtp({ userId, type, otpCode }: { userId: number, type: TemplateType, otpCode: string }) {
        // FAST PATH: Check Redis cache first for performance
        const redisKey = `otp:${userId}:${type}:${otpCode}`;
        const cachedOtp = await this.fastify.redisUtils.getValue(redisKey);

        if (!cachedOtp) {
            // Either expired, already used, or never existed
            return false;
        }

        // SLOW PATH: Validate and mark as used in database (source of truth)
        const otp = await this.repository.findOne({
            where: {
                userId: userId,
                otpCode: otpCode,
                type: type,
                used: false,
                expiredDate: MoreThan((new Date()))
            }
        });

        if (!otp) {
            // Remove stale cache if DB doesn't match
            await this.fastify.redisUtils.removeValue(redisKey);
            return false;
        }

        // Mark as used in database
        otp.used = true;
        otp.updatedBy = userId;
        await this.repository.save(otp);

        // Invalidate cache immediately to prevent replay attacks
        await this.fastify.redisUtils.removeValue(redisKey);

        return true;
    }

}