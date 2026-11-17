import z from 'zod';
import { emailField, safeTextField, userNameField } from '../../../../sharedShema/transformations';
import { referenceUserSchema } from '../../../../sharedShema/referenceUser';

export const invitePayloadSchema = z.object({
    email: emailField,
    userName: userNameField,
    // userName: trimmedString(1, 30),
    firstName: safeTextField(1, 50),
    lastName: safeTextField(1, 50),
});

export type InvitePayloadType = z.infer<typeof invitePayloadSchema>;



export const resendPayloadSchema = z.object({
    email: emailField,
});

export type ResendPayloadType = z.infer<typeof resendPayloadSchema>;


export const initvationSchema = z.object({
    userId: z.number(),
    userName: z.string(),
    email: z.string(),
    startDateActive: z.string().optional(),
    endDateActive: z.string().optional(),
    profile: z.object({
        userProfileId: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        preferredLang: z.string().optional(),
    }),
    userInvitations: z.array(z.object({
        invitationId: z.number(),
        used: z.boolean(),
        email: z.string(),
        usedDate: z.coerce.date().nullable().optional(),
        expiredDate: z.coerce.date().nullable().optional(),
        createdByUser: referenceUserSchema,
        createdDate: z.coerce.date(),
    })),
    lastRelationship: z.object({
        userRelationshipsId: z.number(),
        startDateActive: z.string().optional(),
        endDateActive: z.string().optional(),
    }).optional(),
    ownedOrganization: z.object({
        userOrganizationId: z.number(),
        rootUserId: z.number(),
        name: z.string(),
    }).optional(),
    lastInvitation: z.object({
        invitationId: z.number(),
        used: z.boolean(),
        email: z.string(),
        usedDate: z.coerce.date().nullable().optional(),
        expiredDate: z.coerce.date().nullable().optional(),
        createdByUser: referenceUserSchema,
        createdDate: z.coerce.date(),
    }).optional(),
});

export const getInvitationsResponseSchema = z.array(initvationSchema);
export type ActiveInvitationType = z.infer<typeof getInvitationsResponseSchema>;




export const acceptInviteSchema = z.object({
    otpCode: z.string().min(1, { message: "required" }),
    invitationCode: z.string().min(1, { message: "required" }),
})

export type AcceptInviteType = z.infer<typeof acceptInviteSchema>;