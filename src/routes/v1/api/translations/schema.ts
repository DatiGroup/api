import { z } from "zod"

export const googleTranslateSchema = z.object({
    q: z.union([z.string(), z.array(z.string())]),
    source: z.string(),
    target: z.string(),
    format: z.enum(['text', 'html'])
});
export type GoogleTranslateSchema = z.infer<typeof googleTranslateSchema>;

export const googleTranslateDTOSchema = z.any();
export type GoogleTranslateDTOSchema = z.infer<typeof googleTranslateDTOSchema>;