/*import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import amqp, { Channel, ChannelModel } from 'amqplib';
import fp from 'fastify-plugin';


export enum QueueNameEnum {
    example = "example",
}

declare module 'fastify' {
    interface FastifyInstance {
        amqp: {
            connection: ChannelModel,
            channel: Channel,
            publishMessage: (queueName: QueueNameEnum, messageObject: any) => void
        }
    }
}

const rabbitmqPublish: FastifyPluginAsync = async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
    const connection = await amqp.connect({
        protocol: 'amqp',
        hostname: fastify.config.RABBIT_URL,
        port: fastify.config.RABBIT_PORT,
        username: fastify.config.RABBIT_USER,
        password: fastify.config.RABBIT_PASSWORD,
        vhost: fastify.config.RABBIT_VHOST 
    });
    const channel = await connection.createChannel();

    await Promise.all(Object.values(QueueNameEnum).map(async p => await channel.assertQueue(p, {})));

    function publishMessage(queueName: QueueNameEnum, messageObject: any) {
        const msg = JSON.stringify(messageObject);
        channel.publish('', queueName, Buffer.from(msg));
    }

    fastify.decorate('amqp', {
        publishMessage,
        connection,
        channel: channel
    });

    fastify.decorate('publishMessage', publishMessage);
    fastify.addHook('onClose', () => connection.close())
}

export default fp(rabbitmqPublish, { name: 'rabbitmqPublish' });
*/