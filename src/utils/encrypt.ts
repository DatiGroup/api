
import crypto from 'crypto';

export const encrypSymetricKey = (text: string) => {
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return { iv: iv.toString('hex'), key: key.toString('hex'), data: encrypted };
}

export const encryptAsymetric = (publicKey: string, encryptedData: string) => {
    return crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    },
        Buffer.from(encryptedData)).toString('base64');
}
