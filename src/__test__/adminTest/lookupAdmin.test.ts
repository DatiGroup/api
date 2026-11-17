import { FastifyInstance } from 'fastify'
import { getGlobalApp } from '../setup/globalSetup'
import { loginAdminPayload, testAdminUser } from '../utils/testData'
import { LoginReponseType } from '../../routes/v1/api/auth/schema'
import { RequestStatusEnum, CrudReponseType } from '../../sharedShema/response'
import { FndLookups } from '../../entities/fnd/lookups.entity'
import { FndLookupValues } from '../../entities/fnd/lookup.values.entity'
import { FndLookupTl } from '../../entities/fnd/lookup.tl.entity'
import { FndTypeEnum } from '../../types/FndTypeEnum'

describe('LookupsRoutes Admin user tests', () => {
  let app: FastifyInstance
  let accessToken: string
  const testLookupType = 'UNIT_TEST'
  let testLookup: FndLookups

  beforeAll(async () => {
    app = await getGlobalApp()
    const res = (await app.inject(loginAdminPayload)).json() as LoginReponseType
    accessToken = res?.token?.access_token
    const repo = app.orm['typeorm'].getRepository(FndLookups)

    testLookup = await repo.findOne({
      where: {
        lookupType: testLookupType,
      },
    })

    if (!testLookup) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      const saveObject: FndLookups = {
        lookupType: testLookupType,
        enabled: true,
        startDateActive: startOfDay,
        endDateActive: null,
        createdDate: startOfDay,
        createdBy: -1,
        updatedBy: -1,
        updatedDate: startOfDay,
        editable: true,
        purpose: FndTypeEnum.TEST_TYPE,
      }
      await repo.save(saveObject)
      testLookup = await repo.findOne({
        where: {
          lookupType: testLookupType,
        },
      })
    }
  })

  afterAll(async () => {
    const repo = app.orm['typeorm'].getRepository(FndLookups)
    const repoVal = app.orm['typeorm'].getRepository(FndLookupValues)
    const repoTl = app.orm['typeorm'].getRepository(FndLookupTl)

    const testLookups: FndLookups[] = await repo.find({
      relations: {
        lookupValues: true,
        lookupTl: true,
      },
      where: {
        purpose: FndTypeEnum.TEST_TYPE,
      },
    })

    // Delete lookup values
    const lookupValuesToDelete = testLookups.flatMap(
      (lookup: FndLookups) => lookup.lookupValues || [],
    )
    if (lookupValuesToDelete.length > 0) {
      await repoVal.delete(lookupValuesToDelete.map(val => val.lookupValueId))
    }

    // Delete lookup translations
    const lookupTlsToDelete = testLookups.flatMap(
      (lookup: FndLookups) => lookup.lookupTl || [],
    )
    if (lookupTlsToDelete.length > 0) {
      await repoTl.delete(lookupTlsToDelete.map(tl => tl.lookupTlId))
    }

    // Delete lookups
    if (testLookups.length > 0) {
      await repo.delete(testLookups.map(lookup => lookup.lookupId))
    }

    await app.close()
  })

  test('POST creates lookup value', async () => {
    const payload = {
      enabled: false,
      lookupCode: `UNIT_TEST_${new Date().getTime()}`,
      startDateActive: new Date().toISOString(),
    }
    const res = await app.inject({
      method: 'POST',
      url: `/v1/api/lookups/${testLookupType}`,
      headers: {
        'platform-agent': testAdminUser.agent,
        Authorization: `Bearer ${accessToken}`,
      },
      body: payload,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json() as CrudReponseType
    expect(body).toHaveProperty('message')
    expect(body).toHaveProperty('id')
    expect(body.message).toBe(RequestStatusEnum.CREATED)

    const patchPayload = { enabled: false }
    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/v1/api/lookups/${testLookupType}/${body.id}`,
      headers: {
        'platform-agent': testAdminUser.agent,
        Authorization: `Bearer ${accessToken}`,
      },
      body: patchPayload,
    })
    expect(patchRes.statusCode).toBe(200)
    const patchResult = patchRes.json()
    expect(patchResult).toHaveProperty('message')
  })

  test('POST cant create lookup value duplicates', async () => {
    const payload = {
      enabled: false,
      lookupCode: `UNIT_TEST_${new Date().getTime()}`,
      startDateActive: new Date().toISOString(),
    }
    const res = await app.inject({
      method: 'POST',
      url: `/v1/api/lookups/${testLookupType}`,
      headers: {
        'platform-agent': testAdminUser.agent,
        Authorization: `Bearer ${accessToken}`,
      },
      body: payload,
    })
    expect(res.statusCode).toBe(200)
    const body = res.json() as CrudReponseType
    expect(body).toHaveProperty('message')
    expect(body).toHaveProperty('id')
    expect(body.message).toBe(RequestStatusEnum.CREATED)

    const resSecond = await app.inject({
      method: 'POST',
      url: `/v1/api/lookups/${testLookupType}`,
      headers: {
        'platform-agent': testAdminUser.agent,
        Authorization: `Bearer ${accessToken}`,
      },
      body: payload,
    })

    expect(resSecond.statusCode).toBe(400)
  })

  test('POST error on missing body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/api/lookups/${testLookupType}`,
      headers: {
        'platform-agent': testAdminUser.agent,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    expect(res.statusCode).toBe(400)
  })

  test('PATCH  error on missing body', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/v1/api/lookups/sampleType/1',
      headers: {
        'platform-agent': testAdminUser.agent,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    expect(res.statusCode).toBe(400)
  })
})
