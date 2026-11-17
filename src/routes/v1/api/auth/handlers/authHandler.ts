import { FastifyRequest } from 'fastify'
import {
  LoginPayloadType,
  LoginReponseType,
  RefreshTokenType,
  RefreshTokenTypeReponseType,
} from '../schema'
import { HttpError } from '@fastify/sensible/lib/httpError'
import {
  RequestStatusEnum,
  CrudReponseType,
} from '../../../../../sharedShema/response'
import { createUserError, safeErrorMessage } from '../../../../../utils/errors'
import { getJwData, translateError } from '../utils'
import { isEmpty } from 'lodash'
import { RequestUserType } from '../../../../../types/requestUserType'
import { translate } from '../../../../../utils/translate'

export async function login(
  request: FastifyRequest<{ Body: LoginPayloadType }>,
): Promise<LoginReponseType | HttpError> {
  try {
    const { userName, password, deviceInfo } = request.body

    const user = await request.server.services.userService.getUserDetails({
      userName,
      agentId: request.agent.agentId,
    })

    if (!user || !user?.userId) {
      const error = new Error('User not found', {
        cause: 'errors.auth.invalidCredentials',
      }) as any
      error.showToUser = true

      throw error
    }

    if (user?.endDateActive && user.endDateActive <= new Date()) {
      const error = new Error('Account is disabled', {
        cause: 'errors.auth.accountDisabled',
      }) as any
      error.showToUser = true

      throw error
    }

    const userDevices =
      await request.server.services.userDevicesService.processDevice({
        userId: user.userId,
        device: deviceInfo,
        ip: request.ip,
      })

    const session = await request.server.services.sessionService.createSession({
      ip: request.ip,
      userId: user.userId,
      userDeviceId: userDevices.userDeviceId,
    })

    if (!session?.sessionId) {
      const error = new Error('Session creation failed', {
        cause: 'errors.auth.sessionFailed',
      }) as any
      error.showToUser = true

      throw error
    }

    let tokenResponse

    request.server.log.info(request.agent.keycloakAuthService)

    try {
      tokenResponse = await request.agent.keycloakAuthService.login(
        userName,
        password,
      )

      request.server.log.info(tokenResponse)
    } catch (error) {
      request.log.error(
        safeErrorMessage(error, 'Keycloak authorization failed'),
      )
      //   throw new Error(`Keycloak authorization failed`, {
      //     cause: 'KEYCLOAK_ERROR',
      //   })
      throw error
    }

    const { expiresIn } = getJwData(tokenResponse?.access_token)
    if (!expiresIn) throw new Error('Cant find expiration time from token')

    const orgRel = await request.server.services.userService.getActiveOrg({
      userId: user.userId,
    })

    if (isEmpty(orgRel)) {
      const error = new Error('User has no active organization relations', {
        cause: 'errors.auth.noActiveOrg',
      }) as any
      error.showToUser = true

      throw error
    }

    const activeOrgId = orgRel[0].userOrganizationId

    const requestUser: RequestUserType = {
      userId: user.userId,
      agentId: user.agentId,
      userName: user.userName,
      email: user.email,
      externalUserId: user.externalUserId,
      startDateActive: user.startDateActive,
      endDateActive: user.endDateActive,
      sessionId: session.sessionId,
    }

    await request.server.redisUtils.setUser(
      user.externalUserId,
      requestUser,
      expiresIn,
    )
    await request.server.redisUtils.setActiveOrg(
      user.externalUserId,
      activeOrgId,
    )

    const response: LoginReponseType = {
      activeOrgId: activeOrgId,
      userOrgs: {
        organizations: orgRel.map(rel => ({
          orgId: rel.userOrganizationId,
          name: rel.userOrganization.name,
        })),
      },
      user: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
      },
      token: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
        refresh_expires_in: tokenResponse.refresh_expires_in,
        scope: tokenResponse.scope,
      },
    }

    return response
  } catch (error: any) {
    request.log.error(safeErrorMessage(error, 'User login failed'))

    if (error.showToUser)
      throw createUserError(
        request.server.httpErrors.conflict(
          translate(error.cause, request.defaultLanguage),
        ),
      )

    throw request.server.httpErrors.conflict(
      translate('errors.auth.genericError', request.defaultLanguage),
    )
  }
}

export async function refresh(
  request: FastifyRequest<{ Body: RefreshTokenType }>,
): Promise<RefreshTokenTypeReponseType | HttpError> {
  try {
    const { refreshToken } = request.body
    const tokenResponse =
      await request.agent.keycloakAuthService.refreshToken(refreshToken)

    /// optinally we can get get user from database to refersh user object
    // and maybe lock out if enddated
    const { expiresIn, sub } = getJwData(tokenResponse?.access_token)
    const user = await request.server.redisUtils.getUser(sub)
    await request.server.redisUtils.removeUser(sub)

    await request.server.redisUtils.setUser(
      user.externalUserId,
      user,
      expiresIn,
    )
    const response: LoginReponseType = {
      user: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
      },
      token: {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        token_type: tokenResponse.token_type,
        expires_in: tokenResponse.expires_in,
        refresh_expires_in: tokenResponse.refresh_expires_in,
        scope: tokenResponse.scope,
      },
    }
    return response
  } catch (error: any) {
    error.cause = error.cause || 'REFRESH_ERROR'

    request.log.error(safeErrorMessage(error, 'Refresh token failed'))
    throw request.server.httpErrors.conflict(
      translateError(error, request.defaultLanguage),
    )
  }
}

export async function logout(
  request: FastifyRequest<{ Body: RefreshTokenType }>,
): Promise<CrudReponseType | HttpError> {
  try {
    const { refreshToken } = request.body
    const { sub } = getJwData(refreshToken)

    await request.agent.keycloakAuthService.logout(refreshToken)
    const user = await request.server.redisUtils.getUser(sub)
    await request.server.redisUtils.removeUser(sub)

    if (user?.sessionId) {
      await request.server.services.sessionService.removeSession(user.sessionId)
    }

    return { message: RequestStatusEnum.SUCCESS }
  } catch (error: any) {
    error.cause = error.cause || 'LOGOUT_ERROR'

    request.log.error(safeErrorMessage(error, 'Logout failed'))
    throw request.server.httpErrors.internalServerError(
      translateError(error, request.defaultLanguage),
    )
  }
}
