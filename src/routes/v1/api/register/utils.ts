import { t } from "i18next";

export const translateError = (error: any, lang: string = 'en') => {
    const { cause } = error;

    switch (cause) {
        case 'USER_EXISTS':
            return t('errors.userExists', { lng: lang });
        case 'EMAIL_EXISTS':
            return t('errors.emailExists', { lng: lang });
        case 'ORG_EXISTS':
            return t('errors.orgExists', { lng: lang });
        case 'USER_CREATION_FAILED':
            return t('errors.userCreationFailed', { lng: lang });
        default:
            return t('errors.registrationFailed', { lng: lang });
    }
}