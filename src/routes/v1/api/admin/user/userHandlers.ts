
import { FastifyRequest } from 'fastify';
import { Users } from '../../../../../entities/public/users.entity';
import { StatusPayloadType, UserDetailsReponseType, UsersStatusReponseType } from './userSchema';
import { UserIAMDetails } from '../../../../../types/user';
import { EntityEnum } from '../../../../../types/EntityEnum';
import { CrudReponseType, RequestStatusEnum } from '../../../../../sharedShema/response';
import { HttpError } from '@getbrevo/brevo';
import { AdminActionEnum } from '../../../../../types/adminActionEnum';
import { ApprovalRequestStatusEnum } from '../../../../../types/ApprovalRequestStatusEnum';
import { translate } from '../../../../../utils/translate';

interface UserParamsType {
    userId: number;
}

export async function getUsersWithStatus(request: FastifyRequest): Promise<UsersStatusReponseType> {
    try {
        const userRepo = request.server.orm["typeorm"].getRepository(Users);

        const users = await userRepo.find({
            where: { agentId: request.user.agentId },
            relations: ['profile'],
            order: { userId: 'DESC' },
        });

        return users;
    } catch (error) {
        request.log.error(error, 'Failed to get users with status');
        throw request.server.httpErrors.badRequest(translate('errors.users.failedToGet', request.defaultLanguage));
    }
}

export async function getUserDetails(request: FastifyRequest<{ Params: UserParamsType }>): Promise<UserDetailsReponseType> {
    try {
        const { userId } = request.params

        const userRepo = request.server.orm["typeorm"].getRepository(Users);
        const user = await userRepo.createQueryBuilder('user')
            .leftJoinAndSelect('user.profile', 'profile')
            .leftJoinAndSelect('user.approvalRequests', 'approvalRequest', 'approvalRequest.entityType = :entityType', { entityType: EntityEnum.USERS })
            .leftJoinAndSelect('approvalRequest.approvals', 'approval')
            .leftJoinAndSelect('approvalRequest.assignedToUser', 'assignedToUser')
            .leftJoinAndSelect('assignedToUser.profile', 'assignedToUserProfile')
            .leftJoinAndSelect('approval.approvedByUser', 'approvedByUser')
            .leftJoinAndSelect('approvedByUser.profile', 'approvedByUserProfile')
            .where('user.agentId = :agentId', { agentId: request.user.agentId })
            .andWhere('user.userId = :userId', { userId })
            .getOne();

        const keycloakAdmin = request.agent.keycloakAdminService;
        let keycloakDetails: UserIAMDetails | undefined = undefined;
        if (user.externalUserId && keycloakAdmin) {
            try {
                keycloakDetails = await keycloakAdmin.getUserIAMDetails(user.externalUserId);
            } catch (err) {
                request.log.warn({ err }, 'Failed to fetch Keycloak info');
            }
        }

        const activeOrgs = await request.server.services.userService.getActiveOrg({ userId: user.userId });
        const response: UserDetailsReponseType = {
            user: user,
            organizations: activeOrgs.map(org => (org.userOrganization)) || [],
            iam: keycloakDetails ? {
                enabled: keycloakDetails?.enabled,
                groups: keycloakDetails?.groups,
                wasApproved: user.approvalStatus === ApprovalRequestStatusEnum.APPROVED ? true : false
            } : undefined
        }

        return response;

    } catch (error) {
        request.log.error(error, 'Failed to get users with status');
        throw request.server.httpErrors.badRequest(translate('errors.users.failedToGet', request.defaultLanguage));
    }
}


export async function changeUserStatus(request: FastifyRequest<{ Body: StatusPayloadType }>): Promise<CrudReponseType | HttpError> {

    try {
        const { status, userId } = request.body;
        const keycloakAdmin = request.agent.keycloakAdminService;
        const userDetails = await request.server.services.userService.findUserProfile({ userId: userId, agentId: request.user.agentId });
        const userRepo = request.server.orm["typeorm"].getRepository(Users);

        await keycloakAdmin.changeStatusUserById(userDetails.externalUserId, status);
        request.log.info('User enabled in Keycloak', {
            userId: userDetails.userId,
            externalUserId: userDetails.externalUserId
        });

        const user = await userRepo.findOne({
            where: { userId: userId }
        });

        user.endDateActive = status === 'enable' ? null : new Date();
        await userRepo.save(user);


        await request.server.services.adminActivityLogService.logActivity({
            agentId: request.agent?.agentId || 0,
            entityType: EntityEnum.USERS,
            action: status === 'enable' ? AdminActionEnum.ENABLE : AdminActionEnum.DISABLE,
            createdBy: request.user.userId,
            details: {
                userId: userDetails.userId,
                email: userDetails.email,
                userName: userDetails.userName,
                fullName: ([userDetails?.profile?.firstName, userDetails?.profile?.lastName].filter(Boolean).join(' ')),

            },
            entityId: userDetails.userId,
            api: request.raw.url,
            requestId: request.id,
        });

        return { message: RequestStatusEnum.SUCCESS };
    }
    catch (e) {
        request.log.error(`Change user status failed`, e);
        throw request.server.httpErrors.badRequest(translate('errors.users.failedStatus', request.defaultLanguage));
    }
}