import { DataSource, EntityManager } from 'typeorm';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Sequences, SequenceType } from '../../entities/public/sequences.entity';

declare module 'fastify' {
    interface FastifyInstance {
        commonObjects: {
            getSequence(ds: DataSource | EntityManager, agentId: number, type: SequenceType): Promise<string>,
        }
    }
}

const notes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    fastify.decorate('commonObjects', {
        async getSequence(ds: DataSource, agentId: number, type: SequenceType): Promise<string> {
            function FormatNumberLength(num: number, length: number) {
                let r = "" + num;
                while (r.length < length) {
                    r = "0" + r;
                }
                return r;
            }
            let result: string
            const lookup = await ds.getRepository(Sequences)
                .createQueryBuilder("sequence")
                .where("sequence.agentId = :agentId", { agentId: agentId })
                .andWhere("sequence.type = :type", { type: type })
                .getOne();
            if (lookup) {
                result = lookup.prefix + FormatNumberLength(lookup.value, (lookup.length - lookup.prefix.length));
                ds.getRepository(Sequences).update({ sequenceId: lookup.sequenceId }, { value: lookup.value + 1 })
            }
            return result
        }
    })
}

export default fp(notes, { name: 'commonObjects' });
