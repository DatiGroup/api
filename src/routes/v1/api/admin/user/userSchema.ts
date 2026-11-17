import z from 'zod';
import { ApprovalRequestStatusEnum } from '../../../../../types/ApprovalRequestStatusEnum';
import { ApprovalActionEnum } from '../../../../../types/ApprovalActionEnum';
import { referenceUserSchema } from '../../../../../sharedShema/referenceUser';

export const userStatusSchema = z.object({
    userId: z.number(),
    userName: z.string(),
    email: z.string(),
    startDateActive: z.string().optional(),
    endDateActive: z.string().optional(),
    createdDate: z.string().optional(),
    approvalStatus: z.nativeEnum(ApprovalRequestStatusEnum),
    profile: z.object({
        userProfileId: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        preferredLang: z.string().optional(),
    }),
});

export const usersStatusReponseSchema = z.array(userStatusSchema);

export type UsersStatusReponseType = z.infer<typeof userStatusSchema>;



const userDetailSchema = z.object({
    userId: z.number(),
    userName: z.string(),
    email: z.string(),
    startDateActive: z.string().optional(),
    endDateActive: z.string().optional(),
    createdDate: z.string().optional(),
    profile: z.object({
        userProfileId: z.number(),
        firstName: z.string(),
        lastName: z.string(),
        preferredLang: z.string().optional(),
    }),
    approvalRequests: z.array(z.object({
        approvalRequestId: z.number(),
        status: z.nativeEnum(ApprovalRequestStatusEnum),
        assignedToUser: referenceUserSchema,
        assignedToKcGroup: z.string().optional(),
        minRequiredApprovals: z.number(),
        currentApprovalsCount: z.number(),
        createdDate: z.string(),
        updatedDate: z.string(),
        approvals: z.array(z.object({
            approvalId: z.number(),
            action: z.nativeEnum(ApprovalActionEnum),
            comments: z.string().optional(),
            actedAt: z.string(),
            approvedByUser: referenceUserSchema
        }))
    }))
});



const userIAMSchema = z.object({
    enabled: z.boolean(),
    groups: z.array(z.string()),
    wasApproved: z.boolean().optional(),
})

export const usersDetailsReponseSchema = z.object({
    user: userDetailSchema,
    iam: userIAMSchema.optional(),
    organizations: z.array(z.object({
        userOrganizationId: z.number(),
        name: z.string(),
        registrationNumber: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
    }))
})


export type UserDetailsReponseType = z.infer<typeof usersDetailsReponseSchema>;



export const approvalPayloadSchema = z.object({
    requestId: z.number(),
    orgId: z.number(),
    comment: z.string().optional(),
});

export type ApprovalPayloadType = z.infer<typeof approvalPayloadSchema>;



export const groupPayloadSchema = z.object({
    userId: z.number(),
    groups: z.array(
        z.object({
            groupName: z.string().min(1),
            action: z.enum(["add", "remove"]),
        })
    ).min(1), // ensures at least one group
});


export type GroupPayloadType = {
    userId: number;
    groups: {
        groupName: string;
        action: 'add' | 'remove';
    }[];
}


export const statusPayloadSchema = z.object({
    status: z.enum(['enable', 'disable']),
    userId: z.number(),
});

export type StatusPayloadType = z.infer<typeof statusPayloadSchema>;