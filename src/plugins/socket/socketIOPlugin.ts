import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from 'fastify'
import fp from 'fastify-plugin'
import { DefaultEventsMap } from 'socket.io';
import { Redis } from "ioredis";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import _ from 'lodash';
import { authorizeTokenAndLoadUser } from '../keycloak/_authHelpers';
import { DEFAULT_AGENT } from '../agents';
import { RequestHeaderEnum } from '../../types/requestHeaderEnum';
import { SocketNsp } from './_socketType';
//import { createAdapter } from "@socket.io/redis-streams-adapter";

declare module 'fastify' {
    interface FastifyInstance {
        socket: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
    }
}

declare module 'socket.io' {
    interface Socket {
        userId?: number,
        agentCode?: string,
    }
}


const socketIOPlugin: FastifyPluginAsync = async (fastify: FastifyInstance, _options: FastifyPluginOptions) => {
    void _options; // prevent unused param warning

    try {

        const pubClient = new Redis({
            port: fastify.config.REDIS_PORT,
            host: fastify.config.REDIS_HOST,
            family: 4,           // 4(IPv4) or 6(IPv6)
            password: fastify.config.REDIS_PASSWORD,
            db: 0
        });


        const subClient = pubClient.duplicate();

        fastify.addHook('onReady', async function () {
            const allowedOrigins = fastify.config.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());

            const socket = new Server(fastify.server, {
                adapter: createAdapter(pubClient, subClient,),
                cors: {
                    origin: fastify.config.NODE_ENV === 'production' ? allowedOrigins : true,
                    credentials: true,
                },
                //  path: '/socket.io/',  // Explicitly set path
                // transports: ['websocket', 'polling'],  // Allow both transports
                // allowUpgrades: true,  // Allow protocol upgrades
                //  pingTimeout: 60000,
                // pingInterval: 25000,
            });

            fastify.decorate('socket', socket);

            console.log('socketIOPlugin  Server Ready');
            console.log(`   Namespaces: ${Object.keys(SocketNsp)}`);
            console.log(`   Listening on port: ${fastify.config.PORT || 3000}`);

            onConnection({ fastify, socket })
        })

        fastify.addHook('preClose', (done) => {
            console.log('socketIOPlugin on preClose');
            fastify.socket.local.disconnectSockets(true);
            done()
        });

        fastify.addHook('onClose', async (fastify) => {

            try {
                console.log('socketIOPlugin  onClose hooks');
                await fastify.socket.close();
            }
            catch (e) {
                console.error(e, 'socketIOPlugin failed fastify.socket.close');
            }
            try {

                await pubClient.quit();
            }
            catch (e) {
                console.error(e, 'socketIOPlugin failed to close pubClient');
            }
            try {
                await subClient.quit();
            }
            catch (e) {
                console.error(e, 'socketIOPlugin failed to close subClient');
            }
        });
        console.log('✅ SocketIOPlugin loaded');
    } catch (e) {
        console.error('⚠️  SocketIOPlugin not initialized:', e);
    }
}

export default fp(socketIOPlugin, { name: 'socketIOPlugin', dependencies: ['redis', 'agentPlugin', 'keycloak', 'configPlugin'] });



const onConnection = async ({ fastify, socket
}: {
    fastify: FastifyInstance,
    socket: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>
}) => {

    const nspList = _.keys(SocketNsp) || [];

    //connect to all defined namespaces
    await Promise.all(nspList.map(async (nsp: string) => {

        const mainSocket = socket.of(nsp);

        mainSocket.on("connection", async (socket: any) => {
            try {

                await socketAuth(fastify, socket);
                // join to rooms
                if (nsp === 'user') {
                    socket.join(`userId-${socket?.userId}`);
                    console.log(`User ${socket?.userId} has connected to "${nsp}" socket with socket id: ${socket.id}, rooms: ${`userId-${socket?.userId}`}`);
                }

            }
            catch (err) {
                console.error('Failed to authenticate/join socket for nsp', nsp, '- connection rejected:', err instanceof Error ? err.message : String(err));
                // Socket already disconnected in socketAuth, just log and exit
            }
        });
    }));
}


const socketAuth = async (fastify: FastifyInstance, socket: any) => {
    // Extract token from common Socket.IO locations
    const token = socket.handshake?.query?.token;
    if (!token) {
        console.error('Socket auth failed: missing token');
        socket.disconnect(true);
        throw new Error('Socket auth failed: missing token');
    }

    console.log('Socket auth: token received', token);

    // Resolve agent (same logic as agentPlugin onRequest) 
    const headerAgent = fastify.config.NODE_ENV === 'production'
        ? socket.handshake?.headers?.[RequestHeaderEnum.AGENT]
        : DEFAULT_AGENT;

    const requestAgent = typeof headerAgent === 'string' ? headerAgent : DEFAULT_AGENT;
    const agent = fastify.agentList?.find((p: any) => p.agentCode === requestAgent);
    if (!agent) {
        console.error('Socket auth failed: unknown agent', { requestAgent });
        socket.disconnect(true);
        throw new Error(`Socket auth failed: unknown agent ${requestAgent}`);
    }

    console.log('Socket auth: agent resolved', agent.agentCode);
    try {
        const { userObj } = await authorizeTokenAndLoadUser(fastify, token, agent);
        console.log('Socket auth: token authorized', { userId: userObj.userId });

        // Attach minimal context to socket
        socket.userId = userObj.userId;
        socket.agentCode = agent.agentCode;

        // Optionally keep full user in socket.data for handlers
        // socket.data = { ...(socket.data || {}), user: userObj };

    } catch (error) {
        console.error('Socket authorization failed:', error);
        socket.disconnect(true);
        throw new Error('Socket authorization failed: ' + (error instanceof Error ? error.message : String(error)));
    }
};
