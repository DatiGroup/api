import { FastifyInstance } from "fastify";
import { getGlobalApp } from "../setup/globalSetup";
import { loginPayload, testUser } from "../utils/testData";
import { LoginReponseType } from "../../routes/v1/api/auth/schema";


describe('Me User tests', () => {
    let app: FastifyInstance;
    let accessToken: string;
    beforeAll(async () => {
        app = await getGlobalApp();
        const res = (await app.inject(loginPayload)).json() as LoginReponseType;
        accessToken = res?.token?.access_token;
    });

    afterAll(async () => { await app.close(); })

    it('should get me details', async () => {
        const response = await app.inject({
            method: "GET",
            url: "/v1/api/me",
            headers: { authorization: `Bearer ${accessToken}` }
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();
        expect(body).toEqual(
            expect.objectContaining({
                profile: expect.any(Object),
                memberOfOrganizations: expect.any(Array),
            })
        );

        expect(body.userName).toBe(testUser.userName);
        expect(body.memberOfOrganizations.length).toBeGreaterThan(0);
    });

    it('it should change user langauge ', async () => {
        const response = await app.inject({
            method: "GET",
            url: "/v1/api/me",
            headers: { authorization: `Bearer ${accessToken}` }
        });

        expect(response.statusCode).toBe(200);
        const body = response.json();

        const newLang = body.profile.preferredLang === 'en' ? 'lv' : 'en';

        const updateResponse = await app.inject({
            method: "PATCH",
            url: "/v1/api/me/language",
            headers: { authorization: `Bearer ${accessToken}` },
            body: { languageCode: newLang }
        });

        expect(updateResponse.statusCode).toBe(200);

        // Verify the change
        const verifyResponse = await app.inject({
            method: "GET",
            url: "/v1/api/me",
            headers: { authorization: `Bearer ${accessToken}` }
        });

        expect(verifyResponse.statusCode).toBe(200);
        const verifyBody = verifyResponse.json();
        expect(verifyBody.profile.preferredLang).toBe(newLang);

    });
});