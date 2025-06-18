#!/bin/bash

# 🚀 ACF Quick Test Runner
# Runs essential tests quickly for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

header() {
    echo -e "${PURPLE}═══ $1 ═══${NC}"
}

# Quick test function
quick_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo ""
    log "Running: $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        success "✓ $test_name PASSED"
        return 0
    else
        error "✗ $test_name FAILED"
        return 1
    fi
}

# Main execution
main() {
    header "🚀 ACF Quick Test Suite"
    
    log "Project Root: $PROJECT_ROOT"
    cd "$PROJECT_ROOT"
    
    # Test counters
    local total=0
    local passed=0
    
    # Essential tests
    if quick_test "Unit Tests" "node test/unit/test-simple-tools.js"; then
        ((passed++))
    fi
    ((total++))
    
    if quick_test "Core MCP Test" "node test/comprehensive_mcp_test.js"; then
        ((passed++))
    fi
    ((total++))
    
    if quick_test "Environment Guardrails" "node test/test_env_guardrails.js"; then
        ((passed++))
    fi
    ((total++))
    
    if quick_test "Filesystem Tests" "node test/test_filesystem.js"; then
        ((passed++))
    fi
    ((total++))
    
    if quick_test "MCP Client Tests" "bash test/integration/test-mcp-clients.sh"; then
        ((passed++))
    fi
    ((total++))
    
    # Results
    echo ""
    header "📊 Quick Test Results"
    echo ""
    echo -e "   Total Tests: ${PURPLE}$total${NC}"
    echo -e "   Passed: ${GREEN}$passed${NC}"
    echo -e "   Failed: ${RED}$((total - passed))${NC}"
    echo -e "   Success Rate: ${YELLOW}$(( passed * 100 / total ))%${NC}"
    echo ""
    
    if [ $passed -eq $total ]; then
        success "🎉 All quick tests passed! ACF core functionality is working."
        return 0
    else
        error "❌ Some tests failed. Run './test/run-all-tests.sh' for detailed analysis."
        return 1
    fi
}

main "$@" 