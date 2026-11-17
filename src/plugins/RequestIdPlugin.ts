import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

const requestIdPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.addHook('onSend', async (request, reply) => {
        // Add the request ID to the response headers
        reply.header('x-request-id', request.id);
    });
};

export default fp(requestIdPlugin, {
    name: 'requestIdPlugin'
});