import z from 'zod'
import { TemplateType } from '../../../../../entities/public/templates.entity'
import { RequestStatusEnum } from '../../../../../sharedShema/response'

export const postNotificationPreviewSchema = z.object({
  subjectPayload: z.string(),
  cssPayload: z.string(),
  htmlPayload: z.string(),
})
export type PostNotificationPreviewType = z.infer<
  typeof postNotificationPreviewSchema
>

export const postPreviewResponseSchema = z.string()
export type PostPreviewResponseType = z.infer<typeof postPreviewResponseSchema>

export const postNotificationSchema = z.object({
  ...postNotificationPreviewSchema.shape,
  toEmail: z.string().email(),
  notificationType: z.nativeEnum(TemplateType),
})
export type PostNotificationType = z.infer<typeof postNotificationSchema>

export const postNotificationResponseSchema = z.object({
  status: z.nativeEnum(RequestStatusEnum),
})
export type PostNotificationResponseType = z.infer<
  typeof postNotificationResponseSchema
>
