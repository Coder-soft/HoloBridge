import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';

/**
 * Custom API error class for standardized error handling.
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly code: string;

    constructor(statusCode: number, message: string, code: string) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'ApiError';
    }

    static badRequest(message: string, code = 'BAD_REQUEST'): ApiError {
        return new ApiError(400, message, code);
    }

    static unauthorized(message = 'Unauthorized', code = 'UNAUTHORIZED'): ApiError {
        return new ApiError(401, message, code);
    }

    static forbidden(message = 'Forbidden', code = 'FORBIDDEN'): ApiError {
        return new ApiError(403, message, code);
    }

    static notFound(message = 'Not found', code = 'NOT_FOUND'): ApiError {
        return new ApiError(404, message, code);
    }

    static internal(message = 'Internal server error', code = 'INTERNAL_ERROR'): ApiError {
        return new ApiError(500, message, code);
    }
}

/**
 * Centralized error handling middleware.
 * Catches all errors and returns standardized JSON responses.
 */
export const errorHandler: ErrorRequestHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Handle Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: err.errors.map((e) => ({
                path: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    // Handle custom API errors
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
            code: err.code,
        });
        return;
    }

    // Handle standard errors
    if (err instanceof Error) {
        console.error('[Error]', err.message, err.stack);
        res.status(500).json({
            success: false,
            error: process.env.DEBUG === 'true' ? err.message : 'Internal server error',
            code: 'INTERNAL_ERROR',
        });
        return;
    }

    // Handle unknown errors
    console.error('[Error] Unknown error:', err);
    res.status(500).json({
        success: false,
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
    });
};

/**
 * 404 Not Found handler for unmatched routes.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.path} not found`,
        code: 'NOT_FOUND',
    });
};
