import { FastifyRequest } from "fastify";
import { AdminActivityParamsType, AdminActivityResponseType } from "./schema";
import { EntityEnum } from "../../../../../types/EntityEnum";
import { AdminActivityLog } from "../../../../../entities/public/admin.activity.log.entity";

export async function getAdminActivityHandler(request: FastifyRequest<{ Params: AdminActivityParamsType }>): Promise<AdminActivityResponseType> {

    const { entityId } = request.params

    const repo = request.server.orm["typeorm"].getRepository(AdminActivityLog);
    const logWithUser = await repo.find({
        where: {
            agentId: request.user.agentId,
            entityId: entityId,
            entityType: EntityEnum.USERS
        },
        relations: ["createdByUser", "createdByUser.profile"],
        order: {
            adminActivityLogId: "DESC"
        }
    });

    return logWithUser;
}


