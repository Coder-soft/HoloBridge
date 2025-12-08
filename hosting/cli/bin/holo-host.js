#!/usr/bin/env node

/**
 * HoloBridge Hosting CLI
 * 
 * TUI client for managing HoloBridge instances.
 */

import('../dist/index.js').catch((err) => {
    console.error('Failed to start HoloBridge Hosting CLI:', err.message);
    process.exit(1);
});
