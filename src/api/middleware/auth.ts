import type { Request, Response, NextFunction } from 'express';
import { config } from '../../config/index.js';

export interface AuthenticatedRequest extends Request {
    apiKey: string;
}

/**
 * API Key authentication middleware
 * Checks for X-API-Key header and validates against configured key
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

    if (apiKey !== config.api.apiKey) {
        res.status(401).json({
            success: false,
            error: 'Invalid API key',
            code: 'INVALID_API_KEY',
        });
        return;
    }

    (req as AuthenticatedRequest).apiKey = apiKey;
    next();
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
