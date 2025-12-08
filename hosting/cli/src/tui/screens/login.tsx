/**
 * HoloBridge Hosting CLI - Login Screen
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { startOAuthFlow } from '../../auth/discord.js';
import type { StoredSession } from '../../auth/session.js';
import type { Key } from 'ink';

interface LoginScreenProps {
    onLogin: (session: StoredSession) => void;
}

type LoginState = 'idle' | 'waiting' | 'success' | 'error';

/**
 * Render a terminal UI that manages a Discord OAuth login flow and user input for a CLI app.
 *
 * @param onLogin - Callback invoked with the stored session after a successful login (invoked shortly after authentication completes)
 * @returns The Ink React element for the login screen
 */
export function LoginScreen({ onLogin }: LoginScreenProps): React.ReactElement {
    const { exit } = useApp();
    const [state, setState] = useState<LoginState>('idle');
    const [error, setError] = useState<string | null>(null);

    useInput((input: string, key: Key) => {
        if (input === 'q' || key.escape) {
            exit();
            return;
        }

        if (key.return && state === 'idle') {
            handleLogin();
        }
    });

    async function handleLogin(): Promise<void> {
        setState('waiting');
        setError(null);

        try {
            const session = await startOAuthFlow();
            setState('success');
            setTimeout(() => onLogin(session), 1000);
        } catch (err) {
            setState('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    }

    return (
        <Box flexDirection="column" alignItems="center" justifyContent="center" height="100%">
            <Box marginBottom={2}>
                <Text bold color="cyan">
                    🌉 HoloBridge Hosting Manager
                </Text>
            </Box>

            <Box
                flexDirection="column"
                alignItems="center"
                borderStyle="round"
                borderColor="gray"
                paddingX={4}
                paddingY={2}
            >
                {state === 'idle' && (
                    <>
                        <Box marginBottom={1}>
                            <Text>🎮 Login with Discord</Text>
                        </Box>
                        <Text dimColor>Press Enter to open browser</Text>
                    </>
                )}

                {state === 'waiting' && (
                    <>
                        <Box marginBottom={1}>
                            <Text>
                                <Spinner type="dots" /> Waiting for Discord login...
                            </Text>
                        </Box>
                        <Text dimColor>Complete authentication in your browser</Text>
                    </>
                )}

                {state === 'success' && (
                    <Text color="green">✅ Login successful!</Text>
                )}

                {state === 'error' && (
                    <>
                        <Text color="red">❌ Login failed</Text>
                        {error && <Text dimColor>{error}</Text>}
                        <Text dimColor>Press Enter to try again</Text>
                    </>
                )}
            </Box>

            <Box marginTop={2}>
                <Text dimColor>Press Q to quit</Text>
            </Box>
        </Box>
    );
}