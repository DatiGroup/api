import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import session from '@fastify/session';

/**
 Plugin that session and cookie for keycloack 
 
 */
export async function sessionAuthPlugin(fastify: FastifyInstance) {

    try {
  
        await fastify.register(fastifyCookie); 
        await fastify.register(session, {
            secret: fastify.config.KEYCLOAK_SESSION_SECRET,
            cookie: {
                secure: fastify.config.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        });
        console.log('✅ Session Auth Plugin done');
    }
    catch (e) {
        console.error('Failed to load Session Auth Plugin', e);
    }

}

export default fp(sessionAuthPlugin, { name: 'sessionAuth', dependencies: ['configPlugin'] })
