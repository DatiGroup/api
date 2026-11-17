import { FastifyInstance } from 'fastify';
import { DataSource, OptimisticLockVersionMismatchError } from 'typeorm';
import { RoleEnum } from '../types/role';
import { ApprovalRequest } from '../entities/public/approval.request.entity';
import { Approval } from '../entities/public/approval.entity';
import { Users } from '../entities/public/users.entity';
import { ApprovalRequestStatusEnum } from '../types/ApprovalRequestStatusEnum';
import { ApprovalActionEnum } from '../types/ApprovalActionEnum';
import { EntityEnum } from '../types/EntityEnum';


interface CreateRequestOptions {
    entityType: EntityEnum;
    entityId: number;
    createdBy: number;
    assignedToUserId?: number;
    assignedToKcGroup?: string;
    minRequiredApprovals?: number;
}

export class ApprovalService {
    constructor(protected readonly orm: DataSource, protected readonly fastify: FastifyInstance) { }

    private async performApproval(requestId: number, approvedByUserId: number, comments?: string): Promise<ApprovalRequest> {
        return await this.orm.transaction(async (manager) => {
            const requestRepo = manager.getRepository(ApprovalRequest);
            const approvalRepo = manager.getRepository(Approval);
            const userRepo = manager.getRepository(Users);

            // No pessimistic lock needed - optimistic locking handles concurrency
            const request = await requestRepo.findOne({
                where: { approvalRequestId: requestId }
            });

            if (!request) {
                throw new Error('Approval request not found');
            }

            if (request.status !== ApprovalRequestStatusEnum.PENDING) {
                throw new Error('Request is not pending approval');
            }

            const existingApproval = await approvalRepo.findOne({
                where: {
                    approvalRequestId: requestId,
                    approvedByUserId
                }
            });

            if (existingApproval) {
                throw new Error('User has already acted on this request');
            }

            // Create approval record
            const approval = approvalRepo.create({
                approvalRequestId: requestId,
                approvedByUserId,
                action: ApprovalActionEnum.APPROVED,
                comments
            });

            await approvalRepo.save(approval);

            // Count current approvals
            const currentApprovals = await approvalRepo.count({
                where: {
                    approvalRequestId: requestId,
                    action: ApprovalActionEnum.APPROVED
                }
            });

            // Update request - version column will be checked automatically
            request.currentApprovalsCount = currentApprovals;
            request.updatedBy = approvedByUserId;

            if (currentApprovals >= request.minRequiredApprovals) {
                request.status = ApprovalRequestStatusEnum.APPROVED;
                const user = await userRepo.findOne({
                    where: { userId: request.entityId }
                });

                user.approvalStatus = ApprovalRequestStatusEnum.APPROVED;
                await userRepo.save(user);

            }

            return await requestRepo.save(request); // Will throw OptimisticLockVersionMismatchError if conflict
        });
    }

    /**
     * Core rejection logic - separated for retry pattern
     */
    private async performRejection(requestId: number, approvedByUserId: number, comments?: string): Promise<ApprovalRequest> {
        return await this.orm.transaction(async (manager) => {
            const requestRepo = manager.getRepository(ApprovalRequest);
            const approvalRepo = manager.getRepository(Approval);
            const userRepo = manager.getRepository(Users);

            // No pessimistic lock needed - optimistic locking handles concurrency
            const request = await requestRepo.findOne({
                where: { approvalRequestId: requestId }
            });

            if (!request) {
                throw new Error('Approval request not found');
            }

            if (request.status !== ApprovalRequestStatusEnum.PENDING) {
                throw new Error('Request is not pending approval');
            }

            // Check if user already approved/rejected
            const existingApproval = await approvalRepo.findOne({
                where: {
                    approvalRequestId: requestId,
                    approvedByUserId
                }
            });

            if (existingApproval) {
                throw new Error('User has already acted on this request');
            }

            // Create rejection record
            const approval = approvalRepo.create({
                approvalRequestId: requestId,
                approvedByUserId,
                action: ApprovalActionEnum.REJECTED,
                comments
            });

            await approvalRepo.save(approval);

            request.status = ApprovalRequestStatusEnum.REJECTED;
            request.updatedBy = approvedByUserId;
            const user = await userRepo.findOne({
                where: { userId: request.entityId }
            });

            user.approvalStatus = ApprovalRequestStatusEnum.REJECTED;
            await userRepo.save(user);

            return await requestRepo.save(request); // Will throw OptimisticLockVersionMismatchError if conflict


        });
    }


    public async requestApproval({ entityType,
        entityId,
        createdBy,
        assignedToUserId,
        assignedToKcGroup = RoleEnum.portalAdminUserEdit,
        minRequiredApprovals = 1 }: CreateRequestOptions) {

        if (!assignedToUserId && !assignedToKcGroup) {
            throw new Error('Must assign request to a user or a Keycloak group');
        }
        if (assignedToUserId && assignedToKcGroup) {
            throw new Error('Cannot assign to both user and Keycloak group at the same time');
        }
        try {
            const requestRepository = this.orm.getRepository(ApprovalRequest);

            const newRequest = new ApprovalRequest();
            newRequest.entityType = entityType;
            newRequest.entityId = entityId;
            newRequest.createdBy = createdBy;
            newRequest.updatedBy = createdBy;
            newRequest.assignedToUserId = assignedToUserId;
            newRequest.assignedToKcGroup = assignedToKcGroup;
            newRequest.minRequiredApprovals = minRequiredApprovals;
            newRequest.currentApprovalsCount = 0;
            newRequest.status = ApprovalRequestStatusEnum.PENDING;

            const userRepo = this.orm.getRepository(Users);
            const user = await userRepo.findOne({ where: { userId: entityId } });
            user.approvalStatus = ApprovalRequestStatusEnum.PENDING;
            await userRepo.save(user);

            return await requestRepository.save(newRequest);
        }
        catch (error) {
            this.fastify.log.error('Failed to create approval request', { error });
            throw new Error('Failed to create approval request');

        }
    }

    public async approveRequest(
        requestId: number,
        approvedByUserId: number,
        comments?: string
    ): Promise<ApprovalRequest> {
        try {
            return await this.performApproval(requestId, approvedByUserId, comments);
        } catch (error) {
            if (error instanceof OptimisticLockVersionMismatchError) {
                this.fastify.log.warn('Optimistic lock conflict, retrying once', { requestId, approvedByUserId });
                // Single retry after brief delay
                await new Promise(resolve => setTimeout(resolve, 100));
                return await this.performApproval(requestId, approvedByUserId, comments);
            }
            throw error;
        }
    }
    public async rejectRequest(
        requestId: number,
        approvedByUserId: number,
        comments?: string
    ): Promise<ApprovalRequest> {
        try {
            return await this.performRejection(requestId, approvedByUserId, comments);
        } catch (error) {
            if (error instanceof OptimisticLockVersionMismatchError) {
                this.fastify.log.warn('Optimistic lock conflict, retrying once', { requestId, approvedByUserId });
                // Single retry after brief delay
                await new Promise(resolve => setTimeout(resolve, 100));
                return await this.performRejection(requestId, approvedByUserId, comments);
            }
            throw error;
        }
    }

    public async getRequestById(requestId: number): Promise<ApprovalRequest | null> {
        const requestRepo = this.orm.getRepository(ApprovalRequest);
        return await requestRepo.findOne({
            where: { approvalRequestId: requestId }
        });
    }
}
