#!/bin/bash

# ACF Upstream MCP Sync Script
# This script helps synchronize tools from upstream MCP repositories

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
TEMP_DIR="$PROJECT_ROOT/.tmp/upstream-sync"
UPSTREAM_DIR="$TEMP_DIR/upstream"
TOOLS_DIR="$PROJECT_ROOT/src/tools"

# Upstream repositories
DESKTOP_COMMANDER_REPO="https://github.com/wonderwhy-er/DesktopCommanderMCP.git"
PLAYWRIGHT_REPO="https://github.com/microsoft/playwright-mcp.git"

# Function to print colored output
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_color $BLUE "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_color $RED "Node.js is required but not installed."
        exit 1
    fi
    
    # Check git
    if ! command -v git &> /dev/null; then
        print_color $RED "Git is required but not installed."
        exit 1
    fi
    
    # Check jq for JSON processing
    if ! command -v jq &> /dev/null; then
        print_color $YELLOW "jq is recommended for JSON processing. Installing via npm..."
        npm install -g jq
    fi
    
    print_color $GREEN "✓ Prerequisites check passed"
}

# Function to setup directories
setup_directories() {
    print_color $BLUE "Setting up directories..."
    
    # Clean and create temp directory
    rm -rf "$TEMP_DIR"
    mkdir -p "$UPSTREAM_DIR"
    
    print_color $GREEN "✓ Directories setup complete"
}

# Function to clone upstream repositories
clone_upstream() {
    print_color $BLUE "Cloning upstream repositories..."
    
    # Clone Desktop Commander MCP
    print_color $YELLOW "Cloning Desktop Commander MCP..."
    git clone --depth 1 "$DESKTOP_COMMANDER_REPO" "$UPSTREAM_DIR/desktop-commander" &> /dev/null
    
    # Clone Playwright MCP
    print_color $YELLOW "Cloning Playwright MCP..."
    git clone --depth 1 "$PLAYWRIGHT_REPO" "$UPSTREAM_DIR/playwright" &> /dev/null
    
    print_color $GREEN "✓ Upstream repositories cloned"
}

# Function to run comparison analysis
run_comparison() {
    print_color $BLUE "Running tool comparison analysis..."
    
    # Run the comparison script
    node "$SCRIPT_DIR/compare-upstream-tools.js"
    
    # Check if report was generated
    if [ -f "$PROJECT_ROOT/docs/mcp-integration/tool-comparison-report.md" ]; then
        print_color $GREEN "✓ Comparison report generated"
        echo ""
        print_color $YELLOW "Report location: $PROJECT_ROOT/docs/mcp-integration/tool-comparison-report.md"
    else
        print_color $RED "Failed to generate comparison report"
        exit 1
    fi
}

# Function to analyze specific tool implementation
analyze_tool() {
    local tool_name=$1
    local repo_path=$2
    
    print_color $BLUE "Analyzing tool: $tool_name"
    
    # Search for tool implementation in repository
    echo "Searching for implementation..."
    grep -r "$tool_name" "$repo_path" --include="*.js" --include="*.ts" -n || true
}

# Function to create integration branch
create_integration_branch() {
    local branch_name="feature/upstream-sync-$(date +%Y%m%d-%H%M%S)"
    
    print_color $BLUE "Creating integration branch: $branch_name"
    
    cd "$PROJECT_ROOT"
    git checkout -b "$branch_name"
    
    print_color $GREEN "✓ Integration branch created"
}

# Function to show next steps
show_next_steps() {
    echo ""
    print_color $BLUE "=== Next Steps ==="
    echo ""
    echo "1. Review the comparison report:"
    echo "   cat $PROJECT_ROOT/docs/mcp-integration/tool-comparison-report.md"
    echo ""
    echo "2. For each missing tool, analyze its implementation:"
    echo "   - Desktop Commander: $UPSTREAM_DIR/desktop-commander"
    echo "   - Playwright: $UPSTREAM_DIR/playwright"
    echo ""
    echo "3. Implement missing tools in:"
    echo "   - $TOOLS_DIR/"
    echo ""
    echo "4. Update the tool definitions in:"
    echo "   - $PROJECT_ROOT/src/mcp_server.js"
    echo ""
    echo "5. Test the new tools:"
    echo "   - npm test"
    echo ""
    echo "6. Commit and push changes:"
    echo "   - git add ."
    echo "   - git commit -m \"feat: Add tools from upstream MCP repositories\""
    echo "   - git push origin <branch-name>"
    echo ""
}

# Function to extract tool implementation
extract_tool_implementation() {
    local tool_name=$1
    local source_repo=$2
    local output_file=$3
    
    print_color $YELLOW "Extracting implementation for: $tool_name"
    
    # Create extraction script
    cat > "$TEMP_DIR/extract_tool.js" << 'EOF'
const fs = require('fs');
const path = require('path');

const toolName = process.argv[2];
const sourceDir = process.argv[3];
const outputFile = process.argv[4];

// Search for tool implementation
function findToolImplementation(dir, toolName) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.')) {
            const result = findToolImplementation(filePath, toolName);
            if (result) return result;
        } else if (file.endsWith('.js') || file.endsWith('.ts')) {
            const content = fs.readFileSync(filePath, 'utf8');
            if (content.includes(toolName)) {
                // Extract relevant function
                const functionMatch = content.match(new RegExp(`(async\\s+)?function\\s+${toolName}[\\s\\S]*?^}`, 'gm'));
                if (functionMatch) {
                    return {
                        path: filePath,
                        implementation: functionMatch[0]
                    };
                }
            }
        }
    }
    
    return null;
}

const result = findToolImplementation(sourceDir, toolName);
if (result) {
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
    console.log(`Found implementation in: ${result.path}`);
} else {
    console.log(`No implementation found for: ${toolName}`);
}
EOF

    node "$TEMP_DIR/extract_tool.js" "$tool_name" "$source_repo" "$output_file"
}

# Main execution
main() {
    print_color $BLUE "=== ACF Upstream MCP Sync Script ==="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Setup directories
    setup_directories
    
    # Clone upstream repositories
    clone_upstream
    
    # Run comparison analysis
    run_comparison
    
    # Ask if user wants to create integration branch
    echo ""
    read -p "Create integration branch for changes? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        create_integration_branch
    fi
    
    # Show next steps
    show_next_steps
    
    print_color $GREEN "✓ Sync analysis complete!"
}

# Run main function
main
