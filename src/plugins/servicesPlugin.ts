import { FastifyInstance, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { UserService } from '../services/userService'
import { SessionService } from '../services/sessionService'
import { UserDevicesService } from '../services/deviceService'
import { TwoFaService } from '../services/twoFaService'
import { ApprovalService } from '../services/approvalService'
import { AdminActivityLogService } from '../services/adminActivityLogService'
import { OtpService } from '../services/otpService'
import { HCaptchaService } from '../services/hcaptchaService'
import { InvitationService } from '../services/invitationService'

declare module 'fastify' {
  interface FastifyInstance {
    services: {
      userService: UserService
      sessionService: SessionService
      userDevicesService: UserDevicesService
      twoFaService: TwoFaService
      approvalService: ApprovalService
      adminActivityLogService: AdminActivityLogService
      otpService: OtpService
      hcaptchaService: HCaptchaService
      invitationService: InvitationService
    }
  }
}

const servicesPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  fastify.decorate('services', {
    userService: new UserService(fastify.orm['typeorm'], fastify),
    sessionService: new SessionService(fastify.orm['typeorm'], fastify),
    userDevicesService: new UserDevicesService(fastify.orm['typeorm'], fastify),
    twoFaService: new TwoFaService(fastify.orm['typeorm'], fastify),
    approvalService: new ApprovalService(fastify.orm['typeorm'], fastify),
    adminActivityLogService: new AdminActivityLogService(
      fastify.orm['typeorm'],
      fastify,
    ),
    otpService: new OtpService(fastify.orm['typeorm'], fastify),
    hcaptchaService: new HCaptchaService(fastify),
    invitationService: new InvitationService(fastify.orm['typeorm'], fastify),
  })

  console.log('✅ Services plugin loaded')
}

export default fp(servicesPlugin, {
  name: 'servicesPlugin',
  dependencies: ['typeorm', 'commonObjects', 'redis'],
})
