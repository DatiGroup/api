import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { Redis } from "ioredis";

export async function rateLimitPlugin(fastify: FastifyInstance) {


    console.log('retelimt', { end: fastify.config.NODE_ENV, enabled: process.env.ENABLE_RATE_LIMIT_IN_TESTS });

    // Allow enabling rate limit in tests with env var
    if (fastify.config.NODE_ENV === 'test' && !process.env.ENABLE_RATE_LIMIT_IN_TESTS) {
        console.log('⚠️  RateLimit plugin skipped in test environment');
        return;
    }



    const rateRedis = new Redis({
        port: fastify.config.REDIS_PORT,
        host: fastify.config.REDIS_HOST,
        family: 4,           // 4(IPv4) or 6(IPv6)
        password: fastify.config.REDIS_PASSWORD,
        db: 0,
        connectTimeout: 500,
        maxRetriesPerRequest: 1
    });



    // First register the rate limit plugin and AWAIT it
    await fastify.register(rateLimit, {
        global: true,
        max: 1000, // maximum number of requests a single client can perform inside a timeWindow.
        timeWindow: '1 minute',
        hook: 'preHandler',
        redis: rateRedis,
        nameSpace: 'fastify-rate-limit-'
    });

    // Now fastify.rateLimit is available to use
    fastify.setNotFoundHandler({
        preHandler: fastify.rateLimit({
            max: 2,
            timeWindow: '1 minute'
        })
    }, function (request, reply) {
        reply.code(404).send();
    });

    console.log('✅ RateLimit plugin loaded');
}

export default fp(rateLimitPlugin, { name: 'rateLimitPlugin', dependencies: ['configPlugin'] });