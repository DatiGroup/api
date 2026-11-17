import z from 'zod';

export const referenceUserSchema = z.object({
    userId: z.number(),
    userName: z.string(),
    email: z.string().optional(),
    profile: z.object({
        preferredLang: z.string().optional(),
        userProfileId: z.number(),
        firstName: z.string(),
        lastName: z.string(),
    }),
}).optional();

export type ReferenceUserType = z.infer<typeof referenceUserSchema>; 