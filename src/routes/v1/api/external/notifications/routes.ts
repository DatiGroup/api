import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { RoleEnum } from '../../../../../types/role'
import { SwaggerSectionTags } from '../../../../../manual/swagger'
import zodToJsonSchema from 'zod-to-json-schema'
import { previewNotificationTemplate, sendCustomNotification } from './handler'
import {
  postPreviewResponseSchema,
  postNotificationPreviewSchema,
  postNotificationSchema,
  postNotificationResponseSchema,
} from './schema'

const ExternalNotificationRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
) => {
  const server = fastify

  server.post('/preview', {
    onRequest: server.protect([RoleEnum.externalNotificationAdmin]),
    schema: {
      tags: [SwaggerSectionTags.external.name],
      summary: 'Preview notification template',
      body: zodToJsonSchema(postNotificationPreviewSchema),
      response: {
        200: zodToJsonSchema(postPreviewResponseSchema),
      },
    },
    handler: previewNotificationTemplate,
  })

  server.post('/', {
    onRequest: server.protect([RoleEnum.externalNotificationAdmin]),
    schema: {
      tags: [SwaggerSectionTags.external.name],
      summary: 'Send notification',
      body: zodToJsonSchema(postNotificationSchema),
      response: {
        200: zodToJsonSchema(postNotificationResponseSchema),
      },
    },
    handler: sendCustomNotification,
  })
}

export default ExternalNotificationRoutes
