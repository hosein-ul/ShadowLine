#!/usr/bin/env node
/**
 * ShadowLine 0-to-100 Automated Setup & Launcher
 *
 * Cross-platform CLI wizard for Linux Ubuntu, Windows, and macOS.
 * Handles environment configuration, dependency installation, production build
 * verification, and launching local dev/prod servers or cloud deployments.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

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

function getInputStream() {
  if (process.stdin.isTTY) {
    return process.stdin;
  }
  try {
    if (process.platform === 'win32') {
      return fs.createReadStream('CONIN$');
    } else if (fs.existsSync('/dev/tty')) {
      return fs.createReadStream('/dev/tty');
    }
  } catch (e) {
    // Ignore and fallback
  }
  return process.stdin;
}

function createRl() {
  return readline.createInterface({
    input: getInputStream(),
    output: process.stdout,
  });
}

function question(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function setupEnvironment() {
  console.log(`\n${colors.bold}─── Step 1: Environment Configuration (.env.local) ───${colors.reset}`);
  
  if (fs.existsSync(ENV_LOCAL_PATH)) {
    console.log(`${colors.green}✔ .env.local already exists. Using existing configuration.${colors.reset}`);
    return;
  }

  console.log(`${colors.yellow}ℹ .env.local not found. Generating default public configuration...${colors.reset}`);
  
  const rl = createRl();
  const customize = await question(rl, `${colors.cyan}? Do you want to configure custom API keys (WalletConnect / Relayer)? [y/N]: ${colors.reset}`);
  
  let wcId = 'public-demo-project-id';
  let relayerKey = '';
  
  if (customize.trim().toLowerCase() === 'y' || customize.trim().toLowerCase() === 'yes') {
    const inputWc = await question(rl, `${colors.cyan}? Enter WalletConnect Project ID (leave blank for public fallback): ${colors.reset}`);
    if (inputWc.trim()) wcId = inputWc.trim();
    
    const inputRelayer = await question(rl, `${colors.cyan}? Enter Zama Relayer API Key (leave blank for public testnet mode): ${colors.reset}`);
    if (inputRelayer.trim()) relayerKey = inputRelayer.trim();
  }
  rl.close();

  const envContent = `# ShadowLine Automated Configuration
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_DEFAULT_CHAIN="sepolia"
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="${wcId}"
NEXT_PUBLIC_ZAMA_RELAYER_API_KEY="${relayerKey}"
`;

  fs.writeFileSync(ENV_LOCAL_PATH, envContent, 'utf8');
  console.log(`${colors.green}✔ Created .env.local successfully!${colors.reset}`);
}

function installDependencies() {
  console.log(`\n${colors.bold}─── Step 2: Installing Dependencies ───${colors.reset}`);
  try {
    execSync('npm install', { stdio: 'inherit', cwd: ROOT_DIR });
    console.log(`${colors.green}✔ Dependencies installed successfully.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}[ERROR] Failed to install dependencies.${colors.reset}`);
    process.exit(1);
  }
}

function verifyBuild() {
  console.log(`\n${colors.bold}─── Step 3: Verifying Production Build ───${colors.reset}`);
  console.log(`${colors.yellow}ℹ Running npm run build to ensure code compilation integrity...${colors.reset}`);
  try {
    execSync('npm run build', { stdio: 'inherit', cwd: ROOT_DIR });
    console.log(`${colors.green}✔ Production bundle verified successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}[ERROR] Production build failed. Please check compilation errors above.${colors.reset}`);
    process.exit(1);
  }
}

async function presentMenu() {
  console.log(`\n${colors.bold}${colors.magenta}═══════════════════════════════════════════════════════════════════════`);
  console.log(`🎉 0-TO-100 SETUP COMPLETE! What would you like to do next?`);
  console.log(`═══════════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.green}[1] 🚀 Start Local Development Server (npm run dev) [RECOMMENDED]${colors.reset}`);
  console.log(`[2] 🌐 Start Production Server (npm run start)`);
  console.log(`[3] ☁️  Deploy to Netlify (via Netlify CLI)`);
  console.log(`[4] ☁️  Deploy to Vercel (via Vercel CLI)`);
  console.log(`[5] 🐳 Launch Docker Container (docker compose up -d)`);
  console.log(`[0] ❌ Exit`);
  console.log(`${colors.magenta}───────────────────────────────────────────────────────────────────────${colors.reset}`);

  const rl = createRl();
  const choice = await question(rl, `${colors.cyan}? Select an option [0-5]: ${colors.reset}`);
  rl.close();

  switch (choice.trim()) {
    case '1':
      console.log(`\n${colors.green}🚀 Launching local development server on http://localhost:3000 ...${colors.reset}`);
      spawn('npm', ['run', 'dev'], { stdio: 'inherit', cwd: ROOT_DIR, shell: true });
      break;
    case '2':
      console.log(`\n${colors.green}🌐 Launching production server on http://localhost:3000 ...${colors.reset}`);
      spawn('npm', ['run', 'start'], { stdio: 'inherit', cwd: ROOT_DIR, shell: true });
      break;
    case '3':
      console.log(`\n${colors.cyan}☁️ Deploying to Netlify...${colors.reset}`);
      try {
        execSync('npx netlify deploy --prod', { stdio: 'inherit', cwd: ROOT_DIR });
      } catch (e) {
        console.error(`${colors.red}[ERROR] Netlify deployment failed. Make sure you are logged in via 'npx netlify login'.${colors.reset}`);
      }
      break;
    case '4':
      console.log(`\n${colors.cyan}☁️ Deploying to Vercel...${colors.reset}`);
      try {
        execSync('npx vercel --prod', { stdio: 'inherit', cwd: ROOT_DIR });
      } catch (e) {
        console.error(`${colors.red}[ERROR] Vercel deployment failed. Make sure you are logged in via 'npx vercel login'.${colors.reset}`);
      }
      break;
    case '5':
      console.log(`\n${colors.cyan}🐳 Launching Docker container...${colors.reset}`);
      try {
        execSync('docker compose up -d --build', { stdio: 'inherit', cwd: ROOT_DIR });
        console.log(`${colors.green}✔ Docker container running on http://localhost:3000${colors.reset}`);
      } catch (e) {
        console.error(`${colors.red}[ERROR] Docker command failed. Is Docker running on your system?${colors.reset}`);
      }
      break;
    case '0':
      console.log(`\n${colors.yellow}Goodbye! You can re-run this wizard anytime with: npm run setup${colors.reset}\n`);
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
  verifyBuild();
  await presentMenu();
}

main().catch((err) => {
  console.error(`${colors.red}[FATAL ERROR]`, err, colors.reset);
  process.exit(1);
});
