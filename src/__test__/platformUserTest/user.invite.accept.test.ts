import { FastifyInstance } from 'fastify'
import { getGlobalApp } from '../setup/globalSetup'
import { loginAdminPayload, testUser } from '../utils/testData'
import { cleanRateLimt } from '../utils/cleanRateLimit'
import { AdminActionEnum } from '../../types/adminActionEnum'
import { EntityEnum } from '../../types/EntityEnum'
import { LoginReponseType } from '../../routes/v1/api/auth/schema'
import { cleanupUsers } from '../utils/cleanupUsers'
import { RequestAgent } from '../../plugins/agents'
import { UserInvitation } from '../../entities/public/user.iniviation.entity'
import { getUniqueEmail, getUniqueUsername } from '../utils/stringTestUtils'
import { get } from 'lodash'

describe('User invite accept', () => {
  let agent: RequestAgent;
  const agentCode = testUser.agent;
  const createdUsernames: string[] = [];
  let accessToken: string;
  let otpCode: string
  let app: FastifyInstance
  let invitationCode: string

  beforeAll(async () => {
    try {
      app = await getGlobalApp() // Get the pre-initialized app
      const res = (await app.inject(loginAdminPayload)).json() as LoginReponseType;
      accessToken = res?.token?.access_token;

      agent = app.agentList.find(p => p.agentCode === agentCode);

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

      app.templates.sendInvite = jest
        .fn()
        .mockImplementation(async ({ agent, payload, user }) => {
          const match = payload?.resetLink?.match(/\/auth\/user-invite\/([^?#]+)/)
          invitationCode = match ? match[1] : null
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
      invitationCode = undefined
      otpCode = undefined
      await cleanRateLimt(app)
    } catch (error) {
      console.error('Error in beforeEach cleanup:', error);
    }
  })
  afterEach(async () => {
    await cleanupUsers(app, testUser.agent, createdUsernames);

  });


  it('should successfully accept invitation with valid OTP and code', async () => {
    const mockLogActivity = jest.spyOn(app.services.adminActivityLogService, 'logActivity');

    // Step 1: Create invitation
    const email = getUniqueEmail();
    const uniqueUsername = getUniqueUsername();

    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUsername,
        email: email,
        firstName: 'AcceptFirst',
        lastName: 'AcceptLast',
      },
    });

    expect(res.statusCode).toBe(200);

    createdUsernames.push(uniqueUsername);
    expect(invitationCode).toBeDefined();

    // Step 2: Send OTP for invitation
    const otpRes = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/otp/send-invite-otp',
      body: { invitationCode: invitationCode, recaptchaToken: 'test-token' },
    });

    expect(otpRes.statusCode).toBe(200);
    expect(otpCode).toBeDefined();

    // Step 3: Accept invitation with valid OTP
    const acceptRes = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/invite/accept',
      body: {
        invitationCode: invitationCode,
        otpCode: otpCode,
      },
    });

    expect(acceptRes.statusCode).toBe(200);

    // Verify activity log
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AdminActionEnum.USER_INVITE_ACCEPTED,
        entityType: EntityEnum.USERS,
      }),
    );

    // Verify invitation is marked as used
    const userInvitationRepo = app.orm['typeorm'].getRepository(UserInvitation);
    const invitation = await userInvitationRepo.findOne({
      where: { invitationCode: invitationCode }
    });
    expect(invitation.used).toBe(true);

    // Verify user in Keycloak is activated
    const keycloakUser = await agent.keycloakAdminService.findUser(uniqueUsername);
    expect(keycloakUser).toBeDefined();
    expect(keycloakUser.enabled).toBe(true);

  });

  it('should reject invitation with invalid invitation code', async () => {
    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/invite/accept',
      body: {
        invitationCode: 'invalid-code-12345',
        otpCode: '123456',
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.message).toContain('Invalid or expired invitation code');
  });

  it('should reject invitation with missing or invalid OTP code', async () => {
    // Create invitation first
    const email = getUniqueEmail();
    const uniqueUsername = getUniqueUsername();

    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUsername,
        email: email,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    createdUsernames.push(uniqueUsername);
    expect(invitationCode).toBeDefined();

    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/invite/accept',
      body: {
        invitationCode: invitationCode,
        otpCode: '',
      },
    });

    expect(res.statusCode).toBe(400);

    // Debug: Check what rate limit keys exist
    const redisClient = app.redis[app.config.REDIS_NAMESPACE];
    const existingKeys = await redisClient.keys('invite:accept:ip:*');
    console.log('Existing rate limit keys before second request:', existingKeys);

    // Try to accept with wrong OTP
    const res2 = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/invite/accept',
      body: {
        invitationCode: invitationCode,
        otpCode: '000000', // Wrong OTP
      },
    });

    expect(res2.statusCode).toBe(400);
    const body = res2.json();
    expect(body.message).toContain('Invalid or expired OTP code');

  });



  it('should not accept already used invitation', async () => {
    // Create and accept invitation
    const email = getUniqueEmail();
    const uniqueUsername = getUniqueUsername();

    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUsername,
        email: email,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    createdUsernames.push(uniqueUsername);
    const firstInvitationCode = invitationCode;

    // Send OTP and accept
    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/otp/send-invite-otp',
      body: { invitationCode: firstInvitationCode, recaptchaToken: 'test-token' },
    });

    const firstOtpCode = otpCode;

    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/invite/accept',
      body: {
        invitationCode: firstInvitationCode,
        otpCode: firstOtpCode,
      },
    });

    // Clean rate limit for second attempt
    await cleanRateLimt(app);

    // Try to accept again with same code (should fail)
    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/otp/send-invite-otp',
      body: { invitationCode: firstInvitationCode, recaptchaToken: 'test-token' },
    });

    await cleanRateLimt(app);

    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/invite/accept',
      body: {
        invitationCode: firstInvitationCode,
        otpCode: otpCode,
      },
    });

    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.message).toContain('Invalid or expired invitation code');
  });

})
