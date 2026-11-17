import fp from 'fastify-plugin'
import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { TemplateType } from '../../entities/public/templates.entity'
import {
  createEmailTemplates as createCustomTemplate,
  processTemplate,
  sendEmail,
} from './templateUtils'
import {
  CustomNotificationProps,
  EmailUserApprovalProps,
  InivitationProps,
  PasswordOtpProps,
  PasswordResetRequestProps,
  ProcessTemplateResponse,
  ProcessTemplateType,
} from './_types'
import { Agents } from '../../entities/public/agents.entity'
import { Users } from '../../entities/public/users.entity'

declare module 'fastify' {
  interface FastifyInstance {
    templates: {
      processTemplate: (
        payload: ProcessTemplateType,
      ) => Promise<ProcessTemplateResponse>
      sendUserApprove: ({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: { loginLink: string; firstName: string }
        user: Users
      }) => Promise<void>
      sendUserReject: ({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: { firstName: string }
        user: Users
      }) => Promise<void>
      sendUserWaitingApproval: ({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: EmailUserApprovalProps
        user: Users
      }) => Promise<void>
      sendPasswordResetRequest: ({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: PasswordResetRequestProps
        user: Users
      }) => Promise<void>
      sendOtp: ({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: PasswordOtpProps
        user: Users
      }) => Promise<void>
      sendInvite: ({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: InivitationProps
        user: Users
      }) => Promise<void>
      sendCustomNotification: ({
        notificationType,
        agent,
        user,
        toEmail,
        payload,
      }: CustomNotificationProps) => Promise<void>
    }
  }
}

const templatePlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  try {
    try {
      const replace = true
      await createCustomTemplate(fastify, {
        identifier: 'approve_user',
        subject: 'templates.approveUser.subject',
        fileName: 'approve_user.html',
        type: TemplateType.EMAIL,
        replace,
      })
      await createCustomTemplate(fastify, {
        identifier: 'user_waiting_approval',
        subject: 'templates.userWaiting.subject',
        fileName: 'user_waiting_approval.html',
        type: TemplateType.EMAIL,
        replace,
      })
      await createCustomTemplate(fastify, {
        identifier: 'password_reset_request',
        subject: 'templates.passwordResetRequest.subject',
        fileName: 'password_reset_request.html',
        type: TemplateType.EMAIL,
        replace,
      })

      await createCustomTemplate(fastify, {
        identifier: 'password_otp_email',
        subject: 'templates.passwordOtp.subject',
        fileName: 'password_otp_email.html',
        type: TemplateType.EMAIL,
        replace,
      })
      await createCustomTemplate(fastify, {
        identifier: 'invite_member',
        subject: 'templates.inviteMember.subject',
        fileName: 'invite_member.html',
        type: TemplateType.EMAIL,
        replace,
      })
      await createCustomTemplate(fastify, {
        identifier: 'custom_template',
        subject: 'templates.custom.subject',
        fileName: 'custom_template.html',
        type: TemplateType.EMAIL,
        replace,
      })
    } catch (e) {
      console.log('Failed to load templates to Database', e)
    }

    fastify.decorate('templates', {
      async processTemplate(payload: ProcessTemplateType) {
        return await processTemplate(fastify, payload)
      },
      async sendUserApprove({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: { loginLink: string; firstName: string }
        user: Users
      }) {
        await sendEmail({
          fastify,
          agent,
          user: user,
          templateIdentifier: 'approve_user',
          payload,
        })
      },
      async sendUserReject({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: { firstName: string }
        user: Users
      }) {
        await sendEmail({
          fastify,
          agent,
          user,
          templateIdentifier: 'reject_user',
          payload,
        })
      },
      async sendUserWaitingApproval({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: EmailUserApprovalProps
        user: Users
      }) {
        const repo = fastify.orm['typeorm'].getRepository(Agents)
        const agentDetails = await repo.findOne({
          where: { agentId: agent.agentId },
        })
        const toEmail = agentDetails?.infoEmail || 'infoEmail'
        await sendEmail({
          fastify,
          agent,
          user,
          toEmail: toEmail,
          templateIdentifier: 'user_waiting_approval',
          payload,
        })
      },
      async sendPasswordResetRequest({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: PasswordResetRequestProps
        user: Users
      }) {
        await sendEmail({
          fastify,
          agent,
          user,
          templateIdentifier: 'password_reset_request',
          payload,
        })
      },
      async sendOtp({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: PasswordOtpProps
        user: Users
      }) {
        await sendEmail({
          fastify,
          agent,
          user,
          templateIdentifier: 'password_otp_email',
          payload,
        })
      },
      async sendInvite({
        agent,
        payload,
        user,
      }: {
        agent: Agents
        payload: InivitationProps
        user: Users
      }) {
        await sendEmail({
          fastify,
          agent,
          user,
          templateIdentifier: 'invite_member',
          payload,
        })
      },
      async sendCustomNotification({
        notificationType,
        agent,
        user,
        toEmail,
        payload,
      }: CustomNotificationProps) {
        switch (notificationType) {
          case TemplateType.EMAIL:
            await sendEmail({
              fastify,
              templateIdentifier: 'custom_template',
              agent,
              user,
              toEmail,
              payload,
            })
            break

          default:
            const error = new Error(
              `Unsupported notification type: ${notificationType}`,
            ) as any
            error.showToUser = true

            throw error
        }
      },
    })

    console.log('✅ Template Plugin loaded')
  } catch (e) {
    console.error('⚠️  Template Plugin not initialized:', e)
    throw new Error('Failed to register templatePlugin')
  }
}

export default fp(templatePlugin, {
  name: 'templatePlugin',
  dependencies: ['typeorm', 'agentPlugin', 'brevoPlugin'],
})
