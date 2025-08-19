# Change Log

All notable changes to the "MCP VSCode Commands" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

## [2.0.0] - 2025-08-19

### 🎉 MAJOR RELEASE: VS Code 原生 MCP 架構

**BREAKING CHANGES**: 完全重寫為 VS Code 原生 MCP 擴展

#### 🚀 革命性架構升級
- **完全遷移到 VS Code 原生 MCP**: 使用 VS Code 內建的 MCP 支援
- **移除 HTTP/SSE 服務器**: 改用 stdio transport，更安全、更高效
- **零配置體驗**: 安裝即用，無需手動配置
- **原生管理**: 在 VS Code Extensions 視圖中管理 MCP 服務器

#### ✨ 新功能
- **VS Code MCP Server Definition Provider**: 實作 `vscode.lm.registerMcpServerDefinitionProvider`
- **Stdio-based MCP Server**: 全新的基於 stdio transport 的 MCP 服務器
- **自動遷移工具**: 智能檢測並清理舊配置
- **原生命令**: `MCP: Clean Legacy Config`, `MCP: Show Migration Report`
- **遷移通知**: 自動偵測舊配置並提供遷移選項

#### 🔧 重大改進
- **70% 代碼減少**: 從複雜的 HTTP 架構簡化為原生整合
- **零配置安裝**: 移除所有手動配置需求
- **更好的安全性**: 無需外部端口或 HTTP 服務器
- **原生整合**: 完全整合到 VS Code 生態系統
- **更高效能**: stdio transport 比 HTTP/SSE 更快

#### 📊 VS Code Extensions 視圖整合
- **原生管理**: 啟動/停止/重啟 MCP 服務器
- **狀態監控**: 查看服務器日誌和配置
- **權限控制**: 配置模型存取權限
- **資源瀏覽**: 瀏覽可用的工具和資源

#### 🛡️ 遷移支援
- **自動檢測**: 啟動時檢測舊的 mcp.json 配置
- **安全清理**: 自動備份並選擇性移除舊配置
- **用戶選擇**: 提供自動清理、手動處理或禁用通知選項
- **狀態報告**: 詳細的遷移狀態和建議

#### 🔄 配置變更
- **新增配置**:
  - `mcpVscodeCommands.showMigrationNotifications`: 控制遷移通知 (預設: true)
- **移除配置**:
  - `mcpVscodeCommands.autoStart`: 不再需要 (原生管理)
- **保留配置**:
  - `mcpVscodeCommands.logLevel`: 日誌級別
  - `mcpVscodeCommands.showWelcomeMessage`: 歡迎訊息

#### 🗑️ 移除內容
- **HTTP/SSE 服務器**: 完全移除 `mcp-sse-server.ts`
- **端口管理**: 移除動態端口分配邏輯
- **手動配置**: 移除 mcp.json 文件管理
- **複雜啟動**: 移除 start/stop/status 命令

#### 🆕 新檔案結構
```
src/
├── extension.ts          # 簡化的 extension (70% 代碼減少)
├── mcp-provider.ts       # VS Code MCP Server Definition Provider
├── mcp-stdio-server.ts   # 新的 stdio-based MCP server
├── migration-utils.ts    # 遷移支援工具
├── types.ts              # 保持不變
└── tools/                # 工具實作 (完全相容)
```

#### 🚀 升級優勢
- **零配置**: 從複雜配置到安裝即用
- **原生整合**: 從第三方架構到 VS Code 內建支援
- **更簡潔**: 從 203 行到 128 行主要程式碼
- **更安全**: 從外部服務器到內部 stdio 通訊
- **更可靠**: 從自定義協議到 VS Code 標準

#### 🔄 升級指南
1. **安裝新版本**: 從 Marketplace 安裝 v2.0.0
2. **自動遷移**: 跟隨遷移通知或執行 `MCP: Clean Legacy Config`
3. **驗證**: 執行 `MCP: Show Migration Report` 確認遷移完成
4. **享受**: 零配置的原生 MCP 體驗！

#### 💡 致謝
感謝 VS Code 團隊提供原生 MCP 支援，讓這次重大升級成為可能！

---

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
