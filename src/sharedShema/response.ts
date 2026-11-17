import z from 'zod'

export enum RequestStatusEnum {
  SUCCESS = 'success',
  ERROR = 'error',
  CREATED = 'created',
  UPDATED = 'updated',
  DELETED = 'deleted',
}

export const crudReponseSchema = z.object({
  message: z.nativeEnum(RequestStatusEnum),
  id: z.number().optional().nullable(),
})

export type CrudReponseType = z.infer<typeof crudReponseSchema>

export const crudChangedReponseSchema = z.object({
  message: z.nativeEnum(RequestStatusEnum),
  productPrice: z.number().optional().nullable(),
})

export type CrudChangedReponseType = z.infer<typeof crudChangedReponseSchema>

export const idParamsSchema = z.object({
  id: z.coerce.number(),
})

export const resourceRequestIdParamsSchema = z.object({
  resourceRequestId: z.coerce.number().optional().nullable(),
})

export type ResourceRequestIdParamsType = z.infer<
  typeof resourceRequestIdParamsSchema
>

export const lookupTypeParamsSchema = z.object({
  lookupType: z.coerce.string().optional(),
})

export const showInactiveQuerySchema = z.object({
  showInactive: z.boolean().optional(),
})

export type IdParamsType = z.infer<typeof idParamsSchema>