import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { config } from '../../config/index.js';

/**
 * Simple in-memory rate limiter.
 * For production, consider using express-rate-limit with Redis store.
 */
interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Get client identifier for rate limiting (IP address).
 */
function getClientId(req: Request): string {
    // Support X-Forwarded-For for proxied requests
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
        return forwarded.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
    }
    return req.ip ?? 'unknown';
}


/**
 * Global rate limiter middleware.
 * Uses configuration from config.rateLimit.
 */
export function rateLimiter(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!config.rateLimit.enabled) {
            return next();
        }

        const clientId = getClientId(req);
        const now = Date.now();
        const windowMs = config.rateLimit.windowMs;
        const maxRequests = config.rateLimit.maxRequests;

        let entry = rateLimitStore.get(clientId);

        // Create new entry or reset if window expired
        if (!entry || entry.resetAt < now) {
            entry = {
                count: 0,
                resetAt: now + windowMs,
            };
            rateLimitStore.set(clientId, entry);
        }

        entry.count++;

        // Set rate limit headers
        const remaining = Math.max(0, maxRequests - entry.count);
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

        if (entry.count > maxRequests) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            res.setHeader('Retry-After', retryAfter);
            res.status(429).json({
                success: false,
                error: 'Too many requests',
                code: 'RATE_LIMITED',
                retryAfter,
            });
            return;
        }

        next();
    };
}

/**
 * Create a strict rate limiter for specific routes.
 * @param maxRequests - Max requests allowed
 * @param windowMs - Time window in milliseconds
 * @param cleanupIntervalMs - Cleanup interval in milliseconds (default: 60000)
 */
export function strictRateLimiter(
    maxRequests: number,
    windowMs: number,
    cleanupIntervalMs: number = 60000
): RequestHandler {
    const store = new Map<string, RateLimitEntry>();

    // Set up periodic cleanup for this store
    const cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of store) {
            if (entry.resetAt < now) {
                store.delete(key);
            }
        }
    }, cleanupIntervalMs);

    // Track interval for shutdown cleanup
    cleanupIntervals.push(cleanupInterval);

    return (req: Request, res: Response, next: NextFunction): void => {
        const clientId = getClientId(req);
        const now = Date.now();

        let entry = store.get(clientId);

        if (!entry || entry.resetAt < now) {
            entry = {
                count: 0,
                resetAt: now + windowMs,
            };
            store.set(clientId, entry);
        }

        entry.count++;

        if (entry.count > maxRequests) {
            const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
            res.setHeader('Retry-After', retryAfter);
            res.status(429).json({
                success: false,
                error: 'Rate limit exceeded for this endpoint',
                code: 'RATE_LIMITED',
                retryAfter,
            });
            return;
        }

        next();
    };
}

/**
 * Track all cleanup intervals for proper shutdown
 */
const cleanupIntervals: NodeJS.Timeout[] = [];

// Track the global cleanup interval
const globalCleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
        if (entry.resetAt < now) {
            rateLimitStore.delete(key);
        }
    }
}, 60000);
cleanupIntervals.push(globalCleanupInterval);

/**
 * Clean up all rate limiter intervals on shutdown.
 * Call this when the server is shutting down to prevent memory leaks.
 */
export function shutdownRateLimiter(): void {
    for (const interval of cleanupIntervals) {
        clearInterval(interval);
    }
    cleanupIntervals.length = 0;
    rateLimitStore.clear();
}

