import { Users } from '../entities/public/users.entity'
import { DataSource } from 'typeorm'
import { FastifyInstance } from 'fastify'
import { UserProfile } from '../entities/public/users.profile.entity'
import { UserOrganization } from '../entities/public/user.organizations.entity'
import { UserRelationship } from '../entities/public/user.relationships.entity'
import { ApprovalRequestStatusEnum } from '../types/ApprovalRequestStatusEnum'
type UserWithProfile = Users & {
  profile: UserProfile | null
}

export class UserService {
  constructor(
    protected readonly orm: DataSource,
    protected readonly fastify: FastifyInstance,
  ) {}

  private repository = this.orm.getRepository(Users)
  private repositoryRel = this.orm.getRepository(UserRelationship)

  public async getUserDetails({
    userName,
    agentId,
  }: {
    userName: string
    agentId: number
  }) {
    return await this.repository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.agent', 'agent')
      .where('users.userName = :userName', { userName })
      .andWhere(
        '(users.endDateActive > CURRENT_DATE or users.endDateActive  is null ) ',
      )
      .andWhere('users.agentId = :agentId ', { agentId: agentId })
      .andWhere(
        '(agent.endDateActive > CURRENT_DATE or agent.endDateActive  is null ) ',
      )
      .getOne()
  }

  public async getUserDetailsByEmail({
    email,
    agentId,
  }: {
    email: string
    agentId: number
  }) {
    return await this.repository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.profile', 'profile')
      .leftJoin('users.agent', 'agent')
      .where('users.email = :email', { email })
      .andWhere(
        '(users.endDateActive > CURRENT_DATE or users.endDateActive  is null ) ',
      )
      .andWhere('users.agentId = :agentId ', { agentId: agentId })
      .andWhere(
        '(agent.endDateActive > CURRENT_DATE or agent.endDateActive  is null ) ',
      )
      .getOne()
  }

  public async findUser(userName: string, agentId: number) {
    return await this.repository
      .createQueryBuilder('users')
      .where('users.userName = :userName', { userName: userName })
      .andWhere('users.agentId = :agentId ', { agentId: agentId })
      .getOne()
  }

  public async findUserProfile({
    userId,
    agentId,
  }: {
    userId: number
    agentId: number
  }): Promise<UserWithProfile | null> {
    return (await this.repository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.profile', 'profile')
      .where('users.userId = :userId', { userId })
      .andWhere('users.agentId = :agentId ', { agentId: agentId })
      .getOne()) as UserWithProfile | null
  }

  public async getActiveOrg({ userId }: { userId: number }) {
    const userRel = await this.repositoryRel
      .createQueryBuilder('rel')
      .leftJoinAndSelect('rel.userOrganization', 'userOrganization')
      .where('rel.userId = :userId', { userId: userId })
      .andWhere(
        'now() between rel.startDateActive and COALESCE(rel.endDateActive, now())',
      )
      .getMany()

    return userRel
  }

  public async getActiveOrgRelation({
    userId,
    orgId,
  }: {
    userId: number
    orgId: number
  }): Promise<UserRelationship | null> {
    const userRel = await this.repositoryRel
      .createQueryBuilder('rel')
      .leftJoinAndSelect('rel.userOrganization', 'userOrganization')
      .where('rel.userOrganizationId = :userOrgId', { userOrgId: orgId })
      .andWhere('rel.userId = :userId', { userId: userId })
      .andWhere(
        'now() between rel.startDateActive and COALESCE(rel.endDateActive, now())',
      )
      .getOne()

    return userRel
  }

  public async createUser(payload: CreateUserBody, agentId: number) {
    const existingUser = await this.findUser(payload.userName, agentId)

    if (existingUser) {
      const error = new Error('User already exists', {
        cause: 'errors.reg.userExists',
      }) as any
      error.showToUser = true

      throw error
    }

    return await this.orm.transaction(async manager => {
      const userRepo = manager.getRepository(Users)
      const profileRepo = manager.getRepository(UserProfile)
      const organizationRepo = manager.getRepository(UserOrganization)
      const userRelRepo = manager.getRepository(UserRelationship)

      // Create and save user
      const newUser = userRepo.create({
        agentId,
        userName: payload.userName,
        email: payload.email,
        externalUserId: payload.externalUserId,
        externalSource: payload.externalSource,
        startDateActive: new Date(),
        createdBy: -1,
        updatedBy: -1,
      })

      const savedUser = await userRepo.save(newUser)

      if (!savedUser.userId) {
        const error = new Error('Failed to create user', {
          cause: 'errors.reg.userCreationFailed',
        }) as any
        error.showToUser = true

        throw error
      }

      // Create and save profile
      const newUserProfile = profileRepo.create({
        userId: savedUser.userId,
        firstName: payload?.firstName,
        lastName: payload?.lastName,
        preferredLang:
          payload?.preferredLang ?? this.fastify.config.DEFAULT_LANG,
        createdBy: -1,
        updatedBy: -1,
      })

      await profileRepo.save(newUserProfile)

      const existingOrganization = await organizationRepo.findOne({
        where: {
          registrationNumber: payload?.registrationNumber,
          country: payload?.country,
        },
      })

      if (existingOrganization) {
        const error = new Error('Organization already registered', {
          cause: 'errors.reg.orgExists',
        }) as any
        error.showToUser = true

        throw error
      }

      const newOrg = organizationRepo.create({
        name:
          payload?.organizationName ||
          `${payload.firstName} ${payload.lastName}`,
        rootUserId: savedUser.userId,
        registrationNumber: payload?.registrationNumber,
        country: payload?.country,
        contactEmail: payload?.contactEmail,
        contactName: payload?.contactName,
        contactLastName: payload?.contactLastName,
        startDateActive: new Date(),
        createdBy: -1,
        updatedBy: -1,
      })

      await organizationRepo.save(newOrg)

      const userRel = userRelRepo.create({
        userId: savedUser.userId,
        userOrganizationId: newOrg.userOrganizationId,
        startDateActive: new Date(),
        createdBy: -1,
        updatedBy: -1,
      })

      await userRelRepo.save(userRel)

      return savedUser
    })
  }

  public async createOrgMember(payload: CreateOrgMemberBody, agentId: number) {
    const existingUser = await this.findUser(payload.userName, agentId)
    if (existingUser) {
      throw new Error('User already exists', { cause: 'USER_EXISTS' })
    }

    return await this.orm.transaction(async manager => {
      const userRepo = manager.getRepository(Users)
      const profileRepo = manager.getRepository(UserProfile)
      const userRelRepo = manager.getRepository(UserRelationship)

      // Create and save user
      const newUser = userRepo.create({
        agentId,
        userName: payload.userName,
        email: payload.email,
        externalUserId: payload.externalUserId,
        externalSource: payload.externalSource,
        startDateActive: new Date(),
        approvalStatus: ApprovalRequestStatusEnum.INVITE,
        createdBy: -1,
        updatedBy: -1,
      })

      const savedUser = await userRepo.save(newUser)

      if (!savedUser.userId) {
        throw new Error('Failed to create user', {
          cause: 'USER_CREATION_FAILED',
        })
      }

      // Create and save profile
      const newUserProfile = profileRepo.create({
        userId: savedUser.userId,
        firstName: payload?.firstName,
        lastName: payload?.lastName,
        preferredLang:
          payload?.preferredLang ?? this.fastify.config.DEFAULT_LANG,
        createdBy: -1,
        updatedBy: -1,
      })

      await profileRepo.save(newUserProfile)

      const userRel = userRelRepo.create({
        userId: savedUser.userId,
        userOrganizationId: payload.userOrganizationId,
        startDateActive: new Date(),
        createdBy: -1,
        updatedBy: -1,
      })

      await userRelRepo.save(userRel)

      return savedUser
    })
  }
}

interface CreateUserBody {
  userName: string
  email: string
  externalUserId: string
  externalSource: string
  firstName?: string
  lastName?: string
  preferredLang?: string
  registrationNumber?: string
  organizationName?: string
  country?: string
  contactName?: string
  contactLastName?: string
  contactEmail?: string
}

interface CreateOrgMemberBody {
  userOrganizationId: number
  userName: string
  email: string
  externalUserId: string
  externalSource: string
  firstName: string
  lastName: string
  preferredLang: string
}
