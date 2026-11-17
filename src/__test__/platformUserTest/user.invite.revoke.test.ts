import { FastifyInstance } from 'fastify'
import { getGlobalApp } from '../setup/globalSetup'
import { loginAdminPayload, testUser } from '../utils/testData'
import { cleanRateLimt } from '../utils/cleanRateLimit'
import { LoginReponseType } from '../../routes/v1/api/auth/schema'
import { cleanupUsers } from '../utils/cleanupUsers'
import { RequestAgent } from '../../plugins/agents'
import { UserInvitation } from '../../entities/public/user.iniviation.entity'
import { getUniqueEmail, getUniqueUsername } from '../utils/stringTestUtils'

describe('User invite revoke', () => {
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

  it('should successfully revoke a valid invitation', async () => {
    // Step 1: Create invitation
    const email = getUniqueEmail();
    const uniqueUsername = getUniqueUsername();

    const inviteRes = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUsername,
        email: email,
        firstName: 'RevokeTest',
        lastName: 'User',
      },
    });

    expect(inviteRes.statusCode).toBe(200);


    createdUsernames.push(uniqueUsername);
    expect(invitationCode).toBeDefined();

    // Get invitation ID
    const invitationRepo = app.orm['typeorm'].getRepository(UserInvitation);
    const invitation = await invitationRepo.findOne({
      where: { invitationCode: invitationCode }
    });
    expect(invitation).toBeDefined();
    expect(invitation.used).toBe(false);

    // Step 2: Revoke invitation
    const revokeRes = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: `/v1/api/invite/revoke/${invitation.invitationId}`,
    });

    expect(revokeRes.statusCode).toBe(200);

    // Step 3: Verify invitation is marked as expired/revoked
    const revokedInvitation = await invitationRepo.findOne({
      where: { invitationCode: invitationCode }
    });
    expect(revokedInvitation).toBeDefined();
    expect(revokedInvitation.expiredDate).toBeDefined();
    expect(revokedInvitation.expiredDate).toBeInstanceOf(Date);
  });

  it('should fail to revoke non-existent invitation', async () => {
    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite/revoke/999999',
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.message).toContain('Invitation not found');
  });

  it('should fail to revoke already used invitation', async () => {
    // Step 1: Create and accept invitation
    const email = getUniqueEmail();
    const uniqueUsername = getUniqueUsername();

    const inviteRes = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUsername,
        email: email,
        firstName: 'UsedTestRevokeFail',
        lastName: 'User',
      },
    });

    expect(inviteRes.statusCode).toBe(200);

    createdUsernames.push(uniqueUsername);
    const originalInvitationCode = invitationCode;

    // Accept the invitation
    const otpRes = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/otp/send-invite-otp',
      body: { invitationCode: originalInvitationCode, recaptchaToken: 'test-token' },
    });

    expect(otpRes.statusCode).toBe(200);

    const accpRes = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode },
      url: '/v1/api/invite/accept',
      body: {
        invitationCode: originalInvitationCode,
        otpCode: otpCode,
      },
    });

    expect(accpRes.statusCode).toBe(200);

    // Get invitation ID
    const invitationRepo = app.orm['typeorm'].getRepository(UserInvitation);
    const invitation = await invitationRepo.findOne({
      where: { invitationCode: originalInvitationCode }
    });

    // Step 2: Try to revoke used invitation
    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: `/v1/api/invite/revoke/${invitation.invitationId}`,
    });

    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body.message).toContain('Invitation not found');
  });

  it('should fail to revoke already revoked invitation', async () => {
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
        firstName: 'DoubleRevoke',
        lastName: 'User',
      },
    });

    createdUsernames.push(uniqueUsername);

    const invitationRepo = app.orm['typeorm'].getRepository(UserInvitation);
    const invitation = await invitationRepo.findOne({
      where: { invitationCode: invitationCode }
    });

    // Step 2: Revoke invitation first time
    const firstRevoke = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: `/v1/api/invite/revoke/${invitation.invitationId}`,
    });

    expect(firstRevoke.statusCode).toBe(200);

    // Step 3: Try to revoke again
    const secondRevoke = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: `/v1/api/invite/revoke/${invitation.invitationId}`,
    });

    expect(secondRevoke.statusCode).toBe(400);
    const body = secondRevoke.json();
    expect(body.message).toContain('Invitation is already expired');
  });
})
