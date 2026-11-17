import z from 'zod'

// Common field transformations
export const emailField = z
  .string()
  .email()
  .max(100, 'Email must be 100 characters or less')
  .transform(val => val.trim().toLowerCase())

export const userNameField = z
  .string()
  .min(5, 'Username is required')
  .max(255, 'Username must be 255 characters or less')
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
  .transform(val => val.trim().toLowerCase())

export const trimmedString = (minLength?: number, maxLength?: number) => {
  let schema = z.string()
  if (minLength !== undefined) schema = schema.min(minLength)
  if (maxLength !== undefined) schema = schema.max(maxLength)
  return schema.transform(val => val.trim())
}

export const nameField = trimmedString(1, 255)

/**
 * Safe string field that only allows alphanumeric characters and spaces
 * Use for user-facing text fields like names, titles, etc.
 */
export const safeTextField = (minLength?: number, maxLength?: number) => {
  let schema = z.string()

  if (minLength !== undefined) schema = schema.min(minLength)
  if (maxLength !== undefined) schema = schema.max(maxLength)

  return schema
    .refine(val => /^[\p{L}\p{N}\s]+$/u.test(val), {
      message: 'Only letters, numbers, and spaces are allowed',
    })
    .transform(val => val.trim())
}
