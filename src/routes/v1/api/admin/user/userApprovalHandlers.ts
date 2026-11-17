import { FastifyRequest } from 'fastify'
import { HttpError } from '@fastify/sensible/lib/httpError'
import { ApprovalPayloadType, GroupPayloadType } from './userSchema'
import {
  CrudReponseType,
  RequestStatusEnum,
} from '../../../../../sharedShema/response'
import { EntityEnum } from '../../../../../types/EntityEnum'
import { AdminActionEnum } from '../../../../../types/adminActionEnum'
import { ApprovalRequestStatusEnum } from '../../../../../types/ApprovalRequestStatusEnum'
import { isEmpty } from 'lodash'

export async function userGroupUpdateHandler(
  request: FastifyRequest<{ Body: GroupPayloadType }>,
) {
  const { userId, groups } = request.body
  const keycloakAdmin = request.agent.keycloakAdminService
  const userDetails = await request.server.services.userService.findUserProfile(
    { userId: userId, agentId: request.user.agentId },
  )

  if (groups.length === 0) {
    return { message: RequestStatusEnum.SUCCESS }
  }
  if (!userDetails) {
    throw request.server.httpErrors.badRequest('User not found')
  }

  try {
    const result = await keycloakAdmin.changeUserGroups(
      userDetails.externalUserId!,
      groups,
    )

    await request.server.services.adminActivityLogService.logActivity({
      agentId: request.agent?.agentId || 0,
      entityType: EntityEnum.USERS,
      action: AdminActionEnum.CHANGE_ROLE,
      createdBy: request.user.userId,
      details: {
        userId: userDetails.userId,
        email: userDetails.email,
        userName: userDetails.userName,
        fullName: [
          userDetails?.profile?.firstName,
          userDetails?.profile?.lastName,
        ]
          .filter(Boolean)
          .join(' '),
        addedTo: result.addGroups,
        removedFrom: result.removeGroups,
      },
      entityId: userDetails.userId,
      api: request.raw.url,
      requestId: request.id,
    })

    return { message: RequestStatusEnum.SUCCESS }
  } catch (error) {
    request.log.error('Failed to update user groups in Keycloak', {
      userId: userDetails.userId,
      error,
    })
    throw request.server.httpErrors.internalServerError(
      'Failed to update user groups in Keycloak',
    )
  }
}

export async function approveUserHandler(
  request: FastifyRequest<{ Body: ApprovalPayloadType }>,
): Promise<CrudReponseType | HttpError> {
  const { requestId, comment, orgId } = request.body

  const { userDetails, keycloakAdmin, settings } =
    await validateAndFetchUserApprovalData(request)

  // Enable user in Keycloak - THIS IS CRITICAL, fail if it doesn't work
  try {
    await keycloakAdmin.changeStatusUserById(
      userDetails.externalUserId,
      'enable',
    )
    request.log.info('User enabled in Keycloak', {
      userId: userDetails.userId,
      externalUserId: userDetails.externalUserId,
    })
  } catch (error) {
    request.log.error('CRITICAL: Failed to enable user in Keycloak', {
      userId: userDetails.userId,
      error,
    })
    throw request.server.httpErrors.internalServerError(
      'Failed to enable user in Keycloak',
    )
  }

  await request.server.services.adminActivityLogService.logActivity({
    agentId: request.agent?.agentId || 0,
    entityType: EntityEnum.USERS,
    action: AdminActionEnum.ENABLE,
    createdBy: request.user.userId,
    details: {
      userId: userDetails.userId,
      email: userDetails.email,
      userName: userDetails.userName,
      fullName: [
        userDetails?.profile?.firstName,
        userDetails?.profile?.lastName,
      ]
        .filter(Boolean)
        .join(' '),
    },
    entityId: userDetails.userId,
    api: request.raw.url,
    requestId: request.id,
  })

  const userOrgRel =
    await request.server.services.userService.getActiveOrgRelation({
      userId: userDetails.userId,
      orgId: orgId,
    })

  if (!userOrgRel) {
    throw request.server.httpErrors.badRequest(
      'User organization relation not found',
    )
  }

  // const baseResource =
  //   await request.server.services.resourceService.getResourceRequestByType(
  //     'CREATE_BASE_RESOURCES',
  //     orgId,
  //   )

  // if (isEmpty(baseResource)) {
  //   //create base reources for user
  //   const baseServce: CreateResource = {
  //     resourceSource: ResourceSourceEnum.PORTAL,
  //     userOrganizationId: userOrgRel.userOrganizationId,
  //     name: 'Base Resources',
  //     description: 'Base resources for new user',
  //     resourceRequest: {
  //       productResourceType: 'BASE_RESOURCES',
  //       attributes: [],
  //     },
  //   }

  //   const baseService =
  //     await request.server.services.resourceService.createResource(
  //       request.server.orm['typeorm'].manager,
  //       baseServce,
  //       request.user.userId,
  //     )
  //   await request.server.services.infraService.requestResource(
  //     {
  //       resourceId: baseService.resourceId,
  //       resourceRequestId: baseService.resourceRequestId,
  //       traceId: baseService.traceId,
  //     },
  //     request,
  //   )
  // }

  await request.server.services.approvalService.approveRequest(
    requestId,
    request.user.userId,
    comment,
  )

  // Send approval email
  try {
    await request.server.templates.sendUserApprove({
      agent: request.agent,
      user: userDetails,
      payload: {
        loginLink: settings?.portalUrl
          ? `${settings.portalUrl}/auth/login`
          : '/',
        firstName: [
          userDetails?.profile?.firstName,
          userDetails?.profile?.lastName,
        ]
          .filter(Boolean)
          .join(' '),
      },
    })
  } catch (e) {
    request.log.error(
      `User approval processed, but failed to send approval email`,
      e,
    )
  }

  return { message: RequestStatusEnum.SUCCESS }
}

export async function rejectUserHandler(
  request: FastifyRequest<{ Body: ApprovalPayloadType }>,
): Promise<CrudReponseType | HttpError> {
  const { requestId, comment } = request.body
  const { userDetails } = await validateAndFetchUserApprovalData(request)

  await request.server.services.approvalService.rejectRequest(
    requestId,
    request.user.userId,
    comment,
  )

  try {
    await request.server.templates.sendUserReject({
      agent: request.agent,
      user: userDetails,
      payload: {
        firstName: [
          userDetails?.profile?.firstName,
          userDetails?.profile?.lastName,
        ]
          .filter(Boolean)
          .join(' '),
      },
    })
  } catch (e) {
    request.log.error(
      `User rejection processed, but failed to send rejection email`,
      e,
    )
  }

  return { message: RequestStatusEnum.SUCCESS }
}

// Common validation and data fetching
async function validateAndFetchUserApprovalData(
  request: FastifyRequest<{ Body: ApprovalPayloadType }>,
) {
  const { requestId } = request.body

  // Find the approval request
  const approvalRequest =
    await request.server.services.approvalService.getRequestById(requestId)
  if (!approvalRequest) {
    throw request.server.httpErrors.badRequest('Approval request not found')
  }

  if (approvalRequest.status !== ApprovalRequestStatusEnum.PENDING) {
    throw request.server.httpErrors.badRequest(
      'Approval request is not in PENDING status',
    )
  }

  // Find user associated with the request
  const userDetails = await request.server.services.userService.findUserProfile(
    { userId: approvalRequest.entityId, agentId: request.user.agentId },
  )
  if (!userDetails) {
    throw request.server.httpErrors.badRequest('User not found')
  }

  if (!userDetails.externalUserId) {
    throw request.server.httpErrors.badRequest('User external ID not found')
  }

  // Get Keycloak admin service
  const keycloakAdmin = request.agent?.keycloakAdminService
  if (!keycloakAdmin) {
    request.log.error('Keycloak admin service not available')
    throw request.server.httpErrors.internalServerError(
      'Keycloak admin service not available',
    )
  }

  const settings = request.agent?.parameters as any

  return {
    approvalRequest,
    userDetails,
    keycloakAdmin,
    settings,
  }
}
