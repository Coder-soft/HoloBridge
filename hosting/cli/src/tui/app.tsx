/**
 * HoloBridge Hosting CLI - Main TUI Application
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import Spinner from 'ink-spinner';
import { LoginScreen } from './screens/login.js';
import { DashboardScreen } from './screens/dashboard.js';
import { CreateScreen } from './screens/create.js';
import { loadSession, clearSession, type StoredSession } from '../auth/session.js';

type Screen = 'loading' | 'login' | 'dashboard' | 'create' | 'instance' | 'plugins' | 'keys';

/**
 * Main TUI application for the HoloBridge Hosting CLI that manages screens, session state, and navigation.
 *
 * Renders the appropriate screen (loading, login, dashboard, create, instance, plugins, keys) based on the current session and navigation state, and wires handlers for login, logout, navigation, and back actions.
 *
 * @returns The root React element for the TUI application.
 */
export function App(): React.ReactElement {
    const { exit } = useApp();
    const [screen, setScreen] = useState<Screen>('loading');
    const [session, setSession] = useState<StoredSession | null>(null);
    const [screenData, setScreenData] = useState<unknown>(null);

    useEffect(() => {
        checkSession();
    }, []);

    async function checkSession(): Promise<void> {
        try {
            const existingSession = await loadSession();
            if (existingSession) {
                setSession(existingSession);
                setScreen('dashboard');
            } else {
                setScreen('login');
            }
        } catch {
            setScreen('login');
        }
    }

    function handleLogin(newSession: StoredSession): void {
        setSession(newSession);
        setScreen('dashboard');
    }

    async function handleLogout(): Promise<void> {
        await clearSession();
        setSession(null);
        setScreen('login');
    }

    function handleNavigate(target: string, data?: unknown): void {
        setScreenData(data);
        setScreen(target as Screen);
    }

    function handleBack(): void {
        setScreenData(null);
        setScreen('dashboard');
    }

    // Loading state
    if (screen === 'loading') {
        return (
            <Box flexDirection="column" alignItems="center" justifyContent="center" height="100%">
                <Text>
                    <Spinner type="dots" /> Loading...
                </Text>
            </Box>
        );
    }

    // Login screen
    if (screen === 'login') {
        return <LoginScreen onLogin={handleLogin} />;
    }

    // Authenticated screens
    if (!session) {
        return (
            <Box flexDirection="column" alignItems="center">
                <Text color="red">Session expired. Please restart.</Text>
            </Box>
        );
    }

    switch (screen) {
        case 'dashboard':
            return (
                <DashboardScreen
                    session={session}
                    onNavigate={handleNavigate}
                    onLogout={handleLogout}
                />
            );

        case 'create':
            return (
                <CreateScreen
                    onBack={handleBack}
                    onCreated={handleBack}
                />
            );

        case 'instance':
        case 'plugins':
        case 'keys':
            // Placeholder for detailed screens
            return (
                <Box flexDirection="column" padding={1}>
                    <Text bold color="cyan">
                        {screen === 'instance' && '⚙️ Instance Settings'}
                        {screen === 'plugins' && '🔌 Plugin Management'}
                        {screen === 'keys' && '🔑 API Key Management'}
                    </Text>
                    <Box marginTop={1}>
                        <Text dimColor>Coming soon... Press Escape to go back</Text>
                    </Box>
                </Box>
            );

        default:
            return (
                <Box>
                    <Text color="red">Unknown screen: {screen}</Text>
                </Box>
            );
    }
}