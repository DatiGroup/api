import { FastifyError, FastifyRequest } from 'fastify';
import { HttpError } from '@fastify/sensible/lib/httpError';
import '@fastify/sensible';
import { translate } from './translate';

/**
 * Handles axios errors and throws appropriate Fastify HTTP errors
 * @param error - The caught error from axios request
 * @param request - Fastify request for httpErrors, logging, and language
 * @param context - Context for logging (e.g., 'RAG service', 'Translation API')
 * @param errorMessages - Custom error message translation keys
 */
export function handleAxiosError(
    error: any,
    request: FastifyRequest,
    context: string,
    errorMessages?: {
        badGateway?: string;
        serviceUnavailable?: string;
        internalError?: string;
    }
): never {
    request.log.error({ err: error, context }, `Failed to communicate with ${context}`);

    const lang = (request as any).defaultLanguage || 'en';

    const messages = {
        badGateway: translate(
            errorMessages?.badGateway || 'errors.badGateway',
            lang
        ),
        serviceUnavailable: translate(
            errorMessages?.serviceUnavailable || 'errors.serviceUnavailable',
            lang
        ),
        internalError: translate(
            errorMessages?.internalError || 'errors.internalError',
            lang
        )
    };

    if (error.response) {
        request.log.error({
            err: error,
            status: error.response.status,
            data: error.response.data
        }, `${context} responded with error`);
        throw createUserError(request.server.httpErrors.badGateway(messages.badGateway));
    }

    if (error.request) {
        throw createUserError(request.server.httpErrors.serviceUnavailable(messages.serviceUnavailable));
    }

    throw createUserError(request.server.httpErrors.internalServerError(messages.internalError));
}

/**
 * Safely extracts an error message from any unknown error type
 * @param error - The caught error (can be anything)
 * @param fallback - Default message if error cannot be parsed
 * @returns A safe string representation of the error
 */
export function safeErrorMessage(error: unknown, fallback = 'An error occurred'): string {
    // Standard Error object
    if (error instanceof Error) {
        return error.message;
    }

    // String error
    if (typeof error === 'string') {
        return error;
    }

    // Object with message property
    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }

    // Fallback for any other type
    return fallback;
}

/**
 * Marks a Fastify HTTP error as user-facing (should be shown to the user)
 * @param httpError - The Fastify HTTP error to mark
 * @returns The same error with showToUser flag set to true
 */
export function createUserError(httpError: HttpError | FastifyError): HttpError | FastifyError {
    (httpError as any).showToUser = true;
    return httpError;
}
