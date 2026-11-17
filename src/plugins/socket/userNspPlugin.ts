
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { SocketNsp, UserSocketEventEnum } from './_socketType';

declare module 'fastify' {
    interface FastifyInstance {
        userNsp: {
            update({ eventType, userIds }: {
                eventType: UserSocketEventEnum,
                userIds: number[],
            }): Promise<void>,
        }
    }
}


const userNspPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    try {
        fastify.decorate('userNsp', {
            async update({ eventType, userIds }: { eventType: UserSocketEventEnum, userIds: number[] }) {
                const sentTo = userIds.map(p => `userId-${p}`);
                console.log('SOCKET send to ' + sentTo + ' ' + eventType);
                fastify.socket.of(SocketNsp.user.namespace).to(sentTo).emit(eventType);
            },

        })
        console.log('✅ UserNsp Plugin loaded');
    } catch (e) {
        console.warn('⚠️  UserNsp Plugin not initialized:', e);
        throw new Error('Failed to register userNsp Plugin')
    }
}

export default fp(userNspPlugin, { name: 'userNspPlugin', dependencies: ['socketIOPlugin'] });

