# MCP VSCode Commands Extension

允許 LLM 透過 **Model Context Protocol (MCP)** 直接執行 VSCode 命令的擴展。

## ✨ 功能特色

- 🔧 **執行 VSCode 命令**: 透過 MCP 執行任意 VSCode 內建或擴展命令
- 📋 **列出可用命令**: 動態獲取所有可用命令，支援過濾搜尋
- 🔒 **安全執行**: 完整的錯誤處理和結果序列化
- 🚀 **即時通信**: 基於 stdio 的 MCP 協議實現

## 🛠️ MCP 工具

### `vscode.executeCommand`
執行指定的 VSCode 命令
- **參數**: `commandId` (必需), `args` (可選)
- **範例**: 格式化文件、開啟設定、儲存檔案等

### `vscode.listCommands`  
列出所有可用的 VSCode 命令
- **參數**: `filter` (可選) - 過濾字串
- **回傳**: 過濾後的命令列表

## 📦 安裝與使用

### 1. 安裝依賴
```bash
npm install
