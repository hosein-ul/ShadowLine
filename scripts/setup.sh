#!/usr/bin/env bash
# ShadowLine 0-to-100 Quick Installer for Ubuntu Linux, Debian & macOS
#
# Usage:
#   curl -sSL https://raw.githubusercontent.com/hosein-ul/shadowline/main/scripts/setup.sh | bash
#
# Or run locally inside the repo:
#   bash scripts/setup.sh

set -e

GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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
if [ "$EUID" -ne 0 ] && command -v sudo &> /dev/null; then
    SUDO="sudo"
elif [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Warning: Running without root privileges and sudo is not installed.${NC}"
fi

# 0. Ensure curl is installed (required for NodeSource and downloading)
if ! command -v curl &> /dev/null; then
    echo -e "${YELLOW}ℹ curl not found. Attempting to install...${NC}"
    if command -v apt-get &> /dev/null; then
        $SUDO apt-get update -y && $SUDO apt-get install -y curl ca-certificates
    elif command -v brew &> /dev/null; then
        brew install curl
    else
        echo -e "${RED}[ERROR] curl is required. Please install curl and try again.${NC}"
        exit 1
    fi
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
    echo -e "${GREEN}✔ Git is already installed (${NC}$(git --version)${GREEN}).${NC}"
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
        echo -e "${YELLOW}ℹ Node.js version v$NODE_VER is older than required v18. Attempting upgrade to v20 LTS...${NC}"
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
        echo -e "${GREEN}✔ Node.js version check passed (${NC}$(node -v)${GREEN}).${NC}"
    fi
fi

# 3. Check if we are inside the repository or need to clone
if [ ! -f "package.json" ] || ! grep -q '"name": "shadowline"' package.json 2>/dev/null; then
    echo -e "${YELLOW}ℹ ShadowLine repository not detected in current directory.${NC}"
    echo -e "${CYAN}Cloning ShadowLine from GitHub...${NC}"
    if [ -d "shadowline" ]; then
        echo -e "${YELLOW}Directory shadowline already exists. Entering directory...${NC}"
        cd shadowline
        git pull origin main
    elif [ -d "ShadowLine" ]; then
        echo -e "${YELLOW}Directory ShadowLine already exists. Entering directory...${NC}"
        cd ShadowLine
        git pull origin main
    else
        git clone https://github.com/hosein-ul/shadowline.git shadowline
        cd shadowline
    fi
fi

# 4. Launch the cross-platform Node.js Setup Wizard
echo -e "${GREEN}✔ Environment ready! Launching interactive setup wizard...${NC}"
node scripts/setup.js
