const zodToJsonSchema = require('zod-to-json-schema').default;
const { z } = require('zod');

const updateDependencySchema = z.object({
    resourceType: z.string().max(100).optional(),
    parentResourceType: z.string().max(100).optional().nullable(),
    relationshipType: z.string().optional(),
    endDateActive: z.coerce.date().optional().nullable(),
});

console.log('Schema without .strict():');
console.log(JSON.stringify(zodToJsonSchema(updateDependencySchema), null, 2));

const updateDependencySchemaStrict = z.object({
    resourceType: z.string().max(100).optional(),
    parentResourceType: z.string().max(100).optional().nullable(),
    relationshipType: z.string().optional(),
    endDateActive: z.coerce.date().optional().nullable(),
}).strict();

console.log('\n\nSchema with .strict():');
console.log(JSON.stringify(zodToJsonSchema(updateDependencySchemaStrict), null, 2));
