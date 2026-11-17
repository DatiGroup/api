import crypto, { createHash } from 'crypto';

export const generateSessionId = (userId: number, deviceId: number) => {
  const sha = createHash('sha256').update(`${userId}${deviceId}${Math.random().toString()}`);
  return sha.digest('hex');
}

export const generateResetToken = () => crypto.randomBytes(32).toString("hex");
export const generateOtp = () => crypto.randomInt(100000, 999999);