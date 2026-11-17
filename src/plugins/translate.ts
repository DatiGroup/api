import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { initTranslations } from '../i18n';



const translatePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {

    initTranslations(fastify.config.DEFAULT_LANG)
    console.log('✅ Static plugin loaded');
}

export default fp(translatePlugin, { name: 'translatePlugin' })