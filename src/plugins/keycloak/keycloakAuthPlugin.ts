import { HttpError } from '@fastify/sensible/lib/httpError'
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fp from 'fastify-plugin'
import { isEmpty } from 'lodash'
import jwt from 'jsonwebtoken'
import { createKeycloakAuthService } from '../../services/keycloakAuthService'

/**
 Plugin that provides services to Keycloak Client authentication, 
 like login, logout, and token management
 For each agent initialize keycloack client
 */

export async function keycloakAuthPlugin(fastify: FastifyInstance) {
  // Custom protect for Bearer token APIs
  // Better for REST APIs, mobile apps, and microservices
  fastify.decorate('protect', (roles?: string | string[]) => {
    return async (
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<void | HttpError> => {
      try {
        console.log('Protecting route with Keycloak', roles)
        // Extract token from Authorization header
        const authHeader = request.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          reply.unauthorized()
          return
        }

        const token = authHeader.substring(7)
        const nodeEnv = fastify.config.NODE_ENV.toLowerCase()
        let realm: string | null = null
        const agent = request.agent.agentCode.toLowerCase() as string

        const { azp: clientId } = jwt.decode(token) as any
        if (!clientId)
          request.server.httpErrors.unauthorized('Missing clientId')

        const {
          KEYCLOAK_URL: keycloakUrl,
          KEYCLOAK_CLIENT_ID: jsClientId,
          KEYCLOAK_CLIENT_SECRET: jsClientSecret,
          KEYCLOAK_NOTIFICATION_CLIENT_ID: notificationClientId,
          KEYCLOAK_NOTIFICATION_CLIENT_SECRET: notificationClientSecret,
          KEYCLOAK_API_SCOPE: apiScope,
        } = request.server.config

        const clientSecretsMap = new Map<string, string>([
          [jsClientId, jsClientSecret],
          [notificationClientId, notificationClientSecret],
        ])

        if (!clientSecretsMap.get(clientId))
          request.server.httpErrors.unauthorized('Unknown clientId')

        switch (nodeEnv) {
          case 'production':
            realm = `${agent}-production`
            break
          default:
            realm = `${agent}-development`
        }

        try {
          const keycloakAuthService = await createKeycloakAuthService({
            keycloakUrl: keycloakUrl,
            realm: realm,
            clientId: clientId,
            clientSecret: clientSecretsMap.get(clientId) as string,
            apiScope: apiScope as string,
          })

          const keycloak = keycloakAuthService.getKeycloakInstance()

          // Use keycloak-connect's built-in token validation
          // This properly validates the token signature, expiration, and issuer
          const grant = await keycloak.grantManager.createGrant({
            access_token: token,
          } as any)

          // Validate the grant (this checks token expiration and signature)
          await keycloak.grantManager.validateGrant(grant)

          // Store grant in request (same as original keycloak.protect)
          request.kauth = { grant }

          const tokenContent = (grant.access_token as any)?.content
          const externalUserId = tokenContent?.sub

          if (!externalUserId)
            throw new Error('Cant find keycloak user id from token')

          const userObj = await fastify.redisUtils.getUser(externalUserId)
          const activeOrgId =
            await fastify.redisUtils.getActiveOrg(externalUserId)

          // if (!userObj) throw new Error('Cant find user object from cache')

          if (userObj && activeOrgId) {
            request.user = userObj
            request.activeOrgId = activeOrgId
          }

          // Role-based authorization if roles are specified
          if (!isEmpty(roles)) {
            const requiredRoles = Array.isArray(roles) ? roles : [roles]
            let hasRequiredRole = false

            // Check if user has any of the required roles
            // Access token content contains the roles
            const tokenContent = (grant.access_token as any)?.content
            const clientRoles = tokenContent?.realm_access?.roles || []

            for (const role of requiredRoles) {
              if (clientRoles.includes(role)) {
                hasRequiredRole = true
                break
              }
            }

            if (!hasRequiredRole) {
              console.error({
                error: 'Insufficient permissions',
                message: `Required role(s): ${requiredRoles.join(', ')}`,
                clientRoles: clientRoles,
              })
              reply.forbidden('Insufficient permissions')
              return
            }
          }
        } catch (validationError) {
          console.error('Token validation failed:', validationError)
          reply.unauthorized()
          return
        }
      } catch (error) {
        console.error('Authentication error:', error)
        reply.unauthorized()
        return
      }
    }
  })
  console.log('✅ Keycloak plugin loaded')
}

export default fp(keycloakAuthPlugin, {
  name: 'keycloak',
  dependencies: ['configPlugin', 'sessionAuth', 'agentPlugin'],
})
