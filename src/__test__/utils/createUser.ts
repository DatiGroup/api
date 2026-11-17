import { FastifyInstance } from "fastify";
import { RegisterPayloadType } from "../../routes/v1/api/register/registerSchema";

export async function createUsers(app: FastifyInstance, agentCode: string) {
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits

    const uniqueUsername = `u${timestamp}`; // Format: u12345678@test.com (19 chars)


    const res = await app.inject({
        method: 'POST',
        url: '/v1/api/register',
        headers: {
            'platform-agent': agentCode,
        },
        body: {
            userName: uniqueUsername,
            password: 'Pwd12345!',
            repeatPassword: 'Pwd12345!',
            email: `${uniqueUsername}@dummy.test`,
            firstName: 'Test',
            lastName: 'User',
            preferredLang: 'en',
            organizationName: `${uniqueUsername}ORG`,
            registrationNumber: uniqueUsername,
            country: 'lv',
            contactName: 'Test',
            contactLastName: 'Last',
            contactEmail: `${uniqueUsername}@dummy.test`,
            recaptchaToken: 'test-token'

        } as RegisterPayloadType
    });

    console.log('register repsonse', res.json());
    return { userName: uniqueUsername, userId: res.json().id, password: 'Pwd12345!' };

}