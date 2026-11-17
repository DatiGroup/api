import z from 'zod';
import { referenceUserSchema } from '../../../../../sharedShema/referenceUser';

const adminActivitySchema = z.object({
    adminActivityLogId: z.number(),
    action: z.string(),
    details: z.record(z.any()).optional(),
    createdByUser: referenceUserSchema,
    createdDate: z.string(),

})

export const adminActivityResponseSchema = z.array(adminActivitySchema)

export type AdminActivityResponseType = z.infer<typeof adminActivityResponseSchema>;


export const adminActivityParamsSchema = z.object({
    entityId: z.number(),
});

export type AdminActivityParamsType = z.infer<typeof adminActivityParamsSchema>;