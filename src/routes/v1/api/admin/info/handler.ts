import { FastifyRequest } from "fastify";
import { InfoEmailType } from "./schema";
import { Agents } from "../../../../../entities/public/agents.entity";
import { CrudReponseType, RequestStatusEnum } from "../../../../../sharedShema/response";
import { HttpError } from "@getbrevo/brevo";

export async function getAdminEmail(request: FastifyRequest): Promise<InfoEmailType> {

    const repo = request.server.orm["typeorm"].getRepository(Agents);
    const agentDetails = await repo.findOne({ where: { agentId: request.user.agentId } });

    return { email: agentDetails?.infoEmail };
}


export async function updateAdminEmail(
    request: FastifyRequest<{ Body: { email: string } }>
): Promise<CrudReponseType | HttpError> {
    const repo = request.server.orm["typeorm"].getRepository(Agents);

    // Check if agent exists
    const existingAgent = await repo.findOne({
        where: { agentId: request.user.agentId }
    });


    if (!existingAgent) {
        throw request.server.httpErrors.notFound("Agent not found");
    }

    // Update the email
    const updateResult = await repo.update(
        { agentId: request.user.agentId },
        { infoEmail: request.body.email }
    );


    if (updateResult.affected === 0) {
        throw request.server.httpErrors.internalServerError("Failed to update email");
    }


    return { message: RequestStatusEnum.UPDATED };
}