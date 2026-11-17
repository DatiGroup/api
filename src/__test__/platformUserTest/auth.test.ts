'use strict'
import { FastifyInstance, InjectOptions } from "fastify";
import { getGlobalApp } from "../setup/globalSetup";
import { RegisterPayloadType } from "../../routes/v1/api/register/registerSchema";
import { testUser, requestHeaders } from "../utils/testData";
import { LoginPayloadType, loginReponseSchema, LoginReponseType, RefreshTokenType } from "../../routes/v1/api/auth/schema";
import { Users } from "../../entities/public/users.entity";
import { UserDevices } from "../../entities/public/devices.entity";
import { Sessions } from "../../entities/public/sessions.entity";
import { cleanupUsers } from "../utils/cleanupUsers";
import { createUsers } from "../utils/createUser";

describe('Auth tests', () => {

    let app: FastifyInstance;
    let user: Users;
    const createdUsernames: string[] = [];
    const agentCode = testUser.agent;

    beforeAll(async () => {
        app = await getGlobalApp(); // Get the pre-initialized app

        const repoUser = app.orm["typeorm"].getRepository(Users);
        user = await repoUser.findOne({
            where: {
                userName: testUser.userName,
                agent: {
                    agentCode: testUser.agent
                }
            }
        });
    })

    afterAll(async () => { await app.close(); })

    afterEach(async () => {
        await cleanupUsers(app, testUser.agent, createdUsernames);
    });

    test("Login user, check all objects created", async () => {
        const repoDevice = app.orm["typeorm"].getRepository(UserDevices);
        const repoSession = app.orm["typeorm"].getRepository(Sessions);
        const repoUser = app.orm["typeorm"].getRepository(Users);

        //Preparation 
        const timestamp = Date.now().toString().slice(-8); // Last 8 digits
        const uniqueUsernameEmail = `u${timestamp}@auth.test.com`; // Format: u12345678@test.com (19 chars)

        createdUsernames.push(uniqueUsernameEmail);
        const password = 'Pwd12345!';

        const registerResp = await app.inject({
            method: 'POST',
            url: '/v1/api/register',
            headers: {
                'platform-agent': testUser.agent,
            },
            body: {
                userName: uniqueUsernameEmail,
                password: password,
                repeatPassword: password,
                email: uniqueUsernameEmail,
                firstName: testUser.firstName,
                lastName: testUser.lastName,
                preferredLang: testUser.preferredLang,
                organizationName: `${uniqueUsernameEmail}ORG`,
                registrationNumber: uniqueUsernameEmail,
                country: 'lv',
                contactName: 'Test',
                contactLastName: 'Last',
                contactEmail: uniqueUsernameEmail,
                recaptchaToken: 'test-token'
            } as RegisterPayloadType
        });

        expect(registerResp.statusCode).toBe(200);

        const res = await app.inject({
            method: 'POST',
            url: '/v1/api/auth/login',
            headers: requestHeaders,
            body: {
                userName: uniqueUsernameEmail,
                password: password,
                deviceInfo: {
                    browser: "chome",
                    platform: "unit-test",
                    hash: "test-hash",
                }
            } as LoginPayloadType
        });

        expect(res.statusCode).toBe(200);
        const logReponse = res.json<LoginReponseType>();
        const schemaCheck = loginReponseSchema.safeParse(logReponse);
        expect(schemaCheck.success).toBe(true);

        const user = await repoUser.findOne({
            where: {
                userName: uniqueUsernameEmail,
                agent: {
                    agentCode: testUser.agent
                }
            }
        });
        //USER DEVICE is registred
        const userNewDevice = await repoDevice.findOne({
            where: {
                userId: user.userId
            }
        }) as UserDevices;

        expect(userNewDevice).toBeDefined();
        expect(userNewDevice.platform).toEqual("unit-test");

        //SESSSION is created
        const session = await repoSession.findOne({
            where: {
                userId: user.userId,
                userDeviceId: userNewDevice.userDeviceId
            }
        }) as Sessions;

        expect(session).toBeDefined();
        expect(typeof session.ipAddress).toBe('string');
        expect(session.ipAddress).not.toBe('');

        //Redis has user data
        const redisUser = await app.redisUtils.getUser(user.externalUserId);
        expect(redisUser).toBeDefined();
        expect(redisUser.userId).toBe(user.userId);
        expect(redisUser.sessionId).toBe(session.sessionId);

        const logoutRes = await app.inject({
            method: 'POST',
            url: '/v1/api/auth/logout',
            headers: { 'platform-agent': testUser.agent, Authorization: `Bearer ${logReponse.token.access_token}` },
            body: {
                refreshToken: logReponse.token.refresh_token
            } as RefreshTokenType
        });

        expect(logoutRes.statusCode).toBe(200);


        const sessionLoggedOut = await repoSession.findOne({
            where: {
                userId: user.userId,
                userDeviceId: userNewDevice.userDeviceId
            }
        }) as Sessions;

        expect(sessionLoggedOut).toBeNull();
        const redisUserLoggedOut = await app.redisUtils.getUser(user.externalUserId);
        expect(redisUserLoggedOut).toBeUndefined();

    })


    test("Can not Login, wrong password", async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/api/auth/login',
            headers: requestHeaders,
            body: {
                userName: testUser.userName,
                password: 'asdfasdf',
                deviceInfo: {
                    browser: "chome",
                    platform: "unit-test",
                    hash: "test-hash",
                }
            } as LoginPayloadType
        });
        expect(res.statusCode).toBe(409);
    })



    test("Can not Login after inactive user", async () => {
        const timestamp = Date.now().toString().slice(-8); // Last 8 digits
        const uniqueUsername = `u${timestamp}@auth.test.com`; // Format: u12345678@test.com (19 chars)

        createdUsernames.push(uniqueUsername);

        const registerResp = await app.inject({
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

        expect(registerResp.statusCode).toBe(200);

        const loginPayload: InjectOptions = {
            method: 'POST',
            url: '/v1/api/auth/login',
            headers: requestHeaders,
            body: {
                userName: uniqueUsername,
                password: testUser.password,
                deviceInfo: {
                    browser: "chome",
                    platform: "unit-test",
                    hash: "test-hash",
                }
            }
        }

        const loginSuccessResp = await app.inject(loginPayload);
        expect(loginSuccessResp.statusCode).toBe(200);

        const repoUser = app.orm["typeorm"].getRepository(Users);
        const user = await repoUser.findOne({
            where: {
                userName: uniqueUsername,
                agent: {
                    agentCode: testUser.agent
                }
            }
        });
        user.endDateActive = new Date();
        await repoUser.save(user);

        const loginErrosResp = await app.inject(loginPayload);
        expect(loginErrosResp.statusCode).toBe(409);

    })

    test("Refresh token, redis ttl check", async () => {
        const ttlTestUser = await createUsers(app, agentCode);
        createdUsernames.push(ttlTestUser.userName);


        const res = await app.inject({
            method: 'POST',
            url: '/v1/api/auth/login',
            headers: requestHeaders,
            body: {
                userName: ttlTestUser.userName,
                password: ttlTestUser.password,
                deviceInfo: {
                    browser: "chome",
                    platform: "unit-test",
                    hash: "refresh-token",
                }
            } as LoginPayloadType
        });

        expect(res.statusCode).toBe(200);
        const loginReponse = res.json<LoginReponseType>();

        const repoUser = app.orm["typeorm"].getRepository(Users);
        const ttlUser = await repoUser.findOne({
            where: {
                userId: ttlTestUser.userId,
            }
        });

        const redisUser = await app.redisUtils.getUser(ttlUser.externalUserId);
        expect(redisUser).toBeDefined();

        //wait to seconds - we need to see change in tll in redis
        await new Promise(resolve => setTimeout(resolve, 2000));
        const initUserTTL = await app.redisUtils.getUserTTL(ttlUser.externalUserId);

        const resRefresh = await app.inject({
            method: 'POST',
            url: '/v1/api/auth/refresh',
            headers: requestHeaders,
            body: {
                refreshToken: loginReponse.token.refresh_token
            } as LoginPayloadType
        });

        expect(resRefresh.statusCode).toBe(200);

        const schemaCheck = loginReponseSchema.safeParse(loginReponse);
        expect(schemaCheck.success).toBe(true);

        const refreshedUserTTL = await app.redisUtils.getUserTTL(ttlUser.externalUserId);
        expect(refreshedUserTTL).toBeGreaterThan(initUserTTL);

    })


    test("Refresh token, check access to api with refresed token", async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/api/auth/login',
            headers: requestHeaders,
            body: {
                userName: testUser.userName,
                password: testUser.password,
                deviceInfo: {
                    browser: "chome",
                    platform: "unit-test",
                    hash: "refresh-token",
                }
            } as LoginPayloadType
        });

        expect(res.statusCode).toBe(200);
        const loginReponse = res.json<LoginReponseType>();

        const langResp1 = await app.inject({
            method: 'GET',
            url: '/v1/api/lookups/languages',
            headers: { 'platform-agent': testUser.agent, Authorization: `Bearer ${loginReponse.token.access_token}` },
        });

        expect(langResp1.statusCode).toBe(200);


        const resRefresh = await app.inject({
            method: 'POST',
            url: '/v1/api/auth/refresh',
            headers: requestHeaders,
            body: {
                refreshToken: loginReponse.token.refresh_token
            } as LoginPayloadType
        });
        expect(resRefresh.statusCode).toBe(200);
        const refreshReponse = resRefresh.json<LoginReponseType>();

        const langResp2 = await app.inject({
            method: 'GET',
            url: '/v1/api/lookups/languages',
            headers: { 'platform-agent': testUser.agent, Authorization: `Bearer ${refreshReponse.token.access_token}` },
        });

        expect(langResp2.statusCode).toBe(200);
    })


    test("Access by role, success", async () => {
        const res = await app.inject({
            method: 'POST',
            url: '/v1/api/auth/login',
            headers: requestHeaders,
            body: {
                userName: testUser.userName,
                password: testUser.password,
                deviceInfo: {
                    browser: "chome",
                    platform: "unit-test",
                    hash: "unit-test-hash",
                }
            } as LoginPayloadType
        });

        expect(res.statusCode).toBe(200);
        const loginReponse = res.json<LoginReponseType>();

        const langResp1 = await app.inject({
            method: 'GET',
            url: '/v1/api/lookups/languages',
            headers: { 'platform-agent': testUser.agent, Authorization: `Bearer ${loginReponse.token.access_token}` },
        });

        expect(langResp1.statusCode).toBe(200);


    })


    test("Access by role, error", async () => {
        const resLogin = await app.inject({
            method: 'POST',
            url: '/v1/api/auth/login',
            headers: requestHeaders,
            body: {
                userName: testUser.userName,
                password: testUser.password,
                deviceInfo: {
                    browser: "chome",
                    platform: "unit-test",
                    hash: "unit-test-hash",
                }
            } as LoginPayloadType
        });

        expect(resLogin.statusCode).toBe(200);
        const loginReponse = resLogin.json<LoginReponseType>();

        const resPost = await app.inject({
            method: 'POST',
            url: '/v1/api/lookups/CLIENT_TYPE',
            headers: { 'platform-agent': testUser.agent, Authorization: `Bearer ${loginReponse.token.access_token}` },
            body: { lookupCode: 'UNIT_TEST' }
        });
        expect(resPost.statusCode).toBe(403);
    })


});
