import z from 'zod';

export const infoEmailSchema = z.object({
    email: z.string(),

})

export type InfoEmailType = z.infer<typeof infoEmailSchema>;