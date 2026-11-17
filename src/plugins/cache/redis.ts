import { FastifyInstance, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import redis from '@fastify/redis';
import { RequestUserType } from '../../types/requestUserType';
import { createUserError } from '../../utils/errors';
import { translate } from '../../utils/translate';

export interface CacheActiveOrgType {
  partyId: number,
  dashboardType?: string
}

async function redisPlugin(fastify: FastifyInstance) {
  const REDIS_USER = 'user_';
  const REDIS_USER_ORG = 'user_org_';
  const namespace = fastify.config.REDIS_NAMESPACE;

  try {
    // Wait for Redis registration to complete
    await fastify.register(redis, {
      namespace: fastify.config.REDIS_NAMESPACE,
      host: fastify.config.REDIS_HOST,
      password: fastify.config.REDIS_PASSWORD,
      port: fastify.config.REDIS_PORT,
      family: 4,
      // Add timeout options for CI/CD
      connectTimeout: 5000,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    /**
     * Private helper: Set binary throttle in Redis
     */
    const setThrottle = async (key: string, expireSeconds: number = 60) => {
      await fastify.redis[namespace].setex(key, expireSeconds, 1);
    };

    /**
     * Private helper: Check if throttle exists in Redis
     */
    const existsThrottle = async (key: string): Promise<boolean> => {
      const result = await fastify.redis[namespace].exists(key);
      return result === 1;
    };

    /**
     * Private helper: Check and increment rate limit counter
     * @param key - Redis key for rate limiting
     * @param max - Maximum allowed attempts
     * @param windowSeconds - Time window in seconds
     * @returns Object with allowed flag and current count
     */
    const checkRateLimit = async (key: string, max: number, windowSeconds: number) => {
      // Check if already throttled
      const throttled = await fastify.redis[namespace].exists(key);
      if (throttled === 1) {
        return { allowed: false, current: max + 1 };
      }

      // Increment counter
      const count = await fastify.redis[namespace].incr(key);

      // Set expiry on first attempt
      if (count === 1) {
        await fastify.redis[namespace].expire(key, windowSeconds);
      }

      // Check if limit exceeded
      if (count > max) {
        // Set throttle for remaining window time
        await fastify.redis[namespace].setex(key, windowSeconds, 1);
        return { allowed: false, current: count };
      }

      return { allowed: true, current: count };
    };

    // After Redis is registered, add the utility functions
    fastify.decorate('redisUtils', {
      async getObject(key: any) {
        try {
          const redisData = await fastify.redis[namespace].get(key);
          return redisData ? JSON.parse(redisData) : undefined;
        } catch (error) {
          console.error('Redis getObject error:', error);
          return undefined;
        }
      },

      async putObject(key: any, object: any, expire_sec: number) {
        try {
          const sec = expire_sec + 10;
          await fastify.redis[namespace].setex(key, sec, JSON.stringify(object));
        } catch (error) {
          console.error('Redis putObject error:', error);
        }
      },

      async removeUser(externalUserId: string) {
        try {
          await fastify.redis[namespace].del(`${REDIS_USER}_${externalUserId}`);
        } catch (error) {
          console.error('Redis removeUser error:', error);
        }
      },

      async setUser(externalUserId: string, user: RequestUserType, expire_sec: number) {
        await fastify.redisUtils.putObject(`${REDIS_USER}_${externalUserId}`, user, expire_sec);
      },

      async getUser(externalUserId: string) {
        return (await fastify.redisUtils.getObject(`${REDIS_USER}_${externalUserId}`)) as RequestUserType;
      },


      async setActiveOrg(externalUserId: string, orgId: number) {
        await fastify.redis[namespace].set(`${REDIS_USER_ORG}_${externalUserId}`, orgId);

      },

      async getActiveOrg(externalUserId: string) {
        const orgId = await fastify.redisUtils.getObject(`${REDIS_USER_ORG}_${externalUserId}`);
        return orgId;
      },


      async getUserTTL(externalUserId: string) {
        try {
          const key = `${REDIS_USER}_${externalUserId}`;
          return await fastify.redis[namespace].ttl(key);
        } catch (error) {
          console.error('Redis getUserTTL error:', error);
          return -1;
        }
      },

      async setValue(key: string, seconds: number, value: string | number) {
        await fastify.redis[namespace].setex(key, seconds, value);
      },
      async getValue(key: string) {
        const result = await fastify.redis[namespace].get(key);
        return result
      },

      async removeValue(key: string) {
        await fastify.redis[namespace].del(key);
      },

      /**
       * Enforce binary throttle and throw error if already throttled
       * @param request - Fastify request object (for httpErrors and language)
       * @param key - Redis key for throttling
       * @param expireSeconds - Throttle duration in seconds (default: 60)
       * @throws TooManyRequests error if throttle exists
       */
      async enforceThrottle(request: FastifyRequest, key: string, expireSeconds: number = 60) {
        const exists = await existsThrottle(key);
        if (exists) {
          throw createUserError(
            request.server.httpErrors.tooManyRequests(
              translate('errors.auth.tooManyRequests', (request as any).defaultLanguage)
            )
          );
        }
        await setThrottle(key, expireSeconds);
      },

      /**
       * Enforce rate limit and throw error if exceeded
       * @param request - Fastify request object (for httpErrors and language)
       * @param key - Redis key for rate limiting
       * @param max - Maximum allowed attempts
       * @param windowSeconds - Time window in seconds
       * @throws TooManyRequests error if rate limit exceeded
       */
      async enforceRateLimit(request: FastifyRequest, key: string, max: number, windowSeconds: number) {
        const rateLimit = await checkRateLimit(key, max, windowSeconds);

        if (!rateLimit.allowed) {
          throw createUserError(
            request.server.httpErrors.tooManyRequests(
              translate('errors.auth.tooManyRequests', (request as any).defaultLanguage)
            )
          );
        }
      },


    });



    console.log('✅ Redis plugin loaded');

  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw new Error('Failed to register redis: ' + (error as Error).message);
  }
}

export default fp(redisPlugin, { name: 'redis', dependencies: ['configPlugin'] });