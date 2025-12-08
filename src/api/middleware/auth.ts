import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { config } from '../../config/index.js';
import type { ApiScope, ApiKeyRecord } from '../../types/auth.types.js';

/**
 * Extended request with API key context
 */
export interface AuthenticatedRequest extends Request {
    apiKey: ApiKeyRecord;
}

/**
 * Find an API key record by its key value.
 * Checks both the new apiKeys array and legacy single apiKey.
 */
function findApiKey(key: string): ApiKeyRecord | null {
    // Check new multi-key system first
    const found = config.api.apiKeys.find((k) => k.key === key);
    if (found) {
        return {
            ...found,
            scopes: found.scopes as ApiScope[],
            createdAt: found.createdAt || new Date(),
        };
    }

    // Fall back to legacy single key (has admin scope)
    if (key === config.api.apiKey) {
        return {
            id: 'legacy',
            name: 'Legacy API Key',
            key: key,
            scopes: ['admin'],
            createdAt: new Date(),
        };
    }

    return null;
}

/**
 * API Key authentication middleware.
 * Validates API key and attaches key context to request.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
        res.status(401).json({
            success: false,
            error: 'Missing API key',
            code: 'MISSING_API_KEY',
        });
        return;
    }

    const keyRecord = findApiKey(apiKey);
    if (!keyRecord) {
        res.status(401).json({
            success: false,
            error: 'Invalid API key',
            code: 'INVALID_API_KEY',
        });
        return;
    }

    // Attach key record to request for downstream use
    (req as AuthenticatedRequest).apiKey = keyRecord;
    next();
}

/**
 * Middleware factory to require specific scope(s).
 * Use after authMiddleware to enforce granular permissions.
 * 
 * @example
 * router.post('/messages', requireScope('write:messages'), handler);
 */
export function requireScope(...requiredScopes: ApiScope[]): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        const keyRecord = (req as AuthenticatedRequest).apiKey;

        if (!keyRecord) {
            res.status(401).json({
                success: false,
                error: 'Not authenticated',
                code: 'NOT_AUTHENTICATED',
            });
            return;
        }

        // Admin scope bypasses all checks
        if (keyRecord.scopes.includes('admin')) {
            return next();
        }

        // Check if key has all required scopes
        const hasAllScopes = requiredScopes.every((scope) =>
            keyRecord.scopes.includes(scope)
        );

        if (!hasAllScopes) {
            res.status(403).json({
                success: false,
                error: `Missing required scope(s): ${requiredScopes.join(', ')}`,
                code: 'INSUFFICIENT_SCOPE',
                required: requiredScopes,
                granted: keyRecord.scopes,
            });
            return;
        }

        next();
    };
}

/**
 * Error handler middleware
 */
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
    console.error('API Error:', err);

    res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: config.debug ? err.message : undefined,
    });
}

/**
 * Not found handler
 */
export function notFoundHandler(req: Request, res: Response): void {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
        code: 'NOT_FOUND',
    });
}

