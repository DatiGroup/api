import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fastifyCors from '@fastify/cors';

const corsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const allowedOrigins = fastify.config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

  void fastify.register(fastifyCors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      // In development, allow all origins
      if (fastify.config.NODE_ENV !== 'production') {
        callback(null, true);
        return;
      }

      // In production, check against allowlist
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
  });
  console.log('✅ Cors done', { allowedOrigins, env: fastify.config.NODE_ENV });
};

export default fp(corsPlugin, { name: 'corsPlugin' });