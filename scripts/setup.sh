#!/usr/bin/env bash
# ShadowLine 0-to-100 Quick Installer for Ubuntu Linux, Debian & macOS
#
# Usage (one-liner):
#   curl -sSL https://raw.githubusercontent.com/hosein-ul/ShadowLine/main/scripts/setup.sh | bash
#
# Or locally inside the repo:
#   bash scripts/setup.sh

# Bug fix: use set -euo pipefail for robust error handling
# -e: exit on error, -u: treat unset variables as error, -o pipefail: catch pipe failures
set -euo pipefail

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
cat << "EOF"
   ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗██╗     ██╗███╗   ██╗███████╗
   ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║██║     ██║████╗  ██║██╔════╝
   ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║██║     ██║██╔██╗ ██║█████╗  
   ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║██║     ██║██║╚██╗██║██╔══╝  
   ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝███████╗██║██║ ╚████║███████╗
   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝
EOF
echo -e "${NC}"
echo -e "${GREEN}      🔒 Confidential Asset Shielding Protocol  |  ⚡ Powered by Zama FHEVM${NC}"
echo -e "${YELLOW}      🌐 Open-Source Protocol (MIT License)     |  💎 Powered by x.com/andy1eth${NC}"
echo -e "${CYAN}   ────────────────────────────────────────────────────────────────────────────────────${NC}\n"

# Detect root / sudo availability
SUDO=""
if [ "${EUID:-$(id -u)}" -ne 0 ] && command -v sudo &> /dev/null; then
    SUDO="sudo"
elif [ "${EUID:-$(id -u)}" -ne 0 ]; then
    echo -e "${YELLOW}Warning: Running without root privileges and sudo is not installed. Package installs may fail.${NC}"
fi

# 0. Ensure curl is installed (required for NodeSource)
if ! command -v curl &> /dev/null; then
    echo -e "${YELLOW}ℹ curl not found. Attempting to install...${NC}"
    if command -v apt-get &> /dev/null; then
        $SUDO apt-get update -y && $SUDO apt-get install -y curl ca-certificates
    elif command -v brew &> /dev/null; then
        brew install curl
    else
        echo -e "${RED}[ERROR] curl is required but could not be installed. Please install curl manually.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✔ curl is available.${NC}"
fi

# 1. Check & Auto-Install Git
if ! command -v git &> /dev/null; then
    echo -e "${YELLOW}ℹ Git not found. Attempting to install...${NC}"
    if command -v apt-get &> /dev/null; then
        echo -e "${CYAN}Installing git via apt-get (Ubuntu/Debian)...${NC}"
        $SUDO apt-get update -y && $SUDO apt-get install -y git
    elif command -v brew &> /dev/null; then
        echo -e "${CYAN}Installing git via Homebrew (macOS)...${NC}"
        brew install git
    else
        echo -e "${RED}[ERROR] Git is required. Please install git and try again.${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✔ Git is already installed ($(git --version)).${NC}"
fi

# 2. Check & Auto-Install Node.js (v18+)
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}ℹ Node.js not found. Installing Node.js v20 (LTS)...${NC}"
    if command -v apt-get &> /dev/null; then
        echo -e "${CYAN}Installing Node.js via NodeSource (Ubuntu/Debian)...${NC}"
        $SUDO apt-get update -y && $SUDO apt-get install -y ca-certificates gnupg
        curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
        $SUDO apt-get install -y nodejs
    elif command -v brew &> /dev/null; then
        echo -e "${CYAN}Installing Node.js via Homebrew (macOS)...${NC}"
        brew install node
    else
        echo -e "${RED}[ERROR] Node.js is required. Please install Node.js v18+ and try again.${NC}"
        exit 1
    fi
else
    NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VER" -lt 18 ]; then
        echo -e "${YELLOW}ℹ Node.js v$NODE_VER is older than required v18. Upgrading to v20 LTS...${NC}"
        if command -v apt-get &> /dev/null; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
            $SUDO apt-get install -y nodejs
        elif command -v brew &> /dev/null; then
            brew upgrade node
        else
            echo -e "${RED}[ERROR] Node.js version 18 or higher is required. Found v$NODE_VER.${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✔ Node.js version check passed ($(node -v)).${NC}"
    fi
fi

# 3. Clone or locate the repository
# Bug fix: track the repo directory explicitly instead of relying on cd side-effects
REPO_DIR=""

if [ -f "package.json" ] && grep -q '"name": "shadowline"' package.json 2>/dev/null; then
    # Already inside the repo
    REPO_DIR="$(pwd)"
    echo -e "${GREEN}✔ ShadowLine repository detected in current directory.${NC}"
elif [ -d "shadowline" ]; then
    echo -e "${YELLOW}ℹ Directory 'shadowline' found. Updating...${NC}"
    cd shadowline
    # Bug fix: don't fail on git pull errors (e.g. already up to date, detached HEAD)
    git pull origin main || echo -e "${YELLOW}Warning: git pull had an issue; continuing with existing code.${NC}"
    REPO_DIR="$(pwd)"
elif [ -d "ShadowLine" ]; then
    echo -e "${YELLOW}ℹ Directory 'ShadowLine' found. Updating...${NC}"
    cd ShadowLine
    git pull origin main || echo -e "${YELLOW}Warning: git pull had an issue; continuing with existing code.${NC}"
    REPO_DIR="$(pwd)"
else
    echo -e "${CYAN}Cloning ShadowLine from GitHub...${NC}"
    git clone https://github.com/hosein-ul/ShadowLine.git shadowline
    cd shadowline
    REPO_DIR="$(pwd)"
fi

echo -e "${GREEN}✔ Working directory: $REPO_DIR${NC}\n"

# 4. Launch the interactive setup wizard
# Bug fix: redirect stdin from /dev/tty so readline works even when piped via curl | bash
if [ -t 0 ]; then
    # stdin is already a terminal — run normally
    node "$REPO_DIR/scripts/setup.js"
elif [ -e /dev/tty ]; then
    # stdin is a pipe (curl | bash) — redirect from the real terminal
    node "$REPO_DIR/scripts/setup.js" < /dev/tty
else
    echo -e "${RED}[ERROR] No interactive terminal available. Please run the script directly (not via pipe):${NC}"
    echo -e "${CYAN}  bash scripts/setup.sh${NC}"
    exit 1
fi
