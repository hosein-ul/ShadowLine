# ShadowLine 0-to-100 Quick Installer & Prerequisite Auto-Installer for Windows PowerShell
#
# Usage (PowerShell):
#   irm https://raw.githubusercontent.com/hosein-ul/ShadowLine/main/scripts/setup.ps1 | iex
# Or locally:
#   .\scripts\setup.ps1

$ErrorActionPreference = "Stop"

Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "🚀 SHADOWLINE 0-TO-100 WINDOWS LAUNCHER & AUTO-INSTALLER" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan

# 1. Check & Auto-Install Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "ℹ Git not found on your system. Attempting automatic installation via winget..." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements
        # Refresh environment path
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } elseif (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install git -y
    } else {
        Write-Host "[ERROR] Git is not installed and winget/choco was not found. Please install Git from https://git-scm.com/ and re-run." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✔ Git is already installed." -ForegroundColor Green
}

# 2. Check & Auto-Install Node.js (v18+)
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ℹ Node.js not found. Attempting automatic installation of Node.js LTS via winget..." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
        # Refresh environment path
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    } elseif (Get-Command choco -ErrorAction SilentlyContinue) {
        choco install nodejs-lts -y
    } else {
        Write-Host "[ERROR] Node.js is not installed and winget/choco was not found. Please install Node.js v18+ from https://nodejs.org/ and re-run." -ForegroundColor Red
        exit 1
    }
} else {
    $nodeVer = (node -v) -replace 'v','' -split '\.' | Select-Object -First 1
    if ([int]$nodeVer -lt 18) {
        Write-Host "[ERROR] Node.js version 18 or higher is required. Please upgrade Node.js." -ForegroundColor Red
        exit 1
    }
    Write-Host "✔ Node.js version check passed ($(node -v))." -ForegroundColor Green
}

# 3. Check repo or clone
if (-not (Test-Path "package.json") -or -not (Get-Content "package.json" -Raw | Select-String '"name": "shadowline"')) {
    Write-Host "ℹ ShadowLine repository not detected in current directory." -ForegroundColor Yellow
    Write-Host "Cloning ShadowLine from GitHub..." -ForegroundColor Cyan
    if (Test-Path "ShadowLine") {
        Write-Host "Directory ShadowLine already exists. Entering directory..." -ForegroundColor Yellow
        Set-Location "ShadowLine"
        git pull origin main
    } else {
        git clone https://github.com/hosein-ul/ShadowLine.git
        Set-Location "ShadowLine"
    }
}

# 4. Launch setup wizard
Write-Host "✔ Environment ready! Launching interactive setup wizard..." -ForegroundColor Green
node scripts/setup.js
