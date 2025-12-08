/**
 * HoloBridge Hosting - Constants
 *
 * Shared constants used across server and CLI.
 */
// API Configuration
export const API_VERSION = 'v1';
export const DEFAULT_API_PORT = 4000;
export const DEFAULT_INSTANCE_PORT_RANGE = { start: 3001, end: 3999 };
// Security
export const SECURITY_CODE_LENGTH = 32;
export const API_KEY_LENGTH = 32;
export const API_KEY_PREFIX = 'hbh_'; // HoloBridge Hosting
// Instance Limits
export const MAX_INSTANCES_FREE = 1;
export const MAX_INSTANCES_PRO = 10;
export const MAX_PLUGINS_PER_INSTANCE = 20;
export const MAX_API_KEYS_PER_INSTANCE = 10;
// Docker Configuration
export const DOCKER_IMAGE_NAME = 'holobridge';
export const DOCKER_NETWORK_NAME = 'holobridge-hosting';
export const CONTAINER_NAME_PREFIX = 'hbh-';
// Rate Limiting
export const API_RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
export const API_RATE_LIMIT_MAX = 100;
// Session Configuration
export const SESSION_EXPIRY_HOURS = 24 * 7; // 7 days
// Headers
export const HEADER_SECURITY_CODE = 'X-Security-Code';
export const HEADER_INSTANCE_ID = 'X-Instance-ID';
// Available API Key Scopes
export const ALL_SCOPES = [
    'read:guilds',
    'read:channels',
    'read:members',
    'read:messages',
    'write:messages',
    'write:members',
    'write:channels',
    'write:roles',
    'events',
    'admin',
];
// Default Instance Config
export const DEFAULT_INSTANCE_CONFIG = {
    debug: false,
    pluginsEnabled: true,
    rateLimitEnabled: true,
    rateLimitMax: 100,
    rateLimitWindowMs: 60000,
};
