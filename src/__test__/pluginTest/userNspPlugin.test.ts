import { FastifyInstance } from 'fastify';
import { getGlobalApp } from '../setup/globalSetup';
import { UserSocketEventEnum, SocketNsp } from '../../plugins/socket/_socketType';

describe('UserNsp Plugin Tests', () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        app = await getGlobalApp();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Plugin Registration', () => {
        test('should decorate fastify instance with userNsp', () => {
            expect(app.userNsp).toBeDefined();
            expect(typeof app.userNsp).toBe('object');
        });

        test('should have update method on userNsp', () => {
            expect(app.userNsp.update).toBeDefined();
            expect(typeof app.userNsp.update).toBe('function');
        });
    });

    describe('UserSocketEventEnum', () => {
        test('should have updateResource event defined', () => {
            expect(UserSocketEventEnum.updateResource).toBeDefined();
            expect(UserSocketEventEnum.updateResource).toBe('update-resource');
        });

        test('should match events in SocketNsp configuration', () => {
            expect(SocketNsp.user.events.updateResource).toBe(UserSocketEventEnum.updateResource);
        });
    });

    describe('Update Method', () => {
        test('should accept valid parameters without throwing', async () => {
            const testUserIds = [1, 2, 3];
            const eventType = UserSocketEventEnum.updateResource;

            await expect(
                app.userNsp.update({ eventType, userIds: testUserIds })
            ).resolves.not.toThrow();
        });

        test('should handle empty user IDs array', async () => {
            const eventType = UserSocketEventEnum.updateResource;

            await expect(
                app.userNsp.update({ eventType, userIds: [] })
            ).resolves.not.toThrow();
        });

        test('should handle single user ID', async () => {
            const eventType = UserSocketEventEnum.updateResource;

            await expect(
                app.userNsp.update({ eventType, userIds: [123] })
            ).resolves.not.toThrow();
        });

        test('should handle multiple user IDs', async () => {
            const eventType = UserSocketEventEnum.updateResource;
            const userIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

            await expect(
                app.userNsp.update({ eventType, userIds })
            ).resolves.not.toThrow();
        });
    });

    describe('Room Targeting', () => {
        test('should emit to correct room format', async () => {
            const userId = 42;
            const eventType = UserSocketEventEnum.updateResource;

            // Mock the socket namespace to track calls
            const userNsp = app.socket.of(SocketNsp.user.namespace);
            const originalTo = userNsp.to.bind(userNsp);
            const toSpy = jest.fn(originalTo);
            userNsp.to = toSpy as any;

            await app.userNsp.update({ eventType, userIds: [userId] });

            // Verify the room format
            expect(toSpy).toHaveBeenCalledWith(['userId-42']);

            // Restore original method
            userNsp.to = originalTo;
        });

        test('should format multiple user rooms correctly', async () => {
            const userIds = [10, 20, 30];
            const eventType = UserSocketEventEnum.updateResource;

            const userNsp = app.socket.of(SocketNsp.user.namespace);
            const originalTo = userNsp.to.bind(userNsp);
            const toSpy = jest.fn(originalTo);
            userNsp.to = toSpy as any;

            await app.userNsp.update({ eventType, userIds });

            expect(toSpy).toHaveBeenCalledWith(['userId-10', 'userId-20', 'userId-30']);

            // Restore original method
            userNsp.to = originalTo;
        });
    });

    describe('Event Emission', () => {
        test('should emit correct event type', async () => {
            const userId = 99;
            const eventType = UserSocketEventEnum.updateResource;

            const userNsp = app.socket.of(SocketNsp.user.namespace);

            // Spy on the 'to' method to verify it's called correctly
            const toSpy = jest.spyOn(userNsp, 'to');

            await app.userNsp.update({ eventType, userIds: [userId] });

            // Verify 'to' was called with the correct room
            expect(toSpy).toHaveBeenCalledWith(['userId-99']);

            toSpy.mockRestore();
        });
    });

    describe('Integration with SocketIO Plugin', () => {
        test('should depend on socketIOPlugin being loaded', () => {
            expect(app.socket).toBeDefined();
            expect(app.userNsp).toBeDefined();
        });

        test('should use correct namespace from SocketNsp', () => {
            const expectedNamespace = SocketNsp.user.namespace;
            const actualNamespace = app.socket.of(expectedNamespace);

            expect(actualNamespace).toBeDefined();
            expect(actualNamespace.name).toBe('/user');
        });

        test('should have access to socket adapter', () => {
            const userNsp = app.socket.of(SocketNsp.user.namespace);
            expect(userNsp.adapter).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid event type gracefully', async () => {
            // TypeScript would prevent this, but test runtime behavior
            const invalidEventType = 'non-existent-event' as any;

            await expect(
                app.userNsp.update({ eventType: invalidEventType, userIds: [1] })
            ).resolves.not.toThrow();
        });

        test('should handle large number of user IDs', async () => {
            const eventType = UserSocketEventEnum.updateResource;
            const largeUserIdArray = Array.from({ length: 1000 }, (_, i) => i + 1);

            await expect(
                app.userNsp.update({ eventType, userIds: largeUserIdArray })
            ).resolves.not.toThrow();
        });
    });

    describe('Console Logging', () => {
        test('should log when sending socket events', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            const eventType = UserSocketEventEnum.updateResource;
            const userIds = [123];

            await app.userNsp.update({ eventType, userIds });

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('SOCKET send to')
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('userId-123')
            );

            consoleSpy.mockRestore();
        });
    });
});
