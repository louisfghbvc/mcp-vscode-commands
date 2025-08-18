# Change Log

All notable changes to the "MCP VSCode Commands" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [0.1.3] - 2025-08-15

### 🚀 Major Architecture Upgrade
- **BREAKING**: 全面遷移到 SSE (Server-Sent Events) 架構
  - 移除 WebSocket 和 stdio transport
  - 改用基於 HTTP 的 SSE 傳輸協議
  - 更符合現代 web 應用標準

### ✨ New Features
- **動態端口分配**: 系統自動選擇可用端口，完全避免端口衝突
- **自動配置管理**: 自動建立和更新 `~/.cursor/mcp.json`
- **智能測試工具**: 新的 `test-sse-server.js` 支援端口掃描和連線測試
- **改進的狀態顯示**: `Show MCP Server Status` 顯示實際運行的 URL

### 🔧 Improvements
- **簡化架構**: 移除複雜的 bridge 和 transport 層
- **更好的錯誤處理**: 改進的連線和命令執行錯誤處理
- **現代化文檔**: 全新的 README 和範例文件
- **開發者體驗**: 新增快速入門指南

### 📚 Documentation
- 全新設計的 README.md 與架構圖
- 詳細的快速入門指南 (QUICKSTART.md)
- 更新所有範例和配置文件
- 改進的故障排除指南

### 🗑️ Removed
- WebSocket server 實現
- stdio transport bridge
- 複雜的端口偏好設定
- 過時的手動配置步驟

### 🔄 Migration
- 舊版用戶需要重新執行 "Start MCP Server" 來更新配置
- Cursor 配置格式已更新，但會自動處理

### 🐛 Hotfix
- **Critical**: Fixed dynamic import issue using eval() technique
  - TypeScript was converting `import()` to `require()` despite CommonJS output
  - Using `eval('(specifier) => import(specifier)')` to preserve true dynamic imports
  - Ensures proper ES module loading for @modelcontextprotocol/sdk

## [0.1.2] - 2025-08-14

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

## [0.1.0] - 2025-08-13

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
| 0.1.3 | 2025-08-15 | Current | Fixed dynamic import with eval solution |
| 0.1.2 | 2025-08-14 | Released | Fixed ES Module compatibility issues |
| 0.1.1 | 2025-08-14 | Released | Added WebSocket support |
| 0.1.0 | 2025-08-13 | Released | Initial release with core MCP functionality |

## Links
- [GitHub Repository](https://github.com/louisfghbvc/mcp-vscode-commands)
- [Report Issues](https://github.com/louisfghbvc/mcp-vscode-commands/issues)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## Recent Releases
- [v0.1.3](https://github.com/louisfghbvc/mcp-vscode-commands/releases/tag/v0.1.3) - 2025-08-15
- [v0.1.2](https://github.com/louisfghbvc/mcp-vscode-commands/releases/tag/v0.1.2) - 2025-08-14
- [v0.1.1](https://github.com/louisfghbvc/mcp-vscode-commands/releases/tag/v0.1.1) - 2025-08-14
- [v0.1.0](https://github.com/louisfghbvc/mcp-vscode-commands/releases/tag/v0.1.0) - 2025-08-13
