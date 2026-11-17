import z from 'zod';

export const sentOtpSchema = z.object({
    token: z.string().min(1, { message: "required" }),
    recaptchaToken: z.string().min(1, { message: "recaptchaToken required" }),
})
export type SentOtpPayloadType = z.infer<typeof sentOtpSchema>;

export const sentInvitationOtpSchema = z.object({
    invitationCode: z.string().min(1, { message: "required" }),
    recaptchaToken: z.string().min(1, { message: "recaptchaToken required" }),
})

export type SentInvitationOtpPayloadType = z.infer<typeof sentInvitationOtpSchema>;