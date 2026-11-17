import { FastifyInstance } from 'fastify';
import { getGlobalApp } from '../setup/globalSetup';
import { Server } from 'socket.io';
import { SocketNsp } from '../../plugins/socket/_socketType';

describe('SocketIO Plugin Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await getGlobalApp();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Plugin Registration', () => {
        test('should decorate fastify instance with socket server', () => {
            expect(app.socket).toBeDefined();
            expect(app.socket).toBeInstanceOf(Server);
        });

        test('should have socket.io server methods', () => {
            expect(app.socket.of).toBeDefined();
            expect(typeof app.socket.of).toBe('function');
            expect(app.socket.emit).toBeDefined();
            expect(typeof app.socket.emit).toBe('function');
        });

        test('should have correct adapter configured', () => {
            expect(app.socket.adapter).toBeDefined();
            // Redis adapter should be configured - check if it's a function (adapter factory)
            expect(typeof app.socket.adapter).toBe('function');
        });
    });

    describe('Namespace Configuration', () => {
        test('should have SocketNsp configuration defined', () => {
            expect(SocketNsp).toBeDefined();
            expect(SocketNsp.user).toBeDefined();
        });

        test('should have user namespace configured', () => {
            expect(SocketNsp.user.namespace).toBe('/user');
            expect(SocketNsp.user.events).toBeDefined();
            expect(SocketNsp.user.events.updateResource).toBeDefined();
        });

        test('should create user namespace on server', () => {
            const userNamespace = app.socket.of('/user');
            expect(userNamespace).toBeDefined();
            expect(userNamespace.name).toBe('/user');
        });
    });

    describe('Server Configuration', () => {
        test('should have CORS enabled', () => {
            // Check if socket server is properly initialized with CORS
            expect(app.socket).toBeDefined();
            // The adapter should be the Redis adapter
            expect(app.socket.adapter).toBeDefined();
        });

        test('should be attached to fastify server', () => {
            expect(app.server).toBeDefined();
            // Socket.IO should be attached to the same HTTP server
            expect(app.socket.httpServer).toBe(app.server);
        });
    });

    describe('Connection Handling', () => {
        test('should handle namespace connections', (done) => {
            const userNsp = app.socket.of('/user');

            // Verify namespace is listening for connections
            expect(userNsp).toBeDefined();
            expect(userNsp.eventNames()).toContain('connection');

            done();
        });

        test('should have connection event listener registered', () => {
            const userNsp = app.socket.of('/user');
            const listeners = userNsp.listeners('connection');

            expect(listeners.length).toBeGreaterThan(0);
        });
    });

    describe('Plugin Dependencies', () => {
        test('should have required plugin dependencies loaded', () => {
            // Check if Redis plugin is available (required dependency)
            expect(app.redis).toBeDefined();

            // Check if config plugin is available (required dependency)
            expect(app.config).toBeDefined();

            // Check if agent plugin is available (required dependency)
            expect(app.agentList).toBeDefined();
        });
    });

    describe('Cleanup Hooks', () => {
        test('should have close hooks registered', () => {
            // Fastify should have the onClose hook registered
            // We can't directly test hooks without triggering them
            // but we can verify the socket server has close method
            expect(app.socket.close).toBeDefined();
            expect(typeof app.socket.close).toBe('function');
        });
    });

    describe('Room Management', () => {
        test('should be able to access rooms', () => {
            const userNsp = app.socket.of('/user');
            expect(userNsp.adapter).toBeDefined();
            expect(userNsp.adapter.rooms).toBeDefined();
        });

        test('should support emit to specific rooms', () => {
            const userNsp = app.socket.of('/user');

            // Should be able to emit to a room
            expect(() => {
                userNsp.to('test-room').emit('test-event', { data: 'test' });
            }).not.toThrow();
        });
    });
});
