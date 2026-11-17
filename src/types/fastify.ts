import 'fastify'
import Keycloak from 'keycloak-connect'
import { RequestUserType } from './requestUserType'
import { HttpError } from '@fastify/sensible/lib/httpError'
import { FastifyRedis } from '@fastify/redis'
import {
  CustomNotificationProps,
  EmailUserApprovalProps,
  InivitationProps,
  PasswordOtpProps,
  PasswordResetRequestProps,
  ProcessTemplateResponse,
  ProcessTemplateType,
} from '../plugins/templatePlugin/_types'
import { Agents } from '../entities/public/agents.entity'
import { Users } from '../entities/public/users.entity'

declare module 'fastify' {
  interface FastifyInstance {
    protect: (
      roles?: string | string[],
    ) => (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void | HttpError>
    redis: FastifyRedis
    redisUtils: {
      getObject: (key: any) => Promise<any>
      putObject: (key: any, object: any, expire_sec: number) => void
      setUser: (
        externalUserId: string,
        user: RequestUserType,
        expire_sec: number,
      ) => void
      getUser: (externalUserId: string) => Promise<RequestUserType | undefined>
      setActiveOrg: (externalUserId: string, orgId: number) => void
      getActiveOrg: (externalUserId: string) => Promise<number | undefined>
      removeUser: (externalUserId: string) => void
      getUserTTL(externalUserId: string): Promise<number | null>
      setValue: (key: string, seconds: number, value: string | number) => void
      getValue: (key: string) => Promise<string | number | null>
      removeValue: (key: string) => void
      enforceThrottle: (
        request: FastifyRequest,
        key: string,
        expireSeconds?: number,
      ) => Promise<void>
      enforceRateLimit: (
        request: FastifyRequest,
        key: string,
        max: number,
        windowSeconds: number,
      ) => Promise<void>
    }
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

declare module 'fastify' {
  interface FastifyRequest {
    user?: RequestUserType
    activeOrgId?: number
    kauth?: {
      grant?: Keycloak.Grant
    }
  }
}
