import { FastifyReply, FastifyRequest } from "fastify"; 
import { FndLookupSchema, FndValuesSchema } from "./schema";
import { FndLookups } from "../../../../entities/fnd/lookups.entity";

type FndParamsType = {
  lookupType: string
}

export async function getFndLookupHandler(
  request: FastifyRequest<{ Params: FndParamsType }>,
  reply: FastifyReply) {
  try {
    const { lookupType } = request.params
    let result: FndLookupSchema
    const fndRespository = request.server.orm["typeorm"].getRepository(FndLookups);
    const fndRequest = await fndRespository
      .createQueryBuilder("fnd")
      .leftJoinAndSelect("fnd.lookupTl", "lookupTl")
      .leftJoinAndSelect("lookupTl.lookupLanguage", "lookupLanguage")
      .leftJoinAndSelect("fnd.lookupValues", "lookupValues")
      .leftJoinAndSelect("lookupValues.lookupValuesTl", "lookupValuesTl")
      .leftJoinAndSelect("lookupValuesTl.lookupLanguage", "lookupValueLanguage")
      .where("fnd.lookupType = :lookupType", { lookupType: lookupType })
      .andWhere("now() between fnd.startDateActive and COALESCE(fnd.endDateActive, now())")
      .andWhere("fnd.enabled = true")
      .getOne()
    if (fndRequest) {
      const result: FndLookupSchema = {
        tl: [],
        lookupCodes: []
      }
      fndRequest.lookupTl.map((translation: any) => {
        result.tl.push({
          languageCode: translation.lookupLanguage.languageCode,
          translation: {
            meaning: translation.meaning,
            description: translation.description
          }
        })
      })
      fndRequest.lookupValues.map((values: any) => {
        const valueResult: FndValuesSchema = {
          lookupCode: values.lookupCode,
          tl: [],
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
          attribute15: values.attribute15
        }
        values.lookupValuesTl.map((translation: any) => {
          valueResult.tl.push({
            languageCode: translation.lookupLanguage.languageCode,
            translation: {
              meaning: translation.meaning,
              description: translation.description
            }
          })
        })
        result.lookupCodes.push(valueResult)
      })
      return result
    } else {
      reply.code(404)
    }
    return result
  } catch (error) {
    request.log.error(error, 'Failed to get lookup codes')
    return reply.code(500)


  }
};