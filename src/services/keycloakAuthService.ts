import axios from 'axios'
import Keycloak from 'keycloak-connect'

export class KeycloakAuthService {
  private keycloak: Keycloak.Keycloak
  private keycloakUrl: string
  private realm: string
  private clientId: string
  private clientSecret: string
  private apiScope: string

  private constructor(
    keycloakUrl: string,
    realm: string,
    clientId: string,
    clientSecret: string,
    apiScope: string,
  ) {
    this.keycloakUrl = keycloakUrl
    this.realm = realm
    this.clientId = clientId
    this.clientSecret = clientSecret
    this.apiScope = apiScope
  }

  static async create(config: ConfigType): Promise<KeycloakAuthService> {
    const instance = new KeycloakAuthService(
      config.keycloakUrl,
      config.realm,
      config.clientId,
      config.clientSecret,
      config.apiScope,
    )
    await instance.initializeClient()
    return instance
  }

  private async initializeClient(): Promise<void> {
    if (!this.keycloak) {
      const keycloakConfig = {
        realm: this.realm,
        'auth-server-url': this.keycloakUrl,
        'ssl-required': 'external' as const,
        resource: this.clientId,
        'public-client': false,
        'confidential-port': 0,
        credentials: {
          secret: this.clientSecret,
        },
      }

      const memoryStore = new Map()
      this.keycloak = new Keycloak(
        {
          store: memoryStore as any,
        },
        keycloakConfig,
      )
    }
  }

  public getKeycloakInstance(): Keycloak.Keycloak {
    if (!this.keycloak) {
      throw new Error('Keycloak not initialized')
    }
    return this.keycloak
  }

  /**
   * Authenticate user with username and password
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`

      const params = new URLSearchParams()
      params.append('grant_type', 'password')
      params.append('client_id', this.clientId)
      params.append('client_secret', this.clientSecret)
      params.append('scope', this.apiScope)
      params.append('username', username)
      params.append('password', password)

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          const customError = new Error('Invalid username or password', {
            cause: 'errors.auth.invalidCredentials',
          }) as any
          customError.showToUser = true

          throw customError
        }
        if (error.response?.status === 400) {
          throw new Error('Bad request - check client configuration')
        }
        // console.error(error.response?.data)
        throw new Error(
          `Authentication failed: ${error.response?.data?.error || error.response?.data?.error_description}`,
        )
      }

      throw new Error('Authentication service unavailable')
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    try {
      const tokenUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`

      const params = new URLSearchParams()
      params.append('grant_type', 'refresh_token')
      params.append('client_id', this.clientId)
      params.append('client_secret', this.clientSecret)
      params.append('refresh_token', refreshToken)

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          throw new Error('Invalid refresh token')
        }
        throw new Error(
          `Token refresh failed: ${error.response?.data?.error_description || error.message}`,
        )
      }
      throw new Error('Token refresh service unavailable')
    }
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const logoutUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`

      const params = new URLSearchParams()
      params.append('client_id', this.clientId)
      params.append('client_secret', this.clientSecret)
      params.append('refresh_token', refreshToken)

      await axios.post(logoutUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Logout failed: ${error.response?.data?.error_description || error.message}`,
        )
      }
      throw new Error('Logout service unavailable')
    }
  }

  /**
   * Get user info from access token
   */
  async getUserInfo(accessToken: string): Promise<TokenUserInfo> {
    try {
      const userInfoUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`

      const response = await axios.get(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid or expired token')
        }
        throw new Error(
          `Failed to get user info: ${error.response?.data?.error_description || error.message}`,
        )
      }
      throw new Error('User info service unavailable')
    }
  }

  /**
   * Validate access token using introspection endpoint (recommended)
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const introspectUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token/introspect`

      const params = new URLSearchParams()
      params.append('token', accessToken)
      params.append('client_id', this.clientId)
      params.append('client_secret', this.clientSecret)

      const response = await axios.post(introspectUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      // Token introspection returns { active: true/false }
      return response.data.active === true
    } catch (error) {
      console.error('Token validation failed:', error)
      return false
    }
  }

  /**
   * Alternative: Validate token by attempting to get user info
   * Less efficient but works if introspection endpoint is not available
   */
  async validateTokenViaUserInfo(accessToken: string): Promise<boolean> {
    try {
      await this.getUserInfo(accessToken)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get detailed token information (includes validation + metadata)
   * Useful when you need both validation AND token details
   */
  async getTokenInfo(
    accessToken: string,
  ): Promise<{ active: boolean; [key: string]: any }> {
    try {
      const introspectUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token/introspect`

      const params = new URLSearchParams()
      params.append('token', accessToken)
      params.append('client_id', this.clientId)
      params.append('client_secret', this.clientSecret)

      const response = await axios.post(introspectUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      return response.data
    } catch (error) {
      console.error('Token introspection failed:', error)
      return { active: false }
    }
  }
}

/**
 * Factory function to create KeycloakAuthService instance
 */
export async function createKeycloakAuthService(
  config: ConfigType,
): Promise<KeycloakAuthService> {
  // Validate all required config fields
  if (!config.keycloakUrl) {
    throw new Error('keycloakUrl is required')
  }
  if (!config.realm) {
    throw new Error('realm is required')
  }
  if (!config.clientId) {
    throw new Error('clientId is required')
  }
  if (!config.clientSecret) {
    throw new Error('clientSecret is required')
  }
  if (!config.apiScope) {
    throw new Error('apiScope is required')
  }

  // Validate URL format
  try {
    new URL(config.keycloakUrl)
  } catch {
    throw new Error('keycloakUrl must be a valid URL')
  }
  return await KeycloakAuthService.create(config)
}

export interface ConfigType {
  keycloakUrl: string
  realm: string
  clientId: string
  clientSecret: string
  apiScope: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  refresh_expires_in: number
  scope: string
}

export interface TokenUserInfo {
  sub: string
  preferred_username: string
  email?: string
  given_name?: string
  family_name?: string
  realm_access?: {
    roles: string[]
  }
}
