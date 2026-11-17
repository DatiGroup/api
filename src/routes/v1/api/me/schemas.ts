import { z } from "zod"
import { ApprovalRequestStatusEnum } from "../../../../types/ApprovalRequestStatusEnum";


const userProfileSchema = z.object({
  firstName: z.string().max(50).nullable().optional(),
  lastName: z.string().max(50).nullable().optional(),
  preferredLang: z.string().max(2).nullable().optional(),
});


export const organizationSchema = z.object({
  userOrganizationId: z.number(),
  name: z.string(),
  registrationNumber: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  contactName: z.string().max(50).nullable().optional(),
  contactLastName: z.string().max(50).nullable().optional(),
  contactEmail: z.string().max(100).nullable().optional(),
  startDateActive: z.coerce.date(),
  endDateActive: z.coerce.date().nullable().optional(),
});


export const meReponseSchema = z.object({
  userId: z.number().optional(),
  userName: z.string().max(30),
  email: z.string().max(100).nullable().optional(),
  approvalStatus: z.nativeEnum(ApprovalRequestStatusEnum),
  profile: userProfileSchema,
  memberOfOrganizations: z.array(organizationSchema).optional(),
  uuid: z.string().optional(),
  // ownedOrganizations: z.array(organizationSchema).optional(),
});


export type MeReponseType = z.infer<typeof meReponseSchema>;

export const changePreferredLanguage = z.object({
  languageCode: z.string().length(2)
})

export type ChangePreferredLanguage = z.infer<typeof changePreferredLanguage>;