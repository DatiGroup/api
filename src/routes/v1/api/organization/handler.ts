import { FastifyRequest } from "fastify";
import { ActiveOrgType, OrgUserType, SwitchOrgType } from "./schema";
import { Users } from "../../../../entities/public/users.entity";
import { CrudReponseType, RequestStatusEnum } from "../../../../sharedShema/response";
import { HttpError } from "@getbrevo/brevo";
import { isEmpty } from "lodash";
import { translate } from "../../../../utils/translate";
import { UserInvitation } from "../../../../entities/public/user.iniviation.entity";
import { UserRelationship } from "../../../../entities/public/user.relationships.entity";
import { SelectQueryBuilder } from "typeorm";


export async function getUsers(
    request: FastifyRequest): Promise<OrgUserType[] | HttpError> {

    const repo = request.server.orm["typeorm"].getRepository(Users);

    const query = repo.createQueryBuilder('users')
        .leftJoinAndSelect('users.profile', 'userProfile')
        .leftJoinAndSelect('users.userInvitations', 'userInvitations', 'userInvitations.userOrganizationId = :orgId', { orgId: request.activeOrgId })
        .innerJoin('users.relationships', 'relationships')
        .leftJoinAndMapOne('users.ownedOrganization', 'users.ownedOrganizations',
            'ownedOrganization', 'ownedOrganization.userOrganizationId = :orgId',
            { orgId: request.activeOrgId })
        .innerJoin(
            (qb: SelectQueryBuilder<UserInvitation>) => qb
                .select('inv.userId', 'user_id')
                .addSelect('MAX(inv.invitationId)', 'invitation_id')
                .from(UserInvitation, 'inv')
                .where('inv.userOrganizationId = :orgId')
                .groupBy('inv.userId'),
            'li',
            'li.user_id = users.user_id'
        )
        .leftJoinAndMapOne(
            'users.lastInvitation',
            UserInvitation,
            'lastInvitation',
            'lastInvitation.invitationId = li.invitation_id'
        )
        .innerJoin(
            (qb: SelectQueryBuilder<UserRelationship>) => qb
                .select('rel.userId', 'user_id')
                .addSelect('MAX(rel.userRelationshipsId)', 'relationship_id')
                .from(UserRelationship, 'rel')
                .where('rel.userOrganizationId = :orgId')
                .groupBy('rel.userId'),
            'lr',
            'lr.user_id = users.user_id'
        )
        .leftJoinAndMapOne(
            'users.lastRelationship',
            UserRelationship,
            'lastRelationship',
            'lastRelationship.userRelationshipsId = lr.relationship_id'
        )
        .where('relationships.userOrganizationId = :orgId', { orgId: request.activeOrgId })
        .andWhere('now() between relationships.startDateActive and COALESCE(relationships.endDateActive, now())')
        .andWhere('users.agentId = :agentId', { agentId: request.agent.agentId });

    return await query.getMany();
};




/*


export async function getUsers(
    request: FastifyRequest): Promise<OrgUserType[] | HttpError> {

    const repo = request.server.orm["typeorm"].getRepository(Users);
    const invitationRepo = request.server.orm["typeorm"].getRepository(UserInvitation);
    const relationshipRepo = request.server.orm["typeorm"].getRepository(UserRelationship);

    const query = repo.createQueryBuilder('users')
        .leftJoinAndSelect('users.profile', 'userProfile')
        .leftJoinAndSelect('users.userInvitations', 'userInvitations')
        .innerJoin('users.relationships', 'relationships')
        .leftJoinAndMapOne('users.ownedOrganization', 'users.ownedOrganizations',
            'ownedOrganization', 'ownedOrganization.userOrganizationId = :orgId',
            { orgId: request.activeOrgId })
    .leftJoin(
             (qb: any) => {
                 return qb
                     .select('ui.*')
                     .from(UserInvitation, 'ui')
                     .where('ui.user_id = users.user_id')
                     .andWhere('ui.user_organization_id = :inviteOrgId')
                     .orderBy('ui.invitation_id', 'DESC')
                     .limit(1);
             },
             'lastInvitation',
             'true'
         )  
        .leftJoin(
            (qb: any) => {
                return qb
                    .select('ur.*')
                    .from(UserRelationship, 'ur')
                    .where('ur.user_id = users.user_id')
                    .andWhere('ur.user_organization_id = :relOrgId')
                    .orderBy('ur.user_relationships_id', 'DESC')
                    .limit(1);
            },
            'lastRelationship',
            'true'
        )
        // .addSelect('lastInvitation')
        .addSelect('lastRelationship')
        .where('relationships.userOrganizationId = :orgId', { orgId: request.activeOrgId })
        .andWhere('now() between relationships.startDateActive and COALESCE(relationships.endDateActive, now())')
        .andWhere('users.agentId = :agentId', { agentId: request.agent.agentId })
        .setParameter('inviteOrgId', request.activeOrgId)
        .setParameter('relOrgId', request.activeOrgId);

    return await query.getMany();
};

*/



export async function switchOrg(
    request: FastifyRequest<{ Body: SwitchOrgType }>): Promise<CrudReponseType | HttpError> {
    try {

        const { orgId } = request.body;
        const relation = await request.server.services.userService.getActiveOrgRelation({ userId: request.user.userId, orgId });

        if (isEmpty(relation)) {
            throw request.server.httpErrors.forbidden(translate('errors.organization.orgNonActive', request.defaultLanguage));
        }

        await request.server.redisUtils.setActiveOrg(request.user.externalUserId, orgId);
        return { message: RequestStatusEnum.UPDATED };

    } catch (error) {
        request.log.error(error, 'Failed to switch organization');
        throw request.server.httpErrors.badRequest(translate('errors.organization.failedToSwitch', request.defaultLanguage));
    }
};



export async function getActiveOrg(
    request: FastifyRequest): Promise<ActiveOrgType | HttpError> {
    try {
        const relation = await request.server.services.userService.getActiveOrgRelation({ userId: request.user.userId, orgId: request.activeOrgId });
        return relation?.userOrganization;

    } catch (error) {
        request.log.error(error, 'Failed to switch organization');
        throw request.server.httpErrors.badRequest(translate('errors.organization.failedToSwitch', request.defaultLanguage));
    }
};
