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
import { randomBytes } from 'crypto';
import { readFile, writeFile, access, mkdir } from 'fs/promises';
import { constants } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');

// ============ Commands ============

async function commandStart(args) {
    const isWatch = args.includes('--watch') || args.includes('-w');

    console.log(chalk.cyan.bold('\n🚀 Starting HoloBridge...\n'));

    const spinner = ora('Initializing server...').start();

    const command = isWatch ? 'npm' : 'node';
    const cmdArgs = isWatch ? ['run', 'dev'] : ['dist/index.js'];

    // If watching, we don't want to hide output behind a spinner forever
    if (isWatch) {
        spinner.info(chalk.yellow('Watch mode enabled. Output will stream below:'));
    } else {
        spinner.succeed(chalk.green('Initialization complete. Starting process...'));
    }

    const child = spawn(command, cmdArgs, {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        shell: true,
    });

    child.on('error', (err) => {
        spinner.fail(chalk.red(`Failed to start: ${err.message}`));
        process.exit(1);
    });

    child.on('exit', (code) => {
        if (code !== 0) {
            console.log(chalk.red(`\nProcess exited with code ${code}`));
        }
        process.exit(code ?? 0);
    });
}

async function commandDoctor() {
    console.log(chalk.cyan.bold('\n🩺 HoloBridge Doctor\n'));
    let hasErrors = false;

    // Check Node.js version
    const spinner = ora('Checking Node.js version').start();
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0], 10);

    if (majorVersion >= 18) {
        spinner.succeed(`Node.js ${chalk.green(nodeVersion)} (>= 18 required)`);
    } else {
        spinner.fail(`Node.js ${chalk.red(nodeVersion)} (>= 18 required)`);
        hasErrors = true;
    }

    // Check .env file
    const envSpinner = ora('Checking configuration').start();
    const envPath = resolve(ROOT_DIR, '.env');
    try {
        await access(envPath, constants.R_OK);
        const envContent = await readFile(envPath, 'utf8');
        const hasToken = /DISCORD_TOKEN=.+/.test(envContent);
        const hasApiKey = /API_KEY=.+/.test(envContent);

        if (hasToken && hasApiKey) {
            envSpinner.succeed('Configuration (.env) looks good');
        } else {
            envSpinner.fail('Configuration missing required fields');
            if (!hasToken) console.log(chalk.red('   - DISCORD_TOKEN is missing'));
            if (!hasApiKey) console.log(chalk.red('   - API_KEY is missing'));
            hasErrors = true;
        }
    } catch {
        envSpinner.fail('.env file not found');
        console.log(chalk.yellow("   Run 'holo init' to create one"));
        hasErrors = true;
    }

    // Check plugins directory
    const pluginSpinner = ora('Checking plugins directory').start();
    const pluginsPath = resolve(ROOT_DIR, 'plugins');
    try {
        await access(pluginsPath, constants.R_OK);
        pluginSpinner.succeed('plugins/ directory exists');
    } catch {
        pluginSpinner.warn('plugins/ directory not found (will be created on start)');
    }

    // Check dist directory
    const buildSpinner = ora('Checking build status').start();
    const distPath = resolve(ROOT_DIR, 'dist');
    try {
        await access(distPath, constants.R_OK);
        buildSpinner.succeed('dist/ directory exists (built)');
    } catch {
        buildSpinner.warn('dist/ not found. Run \'npm run build\' to build the project');
    }

    console.log('');
    if (hasErrors) {
        console.log(chalk.red.bold('❌ Some checks failed. Please fix the issues above.'));
        process.exit(1);
    } else {
        console.log(chalk.green.bold('✨ All checks passed! Ready to start.'));
    }
}

async function commandInit() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = (q) => new Promise((resolve) => rl.question(chalk.white(q), resolve));

    console.log(chalk.cyan.bold('\n🔧 HoloBridge Setup\n'));

    const envPath = resolve(ROOT_DIR, '.env');

    // Check if .env already exists
    try {
        await access(envPath, constants.F_OK);
        const overwrite = await question(chalk.yellow('.env already exists. Overwrite? (y/N): '));
        if (overwrite.toLowerCase() !== 'y') {
            console.log(chalk.yellow('Aborted.'));
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

    const spinner = ora('Saving configuration...').start();
    await writeFile(envPath, envContent);

    // Create plugins directory
    const pluginsPath = resolve(ROOT_DIR, 'plugins');
    try {
        await mkdir(pluginsPath, { recursive: true });
    } catch {
        // Already exists
    }
    spinner.succeed('Configuration saved to .env');

    if (!apiKey) {
        console.log(chalk.green(`   Generated API Key: ${chalk.bold(finalApiKey)}`));
    }
    console.log(chalk.yellow('\nRun `holo doctor` to verify your setup.'));

    rl.close();
}

function generateApiKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charsLength = chars.length;
    const bytes = randomBytes(32); // 32 bytes of cryptographically secure entropy
    let key = 'holo_';
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(bytes[i] % charsLength);
    }
    return key;
}

function showHelp() {
    console.log(chalk.cyan.bold('\n📚 HoloBridge CLI'));
    console.log(`
Usage: ${chalk.bold('holo <command> [options]')}

Commands:
  ${chalk.green('start')}       Start the HoloBridge server
              ${chalk.gray('--watch, -w   Run in development mode with hot reload')}
  
  ${chalk.green('doctor')}      Check your environment and configuration
  
  ${chalk.green('init')}        Initialize a new .env configuration file
  
  ${chalk.green('help')}        Show this help message

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

(async () => {
    try {
        switch (command) {
            case 'start':
                await commandStart(args.slice(1));
                break;
            case 'doctor':
                await commandDoctor();
                break;
            case 'init':
                await commandInit();
                break;
            case 'help':
            case '--help':
            case '-h':
            case undefined:
                showHelp();
                break;
            default:
                console.log(chalk.red(`Unknown command: ${command}`));
                showHelp();
                process.exit(1);
        }
    } catch (err) {
        console.log(chalk.red(`Error: ${err.message}`));
        process.exit(1);
    }
})();
