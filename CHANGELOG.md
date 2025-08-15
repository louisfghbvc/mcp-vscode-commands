# Change Log

All notable changes to the "MCP VSCode Commands" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.1.2] - 2025-08-15

### 🐛 Fixed
- **Critical**: Fixed ES Module compatibility issue preventing extension activation
  - Reverted from ESM to CommonJS module system for VSCode compatibility
  - Maintained dynamic imports for @modelcontextprotocol/sdk (ESM package)
- **Critical**: Fixed "undefined_publisher" issue by adding publisher field to package.json
- Fixed async/await usage in WebSocket server initialization

### 🔧 Changed
- Updated TypeScript configuration:
  - Module output: CommonJS (required for VSCode extensions)
  - Target: ES2022 (for modern JavaScript features)
  - Added moduleResolution: "node" for better compatibility
- Removed `.js` extensions from local imports (CommonJS style)
- Optimized `.vscodeignore` to reduce package size

### ✨ Added
- Added `publisher` field in package.json (louisfghbvc)
- Created `.vscodeignore` file to exclude unnecessary files from VSIX package
- Added this CHANGELOG.md file

## [0.1.1] - 2025-08-14

### ✨ Added
- WebSocket server support on port 3001 for remote MCP connections
- Enhanced error handling with detailed error messages
- Improved logging system with timestamp and context

### 🔧 Changed
- Improved command execution result serialization
- Better handling of VSCode-specific objects (URI, Range, Position)
- Enhanced command listing with filtering support

### 📚 Documentation
- Added WebSocket configuration examples
- Updated README with connection instructions

## [0.1.0] - 2025-08-14

### 🎉 Initial Release

#### Core Features
- **MCP Server Implementation**: Full Model Context Protocol server for VSCode
- **Command Execution**: Execute any VSCode command via MCP protocol
- **Command Discovery**: List and filter all available VSCode commands
- **Auto-start Support**: Configurable automatic server startup

#### Tools Available
- `vscode.executeCommand`: Execute VSCode commands with arguments
- `vscode.listCommands`: List all available commands with optional filtering

#### Configuration
- `mcpVscodeCommands.autoStart`: Auto-start server on extension activation (default: true)
- `mcpVscodeCommands.logLevel`: Configure logging verbosity (debug|info|warn|error)

#### Transport Support
- Stdio transport for local connections
- WebSocket transport for remote connections (port 3001)

#### Developer Features
- TypeScript implementation with strict typing
- Comprehensive error handling
- Detailed logging for debugging
- Clean architecture with separated concerns

---

## Version History Summary

| Version | Date | Status | Key Changes |
|---------|------|--------|-------------|
| 0.1.2 | 2025-01-15 | Current | Fixed critical ES Module compatibility issues |
| 0.1.1 | 2025-01-14 | Released | Added WebSocket support |
| 0.1.0 | 2025-01-13 | Released | Initial release with core MCP functionality |

## Links
- [GitHub Repository](https://github.com/louisfghbvc/mcp-vscode-commands)
- [Report Issues](https://github.com/louisfghbvc/mcp-vscode-commands/issues)
- [Model Context Protocol](https://modelcontextprotocol.io/)
