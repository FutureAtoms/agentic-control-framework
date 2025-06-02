# 🧪 ACF Testing Framework

This directory contains the comprehensive testing framework for the Agentic Control Framework (ACF). All tests are organized by type and can be run individually or as part of the complete test suite.

## 📂 Directory Structure

```
test/
├── unit/                    # Unit tests for individual components
│   └── test-simple-tools.js # Comprehensive tool testing
├── integration/             # Integration tests for system components
│   ├── test-all-tools-comprehensive.sh
│   ├── test-mcp-proxy.sh
│   ├── test-mcp-clients.sh
│   └── test-mcp-proxy-integration.sh
├── e2e/                     # End-to-end tests
│   └── test-deployment-complete.sh
├── reports/                 # Test reports and results
│   ├── SIMPLE-TEST-REPORT.md
│   ├── comprehensive-test-results.md
│   └── ACF-TESTING-SUMMARY.md
├── scripts/                 # Legacy test scripts
├── run-all-tests.sh        # Main test runner
├── quick-test.sh           # Quick test for development
└── README.md               # This file
```

## 🚀 Quick Start

### Run All Tests
```bash
# Comprehensive test suite (recommended)
./test/run-all-tests.sh

# Quick test for development
./test/quick-test.sh
```

### Run Specific Test Categories

#### Unit Tests
```bash
node test/unit/test-simple-tools.js
```

#### Integration Tests
```bash
bash test/integration/test-all-tools-comprehensive.sh
bash test/integration/test-mcp-proxy.sh
bash test/integration/test-mcp-clients.sh
bash test/integration/test-mcp-proxy-integration.sh
```

#### Core Functionality Tests
```bash
node test/comprehensive_mcp_test.js
node test/test_env_guardrails.js
node test/test_filesystem.js
```

#### End-to-End Tests
```bash
bash test/e2e/test-deployment-complete.sh
```

## 📊 Test Categories

### 🔧 Unit Tests
- **Simple Tools Test**: Tests all 64+ ACF tools across CLI, Local MCP, and Cloud MCP modes
- **Coverage**: CLI operations, MCP server communication, browser automation, filesystem operations
- **Runtime**: ~2-3 minutes

### 🔗 Integration Tests
- **Comprehensive Tools Test**: Full integration testing of all tool categories
- **MCP Proxy Tests**: Tests mcp-proxy integration and HTTP/SSE endpoints
- **MCP Client Tests**: Tests various MCP client configurations
- **Runtime**: ~5-10 minutes

### 🏗️ Core Functionality Tests
- **MCP Server Test**: Tests core MCP protocol implementation
- **Environment Guardrails**: Tests security and permission systems
- **Filesystem Tests**: Tests file operations and path validation
- **Runtime**: ~1-2 minutes

### 🚀 End-to-End Tests
- **Deployment Complete Test**: Tests full deployment pipeline
- **Docker Build Tests**: Tests containerization
- **Cloud Deployment Tests**: Tests cloud deployment readiness
- **Runtime**: ~10-15 minutes

## 🛡️ CI/CD Gatekeeper

The repository includes a GitHub Actions workflow (`.github/workflows/test-gatekeeper.yml`) that:

- **Triggers**: On push to `main`/`develop` branches and pull requests
- **Matrix Testing**: Tests across Node.js 18.x, 20.x, and 22.x
- **Security Scanning**: Runs npm audit and CodeQL analysis
- **Deployment Readiness**: Validates Docker builds and deployment scripts
- **Artifact Collection**: Saves test reports and logs

### Workflow Jobs

1. **🛡️ Test Gatekeeper**: Runs all test categories
2. **🔒 Security Scan**: Performs security analysis
3. **🚀 Deployment Readiness**: Validates deployment readiness
4. **📢 Notify Status**: Provides comprehensive status reporting

## 📋 Test Reports

All test runs generate detailed reports in `test/reports/`:

- **SIMPLE-TEST-REPORT.md**: Unit test results with tool-by-tool breakdown
- **comprehensive-test-results.md**: Full test suite results
- **ACF-TESTING-SUMMARY.md**: Historical testing summary and fixes

## 🔧 Development Workflow

### Before Committing
```bash
# Quick validation
./test/quick-test.sh

# Full validation (if quick tests pass)
./test/run-all-tests.sh
```

### Debugging Failed Tests
```bash
# Check test logs
ls -la /tmp/acf_test_*.log

# View specific test log
cat /tmp/acf_test_1.log

# Run individual test with verbose output
node test/unit/test-simple-tools.js
```

### Adding New Tests

1. **Unit Tests**: Add to `test/unit/` for individual component testing
2. **Integration Tests**: Add to `test/integration/` for system integration
3. **E2E Tests**: Add to `test/e2e/` for full workflow testing

Update `test/run-all-tests.sh` to include new tests in the appropriate category.

## 🎯 Test Coverage

Current test coverage includes:

### ✅ CLI Mode (100% Coverage)
- Task management operations
- Command-line interface validation
- File operations via CLI

### ✅ Local MCP Mode (100% Coverage)
- Direct MCP server communication
- All 64+ tools via MCP protocol
- Filesystem and terminal operations

### ✅ Cloud MCP Mode (Ready)
- HTTP/SSE proxy functionality
- mcp-proxy integration
- Remote access capabilities

### ✅ Specialized Tools (100% Coverage)
- Browser automation with Playwright
- AppleScript integration (macOS)
- Advanced filesystem operations
- Search and code editing tools

## 🔍 Tool Categories Tested

### Core ACF Tools (15 tools)
- Project initialization and management
- Task creation, updating, and tracking
- Subtask management
- Status tracking and workflow

### Filesystem Tools (13 tools)
- File reading, writing, copying, moving
- Directory operations and tree viewing
- Advanced file search and pattern matching
- Metadata and permission handling

### Terminal Tools (8 tools)
- Command execution with timeout
- Process management and monitoring
- Session tracking and cleanup
- Output streaming and logging

### Browser Automation Tools (22 tools)
- Page navigation and interaction
- Element clicking, typing, hovering
- Screenshot and PDF generation
- Tab management and network monitoring

### Search & Edit Tools (2 tools)
- Advanced code search with ripgrep
- Surgical text editing and replacement

### AppleScript Tools (1 tool)
- macOS application automation
- System integration capabilities

### Configuration Tools (2 tools)
- Server configuration management
- Dynamic setting updates

## 🚨 Troubleshooting

### Common Issues

#### mcp-proxy Installation
```bash
npm install -g mcp-proxy
```

#### Missing System Dependencies
```bash
# macOS
brew install coreutils ripgrep

# Ubuntu/Debian
sudo apt-get install ripgrep curl
```

#### Playwright Setup
```bash
npx playwright install chromium
```

#### Port Conflicts
If tests fail due to port conflicts, check for running processes:
```bash
lsof -i :8080
pkill -f mcp-proxy
```

### Environment Variables

Tests respect these environment variables:
- `WORKSPACE_ROOT`: Override test workspace location
- `ALLOWED_DIRS`: Override allowed directories for filesystem operations
- `READONLY_MODE`: Set to 'true' for read-only filesystem testing
- `BROWSER_HEADLESS`: Set to 'true' for headless browser testing

## 📈 Performance Benchmarks

| Test Category | Runtime | Tools Tested | Success Rate |
|---------------|---------|--------------|--------------|
| Unit Tests | ~2-3 min | 16 tests | 100% |
| Integration Tests | ~5-10 min | 25+ tests | 95%+ |
| Core Tests | ~1-2 min | 8 tests | 100% |
| E2E Tests | ~10-15 min | 5+ tests | 90%+ |
| **Total** | **~20-30 min** | **64+ tools** | **98%+** |

## 🎉 Success Criteria

Tests are considered successful when:
- ✅ All unit tests pass (100% required)
- ✅ Core functionality tests pass (100% required)
- ✅ Integration tests pass (95%+ required)
- ✅ Security scans pass (no critical vulnerabilities)
- ✅ Docker builds complete successfully
- ✅ No linter errors or warnings

---

*For more information about ACF, see the main [README.md](../README.md)* 