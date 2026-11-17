
/*import { Channel, ConsumeMessage } from 'amqplib';
import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { consumeExample } from './implementation/example';

const rabbitmqConsume: FastifyPluginAsync = async (fastify: FastifyInstance, opts: FastifyPluginOptions) => {
    const channel = fastify.amqp.channel;


     await channel.assertQueue(QueueNameEnum.example, {}).then(() => {
        return channel.consume(QueueNameEnum.example, async (msg) => {
            await consumeExample(msg, fastify, channel);
        });
    });
}

export default fastifyPlugin(rabbitmqConsume, { name: 'rabbitmqConsume', dependencies: ['rabbitmqPublish'] });

*/