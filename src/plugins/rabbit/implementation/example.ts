/* import { Channel, ConsumeMessage } from "amqplib";
import { FastifyInstance } from "fastify";

export async function consumeExample(msg: ConsumeMessage | null, fastify: FastifyInstance, channel: Channel) {
    if (!msg) {
        return;
    }
    try {
        // { operation: POST|PATCH|DELETE }
        const data = JSON.parse(msg.content.toString());
        
        channel.ack(msg);
    } catch (error) {
        fastify.log.error(error);
    }
} */