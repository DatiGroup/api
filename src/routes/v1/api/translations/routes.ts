import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { RoleEnum } from "../../../../types/role";
import { SwaggerSectionTags } from "../../../../manual/swagger";
import zodToJsonSchema from "zod-to-json-schema";
import { googleTranslateDTOSchema, googleTranslateSchema } from "./schema";
import { googleTranslateHandler } from "./handler";

const TranslationRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    const server = fastify;

    server.post('/google-translate', {
        onRequest: server.protect([RoleEnum.portalAdminLookupEdit]),
        schema: {
            tags: [SwaggerSectionTags.translations.name],
            body: zodToJsonSchema(googleTranslateSchema),
            response: {
                200: zodToJsonSchema(googleTranslateDTOSchema)
            }
        },
        handler: googleTranslateHandler
    })
}

export default TranslationRoutes;