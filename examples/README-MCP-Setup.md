# 🚀 MCP VSCode Commands 設定指南

## ✨ 自動設定（推薦）

這個擴展會自動配置 Cursor MCP 設定，無需手動操作！

### 使用步驟：

1. **安裝擴展到 VSCode/Cursor**
   ```bash
   # 從 VSIX 安裝
   code --install-extension mcp-vscode-commands-0.1.2.vsix
   ```

2. **啟動 MCP Server**
   - 開啟命令面板 (`Ctrl+Shift+P` / `Cmd+Shift+P`)
   - 執行 `Start MCP Server`
   - 擴展會自動：
     - 啟動 SSE server (通常在 port 3000)
     - 更新 `~/.cursor/mcp.json` 配置
     - 顯示 server URL

3. **在 Cursor 中使用**
   - 重新啟動 Cursor
   - 在對話中使用 VSCode 命令：
     ```
     請幫我格式化當前文件
     請列出所有編輯器相關的命令
     請執行 workbench.action.openSettings 命令
     ```

## 🔧 手動設定（進階用戶）

如果需要自定義配置，可以手動編輯 `~/.cursor/mcp.json`：

> **注意**: 由於使用動態端口分配，實際端口可能不是 3000。請查看 VSCode 中的 "Show MCP Server Status" 命令獲取正確的 URL。

```json
{
  "servers": {
    "vscode-commands": {
      "url": "http://127.0.0.1:<動態端口>/mcp/sse",
      "transport": "sse"
    }
  }
}
```

## 🛠️ 可用工具

### 1. `vscode.executeCommand`
執行任何 VSCode 命令

**參數:**
- `commandId`: 命令 ID (必需)
- `args`: 命令參數數組 (可選)

### 2. `vscode.listCommands`
列出所有可用的 VSCode 命令

**參數:**
- `filter`: 過濾字串 (可選)

## 📝 常用命令範例

### 編輯器操作
- `editor.action.formatDocument` - 格式化文件
- `editor.action.organizeImports` - 整理 imports
- `editor.action.commentLine` - 切換註解

### 文件操作
- `workbench.action.files.save` - 保存文件
- `workbench.action.files.saveAll` - 保存所有文件

### 導航
- `workbench.action.quickOpen` - 快速開啟檔案
- `workbench.action.showCommands` - 命令面板

## 🔍 測試連接

使用測試腳本驗證 server 運行：

```bash
node examples/test-sse-server.js 3000
```

## ❓ 故障排除

### Server 未啟動
- 檢查 VSCode 開發者控制台的錯誤訊息
- 確保沒有其他程序佔用端口

### Cursor 無法連接
- 重新啟動 Cursor
- 檢查 `~/.cursor/mcp.json` 檔案內容
- 確認 server URL 正確

### 端口衝突
- 擴展會自動尋找可用端口 (3000, 3001, 3002, 8080, 8000)
- 如果都被佔用，會使用系統分配的端口

## 📚 更多資訊

- [MCP 官方文檔](https://modelcontextprotocol.io/)
- [VSCode Commands 參考](https://code.visualstudio.com/api/references/commands)
- [專案 GitHub](https://github.com/louisfghbvc/mcp-vscode-commands)