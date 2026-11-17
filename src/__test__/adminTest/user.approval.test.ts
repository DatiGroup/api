import { FastifyInstance } from "fastify";
import { getGlobalApp } from "../setup/globalSetup";
import { loginAdminPayload, testAdminUser, testUser } from "../utils/testData";
import { LoginReponseType } from "../../routes/v1/api/auth/schema";
import { CrudReponseType } from "../../sharedShema/response";
import { Users } from "../../entities/public/users.entity";
import { Approval } from "../../entities/public/approval.entity";
import { UserProfile } from "../../entities/public/users.profile.entity";
import { EntityManager } from "typeorm";
import { Agents } from "../../entities/public/agents.entity";
import { RoleGroupEnum } from "../../types/role";
import { ApprovalPayloadType } from "../../routes/v1/api/admin/user/userSchema";
import { ApprovalRequest } from "../../entities/public/approval.request.entity";
import { ApprovalRequestStatusEnum } from "../../types/ApprovalRequestStatusEnum";
import { AdminActivityLog } from "../../entities/public/admin.activity.log.entity";
import { EntityEnum } from "../../types/EntityEnum";
import { AdminActionEnum } from "../../types/adminActionEnum";
import { UserOrganization } from "../../entities/public/user.organizations.entity";
import { UserRelationship } from "../../entities/public/user.relationships.entity";

describe('User Approval/Rejection Tests', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let testApprovalRequestId: number;
  let testUserId: number;
  let testKeycloakUserId: string;
  let createdUsernames: string[] = [];
  let agent: Agents;
  let organizationId: number;

  beforeAll(async () => {
    app = await getGlobalApp();
    const res = (await app.inject(loginAdminPayload)).json() as LoginReponseType;
    accessToken = res?.token?.access_token;
    agent = app.agentList.find(p => p.agentCode === testAdminUser.agent);
  });
  afterAll(async () => { await app.close(); })

  beforeEach(async () => {
    // Create test user and approval request for each test
    const uniqueUsername = `tst_apprl_${Date.now().toString().slice(-8)}`;
    createdUsernames.push(uniqueUsername);

    // Create actual Keycloak user first
    const keycloakAdmin = app.agentList.find(p => p.agentCode === testUser.agent)?.keycloakAdminService;

    if (keycloakAdmin) {
      try {
        // Create user in Keycloak
        const userPayload = {
          username: uniqueUsername,
          email: `${uniqueUsername}@test.com`,
          firstName: 'Test',
          lastName: 'User',
          enabled: false, // Start disabled for approval testing
          emailVerified: true
        };

        await keycloakAdmin.createUser(userPayload);

        // Get the created user to extract Keycloak user ID
        const keycloakUser = await keycloakAdmin.findUser(uniqueUsername);
        testKeycloakUserId = keycloakUser?.id || `fallback_${uniqueUsername}`;

        // console.log(`✅ Created Keycloak test user: ${uniqueUsername} (${testKeycloakUserId})`);
      } catch (error) {
        // console.error(`❌ Failed to create Keycloak user ${uniqueUsername}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`Test setup failed: Could not create Keycloak user - ${errorMessage}`);
      }
    } else {
      throw new Error('Test setup failed: Keycloak admin service not available');
    }

    await app.orm["typeorm"].manager.transaction(async (manager: EntityManager) => {
      // Create test user
      const userRepo = manager.getRepository(Users);
      const profileRepo = manager.getRepository(UserProfile);
      const userOrgRepo = manager.getRepository(UserOrganization);
      const userRelRepo = manager.getRepository(UserRelationship);
      const approvalRepo = manager.getRepository(ApprovalRequest);
      const agentRepo = manager.getRepository(Agents);

      const agent = await agentRepo.findOne({ where: { agentCode: testUser.agent } });

      const newUser = userRepo.create({
        agentId: agent.agentId,
        userName: uniqueUsername,
        email: `${uniqueUsername}@test.com`,
        externalUserId: testKeycloakUserId,
        externalSource: 'keycloak',
        startDateActive: new Date(),
        createdBy: -1,
        updatedBy: -1
      });

      const savedUser = await userRepo.save(newUser);
      testUserId = savedUser.userId;

      // Create user profile
      const newUserProfile = profileRepo.create({
        firstName: 'Test',
        lastName: 'User',
        preferredLang: 'en',
        createdBy: -1,
        updatedBy: -1,
        userId: savedUser.userId
      });

      await profileRepo.save(newUserProfile);

      // Create user org
      const userOrg = userOrgRepo.create({
        name: `${uniqueUsername} SIA`,
        startDateActive: new Date(),
        createdBy: -1,
        updatedBy: -1,
        rootUserId: savedUser.userId
      });

      await userOrgRepo.save(userOrg);

      organizationId = userOrg.userOrganizationId;

      // Create user org rel
      const userRel = userRelRepo.create({
        userId: savedUser.userId,
        userOrganizationId: userOrg.userOrganizationId,
        startDateActive: new Date(),
        createdBy: -1,
        updatedBy: -1,
      });

      await userRelRepo.save(userRel);

      // Create approval request
      const approvalRequest = approvalRepo.create({
        entityType: 'user',
        entityId: savedUser.userId,
        status: ApprovalRequestStatusEnum.PENDING,
        assignedToUserId: null, // Group-based assignment
        assignedToKcGroup: RoleGroupEnum.admin,
        minRequiredApprovals: 1,
        currentApprovalsCount: 0,
        createdBy: -1,
        updatedBy: -1
      });

      const savedRequest = await approvalRepo.save(approvalRequest);
      testApprovalRequestId = savedRequest.approvalRequestId;
    });
  });

  afterEach(async () => {
    // Cleanup: Remove test data
    try {
      await app.orm["typeorm"].manager.transaction(async (manager: EntityManager) => {
        const approvalRepo = manager.getRepository(Approval);
        const approvalRequestRepo = manager.getRepository(ApprovalRequest);
        const profileRepo = manager.getRepository(UserProfile);
        const userRepo = manager.getRepository(Users);
        const adminLogRepo = manager.getRepository(AdminActivityLog);

        const userOrgRepo = manager.getRepository(UserOrganization);
        const userRelRepo = manager.getRepository(UserRelationship);

        // Delete in proper order (child to parent)
        if (testApprovalRequestId) {
          await approvalRepo.delete({ approvalRequestId: testApprovalRequestId });
          await approvalRequestRepo.delete({ approvalRequestId: testApprovalRequestId });
          await adminLogRepo.delete({ entityType: EntityEnum.USERS, entityId: testUserId, agentId: agent.agentId });
        }


        if (organizationId) {
          await userRelRepo.delete({ userOrganizationId: organizationId });
          await userOrgRepo.delete({ userOrganizationId: organizationId });

        }
        if (testUserId) {
          await userRelRepo.delete({ userId: testUserId });
          await profileRepo.delete({ userId: testUserId });
          await userRepo.delete({ userId: testUserId });

        }

      });

      // Cleanup Keycloak users
      const keycloakAdmin = app.agentList.find(p => p.agentCode === testAdminUser.agent)?.keycloakAdminService;
      if (keycloakAdmin && createdUsernames.length > 0) {
        for (const username of createdUsernames) {
          try {
            await keycloakAdmin.deleteUserByUserName(username);
          } catch {
            // console.warn('Failed to delete Keycloak user:', username);
          }
        }
      }
    } catch (error) {
      // console.warn('Test cleanup failed:', error);
    }

    // Reset for next test
    createdUsernames = [];
    testApprovalRequestId = 0;
    testUserId = 0;
    testKeycloakUserId = '';
  });

  describe('POST Approve user', () => {
    test('Should successfully approve user with valid request', async () => {
      const payload: ApprovalPayloadType = {
        requestId: testApprovalRequestId,
        comment: 'User approved for testing',
        orgId: organizationId
      };

      // console.log('Approval Payload:', payload);

      const res = await app.inject({
        method: 'POST',
        url: '/v1/api/admin/user/approve',
        headers: {
          'platform-agent': testAdminUser.agent,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      // console.log('Full response payload:', res.payload?.toString());
      expect(res.statusCode).toBe(200);
      const body = res.json() as CrudReponseType;
      expect(body.message).toBe('success');

      // Verify approval request status changed
      const approvalRepo = app.orm["typeorm"].getRepository(ApprovalRequest);
      const updatedRequest = await approvalRepo.findOne({
        where: { approvalRequestId: testApprovalRequestId }
      });
      expect(updatedRequest?.status).toBe(ApprovalRequestStatusEnum.APPROVED);
      expect(updatedRequest?.currentApprovalsCount).toBe(1);

      // Verify approval record was created
      const approvalRecordRepo = app.orm["typeorm"].getRepository(Approval);
      const approvalRecord = await approvalRecordRepo.findOne({
        where: { approvalRequestId: testApprovalRequestId }
      });
      expect(approvalRecord).toBeTruthy();
      expect(approvalRecord?.comments).toBe('User approved for testing');

      //verify admin aciton is loogged
      const adminLogRepo = app.orm["typeorm"].getRepository(AdminActivityLog);
      const adminLog = await adminLogRepo.find({
        where: { entityType: EntityEnum.USERS, entityId: testUserId, agentId: agent.agentId }
      });
      expect(adminLog.length).toBe(1);
      expect(adminLog[0]?.action).toBe(AdminActionEnum.ENABLE);

    });

    test('Should return 400 for invalid requestId', async () => {
      const payload: ApprovalPayloadType = {
        requestId: 99999, // Non-existent request
        comment: 'This should fail',
        orgId: organizationId
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/api/admin/user/approve',
        headers: {
          'platform-agent': testAdminUser.agent,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      expect(res.statusCode).toBe(400);
    });

    test('Should return 400 for already approved request', async () => {
      // First approval
      const payload: ApprovalPayloadType = {
        requestId: testApprovalRequestId,
        comment: 'First approval',
        orgId: organizationId
      };

      await app.inject({
        method: 'POST',
        url: '/v1/api/admin/user/approve',
        headers: {
          'platform-agent': testAdminUser.agent,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      // Second approval attempt
      const secondPayload: ApprovalPayloadType = {
        requestId: testApprovalRequestId,
        comment: 'Second approval attempt',
        orgId: organizationId
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/api/admin/user/approve',
        headers: {
          'platform-agent': testAdminUser.agent,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: secondPayload
      });

      expect(res.statusCode).toBe(400);
    });

    test('Should handle approval with optional comment', async () => {
      const payload: ApprovalPayloadType = {
        requestId: testApprovalRequestId,
        orgId: organizationId
        // No comment
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/api/admin/user/approve',
        headers: {
          'platform-agent': testAdminUser.agent,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as CrudReponseType;
      expect(body.message).toBe('success');
    });
  });

  describe('POST Reject', () => {
    test('Should successfully reject user with valid request', async () => {
      const payload: ApprovalPayloadType = {
        requestId: testApprovalRequestId,
        comment: 'User rejected for testing',
        orgId: organizationId
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/api/admin/user/reject',
        headers: {
          'platform-agent': testAdminUser.agent,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as CrudReponseType;
      expect(body.message).toBe('success');

      // Verify approval request status changed
      const approvalRepo = app.orm["typeorm"].getRepository(ApprovalRequest);
      const updatedRequest = await approvalRepo.findOne({
        where: { approvalRequestId: testApprovalRequestId }
      });
      expect(updatedRequest?.status).toBe(ApprovalRequestStatusEnum.REJECTED);

      // Verify rejection record was created
      const approvalRecordRepo = app.orm["typeorm"].getRepository(Approval);
      const approvalRecord = await approvalRecordRepo.findOne({
        where: { approvalRequestId: testApprovalRequestId }
      });
      expect(approvalRecord).toBeTruthy();
      expect(approvalRecord?.comments).toBe('User rejected for testing');
    });


    test('Should return 400 for invalid requestId', async () => {
      const payload: ApprovalPayloadType = {
        requestId: 99999, // Non-existent request
        comment: 'This should fail',
        orgId: organizationId
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/api/admin/user/reject',
        headers: {
          'platform-agent': testAdminUser.agent,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      expect(res.statusCode).toBe(400);
    });

    test('Should return 400 for already rejected request', async () => {
      // First rejection
      const payload: ApprovalPayloadType = {
        requestId: testApprovalRequestId,
        comment: 'First rejection'
      };

      await app.inject({
        method: 'POST',
        url: '/v1/api/admin/user/reject',
        headers: {
          'platform-agent': testAdminUser.agent,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      // Second rejection attempt
      const secondPayload: ApprovalPayloadType = {
        requestId: testApprovalRequestId,
        comment: 'Second rejection attempt'
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/api/admin/user/reject',
        headers: {
          'platform-agent': testAdminUser.agent,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: secondPayload
      });

      expect(res.statusCode).toBe(400);
    });

    test('Should handle rejection with optional comment', async () => {
      const payload: ApprovalPayloadType = {
        requestId: testApprovalRequestId,
        orgId: organizationId
        // No comment
      };

      const res = await app.inject({
        method: 'POST',
        url: '/v1/api/admin/user/reject',
        headers: {
          'platform-agent': testAdminUser.agent,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: payload
      });

      expect(res.statusCode).toBe(200);
      const body = res.json() as CrudReponseType;
      expect(body.message).toBe('success');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('Should handle optimistic locking conflicts gracefully', async () => {
      const payload: ApprovalPayloadType = {
        requestId: testApprovalRequestId,
        comment: 'Concurrent test',
        orgId: organizationId
      };

      // Simulate concurrent requests
      const promises = Array(3).fill(0).map(() =>
        app.inject({
          method: 'POST',
          url: '/v1/api/admin/user/approve',
          headers: {
            'platform-agent': testAdminUser.agent,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: payload
        })
      );

      const results = await Promise.allSettled(promises);

      // At least one should succeed
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.statusCode === 200);
      expect(successful.length).toBeGreaterThan(0);
    });


  });
});