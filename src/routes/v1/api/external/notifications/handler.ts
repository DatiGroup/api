import { FastifyReply, FastifyRequest } from 'fastify'
import {
  PostPreviewResponseType,
  PostNotificationPreviewType,
  PostNotificationType,
  PostNotificationResponseType,
} from './schema'
import { TemplateType } from '../../../../../entities/public/templates.entity'
import { Users } from '../../../../../entities/public/users.entity'
import { createUserError } from '../../../../../utils/errors'
import { RequestStatusEnum } from '../../../../../sharedShema/response'

export async function previewNotificationTemplate(
  request: FastifyRequest<{ Body: PostNotificationPreviewType }>,
  reply: FastifyReply,
): Promise<PostPreviewResponseType> {
  const { subjectPayload, cssPayload, htmlPayload } = request.body
  const { parameters } = request.agent as any

  const templateVariables = {
    agentName: parameters?.agentName ?? request.agent?.agentCode,
    fromEmail: parameters?.fromEmail,
    logoUrl: parameters?.branding?.logoUrl,
    primaryColor: parameters?.branding?.primaryColor || '#FFFFFF',
    primaryColorText: parameters?.branding?.primaryColorText || '#000000',
  }

  const templateObject = await request.server.templates.processTemplate({
    templateIdentifier: 'custom_template',
    subject: subjectPayload,
    lang: request.defaultLanguage,
    type: TemplateType.EMAIL,
    payload: {
      cssPayload: cssPayload,
      htmlPayload: htmlPayload,

      ...templateVariables,
    },
  })

  return reply.type('text/html').send(templateObject.body)
}

export async function sendCustomNotification(
  request: FastifyRequest<{ Body: PostNotificationType }>,
  reply: FastifyReply,
): Promise<PostNotificationResponseType> {
  const { toEmail, notificationType, subjectPayload, cssPayload, htmlPayload } =
    request.body

  const userRepo = request.server.orm['typeorm'].getRepository(Users)

  try {
    const toUser = await userRepo.findOne({
      where: {
        email: request.body.toEmail.toLowerCase(),
      },
    })

    await request.server.templates.sendCustomNotification({
      notificationType: notificationType,
      agent: request.agent,
      user: toUser,
      toEmail: toEmail.toLowerCase(),
      payload: {
        subjectPayload: subjectPayload,
        cssPayload: cssPayload,
        htmlPayload: htmlPayload,
      },
    })
  } catch (error: any) {
    request.log.error(error.message)

    if (error.showToUser)
      throw createUserError(request.server.httpErrors.conflict(error.message))

    throw request.server.httpErrors.internalServerError(error.message)
  }

  return reply.code(200).send({ status: RequestStatusEnum.SUCCESS })
}
