import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'

export const appStatusObject = z.object({
  languages: z.array(z.string()),
  agentName: z.string(),
  agentType: z.string(),
  uuid: z.string().nullable(),
  defaultLanguage: z.string().optional(),
})

export const appStatusSchema = zodToJsonSchema(appStatusObject)
export type AppStatusType = z.infer<typeof appStatusObject>
