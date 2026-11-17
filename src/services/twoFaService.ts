import { DataSource } from "typeorm";
import { FastifyInstance } from "fastify";
import { UserTwoFARequest } from "../entities/public/user.two.fa.request.entity";

export class TwoFaService {

    constructor(protected readonly orm: DataSource, protected readonly fastify: FastifyInstance) { }

    private repository = this.orm.getRepository(UserTwoFARequest);

    public async createTwoFaRequest({ userId, agentCode }: { userId?: number, agentCode: string }) {

        const currentDate = new Date();
        const expired = new Date(currentDate.getTime() + 1 * 60000);

        const userTwoFARequest = new UserTwoFARequest();
        userTwoFARequest.userId = userId ?? null;
        userTwoFARequest.code = Math.floor(100000 + Math.random() * 900000);
        userTwoFARequest.expiredDate = expired;
        userTwoFARequest.agent = agentCode;

        await this.repository.save(userTwoFARequest);
        return userTwoFARequest;
    }

    public async findByCode({ code, agent }: { code: number, agent: string }) {
        return await this.repository.findOne({ where: { agent: agent, code: code} })
    }

    public async findByCodeUnused({ code, agent }: { code: number, agent: string }) {
        return await this.repository.findOne({ where: { agent: agent, code: code, used: false} })
    }


    public async save(entity: UserTwoFARequest) {
        return await this.repository.save(entity)
    }


}