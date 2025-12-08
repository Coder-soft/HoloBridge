/**
 * HoloBridge Hosting Server - Auth Middleware
 * 
 * Validates security codes and attaches user context to requests.
 */

import type { Request, Response, NextFunction } from 'express';
import { verifySecurityCode, getUserById } from './supabase.js';
import { HEADER_SECURITY_CODE } from '../../../shared/src/constants.js';

// Extend Express Request with auth context
declare global {
    namespace Express {
        interface Request {
            auth?: {
                userId: string;
                instanceId: string;
                user: {
                    email?: string;
                    discordId?: string;
                    username?: string;
                };
            };
        }
    }
}

/**
 * Validate the X-Security-Code header, resolve the associated user, and attach an auth context to `req.auth`.
 *
 * On success sets `req.auth` to `{ userId, instanceId, user: { email, discordId, username } }` and calls `next()`.
 * If the header is missing, the code is invalid/expired, or the user cannot be found, responds with a 401 and a specific error code.
 * If an unexpected error occurs, responds with a 500 and an `AUTH_ERROR` code.
 */
export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const securityCode = req.headers[HEADER_SECURITY_CODE.toLowerCase()] as string | undefined;

    if (!securityCode) {
        res.status(401).json({
            success: false,
            error: {
                code: 'MISSING_SECURITY_CODE',
                message: 'Security code is required in X-Security-Code header',
            },
        });
        return;
    }

    try {
        const result = await verifySecurityCode(securityCode);

        if (!result) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_SECURITY_CODE',
                    message: 'Invalid or expired security code',
                },
            });
            return;
        }

        // Get user details from Supabase Auth
        const user = await getUserById(result.userId);

        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User associated with security code not found',
                },
            });
            return;
        }

        // Extract Discord metadata from user
        const discordMeta = user.user_metadata as {
            provider_id?: string;
            full_name?: string;
            name?: string;
        } | undefined;

        req.auth = {
            userId: result.userId,
            instanceId: result.instanceId,
            user: {
                email: user.email,
                discordId: discordMeta?.provider_id,
                username: discordMeta?.full_name ?? discordMeta?.name,
            },
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'AUTH_ERROR',
                message: 'Failed to validate security code',
            },
        });
    }
}

/**
 * Ensure the authenticated request belongs to the instance indicated by the route parameter `id`.
 *
 * Responds with 401 and error code `UNAUTHORIZED` if no auth context is present, responds with 403 and error code `FORBIDDEN` if the authenticated instanceId does not match the `id` route parameter, and calls `next()` when ownership is verified.
 */
export function requireInstanceOwnership(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const instanceId = req.params['id'];

    if (!req.auth) {
        res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            },
        });
        return;
    }

    // The security code is already tied to a specific instance
    // Just verify it matches the requested instance
    if (req.auth.instanceId !== instanceId) {
        res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'You do not have access to this instance',
            },
        });
        return;
    }

    next();
}