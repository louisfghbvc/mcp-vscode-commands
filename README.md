# MCP VSCode Commands

一個輕量級且高效的 Model Context Protocol (MCP) 服務器，讓 AI 助手能夠通過 WebSocket 協議完整控制 VS Code 命令。

## 🚀 核心功能

- ✅ **完整 VS Code API 訪問** - 內嵌式架構，無限制訪問
- ✅ **WebSocket 通信** - 現代化的網絡通信協議
- ✅ **自動端口分配** - 零配置，智能端口管理
- ✅ **智能連接管理** - 連接池、自動重連、性能監控
- ✅ **高性能架構** - 優化的連接管理和消息處理
- ✅ **輕量級設計** - 專注於 WebSocket，代碼簡潔高效

## 🏗️ 架構概覽

### WebSocket 架構
```
WebSocket Clients ↔ WebSocket MCP Server ↔ Extension (MCP Server) ↔ VS Code API
```

### 通信模式
- **WebSocket 模式**: 現代化的網絡通信，支持遠程連接和多客戶端
- **JSON-RPC 2.0**: 標準的 MCP 協議實現

## 🚀 快速開始

### 安裝
```bash
code --install-extension mcp-vscode-commands-0.2.0.vsix
```

### 配置
在 VS Code 設置中配置 MCP 服務器：

```json
{
  "mcpVscodeCommands.autoStart": true,
  "mcpVscodeCommands.websocketPort": 19847,
  "mcpVscodeCommands.websocketMaxConnections": 10,
  "mcpVscodeCommands.websocketConnectionTimeout": 30000,
  "mcpVscodeCommands.logLevel": "info"
}
```

### 使用
1. 安裝後自動啟動 WebSocket 服務器
2. 通過 WebSocket 連接使用 MCP 協議
3. AI 可以執行任何 VS Code 命令
4. 使用 `MCP: Diagnostics` 檢查狀態

## 🛠️ 可用工具

### `vscode.executeCommand`
執行任何 VS Code 命令
```json
{
  "command": "editor.action.formatDocument",
  "args": []
}
```

### `vscode.listCommands`
列出所有可用命令
```json
{
  "filter": "editor"
}
```

### WebSocket 管理命令
- `mcp-vscode-commands.startWebSocket` - 啟動 WebSocket 服務器
- `mcp-vscode-commands.stopWebSocket` - 停止 WebSocket 服務器
- `mcp-vscode-commands.restartWebSocket` - 重啟 WebSocket 服務器

## 🔧 配置選項

### 基本配置
- `autoStart`: 是否自動啟動 WebSocket MCP 服務器
- `logLevel`: 日誌等級 (info, warn, error, debug)

### WebSocket 配置
- `websocketPort`: WebSocket 服務器端口 (默認: 19847)
- `websocketMaxConnections`: 最大連接數 (默認: 10)
- `websocketConnectionTimeout`: 連接超時時間 (毫秒，默認: 30000)

## 📊 診斷和監控

使用 `MCP: Diagnostics` 命令查看詳細的系統狀態：

- 服務器運行狀態
- 連接統計信息
- 性能指標
- 錯誤日誌
- 配置信息

## 🔌 集成指南

### WebSocket 客戶端集成
1. 連接到 WebSocket 服務器 (ws://localhost:19847)
2. 使用 JSON-RPC 2.0 協議發送 MCP 請求
3. 完整的 VS Code API 訪問

### 客戶端配置示例
```json
{
  "name": "vscode-commands",
  "type": "websocket",
  "url": "ws://localhost:19847",
  "protocol": "mcp"
}
```

## 🚀 性能特性

- **連接池管理**: 智能的連接重用和負載均衡
- **消息緩衝**: 高效的異步消息處理
- **自動重連**: 網絡中斷時自動恢復
- **資源監控**: 實時監控 CPU 和記憶體使用
- **輕量級架構**: 專注於 WebSocket，減少不必要的開銷
- **JSON-RPC 2.0**: 標準協議，高效的消息序列化

## 🐛 故障排除

### 常見問題
1. **端口衝突**: 自動端口分配，無需手動配置
2. **連接失敗**: 檢查防火牆和網絡設置
3. **權限問題**: 確保有足夠的系統權限
4. **WebSocket 連接**: 確保客戶端使用正確的 WebSocket URL

### 日誌查看
- 使用 `MCP: Diagnostics` 查看詳細日誌
- 檢查 VS Code 輸出面板的 MCP 日誌

## 🤝 貢獻

歡迎貢獻代碼和文檔！請查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解詳細信息。

## 📄 許可證

MIT License - 詳見 [LICENSE](LICENSE) 文件

## 🔗 相關鏈接

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [JSON-RPC 2.0](https://www.jsonrpc.org/specification)