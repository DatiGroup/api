import { FastifyInstance } from 'fastify'
import { getGlobalApp } from '../setup/globalSetup'
import { loginAdminPayload, testUser } from '../utils/testData'
import { cleanRateLimt } from '../utils/cleanRateLimit'
import { AdminActionEnum } from '../../types/adminActionEnum'
import { EntityEnum } from '../../types/EntityEnum'
import { LoginReponseType } from '../../routes/v1/api/auth/schema'
import { cleanupUsers } from '../utils/cleanupUsers'
import { Users } from '../../entities/public/users.entity'
import { RequestAgent } from '../../plugins/agents'
import { createUsers } from '../utils/createUser'
import { getUniqueEmail, getUniqueUsername } from '../utils/stringTestUtils'

describe('User invite', () => {
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
      // Clean throttle
      // await app.redisUtils.removeValue(`otpAttempts:invite:${email}`)
    } catch (error) {
      console.error('Error in beforeEach cleanup:', error);
    }
  })
  afterEach(async () => {
    await cleanupUsers(app, testUser.agent, createdUsernames);

  });

  it('should send to new email invitation', async () => {
    // Mock activity log to verify logging
    const mockLogActivity = jest.spyOn(app.services.adminActivityLogService, 'logActivity');

    const email = getUniqueEmail();
    const uniqueUsername = getUniqueUsername();

    console.log('Testing invite with email:', email, 'and username:', uniqueUsername);

    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUsername,
        email: email,
        firstName: 'InviteFirst',
        lastName: 'InviteSecond',
      },
    });


    expect(res.statusCode).toBe(200);
    createdUsernames.push(uniqueUsername);


    // Verify activity was logged
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AdminActionEnum.USER_INVITE_SENT,
        entityType: EntityEnum.USERS,
        details: expect.objectContaining({
          email: email,
        }),
      }),
    );

    // Verify invitation code was generated
    expect(invitationCode).toBeDefined();
    expect(invitationCode).toMatch(/^[a-zA-Z0-9-_]{20,}$/); // Adjust regex based on your code format

    const userRepo = app.orm["typeorm"].getRepository(Users);

    const user = await userRepo.findOne({
      where: { email: email },
      relations: ['profile']
    });


    // Verify user was created with correct values
    expect(user).toBeDefined();
    expect(user?.email).toBe(email);
    expect(user?.userName).toBe(uniqueUsername);
    expect(user?.agentId).toBe(agent.agentId);
    expect(user?.externalUserId).toBeDefined();
    expect(user?.startDateActive).toBeDefined();

    // Verify profile was created
    expect(user?.profile).toBeDefined();
    expect(user?.profile?.firstName).toBe('InviteFirst');
    expect(user?.profile?.lastName).toBe('InviteSecond');
    expect(user?.profile?.preferredLang).toBe(app.config.DEFAULT_LANG);

    // Verify user in Keycloak is disabled
    const keycloakUser = await agent.keycloakAdminService.findUser(uniqueUsername);
    expect(keycloakUser).toBeDefined();
    expect(keycloakUser.enabled).toBe(false);

    // organization member relation
    const testUserRel = await app.services.userService.getActiveOrg({ userId: user.userId });
    expect(testUserRel).toBeDefined();
    const userRel = await app.services.userService.getActiveOrgRelation({ userId: user.userId, orgId: testUserRel[0].userOrganizationId });
    expect(userRel).toBeDefined();
    expect(userRel.userOrganizationId).toBe(testUserRel[0].userOrganizationId);

  })


  it('should send to invitation to existing user', async () => {
    // Mock activity log to verify logging
    const mockLogActivity = jest.spyOn(app.services.adminActivityLogService, 'logActivity');

    const _user = await createUsers(app, agentCode);
    const userRepo = app.orm["typeorm"].getRepository(Users);
    const user = await userRepo.findOne({ where: { userId: _user.userId } });
    createdUsernames.push(user.userName);

    // Spy on Keycloak createUser to verify it's NOT called for existing users
    const mockCreateUser = jest.spyOn(agent.keycloakAdminService, 'createUser');

    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: user.userName,
        email: user.email,
        firstName: 'InviteFirst',
        lastName: 'InviteSecond',
      },
    });


    expect(res.statusCode).toBe(200);

    // Verify Keycloak createUser was NOT called (user already exists)
    expect(mockCreateUser).not.toHaveBeenCalled();
    mockCreateUser.mockRestore();

    // Verify activity was logged
    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: AdminActionEnum.USER_INVITE_SENT,
        entityType: EntityEnum.USERS,
        details: expect.objectContaining({
          email: user.email,
        }),
      }),
    );

    // Verify invitation code was generated
    expect(invitationCode).toBeDefined();
    expect(invitationCode).toMatch(/^[a-zA-Z0-9-_]{20,}$/); // Adjust regex based on your code format



    // organization member relation
    const testUserRel = await app.services.userService.getActiveOrg({ userId: user.userId });
    expect(testUserRel).toBeDefined();
    const userRel = await app.services.userService.getActiveOrgRelation({ userId: user.userId, orgId: testUserRel[0].userOrganizationId });
    expect(userRel).toBeDefined();
    expect(userRel.userOrganizationId).toBe(testUserRel[0].userOrganizationId);

  })

  it('should reject duplicate invitation to same email and organization', async () => {
    const email = getUniqueEmail();
    const uniqueUserName = getUniqueUsername();

    // Send first invitation
    const res1 = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUserName,
        email: email,
        firstName: 'First',
        lastName: 'User',
      },
    });

    expect(res1.statusCode).toBe(200);
    createdUsernames.push(uniqueUserName);

    // Try to send duplicate invitation
    const res2 = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUserName,
        email: email,
        firstName: 'First',
        lastName: 'User',
      },
    });

    expect(res2.statusCode).toBe(400);
  });

  it('should reject malicious input to prevent XSS', async () => {
    const email = getUniqueEmail();
    const uniqueUserName = getUniqueUsername();

    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUserName,
        email: email,
        firstName: '<script>alert("xss")</script>',
        lastName: '">malicious',
      },
    });

    // Should reject the request due to invalid characters
    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({
      message: expect.stringContaining('Only letters, numbers, and spaces are allowed')
    });
  });


  it('should reject invitation without required fields', async () => {
    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        email: 'test@dati.com',
        // Missing userName, firstName, lastName
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should reject invitation with invalid email format', async () => {
    const uniqueUserName = `u${Date.now().toString().slice(-8)}@invite.test.com`;

    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUserName,
        email: 'invalid-email',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should handle Keycloak user creation failure gracefully', async () => {
    const email = getUniqueEmail();
    const uniqueUserName = getUniqueUsername();
    // Mock Keycloak to fail
    const originalCreateUser = agent.keycloakAdminService.createUser;
    agent.keycloakAdminService.createUser = jest.fn().mockRejectedValue(
      new Error('Keycloak connection failed')
    );

    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUserName,
        email: email,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(res.statusCode).toBe(500);
    // Restore original function
    agent.keycloakAdminService.createUser = originalCreateUser;

    const userRepo = app.orm["typeorm"].getRepository(Users);

    const user = await userRepo.findOne({
      where: { email: email },
      relations: ['profile']
    });

    // Verify user was NOT created when Keycloak failed
    expect(user).toBeNull();
  });

  it('should invite existing user to new organization', async () => {
    // First create a user
    const email = getUniqueEmail();
    const uniqueUserName = getUniqueUsername();

    const res1 = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUserName,
        email: email,
        firstName: 'Existing',
        lastName: 'User',
      },
    });

    expect(res1.statusCode).toBe(200);
    createdUsernames.push(uniqueUserName);

    // TODO: Invite same user to different organization
    // This would require setting up a second organization context
    // or mocking request.activeOrgId to a different value
  });

  it('should include correct organization name in invitation email', async () => {
    const email = getUniqueEmail();
    const uniqueUserName = getUniqueUsername();

    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUserName,
        email: email,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(res.statusCode).toBe(200);
    createdUsernames.push(uniqueUserName);

    // Verify organization name is included
    expect(app.templates.sendInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          orgName: expect.any(String),
        }),
      })
    );
  });

  it('should reject invitation when user lacks organization access', async () => {
    // Mock getActiveOrgRelation to return null
    const originalGetActiveOrgRelation = app.services.userService.getActiveOrgRelation;
    app.services.userService.getActiveOrgRelation = jest.fn().mockResolvedValue(null);

    const email = getUniqueEmail();
    const uniqueUserName = getUniqueUsername();
    const res = await app.inject({
      method: 'POST',
      headers: { 'platform-agent': agentCode, authorization: `Bearer ${accessToken}` },
      url: '/v1/api/invite',
      body: {
        userName: uniqueUserName,
        email: email,
        firstName: 'Test',
        lastName: 'User',
      },
    });

    expect(res.statusCode).toBe(400);

    // Restore original function
    app.services.userService.getActiveOrgRelation = originalGetActiveOrgRelation;
  });
})
