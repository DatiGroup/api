import { z } from "zod"

export const fndValuesTlSchema = z.object({
  meaning: z.string().optional(),
  description: z.string().optional(),
})

export type FndValuesTlSchema = z.infer<typeof fndValuesTlSchema>;

export const languageCode = z.object({
  languageCode: z.string(),
  translation: fndValuesTlSchema.optional()
})

export type LanguageCode = z.infer<typeof languageCode>;

export const fndValuesSchema = z.object({
  lookupCode: z.string().optional(),
  tl: z.array(languageCode).optional(),
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

export type FndValuesSchema = z.infer<typeof fndValuesSchema>;

export const fndLookupSchema = z.object({
  tl: z.array(languageCode).optional(),
  lookupCodes: z.array(fndValuesSchema).optional()
})

export type FndLookupSchema = z.infer<typeof fndLookupSchema>;
