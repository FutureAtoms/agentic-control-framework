#!/bin/bash

# SWE-bench + ACF MCP Integration Setup Script
# This script sets up the complete environment for running SWE-bench with ACF MCP

set -e  # Exit on error

echo "================================================"
echo "SWE-bench + ACF MCP Integration Setup"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check prerequisites
echo -e "\n${GREEN}Checking prerequisites...${NC}"

# Check Python version
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
    if (( $(echo "$PYTHON_VERSION >= 3.8" | bc -l) )); then
        print_status "Python $PYTHON_VERSION found"
    else
        print_error "Python 3.8+ required, found $PYTHON_VERSION"
        exit 1
    fi
else
    print_error "Python 3 not found"
    exit 1
fi

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 18 ]; then
        print_status "Node.js $(node -v) found"
    else
        print_error "Node.js 18+ required, found $(node -v)"
        exit 1
    fi
else
    print_error "Node.js not found"
    exit 1
fi

# Check Docker
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        print_status "Docker is installed and running"
    else
        print_warning "Docker is installed but not running or requires sudo"
        print_warning "Please ensure Docker is running and you have permissions"
    fi
else
    print_error "Docker not found. Please install Docker first."
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    print_status "Git found"
else
    print_error "Git not found"
    exit 1
fi

# Create virtual environment
echo -e "\n${GREEN}Setting up Python environment...${NC}"

if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_status "Created virtual environment"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate
print_status "Activated virtual environment"

# Upgrade pip
pip install --upgrade pip > /dev/null 2>&1
print_status "Upgraded pip"

# Install Python dependencies
echo -e "\n${GREEN}Installing Python dependencies...${NC}"
pip install -r requirements.txt
print_status "Installed Python requirements"

# Clone SWE-bench if not exists
echo -e "\n${GREEN}Setting up SWE-bench...${NC}"

if [ ! -d "SWE-bench" ]; then
    git clone https://github.com/princeton-nlp/SWE-bench.git
    print_status "Cloned SWE-bench repository"
else
    print_status "SWE-bench repository already exists"
    cd SWE-bench
    git pull
    cd ..
    print_status "Updated SWE-bench repository"
fi

# Install SWE-bench
cd SWE-bench
pip install -e .
cd ..
print_status "Installed SWE-bench"

# Setup ACF MCP server
echo -e "\n${GREEN}Setting up ACF MCP server...${NC}"

cd ..
if [ ! -d "node_modules" ]; then
    npm install
    print_status "Installed ACF MCP dependencies"
else
    print_status "ACF MCP dependencies already installed"
fi

# Create necessary directories
cd swebench-integration
mkdir -p results logs metrics
print_status "Created output directories"

# Create .env file if not exists
if [ ! -f "../.env" ]; then
    cp ../.env.example ../.env
    print_warning "Created .env file from template. Please update with your API keys."
else
    print_status ".env file already exists"
fi

# Test ACF MCP server
echo -e "\n${GREEN}Testing ACF MCP server...${NC}"

# Start server in background
cd ..
npm run start:mcp > /dev/null 2>&1 &
SERVER_PID=$!
sleep 5

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    print_status "ACF MCP server started successfully (PID: $SERVER_PID)"
    
    # Stop the test server
    kill $SERVER_PID 2>/dev/null || true
    print_status "Stopped test server"
else
    print_error "Failed to start ACF MCP server"
    print_warning "Please check the server logs"
fi

cd swebench-integration

# Create convenience scripts
echo -e "\n${GREEN}Creating convenience scripts...${NC}"

# Create start script
cat > start_server.sh << 'EOF'
#!/bin/bash
# Start ACF MCP server
cd ..
npm run start:mcp
EOF
chmod +x start_server.sh
print_status "Created start_server.sh"

# Create run script
cat > run.sh << 'EOF'
#!/bin/bash
# Run SWE-bench evaluation with ACF MCP
source venv/bin/activate
python run_evaluation.py "$@"
EOF
chmod +x run.sh
print_status "Created run.sh"

# Create test script
cat > test.sh << 'EOF'
#!/bin/bash
# Test single instance
source venv/bin/activate
python test_single.py "$@"
EOF
chmod +x test.sh
print_status "Created test.sh"

# Print summary
echo -e "\n${GREEN}================================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}================================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Update ../.env with your API keys (if needed)"
echo "2. Start the ACF MCP server:"
echo "   ./start_server.sh"
echo ""
echo "3. In another terminal, run evaluations:"
echo "   ./run.sh --max-instances 5"
echo ""
echo "4. Or test a single instance:"
echo "   ./test.sh sympy__sympy-20590 --verbose"
echo ""
echo "5. View results in:"
echo "   - results/    (evaluation outputs)"
echo "   - logs/       (execution logs)"
echo "   - metrics/    (performance metrics)"

echo -e "\n${GREEN}Documentation:${NC}"
echo "- README.md for detailed usage"
echo "- config.yaml for configuration options"
echo "- ../docs/ for ACF documentation"

echo -e "\n${YELLOW}Tips:${NC}"
echo "- Use --verbose flag for detailed output"
echo "- Start with SWE-bench_Lite for faster testing"
echo "- Monitor Docker resource usage"
echo "- Check ACF task dashboard for progress"

# Deactivate virtual environment
deactivate

echo -e "\n${GREEN}Happy coding! 🚀${NC}"
