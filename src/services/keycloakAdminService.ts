import { isEmpty } from 'lodash'
import { RequestStatusEnum, CrudReponseType } from '../sharedShema/response'
import { RoleGroupEnum } from '../types/role'
import { UserIAMDetails } from '../types/user'
// Dynamic import for ESM module
let KcAdminClient: any

async function getKeycloakAdminClient() {
  if (!KcAdminClient) {
    const module = await import('@keycloak/keycloak-admin-client')
    KcAdminClient = module.default
  }
  return KcAdminClient
}

export class KeycloakAdminService {
  private kcAdminClient: any
  private keycloakUrl: string
  private realm: string
  private clientId: string
  private clientSecret: string

  private constructor(
    keycloakUrl: string,
    realm: string,
    clientId: string,
    clientSecret: string,
  ) {
    this.keycloakUrl = keycloakUrl
    this.realm = realm
    this.clientId = clientId
    this.clientSecret = clientSecret
  }

  static async create(config: ConfigType): Promise<KeycloakAdminService> {
    const instance = new KeycloakAdminService(
      config.keycloakUrl,
      config.realm,
      config.clientId,
      config.clientSecret,
    )
    await instance.initializeClient()
    return instance
  }

  private async initializeClient(): Promise<void> {
    if (!this.kcAdminClient) {
      const KcAdminClient = await getKeycloakAdminClient()
      this.kcAdminClient = new KcAdminClient({
        baseUrl: this.keycloakUrl,
        realmName: this.realm,
      })
    }
  }

  /**
   * Authenticate with Keycloak using service account
   */
  private async authenticate(): Promise<void> {
    try {
      await this.kcAdminClient.auth({
        grantType: 'client_credentials',
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      })

      // Switch to the target realm after authentication
      // this.kcAdminClient.setConfig({ realmName: this.realm });
    } catch (error) {
      console.error('Keycloak authentication failed:', error)
      throw new Error('Failed to authenticate with Keycloak admin API')
    }
  }

  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    try {
      await this.authenticate()

      const existingUsers = await this.kcAdminClient.users.find({
        username: userData.username,
        exact: true,
      })

      if (existingUsers.length > 0) {
        const error = new Error(
          `User with username '${userData.username}' already exists`,
          { cause: 'errors.reg.userExists' },
        ) as any
        error.showToUser = true

        throw error
      }

      if (userData.email) {
        const existingEmailUsers = await this.kcAdminClient.users.find({
          email: userData.email,
          exact: true,
        })

        if (existingEmailUsers.length > 0) {
          const error = new Error(
            `User with email '${userData.email}' already exists`,
            { cause: 'errors.reg.emailExists' },
          ) as any
          error.showToUser = true

          throw error
        }
      }

      const newUser = await this.kcAdminClient.users.create({
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        enabled: userData.enabled,
        emailVerified: false,
      })

      const userId = newUser?.id
      if (!userId) {
        throw new Error('Failed to create user - no ID returned')
      }

      // Set password if provided
      if (userData.password) {
        await this.kcAdminClient.users.resetPassword({
          id: userId,
          credential: {
            temporary: false,
            type: 'password',
            value: userData.password,
          },
        })
      }

      const createdUser = await this.kcAdminClient.users.findOne({ id: userId })
      if (!createdUser) {
        throw new Error('User created but could not be retrieved')
      }

      const groups = await this.kcAdminClient.groups.find({
        search: RoleGroupEnum.user,
      })
      const group = groups.find((group: any) => group.name === RoleGroupEnum.user)

      if (group) {
        await this.kcAdminClient.users.addToGroup({
          id: userId,
          groupId: group.id,
        })
      } else {
        console.error(`Group '${RoleGroupEnum.user}' not found`)
      }

      return {
        id: createdUser.id!,
        username: createdUser.username!,
        email: createdUser.email || '',
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        realm: this.realm,
        keycloakUrl: this.keycloakUrl,
      }
    } catch (error) {
      console.error('Keycloak Error creating user:', error)
      throw error
    }
  }

  async findUser(userName: string) {
    await this.authenticate()

    try {
      const users = await this.kcAdminClient.users.find({
        username: userName,
        exact: true,
      })

      return users.length > 0 ? users[0] : null
    } catch (error) {
      console.error('Keycloak Error finding user:', error)
      throw error
    }
  }

  async changeStatusUserById(
    userId: string,
    action: 'enable' | 'disable',
  ): Promise<CrudReponseType> {
    await this.authenticate()

    try {
      // Direct lookup by ID - much faster
      const user = await this.kcAdminClient.users.findOne({ id: userId })

      if (!user) {
        throw new Error(`User with ID '${userId}' not found`)
      }

      if (action === 'disable' && !user.enabled) {
        return { message: RequestStatusEnum.SUCCESS } // Already disabled
      }
      if (action === 'enable' && user.enabled) {
        return { message: RequestStatusEnum.SUCCESS } // Already enabled
      }

      await this.kcAdminClient.users.update(
        { id: userId },
        { enabled: action === 'enable' ? true : false },
      )

      return { message: RequestStatusEnum.SUCCESS }
    } catch (error) {
      console.error('Keycloak Error enabling user by ID:', error)
      throw error
    }
  }

  async resetPasswordById(
    userId: string,
    password: string,
  ): Promise<CrudReponseType> {
    await this.authenticate()

    try {
      // Direct lookup by ID
      const user = await this.kcAdminClient.users.findOne({ id: userId })

      if (!user) {
        throw new Error(`User with ID '${userId}' not found`)
      }

      // Update password
      await this.kcAdminClient.users.resetPassword({
        id: userId,
        credential: {
          temporary: false,
          type: 'password',
          value: password,
        },
      })

      return { message: RequestStatusEnum.SUCCESS }
    } catch (error) {
      console.error('Keycloak Error updating user password by ID:', error)
      throw error
    }
  }

  async getUserIAMDetails(userId: string): Promise<UserIAMDetails> {
    await this.authenticate()

    try {
      // Check if user exists
      const user = await this.kcAdminClient.users.findOne({ id: userId })
      if (!user) {
        throw new Error(`User with ID '${userId}' not found`)
      }

      const userRoles = await this.kcAdminClient.users.listRealmRoleMappings({
        id: userId,
      })
      const userGroups = await this.kcAdminClient.users.listGroups({
        id: userId,
      })

      return {
        roles: userRoles.map((role: any) => role.name),
        groups: userGroups.map((group: any) => group.name),
        enabled: user.enabled,
      }
    } catch (error) {
      console.error('Error getting user roles:', error)
      throw error
    }
  }

  async addUserToGroup(
    userId: string,
    groupName: string,
  ): Promise<CrudReponseType> {
    await this.authenticate()

    try {
      // Check if user exists
      const user = await this.kcAdminClient.users.findOne({ id: userId })
      if (!user) {
        throw new Error(`User with ID '${userId}' not found`)
      }

      const groups = await this.kcAdminClient.groups.find({ search: groupName })
      const group = groups.find((g: any) => g.name === groupName)

      if (!group) {
        throw new Error(`Group '${groupName}' not found`)
      }

      const userGroups = await this.kcAdminClient.users.listGroups({
        id: userId,
      })
      const isInGroup = userGroups.some(
        (userGroup: any) => userGroup.id === group.id,
      )

      if (isInGroup) {
        return { message: RequestStatusEnum.SUCCESS }
      }

      await this.kcAdminClient.users.addToGroup({
        id: userId,
        groupId: group.id,
      })

      return { message: RequestStatusEnum.SUCCESS }
    } catch (error) {
      console.error('Error adding user to group:', error)
      throw error
    }
  }

  async changeUserGroups(
    userId: string,
    groups: { groupName: string; action: 'add' | 'remove' }[],
  ): Promise<{
    message: RequestStatusEnum
    addGroups?: string[]
    removeGroups?: string[]
  }> {
    await this.authenticate()

    // Check if user exists
    const user = await this.kcAdminClient.users.findOne({ id: userId })
    if (!user) {
      throw new Error(`User with ID '${userId}' not found`)
    }

    const allGroups = await this.kcAdminClient.groups.find()
    const userGroups = await this.kcAdminClient.users.listGroups({ id: userId })

    const addGroups = groups
      .filter(g => g.action === 'add')
      .map(p => p.groupName)
    const removeGroups = groups
      .filter(g => g.action === 'remove')
      .map(p => p.groupName)

    const removeFrom = userGroups.filter((ag: any) =>
      removeGroups.find(rg => rg === ag.name),
    )
    const addTo = addGroups
      .map(rg => allGroups.find((ag: any) => ag.name === rg))
      .filter((group): group is any => !!group)

    const removePromisses =
      removeFrom.map(async (group: any) => {
        await this.kcAdminClient.users.delFromGroup({
          id: userId,
          groupId: group.id,
        })
      }) || []

    const addPromises =
      addTo.map(async (group: any) => {
        await this.kcAdminClient.users.addToGroup({
          id: userId,
          groupId: group.id,
        })
      }) || []

    await Promise.all([...removePromisses, ...addPromises])

    return { message: RequestStatusEnum.SUCCESS, addGroups, removeGroups }
  }

  async removeUserFromGroupById(
    userId: string,
    groupName: string,
  ): Promise<CrudReponseType> {
    await this.authenticate()

    try {
      // Check if user exists
      const user = await this.kcAdminClient.users.findOne({ id: userId })
      if (!user) {
        throw new Error(`User with ID '${userId}' not found`)
      }

      // Find the group by name
      const groups = await this.kcAdminClient.groups.find({ search: groupName })
      const group = groups.find((g: any) => g.name === groupName)

      if (!group) {
        throw new Error(`Group '${groupName}' not found`)
      }

      // Check if user is in the group
      const userGroups = await this.kcAdminClient.users.listGroups({
        id: userId,
      })
      const isInGroup = userGroups.some(
        (userGroup: any) => userGroup.id === group.id,
      )

      if (!isInGroup) {
        return { message: RequestStatusEnum.SUCCESS }
      }

      // Remove user from group
      await this.kcAdminClient.users.delFromGroup({
        id: userId,
        groupId: group.id,
      })

      return { message: RequestStatusEnum.SUCCESS }
    } catch (error) {
      console.error('Error removing user from group:', error)
      throw error
    }
  }

  async getUserGroupsById(userId: string): Promise<{ groups: string[] }> {
    await this.authenticate()

    try {
      // Check if user exists
      const user = await this.kcAdminClient.users.findOne({ id: userId })
      if (!user) {
        throw new Error(`User with ID '${userId}' not found`)
      }

      // Get user's groups
      const userGroups = await this.kcAdminClient.users.listGroups({
        id: userId,
      })
      const groupNames = userGroups.map((group: any) => group.name)

      return { groups: groupNames }
    } catch (error) {
      console.error('Error getting user groups:', error)
      throw error
    }
  }

  /**
   * Delete user by ID from Keycloak
   */
  async deleteUserById(userId: string): Promise<CrudReponseType> {
    await this.authenticate()

    try {
      const user = await this.kcAdminClient.users.findOne({ id: userId })

      if (isEmpty(user)) {
        throw new Error(`User with ID '${userId}' not found`)
      }
      await this.kcAdminClient.users.del({ id: userId })
      return { message: RequestStatusEnum.SUCCESS }
    } catch (error) {
      console.error('Error deleting user by ID:', error)
      throw error
    }
  }

  /**
   * Delete user by username from Keycloak
   */
  async deleteUserByUserName(username: string): Promise<CrudReponseType> {
    await this.authenticate()

    try {
      const _user = await this.kcAdminClient.users.findOne({
        username: username,
      })

      const user = _user?.length > 0 ? _user[0] : undefined
      if (isEmpty(user)) {
        throw new Error(`User with username '${username}' not found`)
      }

      await this.kcAdminClient.users.del({ id: user.id })
      return { message: RequestStatusEnum.SUCCESS }
    } catch (error) {
      console.error('Error deleting user by username:', error)
      throw error
    }
  }
}

/**
 * Factory function to create KeycloakAdminService instance
 */
export async function createKeycloakAdminService(
  config: ConfigType,
): Promise<KeycloakAdminService> {
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

  // Validate URL format
  try {
    new URL(config.keycloakUrl)
  } catch {
    throw new Error('keycloakUrl must be a valid URL')
  }
  return await KeycloakAdminService.create(config)
}

export interface CreateUserRequest {
  username: string
  email: string
  firstName: string
  lastName: string
  enabled: boolean
  password?: string
  emailVerified?: boolean
}

export interface UserResponse {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  realm: string
  keycloakUrl: string
}

export interface ConfigType {
  keycloakUrl: string
  clientId: string
  clientSecret: string
  realm: string
}
