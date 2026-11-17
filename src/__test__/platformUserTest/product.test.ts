import { FastifyInstance } from 'fastify'
import { getGlobalApp } from '../setup/globalSetup'
import { loginPayload } from '../utils/testData'
import { LoginReponseType } from '../../routes/v1/api/auth/schema'

describe('Products Portal User tests', () => {
  let app: FastifyInstance
  let accessToken: string
  beforeAll(async () => {
    app = await getGlobalApp()
    const res = (await app.inject(loginPayload)).json() as LoginReponseType
    accessToken = res?.token?.access_token
  })

  afterAll(async () => {
    await app.close()
  })

  it('should get products as hierarchy', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/api/products/',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('cannot use admin api', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1/api/admin/products/',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(response.statusCode).toBe(403)
  })
})
