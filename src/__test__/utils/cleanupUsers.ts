import { FastifyInstance } from "fastify";
import { EntityManager, In } from "typeorm";
import { UserProfile } from "../../entities/public/users.profile.entity";
import { Users } from "../../entities/public/users.entity";
import { AdminActivityLog } from "../../entities/public/admin.activity.log.entity";
import { ApprovalRequest } from "../../entities/public/approval.request.entity";
import { EntityEnum } from "../../types/EntityEnum";
import { Approval } from "../../entities/public/approval.entity";
import { UserOrganization } from "../../entities/public/user.organizations.entity";
import { UserRelationship } from "../../entities/public/user.relationships.entity";
import { UserInvitation } from "../../entities/public/user.iniviation.entity";

export async function cleanupUsers(app: FastifyInstance, agentCode: string, usernames: string[]) {

    for (const username of usernames) {
        try {
            await cleanupUser(app, agentCode, username);
            console.log('Deleted user:', username);
        } catch (error) {
            console.warn('Failed to delete user:', username, error);
        }
    }
    usernames.length = 0; // Clear array in-place
}


async function cleanupUser(app: FastifyInstance, agentCode: string, username: string) {
    const agent = app.agentList.find(p => p.agentCode === agentCode);
    const keycloackAdmin = agent?.keycloakAdminService;

    if (keycloackAdmin && username) {
        console.log('Cleaning up test user:', username);

        try {
            await keycloackAdmin.deleteUserByUserName(username);
            console.log('Deleted user:', username);
        } catch (error) {
            console.warn('Failed to delete user:', username, error);
        }
    }

    try {
        await app.orm["typeorm"].manager.transaction(async (manager: EntityManager) => {
            const profileRepo = manager.getRepository(UserProfile);
            const userRepo = manager.getRepository(Users);
            const adminLogRepo = manager.getRepository(AdminActivityLog);
            const approvalRequestRepo = manager.getRepository(ApprovalRequest);
            const approvalRepo = manager.getRepository(Approval);
            const useOrgRepo = manager.getRepository(UserOrganization);
            const useRelRepo = manager.getRepository(UserRelationship);
            const invitationRepo = manager.getRepository(UserInvitation);

            const user = await userRepo.findOne({ where: { userName: username, agentId: agent.agentId } });

            if (!user) {
                console.log('User not found in DB:', username);
                return;
            }

            const approvalRequests = await approvalRequestRepo.find({ where: { entityId: user.userId, entityType: EntityEnum.USERS } });
            const userRels = await useRelRepo.find({ where: { userId: user.userId } });
            const userOrgIds = userRels.filter(p => p.userId === user.userId).map(req => req.userOrganizationId);

            const approvalRequestIds = approvalRequests.map(req => req.approvalRequestId);

            if (approvalRequestIds.length > 0) {
                await approvalRepo.delete({ approvalRequestId: In(approvalRequestIds) });
            }
            await approvalRequestRepo.delete({ entityId: user.userId, entityType: EntityEnum.USERS });
            await adminLogRepo.delete({ entityType: EntityEnum.USERS, entityId: user.userId, agentId: agent.agentId });

            // Delete user invitations
            await invitationRepo.delete({ userId: user.userId });

            await profileRepo.delete({ userId: user.userId });

            // Delete relationships first (they reference user_organizations)
            await useRelRepo.delete({ userId: user.userId });

            // Only delete organizations that have no other relationships
            // (user_organizations can be shared by multiple users)
            if (userOrgIds.length > 0) {
                for (const orgId of userOrgIds) {
                    const remainingRels = await useRelRepo.count({ where: { userOrganizationId: orgId } });
                    if (remainingRels === 0) {
                        await useOrgRepo.delete({ userOrganizationId: orgId });
                    }
                }
            }

            await userRepo.delete({ userId: user.userId });

        });


    } catch (error) {
        console.warn('Test cleanup failed:', error);
    }


} 