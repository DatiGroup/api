import i18next from "i18next";

export const translate = (key: string, lng: string, vars?: Record<string, any>) => {
    const result = i18next.t(key, { lng: lng || 'en', ...vars });

    return result;
};