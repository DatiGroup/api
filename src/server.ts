import buildFastifyApp from './app'
import { safeErrorMessage } from './utils/errors'
import { ConfigType } from './plugins/config'
import 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    config: ConfigType
    orm: any
  }
}

const start = async () => {
  const app = await buildFastifyApp()

  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  signals.forEach(signal => {
    process.on(signal, async () => {
      try {
        await app.close()
        app.log.error(`Closed application on ${signal}`)
        process.exit(0)
      } catch (err) {
        const errorMessage = safeErrorMessage(
          err,
          `Error closing application on ${signal}`,
        )
        app.log.error(errorMessage)
        process.exit(1)
      }
    })
  })

  try {
    await app.listen({ port: app.config.LISTEN_PORT, host: app.config.HOST })
    console.log(
      `Server is running on http://${app.config.HOST}:${app.config.LISTEN_PORT}`,
    )
    console.log(
      `Swagger is running on http://${app.config.HOST}:${app.config.LISTEN_PORT}/docs`,
    )

    //     const namespace = '7cbdb712-b5d0-42ba-8382-0a836f4660ab'
    // const source = RagGroupMemberEnum.NEXTCLOUD // 'NEXTCLOUD'
    // const folderID = ...

    // const uniqueId = uuidv5(`${source}:${String(folderID)}`, namespace)
  } catch (err) {
    const errorMessage = safeErrorMessage(err, 'Failed to start server')
    app.log.error(errorMessage)
    process.exit(1)
  }
}

start()
