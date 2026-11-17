'use strict'
import { FastifyInstance } from "fastify";
import { getGlobalApp } from "../setup/globalSetup";

import { CrudReponseType, RequestStatusEnum } from "../../sharedShema/response";
import { RegisterPayloadType } from "../../routes/v1/api/register/registerSchema";
import { testUser } from "../utils/testData";
import { ApprovalRequest } from "../../entities/public/approval.request.entity";
import { RoleEnum } from "../../types/role";
import { ApprovalRequestStatusEnum } from "../../types/ApprovalRequestStatusEnum";
import { cleanupUsers } from "../utils/cleanupUsers";
import { EntityEnum } from "../../types/EntityEnum";

describe('Register tests', () => {

    let app: FastifyInstance;
    const createdUsernames: string[] = [];

    beforeAll(async () => {
        app = await getGlobalApp(); // Get the pre-initialized app
        app.services.hcaptchaService.verifyHcaptcha = jest.fn().mockResolvedValue(true);
    });

    afterEach(async () => {
        await cleanupUsers(app, testUser.agent, createdUsernames);

    });

    afterAll(async () => { await app.close(); })


    test("Create User", async () => {
        // Generate unique but shorter username to fit DB constraints
        const timestamp = Date.now().toString().slice(-8); // Last 8 digits
        const uniqueUsername = `u${timestamp}@register.test.com`; // Format: u12345678@test.com (19 chars)

        // Add to cleanup list immediately
        createdUsernames.push(uniqueUsername);

        const res = await app.inject({
            method: 'POST',
            url: '/v1/api/register',
            headers: {
                'platform-agent': testUser.agent,
            },
            body: {
                userName: uniqueUsername,
                password: testUser.password,
                repeatPassword: testUser.password,
                email: uniqueUsername,
                firstName: testUser.firstName,
                lastName: testUser.lastName,
                preferredLang: testUser.preferredLang,
                organizationName: `${uniqueUsername}ORG`,
                registrationNumber: uniqueUsername,
                country: 'lv',
                contactName: 'Test',
                contactLastName: 'Last',
                contactEmail: uniqueUsername,
                recaptchaToken: 'test-token'
            } as RegisterPayloadType
        });

        const response = res.json<CrudReponseType>();
        expect(response).toBeDefined();
        expect(response.message).toEqual(RequestStatusEnum.SUCCESS.toString());

        const repoApproval = app.orm["typeorm"].getRepository(ApprovalRequest);
        const approvalRequest = await repoApproval.findOne({
            where: {
                entityType: EntityEnum.USERS,
                entityId: response.id
            }
        });
        expect(approvalRequest).toBeDefined();
        expect(approvalRequest.status).toEqual(ApprovalRequestStatusEnum.PENDING);
        expect(approvalRequest.assignedToKcGroup).toEqual(RoleEnum.portalAdminUserEdit);
    })

    test("Create User error", async () => {
        // Generate unique but shorter username to fit DB constraints
        const timestamp = Date.now().toString().slice(-8); // Last 8 digits
        const uniqueUsername = `u${timestamp}@test.com`; // Format: u12345678@test.com (19 chars)

        // Add to cleanup list immediately (in case partial creation occurs)
        createdUsernames.push(uniqueUsername);

        const res = await app.inject({
            method: 'POST',
            url: '/v1/api/register',
            headers: {
                'platform-agent': testUser.agent,
            },
            body: {
                userName: uniqueUsername,
                password: testUser.password,
                email: uniqueUsername,
                preferredLang: testUser.preferredLang,
                organizationName: `${uniqueUsername}ORG`,
                registrationNumber: uniqueUsername,
                country: 'lv',
                contactName: 'Test',
                contactLastName: 'Last',
                contactEmail: `${uniqueUsername}@dummy.test`,
                recaptchaToken: 'test-token'
            } as RegisterPayloadType
        });

        expect(res.statusCode).toEqual(400);
    })

});
