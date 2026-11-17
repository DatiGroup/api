// Example: Defining and testing a dummy route in Jest

import { FastifyInstance } from 'fastify';
import buildFastifyApp from '../../app';
import { loginPayload } from '../utils/testData';
import { LoginReponseType } from '../../routes/v1/api/auth/schema';
import { RequestHeaderEnum } from '../../types/requestHeaderEnum';

describe('Text translation laguage is taken from request header', () => {
    let app: FastifyInstance;
    let accessToken: string;
    beforeAll(async () => {
        app = await buildFastifyApp();

        // Add only the dummy route
        app.get('/dummy', {
            handler: async (request) => {
                return { lng: request.defaultLanguage || 'en' };
            }
        });

        await app.ready();
        const res = (await app.inject(loginPayload)).json() as LoginReponseType;
        accessToken = res?.token?.access_token;
    });

    afterAll(async () => { await app.close(); })

    it('should respond with header language', async () => {

        const userLang = 'lv';
        const headerLang = 'en';
        const updateResponse = await app.inject({
            method: "PATCH",
            url: "/v1/api/me/language",
            headers: { authorization: `Bearer ${accessToken}` },
            body: { languageCode: userLang }
        });
        expect(updateResponse.statusCode).toBe(200);

        const response = await app.inject({
            method: 'GET',
            url: '/dummy',
            headers: { authorization: `Bearer ${accessToken}`, [RequestHeaderEnum.USER_LANGUAGE]: headerLang },

        });
        expect(response.json()).toEqual({ lng: headerLang });
    });
});