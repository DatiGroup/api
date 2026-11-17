import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import helmet from '@fastify/helmet';

const helmetPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  void fastify.register(helmet, { global: true ,
    crossOriginResourcePolicy:{
    policy: "cross-origin" 
    }
  });
   console.log('✅ Helmet plugin loaded');
};

export default fp(helmetPlugin, { name: 'helmetPlugin' });