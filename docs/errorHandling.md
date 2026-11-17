# Error Handling Guide

This document describes the error handling system used in this application, covering both Backend (Fastify/Node.js) and Frontend implementations.

---

## Table of Contents

1. [Overview](#overview)
2. [Backend Implementation](#backend-implementation)

---

## Overview

The error handling system distinguishes between two types of errors:

- **User-Facing Errors** (`showToUser: true`): Safe to display to the user (e.g., validation errors, rate limiting)
- **Internal Errors** (`showToUser: false`): Should be hidden from the user (e.g., user enumeration prevention, system errors)

This prevents information leakage while providing meaningful feedback to users.

---

## Backend Implementation

### 1. Error Utilities (`src/utils/errors.ts`)

#### `safeErrorMessage(error, fallback?)`

Safely extracts an error message from any unknown error type.

```typescript
import { safeErrorMessage } from '@/utils/errors'

try {
  await someOperation()
} catch (error) {
  const message = safeErrorMessage(error, 'Operation failed')
  console.log(message)
}
```

#### `createUserError(httpError)`

Marks an error as safe to show to users.

```typescript
import { createUserError } from '@/utils/errors'

// User made a mistake - show them the error
if (!captchaPassed) {
  throw createUserError(
    request.server.httpErrors.forbidden('Captcha validation failed')
  )
}

if (attempts >= 5) {
  throw createUserError(
    request.server.httpErrors.tooManyRequests(
      'Too many attempts. Try again later.'
    )
  )
}
```

### 2. Global Error Handler (`src/plugins/errorHandler.ts`)

The global error handler intercepts all errors and decides what to send to the client:

```typescript
export function errorHandler(
  error: FastifyError & { showToUser?: boolean; internalMessage?: string },
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Always log the error
  request.log.error(error, error.internalMessage || error.message)

  // If marked as internal error, send generic message
  if (error.showToUser === false) {
    return reply.status(error.statusCode || 500).send({
      statusCode: error.statusCode || 500,
      error: error.name,
      message: translate('errors.generic', request.defaultLanguage),
    })
  }

  // If marked as user error, send actual message
  if (error.showToUser === true) {
    return reply.status(error.statusCode || 400).send({
      statusCode: error.statusCode || 400,
      error: error.name,
      message: error.message,
    })
  }

  // Default behavior: hide 5xx, show 4xx
  if (error.statusCode && error.statusCode >= 500) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: 'Internal Server Error',
      message: translate('errors.generic', request.defaultLanguage),
    })
  }

  return reply.status(error.statusCode || 500).send({
    statusCode: error.statusCode || 500,
    error: error.name,
    message: error.message,
  })
}
```
