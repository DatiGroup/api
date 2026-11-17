import { FastifyRequest } from 'fastify'
import { HttpError } from '@fastify/sensible/lib/httpError'
import {
  RequestStatusEnum,
  CrudReponseType,
} from '../../../../sharedShema/response'
import { RegisterPayloadType } from './registerSchema'
import { createUserError, safeErrorMessage } from '../../../../utils/errors'
import dayjs from 'dayjs'
import { EntityEnum } from '../../../../types/EntityEnum'
import { translateError } from './utils'
import { translate } from '../../../../utils/translate'

export async function registerUser(
  request: FastifyRequest<{ Body: RegisterPayloadType }>,
): Promise<CrudReponseType | HttpError> {
  let externalUserId = ''
  const {
    userName,
    password,
    email,
    firstName,
    lastName,
    preferredLang,
    organizationName,
    registrationNumber,
    country,
    contactName,
    contactLastName,
    contactEmail,
    recaptchaToken,
  } = request.body

  const rechaptchaPassed =
    await request.server.services.hcaptchaService.verifyHcaptcha(recaptchaToken)

  if (!rechaptchaPassed) {
    throw createUserError(
      request.server.httpErrors.forbidden(
        translate('errors.auth.captchaFailed', request.defaultLanguage),
      ),
    )
  }

  try {
    // Use Keycloak Admin Service to create user
    const newUser = await request.agent.keycloakAdminService.createUser({
      username: userName,
      email: email,
      password: password,
      emailVerified: false,
      firstName: firstName,
      lastName: lastName,
      enabled: request.server.config.KEYCLOAK_CREATED_ENABLED_USERS,
    })

    externalUserId = newUser.id
    request.log.info('externalUserId:', externalUserId)

    const createdUser = await request.server.services.userService.createUser(
      {
        userName: userName,
        email: email,
        firstName: firstName,
        lastName: lastName,
        preferredLang: preferredLang,
        externalUserId: externalUserId,
        externalSource: `keycloak:${newUser.realm}:${newUser.keycloakUrl}`,
        organizationName: organizationName,
        registrationNumber: registrationNumber,
        country: country,
        contactName: contactName,
        contactLastName: contactLastName,
        contactEmail: contactEmail,
      },
      request.agent.agentId,
    )

    request.log.info('User created successfully')

    await request.server.services.approvalService.requestApproval({
      entityType: EntityEnum.USERS,
      entityId: createdUser.userId,
      createdBy: createdUser.userId,
    })
    request.log.info('Approval request created successfully')

    try {
      const parameters = request.agent?.parameters as any
      await request.server.templates.sendUserWaitingApproval({
        agent: request.agent,
        user: createdUser,
        payload: {
          name: [firstName, lastName].filter(Boolean).join(' '),
          email: email,
          username: userName,
          language: preferredLang,
          createdAt: dayjs().format('DD-MMM-YYYY'),
          loginUrl: parameters?.portalUrl
            ? `${parameters.portalUrl}/auth/login`
            : '/',
        },
      })
    } catch (e) {
      request.log.error(
        'User created, Failed to send waiting approval email',
        e,
      )
    }

    return { message: RequestStatusEnum.SUCCESS, id: createdUser.userId }
  } catch (error: any) {
    if (externalUserId) {
      try {
        request.log.info(`Rolling back Keycloak user with ID ${externalUserId}`)
        await request.agent.keycloakAdminService.deleteUserById(externalUserId)
      } catch (deleteError) {
        request.log.error(
          `Failed to rollback Keycloak user with ID ${externalUserId}: ${safeErrorMessage(deleteError)}`,
        )
      }
    }

    // request.log.error(safeErrorMessage(error, 'User registration failed'))

    if (error.showToUser)
      throw createUserError(
        request.server.httpErrors.conflict(
          translate(error.cause, request.defaultLanguage),
        ),
      )

    throw request.server.httpErrors.internalServerError(
        translate('errors.reg.genericError', request.defaultLanguage)
    )
  }
}
