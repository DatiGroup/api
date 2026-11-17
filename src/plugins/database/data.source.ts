import 'reflect-metadata';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import plugin from 'typeorm-fastify-plugin';
import { join } from 'path';

export async function postgresPlugin(fastify: FastifyInstance) {

  try {
    fastify.register(plugin, {
      namespace: "typeorm",
      type: 'postgres',
      host: fastify.config.DB_HOST,
      port: fastify.config.DB_PORT,
      username: fastify.config.DB_USER_NAME,
      password: fastify.config.DB_PASSWORD,
      database: fastify.config.DB_NAME,
      synchronize: false, // in dev set it to true to auto update tables
      logging: false,
      logger: "debug",
      //  logger: fastify.config.NODE_ENV == 'production' ? "debug" : "file",
      entities: [join(__dirname, '../../entities/**/*.entity{.ts,.js}').replace(/\\/g, '/')],
      migrations: [join(__dirname, '../../migrations/*{.ts,.js}').replace(/\\/g, '/')],
      migrationsRun: true,
    });

    console.log('✅ DB done');
  }
  catch (e) { console.log('DB startup error', e); }
}

export default fp(postgresPlugin, { name: 'typeorm', dependencies: ['configPlugin'] });
