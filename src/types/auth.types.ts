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
 * 
 * @security IMPORTANT: API Key Storage Security
 * 
 * TODO: Before GA/production deployment, implement hashed key storage:
 * 
 * 1. CURRENT STATE (Development Only):
 *    - Keys are stored in plaintext for development convenience
 *    - This is NOT secure for production use
 *    - If the key store is compromised, all keys are exposed
 * 
 * 2. MIGRATION PLAN:
 *    a) Add bcrypt or argon2 dependency: `npm install argon2` (preferred) or `npm install bcrypt`
 *    b) On key creation:
 *       - Generate the raw key (e.g., "holo_abc123...")
 *       - Hash it: `const keyHash = await argon2.hash(rawKey)`
 *       - Store only `keyHash` in the database, return raw key to user ONCE
 *       - User must save the key; it cannot be recovered
 *    c) On key validation:
 *       - Receive raw key from request header
 *       - Load stored record by key prefix/ID
 *       - Verify: `await argon2.verify(storedHash, rawKey)`
 *    d) Add `keyPrefix` field (first 8 chars) for key lookup without exposing full key
 * 
 * 3. RECOMMENDED FIELDS FOR PRODUCTION:
 *    - keyHash: string         (argon2/bcrypt hash of the key)
 *    - keyPrefix: string       (first 8 chars for identification, e.g., "holo_abc")
 *    - Remove: key field       (never store plaintext)
 * 
 * @example Production implementation
 * ```typescript
 * // Creation
 * const rawKey = generateApiKey(); // "holo_abc123..."
 * const keyHash = await argon2.hash(rawKey);
 * const keyPrefix = rawKey.substring(0, 12); // "holo_abc123"
 * await store.save({ id, name, keyHash, keyPrefix, scopes, createdAt });
 * return rawKey; // Return ONCE to user
 * 
 * // Validation
 * const record = await store.findByPrefix(keyPrefix);
 * const isValid = await argon2.verify(record.keyHash, incomingKey);
 * ```
 */
export interface ApiKeyRecord {
    /** Unique identifier for this key */
    id: string;
    /** Human-readable name for the key */
    name: string;
    /** 
     * The API key value
     * @deprecated This stores the key in plaintext - FOR DEVELOPMENT ONLY
     * @todo Replace with keyHash before production deployment
     */
    key: string;
    /**
     * Hashed API key (for production use)
     * @todo Implement hashed key validation before production
     */
    keyHash?: string;
    /**
     * First 8-12 characters of the key for identification without exposing full key
     * @todo Implement key lookup by prefix before production
     */
    keyPrefix?: string;
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
