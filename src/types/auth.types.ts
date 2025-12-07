/**
 * Available API scopes for granular access control.
 */
export type ApiScope =
    | 'read:guilds'      // Read guild information
    | 'read:channels'    // Read channel information
    | 'read:members'     // Read member information
    | 'read:messages'    // Read messages
    | 'write:messages'   // Send/edit/delete messages
    | 'write:members'    // Kick/ban/timeout members
    | 'write:channels'   // Create/edit/delete channels
    | 'write:roles'      // Create/edit/delete roles
    | 'events'           // Subscribe to WebSocket events
    | 'admin';           // Full access (bypasses all checks)

/**
 * Represents a stored API key with its permissions.
 */
export interface ApiKeyRecord {
    /** Unique identifier for this key */
    id: string;
    /** Human-readable name for the key */
    name: string;
    /** The API key value (stored as-is for now, could be hashed) */
    key: string;
    /** Scopes granted to this key */
    scopes: ApiScope[];
    /** When this key was created */
    createdAt: Date;
    /** When this key was last used */
    lastUsedAt?: Date;
}

/**
 * Extended Express Request with auth context.
 */
declare global {
    namespace Express {
        interface Request {
            apiKey?: ApiKeyRecord;
        }
    }
}
