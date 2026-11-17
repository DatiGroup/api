import { FastifyRequest } from 'fastify'
import {
  CreateFndValuesSchema,
  EditFndValuesSchema,
  FndCodeSchema,
  FndCodesSchema,
  FndLanguagesSchema,
  FndLookupSchema,
  FndLookupTlSchema,
  FndValuesSchema,
  LanguageCode,
} from './schema'
import { HttpError } from '@fastify/sensible/lib/httpError'
import { FndLanguages } from '../../../../entities/fnd/languages.entity'
import { FndLookups } from '../../../../entities/fnd/lookups.entity'
import { FndLookupValues } from '../../../../entities/fnd/lookup.values.entity'
import { FndLookupValuesTl } from '../../../../entities/fnd/lookup.values.tl.entity'
import { SequenceType } from '../../../../entities/public/sequences.entity'
import {
  RequestStatusEnum,
  CrudReponseType,
} from '../../../../sharedShema/response'
import { FndLookupTl } from '../../../../entities/fnd/lookup.tl.entity'
import { FndTypeEnum } from '../../../../types/FndTypeEnum'
import { translate } from '../../../../utils/translate'

export type LookupParamsType = {
  lookupType: string
}

export type LookupValueParamsType = {
  lookupType: string
  lookupValueId: number
}

export async function getLanguages(request: FastifyRequest) {
  try {
    const languagesRespository =
      request.server.orm['typeorm'].getRepository(FndLanguages)
    const languagesResults = await languagesRespository
      .createQueryBuilder('languages')
      .where('languages.enabled = true')
      .andWhere(
        'now() between languages.startDateActive and COALESCE(languages.endDateActive, now())',
      )
      .getMany()
    const response: FndLanguagesSchema = []
    languagesResults.map((language: FndLanguages) => {
      response?.push({
        languageId: language.languageId,
        description: language.description,
        languageCode: language.languageCode,
      })
    })
    return response
  } catch (error) {
    request.log.error(error, 'Failed to get languages')
    return request.server.httpErrors.badRequest(
      translate('errors.lookups.failedToGetLang', request.defaultLanguage),
    )
  }
}

export async function getCodes(request: FastifyRequest) {
  try {
    const lookupsRespository =
      request.server.orm['typeorm'].getRepository(FndLookups)
    const lookupsResults = await lookupsRespository
      .createQueryBuilder('fnd')
      .leftJoinAndSelect('fnd.lookupTl', 'lookupTl')
      .leftJoinAndSelect('lookupTl.lookupLanguage', 'lookupLanguage')
      .where('fnd.enabled = true')
      .andWhere(
        'now() between fnd.startDateActive and COALESCE(fnd.endDateActive, now())',
      )
      .andWhere('fnd.editable = true')
      .getMany()

    const response: FndCodesSchema = []

    lookupsResults.map((lookup: FndLookups) => {
      const lookupResult: FndCodeSchema = {
        lookupType: lookup.lookupType,
        purpose: lookup.purpose as FndTypeEnum,
        tl: [],
      }

      lookup.lookupTl.map(lookupTl => {
        lookupResult.tl.push({
          languageCode: lookupTl.lookupLanguage.languageCode,
          translation: {
            meaning: lookupTl.meaning,
            description: lookupTl.description,
          },
        })
      })
      response.push(lookupResult)
    })

    return response
  } catch (error) {
    request.log.error(error, 'Failed to get lookups')
    return request.server.httpErrors.badRequest(
      translate('errors.lookups.failedToGetLookups', request.defaultLanguage),
    )
  }
}

export async function createLookupCode(
  request: FastifyRequest<{ Body: FndLookupSchema }>,
): Promise<CrudReponseType | HttpError> {
  const ds = request.server.orm['typeorm']

  const { agentId, userId } = request.user
  const {
    lookupType,
    enabled,
    editable,
    tl,
    purpose,
    startDateActive,
    endDateActive,
  } = request.body

  try {
    const saveObject: FndLookups = {
      lookupType: lookupType
        ? lookupType.toUpperCase()
        : await request.server.commonObjects.getSequence(
            ds,
            -1,
            SequenceType.FND,
          ),
      enabled: enabled,
      editable: editable == undefined ? true : editable,
      startDateActive: startDateActive,
      endDateActive: endDateActive,
      agentId: agentId,
      updatedBy: userId,
      createdBy: userId,
      purpose: purpose.toUpperCase() as FndTypeEnum,
    }

    const fndRespository = ds.getRepository(FndLookups)
    const exists = await fndRespository.findOne({
      where: {
        lookupType: saveObject.lookupType.toUpperCase(),
        purpose: saveObject.purpose,
      },
    })

    if (exists) {
      return request.server.httpErrors.badRequest(
        translate('errors.lookups.lookupExists', request.defaultLanguage),
      )
    }

    const fndResults = await fndRespository.insert(saveObject)
    const lookupId = fndResults?.raw[0]?.lookup_id

    if (!lookupId) {
      return request.server.httpErrors.badRequest(
        translate('errors.lookups.failedToCreate', request.defaultLanguage),
      )
    }

    if (tl?.length > 0) {
      const fndLanguagesRepository = ds.getRepository(FndLanguages)

      const languages: FndLanguages[] = await fndLanguagesRepository.find()
      const langCodes = languages.reduce(
        (langObj: Record<string, number>, lang: FndLanguages) => {
          langObj[lang.languageCode] = lang.languageId

          return langObj
        },
        {} as Record<string, number>,
      )

      const translations: FndLookupTl[] = tl.map(
        (translation: LanguageCode) => {
          const {
            languageCode,
            translation: { meaning, description },
          } = translation
          const translationRecord: FndLookupTl = new FndLookupTl()

          translationRecord.lookupId = lookupId
          translationRecord.languageId = langCodes[languageCode]
          translationRecord.meaning = meaning
          translationRecord.description = description
          translationRecord.createdBy = userId
          translationRecord.updatedBy = userId

          return translationRecord
        },
      )

      const fndTlRespository = ds.getRepository(FndLookupTl)
      await fndTlRespository.save(translations)
    }

    return { message: RequestStatusEnum.CREATED, id: lookupId }
  } catch (error) {
    request.log.error(error, 'Failed to create lookup')
    return request.server.httpErrors.badRequest(
      translate('errors.lookups.failedToCreate', request.defaultLanguage),
    )
  }
}

export async function getLookupValues(
  request: FastifyRequest<{ Params: LookupParamsType }>,
) {
  try {
    const { lookupType } = request.params
    const result: FndLookupTlSchema = {
      tl: [],
      lookupCodes: [],
    }
    const fndRespository =
      request.server.orm['typeorm'].getRepository(FndLookups)
    const fndRequest = await fndRespository
      .createQueryBuilder('fnd')
      .leftJoinAndSelect('fnd.lookupTl', 'lookupTl')
      .leftJoinAndSelect('lookupTl.lookupLanguage', 'lookupLanguage')
      .leftJoinAndSelect(
        'fnd.lookupValues',
        'lookupValues',
        '(lookupValues.agentId is null OR lookupValues.agentId = :agentId)',
        { agentId: request.user.agentId },
      )
      .leftJoinAndSelect('lookupValues.lookupValuesTl', 'lookupValuesTl')
      .leftJoinAndSelect('lookupValuesTl.lookupLanguage', 'lookupValueLanguage')
      .where('fnd.lookupType = :lookupType', { lookupType: lookupType })
      .andWhere(
        'now() between fnd.startDateActive and COALESCE(fnd.endDateActive, now())',
      )
      .andWhere('fnd.enabled = true')
      .andWhere('fnd.editable = true')
      .orderBy('lookupValues.startDateActive', 'DESC')
      .getOne()

    if (!fndRequest) {
      return request.server.httpErrors.notFound(
        translate('errors.lookups.lookupNotFound', request.defaultLanguage),
      )
    }

    fndRequest.lookupTl.map((lookupTl: FndLookupTl) => {
      result.tl.push({
        languageCode: lookupTl.lookupLanguage.languageCode,
        translation: {
          meaning: lookupTl.meaning,
          description: lookupTl.description,
        },
      })
    })
    fndRequest.lookupValues.map((values: FndLookupValues) => {
      const lookupCode: FndValuesSchema = {
        lookupValueId: values.lookupValueId,
        lookupCode: values.lookupCode,
        editable: values.agentId === request.user.agentId ? true : false,
        tl: [],
        enabled: values.enabled,
        startDateActive: values.startDateActive,
        endDateActive: values.endDateActive,
        attribute1: values.attribute1,
        attribute2: values.attribute2,
        attribute3: values.attribute3,
        attribute4: values.attribute4,
        attribute5: values.attribute5,
        attribute6: values.attribute6,
        attribute7: values.attribute7,
        attribute8: values.attribute8,
        attribute9: values.attribute9,
        attribute10: values.attribute10,
        attribute11: values.attribute11,
        attribute12: values.attribute12,
        attribute13: values.attribute13,
        attribute14: values.attribute14,
        attribute15: values.attribute15,
      }
      values.lookupValuesTl.map((lookupValuesTl: FndLookupValuesTl) => {
        lookupCode.tl.push({
          languageCode: lookupValuesTl.lookupLanguage.languageCode,
          translation: {
            meaning: lookupValuesTl.meaning,
            description: lookupValuesTl.description,
          },
        })
      })
      result.lookupCodes.push(lookupCode)
    })
    return result
  } catch (error) {
    request.log.error(error, 'Failed to get client lookup codes')
    return request.server.httpErrors.badRequest(
      translate('errors.lookups.failedToGetLookups', request.defaultLanguage),
    )
  }
}

export async function updateClientLookupValue(
  request: FastifyRequest<{
    Params: LookupValueParamsType
    Body: EditFndValuesSchema
  }>,
): Promise<CrudReponseType | HttpError> {
  const { lookupType, lookupValueId } = request.params
  try {
    const saveObject: FndLookupValues = {
      enabled: request.body.enabled,
      startDateActive: request.body.startDateActive,
      endDateActive: request.body.endDateActive,
      attribute1: request.body?.attribute1,
      attribute2: request.body?.attribute2,
      attribute3: request.body?.attribute3,
      attribute4: request.body?.attribute4,
      attribute5: request.body?.attribute5,
      attribute6: request.body?.attribute6,
      attribute7: request.body?.attribute7,
      attribute8: request.body?.attribute8,
      attribute9: request.body?.attribute9,
      attribute10: request.body?.attribute10,
      attribute11: request.body?.attribute11,
      attribute12: request.body?.attribute12,
      attribute13: request.body?.attribute13,
      attribute14: request.body?.attribute14,
      attribute15: request.body?.attribute15,
      updatedBy: request.user.userId,
    }

    const fndRespository =
      request.server.orm['typeorm'].getRepository(FndLookupValues)
    const fndTlRespository =
      request.server.orm['typeorm'].getRepository(FndLookupValuesTl)

    const fndResults = await fndRespository.update(
      {
        lookupValueId: lookupValueId,
        lookupType: lookupType,
        agentId: request.user.agentId,
      },
      saveObject,
    )

    if (fndResults.affected !== 1) {
      return request.server.httpErrors.badRequest(
        translate('errors.lookups.failedToUpdate', request.defaultLanguage),
      )
    }

    if (request.body?.tl?.length > 0) {
      await Promise.all(
        request.body?.tl.map(async translations => {
          const old = await fndTlRespository.findOne({
            where: {
              lookupValueId: lookupValueId,
              languageId: translations.languageId,
            },
          })

          const translationObject: FndLookupValuesTl = {
            ...old,
            meaning: translations.meaning,
            description: translations.description,
            languageId: translations.languageId,
            lookupValueId: lookupValueId,
            updatedBy: request.user.userId,
          }
          //this is upsert
          await fndTlRespository.update(
            { lookupValueTlId: old.lookupValueTlId },
            translationObject,
          )
        }),
      )
    }

    return { message: RequestStatusEnum.UPDATED }
  } catch (error) {
    request.log.error(error, 'Failed to update client lookup values')
    return request.server.httpErrors.badRequest(
      translate('errors.lookups.failedToUpdate', request.defaultLanguage),
    )
  }
}

export async function createClientLookupValue(
  request: FastifyRequest<{
    Body: CreateFndValuesSchema
    Params: LookupParamsType
  }>,
): Promise<CrudReponseType | HttpError> {
  const ds = request.server.orm['typeorm']
  const { lookupType } = request.params

  try {
    const saveObject: FndLookupValues = {
      lookupType: lookupType,
      lookupCode: request.body?.lookupCode
        ? request.body.lookupCode
        : await request.server.commonObjects.getSequence(
            ds,
            -1,
            SequenceType.FND,
          ),
      enabled: request.body.enabled,
      startDateActive: request.body.startDateActive,
      endDateActive: request.body.endDateActive,
      agentId: request.user.agentId,
      attribute1: request.body?.attribute1,
      attribute2: request.body?.attribute2,
      attribute3: request.body?.attribute3,
      attribute4: request.body?.attribute4,
      attribute5: request.body?.attribute5,
      attribute6: request.body?.attribute6,
      attribute7: request.body?.attribute7,
      attribute8: request.body?.attribute8,
      attribute9: request.body?.attribute9,
      attribute10: request.body?.attribute10,
      attribute11: request.body?.attribute11,
      attribute12: request.body?.attribute12,
      attribute13: request.body?.attribute13,
      attribute14: request.body?.attribute14,
      attribute15: request.body?.attribute15,
      updatedBy: request.user.userId,
      createdBy: request.user.userId,
    }

    const fndRespository = ds.getRepository(FndLookupValues)
    const exists = await fndRespository.findOne({
      where: {
        lookupCode: saveObject.lookupCode,
        lookupType: lookupType.toUpperCase(),
      },
    })

    if (exists) {
      return request.server.httpErrors.badRequest(
        translate('errors.lookups.lookupValueExists', request.defaultLanguage),
      )
    }

    const fndResults = await fndRespository.insert(saveObject)
    const lookupValueId = fndResults?.raw[0]?.lookup_value_id

    if (!lookupValueId) {
      return request.server.httpErrors.badRequest(
        translate('errors.lookups.failedToCreate', request.defaultLanguage),
      )
    }

    if (request.body?.tl?.length > 0) {
      const fndLanguagesRepository = ds.getRepository(FndLanguages)

      const languages: FndLanguages[] = await fndLanguagesRepository.find()
      const langCodes = languages.reduce(
        (langObj: Record<string, number>, lang: FndLanguages) => {
          langObj[lang.languageCode] = lang.languageId

          return langObj
        },
        {} as Record<string, number>,
      )

      const translations: FndLookupValuesTl[] = request.body?.tl.map(
        (translation: LanguageCode) => {
          const {
            languageCode,
            translation: { meaning, description },
          } = translation
          const translationRecord: FndLookupValuesTl = new FndLookupValuesTl()

          translationRecord.lookupValueId = lookupValueId
          translationRecord.languageId = langCodes[languageCode]
          translationRecord.meaning = meaning
          translationRecord.description = description
          translationRecord.createdBy = request.user.userId
          translationRecord.updatedBy = request.user.userId

          return translationRecord
        },
      )

      const fndTlRespository = ds.getRepository(FndLookupValuesTl)
      await fndTlRespository.save(translations)
    }

    return { message: RequestStatusEnum.CREATED, id: lookupValueId }
  } catch (error) {
    request.log.error(error, 'Failed to update client lookup values')
    return request.server.httpErrors.badRequest(
      translate('errors.lookups.failedToUpdate', request.defaultLanguage),
    )
  }
}
