import { z } from "zod";

export const termsEnumType = z.enum(['PRIVACY_POLICY', 'TERMS_AND_CONDITIONS']);

export type TermsEnumType = z.infer<typeof termsEnumType>;


export const termItemSchema = z.object({
    termId: z.number(),
    type: termsEnumType,
    version: z.string().optional(),
    contentHtml: z.string(),
    startDateActive: z.date(),
    endDateActive: z.date().nullable().optional()
});

export const termsResponseSchema = z.array(termItemSchema)

export type TermsResponseSchema = z.infer<typeof termsResponseSchema>;