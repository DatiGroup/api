import { FastifyRequest } from "fastify";
import { SelectQueryBuilder } from "typeorm";

import { AcceptInviteType, ActiveInvitationType, InvitePayloadType, ResendPayloadType } from "./schema";
import { CrudReponseType, RequestStatusEnum } from "../../../../sharedShema/response";
import { IdParamsType } from "../../../../sharedShema/sharedSchema";
import { HttpError } from "@fastify/sensible/lib/httpError";
import { createUserError } from "../../../../utils/errors";
import { translate } from "../../../../utils/translate";
import { EntityEnum } from "../../../../types/EntityEnum";
import { AdminActionEnum } from "../../../../types/adminActionEnum";
import { UserInvitation } from "../../../../entities/public/user.iniviation.entity";
import { Users } from "../../../../entities/public/users.entity";
import { TemplateType } from "../../../../entities/public/templates.entity";
import { UserRelationship } from "../../../../entities/public/user.relationships.entity";

export async function inviteUser(
    request: FastifyRequest<{
        Body: InvitePayloadType;
    }>): Promise<CrudReponseType> {

    // Zod schema already validated and sanitized the input
    const { email, firstName, lastName, userName } = request.body;

    console.log(`Invite user ${lastName} ${firstName} ${email} by  org ${request?.activeOrgId} userid: ${request?.user?.userId} agentId: ${request?.user?.agentId}`);

    const organization = await request.server.services.userService.getActiveOrgRelation({ userId: request.user.userId, orgId: request.activeOrgId });

    if (!organization || !organization?.userOrganization?.name) {
        throw createUserError(
            request.server.httpErrors.badRequest(
                translate('userInvitation.organizationNotFound', request.defaultLanguage)
            )
        );
    }

    const userRepo = request.server.orm["typeorm"].getRepository(Users);
    const invitationRepo = request.server.orm["typeorm"].getRepository(UserInvitation);

    // Check for active invitation to prevent duplicates
    const activeInvitation = await invitationRepo.findOne({
        where: {
            email: email,
            userOrganizationId: request.activeOrgId,
            used: false,
            expiredDate: null // Only unexpired ones are active
        }
    });

    if (activeInvitation) {
        console.log('Active invitation already exists for email:', email);
        throw createUserError(
            request.server.httpErrors.badRequest(
                translate('userInvitation.activeInviteExists', request.defaultLanguage)
            )
        );
    }

    const existingUser = await userRepo.createQueryBuilder('user')
        .where('user.agentId = :agentId', { agentId: request.user.agentId })
        .andWhere('user.email = :email', { email })
        .getOne();

    let userId = existingUser?.userId;
    let user = existingUser;
    let isNewUser = false;

    // Case 1: User doesn't exist - create new inactive user
    if (!existingUser) {
        isNewUser = true;

        // Step 1: Create user in Keycloak first
        let newUser;
        try {
            newUser = await request.agent.keycloakAdminService.createUser({
                username: userName,
                email: email,
                emailVerified: false,
                firstName: firstName,
                lastName: lastName,
                enabled: false
            });
        } catch (keycloakError: any) {
            request.log.error({
                message: 'User inviation: Keycloak user creation failed',
                email: email,
                error: keycloakError
            });

            throw createUserError(
                request.server.httpErrors.internalServerError(
                    translate('userInvitation.externalServiceError', request.defaultLanguage)
                )
            );
        }

        // Step 2: Only proceed to DB creation if Keycloak succeeded
        try {
            const createdUser = await request.server.services.userService.createOrgMember(
                {
                    userOrganizationId: request.activeOrgId,
                    userName: userName,
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    preferredLang: request.defaultLanguage,
                    externalUserId: newUser.id,
                    externalSource: `keycloak:${newUser.realm}:${newUser.keycloakUrl}`,
                }, request.agent.agentId);

            userId = createdUser.userId;
        } catch (dbError) {
            // Compensation: If DB fails after Keycloak creation
            // Log this for manual cleanup - orphaned Keycloak user will exist
            request.log.error({
                message: 'Failed to create user in DB after Keycloak creation - manual cleanup required',
                keycloakUserId: newUser.id,
                email: email,
                error: dbError
            });
            throw dbError;
        }

        user = await userRepo.createQueryBuilder('user')
            .where('user.agentId = :agentId', { agentId: request.user.agentId })
            .andWhere('user.userId = :userId', { userId: userId })
            .getOne();

        if (!user) {
            throw createUserError(
                request.server.httpErrors.internalServerError(
                    translate('userInvitation.userCreateError', request.defaultLanguage)
                )
            );
        }
    }

    // Case 2: User exists - invite to different organization
    // Both cases: Create invitation and send email
    if (!user) {
        throw createUserError(
            request.server.httpErrors.notFound(
                translate('userInvitation.userNotFound', request.defaultLanguage)
            )
        );
    }

    const invitationCode = await request.server.services.invitationService.createInvitation(
        {
            userId: user.userId,
            email: email,
            orgId: request.activeOrgId
        }
    );

    const url = buildInvitationUrl(request.agent?.parameters, invitationCode);

    try {
        await request.server.templates.sendInvite({
            agent: request.agent,
            user: user,
            payload: {
                name: [firstName, lastName]
                    .filter(Boolean)
                    .join(' '),
                orgName: organization?.userOrganization?.name || '',
                resetLink: url,
            },
        });
    } catch {
        throw createUserError(
            request.server.httpErrors.badGateway(translate('userInvitation.emailError', request.defaultLanguage))
        );
    }


    await request.server.services.adminActivityLogService.logActivity({
        agentId: request.agent?.agentId || 0,
        entityType: EntityEnum.USERS,
        action: AdminActionEnum.USER_INVITE_SENT,
        createdBy: request.user.userId, // Current admin user, not invited user
        details: {
            userId: user.userId,
            email: email,
            userName: user.userName,
            fullName: ([user?.profile?.firstName, user?.profile?.lastName].filter(Boolean).join(' ')),
            isNewUser: isNewUser,
            organizationId: request.activeOrgId
        },
        entityId: user.userId,
        api: request.raw.url,
        requestId: request.id,
    });


    return { message: RequestStatusEnum.SUCCESS };
}



export async function resendInvite(
    request: FastifyRequest<{
        Body: ResendPayloadType;
        Params: IdParamsType;
    }>): Promise<CrudReponseType> {

    const { email } = request.body;
    const { id } = request.params;

    const organization = await request.server.services.userService.getActiveOrgRelation({ userId: request.user.userId, orgId: request.activeOrgId });

    if (!organization || !organization?.userOrganization?.name) {
        throw createUserError(
            request.server.httpErrors.badRequest(
                translate('userInvitation.organizationNotFound', request.defaultLanguage)
            )
        );
    }

    const invitationRepo = request.server.orm["typeorm"].getRepository(UserInvitation);

    // Fetch existing invitation with condition on related user
    const invitation = await invitationRepo
        .createQueryBuilder('invitation')
        .leftJoinAndSelect('invitation.user', 'user')
        .leftJoinAndSelect('user.profile', 'profile')
        .where('invitation.invitationId = :id', { id })
        .andWhere('invitation.email = :email', { email })
        .andWhere('invitation.userOrganizationId = :orgId', { orgId: request.activeOrgId })
        .andWhere('invitation.used = :used', { used: false })
        .andWhere('user.agentId = :userAgentId', { userAgentId: request.agent.agentId })
        .andWhere('user.email = :userEmail', { userEmail: email })
        .getOne();



    if (!invitation) {
        throw createUserError(
            request.server.httpErrors.notFound(
                translate('userInvitation.invitationNotFound', request.defaultLanguage)
            )
        );
    }

    // Reuse existing valid invitation
    if (invitation.user?.email !== email) {
        throw createUserError(
            request.server.httpErrors.badRequest(
                translate('userInvitation.emailMismatch', request.defaultLanguage)
            )
        );
    }

    if (!invitation?.user) {
        throw createUserError(
            request.server.httpErrors.notFound(
                translate('userInvitation.userNotFound', request.defaultLanguage)
            )
        );
    }

    const needsNewInvitation = isInvitationExpired(invitation);

    let invitationCode: string;
    if (needsNewInvitation) {
        invitationCode = await request.server.services.invitationService.createInvitation({
            userId: invitation.userId,
            email: invitation.email,
            orgId: request.activeOrgId
        });
    } else {
        invitationCode = invitation.invitationCode;
    }

    const url = buildInvitationUrl(request.agent?.parameters, invitationCode);

    try {
        // Resend the invitation email
        await request.server.templates.sendInvite({
            agent: request.agent,
            user: invitation.user,
            payload: {
                name: [invitation.user.profile?.firstName, invitation.user.profile?.lastName]
                    .filter(Boolean)
                    .join(' '),
                orgName: organization?.userOrganization?.name || '',
                resetLink: url,
            },
        });
    }
    catch {
        throw createUserError(
            request.server.httpErrors.badGateway(translate('userInvitation.emailError', request.defaultLanguage))
        );
    }


    // Log the resend action
    await request.server.services.adminActivityLogService.logActivity({
        agentId: request.agent?.agentId || 0,
        entityType: EntityEnum.USERS,
        action: AdminActionEnum.USER_INVITE_SENT, // Reuse same action for resend
        createdBy: request.user.userId,
        details: {
            userId: invitation.user.userId,
            email: email,
            invitationId: invitation?.invitationId,
            organizationId: request.activeOrgId
        },
        entityId: invitation.user.userId,
        api: request.raw.url,
        requestId: request.id,
    });


    return { message: RequestStatusEnum.SUCCESS };
}

export async function acceptInvite(
    request: FastifyRequest<{
        Body: AcceptInviteType;
    }>): Promise<CrudReponseType> {

    const { otpCode, invitationCode } = request.body;

    // Additional IP-based rate limiting , attepmts per hours
    /*     await request.server.redisUtils.enforceRateLimit(
            request,
            `invite:accept:ip:${request.ip}`,
            600,
            3600
        ); */

    // Validate invitation exists and is valid
    const invitation = await request.server.orm["typeorm"]
        .getRepository(UserInvitation)
        .findOne({
            where: {
                invitationCode: invitationCode,
                used: false
            },
            relations: ["user"]
        });

    if (!invitation || isInvitationExpired(invitation)) {
        throw createUserError(
            request.server.httpErrors.badRequest(
                translate('userInvitation.invalidInvitationCode', request.defaultLanguage)
            )
        );
    }
    if (!invitation.user?.email) {
        throw createUserError(
            request.server.httpErrors.internalServerError(
                translate('userInvitation.userNotFound', request.defaultLanguage)
            )
        );
    }


    // Validate OTP code
    if (!otpCode || otpCode.trim().length === 0) {
        throw createUserError(
            request.server.httpErrors.badRequest(
                translate('userInvitation.otpRequired', request.defaultLanguage)
            )
        );
    }

    // OTP verification using consumeOtp from OtpService
    const otpValid = await request.server.services.otpService.consumeOtp({
        userId: invitation.userId,
        type: TemplateType.EMAIL,
        otpCode: otpCode
    });

    if (!otpValid) {
        throw createUserError(
            request.server.httpErrors.badRequest(
                translate('userInvitation.invalidOTP', request.defaultLanguage)
            )
        );
    }


    const userRepo = request.server.orm["typeorm"].getRepository(Users);

    const userDetails = await userRepo.findOne({
        where: {
            userId: invitation.userId,
            agentId: request.agent?.agentId || 0
        }
    });


    if (!userDetails) {
        throw createUserError(
            request.server.httpErrors.badRequest(
                translate('errors.userNotFound', request.defaultLanguage)
            )
        );
    }
    const userRelRepo = request.server.orm["typeorm"].getRepository(UserRelationship);

    const activeRel = await userRelRepo.findOne({
        where: {
            userId: userDetails.userId,
            userOrganizationId: invitation.userOrganizationId,
            endDateActive: null
        }
    });

    if (!activeRel) {
        const userRel = userRelRepo.create({
            userId: userDetails.userId,
            userOrganizationId: invitation.userOrganizationId,
            startDateActive: new Date(),
            createdBy: userDetails.userId,
            updatedBy: userDetails.userId,
        });


        await userRelRepo.save(userRel);
    }

    // Mark invitation as accepted
    await request.server.services.invitationService.acceptInvitation({ invitationCode });

    await request.agent?.keycloakAdminService.changeStatusUserById(userDetails.externalUserId, 'enable')

    // Log the acceptance
    await request.server.services.adminActivityLogService.logActivity({
        agentId: invitation.agentId,
        entityType: EntityEnum.USERS,
        action: AdminActionEnum.USER_INVITE_ACCEPTED, // Mark user as enabled when accepting invite
        createdBy: invitation.userId,
        details: {
            userId: invitation.userId,
            invitationId: invitation.invitationId,
            organizationId: invitation.userOrganizationId
        },
        entityId: invitation.userId,
        api: request.raw.url,
        requestId: request.id,
    });

    return { message: RequestStatusEnum.SUCCESS };
}




export async function revokeInvite(
    request: FastifyRequest<{
        Params: IdParamsType;
    }>): Promise<CrudReponseType> {

    const { id } = request.params;


    const invitationRepo = request.server.orm["typeorm"].getRepository(UserInvitation);

    // Fetch existing invitation with condition on related user
    const invitation = await invitationRepo
        .createQueryBuilder('invitation')
        .leftJoinAndSelect('invitation.user', 'user')
        .where('invitation.invitationId = :id', { id })
        .andWhere('invitation.userOrganizationId = :orgId', { orgId: request.activeOrgId })
        .andWhere('invitation.used = :used', { used: false })
        .andWhere('user.agentId = :userAgentId', { userAgentId: request.agent.agentId })
        .getOne();


    if (!invitation) {
        throw createUserError(
            request.server.httpErrors.notFound(
                translate('userInvitation.invitationNotFound', request.defaultLanguage)
            )
        );
    }

    // Check if invitation is already expired
    if (isInvitationExpired(invitation)) {
        throw createUserError(
            request.server.httpErrors.badRequest(
                translate('userInvitation.alreadyExpired', request.defaultLanguage)
            )
        );
    }

    await request.server.services.invitationService.revokeInvitation({
        invitationId: invitation.invitationId,
    });

    return { message: RequestStatusEnum.SUCCESS };
}


export async function getInvitations(
    request: FastifyRequest): Promise<ActiveInvitationType | HttpError> {

    const repo = request.server.orm["typeorm"].getRepository(Users);


    const query = repo.createQueryBuilder('users')
        .innerJoin(
            (qb: SelectQueryBuilder<UserInvitation>) => qb
                .select('inv.userId', 'user_id')
                .addSelect('inv.invitationId', 'invitation_id')
                .from(UserInvitation, 'inv')
                .where('inv.userOrganizationId = :inviteOrgId')
                .distinctOn(['inv.userId'])
                .orderBy('inv.userId', 'ASC')
                .addOrderBy('inv.used', 'ASC')
                .addOrderBy('inv.createdDate', 'DESC')
                .addOrderBy('inv.expiredDate', 'DESC'),
            'li',
            'li.user_id = users.user_id',
        )
        .setParameters({ inviteOrgId: request.activeOrgId, agentId: request.agent.agentId })
        .leftJoinAndSelect('users.profile', 'userProfile')
        .innerJoinAndSelect('users.userInvitations', 'userInvitations')
        .leftJoinAndMapOne(
            'users.lastInvitation',
            UserInvitation,
            'lastInvitation',
            'lastInvitation.invitationId = li.invitation_id'
        )
        .where('userInvitations.userOrganizationId = :orgId', { orgId: request.activeOrgId })
        .andWhere('users.agentId = :agentId', { agentId: request.agent.agentId })
        .orderBy('lastInvitation.used', 'ASC')
        .addOrderBy('lastInvitation.createdDate', 'DESC')
        .addOrderBy('lastInvitation.expiredDate', 'DESC');

    const invitations = await query.getMany();
    return invitations;


};

/**
 * Constructs the invitation URL from agent parameters and invitation code
 */
function buildInvitationUrl(parameters: any, invitationCode: string): string {
    return `${parameters?.portalUrl}/auth/user-invite/${invitationCode}`;
}

/**
 * Checks if an invitation is expired
 */
function isInvitationExpired(invitation: UserInvitation | null): boolean {
    return !!invitation?.expiredDate && invitation.expiredDate < new Date();
}
