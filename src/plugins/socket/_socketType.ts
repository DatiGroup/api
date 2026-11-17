// Socket.IO event enums and namespace configurations
// This file contains shared constants to avoid circular dependencies
// file prefix _ insuures it is excludecd from plugin auto-loading
export enum UserSocketEventEnum {
    updateResource = 'update-resource',
}

// Define namespace configuration with strict typing
interface NamespaceConfig<T extends Record<string, string>> {
    namespace: string;
    events: T;
}

// Strict type for socket namespaces
interface SocketNspType {
    user: NamespaceConfig<{
        updateResource: UserSocketEventEnum.updateResource;
    }>;
    // Add more namespaces here as needed
    // admin: NamespaceConfig<{ ... }>;
}

export const SocketNsp: SocketNspType = {
    user: {
        namespace: '/user',
        events: {
            updateResource: UserSocketEventEnum.updateResource,
        },
    }
};
