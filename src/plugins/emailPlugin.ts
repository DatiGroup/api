import { FastifyPluginCallback } from "fastify"
import fp from "fastify-plugin"
import { TransactionalEmailsApi } from "@getbrevo/brevo"

declare module 'fastify' {
    interface FastifyInstance {
        brevo: TransactionalEmailsApi
    }
}

const emailPlugin: FastifyPluginCallback = (
    fastify,
    options,
    done
) => {

    try {
        const emailAPI = new TransactionalEmailsApi();
        (emailAPI as any).authentications.apiKey.apiKey = fastify.config.EMAIL_API_KEY;
        fastify.decorate("brevo", emailAPI)
        console.log('✅ Brevo Plugin loaded');
    }
    catch (e) {
        console.warn('⚠️  Brevo Plugin not initialized:', e);
        throw new Error('fastify-brevo initizalization failed');
    }
    done();
}

export default fp(emailPlugin, { name: "brevoPlugin", dependencies: ['configPlugin'] });