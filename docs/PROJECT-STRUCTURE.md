# 📁 ACF Project Structure

**Author**: Abhilash Chadhar (FutureAtoms)  
**Last Updated**: 2025-01-10  
**Version**: 1.0

This document provides a comprehensive overview of the Agentic Control Framework repository structure after the recent reorganization.

## 🏗️ Repository Overview

```
agentic-control-framework/
├── 📁 bin/                                    # CLI executables and entry points
│   ├── 🔧 acf                               # Main CLI entry point for task management
│   ├── 🔧 agentic-control-framework-mcp      # Primary MCP server for IDE integration
│   ├── 🔧 task-manager                       # Task management CLI
│   ├── 🔧 task-manager-mcp                   # Task manager MCP server
│   └── 🔧 task-cli.js                        # Alternative CLI interface
│
├── 📁 src/                                    # Core source code
│   ├── 🔧 core.js                           # Core task management logic
│   ├── 🔧 cli.js                            # CLI command definitions
│   ├── 🔧 mcp_server.js                     # MCP server with 83+ tools
│   ├── 🔧 auth-proxy.js                     # Authentication proxy for cloud
│   ├── 🔧 filesystem_tools.js               # Filesystem operations
│   ├── 🔧 prd_parser.js                     # AI-powered PRD parsing
│   ├── 🔧 tableRenderer.js                  # Task table rendering
│   ├── 🔧 logger.js                         # Standardized logging
│   ├── 🔧 file_watcher.js                   # File system monitoring
│   ├── 🔧 dependency_manager.js             # Dependency management
│   ├── 🔧 priority_engine.js                # Task priority system
│   ├── 🔧 priority_functions.js             # Priority calculation functions
│   ├── 🔧 priority_log_cleanup.js           # Priority logging cleanup
│   ├── 🔧 priority_templates.js             # Priority templates
│   ├── 🔧 rules_template.mdc                # Rules template
│   │
│   └── 📁 tools/                             # Tool implementations
│       ├── 🔧 browser_tools.js              # Browser automation (Playwright)
│       ├── 🔧 terminal_tools.js             # Command execution
│       ├── 🔧 search_tools.js               # Advanced code search
│       ├── 🔧 edit_tools.js                 # Text editing operations
│       ├── 🔧 applescript_tools.js          # macOS automation
│       └── 🔧 enhanced_filesystem_tools.js  # Extended filesystem ops
│
├── 📁 docs/                                   # Documentation (ORGANIZED)
│   ├── 📘 README.md                         # Documentation index
│   ├── 📘 ARCHITECTURE.md                   # System architecture
│   ├── 📘 CLAUDE_CODE_SETUP_GUIDE.md        # Claude Code integration
│   ├── 📘 COMPLETE_TUTORIAL.md              # Comprehensive tutorial
│   ├── 📘 DEPLOYMENT_GUIDE.md               # Deployment guide
│   ├── 📘 MCP_INTEGRATION_GUIDE.md          # MCP protocol integration
│   ├── 📘 TESTING_SUMMARY.md                # Testing methodology
│   ├── 📘 TOOL_REFERENCE.md                 # Complete tool reference
│   ├── 📘 enhanced-mcp-tools.md             # Enhanced tool docs
│   ├── 📘 migration-guide.md                # Migration procedures
│   ├── 📘 priority-system.md                # Priority system docs
│   ├── 📘 priority-examples.md              # Priority examples
│   ├── 📘 tutorial.md                       # Basic tutorial
│   ├── 📘 workspace-indexing-proposal.md    # Workspace indexing
│   │
│   ├── 📁 setup/                            # Setup and installation guides
│   │   ├── 📘 SETUP-INSTRUCTIONS.md         # Installation guide
│   │   ├── 📘 CURSOR-SETUP-GUIDE.md         # Cursor IDE setup
│   │   └── 📘 WORKING-EXAMPLE.md            # Live examples
│   │
│   ├── 📁 deployment/                       # Cloud deployment guides
│   │   ├── 📘 GCP-DEPLOYMENT-GUIDE.md       # Google Cloud Platform
│   │   ├── 📘 PLATFORM-SETUP-GUIDE.md      # Multi-platform setup
│   │   ├── 📘 MCP-PROXY-DEPLOYMENT.md      # MCP proxy deployment
│   │   ├── 📘 REMOTE-CLIENT-SETUP.md       # Remote client config
│   │   ├── 📘 DEPLOYMENT-STATUS.md         # Deployment status
│   │   └── 📘 DEPLOYMENT-SUCCESS-SUMMARY.md # Deployment verification
│   │
│   ├── 📁 testing/                          # Test reports and results
│   │   ├── 📘 CLOUD-MCP-COMPREHENSIVE-TEST-REPORT.md # Latest cloud testing
│   │   ├── 📘 CLOUD-DEPLOYMENT-TEST-RESULTS.md      # Cloud platform testing
│   │   ├── 📘 DOCKER-CONTAINER-TEST-RESULTS.md      # Container testing
│   │   ├── 📘 AUTHENTICATION-SECURITY-TEST-RESULTS.md # Security testing
│   │   ├── 📘 TOOL_CATEGORY_VERIFICATION_REPORT.md  # Tool verification
│   │   └── 📘 COMPREHENSIVE_FUNCTIONALITY_TEST_REPORT.md # Functionality testing
│   │
│   ├── 📁 reference/                        # Reference materials
│   │   ├── 📘 QUICK-REFERENCE.md            # Quick command reference
│   │   ├── 📘 RELEASE-GUIDE.md              # Release process
│   │   ├── 📘 CONSUMER-GRADE-RELEASE-SUMMARY.md # Consumer release
│   │   ├── 📘 MANUS_LIKE_ENHANCEMENT_PLAN.md    # Enhancement roadmap
│   │   ├── 📘 REPOSITORY-ORGANIZATION-SUMMARY.md # Repository structure
│   │   ├── 📘 CHANGES.md                    # Version history
│   │   └── 📘 DOCUMENTATION_UPDATE_CHANGELOG.md # Documentation changes
│   │
│   ├── 📁 mcp-protocol/                     # MCP protocol documentation
│   │   ├── 📘 architecture.mdx              # MCP architecture
│   │   ├── 📘 building-a-client-node.mdx    # Client development
│   │   ├── 📘 building-mcp-with-llms.mdx    # LLM integration
│   │   ├── 📘 client.mdx                    # Client documentation
│   │   ├── 📘 clients.mdx                   # Client implementations
│   │   ├── 📘 debugging.mdx                 # Debugging guide
│   │   ├── 📘 examples.mdx                  # Protocol examples
│   │   ├── 📘 inspector.mdx                 # Protocol inspector
│   │   ├── 📘 introduction.mdx              # Protocol introduction
│   │   ├── 📘 prompts.mdx                   # Prompt handling
│   │   ├── 📘 resources.mdx                 # Resource management
│   │   ├── 📘 roots.mdx                     # Root concepts
│   │   ├── 📘 sampling.mdx                  # Sampling methods
│   │   ├── 📘 server.mdx                    # Server documentation
│   │   ├── 📘 tools.mdx                     # Tool documentation
│   │   ├── 📘 transports.mdx                # Transport layers
│   │   └── 📘 user.mdx                      # User guide
│   │
│   ├── 📁 mcp-integration/                  # MCP integration guides
│   ├── 📁 tutorials/                        # Tutorial materials
│   ├── 📁 architecture/                     # Architecture documentation
│   └── 📁 client-guides/                    # Client-specific guides
│
├── 📁 test/                                   # Testing infrastructure (ORGANIZED)
│   ├── 📘 README.md                         # Testing framework overview
│   ├── 🔧 comprehensive-mcp-test.js          # Consolidated test suite
│   ├── 🔧 mcp-response-test.js              # MCP response testing
│   ├── 🔧 mcp-server-response-test.js       # Server response testing
│   ├── 🔧 priority-logging-test.js          # Priority logging tests
│   ├── 🔧 simple-response-test.js           # Simple response tests
│   ├── 🔧 task-table-format-test.js         # Task table format tests
│   ├── 🔧 run-all-tests.sh                  # Test runner script
│   │
│   ├── 📁 cloud/                            # Cloud testing scripts (MOVED FROM ROOT)
│   │   ├── 🔧 test-mcp-proxy-manual.js      # Manual MCP proxy testing
│   │   ├── 🔧 test-endpoints.js             # Endpoint testing
│   │   ├── 🔧 test-mcp-workflow.js          # MCP workflow testing
│   │   ├── 🔧 test-remote-client-configs.js # Remote client testing
│   │   ├── 🔧 test-all-client-configs.js    # All client config testing
│   │   ├── 🔧 test-auth-security.js         # Authentication testing
│   │   └── 🔧 test-docker-configurations.sh # Docker configuration testing
│   │
│   ├── 📁 unit/                             # Unit tests
│   ├── 📁 integration/                      # Integration tests
│   ├── 📁 e2e/                              # End-to-end tests
│   ├── 📁 performance/                      # Performance tests
│   ├── 📁 fixtures/                         # Test data and fixtures
│   ├── 📁 reports/                          # Test reports
│   ├── 📁 claude-code/                      # Claude Code specific tests
│   ├── 📁 cli/                              # CLI testing
│   └── 📁 mcp/                              # MCP protocol tests
│
├── 📁 config/                                 # Configuration files (ORGANIZED)
│   ├── 📁 client-configurations/            # MCP client configs (MOVED FROM ROOT)
│   │   ├── 📘 README.md                     # Client configuration guide
│   │   ├── 📄 claude-code-remote.json       # Claude Code remote config
│   │   ├── 📄 claude-desktop-config.json    # Claude Desktop config
│   │   ├── 📄 claude-desktop-remote.json    # Claude Desktop remote
│   │   ├── 📄 cursor-remote.json            # Cursor remote config
│   │   ├── 📄 cursor-settings.json          # Cursor settings
│   │   ├── 📄 vscode-settings.json          # VS Code settings
│   │   └── 📄 windsurf-config.json          # Windsurf configuration
│   │
│   ├── 📁 examples/                         # Example configurations (MOVED FROM ROOT)
│   │   ├── 📄 config.json                   # Main configuration
│   │   ├── 📄 env.example                   # Environment variables
│   │   ├── 📄 mcp-connection.json           # MCP connection config
│   │   ├── 📄 mcp-proxy-config.yaml         # MCP proxy configuration
│   │   ├── 📄 railway.json                  # Railway deployment
│   │   ├── 📄 smithery.yaml                 # Smithery configuration
│   │   └── 📄 settings.json                 # User settings
│   │
│   └── 📁 templates/                        # Configuration templates
│
├── 📁 scripts/                                # Utility scripts (ORGANIZED)
│   ├── 📁 setup/                            # Setup scripts (MOVED FROM ROOT)
│   │   ├── 🔧 setup.sh                      # Main setup script
│   │   └── 🔧 setup-claude-code.sh          # Claude Code setup
│   │
│   ├── 📁 deployment/                       # Deployment scripts (MOVED FROM ROOT)
│   │   └── 🔧 quick-deploy.sh               # One-command deployment
│   │
│   ├── 📁 maintenance/                      # Maintenance scripts (MOVED FROM ROOT)
│   │   ├── 🔧 compare-upstream-tools.js     # Tool comparison
│   │   └── 🔧 sync-upstream.sh              # Upstream synchronization
│   │
│   └── 📁 testing/                          # Testing scripts
│
├── 📁 deployment/                             # Deployment configurations
│   ├── 📘 README.md                         # Deployment overview
│   │
│   ├── 📁 docker/                           # Docker files (MOVED FROM ROOT)
│   │   ├── 🔧 Dockerfile                    # Main Docker image
│   │   ├── 🔧 Dockerfile.proxy              # Proxy Docker image
│   │   └── 🔧 docker-compose.yml            # Multi-container setup
│   │
│   ├── 📁 cloud-run/                        # Google Cloud Run
│   ├── 📁 railway/                          # Railway deployment
│   └── 📁 fly/                              # Fly.io deployment
│
├── 📁 tasks/                                  # Task management files
│   ├── 📄 tasks-table.md                    # Human-readable task table
│   └── 📄 Individual task files (auto-generated)
│
├── 📁 templates/                              # Project templates
│   └── 📄 initial_tasks.json                # Initial task templates
│
├── 📁 public/                                 # Static assets
│   └── 📄 index.html                        # Web interface
│
├── 📁 data/                                   # Data directory
│
└── 📄 Root Files
    ├── 📄 README.md                          # Main project documentation
    ├── 📄 package.json                       # Node.js dependencies
    ├── 📄 package-lock.json                  # Dependency lock file
    ├── 📄 DOCUMENTATION-INDEX.md             # Documentation index
    ├── 📄 PR_DESCRIPTION.md                  # Pull request description
    ├── 📄 REPOSITORY-CLEANUP-COMPLETED.md    # Cleanup completion summary
    ├── 📄 agentic-control-framework.png      # Project logo
    └── 📄 demo.gif                           # Demo animation
```

## 🔧 Key Components Explained

### Core Executables (`bin/`)
- **`acf`**: Main CLI entry point for task management
- **`agentic-control-framework-mcp`**: Primary MCP server for IDE integration
- **`task-manager`**: Task management CLI interface
- **`task-cli.js`**: Alternative CLI with enhanced features

### Source Code (`src/`)
- **`core.js`**: Core task management logic and data structures
- **`mcp_server.js`**: MCP server with 83+ tools (main server file)
- **`auth-proxy.js`**: Authentication proxy for cloud deployment
- **`filesystem_tools.js`**: Filesystem operations for MCP integration

### Tool Categories (`src/tools/`)
- **Browser Tools**: Playwright-based browser automation
- **Terminal Tools**: Command execution and process management
- **Search Tools**: Advanced code search with ripgrep
- **Edit Tools**: Surgical text editing and replacement
- **AppleScript Tools**: macOS automation and system integration
- **Filesystem Tools**: Enhanced file and directory operations

### Documentation System (`docs/`)
- **Organized by category**: Setup, deployment, testing, reference
- **Complete coverage**: All aspects from installation to production
- **Cross-referenced**: Internal links maintain navigation
- **Version controlled**: All documentation reflects current state

### Testing Infrastructure (`test/`)
- **Comprehensive test suites**: 100% pass rate across all configurations
- **Cloud testing**: Dedicated cloud testing scripts in `test/cloud/`
- **Multiple test types**: Unit, integration, e2e, performance
- **IDE integration testing**: Cursor, Claude Desktop, Claude Code, VS Code

### Configuration Management (`config/`)
- **Client configurations**: MCP client setup examples
- **Example configurations**: Template files for all services
- **Environment templates**: Secure configuration examples

### Deployment Support (`deployment/`)
- **Docker support**: Multi-container deployment configurations
- **Cloud platforms**: GCP, Railway, Fly.io deployment configs
- **Automated deployment**: One-command deployment scripts

## 📊 Organization Benefits

### ✅ Clean Separation of Concerns
- Source code in `src/`
- Documentation in `docs/`
- Tests in `test/`
- Configuration in `config/`
- Scripts in `scripts/`

### ✅ Improved Navigation
- Logical directory structure
- Category-based organization
- Clear file naming conventions
- Comprehensive documentation index

### ✅ Better Maintainability
- Related files grouped together
- Standard repository practices
- Easy to find and update files
- Professional appearance

### ✅ Preserved Functionality
- All scripts updated with correct paths
- All documentation links maintained
- No functionality lost in reorganization
- All tools and features working

---

**Structure Version**: 1.0 (Post-Cleanup)  
**Last Updated**: 2025-01-10  
**Status**: ✅ Organized and Production-Ready
