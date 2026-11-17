import { FastifyInstance } from 'fastify';
import { DataSource } from 'typeorm';
import { EntityEnum } from '../types/EntityEnum';
import { AdminActivityLog } from '../entities/public/admin.activity.log.entity';
import { AdminActionEnum } from '../types/adminActionEnum';

interface AdminActivityLogType {
    agentId: number;
    entityType: EntityEnum;
    action: AdminActionEnum;
    createdBy: number;
    details?: Record<string, any>;
    entityId?: number;
    api?: string;
    requestId?: string;
}

export class AdminActivityLogService {
    constructor(protected readonly orm: DataSource, protected readonly fastify: FastifyInstance) { }
    private repository = this.orm.getRepository(AdminActivityLog);


    public async logActivity({ agentId, entityType, action, createdBy, details, entityId, api, requestId }: AdminActivityLogType): Promise<void> {

        try {
            const item = new AdminActivityLog();
            item.agentId = agentId;
            item.entityType = entityType;
            item.action = action;
            item.createdBy = createdBy;
            item.details = details;
            item.entityId = entityId;
            item.api = api;
            item.requestId = requestId;

            await this.repository.save(item);
        }
        catch (error) {
            this.fastify.log.error('Failed to log admin activity', { error });
        }

    }
}
