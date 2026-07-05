#!/usr/bin/env node
/**
 * ShadowLine 0-to-100 Automated Setup & Launcher
 *
 * Cross-platform CLI wizard for Linux Ubuntu, Windows, and macOS.
 * Handles environment configuration, dependency installation, and
 * launching local dev/prod servers or cloud deployments.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Bug fix: on Windows npm is npm.cmd — using shell:true triggers DEP0190 security warning
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_LOCAL_PATH = path.join(ROOT_DIR, '.env.local');

// ANSI Color codes for terminal formatting
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function printBanner() {
  console.clear();
  console.log(`${colors.cyan}${colors.bold}`);
  console.log('   ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗██╗     ██╗███╗   ██╗███████╗');
  console.log('   ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║██║     ██║████╗  ██║██╔════╝');
  console.log('   ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║██║     ██║██╔██╗ ██║█████╗  ');
  console.log('   ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║██║     ██║██║╚██╗██║██╔══╝  ');
  console.log('   ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝███████╗██║██║ ╚████║███████╗');
  console.log('   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝');
  console.log(`${colors.reset}`);
  console.log(`${colors.green}${colors.bold}      🔒 Confidential Asset Shielding Protocol  |  ⚡ Powered by Zama FHEVM${colors.reset}`);
  console.log(`${colors.magenta}      🌐 Open-Source Protocol (MIT License)     |  💎 Powered by x.com/andy1eth${colors.reset}`);
  console.log(`${colors.cyan}   ────────────────────────────────────────────────────────────────────────────────────${colors.reset}\n`);
}

function checkNodeVersion() {
  const version = process.version.replace('v', '').split('.')[0];
  if (parseInt(version, 10) < 18) {
    console.error(`${colors.red}[ERROR] Node.js version 18 or higher is required. You are running ${process.version}${colors.reset}`);
    process.exit(1);
  }
  console.log(`${colors.green}✔ Node.js version check passed (${process.version})${colors.reset}`);
}

/**
 * Checks if Turbopack native (.node) bindings are present in node_modules.
 * This is a reliable, zero-execution file-system check — no EINVAL risk.
 * Turbopack ships per-platform native modules like:
 *   @next/swc-win32-x64-msvc / @next/swc-linux-x64-gnu / @next/swc-darwin-arm64
 */
function hasTurbopackNativeBindings() {
  const platform = process.platform;   // 'win32' | 'linux' | 'darwin'
  const arch     = process.arch;       // 'x64' | 'arm64'

  // Map platform+arch to the native package name Next.js ships
  const platformMap = {
    'win32-x64':    '@next/swc-win32-x64-msvc',
    'win32-arm64':  '@next/swc-win32-arm64-msvc',
    'linux-x64':    '@next/swc-linux-x64-gnu',
    'linux-arm64':  '@next/swc-linux-arm64-gnu',
    'darwin-x64':   '@next/swc-darwin-x64',
    'darwin-arm64': '@next/swc-darwin-arm64',
  };

  const pkg = platformMap[`${platform}-${arch}`];
  if (!pkg) return false; // Unknown platform → assume no native support

  // Check if the package directory exists in node_modules
  const pkgDir = path.join(ROOT_DIR, 'node_modules', pkg);
  return fs.existsSync(pkgDir);
}

// Bug fix: open stdin stream once and reuse — avoids multiple /dev/tty handles and leaks
let _stdinStream = null;
function getInputStream() {
  if (process.stdin.isTTY) return process.stdin;
  if (_stdinStream) return _stdinStream;
  try {
    if (process.platform === 'win32') {
      _stdinStream = fs.createReadStream('\\\\.\\CON');
    } else if (fs.existsSync('/dev/tty')) {
      _stdinStream = fs.openSync('/dev/tty', 'r');
      _stdinStream = fs.createReadStream(null, { fd: _stdinStream });
    }
  } catch (e) {
    // Fallback to stdin
  }
  return _stdinStream || process.stdin;
}

// Bug fix: create rl once and pass it around instead of recreating in each function
let _rl = null;
function getRl() {
  if (!_rl || _rl.closed) {
    _rl = readline.createInterface({
      input: getInputStream(),
      output: process.stdout,
      terminal: true,
    });
  }
  return _rl;
}

function closeRl() {
  if (_rl && !_rl.closed) {
    _rl.close();
    _rl = null;
  }
}

function question(query) {
  return new Promise((resolve) => getRl().question(query, resolve));
}

async function setupEnvironment() {
  console.log(`\n${colors.bold}─── Step 1: Environment Configuration (.env.local) ───${colors.reset}`);

  if (fs.existsSync(ENV_LOCAL_PATH)) {
    console.log(`${colors.green}✔ .env.local already exists. Using existing configuration.${colors.reset}`);
    return;
  }

  console.log(`${colors.yellow}ℹ .env.local not found. Generating default public configuration...${colors.reset}`);

  const customize = await question(`${colors.cyan}? Do you want to configure custom API keys (WalletConnect / Relayer)? [y/N]: ${colors.reset}`);

  let wcId = 'public-demo-project-id';
  let relayerKey = '';

  if (customize.trim().toLowerCase() === 'y' || customize.trim().toLowerCase() === 'yes') {
    const inputWc = await question(`${colors.cyan}? Enter WalletConnect Project ID (leave blank for public fallback): ${colors.reset}`);
    if (inputWc.trim()) wcId = inputWc.trim();

    const inputRelayer = await question(`${colors.cyan}? Enter Zama Relayer API Key (leave blank for public testnet mode): ${colors.reset}`);
    if (inputRelayer.trim()) relayerKey = inputRelayer.trim();
  }

  const envContent = [
    '# ShadowLine Automated Configuration',
    'NEXT_PUBLIC_APP_URL="http://localhost:3000"',
    'NEXT_PUBLIC_DEFAULT_CHAIN="sepolia"',
    `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="${wcId}"`,
    `NEXT_PUBLIC_ZAMA_RELAYER_API_KEY="${relayerKey}"`,
    '',
  ].join('\n');

  fs.writeFileSync(ENV_LOCAL_PATH, envContent, 'utf8');
  console.log(`${colors.green}✔ Created .env.local successfully!${colors.reset}`);
}

function installDependencies() {
  console.log(`\n${colors.bold}─── Step 2: Installing Dependencies ───${colors.reset}`);
  const nodeModulesPath = path.join(ROOT_DIR, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    console.log(`${colors.green}✔ node_modules found. Verifying packages are up to date...${colors.reset}`);
  } else {
    console.log(`${colors.yellow}ℹ node_modules not found. Installing project dependencies...${colors.reset}`);
  }
  try {
    execSync('npm install', { stdio: 'inherit', cwd: ROOT_DIR });
    console.log(`${colors.green}✔ Project dependencies verified and ready.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}[ERROR] Failed to install dependencies.${colors.reset}`);
    process.exit(1);
  }
}

async function presentMenu() {
  console.log(`\n${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════════════════════`);
  console.log(`🎉 SETUP COMPLETE! What would you like to do next?`);
  console.log(`═══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}[1] 🚀 Start Local Development Server (npm run dev) [RECOMMENDED]${colors.reset}`);
  console.log(`[2] 🌐 Start Production Server (npm run start)`);
  console.log(`[3] ☁️  Deploy to Netlify (via Netlify CLI)`);
  console.log(`[4] ☁️  Deploy to Vercel (via Vercel CLI)`);
  console.log(`[5] 🐳 Launch Docker Container (docker compose up -d)`);
  console.log(`[0] ❌ Exit`);
  console.log(`${colors.magenta}───────────────────────────────────────────────────────────────────────${colors.reset}`);

  const choice = await question(`${colors.cyan}? Select an option [0-5]: ${colors.reset}`);
  // Close readline BEFORE spawning long-running processes so stdin is released
  closeRl();

  switch (choice.trim()) {
    case '1': {
      // Reliably detect Turbopack support by checking if native .node binding file exists on disk.
      // This avoids the EINVAL bug from trying to run `next dev --version` which doesn't exist.
      const devArgs = hasTurbopackNativeBindings()
        ? ['run', 'dev']
        : ['run', 'dev', '--', '--webpack'];
      if (devArgs.includes('--webpack')) {
        console.log(`${colors.yellow}⚠  Turbopack native bindings not found. Using Webpack bundler instead.${colors.reset}`);
      }
      console.log(`\n${colors.green}🚀 Launching local development server on http://localhost:3000 ...${colors.reset}\n`);
      spawn(NPM, devArgs, { stdio: 'inherit', cwd: ROOT_DIR });
      break;
    }
    case '2':
      console.log(`\n${colors.green}🌐 Launching production server on http://localhost:3000 ...${colors.reset}\n`);
      spawn(NPM, ['run', 'start'], { stdio: 'inherit', cwd: ROOT_DIR });
      break;
    case '3':
      console.log(`\n${colors.cyan}☁️  Deploying to Netlify...${colors.reset}`);
      console.log(`${colors.yellow}ℹ Make sure you are logged in. If not, run: npx netlify login${colors.reset}\n`);
      try {
        execSync('npx netlify-cli deploy --prod', { stdio: 'inherit', cwd: ROOT_DIR });
      } catch (e) {
        console.error(`${colors.red}[ERROR] Netlify deployment failed.${colors.reset}`);
      }
      break;
    case '4':
      console.log(`\n${colors.cyan}☁️  Deploying to Vercel...${colors.reset}`);
      console.log(`${colors.yellow}ℹ Make sure you are logged in. If not, run: npx vercel login${colors.reset}\n`);
      try {
        execSync('npx vercel --prod', { stdio: 'inherit', cwd: ROOT_DIR });
      } catch (e) {
        console.error(`${colors.red}[ERROR] Vercel deployment failed.${colors.reset}`);
      }
      break;
    case '5':
      console.log(`\n${colors.cyan}🐳 Launching Docker container...${colors.reset}\n`);
      try {
        execSync('docker compose up -d --build', { stdio: 'inherit', cwd: ROOT_DIR });
        console.log(`${colors.green}✔ Docker container running on http://localhost:3000${colors.reset}`);
      } catch (e) {
        console.error(`${colors.red}[ERROR] Docker command failed. Is Docker running?${colors.reset}`);
      }
      break;
    case '0':
      console.log(`\n${colors.yellow}Goodbye! Re-run anytime with: npm run setup${colors.reset}\n`);
      process.exit(0);
      break;
    default:
      console.log(`${colors.red}Invalid option. Exiting.${colors.reset}`);
      process.exit(0);
  }
}

async function main() {
  printBanner();
  checkNodeVersion();
  await setupEnvironment();
  installDependencies();
  await presentMenu();
}

main().catch((err) => {
  console.error(`${colors.red}[FATAL ERROR]`, err.message || err, colors.reset);
  closeRl();
  process.exit(1);
});
