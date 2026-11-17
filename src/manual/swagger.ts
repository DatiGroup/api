import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import SwaggerUI from '@fastify/swagger-ui'
import Swagger from '@fastify/swagger'

interface SwaggerTagsType {
  [key: string]: { name: string; description: string }
}
export const SwaggerSectionTags: SwaggerTagsType = {
  auth: { name: 'Auth', description: 'Login related end-points' },
  register: { name: 'Register', description: 'Registartion flow' },
  me: {
    name: 'Me',
    description: 'Returns summary data about logged in user, user profile',
  },
  authQr: { name: 'Auth QR', description: 'Login using QR code' },
  otp: { name: 'OTP', description: 'Send One time codes' },
  status: { name: 'Status', description: 'Get app settings' },
  session: { name: 'Session', description: 'Manage user session' },
  root: { name: 'Root', description: 'Health - check' },
  notes: { name: 'Notes', description: 'Notes for different entities' },
  fnd: { name: 'Fnd', description: 'Common lookups' },
  lookups: { name: 'Lookup', description: 'Platform specific lookups' },
  notifications: { name: 'Notifications', description: 'Notifications' },
  staticContent: { name: 'Static content', description: 'Static content' },
  apiGateway: { name: 'Api gateway', description: 'Api gateway' },
  approve: { name: 'User Approvals', description: 'Manage user approvals' },
  integration: {
    name: 'Integration',
    description: 'Integration related end-points',
  },
  products: {
    name: 'Products',
    description: 'Platform products available for user',
  },
  productsAdmin: {
    name: 'Admin Products',
    description: 'Platform product management from admins',
  },
  productDependecy: {
    name: 'Product Dependecy',
    description: 'User dependecy route',
  },
  translations: {
    name: 'Translations',
    description: 'Manage translations for different entities',
  },
  resources: {
    name: 'Resources',
    description: 'Platform resource management from user',
  },
  organization: {
    name: 'Organization',
    description: 'Platform organization management from user',
  },
  assistant: {
    name: 'AI Assistant',
    description: 'AI assistant related end-points',
  },
  audio: { name: 'AI Audio', description: 'AI audio related end-points' },
  adminInfo: { name: 'Admin Info', description: 'Platform admin information' },
  userInvitation: {
    name: 'User Invitation',
    description: 'User invitation management',
  },
  webhookResources: {
    name: 'Webhook Resources Request',
    description: 'Webhook to inform about resource requests processing status',
  },
  terms: { name: 'Terms', description: 'Terms and Conditions of platform' },
  ragGroups: { name: 'RAG Groups', description: 'RAG group management' },
  ragFile: { name: 'RAG Files', description: 'RAG file management' },
  external: {
    name: 'External',
    description: 'External routes for 3rd party integration',
  },
}

const swaggerPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  const tags = (
    Object.keys(SwaggerSectionTags) as Array<keyof SwaggerTagsType>
  ).map(key => SwaggerSectionTags[key])
  void fastify.register(Swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Scheduling API',
        description: 'Scheduling API swagger',
        version: '0.1.0',
      },
      servers: [
        {
          url: 'http://localhost:3001',
          description: 'Development server',
        },
      ],
      tags: tags,
    },
  })
  void fastify.register(SwaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      deepLinking: false,
      docExpansion: 'none',
      defaultModelsExpandDepth: 1, // Expands all schema properties by default
    },
    uiHooks: {
      onRequest: function (request, reply, next) {
        next()
      },
      preHandler: function (request, reply, next) {
        next()
      },
    },
    staticCSP: true,
  })
}

export default fp(swaggerPlugin, { name: 'swaggerPlugin' })
