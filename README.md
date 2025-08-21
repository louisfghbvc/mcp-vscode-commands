# MCP VSCode Commands

一個簡潔高效的 Model Context Protocol (MCP) 服務器，讓 AI 助手（如 Cursor）能夠完整控制 VSCode 命令。

## 核心功能

- ✅ **完整 VSCode API 訪問** - 內嵌式架構，無限制
- ✅ **自動端口分配** - 零配置，無衝突
- ✅ **智能橋接** - TCP + stdio 混合通信
- ✅ **Cursor 整合** - 自動註冊或手動配置

## 快速開始

### 安裝
```bash
code --install-extension mcp-vscode-commands-0.2.0.vsix
```

### 使用
1. 安裝後自動啟動
2. AI 可以執行任何 VS Code 命令
3. 使用 `MCP: Diagnostics` 檢查狀態

## 可用工具

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

## 架構
```
Cursor ↔ stdio-bridge.js ↔ [TCP:auto] ↔ Extension (MCP Server) ↔ VSCode API
```

## 許可證
MIT