import { InjectOptions } from 'fastify'

export interface TestUserType {
  userName: string
  email: string
  firstName: string
  lastName: string
  password: string
  agent: string
  preferredLang: string
}
export const testUser: TestUserType = {
  userName: 'auto-test',
  email: 'auto.test@dati.com',
  firstName: 'Janis',
  lastName: 'Testētājs',
  password: 'Pwd12345!',
  agent: 'digital-twins',
  preferredLang: 'en',
}

export const testAdminUser: TestUserType = {
  userName: 'auto-test-admin',
  email: 'auto.test.admin@dati.com',
  firstName: 'Admins',
  lastName: 'Testētājs',
  password: 'Pwd12345!',
  agent: 'digital-twins',
  preferredLang: 'en',
}

export const loginPayload: InjectOptions = {
  method: 'POST',
  url: '/v1/api/auth/login',
  headers: { 'platform-agent': testUser.agent },
  body: {
    userName: testUser.userName,
    password: testUser.password,
    deviceInfo: {
      browser: 'chome',
      platform: 'unit-test',
      hash: 'test-hash',
    },
  },
}

export const loginAdminPayload: InjectOptions = {
  method: 'POST',
  url: '/v1/api/auth/login',
  headers: { 'platform-agent': testAdminUser.agent },
  body: {
    userName: testAdminUser.userName,
    password: testAdminUser.password,
    deviceInfo: {
      browser: 'chome',
      platform: 'unit-test',
      hash: 'test-hash',
    },
  },
}

export const authMicroservicePayload = (
  clientId: string,
  clientSecret: string,
) => ({
  headers: {
    'platform-agent': testUser.agent,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: {
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'openid',
    grant_type: 'client_credentials',
  },
})

export const requestHeaders = { 'platform-agent': testUser.agent }
