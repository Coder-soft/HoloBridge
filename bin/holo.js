#!/usr/bin/env node

/**
 * HoloBridge CLI
 * 
 * Usage:
 *   holo start       - Start the HoloBridge server
 *   holo doctor      - Check environment and configuration
 *   holo init        - Initialize a new configuration
 */

import { spawn } from 'child_process';
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');

// ANSI colors
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkmark() { return `${colors.green}✓${colors.reset}`; }
function crossmark() { return `${colors.red}✗${colors.reset}`; }
function warnmark() { return `${colors.yellow}⚠${colors.reset}`; }

// ============ Commands ============

async function commandStart(args) {
    const isWatch = args.includes('--watch') || args.includes('-w');

    log('\n🚀 Starting HoloBridge...', 'cyan');

    const command = isWatch ? 'npm' : 'node';
    const cmdArgs = isWatch ? ['run', 'dev'] : ['dist/index.js'];

    const child = spawn(command, cmdArgs, {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        shell: true,
    });

    child.on('error', (err) => {
        log(`\nError: ${err.message}`, 'red');
        process.exit(1);
    });

    child.on('exit', (code) => {
        process.exit(code ?? 0);
    });
}

async function commandDoctor() {
    log('\n🩺 HoloBridge Doctor\n', 'cyan');
    let hasErrors = false;

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);
    if (majorVersion >= 18) {
        log(`${checkmark()} Node.js ${nodeVersion} (>= 18 required)`);
    } else {
        log(`${crossmark()} Node.js ${nodeVersion} (>= 18 required)`, 'red');
        hasErrors = true;
    }

    // Check .env file
    const envPath = resolve(ROOT_DIR, '.env');
    try {
        await access(envPath, constants.R_OK);
        log(`${checkmark()} .env file exists`);

        // Check required variables
        const envContent = await readFile(envPath, 'utf8');
        const hasToken = /DISCORD_TOKEN=.+/.test(envContent);
        const hasApiKey = /API_KEY=.+/.test(envContent);

        if (hasToken) {
            log(`${checkmark()} DISCORD_TOKEN is set`);
        } else {
            log(`${crossmark()} DISCORD_TOKEN is missing or empty`, 'red');
            hasErrors = true;
        }

        if (hasApiKey) {
            log(`${checkmark()} API_KEY is set`);
        } else {
            log(`${crossmark()} API_KEY is missing or empty`, 'red');
            hasErrors = true;
        }
    } catch {
        log(`${crossmark()} .env file not found`, 'red');
        log(`   Run 'holo init' to create one`, 'yellow');
        hasErrors = true;
    }

    // Check plugins directory
    const pluginsPath = resolve(ROOT_DIR, 'plugins');
    try {
        await access(pluginsPath, constants.R_OK);
        log(`${checkmark()} plugins/ directory exists`);
    } catch {
        log(`${warnmark()} plugins/ directory not found (will be created on start)`);
    }

    // Check dist directory
    const distPath = resolve(ROOT_DIR, 'dist');
    try {
        await access(distPath, constants.R_OK);
        log(`${checkmark()} dist/ directory exists (built)`);
    } catch {
        log(`${warnmark()} dist/ not found. Run 'npm run build' first`);
    }

    console.log('');
    if (hasErrors) {
        log('❌ Some checks failed. Please fix the issues above.', 'red');
        process.exit(1);
    } else {
        log('✨ All checks passed! Ready to start.', 'green');
    }
}

async function commandInit() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = (q) => new Promise((resolve) => rl.question(q, resolve));

    log('\n🔧 HoloBridge Setup\n', 'cyan');

    const envPath = resolve(ROOT_DIR, '.env');

    // Check if .env already exists
    try {
        await access(envPath, constants.F_OK);
        const overwrite = await question('.env already exists. Overwrite? (y/N): ');
        if (overwrite.toLowerCase() !== 'y') {
            log('Aborted.', 'yellow');
            rl.close();
            return;
        }
    } catch {
        // File doesn't exist, continue
    }

    const discordToken = await question('Discord Bot Token: ');
    const apiKey = await question('API Key (leave empty to generate): ');
    const port = await question('Port (default: 3000): ');

    const finalApiKey = apiKey || generateApiKey();
    const finalPort = port || '3000';

    const envContent = `# HoloBridge Configuration

# Discord Bot Token (from Discord Developer Portal)
DISCORD_TOKEN=${discordToken}

# API Key for REST/WebSocket authentication
API_KEY=${finalApiKey}

# Server port
PORT=${finalPort}

# Debug mode (set to true for verbose logging)
DEBUG=false

# Plugin settings
PLUGINS_ENABLED=true
PLUGINS_DIR=plugins

# Rate limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
`;

    await writeFile(envPath, envContent);

    // Create plugins directory
    const pluginsPath = resolve(ROOT_DIR, 'plugins');
    try {
        await mkdir(pluginsPath, { recursive: true });
    } catch {
        // Already exists
    }

    log('\n✅ Configuration saved to .env', 'green');
    if (!apiKey) {
        log(`   Generated API Key: ${finalApiKey}`, 'cyan');
    }
    log('\nRun `holo doctor` to verify your setup.', 'yellow');

    rl.close();
}

function generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = 'holo_';
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
}

function showHelp() {
    log('\n📚 HoloBridge CLI', 'cyan');
    console.log(`
Usage: holo <command> [options]

Commands:
  start       Start the HoloBridge server
              --watch, -w   Run in development mode with hot reload
  
  doctor      Check your environment and configuration
  
  init        Initialize a new .env configuration file
  
  help        Show this help message

Examples:
  holo start            Start in production mode
  holo start --watch    Start in development mode
  holo doctor           Verify your setup
  holo init             Create a new .env file
`);
}

// ============ Main ============

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
    case 'start':
        commandStart(args.slice(1));
        break;
    case 'doctor':
        commandDoctor();
        break;
    case 'init':
        commandInit();
        break;
    case 'help':
    case '--help':
    case '-h':
    case undefined:
        showHelp();
        break;
    default:
        log(`Unknown command: ${command}`, 'red');
        showHelp();
        process.exit(1);
}
