import { FastifyInstance } from 'fastify'
import { getGlobalApp } from '../setup/globalSetup'
import { testUser } from '../utils/testData'
import { cleanRateLimt } from '../utils/cleanRateLimit'
import { AdminActionEnum } from '../../types/adminActionEnum'
import { EntityEnum } from '../../types/EntityEnum'
import { AdminActivityLog } from '../../entities/public/admin.activity.log.entity'
import { OTP_ATTEMPT_LIMIT } from '../../routes/v1/api/otp/routes'

describe('Password Reset Flow', () => {
  const email = testUser.email
  const agent = testUser.agent
  let otpCode: string
  let app: FastifyInstance
  let oneTimeToken: string
  beforeAll(async () => {
    try {
      app = await getGlobalApp({ enableRateLimit: true }) // Get the pre-initialized app with rate limit enabled

      // Mock hcaptchaService to always return true
      app.services.hcaptchaService.verifyHcaptcha = jest
        .fn()
        .mockResolvedValue(true)

      app.templates.sendOtp = jest
        .fn()
        .mockImplementation(async ({ agent, payload, user }) => {
          // console.log('Send OTP email:', agent?.agentId, user?.email, payload);
          otpCode = payload?.otpCode
        })

      app.templates.sendPasswordResetRequest = jest
        .fn()
        .mockImplementation(async ({ agent, payload, user }) => {
          // console.log('Send Password Reset email:', agent?.agentCode, user?.email, payload);
          const match = payload?.resetLink?.match(/[?&]token=([^&]+)/)
          const token = match ? match[1] : null
          oneTimeToken = token
        })
    } catch (error) {
      // console.error('Error in beforeAll setup:', error);
    }
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    try {
      await cleanRateLimt(app)
      // Clean throttle
      await app.redisUtils.removeValue(`sendResetLink_${email}`)
      await app.redisUtils.removeValue(`otpAttempts:${oneTimeToken}`)

      oneTimeToken = undefined
      otpCode = undefined
    } catch (error) {
      // console.error('Error in beforeEach cleanup:', error);
    }
  })
  it('should send a password reset link', async () => {
    // Mock activity log to verify logging
    const mockLogActivity = jest.spyOn(
      app.services.adminActivityLogService,
      'logActivity',
    )

    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/auth/send-link',
      body: { email, recaptchaToken: 'test-token' },
    })

    expect(res.statusCode).toBe(200)
    expect(oneTimeToken).toBeDefined()

    // Verify throttle was set in Redis
    const throttleKey = `sendResetLink_${email}`
    const throttleExists = await app.redis[app.config.REDIS_NAMESPACE].exists(throttleKey)
    expect(throttleExists).toBe(1)

    // Verify activity was logged
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AdminActionEnum.USER_PASSWORD_LINK,
        entityType: EntityEnum.USERS,
        details: expect.objectContaining({
          email: email,
        }),
      }),
    )
  })

  // it('should fail to send reset link if throttled', async () => {
  //   const res = await app.inject({
  //     method: 'POST',
  //     headers: { 'platform-agent': agent },
  //     url: '/v1/api/auth/send-link',
  //     body: { email, recaptchaToken: 'test-token' },
  //   })
  //   expect(res.statusCode).toBe(200)
  //   const throttled = await app.redis[app.config.REDIS_NAMESPACE].exists(
  //     `sendResetLink_${email}`,
  //   )
  //   expect(throttled).toBe(1)
  // })

  it('should send an OTP code after receiving a valid reset token', async () => {

    const mockLogActivity = jest.spyOn(
      app.services.adminActivityLogService,
      'logActivity',
    )


    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/auth/send-link',
      body: { email, recaptchaToken: 'test-token' },
    })

    expect(oneTimeToken).toBeDefined()



    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/otp/send',
      body: { token: oneTimeToken, recaptchaToken: 'test-token' },
    })


    expect(res.statusCode).toBe(200)

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AdminActionEnum.USER_OTP,
        entityType: EntityEnum.USERS,
        details: expect.objectContaining({
          email: email,
        }),
      }),
    )

    expect(res.statusCode).toBe(200)
    expect(otpCode).toBeDefined()
  })

  it('should not send  OTP code with for wrong reset token', async () => {
    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/otp/send',
      body: { token: 'wron reset token', recaptchaToken: 'test-token' },
    })
    expect(res.statusCode).toBe(400)
    expect(otpCode).toBeUndefined()
  })

  // it('should fail to send OTP if attempts exceeded ip throttle', async () => {
  //   await app.inject({
  //     method: 'POST',
  //     headers: { 'platform-agent': agent },
  //     url: '/v1/api/auth/send-link',
  //     body: { email, recaptchaToken: 'test-token' },
  //   })
  //   expect(oneTimeToken).toBeDefined()

  //   for (let i = 0; i < OTP_ATTEMPT_LIMIT; i++) {
  //     await app.inject({
  //       method: 'POST',
  //       headers: { 'platform-agent': agent },
  //       url: '/v1/api/otp/send',
  //       body: { token: oneTimeToken, recaptchaToken: 'test-token' },
  //     })
  //     expect(otpCode).toBeDefined()
  //   }
  //   otpCode = undefined
  //   await app.inject({
  //     method: 'POST',
  //     headers: { 'platform-agent': agent },
  //     url: '/v1/api/otp/send',
  //     body: { token: oneTimeToken, recaptchaToken: 'test-token' },
  //   })
  //   expect(otpCode).toBeUndefined()
  // })

  it('should reset password with valid OTP and token', async () => {
    const resLink = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/auth/send-link',
      body: { email, recaptchaToken: 'test-token' },
    })

    expect(oneTimeToken).toBeDefined()

    const resOtp = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/otp/send',
      body: { token: oneTimeToken, recaptchaToken: 'test-token' },
    })
    expect(resOtp.statusCode).toBe(200)
    expect(otpCode).toBeDefined()

    // Mock Keycloak resetPasswordById to verify it's called
    const mockResetPassword = jest.fn().mockResolvedValue(true)

    const requestAgent = app.agentList.find(a => a.agentCode === agent)
    requestAgent.keycloakAdminService.resetPasswordById = mockResetPassword

    const newPassword = 'NewSecurePassword123!'

    const resetPassword = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/auth/reset-password',
      body: { token: oneTimeToken, otpCode, newPassword: newPassword },
    })

    // Assertions
    expect(resetPassword.statusCode).toBe(200)

    // Verify Keycloak was called with correct parameters
    expect(mockResetPassword).toHaveBeenCalledTimes(1)
    expect(mockResetPassword).toHaveBeenCalledWith(
      expect.any(String), // externalUserId
      newPassword,
    )

    // Verify OTP and token are consumed (no longer in Redis)
    const redisClient = app.redis[app.config.REDIS_NAMESPACE]
    const otpExists = await redisClient.get(`otp:${otpCode}-${email}`)
    expect(otpExists).toBeNull()

    const tokenExists = await redisClient.get(`oneTimeToken:${oneTimeToken}`)
    expect(tokenExists).toBeNull()

    //cant second time with same token/otp
    const resetPasswordSecond = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/auth/reset-password',
      body: { email, token: oneTimeToken, otpCode, newPassword: newPassword },
    })
    expect(resetPasswordSecond.statusCode).toBe(400)

    const adminLogRepo = app.orm['typeorm'].getRepository(AdminActivityLog)

    const logEntries = [
      {
        action: AdminActionEnum.USER_OTP,
        requestId: resOtp.headers['x-request-id'],
      },
      {
        action: AdminActionEnum.USER_PASSWORD_RESET,
        requestId: resetPassword.headers['x-request-id'],
      },
      {
        action: AdminActionEnum.USER_PASSWORD_LINK,
        requestId: resLink.headers['x-request-id'],
      },
    ]

    // console.log(logEntries);

    for (const logEntry of logEntries) {
      const adminLog = (await adminLogRepo.findOne({
        where: {
          requestId: logEntry.requestId,
        },
      })) as AdminActivityLog

      expect(adminLog).toBeDefined()
      expect(adminLog.action).toEqual(logEntry.action)
      expect(adminLog.entityType).toEqual(EntityEnum.USERS)
      expect(adminLog.details.email).toEqual(email)
    }

    // Verify that second attempt didn't create a log entry (since it failed)
    const failedResetLog = await adminLogRepo.findOne({
      where: {
        requestId: resetPasswordSecond.headers['x-request-id'],
      },
    })
    expect(failedResetLog).toBeNull() // or toBeUndefined() depending on your expectations
  })

  it('should fail to reset password with invalid OTP', async () => {
    const resetPassword = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/auth/reset-password',
      body: { email, token: '111', otpCode: '123', newPassword: 'wdt' },
    })
    expect(resetPassword.statusCode).toBe(400)
  })

  it('should fail to reset password with invalid token', async () => {
    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/auth/send-link',
      body: { email, recaptchaToken: 'test-token' },
    })

    expect(oneTimeToken).toBeDefined()

    const resOtp = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/otp/send',
      body: { token: oneTimeToken, recaptchaToken: 'test-token' },
    })
    expect(resOtp.statusCode).toBe(200)
    expect(otpCode).toBeDefined()

    const resetPassword = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agent },
      url: '/v1/api/auth/reset-password',
      body: { email, token: '111', otpCode, newPassword: 'wdt' },
    })
    expect(resetPassword.statusCode).toBe(400)
  })
})
