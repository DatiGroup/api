
import { FastifyRequest } from "fastify";
import { Terms } from "../../../../entities/public/terms.entity";

export async function termsHandler(request: FastifyRequest) {

    const agentId = request.agent?.agentId;
    const selectedLanguage = request.defaultLanguage || 'en';

    if (!agentId) {
        throw new Error('Agent ID is required');
    }

    const termsRepository = request.server.orm["typeorm"].getRepository(Terms);

    // Query for active terms using QueryBuilder with COALESCE
    const activeTerms = await termsRepository
        .createQueryBuilder('terms')
        .where('terms.agentId = :agentId', { agentId })
        .andWhere('terms.languageCode = :languageCode', { languageCode: selectedLanguage })
        .andWhere('now() between terms.startDateActive and COALESCE(terms.endDateActive, now())')
        .orderBy('terms.type', 'ASC')
        .addOrderBy('terms.startDateActive', 'DESC')
        .getMany();

    console.log(activeTerms);


    // If multiple terms are active with the same type, keep only the most recent one
    const termsMap = new Map<string, Terms>();
    for (const term of activeTerms) {
        const existingTerm = termsMap.get(term.type);
        if (!existingTerm || term.startDateActive > existingTerm.startDateActive) {
            termsMap.set(term.type, term);
        }
    }

    return Array.from(termsMap.values());
} 
