import {
  FastifyPluginAsync,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import fp from 'fastify-plugin'
import { Agents } from '../entities/public/agents.entity'
import {
  createKeycloakAdminService,
  KeycloakAdminService,
} from '../services/keycloakAdminService'
import {
  createKeycloakAuthService,
  KeycloakAuthService,
} from '../services/keycloakAuthService'
import { RequestHeaderEnum } from '../types/requestHeaderEnum'

export interface RequestAgent extends Agents {
  keycloakAdminService: KeycloakAdminService
  keycloakAuthService: KeycloakAuthService
}

declare module 'fastify' {
  interface FastifyInstance {
    agentList: RequestAgent[]
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    agent: RequestAgent
    defaultLanguage: string
  }
}
export const DEFAULT_AGENT = 'digital-twins'

/*
Get all aganets
Initialize keycloack services for each agent
Attach all agents to fastify instance
Get request agent from headers and attach to request object
Attach request agent to request object
*/

const agentPlugin: FastifyPluginAsync = async (
  fastify: any,
  options: FastifyPluginOptions,
) => {
  try {
    const agentRepository = fastify.orm['typeorm'].getRepository(Agents)

    const _agents = await agentRepository
      .createQueryBuilder('agents')
      .andWhere(
        '(agents.endDateActive > CURRENT_DATE or agents.endDateActive  is null ) ',
      )
      .getMany()

    const keycloakUrl = fastify.config.KEYCLOAK_URL as string
    const clientId = fastify.config.KEYCLOAK_CLIENT_ID as string
    const clientSecret = fastify.config.KEYCLOAK_CLIENT_SECRET as string
    const apiScope = fastify.config.KEYCLOAK_API_SCOPE as string

    const agents = await Promise.all(
      _agents.map(async (p: Agents) => {
        const agent = p.agentCode.toLowerCase()
        const nodeEnv = fastify.config.NODE_ENV.toLowerCase()
        let realm: string | null = null

        switch (nodeEnv) {
          case 'production':
            realm = `${agent}-production`
            break
          default:
            realm = `${agent}-development`
        }

        return {
          ...p,
          keycloakAdminService: await createKeycloakAdminService({
            keycloakUrl,
            realm,
            clientId,
            clientSecret,
          }),
          keycloakAuthService: await createKeycloakAuthService({
            keycloakUrl,
            realm,
            clientId,
            clientSecret,
            apiScope,
          }),
        }
      }),
    )

    fastify.decorate('agentList', agents)

    fastify.addHook(
      'onRequest',
      (request: FastifyRequest, reply: FastifyReply, done: () => void) => {
        const requestAgent =
          fastify.config.NODE_ENV === 'production'
            ? (request.headers[RequestHeaderEnum.AGENT] as string)?.replace(
                /['"]+/g,
                '',
              )
            : DEFAULT_AGENT

        const agent = request.server.agentList.find(
          p => p.agentCode === requestAgent,
        )

        // request.server.log.info(request.server.agentList)
        // request.server.log.info(requestAgent)
        request.server.log.info(agent)

        const requestLang = request?.headers[
          RequestHeaderEnum.USER_LANGUAGE
        ] as string
        request.defaultLanguage =
          requestLang ??
          agent?.parameters?.defaultLanguage ??
          fastify?.config?.DEFAULT_LANG ??
          'en'
        request.agent = agent
        done()
      },
    )

    console.log('✅ Agents done')
  } catch (e) {
    console.error('Failed to load agent', e)
  }
}

export default fp(agentPlugin, {
  name: 'agentPlugin',
  dependencies: ['typeorm', 'configPlugin', 'sessionAuth'],
})
