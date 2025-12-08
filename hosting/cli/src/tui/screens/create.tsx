/**
 * HoloBridge Hosting CLI - Create Instance Screen
 */

import React, { useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import * as api from '../../api/client.js';

interface CreateScreenProps {
    onBack: () => void;
    onCreated: (instance: unknown) => void;
}

type Step = 'name' | 'token' | 'confirm' | 'creating' | 'done' | 'error';

export function CreateScreen({ onBack, onCreated }: CreateScreenProps): React.ReactElement {
    const { exit } = useApp();
    const [step, setStep] = useState<Step>('name');
    const [name, setName] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [createdInstance, setCreatedInstance] = useState<unknown>(null);

    useInput((input, key) => {
        if (key.escape) {
            if (step === 'creating') return; // Can't cancel during creation
            onBack();
            return;
        }

        if (input === 'q' && step !== 'creating') {
            exit();
            return;
        }

        if (key.return && step === 'confirm') {
            handleCreate();
            return;
        }
    });

    async function handleCreate(): Promise<void> {
        setStep('creating');
        setError(null);

        try {
            const instance = await api.createInstance({
                name,
                discordToken: token,
            });
            setCreatedInstance(instance);
            setStep('done');
            setTimeout(() => onCreated(instance), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create instance');
            setStep('error');
        }
    }

    function handleNameSubmit(): void {
        if (name.trim().length > 0) {
            setStep('token');
        }
    }

    function handleTokenSubmit(): void {
        if (token.trim().length >= 50) {
            setStep('confirm');
        }
    }

    return (
        <Box flexDirection="column" padding={1}>
            {/* Header */}
            <Box marginBottom={1}>
                <Text bold color="cyan">➕ Create New Instance</Text>
            </Box>

            <Box borderStyle="single" borderColor="gray" flexDirection="column" padding={1}>
                {/* Step 1: Name */}
                {step === 'name' && (
                    <Box flexDirection="column">
                        <Box marginBottom={1}>
                            <Text bold>Step 1: Instance Name</Text>
                        </Box>
                        <Box marginBottom={1}>
                            <Text dimColor>
                                Choose a name for your HoloBridge instance
                            </Text>
                        </Box>
                        <Box>
                            <Text>Name: </Text>
                            <TextInput
                                value={name}
                                onChange={setName}
                                onSubmit={handleNameSubmit}
                                placeholder="my-discord-bot"
                            />
                        </Box>
                    </Box>
                )}

                {/* Step 2: Discord Token */}
                {step === 'token' && (
                    <Box flexDirection="column">
                        <Box marginBottom={1}>
                            <Text bold>Step 2: Discord Bot Token</Text>
                        </Box>
                        <Box marginBottom={1}>
                            <Text dimColor>
                                Enter your Discord bot token (from Discord Developer Portal)
                            </Text>
                        </Box>
                        <Box>
                            <Text>Token: </Text>
                            <TextInput
                                value={token}
                                onChange={setToken}
                                onSubmit={handleTokenSubmit}
                                placeholder="Enter Discord bot token"
                                mask="*"
                            />
                        </Box>
                        <Box marginTop={1}>
                            <Text dimColor>
                                Token must be at least 50 characters
                            </Text>
                        </Box>
                    </Box>
                )}

                {/* Step 3: Confirm */}
                {step === 'confirm' && (
                    <Box flexDirection="column">
                        <Box marginBottom={1}>
                            <Text bold>Step 3: Confirm</Text>
                        </Box>
                        <Box flexDirection="column" marginBottom={1}>
                            <Text>Name: <Text color="cyan">{name}</Text></Text>
                            <Text>Token: <Text dimColor>{'*'.repeat(20)}...{token.slice(-8)}</Text></Text>
                        </Box>
                        <Box gap={2}>
                            <Text
                                backgroundColor="green"
                                color="white"
                            >
                                {' '}Press Enter to Create{' '}
                            </Text>
                        </Box>
                        <Box marginTop={1}>
                            <Text dimColor>Press Escape to go back</Text>
                        </Box>
                    </Box>
                )}

                {/* Creating */}
                {step === 'creating' && (
                    <Box flexDirection="column" alignItems="center">
                        <Text>
                            <Spinner type="dots" /> Creating instance...
                        </Text>
                        <Box marginTop={1}>
                            <Text dimColor>This may take a moment</Text>
                        </Box>
                    </Box>
                )}

                {/* Done */}
                {step === 'done' && (
                    <Box flexDirection="column" alignItems="center">
                        <Text color="green">✅ Instance created successfully!</Text>
                        <Box marginTop={1}>
                            <Text dimColor>Returning to dashboard...</Text>
                        </Box>
                    </Box>
                )}

                {/* Error */}
                {step === 'error' && (
                    <Box flexDirection="column">
                        <Text color="red">❌ Failed to create instance</Text>
                        {error && <Text dimColor>{error}</Text>}
                        <Box marginTop={1}>
                            <Text dimColor>Press Escape to go back</Text>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Progress indicator */}
            <Box marginTop={1}>
                <Text dimColor>
                    Step {step === 'name' ? '1' : step === 'token' ? '2' : '3'} of 3
                    {'  '}|{'  '}
                    Press Escape to cancel
                </Text>
            </Box>
        </Box>
    );
}
