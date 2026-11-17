import { z } from "zod"
import { referenceUserSchema } from "../../../../sharedShema/referenceUser";



export const switchOrgScheme = z.object({
    orgId: z.number()
});

export type SwitchOrgType = z.infer<typeof switchOrgScheme>;

export const activeOrgSchema = z.object({
    userOrganizationId: z.number(),
    name: z.string(),
    registrationNumber: z.string(),
    country: z.string(),
    contactName: z.string().nullable(),
    contactLastName: z.string().nullable(),
    contactEmail: z.string().nullable(),
});

export type ActiveOrgType = z.infer<typeof activeOrgSchema>;


export const orgUserSchema = z.object({
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
        createdDate: z.string(),
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
        sendToEmail: z.string(),
        usedDate: z.coerce.date().nullable().optional(),
        expiredDate: z.coerce.date().nullable().optional(),
        createdByUser: referenceUserSchema,
        invitationDate: z.string(),
    }).optional(),
});


export type OrgUserType = z.infer<typeof orgUserSchema>;

