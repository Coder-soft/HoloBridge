/**
 * HoloBridge Hosting Server - Auth Middleware
 * 
 * Validates security codes and attaches user context to requests.
 */

import type { Request, Response, NextFunction } from 'express';
import { verifySecurityCode, getUserById } from './supabase.js';
import { HEADER_SECURITY_CODE } from '../../shared/src/constants.js';

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
 * Middleware to validate security code and attach user context
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
 * Middleware to check if user owns the instance they're trying to access
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
