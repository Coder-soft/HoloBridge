/**
 * HoloBridge Hosting CLI - Dashboard Screen
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Spinner from 'ink-spinner';
import SelectInput from 'ink-select-input';
import * as api from '../../api/client.js';
import type { StoredSession } from '../../auth/session.js';

interface DashboardScreenProps {
    session: StoredSession;
    onNavigate: (screen: string, data?: unknown) => void;
    onLogout: () => void;
}

type ViewState = 'loading' | 'list' | 'error';

interface MenuItem {
    label: string;
    value: string;
}

/**
 * Render the TUI dashboard for managing hosting instances.
 *
 * Shows a header with the current user, instance statistics, and a panel that presents loading, error, or list views.
 * The list view displays instances with status, port, CPU, and memory and supports keyboard-driven actions (create, refresh, start, stop, edit, plugins, keys, logout, quit).
 *
 * @param session - Current stored session (used to display the username)
 * @param onNavigate - Callback to navigate to another screen; called with a target screen name and optional data
 * @param onLogout - Callback invoked to perform logout
 * @returns The React element for the dashboard screen
 */
export function DashboardScreen({ session, onNavigate, onLogout }: DashboardScreenProps): React.ReactElement {
    const { exit } = useApp();
    const [viewState, setViewState] = useState<ViewState>('loading');
    const [instances, setInstances] = useState<api.InstanceWithStats[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        loadInstances();
    }, []);

    async function loadInstances(): Promise<void> {
        setViewState('loading');
        try {
            await api.initApiClient();
            const data = await api.listInstances();
            setInstances(data);
            setViewState('list');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load instances');
            setViewState('error');
        }
    }

    useInput((input, key) => {
        if (input === 'q') {
            exit();
            return;
        }

        if (input === 'r') {
            loadInstances();
            return;
        }

        if (input === 'c') {
            onNavigate('create');
            return;
        }

        if (input === 'l' && viewState !== 'loading') {
            onLogout();
            return;
        }

        if (viewState === 'list' && instances.length > 0) {
            const instance = instances[selectedIndex];
            if (!instance) return;

            if (input === 's' && instance.status === 'stopped') {
                handleStart(instance.id);
            } else if (input === 't' && instance.status === 'running') {
                handleStop(instance.id);
            } else if (input === 'e') {
                onNavigate('instance', instance);
            } else if (input === 'p') {
                onNavigate('plugins', instance);
            } else if (input === 'k') {
                onNavigate('keys', instance);
            }
        }
    });

    async function handleStart(id: string): Promise<void> {
        try {
            await api.startInstance(id);
            loadInstances();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start');
        }
    }

    async function handleStop(id: string): Promise<void> {
        try {
            await api.stopInstance(id);
            loadInstances();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to stop');
        }
    }

    const runningCount = instances.filter(i => i.status === 'running').length;
    const stoppedCount = instances.filter(i => i.status === 'stopped').length;

    return (
        <Box flexDirection="column" padding={1}>
            {/* Header */}
            <Box justifyContent="space-between" marginBottom={1}>
                <Text bold color="cyan">🌉 HoloBridge Hosting</Text>
                <Text>
                    Welcome, <Text color="yellow">@{session.username}</Text>
                    {' '}
                    <Text dimColor>[L]ogout</Text>
                </Text>
            </Box>

            <Box borderStyle="single" borderColor="gray" flexDirection="column" padding={1}>
                {/* Title */}
                <Box marginBottom={1}>
                    <Text bold>Your Instances</Text>
                </Box>

                {/* Stats */}
                <Box marginBottom={1}>
                    <Text>
                        🟢 Running: <Text color="green">{runningCount}</Text>
                        {'  '}|{'  '}
                        🔴 Stopped: <Text color="red">{stoppedCount}</Text>
                        {'  '}|{'  '}
                        Total: {instances.length}
                    </Text>
                </Box>

                {/* Loading State */}
                {viewState === 'loading' && (
                    <Box>
                        <Text>
                            <Spinner type="dots" /> Loading instances...
                        </Text>
                    </Box>
                )}

                {/* Error State */}
                {viewState === 'error' && (
                    <Box flexDirection="column">
                        <Text color="red">❌ {error}</Text>
                        <Text dimColor>Press R to retry</Text>
                    </Box>
                )}

                {/* Instance List */}
                {viewState === 'list' && (
                    <>
                        {instances.length === 0 ? (
                            <Box flexDirection="column" alignItems="center" paddingY={2}>
                                <Text dimColor>No instances yet</Text>
                                <Text dimColor>Press C to create your first instance</Text>
                            </Box>
                        ) : (
                            <Box flexDirection="column">
                                {/* Table Header */}
                                <Box>
                                    <Box width={20}><Text bold>Name</Text></Box>
                                    <Box width={12}><Text bold>Status</Text></Box>
                                    <Box width={8}><Text bold>Port</Text></Box>
                                    <Box width={10}><Text bold>CPU</Text></Box>
                                    <Box width={10}><Text bold>Memory</Text></Box>
                                </Box>

                                {/* Table Rows */}
                                {instances.map((instance, index) => (
                                    <Box
                                        key={instance.id}
                                    >
                                        <Box width={20}>
                                            <Text backgroundColor={index === selectedIndex ? 'blue' : undefined} color={index === selectedIndex ? 'white' : undefined}>{instance.name}</Text>
                                        </Box>
                                        <Box width={12}>
                                            <Text backgroundColor={index === selectedIndex ? 'blue' : undefined} color={instance.status === 'running' ? 'green' : (instance.status === 'stopped' ? 'red' : 'white')}>
                                                {instance.status === 'running' ? '🟢' : '🔴'} {instance.status}
                                            </Text>
                                        </Box>
                                        <Box width={8}>
                                            <Text backgroundColor={index === selectedIndex ? 'blue' : undefined} color={index === selectedIndex ? 'white' : undefined}>{instance.port ?? '-'}</Text>
                                        </Box>
                                        <Box width={10}>
                                            <Text backgroundColor={index === selectedIndex ? 'blue' : undefined} color={index === selectedIndex ? 'white' : undefined}>{instance.stats?.cpu.toFixed(1) ?? '-'}%</Text>
                                        </Box>
                                        <Box width={10}>
                                            <Text backgroundColor={index === selectedIndex ? 'blue' : undefined} color={index === selectedIndex ? 'white' : undefined}>{instance.stats?.memory.toFixed(0) ?? '-'}MB</Text>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {/* Help */}
            <Box marginTop={1}>
                <Text dimColor>
                    [C]reate  [S]tart  S[t]op  [E]dit  [P]lugins  [K]eys  [R]efresh  [Q]uit
                </Text>
            </Box>
        </Box>
    );
}