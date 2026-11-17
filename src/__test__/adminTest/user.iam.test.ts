'use strict'
import { FastifyInstance, InjectOptions } from "fastify";
import { getGlobalApp } from "../setup/globalSetup";

import { CrudReponseType, RequestStatusEnum } from "../../sharedShema/response";
import { loginAdminPayload, testUser } from "../utils/testData";
import { RoleGroupEnum } from "../../types/role";
import { cleanupUsers } from "../utils/cleanupUsers";
import { EntityEnum } from "../../types/EntityEnum";
import { LoginReponseType } from "../../routes/v1/api/auth/schema";
import { createUsers } from "../utils/createUser";
import { StatusPayloadType } from "../../routes/v1/api/admin/user/userSchema";
import { AdminActivityLog } from "../../entities/public/admin.activity.log.entity";
import { Agents } from "../../entities/public/agents.entity";
import { AdminActionEnum } from "../../types/adminActionEnum";
import { Users } from "../../entities/public/users.entity";

describe('User IAM tests', () => {

    let app: FastifyInstance;
    let accessToken: string;
    let createdUser: string;
    let createdUserId: number;
    let agent: Agents;
    const agentCode = testUser.agent;

    beforeAll(async () => {
        app = await getGlobalApp(); // Get the pre-initialized app
        const res = (await app.inject(loginAdminPayload)).json() as LoginReponseType;
        accessToken = res?.token?.access_token;
        agent = app.agentList.find(p => p.agentCode === agentCode);

        const userResult = await createUsers(app, agentCode);
        // console.log(userResult);
        createdUser = userResult.userName;
        createdUserId = userResult.userId;

    });

    afterAll(async () => {
        await cleanupUsers(app, agentCode, [createdUser]);
        await app.close();

    });


    test("Enable/Disable user", async () => {

        const payload: InjectOptions = {
            method: 'POST',
            url: '/v1/api/admin/user/status',
            headers: {
                'platform-agent': agentCode,
                Authorization: `Bearer ${accessToken}`,
            },
            body: {
                userId: createdUserId,
                status: "enable",

            } as StatusPayloadType
        };

        const res = await app.inject(payload);

        const response = res.json<CrudReponseType>();
        expect(response).toBeDefined();
        expect(response.message).toEqual(RequestStatusEnum.SUCCESS.toString());

        const adminLogRepo = app.orm["typeorm"].getRepository(AdminActivityLog);
        const adminLog = await adminLogRepo.find({
            where: {
                entityType: EntityEnum.USERS,
                entityId: createdUserId,
                agentId: agent.agentId
            }
        }) as AdminActivityLog[];


        expect(adminLog.length).toBe(1);
        expect(adminLog[0].action).toEqual(AdminActionEnum.ENABLE);

        const userRepo = app.orm["typeorm"].getRepository(Users);
        const user = await userRepo.findOne({
            where: { userId: createdUserId }
        });
        expect(user.endDateActive).toBeNull();


        const disablePayload = {
            ...payload,
            body: {
                status: "disable",
                userId: createdUserId
            } as StatusPayloadType
        };
        const disableRes = await app.inject(disablePayload);
        const disableResponse = disableRes.json<CrudReponseType>();
        expect(disableResponse).toBeDefined();
        expect(disableResponse.message).toEqual(RequestStatusEnum.SUCCESS.toString());

        const adminLogDisable = await adminLogRepo.find({
            where: {
                entityType: EntityEnum.USERS,
                entityId: createdUserId,
                agentId: agent.agentId
            }
        }) as AdminActivityLog[];
        expect(adminLogDisable.length).toBe(2);
        const disabledItem = adminLogDisable.find(p => p.action === AdminActionEnum.DISABLE);
        expect(disabledItem).toBeDefined();
        expect(disabledItem?.entityId).toEqual(createdUserId);
        expect(disabledItem?.agentId).toEqual(agent.agentId);

    })

    test("Change Roles", async () => {

        const payload: InjectOptions = {
            method: 'PATCH',
            url: '/v1/api/admin/user/roles',
            headers: {
                'platform-agent': agentCode,
                Authorization: `Bearer ${accessToken}`,
            },
            body: {
                userId: createdUserId,
                groups: [
                    { groupName: RoleGroupEnum.admin, action: 'add' },
                    { groupName: RoleGroupEnum.user, action: 'remove' }
                ],

            } as StatusPayloadType
        };

        const res = await app.inject(payload);

        const response = res.json<CrudReponseType>();
        expect(response).toBeDefined();
        expect(response.message).toEqual(RequestStatusEnum.SUCCESS.toString());

        const adminLogRepo = app.orm["typeorm"].getRepository(AdminActivityLog);
        const adminLog = await adminLogRepo.find({
            where: {
                entityType: EntityEnum.USERS,
                entityId: createdUserId,
                agentId: agent.agentId,
                action: AdminActionEnum.CHANGE_ROLE
            }
        }) as AdminActivityLog[];


        expect(adminLog.length).toBe(1);
        expect(adminLog[0].details).toHaveProperty('addedTo');
        expect(adminLog[0].details).toHaveProperty('removedFrom');
        expect(adminLog[0].details.addedTo).toContain(RoleGroupEnum.admin);
        expect(adminLog[0].details.removedFrom).toContain(RoleGroupEnum.user);


    })

});
