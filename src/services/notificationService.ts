import { DataSource } from "typeorm";
import { FastifyInstance } from "fastify";
import { Messages } from "../entities/notifications/message.entity";

export class NotificationService {

    constructor(protected readonly orm: DataSource, protected readonly fastify: FastifyInstance) { }

    private repository = this.orm.getRepository(Messages);

    public async sendNotifications() {

        return await this.repository
            .createQueryBuilder("messages")
            .where("sent = false")
            .getMany();

    }
}