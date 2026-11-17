import { DataSource, MoreThan } from "typeorm";
import { FastifyInstance } from "fastify";
import crypto from "crypto";
import { UserInvitation } from "../entities/public/user.iniviation.entity";

export class InvitationService {

    constructor(protected readonly orm: DataSource, protected readonly fastify: FastifyInstance) { }

    private repository = this.orm.getRepository(UserInvitation);

    public async createInvitation({ userId, email, orgId }: { userId: number, email: string, orgId: number }) {
        const endDate = new Date();
        const activeUserInvitations = await this.repository.find({
            where: {
                email: email,
                userOrganizationId: orgId,
                used: false,
                expiredDate: MoreThan(endDate)
            }
        })
        const expireActive = activeUserInvitations.map(p => ({ ...p, expiredDate: endDate }));
        await this.repository.save(expireActive);

        const willExpireIn = new Date(Date.now() + this.fastify.config.USER_INVITE_EXPIRY * 1000);
        // Generate stronger invitation code: 32 characters from 24 random bytes
        const invitationCode = crypto.randomBytes(24).toString('base64url').slice(0, 32);


        let newInvitation = new UserInvitation();

        newInvitation.userId = userId;
        newInvitation.userOrganizationId = orgId;
        newInvitation.expiredDate = willExpireIn;
        newInvitation.invitationCode = invitationCode;
        newInvitation.email = email;
        newInvitation.used = false;
        newInvitation.createdBy = userId;
        newInvitation.updatedBy = userId;
        newInvitation = await this.repository.save(newInvitation);
        return newInvitation.invitationCode || '';
    }

    public async acceptInvitation({ invitationCode }: { invitationCode: string }) {

        const invitation = await this.repository.findOne({
            where: {
                invitationCode: invitationCode,
                used: false,
                expiredDate: MoreThan(new Date())
            }
        });

        if (!invitation) {
            throw new Error('Invalid invitation code not found', { cause: 'WRONG_INVITATION_CODE' });
        }

        // Check if expired
        if (invitation.expiredDate && invitation.expiredDate < new Date()) {
            throw new Error('Invalid invitation code not found', { cause: 'EXPIRED_INVITATION_CODE' });
        }

        invitation.used = true;
        await this.repository.save(invitation);
        return true;

    }


    public async revokeInvitation({ invitationId }: { invitationId: number }) {

        const invitation = await this.repository.findOne({
            where: {
                invitationId: invitationId,
            }
        });

        if (!invitation.used) {
            invitation.expiredDate = new Date();
            await this.repository.save(invitation);
        }

    }
}