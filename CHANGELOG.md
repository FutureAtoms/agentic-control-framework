# Changelog

All notable changes to the Agentic Control Framework project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive documentation reorganization
- Standardized naming conventions across all docs
- Consolidated installation and setup guides
- New CONTRIBUTING.md with complete contribution guidelines

### Changed
- Moved all documentation to organized subdirectories
- Renamed files to use lowercase with hyphens convention
- Consolidated duplicate documentation files
- Updated internal references to new file locations

### Removed
- Redundant documentation files from root directory
- Duplicate installation and setup guides
- Obsolete PR instruction files

## [1.0.0] - 2025-01-10

### Added
- 80+ specialized tools for autonomous agent development
- MCP Protocol 2025-03-26 support
- Claude Code, Cursor, VS Code, and Claude Desktop integrations
- Comprehensive test suite with 100% tool coverage
- Cloud deployment support (Google Cloud Run, Docker, Fly.io, Railway)
- Priority-based task management system
- File watcher with automatic synchronization
- Browser automation tools (25 tools)
- Terminal control tools (5 tools)
- AppleScript integration for macOS

### Changed
- Updated to TypeScript for better type safety
- Improved MCP server performance
- Enhanced error handling across all tools
- Optimized file system operations

### Fixed
- Connection stability issues in MCP mode
- Memory leaks in long-running sessions
- Browser automation compatibility issues
- File watcher race conditions

## [0.9.0] - 2024-12-15

### Added
- Initial beta release
- Core ACF tools (25 tools)
- Basic MCP protocol support
- CLI interface
- Initial documentation

### Changed
- Refactored tool architecture
- Improved configuration system

### Fixed
- Various bug fixes and stability improvements

---

For detailed changes in each category, see:
- [Architecture Changes](docs/reference/archive/CHANGES.md)
- [Documentation Updates](docs/reference/archive/DOCUMENTATION_UPDATE_CHANGELOG.md)
- [Testing Reports](docs/testing/)