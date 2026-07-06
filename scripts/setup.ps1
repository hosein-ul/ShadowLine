# ShadowLine 0-to-100 Quick Installer & Prerequisite Auto-Installer for Windows PowerShell
#
# Usage (one-liner in PowerShell):
#   irm https://raw.githubusercontent.com/hosein-ul/ShadowLine/main/scripts/setup.ps1 | iex
#
# Or locally:
#   .\scripts\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host '   ███████╗██╗  ██╗ █████╗ ██████╗  ██████╗ ██╗    ██╗██╗     ██╗███╗   ██╗███████╗' -ForegroundColor Cyan
Write-Host '   ██╔════╝██║  ██║██╔══██╗██╔══██╗██╔═══██╗██║    ██║██║     ██║████╗  ██║██╔════╝' -ForegroundColor Cyan
Write-Host '   ███████╗███████║███████║██║  ██║██║   ██║██║ █╗ ██║██║     ██║██╔██╗ ██║█████╗  ' -ForegroundColor Cyan
Write-Host '   ╚════██║██╔══██║██╔══██║██║  ██║██║   ██║██║███╗██║██║     ██║██║╚██╗██║██╔══╝  ' -ForegroundColor Cyan
Write-Host '   ███████║██║  ██║██║  ██║██████╔╝╚██████╔╝╚███╔███╔╝███████╗██║██║ ╚████║███████╗' -ForegroundColor Cyan
Write-Host '   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝  ╚═════╝  ╚══╝╚══╝ ╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝' -ForegroundColor Cyan
Write-Host '      🔒 Confidential Asset Shielding Protocol  |  ⚡ Powered by Zama FHEVM' -ForegroundColor Green
Write-Host '      🌐 Open-Source Protocol (MIT License)     |  💎 Powered by x.com/andy1eth' -ForegroundColor Magenta
Write-Host '   ────────────────────────────────────────────────────────────────────────────────────' -ForegroundColor Cyan
Write-Host ""

# Helper to refresh PATH in current session after winget/choco installs
function Refresh-Path {
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath    = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path    = "$machinePath;$userPath"
}

# 1. Check & Auto-Install Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ℹ Git not found. Attempting automatic installation..." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
        Refresh-Path
    } elseif (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install git -y
        Refresh-Path
    } else {
        Write-Host "[ERROR] Git is not installed and no package manager (winget/choco) was found." -ForegroundColor Red
        Write-Host "Please install Git from https://git-scm.com/ and re-run this script." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✔ Git is already installed ($(git --version))." -ForegroundColor Green
}

# 2. Check & Auto-Install Node.js (v18+)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ℹ Node.js not found. Attempting automatic installation of Node.js LTS..." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
        Refresh-Path
    } elseif (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install nodejs-lts -y
        Refresh-Path
    } else {
        Write-Host "[ERROR] Node.js is not installed and no package manager was found." -ForegroundColor Red
        Write-Host "Please install Node.js v18+ from https://nodejs.org/ and re-run this script." -ForegroundColor Red
        exit 1
    }
} else {
    try {
        $nodeVer = (node -v) -replace 'v','' -split '\.' | Select-Object -First 1
        if ([int]$nodeVer -lt 18) {
            Write-Host "[ERROR] Node.js version 18 or higher is required. Found v$nodeVer. Please upgrade." -ForegroundColor Red
            exit 1
        }
        Write-Host "✔ Node.js version check passed ($(node -v))." -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Could not determine Node.js version. Please ensure Node.js v18+ is installed." -ForegroundColor Red
        exit 1
    }
}

# 3. Clone or locate the repository
# Bug fix: track $RepoDir explicitly rather than relying on Set-Location side-effects
$RepoDir = $null

# Bug fix: safely check package.json content (avoid null reference if file doesn't exist)
$InRepo = $false
if (Test-Path "package.json") {
    $pkgContent = Get-Content "package.json" -Raw -ErrorAction SilentlyContinue
    if ($pkgContent -and ($pkgContent | Select-String '"name": "shadowline"' -Quiet)) {
        $InRepo = $true
    }
}

if ($InRepo) {
    $RepoDir = (Get-Location).Path
    Write-Host "✔ ShadowLine repository detected in current directory." -ForegroundColor Green
} elseif ((Test-Path "shadowline\package.json") -and (Test-Path "shadowline\.git")) {
    Write-Host "ℹ Directory 'shadowline' found. Updating..." -ForegroundColor Yellow
    Set-Location "shadowline"
    git pull origin main
    $RepoDir = (Get-Location).Path
} elseif ((Test-Path "ShadowLine\package.json") -and (Test-Path "ShadowLine\.git")) {
    Write-Host "ℹ Directory 'ShadowLine' found. Updating..." -ForegroundColor Yellow
    Set-Location "ShadowLine"
    git pull origin main
    $RepoDir = (Get-Location).Path
} else {
    Write-Host "Cloning ShadowLine from GitHub..." -ForegroundColor Cyan
    $currName = Split-Path -Leaf (Get-Location).Path
    if (($currName -ieq "shadowline") -and -not (Get-ChildItem -Force | Where-Object { $_.Name -ne "." -and $_.Name -ne ".." })) {
        git clone https://github.com/hosein-ul/ShadowLine.git .
    } else {
        git clone https://github.com/hosein-ul/ShadowLine.git shadowline
        Set-Location "shadowline"
    }
    $RepoDir = (Get-Location).Path
}

Write-Host "✔ Working directory: $RepoDir" -ForegroundColor Green
Write-Host ""

# 4. Launch interactive setup wizard
# Bug fix: When run via irm | iex, node.exe stdin is connected to the PowerShell pipe.
# We must pass the script path explicitly and rely on setup.js's /dev/tty equivalent (CONIN$).
Write-Host "✔ Environment ready! Launching interactive setup wizard..." -ForegroundColor Green
$SetupScript = Join-Path $RepoDir "scripts\setup.js"
node $SetupScript
