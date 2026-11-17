import { FastifyInstance } from 'fastify'
import { getGlobalApp } from '../setup/globalSetup'
import { loginAdminPayload, testAdminUser, testUser } from '../utils/testData'
import { LoginReponseType } from '../../routes/v1/api/auth/schema'
import { FndLookups } from '../../entities/fnd/lookups.entity'
import { FndLookupValues } from '../../entities/fnd/lookup.values.entity'
import { CrudReponseType, RequestStatusEnum } from '../../sharedShema/response'
import { SequenceType } from '../../entities/public/sequences.entity'
import { FndTypeEnum } from '../../types/FndTypeEnum'
import { FndLookupSchema } from '../../routes/v1/api/lookups/schema'
import { FndLookupTl } from '../../entities/fnd/lookup.tl.entity'

describe('LookupsRoutes tests', () => {
  let app: FastifyInstance
  let accessToken: string
  const testLookupType = 'UNIT_TEST'
  let testLookup: FndLookups
  let ds: any

  beforeAll(async () => {
    app = await getGlobalApp()
    const res = (await app.inject(loginAdminPayload)).json() as LoginReponseType
    accessToken = res?.token?.access_token
    const repo = app.orm['typeorm'].getRepository(FndLookups)
    ds = app.orm['typeorm']

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

  test('GET /v1/api/lookups/languages returns languages', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/api/lookups/languages',
      headers: {
        'platform-agent': testUser.agent,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBeGreaterThan(0)
  })

  test('GET /v1/api/lookups/codes returns codes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/api/lookups/codes',
      headers: {
        'platform-agent': testUser.agent,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  test('GET /v1/api/lookups/:lookupType returns lookup values', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/api/lookups/${testLookupType}`,
      headers: {
        'platform-agent': testUser.agent,
        Authorization: `Bearer ${accessToken}`,
      },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body).toHaveProperty('lookupCodes')
    expect(body).toHaveProperty('tl')
  })

  test('POST /v1/api/lookups/codes creates lookup type', async () => {
    const payload: FndLookupSchema = {
      lookupType: await app.commonObjects.getSequence(ds, -1, SequenceType.FND),
      enabled: true,
      tl: [
        {
          languageCode: 'en',
          translation: {
            meaning: 'Unit test lookup type',
            description: 'Unit test lookup type description',
          },
        },
      ],
      editable: true,
      startDateActive: new Date(),
      purpose: FndTypeEnum.TEST_TYPE,
    }

    const res = await app.inject({
      method: 'POST',
      url: `/v1/api/lookups/codes`,
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
  })
})
