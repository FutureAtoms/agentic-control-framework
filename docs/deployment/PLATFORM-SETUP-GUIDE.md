# 🚀 ACF Platform Setup Guide

**Author:** Abhilash Chadhar (FutureAtoms)  
**Last Updated:** July 2025  
**Platforms:** Windows 11, macOS (Intel/Apple Silicon), Ubuntu 22.04+ LTS

## 📋 Overview

This guide provides step-by-step instructions for setting up the Agentic Control Framework (ACF) on Windows, macOS, and Ubuntu. Follow the instructions for your specific platform.

## 🖥️ Windows 11 Setup

### Prerequisites Installation

#### 1. Install Node.js 22 LTS
```powershell
# Method 1: Download from official website (Recommended)
# Visit: https://nodejs.org/en/download
# Download "Windows Installer (.msi)" for Node.js 22.x LTS

# Method 2: Using winget (Windows Package Manager)
winget install OpenJS.NodeJS.LTS

# Method 3: Using Chocolatey
choco install nodejs-lts

# Verify installation
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x or higher
```

#### 2. Install Git
```powershell
# Method 1: Download from official website
# Visit: https://git-scm.com/download/win

# Method 2: Using winget
winget install Git.Git

# Method 3: Using Chocolatey
choco install git

# Verify installation
git --version
```

#### 3. Configure npm for Global Packages (Avoid Permission Issues)
```powershell
# Create a directory for global packages
mkdir "%USERPROFILE%\npm-global"

# Configure npm to use this directory
npm config set prefix "%USERPROFILE%\npm-global"

# Add to PATH (add this to your PowerShell profile)
$env:PATH += ";$env:USERPROFILE\npm-global"

# Make permanent by adding to system PATH via System Properties
# Or add to PowerShell profile:
echo '$env:PATH += ";$env:USERPROFILE\npm-global"' >> $PROFILE
```

### ACF Installation

#### 1. Clone the Repository
```powershell
# Clone ACF repository
git clone https://github.com/FutureAtoms/agentic-control-framework.git
cd agentic-control-framework

# Verify you're in the right directory
ls  # Should show package.json, README.md, etc.
```

#### 2. Install Dependencies
```powershell
# Install all dependencies
npm install

# Install global dependencies for MCP integration
npm install -g @modelcontextprotocol/inspector
npm install -g mcp-proxy

# Verify global installations
mcp-proxy --version
```

#### 3. Install Browser Dependencies (Playwright)
```powershell
# Install Playwright browsers and dependencies
npx playwright install
npx playwright install-deps

# Test browser installation
npx playwright --version
```

#### 4. Run Setup Script
```powershell
# Make setup script executable and run
.\setup.sh  # If using Git Bash
# OR
npm run setup  # If setup script is in package.json
```

### Starting ACF Server

#### Local Development
```powershell
# Start CLI mode
.\bin\acf init --project-name "My Project" --project-description "Testing ACF"

# Start Local MCP Server
npm run start:mcp
# OR
node .\bin\agentic-control-framework-mcp --workspaceRoot .
```

#### Cloud MCP Mode (with mcp-proxy)
```powershell
# Terminal 1: Start ACF MCP Server
node .\bin\agentic-control-framework-mcp --workspaceRoot .

# Terminal 2: Start mcp-proxy
mcp-proxy --port 8080 --target stdio --command "node .\bin\agentic-control-framework-mcp --workspaceRoot ."
```

## 🍎 macOS Setup (Intel & Apple Silicon)

### Prerequisites Installation

#### 1. Install Homebrew (if not already installed)
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add to PATH (for Apple Silicon Macs)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

#### 2. Install Node.js 22 LTS
```bash
# Method 1: Using Homebrew (Recommended)
brew install node@22
brew link node@22

# Method 2: Using Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc  # or ~/.zshrc
nvm install 22
nvm use 22
nvm alias default 22

# Method 3: Download from official website
# Visit: https://nodejs.org/en/download

# Verify installation
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x or higher
```

#### 3. Install Git (usually pre-installed)
```bash
# Check if Git is installed
git --version

# If not installed, install via Homebrew
brew install git

# Or install Xcode Command Line Tools
xcode-select --install
```

#### 4. Configure npm for Global Packages
```bash
# Create directory for global packages
mkdir ~/.npm-global

# Configure npm
npm config set prefix '~/.npm-global'

# Add to PATH in your shell profile
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc  # for bash
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc   # for zsh

# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc
```

### ACF Installation

#### 1. Clone the Repository
```bash
# Clone ACF repository
git clone https://github.com/FutureAtoms/agentic-control-framework.git
cd agentic-control-framework

# Verify you're in the right directory
ls -la  # Should show package.json, README.md, etc.
```

#### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Install global dependencies for MCP integration
npm install -g @modelcontextprotocol/inspector
npm install -g mcp-proxy

# Verify global installations
mcp-proxy --version
which mcp-proxy
```

#### 3. Install Browser Dependencies (Playwright)
```bash
# Install Playwright browsers and dependencies
npx playwright install
npx playwright install-deps

# On macOS, you might need to install additional system dependencies
# This is usually handled automatically by Playwright

# Test browser installation
npx playwright --version
```

#### 4. Run Setup Script
```bash
# Make setup script executable and run
chmod +x setup.sh
./setup.sh

# Verify binary permissions
ls -la bin/
chmod +x bin/*  # If needed
```

### Starting ACF Server

#### Local Development
```bash
# Start CLI mode
./bin/acf init --project-name "My Project" --project-description "Testing ACF"

# Start Local MCP Server
npm run start:mcp
# OR
node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)
```

#### Cloud MCP Mode (with mcp-proxy)
```bash
# Terminal 1: Start ACF MCP Server
node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)

# Terminal 2: Start mcp-proxy
mcp-proxy --port 8080 --target stdio --command "node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)"
```

## 🐧 Ubuntu 22.04+ LTS Setup

### Prerequisites Installation

#### 1. Update System Packages
```bash
# Update package lists and upgrade system
sudo apt update && sudo apt upgrade -y

# Install essential build tools
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates
```

#### 2. Install Node.js 22 LTS
```bash
# Method 1: Using NodeSource repository (Recommended)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Method 2: Using Node Version Manager (nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22

# Method 3: Using snap
sudo snap install node --classic --channel=22

# Verify installation
node --version  # Should show v22.x.x
npm --version   # Should show 10.x.x or higher
```

#### 3. Install Git
```bash
# Install Git
sudo apt install -y git

# Verify installation
git --version
```

#### 4. Configure npm for Global Packages
```bash
# Create directory for global packages
mkdir ~/.npm-global

# Configure npm
npm config set prefix '~/.npm-global'

# Add to PATH
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

#### 5. Install System Dependencies for Playwright
```bash
# Install dependencies for Playwright browsers
sudo apt install -y \
    libnss3-dev \
    libatk-bridge2.0-dev \
    libdrm2 \
    libxkbcommon-dev \
    libxcomposite-dev \
    libxdamage-dev \
    libxrandr-dev \
    libgbm-dev \
    libxss1 \
    libasound2-dev
```

### ACF Installation

#### 1. Clone the Repository
```bash
# Clone ACF repository
git clone https://github.com/FutureAtoms/agentic-control-framework.git
cd agentic-control-framework

# Verify you're in the right directory
ls -la  # Should show package.json, README.md, etc.
```

#### 2. Install Dependencies
```bash
# Install all dependencies
npm install

# Install global dependencies for MCP integration
npm install -g @modelcontextprotocol/inspector
npm install -g mcp-proxy

# Verify global installations
mcp-proxy --version
which mcp-proxy
```

#### 3. Install Browser Dependencies (Playwright)
```bash
# Install Playwright browsers and system dependencies
npx playwright install
npx playwright install-deps

# Test browser installation
npx playwright --version

# If you encounter permission issues, you might need:
sudo npx playwright install-deps
```

#### 4. Run Setup Script
```bash
# Make setup script executable and run
chmod +x setup.sh
./setup.sh

# Verify binary permissions
ls -la bin/
chmod +x bin/*  # If needed
```

### Starting ACF Server

#### Local Development
```bash
# Start CLI mode
./bin/acf init --project-name "My Project" --project-description "Testing ACF"

# Start Local MCP Server
npm run start:mcp
# OR
node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)
```

#### Cloud MCP Mode (with mcp-proxy)
```bash
# Terminal 1: Start ACF MCP Server
node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)

# Terminal 2: Start mcp-proxy
mcp-proxy --port 8080 --target stdio --command "node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)"
```

## ✅ Verification Steps (All Platforms)

### 1. Test CLI Mode
```bash
# Initialize a test project
./bin/acf init --project-name "Test Project" --project-description "Testing ACF setup"

# Add a test task
./bin/acf add --title "Test Task" --description "Verify ACF is working" --priority high

# List tasks
./bin/acf list

# Expected: Should show your test task
```

### 2. Test Local MCP Server
```bash
# Start MCP server in one terminal
node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)

# In another terminal, test with MCP inspector
npx @modelcontextprotocol/inspector

# Expected: Should connect and show 79+ available tools
```

### 3. Test Cloud MCP Mode
```bash
# Start mcp-proxy
mcp-proxy --port 8080 --target stdio --command "node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd)"

# Test HTTP endpoint
curl http://localhost:8080/health

# Expected: Should return server status
```

### 4. Test Browser Automation
```bash
# Test Playwright installation
node -e "const { chromium } = require('playwright'); (async () => { const browser = await chromium.launch(); console.log('✅ Browser test passed'); await browser.close(); })()"

# Expected: Should print "✅ Browser test passed"
```

## 🔧 Troubleshooting

### Common Issues

#### Permission Errors (npm global installs)
```bash
# Fix npm permissions (all platforms)
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH

# Windows: Use npm-global directory in user profile
# macOS/Linux: Use ~/.npm-global directory
```

#### Playwright Browser Issues
```bash
# Reinstall browsers
npx playwright install --force

# Install system dependencies
npx playwright install-deps

# Test specific browser
npx playwright install chromium
```

#### Port Already in Use
```bash
# Find process using port 8080
# Windows:
netstat -ano | findstr :8080

# macOS/Linux:
lsof -i :8080

# Kill process and restart
```

#### Node.js Version Issues
```bash
# Check Node.js version
node --version

# Should be v22.x.x or higher
# If not, reinstall Node.js 22 LTS using methods above
```

#### Server Won't Start
```bash
# Check if all dependencies are installed
npm list --depth=0

# Reinstall dependencies if needed
rm -rf node_modules package-lock.json
npm install

# Check binary permissions (macOS/Linux)
ls -la bin/
chmod +x bin/*

# Check for syntax errors
node --check ./bin/agentic-control-framework-mcp
```

#### MCP Tools Not Showing
```bash
# Verify MCP server is responding
node ./bin/agentic-control-framework-mcp --workspaceRoot $(pwd) --test

# Check tool count
curl -X POST http://localhost:8080/tools/list -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

# Should return 83+ tools
```

## 🎯 Next Steps

After successful setup:

1. **Configure IDE Integration**: Follow [SETUP-INSTRUCTIONS.md](SETUP-INSTRUCTIONS.md)
2. **Read Documentation**: Check [README.md](README.md) for usage examples
3. **Run Tests**: Execute `npm test` to verify everything works
4. **Start Building**: Begin using ACF for your autonomous agent projects

## 📞 Support

If you encounter issues:
- Check the [Troubleshooting section](#-troubleshooting) above
- Review [SETUP-INSTRUCTIONS.md](SETUP-INSTRUCTIONS.md) for IDE-specific setup
- Consult [COMPREHENSIVE-TESTING-REPORT.md](COMPREHENSIVE-TESTING-REPORT.md) for verified configurations

---

**Setup Guide Version:** 1.0  
**Compatible with:** ACF v0.1.1+  
**Platforms Tested:** Windows 11, macOS 14+, Ubuntu 22.04+ LTS
