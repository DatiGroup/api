import { FastifyInstance } from 'fastify'
import buildFastifyApp from '../../app'
import { testAdminUser, testUser, TestUserType } from '../utils/testData'
import { isEmpty } from 'lodash'
import { RegisterPayloadType } from '../../routes/v1/api/register/registerSchema'
import { RoleGroupEnum } from '../../types/role'
import { Users } from '../../entities/public/users.entity'
import { ApprovalRequestStatusEnum } from '../../types/ApprovalRequestStatusEnum'

let globalApp: FastifyInstance | null = null


// Put here global mocks for all tests
async function builtTestApp({ enableRateLimit }: { enableRateLimit?: boolean } = {}): Promise<FastifyInstance> {

  // Enable rate limit in tests if requested
  if (enableRateLimit) {
    process.env.ENABLE_RATE_LIMIT_IN_TESTS = 'true';
  }
  const app = await buildFastifyApp()

  // Mock hcaptchaService to always return true
  app.services.hcaptchaService.verifyHcaptcha = jest
    .fn()
    .mockResolvedValue(true)

  await app.ready()

  globalApp = app

  return app
}


// THIS IS USER by npm run pretest - creates test users before running any test
// is itun in pure node neviroment - no jest parts
export async function initializePretest() {
  const app = await buildFastifyApp()

  app.services.hcaptchaService.verifyHcaptcha = async () => true
  await app.ready()

  globalApp = app
  await setupTestUser(app, testUser, [RoleGroupEnum.user])
  await setupTestUser(app, testAdminUser, [RoleGroupEnum.admin, RoleGroupEnum.integrationGroup])

  app.close();
}

//helper function to create test user
async function setupTestUser(
  app: FastifyInstance,
  newTestUser: TestUserType,
  group?: RoleGroupEnum[],
) {
  try {
    console.log('🔑 Ensuring test user exists in Keycloak...', newTestUser.userName);
    const keycloakAdminService = app.agentList.find(
      a => a.agentCode === newTestUser.agent,
    )?.keycloakAdminService
    // console.log('🔑 Ensuring test user exists in Keycloak...', newTestUser.userName);
    const user = await keycloakAdminService.findUser(newTestUser.userName)

    console.log(`👤 Test user ${newTestUser.userName} exists: ${!isEmpty(user)}`);
    if (isEmpty(user)) {

      console.log(`👤 Creating test user in Keycloak: ${newTestUser.userName}...`);

      await app.inject({
        method: 'POST',
        url: '/v1/api/register',
        headers: {
          'platform-agent': newTestUser.agent,
        },
        body: {
          userName: newTestUser.userName,
          password: newTestUser.password,
          repeatPassword: newTestUser.password,
          email: newTestUser.email,
          firstName: newTestUser.firstName,
          lastName: newTestUser.lastName,
          preferredLang: newTestUser.preferredLang,
          recaptchaToken: 'test-token',
          organizationName: `${newTestUser.firstName}ORG`,
          registrationNumber: newTestUser.firstName,
          country: 'lv',
          contactName: 'Test',
          contactLastName: 'Last',
          contactEmail: `${newTestUser.firstName}@dummy.test`,
        } as RegisterPayloadType
      });


      if (!isEmpty(group)) {
        console.log(`👤 Adding test user to groupsin Keycloak...`, group);
        const createdUser = await keycloakAdminService.findUser(
          newTestUser.userName,
        )

        if (!isEmpty(createdUser)) {
          console.log(`👤 Adding test user to groups ${group} in Keycloak...`);
          for (const g of group) {
            await keycloakAdminService.addUserToGroup(createdUser.id, g)
            console.log(`👤 Added test user to group ${g} in Keycloak...`);
          }
        }
        else {
          console.log(`⚠️  Could not find test user ${newTestUser.userName} to add to groups`);
        }
      }


      const userRepo = app.orm['typeorm'].getRepository(Users)
      const dbUser = await userRepo.findOne({
        where: { userName: newTestUser.userName },
      })
      if (dbUser.approvalStatus !== ApprovalRequestStatusEnum.APPROVED) {
        dbUser.approvalStatus = ApprovalRequestStatusEnum.APPROVED
        await userRepo.save(dbUser)
      }
      console.log(`👤changeStatusUserById for user ${newTestUser.userName}`);
      await keycloakAdminService.changeStatusUserById(dbUser.externalUserId, 'enable');

    }
  } catch (e) {
    console.error(`⚠️  Could not set up test user: ${JSON.stringify(newTestUser)}`, e)
  }
}

export async function teardownGlobalApp(): Promise<void> {
  if (globalApp) {
    // console.log('🧹 Closing global Fastify app...')
    await globalApp.close()
    globalApp = null
    // console.log('✅ Global Fastify app closed')
  }
}

// Add process exit handler to ensure cleanup
process.on('exit', () => {
  if (globalApp) {
    // console.log('🧹 Process exit - cleaning up Fastify app...')
  }
})

process.on('SIGINT', async () => {
  await teardownGlobalApp()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await teardownGlobalApp()
  process.exit(0)
})

export async function getGlobalApp({ enableRateLimit }: { enableRateLimit?: boolean } = {}): Promise<FastifyInstance> {
  if (!globalApp) {
    return await builtTestApp({ enableRateLimit })
  }
  return globalApp
}
