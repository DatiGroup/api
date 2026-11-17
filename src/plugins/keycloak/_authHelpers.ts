import { FastifyInstance } from 'fastify';
import { RequestAgent } from '../agents';
import { RequestUserType } from '../../types/requestUserType';
import KeycloakConnect from 'keycloak-connect';

export interface AuthContextResult {
    grant: KeycloakConnect.Grant;
    externalUserId: string;
    //   tokenContent: string;
    userObj: RequestUserType;
    activeOrgId: number | undefined;
}

/**
 * Validate a Keycloak access token using the agent's Keycloak instance
 * and load user context from Redis cache.
 */
export async function authorizeTokenAndLoadUser(
    fastify: FastifyInstance,
    token: string,
    agent: RequestAgent
): Promise<AuthContextResult> {
    const keycloak = agent.keycloakAuthService.getKeycloakInstance();

    // Validate token via keycloak-connect grant manager
    const grant = await keycloak.grantManager.createGrant({ access_token: token } as any);
    await keycloak.grantManager.validateGrant(grant);

    const tokenContent = (grant.access_token as any)?.content;
    const externalUserId = tokenContent?.sub as string | undefined;
    if (!externalUserId) {
        throw new Error('Cant find keycloak user id from token');
    }

    const userObj = await fastify.redisUtils.getUser(externalUserId);
    const activeOrgId = await fastify.redisUtils.getActiveOrg(externalUserId);

    if (!userObj) {
        throw new Error('Cant find user object from cache');
    }

    return { grant, externalUserId, userObj, activeOrgId };
}

/**
 * Check whether token (grant) contains any of the required roles.
 */
export function hasAnyRole(grant: any, roles: string | string[]): boolean {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const tokenContent = (grant?.access_token as any)?.content;
    const userRoles: string[] = tokenContent?.realm_access?.roles || [];
    return requiredRoles.some(r => userRoles.includes(r));
}
