/**
 * HoloBridge Hosting CLI - Discord OAuth Flow
 * 
 * Handles Discord OAuth authentication via Supabase.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { randomBytes, createHash } from 'crypto';
import open from 'open';
import { createClient } from '@supabase/supabase-js';
import {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    CALLBACK_PORT,
    API_URL
} from '../config.js';
import { saveSession, type StoredSession } from './session.js';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Generate PKCE code verifier and challenge
 */
function generatePKCE(): { verifier: string; challenge: string } {
    const verifier = randomBytes(32).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    return { verifier, challenge };
}

/**
 * Start OAuth flow and return session on success
 */
export async function startOAuthFlow(): Promise<StoredSession> {
    return new Promise((resolve, reject) => {
        const pkce = generatePKCE();
        let server: ReturnType<typeof createServer> | null = null;

        // Create callback server
        server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
            const url = new URL(req.url ?? '/', `http://localhost:${CALLBACK_PORT}`);

            if (url.pathname === '/callback') {
                const code = url.searchParams.get('code');
                const error = url.searchParams.get('error');
                const errorDescription = url.searchParams.get('error_description');

                if (error) {
                    res.writeHead(400, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                            <body style="font-family: system-ui; text-align: center; padding: 50px;">
                                <h1>❌ Authentication Failed</h1>
                                <p>${errorDescription ?? error}</p>
                                <p>You can close this window.</p>
                            </body>
                        </html>
                    `);
                    server?.close();
                    reject(new Error(errorDescription ?? error));
                    return;
                }

                if (!code) {
                    res.writeHead(400, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                            <body style="font-family: system-ui; text-align: center; padding: 50px;">
                                <h1>❌ Authentication Failed</h1>
                                <p>No authorization code received.</p>
                                <p>You can close this window.</p>
                            </body>
                        </html>
                    `);
                    server?.close();
                    reject(new Error('No authorization code received'));
                    return;
                }

                try {
                    // Exchange code for session
                    const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

                    if (sessionError || !data.session) {
                        throw new Error(sessionError?.message ?? 'Failed to exchange code');
                    }

                    // Extract user info
                    const user = data.session.user;
                    const metadata = user.user_metadata as {
                        provider_id?: string;
                        full_name?: string;
                        avatar_url?: string;
                        name?: string;
                    };

                    // Generate security code for this session
                    const securityCode = randomBytes(32).toString('hex');

                    // TODO: Register security code with the hosting server
                    // This would create an instance or link to existing one

                    const session: StoredSession = {
                        securityCode,
                        userId: user.id,
                        username: metadata.full_name ?? metadata.name ?? 'User',
                        avatar: metadata.avatar_url ?? null,
                        discordId: metadata.provider_id ?? '',
                        serverUrl: API_URL,
                    };

                    // Save session locally
                    await saveSession(session);

                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                            <body style="font-family: system-ui; text-align: center; padding: 50px; background: #1a1a2e; color: #eee;">
                                <h1>✅ Authentication Successful!</h1>
                                <p>Welcome, ${session.username}!</p>
                                <p>You can close this window and return to the terminal.</p>
                                <script>setTimeout(() => window.close(), 3000);</script>
                            </body>
                        </html>
                    `);

                    server?.close();
                    resolve(session);
                } catch (err) {
                    res.writeHead(500, { 'Content-Type': 'text/html' });
                    res.end(`
                        <html>
                            <body style="font-family: system-ui; text-align: center; padding: 50px;">
                                <h1>❌ Authentication Failed</h1>
                                <p>${err instanceof Error ? err.message : 'Unknown error'}</p>
                                <p>You can close this window.</p>
                            </body>
                        </html>
                    `);
                    server?.close();
                    reject(err);
                }
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });

        server.listen(CALLBACK_PORT, () => {
            // Generate Supabase OAuth URL
            const redirectTo = `http://localhost:${CALLBACK_PORT}/callback`;

            supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo,
                    scopes: 'identify email',
                    skipBrowserRedirect: true,
                },
            }).then(({ data, error }) => {
                if (error || !data.url) {
                    reject(new Error(error?.message ?? 'Failed to generate OAuth URL'));
                    server?.close();
                    return;
                }

                // Open browser
                open(data.url);
            });
        });

        // Timeout after 5 minutes
        setTimeout(() => {
            server?.close();
            reject(new Error('Authentication timed out'));
        }, 5 * 60 * 1000);
    });
}

/**
 * Sign out and clear local session
 */
export async function signOut(): Promise<void> {
    await supabase.auth.signOut();
}
