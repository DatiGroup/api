# Authentication Tokens Overview

This document explains authication flow.

## Overview

![Authentication Flow](./images/AuthFlow.jpg)

## Roles

Following roles will be defined in keyclock to mangage user portal access rights.

<table>
  <tr>
    <th>Role</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>portal-admin-user-view</td>
    <td>Allows to approve view portal users and their details</td>
  </tr>
  <tr>
    <td>portal-admin-user-edit</td>
    <td>Allows to approve new portal users, assign them roles</td>
  </tr> 
  <tr>
    <td>portal-admin-lookup-view</td>
    <td>Allows to view portal lookups</td>
  </tr>
  <tr>
    <td>portal-admin-lookup-edit</td>
    <td>Allows to edit portal lookups, e.g. add new values, update translation for no-seeded lookups</td>
  </tr>
  <tr>
    <td>portal-admin-products-view</td>
    <td>Allows to view products defined in portal, e.g. VMs</td>
  </tr>
  <tr>
    <td>portal-admin-products-edit</td>
    <td>Allows up update product definition, e.g. enable, disable, create new</td>
  </tr>
  <tr>
    <td>portal-client-view</td>
    <td>Default user roles, that allows access portal and use protal products </td>
  </tr>
   <tr>
    <td>portal-client-edit</td>
    <td>Limited user roles, that allows access portal in view mode - can't create new instances of products </td>
  </tr>
  </table>

Groups

<table>
  <tr>
    <th>Group</th>
    <th>Description</th>
  </tr> 
   <tr>
    <td>portal-client</td>
    <td>Has all portal client roles</td>
  </tr>
  <tr>
    <td>portal-admin</td>
    <td>Has all portal admin roles and client roles (clien+admin)</td>
  </tr>
 </table>

## Token Types

### 🔑 Access Token

- **Lifetime**: Short-lived (default ~5 minutes)
- **Format**: JWT that contains user identity + roles
- **Usage**: Sent in the `Authorization: Bearer <token>` header when calling backend APIs
- **Security**: Should never be trusted by frontend logic — backend must validate it

```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🔄 Refresh Token

- **Lifetime**: Longer-lived (default ~30 minutes)
- **Purpose**: Used to get a new `access_token` when the old one expires
- **Storage**: Should be kept securely (not in localStorage, better in memory or HTTP-only cookie if handled by backend)
- **Security**: Critical for maintaining user sessions without re-authentication

### 👤 ID Token

- **Status**: Optional (comes when using OpenID Connect)
- **Content**: Contains profile info (username, email, etc.)
- **Use Case**: Mostly useful on frontend for displaying user info without calling an API
- **Format**: JWT with user profile information

## Token Flow

## Best Practices

### ✅ Do:

- Store refresh tokens securely (HTTP-only cookies or secure storage)
- Validate access tokens on every API call
- Implement token refresh logic before access token expires
- Use HTTPS in production
- Log security events (failed authentications, token refresh, etc.)

### ❌ Don't:

- Store tokens in localStorage (XSS vulnerability)
- Trust token contents on frontend without backend validation
- Ignore token expiration times
- Send tokens over HTTP (non-encrypted connections)
- Log actual token values (security risk)

## API Endpoints

| Endpoint        | Method | Purpose             | Tokens Required |
| --------------- | ------ | ------------------- | --------------- |
| `/auth/login`   | POST   | User authentication | None            |
| `/auth/refresh` | POST   | Token refresh       | refresh_token   |
| `/auth/logout`  | POST   | User logout         | refresh_token   |

## Token Security

### Access Token Validation

- **Server-side only**: Never validate tokens on client-side
- **Signature verification**: Check JWT signature against Keycloak public keys
- **Expiration check**: Ensure token hasn't expired
- **Issuer validation**: Verify token was issued by trusted Keycloak instance

### Refresh Token Security

- **Single use**: Refresh tokens should be rotated after each use
- **Secure storage**: Use HTTP-only cookies or encrypted storage
- **Revocation**: Implement logout to invalidate refresh tokens
- **Monitoring**: Log refresh token usage for security auditing
