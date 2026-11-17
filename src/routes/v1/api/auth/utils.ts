import jwt from 'jsonwebtoken';
import { t } from "i18next";

// Utility function to get  user and expiration time in seconds from JWT token
export function getJwData(token: string): { expiresIn: number | null, sub: string | null } {
    if (!token) return { expiresIn: null, sub: null };
    try {
        const decoded = jwt.decode(token) as { exp?: number; iat?: number; sub?: string } | null;
        if (!decoded || typeof decoded.exp !== 'number') {
            return { expiresIn: null, sub: null };
        }
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = decoded.exp - now;
        return {
            expiresIn: expiresIn > 0 ? expiresIn : 0,
            sub: decoded.sub ?? null
        };
    } catch (error) {
        console.error('JWT decode error:', error);
        return { expiresIn: null, sub: null };
    }
}

export const translateError = (error: any, lang: string = 'en') => {
    const { cause } = error;

    switch (cause) {
        case 'NO_USER':
            return t('errors.auth.noUser', { lng: lang });
        case 'ACCOUNT_DISABLED':
            return t('errors.auth.accountDisabled', { lng: lang });
        case 'SESSION_FAILED':
            return t('errors.auth.sessionFailed', { lng: lang });
        case 'KEYCLOAK_ERROR':
            return t('errors.auth.keycloakError', { lng: lang });
        case 'EXPIRATION_ERROR':
            return t('errors.auth.expirationError', { lng: lang });
        case 'ORG_ERROR':
            return t('errors.auth.orgError', { lng: lang });
        case 'LOGIN_ERROR':
            return t('errors.auth.loginError', { lng: lang });
        case 'REFRESH_ERROR':
            return t('errors.auth.refreshError', { lng: lang });
        case 'LOGOUT_ERROR':
            return t('errors.auth.logoutError', { lng: lang });
        default:
            return t('errors.auth.generic', { lng: lang });
    }
}