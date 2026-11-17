import { DataSource } from "typeorm";
import { FastifyInstance } from "fastify";
import { Sessions } from "../entities/public/sessions.entity";
import * as geoip from "geoip-lite";
import { generateSessionId } from "../utils/cryptoUtils";

export class SessionService {

    constructor(protected readonly orm: DataSource, protected readonly fastify: FastifyInstance) { }

    private repository = this.orm.getRepository(Sessions);

    public async removeSession(sessionId: string) {
        await this.repository.delete({ sessionId: sessionId });

    }

    public async createSession({ userId, ip, userDeviceId }: { userId: number, ip: string, userDeviceId: number }) {
        const geoData = geoip.lookup(ip);
        const location = geoData ? `${geoData.country}, ${geoData.city}` : "Unknown";

        const session = new Sessions();
        session.sessionId = generateSessionId(userId, userDeviceId);
        session.userId = userId;
        session.location = location;
        session.userDeviceId = userDeviceId;
        session.ipAddress = ip;
        session.createdBy = userId;
        session.updatedBy = userId;

        return await this.repository.save(session);
    }

}