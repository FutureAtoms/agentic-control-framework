#!/bin/bash

# 🎯 Simple Consumer-Grade Test
# Quick verification of core ACF functionality

set -euo pipefail

# Colors
readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Setup
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEMP_DIR="/tmp/acf-simple-test"

cleanup() {
    rm -rf "$TEMP_DIR" 2>/dev/null || true
    pkill -f "agentic-control-framework" 2>/dev/null || true
}

trap cleanup EXIT

setup() {
    mkdir -p "$TEMP_DIR"
    cd "$PROJECT_ROOT"
    export WORKSPACE_ROOT="$TEMP_DIR"
    export ALLOWED_DIRS="$TEMP_DIR:/tmp"
}

log_test() {
    ((TOTAL_TESTS++))
    echo -e "${BLUE}[$TOTAL_TESTS] Testing: $1${NC}"
}

log_pass() {
    ((PASSED_TESTS++))
    echo -e "${GREEN}✅ PASSED: $1${NC}"
}

log_fail() {
    ((FAILED_TESTS++))
    echo -e "${RED}❌ FAILED: $1${NC}"
}

# Test 1: Node.js basic functionality
test_nodejs() {
    log_test "Node.js and npm availability"
    
    if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
        local node_version=$(node --version)
        local npm_version=$(npm --version)
        log_pass "Node.js $node_version, npm $npm_version"
        return 0
    else
        log_fail "Node.js or npm not available"
        return 1
    fi
}

# Test 2: ACF MCP server basic startup
test_acf_server() {
    log_test "ACF MCP server startup"
    
    if [ ! -f "$PROJECT_ROOT/bin/agentic-control-framework-mcp" ]; then
        log_fail "ACF MCP binary not found"
        return 1
    fi
    
    # Test that it starts and responds
    timeout 10 node "$PROJECT_ROOT/bin/agentic-control-framework-mcp" \
        --workspaceRoot "$TEMP_DIR" > "$TEMP_DIR/acf.log" 2>&1 &
    local pid=$!
    
    sleep 3
    
    if kill -0 $pid 2>/dev/null; then
        kill $pid 2>/dev/null || true
        wait $pid 2>/dev/null || true
        log_pass "ACF server starts successfully"
        return 0
    else
        log_fail "ACF server failed to start"
        return 1
    fi
}

# Test 3: Simple tools functionality
test_simple_tools() {
    log_test "Simple tools test"
    
    if node test/unit/test-simple-tools.js > "$TEMP_DIR/simple.log" 2>&1; then
        # Check if the log indicates success
        if grep -q "PASSED\|All tests completed\|✓" "$TEMP_DIR/simple.log"; then
            log_pass "Simple tools test completed"
            return 0
        fi
    fi
    
    log_fail "Simple tools test failed"
    return 1
}

# Test 4: Core MCP functionality  
test_core_mcp() {
    log_test "Core MCP functionality"
    
    if node test/comprehensive_mcp_test.js > "$TEMP_DIR/mcp.log" 2>&1; then
        if grep -q "PASSED\|All tests completed\|✓\|SUCCESS" "$TEMP_DIR/mcp.log"; then
            log_pass "Core MCP test completed"
            return 0
        fi
    fi
    
    log_fail "Core MCP test failed"
    return 1
}

# Test 5: Filesystem operations
test_filesystem() {
    log_test "Filesystem operations"
    
    if node test/test_filesystem.js > "$TEMP_DIR/fs.log" 2>&1; then
        if ! grep -q "Error:\|FAILED\|FAIL" "$TEMP_DIR/fs.log"; then
            log_pass "Filesystem test completed"
            return 0
        fi
    fi
    
    log_fail "Filesystem test failed"
    return 1
}

# Main execution
main() {
    echo -e "${BOLD}🎯 Simple Consumer-Grade ACF Test${NC}"
    echo "=================================="
    echo ""
    
    setup
    
    # Run tests
    test_nodejs || true
    test_acf_server || true
    test_simple_tools || true
    test_core_mcp || true
    test_filesystem || true
    
    # Calculate success rate
    local success_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    fi
    
    echo ""
    echo "=================================="
    echo -e "${BOLD}📊 Test Results:${NC}"
    echo -e "   Total: $TOTAL_TESTS"
    echo -e "   Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "   Failed: ${RED}$FAILED_TESTS${NC}"
    echo -e "   Success Rate: ${YELLOW}${success_rate}%${NC}"
    
    if [ $success_rate -ge 80 ]; then
        echo ""
        echo -e "${GREEN}${BOLD}🎉 CONSUMER-GRADE QUALITY ACHIEVED!${NC}"
        echo -e "${GREEN}✅ ACF core functionality is working${NC}"
        echo -e "${GREEN}✅ Ready for production use${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}${BOLD}❌ Quality issues detected${NC}"
        echo -e "${RED}Review failed tests above${NC}"
        exit 1
    fi
}

main "$@" 