import { randomBytes } from 'crypto';


const getRandom = () => {
    const bytes = randomBytes(16);
    const chars = 'abcdefghijklmnopqrstuvwxyz';

    return Array.from(bytes, b => chars[b % 26]).join('');
}

export const getUniqueEmail = (prefix?: string) => {
    return `${prefix || ''}${getRandom()}@test.com`;
}

export const getUniqueUsername = (prefix?: string) => {
    return `${prefix || ''}${getRandom()}`;
}