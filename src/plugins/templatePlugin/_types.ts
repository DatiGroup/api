import { TemplateType } from '../../entities/public/templates.entity'
import { Users } from '../../entities/public/users.entity'
import { PostNotificationType } from '../../routes/v1/api/external/notifications/schema'
import { RequestAgent } from '../agents'

export interface CreateTemplateType {
  identifier: string
  subject: string
  fileName: string
  lang?: string
  type: TemplateType
  replace?: boolean
}

export interface ProcessTemplateType {
  templateIdentifier: string
  subject?: string
  lang: string
  type: TemplateType
  payload: any
}

export interface ProcessTemplateResponse {
  subject: string
  body: string
}

export interface EmailUserApprovalProps {
  name: string
  email: string
  username: string
  language: string
  createdAt: string
  loginUrl: string
}

export interface PasswordResetRequestProps {
  name: string
  resetLink: string
}

export interface PasswordOtpProps {
  name: string
  otpCode: string
}

export interface InivitationProps {
  name: string
  orgName: string
  resetLink: string
}

export interface CustomNotificationProps {
  notificationType: TemplateType
  agent: RequestAgent
  user: Users
  toEmail: string
  payload: {
    subjectPayload: string
    cssPayload: string
    htmlPayload: string
  }
}
