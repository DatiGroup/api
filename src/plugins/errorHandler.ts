import { FastifyInstance, FastifyPluginCallback, FastifyPluginOptions, FastifyError } from 'fastify'
import fp from 'fastify-plugin'
import { translate } from '../utils/translate';

const errorHandlerPlugin: FastifyPluginCallback = (fastify: FastifyInstance, options: FastifyPluginOptions, done) => {
  fastify.addHook('onRequest', async function onRequestLogHook(req) {
    req.log.info({ req }, 'incoming request 🔮')
  })
  fastify.addHook('onSend', async function onSendRequestLogHook(req, res) {
    req.log.info({ req, res }, 'request completed 🎉')
  })

  fastify.setErrorHandler(function customErrorHandler(err: FastifyError & { showToUser?: boolean; internalMessage?: string }, req, reply) {
    const statusCode = err.statusCode ?? 500
    reply.status(statusCode)

    // Log all errors with internal details if available
    const logMessage = err.internalMessage || err.message;

    // If marked as user-facing error, return the actual message
    if (err?.showToUser === true) {
      req.log.info({ req, res: reply, err }, logMessage)
      err.stack = undefined
      return reply.send(err)
    }

    // Exception for specific status codes - do not override message
    if (statusCode === 403 || statusCode === 404 || statusCode === 429) {
      req.log.info({ req, res: reply, err }, logMessage)
      err.stack = undefined
      return reply.send(err)
    }

    // All other errors - log and return generic message
    req.log.error({ req, res: reply, err }, logMessage)
    err.stack = undefined
    return reply.send(new Error(translate('errors.generic', req?.defaultLanguage)))
  })
  console.log('✅ Error plugin loaded');
  done()

}

export default fp(errorHandlerPlugin, { name: 'errorHandlerPlugin' });