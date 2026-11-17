import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { ZodSchema } from 'zod';

/**
 * Zod validation plugin - adds a decorator to validate request data with Zod schemas
 * This ensures custom .refine() validators run properly
 */
const zodValidationPlugin: FastifyPluginAsync = async (fastify) => {

    /**
     * Creates a preValidation hook that validates request body with Zod schema
     * @param schema - Zod schema to validate against
     * @returns Fastify preValidation hook function
     */
    fastify.decorate('zodValidate', (schema: ZodSchema) => {
        return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
            const result = schema.safeParse(request.body);

            if (!result.success) {
                return reply.code(400).send({
                    message: result.error.issues[0].message,
                    errors: result.error.issues
                }) as any;
            }

            // Replace body with validated and transformed data
            request.body = result.data;
        };
    });

    console.log('✅ Zod validation plugin loaded');
};

export default fp(zodValidationPlugin, {
    name: 'zodValidationPlugin'
});

// TypeScript declaration merging
declare module 'fastify' {
    interface FastifyInstance {
        zodValidate: (schema: ZodSchema) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}
