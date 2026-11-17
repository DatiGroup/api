import fp from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fastifyEnv from '@fastify/env'
import { FromSchema } from 'json-schema-to-ts'

export const NodeEnvPaths = {
  development_docker: `${process.cwd()}/.env.development.docker`,
  development_locally: `${process.cwd()}/.env.development.locally`,
  production: `${process.cwd()}/.env.production`,
  test: `${process.cwd()}/.env.test`,
}

const configSchema = {
  type: 'object',
  required: [
    'HOST',
    'LISTEN_PORT',
    'DB_HOST',
    'DB_PORT',
    'DB_USER_NAME',
    'DB_NAME',
    'REDIS_HOST',
    'REDIS_PASSWORD',
    'REDIS_PORT',
    'RESET_TOKEN_EXPIRY',
    /*  "KEYCLOAK_URL",
         "KEYCLOAK_CLIENT_ID",
         "KEYCLOAK_CLIENT_SECRET",
         "KEYCLOAK_SESSION_SECRET" */
  ],
  properties: {
    NODE_ENV: {
      type: 'string', //development_locally, development_docker, production, test
      default: 'development_locally',
    },
    LOG_LEVEL: {
      type: 'string',
      default: 'debug',
    },
    DEFAULT_LANG: {
      type: 'string',
      default: 'en',
    },
    REDIS_NAMESPACE: {
      type: 'string',
      default: 'redis',
    },
    REDIS_HOST: {
      type: 'string',
    },
    REDIS_PASSWORD: {
      type: 'string',
    },
    REDIS_PORT: {
      type: 'number',
    },
    DB_HOST: {
      type: 'string',
    },
    DB_PORT: {
      type: 'number',
    },
    DB_USER_NAME: {
      type: 'string',
    },
    DB_NAME: {
      type: 'string',
    },
    DB_PASSWORD: {
      type: 'string',
    },
    HOST: {
      type: 'string',
      default: '127.0.0.1',
    },
    PORT: {
      type: 'number',
      default: 3000,
    },
    LISTEN_PORT: {
      type: 'number',
      default: 3000,
    },
    MAIL_SENDER_TOKEN: {
      type: 'string',
    },
    RABBIT_URL: {
      type: 'string',
    },
    RABBIT_PORT: {
      type: 'number',
    },
    RABBIT_USER: {
      type: 'string',
    },
    RABBIT_PASSWORD: {
      type: 'string',
    },
    KEYCLOAK_URL: { type: 'string' },
    KEYCLOAK_CLIENT_ID: { type: 'string' },
    KEYCLOAK_CLIENT_SECRET: { type: 'string' },
    KEYCLOAK_SESSION_SECRET: { type: 'string' },
    KEYCLOAK_CREATED_ENABLED_USERS: { type: 'boolean', default: false },
    KEYCLOAK_NOTIFICATION_CLIENT_ID: { type: 'string' },
    KEYCLOAK_NOTIFICATION_CLIENT_SECRET: { type: 'string' },
    KEYCLOAK_API_SCOPE: { type: 'string' },
    EMAIL_API_KEY: { type: 'string' },
    RESET_TOKEN_EXPIRY: { type: 'number', default: 900 }, // in seconds (shopd be bigget than OTP_EXPIRY)
    OTP_EXPIRY: { type: 'number', default: 900 }, // in seconds ,
    USER_INVITE_EXPIRY: { type: 'number', default: 86400 }, // in seconds (24 hours)
    GOOGLE_TRANSLATE_API_KEY: {
      type: 'string',
    },
    HCAPTCHA_SECRET: {
      type: 'string',
    },
    ALLOWED_ORIGINS: {
      type: 'string',
      default: 'http://localhost:3000,http://localhost:5173',
    },
  },
} as const

export type ConfigType = FromSchema<typeof configSchema>

declare module 'fastify' {
  interface FastifyInstance {
    config: ConfigType
  }
}

const configPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  try {
    // console.log('NODE_ENV', process.env.NODE_ENV)
    const envOptions = {
      confKey: 'config',
      schema: configSchema,
      dotenv: {
        path: NodeEnvPaths[process.env.NODE_ENV as keyof typeof NodeEnvPaths],
        debug: true,
      },
    }
    await fastify.register(fastifyEnv, envOptions)
    console.log('✅ ConfigPlugin  done')
  } catch (e) {
    console.log('❌ ConfigPlugin plugin failed to load', e)
  }
}

export default fp(configPlugin, { name: 'configPlugin' })
