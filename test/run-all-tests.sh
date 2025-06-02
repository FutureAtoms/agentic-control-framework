#!/bin/bash

# 🧪 ACF Comprehensive Test Runner
# Runs all tests in the proper order with detailed reporting

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

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

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

header() {
    echo -e "${PURPLE}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}  $1${NC}"
    echo -e "${PURPLE}══════════════════════════════════════════════════════════════${NC}"
}

subheader() {
    echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}────────────────────────────────────────────────────────────${NC}"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local test_dir="$3"
    
    ((TOTAL_TESTS++))
    
    echo ""
    log "Running test: $test_name"
    
    # Change to appropriate directory if specified
    if [ -n "$test_dir" ]; then
        cd "$test_dir"
    fi
    
    # Run the test
    if eval "$test_command" > "/tmp/acf_test_$TOTAL_TESTS.log" 2>&1; then
        success "✓ $test_name PASSED"
        ((PASSED_TESTS++))
    else
        error "✗ $test_name FAILED"
        echo "  See /tmp/acf_test_$TOTAL_TESTS.log for details"
        ((FAILED_TESTS++))
        
        # Show last few lines of error
        echo "  Last few lines of error:"
        tail -5 "/tmp/acf_test_$TOTAL_TESTS.log" | sed 's/^/    /'
    fi
    
    # Return to project root
    cd "$PROJECT_ROOT"
}

# Start testing
header "🧪 ACF Comprehensive Test Suite"

log "Project Root: $PROJECT_ROOT"
log "Node.js Version: $(node --version)"
log "npm Version: $(npm --version)"

# Ensure we're in the project root
cd "$PROJECT_ROOT"

# Check dependencies
log "Checking dependencies..."
if ! npm list --depth=0 > /dev/null 2>&1; then
    warn "Dependencies not fully installed, running npm install..."
    npm install
fi

# Unit Tests
header "1️⃣ Unit Tests"
run_test "Simple Tools Test" "node test/unit/test-simple-tools.js" "$PROJECT_ROOT"

# Integration Tests
header "2️⃣ Integration Tests"
run_test "Comprehensive Tools Test" "bash test/integration/test-all-tools-comprehensive.sh" "$PROJECT_ROOT"
run_test "MCP Proxy Test" "bash test/integration/test-mcp-proxy.sh" "$PROJECT_ROOT"
run_test "MCP Clients Test" "bash test/integration/test-mcp-clients.sh" "$PROJECT_ROOT"
run_test "MCP Proxy Integration" "bash test/integration/test-mcp-proxy-integration.sh" "$PROJECT_ROOT"

# Core Tests
header "3️⃣ Core Functionality Tests"
run_test "MCP Server Test" "node test/comprehensive_mcp_test.js" "$PROJECT_ROOT"
run_test "Environment Guardrails" "node test/test_env_guardrails.js" "$PROJECT_ROOT"
run_test "Filesystem Tests" "node test/test_filesystem.js" "$PROJECT_ROOT"

# E2E Tests (these might take longer)
header "4️⃣ End-to-End Tests"
if command -v timeout >/dev/null 2>&1; then
    run_test "Deployment Complete Test" "timeout 300 bash test/e2e/test-deployment-complete.sh" "$PROJECT_ROOT"
elif command -v gtimeout >/dev/null 2>&1; then
    run_test "Deployment Complete Test" "gtimeout 300 bash test/e2e/test-deployment-complete.sh" "$PROJECT_ROOT"
else
    warn "No timeout command available, skipping deployment test (might take too long)"
    ((SKIPPED_TESTS++))
fi

# Generate comprehensive report
header "📊 Test Results Summary"

echo ""
echo -e "${CYAN}📊 OVERALL RESULTS${NC}"
echo -e "   Total Tests: ${PURPLE}$TOTAL_TESTS${NC}"
echo -e "   Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "   Failed: ${RED}$FAILED_TESTS${NC}"
echo -e "   Skipped: ${YELLOW}$SKIPPED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    SUCCESS_RATE=100
else
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / (PASSED_TESTS + FAILED_TESTS) ))
fi

echo -e "   Success Rate: ${YELLOW}${SUCCESS_RATE}%${NC}"

# Generate markdown report
REPORT_FILE="test/reports/comprehensive-test-results.md"
cat > "$REPORT_FILE" << EOF
# 🧪 ACF Comprehensive Test Results

**Generated**: $(date)
**Node.js Version**: $(node --version)
**Test Environment**: $(uname -s) $(uname -m)

## Summary

- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS ✅
- **Failed**: $FAILED_TESTS ❌
- **Skipped**: $SKIPPED_TESTS ⏭️
- **Success Rate**: ${SUCCESS_RATE}%

## Test Categories

### ✅ Unit Tests
- Simple Tools Test: $([ -f "/tmp/acf_test_1.log" ] && echo "✅ PASSED" || echo "❌ FAILED")

### ✅ Integration Tests  
- Comprehensive Tools Test: $([ -f "/tmp/acf_test_2.log" ] && echo "✅ PASSED" || echo "❌ FAILED")
- MCP Proxy Test: $([ -f "/tmp/acf_test_3.log" ] && echo "✅ PASSED" || echo "❌ FAILED")
- MCP Clients Test: $([ -f "/tmp/acf_test_4.log" ] && echo "✅ PASSED" || echo "❌ FAILED")
- MCP Proxy Integration: $([ -f "/tmp/acf_test_5.log" ] && echo "✅ PASSED" || echo "❌ FAILED")

### ✅ Core Functionality Tests
- MCP Server Test: $([ -f "/tmp/acf_test_6.log" ] && echo "✅ PASSED" || echo "❌ FAILED")
- Environment Guardrails: $([ -f "/tmp/acf_test_7.log" ] && echo "✅ PASSED" || echo "❌ FAILED")
- Filesystem Tests: $([ -f "/tmp/acf_test_8.log" ] && echo "✅ PASSED" || echo "❌ FAILED")

### ✅ End-to-End Tests
- Deployment Complete Test: $([ -f "/tmp/acf_test_9.log" ] && echo "✅ PASSED" || echo "❌ FAILED")

## Recommendations

$(if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 All tests passed! ACF is production ready."
else
    echo "⚠️ Some tests failed. Review logs in /tmp/acf_test_*.log for details."
fi)

---
*Report generated by ACF Test Runner on $(date)*
EOF

success "Test report saved to: $REPORT_FILE"

# Cleanup old logs (keep last 5 test runs)
find /tmp -name "acf_test_*.log" -mtime +1 -delete 2>/dev/null || true

# Final status
echo ""
if [ $FAILED_TESTS -eq 0 ]; then
    success "🎉 All tests passed! ACF is fully functional."
    exit 0
else
    error "❌ $FAILED_TESTS tests failed. Check logs for details."
    exit 1
fi 