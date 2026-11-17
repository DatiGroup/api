import z from 'zod'

const deviceSchema = z.object({
  browser: z.string().nonempty('browser required'),
  platform: z.string().nonempty('platform required'),
  hash: z.string().nonempty('hash required'),
  fcmToken: z.string().optional(),
})

export const loginPayloadSchema = z.object({
  userName: z
    .string()
    .min(1, { message: 'Username or email required' })
    .toLowerCase(),
  password: z.string().min(1, { message: 'User password' }),
  deviceInfo: deviceSchema,
})

const authUserSchema = z.object({
  userId: z.number(),
  userName: z.string(),
  email: z.string(),
})

export const tokenSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.string(),
  expires_in: z.number(),
  refresh_expires_in: z.number(),
  scope: z.string(),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
})

export const loginReponseSchema = z.object({
  user: authUserSchema,
  token: tokenSchema,
  activeOrgId: z.number(),
  userOrgs: z.object({
    organizations: z.array(
      z.object({
        orgId: z.number(),
        name: z.string(),
      }),
    ),
  }),
})

export const refreshTokenReponseSchema = z.object({
  user: authUserSchema,
  token: tokenSchema,
})

export const sentLinkSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'email required' })
    .email('This is not a valid email.')
    .toLowerCase(),
  recaptchaToken: z.string().min(1, { message: 'recaptchaToken required' }),
})

export const passwordResetSchema = z.object({
  newPassword: z.string().min(1, { message: 'required' }),
  otpCode: z.string().min(1, { message: 'required' }),
  token: z.string().min(1, { message: 'required' }),
})

export type TokenType = z.infer<typeof tokenSchema>
export type LoginPayloadType = z.infer<typeof loginPayloadSchema>
export type LoginReponseType = z.infer<typeof loginReponseSchema>
export type RefreshTokenTypeReponseType = z.infer<
  typeof refreshTokenReponseSchema
>
export type DeviceType = z.infer<typeof deviceSchema>
export type RefreshTokenType = z.infer<typeof refreshTokenSchema>
export type ResetPasswordPayloadType = z.infer<typeof passwordResetSchema>
export type SentLinkPayloadType = z.infer<typeof sentLinkSchema>
