/**
 * HoloBridge Hosting CLI - Session Storage
 * 
 * Securely stores authentication session locally.
 */

import Conf from 'conf';
import * as keytar from 'keytar';

const SERVICE_NAME = 'holobridge-hosting';
const ACCOUNT_NAME = 'session';

// Config for non-sensitive data
const config = new Conf({
    projectName: 'holobridge-hosting',
    schema: {
        userId: { type: 'string' },
        username: { type: 'string' },
        avatar: { type: 'string' },
        discordId: { type: 'string' },
        serverUrl: { type: 'string' },
    },
});

export interface StoredSession {
    securityCode: string;
    userId: string;
    username: string;
    avatar: string | null;
    discordId: string;
    serverUrl: string;
}

/**
 * Save session securely
 */
export async function saveSession(session: StoredSession): Promise<void> {
    // Store security code in system keychain
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, session.securityCode);

    // Store non-sensitive data in config
    config.set('userId', session.userId);
    config.set('username', session.username);
    config.set('avatar', session.avatar ?? '');
    config.set('discordId', session.discordId);
    config.set('serverUrl', session.serverUrl);
}

/**
 * Load session from storage
 */
export async function loadSession(): Promise<StoredSession | null> {
    try {
        const securityCode = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
        if (!securityCode) {
            return null;
        }

        const userId = config.get('userId') as string;
        const username = config.get('username') as string;
        const avatar = config.get('avatar') as string;
        const discordId = config.get('discordId') as string;
        const serverUrl = config.get('serverUrl') as string;

        if (!userId || !username) {
            return null;
        }

        return {
            securityCode,
            userId,
            username,
            avatar: avatar || null,
            discordId,
            serverUrl,
        };
    } catch {
        return null;
    }
}

/**
 * Clear stored session
 */
export async function clearSession(): Promise<void> {
    await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    config.clear();
}

/**
 * Check if session exists
 */
export async function hasSession(): Promise<boolean> {
    const securityCode = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    return !!securityCode;
}
