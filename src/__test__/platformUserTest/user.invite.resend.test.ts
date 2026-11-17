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

describe('User invite resend', () => {
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
      console.error('Error in beforeAll setup:', error);
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

  it('should successfully resend existing valid invitation', async () => {
    const mockLogActivity = jest.spyOn(app.services.adminActivityLogService, 'logActivity');
    const mockSendInvite = jest.spyOn(app.templates, 'sendInvite');

    // Step 1: Create initial invitation
    const email = getUniqueEmail();
    const uniqueUsername = getUniqueUsername();

    const iniveRes = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUsername,
        email: email,
        firstName: 'ResendFirst',
        lastName: 'ResendLast',
      },
    });
    expect(iniveRes.statusCode).toBe(200);

    createdUsernames.push(uniqueUsername);
    expect(invitationCode).toBeDefined();
    const originalInvitationCode = invitationCode;

    // Get invitation ID
    const invitationRepo = app.orm['typeorm'].getRepository(UserInvitation);
    const invitation = await invitationRepo.findOne({
      where: { invitationCode: originalInvitationCode }
    });
    expect(invitation).toBeDefined();

    mockSendInvite.mockClear();
    mockLogActivity.mockClear();

    // Step 2: Resend invitation
    const resendRes = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: `/v1/api/invite/resend/${invitation.invitationId}`,
      body: {
        email: email,
      },
    });

    expect(resendRes.statusCode).toBe(200);

    // Verify same invitation code is reused
    expect(invitationCode).toBe(originalInvitationCode);

    // Verify email was sent
    expect(mockSendInvite).toHaveBeenCalledTimes(1);

    // Verify activity was logged
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AdminActionEnum.USER_INVITE_SENT,
        entityType: EntityEnum.USERS,
        details: expect.objectContaining({
          email: email,
          invitationId: invitation.invitationId,
        }),
      }),
    );
  });

  it('should create new invitation when resending expired invitation', async () => {
    // Step 1: Create invitation
    const email = getUniqueEmail();
    const uniqueUsername = getUniqueUsername();

    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUsername,
        email: email,
        firstName: 'ExpiredTest',
        lastName: 'User',
      },
    });

    createdUsernames.push(uniqueUsername);
    const originalInvitationCode = invitationCode;

    // Step 2: Manually expire the invitation
    const invitationRepo = app.orm['typeorm'].getRepository(UserInvitation);
    const invitation = await invitationRepo.findOne({
      where: { invitationCode: originalInvitationCode }
    });

    invitation.expiredDate = new Date(Date.now() - 1000); // Expired 1 second ago
    await invitationRepo.save(invitation);

    // Step 3: Resend invitation (should create new one)
    const resendRes = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: `/v1/api/invite/resend/${invitation.invitationId}`,
      body: {
        email: email,
      },
    });

    expect(resendRes.statusCode).toBe(200);

    // Verify new invitation code was created
    expect(invitationCode).toBeDefined();
    expect(invitationCode).not.toBe(originalInvitationCode);
  });

  it('should fail to resend invitation with non-existent ID', async () => {
    const email = getUniqueEmail();
    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite/resend/999999',
      body: {
        email: email,
      },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.message).toContain('Invitation not found');
  });

  it('should fail to resend invitation with email mismatch', async () => {
    // Step 1: Create invitation
    const email = getUniqueEmail();
    const uniqueUsername = getUniqueUsername();

    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUsername,
        email: email,
        firstName: 'MismatchTest',
        lastName: 'User',
      },
    });

    createdUsernames.push(uniqueUsername);

    const invitationRepo = app.orm['typeorm'].getRepository(UserInvitation);
    const invitation = await invitationRepo.findOne({
      where: { invitationCode: invitationCode }
    });

    // Step 2: Try to resend with different email
    const differentEmail = `different-${Date.now()}@dati.com`;
    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: `/v1/api/invite/resend/${invitation.invitationId}`,
      body: {
        email: differentEmail,
      },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.message).toContain('Invitation not found');
  });

  it('should fail to resend used invitation', async () => {
    // Step 1: Create and accept invitation
    const email = getUniqueEmail();
    const uniqueUsername = getUniqueUsername();

    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUsername,
        email: email,
        firstName: 'UsedTest',
        lastName: 'User',
      },
    });

    createdUsernames.push(uniqueUsername);
    const originalInvitationCode = invitationCode;

    await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/otp/send-invite-otp',
      body: { invitationCode: originalInvitationCode, recaptchaToken: 'test-token' },
    });


    const accept1 = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/invite/accept',
      body: {
        invitationCode: originalInvitationCode,
        otpCode: otpCode,
      },
    });
    expect(accept1.statusCode).toBe(200);

    // Get invitation ID
    const invitationRepo = app.orm['typeorm'].getRepository(UserInvitation);
    const invitation = await invitationRepo.findOne({
      where: { invitationCode: originalInvitationCode }
    });

    // Step 2: Try to resend used invitation
    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: `/v1/api/invite/resend/${invitation.invitationId}`,
      body: {
        email: email,
      },
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.message).toContain('Invitation not found');
  });

})
