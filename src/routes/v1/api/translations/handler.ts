import { FastifyRequest } from "fastify";
import { GoogleTranslateDTOSchema, GoogleTranslateSchema } from "./schema";
import { HttpError } from "@fastify/sensible/lib/httpError";
import { translate } from "../../../../utils/translate";

export async function googleTranslateHandler(
    request: FastifyRequest<{ Body: GoogleTranslateSchema }>):
    Promise<GoogleTranslateDTOSchema | HttpError> {

    const { q, source, target, format } = request.body;
    const { config } = request.server;

    try {
        const response: GoogleTranslateDTOSchema = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${config.GOOGLE_TRANSLATE_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                q,
                source,
                target,
                format
            })
        });

        if (!response.ok) throw request.server.httpErrors.badRequest(translate('errors.translations.apiError', request.defaultLanguage));

        return response.json();
    }
    catch (err) {
        request.log.error(err, 'Error while calling Google Translate API')
        throw request.server.httpErrors.badRequest(translate('errors.translations.apiError', request.defaultLanguage));
    }
}

