import { z } from 'zod'
import { FndTypeEnum } from '../../../../types/FndTypeEnum'

export const fndValuesTlSchema = z.object({
  meaning: z.string().optional(),
  description: z.string().optional(),
})

export type FndValuesTlSchema = z.infer<typeof fndValuesTlSchema>

export const languageCode = z.object({
  languageCode: z.string(),
  translation: fndValuesTlSchema.optional(),
})

export type LanguageCode = z.infer<typeof languageCode>

export const languageId = z.object({
  languageId: z.number(),
  meaning: z.string().optional(),
  description: z.string().optional(),
})

export type LanguageId = z.infer<typeof languageId>

export const fndLanguageSchema = z.object({
  languageId: z.number().optional(),
  description: z.string().optional(),
  languageCode: z.string().optional(),
})

export type FndLanguageSchema = z.infer<typeof fndLanguageSchema>

export const fndLanguagesSchema = z.array(fndLanguageSchema)

export type FndLanguagesSchema = z.infer<typeof fndLanguagesSchema>

export const fndCodeSchema = z.object({
  lookupType: z.string().optional(),
  purpose: z.nativeEnum(FndTypeEnum).nullable(),
  tl: z.array(languageCode).optional(),
})

export type FndCodeSchema = z.infer<typeof fndCodeSchema>

export const fndCodesSchema = z.array(fndCodeSchema)

export type FndCodesSchema = z.infer<typeof fndCodesSchema>

export const editFndValuesSchema = z.object({
  tl: z.array(languageId).optional(),
  enabled: z.boolean().optional(),
  startDateActive: z.date().optional(),
  endDateActive: z.date().optional(),
  attribute1: z.string().optional(),
  attribute2: z.string().optional(),
  attribute3: z.string().optional(),
  attribute4: z.string().optional(),
  attribute5: z.string().optional(),
  attribute6: z.string().optional(),
  attribute7: z.string().optional(),
  attribute8: z.string().optional(),
  attribute9: z.string().optional(),
  attribute10: z.string().optional(),
  attribute11: z.string().optional(),
  attribute12: z.string().optional(),
  attribute13: z.string().optional(),
  attribute14: z.string().optional(),
  attribute15: z.string().optional(),
})

export type EditFndValuesSchema = z.infer<typeof editFndValuesSchema>

export const createFndValueSchema = z.object({
  tl: z.array(languageCode).optional(),
  enabled: z.boolean().optional(),
  startDateActive: z.date().optional(),
  endDateActive: z.date().optional(),
  attribute1: z.string().optional(),
  attribute2: z.string().optional(),
  attribute3: z.string().optional(),
  attribute4: z.string().optional(),
  attribute5: z.string().optional(),
  attribute6: z.string().optional(),
  attribute7: z.string().optional(),
  attribute8: z.string().optional(),
  attribute9: z.string().optional(),
  attribute10: z.string().optional(),
  attribute11: z.string().optional(),
  attribute12: z.string().optional(),
  attribute13: z.string().optional(),
  attribute14: z.string().optional(),
  attribute15: z.string().optional(),
})

export const createFndValuesSchema = createFndValueSchema.extend({
  lookupCode: z.string().optional(),
})

export type CreateFndValuesSchema = z.infer<typeof createFndValuesSchema>

export const fndValuesSchema = z.object({
  lookupValueId: z.number().optional(),
  lookupCode: z.string().optional(),
  editable: z.boolean().optional(),
  tl: z.array(languageCode).optional(),
  enabled: z.boolean().optional(),
  startDateActive: z.date().optional(),
  endDateActive: z.date().optional(),
  attribute1: z.string().optional(),
  attribute2: z.string().optional(),
  attribute3: z.string().optional(),
  attribute4: z.string().optional(),
  attribute5: z.string().optional(),
  attribute6: z.string().optional(),
  attribute7: z.string().optional(),
  attribute8: z.string().optional(),
  attribute9: z.string().optional(),
  attribute10: z.string().optional(),
  attribute11: z.string().optional(),
  attribute12: z.string().optional(),
  attribute13: z.string().optional(),
  attribute14: z.string().optional(),
  attribute15: z.string().optional(),
})

export type FndValuesSchema = z.infer<typeof fndValuesSchema>

export const fndLookupTlSchema = z.object({
  tl: z.array(languageCode).optional(),
  lookupCodes: z.array(fndValuesSchema).optional(),
})

export type FndLookupTlSchema = z.infer<typeof fndLookupTlSchema>

export const fndLookupSchema = z.object({
  lookupId: z.number().optional(),
  lookupType: z.string().optional(),
  enabled: z.boolean().optional(),
  tl: z.array(languageCode).optional(),
  editable: z.boolean().optional(),
  startDateActive: z.date().optional(),
  endDateActive: z.date().optional(),
  purpose: z.nativeEnum(FndTypeEnum).optional(),
})

export type FndLookupSchema = z.infer<typeof fndLookupSchema>
