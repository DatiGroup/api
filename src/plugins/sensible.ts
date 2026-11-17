import fp from 'fastify-plugin';
import sensible from '@fastify/sensible';
import { FastifyInstance, FastifyPluginAsync, FastifyPluginCallback } from 'fastify';

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */

const senssiblePlugin: FastifyPluginCallback = (
  fastify,
  options,
  done
) => {
  void fastify.register(sensible, {
    errorHandler: false,
  });

  done();
  console.log('✅ Sensible plugin loaded');
};

export default fp(senssiblePlugin, { name: 'senssiblePlugin' });