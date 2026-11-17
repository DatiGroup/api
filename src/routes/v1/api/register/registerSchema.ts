import z from 'zod'

/**
 * Keycloak Username Validation Schema
 * Based on default Keycloak username restrictions
 */
export const keycloakUsernameSchema = z
  .string()
  .min(5, 'Username is required')
  .max(255, 'Username must be 255 characters or less')
  .toLowerCase()
  .regex(
    /^[a-zA-Z0-9._@+-]+$/,
    'Username can only contain letters, numbers, and ._@+- characters',
  )
  .refine(
    val => !val.includes('..'),
    'Username cannot contain consecutive dots',
  )
  .refine(
    val => !val.startsWith('.') && !val.endsWith('.'),
    'Username cannot start or end with a dot',
  )

/**
 * Keycloak Password Validation Schema
 * Based on common Keycloak password policies
 */
export const keycloakPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(64, 'Password must be 64 characters or less')
  .regex(/^(?=.*[a-z])/, 'Password must contain at least one lowercase letter')
  .regex(/^(?=.*[A-Z])/, 'Password must contain at least one uppercase letter')
  .regex(/^(?=.*\d)/, 'Password must contain at least one digit')
  .regex(
    /^(?=.*[!@#$%^&*()_+\-=\[\]{}|\\:";'<>,.?/~])/,
    'Password must contain at least one special character',
  )

/**
 * Email validation for Keycloak
 */
export const keycloakEmailSchema = z
  .string()
  .email()
  .max(100, 'Email must be 100 characters or less') // RFC 5321 limit
  .toLowerCase()

export const registerPayloadSchema = z
  .object({
    recaptchaToken: z.string().nonempty(),
    userName: keycloakUsernameSchema,
    password: keycloakPasswordSchema,
    repeatPassword: z.string(),
    email: keycloakEmailSchema,
    firstName: z.string().max(50).nonempty(),
    lastName: z.string().max(50).nonempty(),
    preferredLang: z.string().max(50).nonempty().toLowerCase(),
    organizationName: z.string().max(200).nonempty(),
    registrationNumber: z.string().max(50).nonempty().toLowerCase(),
    country: z.string().max(2).nonempty().toLowerCase(),
    contactName: z.string().max(50).nonempty(),
    contactLastName: z.string().max(50).nonempty(),
    contactEmail: keycloakEmailSchema,
  })
  .superRefine(({ password, repeatPassword }, ctx) => {
    if (password !== repeatPassword)
      ctx.addIssue({
        code: 'custom',
        message: 'Passwords do not match',
        path: ['repeatPassword'],
      })
  })

export type RegisterPayloadType = z.infer<typeof registerPayloadSchema>
