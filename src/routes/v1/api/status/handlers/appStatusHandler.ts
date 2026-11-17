/**
 * Returns config, that is required for app
 *
 * @returns recatcha key will returned in lwr
 */

import { FastifyRequest } from 'fastify'
import { AppStatusType } from '../schema/appStatusSchema'
import { getLookupValues, LookupParamsType } from '../../lookups/handler'

export async function appStatusHandler(
  request: FastifyRequest,
): Promise<AppStatusType> {
  const settings = request.agent?.parameters as any
  const languages = settings?.languages || ['en']

  return {
    languages,
    agentName: settings?.agentName || '',
    agentType: request.agent?.agentType || 'x',
    uuid: request.agent?.uuid || null,
    defaultLanguage: settings?.defaultLanguage || 'en',
  }
}

export async function getRegistrationCountries(request: FastifyRequest) {
  ;(request as FastifyRequest<{ Params: LookupParamsType }>).params = {
    lookupType: 'REGISTRATION_COUNTRIES',
  }
  ;(request as any).user = { agentId: request.agent.agentId }

  return await getLookupValues(
    request as FastifyRequest<{ Params: LookupParamsType }>,
  )
}
