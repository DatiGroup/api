import path from 'node:path'
import Fastify, { FastifyInstance } from 'fastify'
import AutoLoad from '@fastify/autoload'
import { LoggerConfig } from './configs/loggerOptions';
import swaggerPlugin from './manual/swagger'

async function buildFastifyApp(opts = {}): Promise<FastifyInstance> {
  console.log('Build App started ');
  const app = Fastify({
    ...opts,
    disableRequestLogging: true,
    logger: LoggerConfig,
    requestIdHeader: 'x-request-id',
    genReqId() { return crypto.randomUUID() },
    ajv: {
      customOptions: {
        coerceTypes: "array",
        strict: true,
        strictSchema: true,
        allErrors: true,
        removeAdditional: false, // Don't remove extra props, reject  request instead. NOTE: if this is true, than patch api will do update, event no body props are sent
      }
    },
    pluginTimeout: 600000
  });



  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
    dirNameRoutePrefix: false,
    // Ignore helper-only modules so autoload doesn't try to register them as plugins
    // Matches any file whose name contains "helper" or "helpers" (case-insensitive)
    // e.g., authHelpers.ts, someHelper.js
    ignorePattern: /(.*\/)?[^\/]*(helper|helpers)[^\/]*\.(js|ts)$/i,
  })

  console.log('All autoload Plugins registered ');

  await app.register(swaggerPlugin);
  console.log('Swagger plugin registered ');

  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
    indexPattern: /.*routes(\.js|\.ts)$/i,
    autoHooks: true,
    cascadeHooks: true,
    autoHooksPattern: /.*hooks(\.js|\.ts)$/i,
  })
  console.log('✅ Fastify App initialized');

  return app;
}

export default buildFastifyApp;