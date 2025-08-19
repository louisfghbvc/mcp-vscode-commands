# 🚀 MCP VSCode Commands 設定指南 (v2.0)

## 🎉 VS Code 原生 MCP 架構

歡迎使用全新的 v2.0！現在使用 **VS Code 內建的 MCP 支援**，提供零配置、原生整合的體驗。

## ✨ 零配置設定（預設）

### 安裝即用的體驗

1. **安裝擴展**
   ```bash
   # 從 VS Code Marketplace
   # Extensions → 搜尋 "MCP VSCode Commands" → 安裝
   ```

2. **自動就緒**
   - 🎯 MCP Server Definition Provider 自動註冊
   - 📊 MCP 服務器出現在 Extensions 視圖
   - 🚀 立即可供 AI 使用

3. **在 Cursor 中使用**
   ```
   請幫我格式化當前文件
   請列出所有編輯器相關的命令
   請執行 workbench.action.openSettings 命令
   ```

## 📊 VS Code Extensions 視圖管理

### 在 Extensions 視圖中管理 MCP 服務器：

#### 1. 開啟 Extensions 視圖
- 快捷鍵：`Ctrl/Cmd + Shift + X`
- 或選單：View → Extensions

#### 2. 找到 MCP 服務器
- 搜尋 "VSCode Commands" 或瀏覽 MCP 區段
- 應該看到 "VSCode Commands MCP Server"

#### 3. 管理選項
右鍵點擊 MCP 服務器：
- ▶️ **Start/Stop/Restart**: 控制服務器狀態
- 🔌 **Disconnect Account**: 斷開帳戶連接
- 📊 **Show Output**: 查看服務器日誌
- ⚙️ **Show Configuration**: 查看服務器配置
- 🔒 **Configure Model Access**: 配置模型存取權限
- 📖 **Show Sampling Requests**: 查看採樣請求
- 🔍 **Browse Resources**: 瀏覽服務器資源
- 🗑️ **Uninstall**: 卸載服務器

## 🛠️ 可用工具

### 1. `vscode.executeCommand`
執行任何 VSCode 命令

**參數:**
- `commandId`: 命令 ID (必需)
- `args`: 命令參數數組 (可選)

**範例:**
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "editor.action.formatDocument"
  }
}
```

### 2. `vscode.listCommands`
列出所有可用的 VSCode 命令

**參數:**
- `filter`: 過濾字串 (可選)

**範例:**
```json
{
  "name": "vscode.listCommands",
  "arguments": {
    "filter": "editor"
  }
}
```

## ⚙️ 配置選項

在 VS Code 設定中 (`Ctrl/Cmd + ,`)：

### 擴展設定
- `mcpVscodeCommands.logLevel`: 日誌記錄級別 (debug/info/warn/error)
- `mcpVscodeCommands.showWelcomeMessage`: 顯示歡迎訊息
- `mcpVscodeCommands.showMigrationNotifications`: 顯示遷移通知

### MCP 系統設定
透過 Extensions 視圖配置：
- **Model Access**: 控制哪些模型可以存取此服務器
- **Sampling**: 配置語言模型採樣權限

## 🔧 MCP 管理命令

使用命令面板 (`Ctrl/Cmd + Shift + P`)：

### `MCP: Clean Legacy Config`
清理舊的 v1.x SSE 配置

- 🔍 **檢測舊配置**: 掃描 ~/.cursor/mcp.json
- 🛡️ **安全備份**: 創建帶時間戳的備份文件
- 🧹 **選擇性清理**: 只移除 vscode-commands 相關設定
- ✅ **保護其他服務器**: 不影響其他 MCP 服務器配置

### `MCP: Show Migration Report`
顯示詳細的遷移狀態報告

- 📊 **配置狀態**: 檢查是否存在舊配置
- 📁 **文件路徑**: 顯示配置文件位置
- 💡 **清理建議**: 提供下一步建議

## 📝 常用命令範例

### 編輯器操作
- `editor.action.formatDocument` - 格式化文件
- `editor.action.organizeImports` - 整理 imports
- `editor.action.commentLine` - 切換註解
- `editor.action.duplicateSelection` - 複製選取

### 文件操作
- `workbench.action.files.save` - 保存文件
- `workbench.action.files.saveAll` - 保存所有文件
- `workbench.action.files.newUntitledFile` - 新建文件

### 導航
- `workbench.action.quickOpen` - 快速開啟檔案
- `workbench.action.showCommands` - 命令面板
- `workbench.action.gotoSymbol` - 跳到符號

### 終端
- `workbench.action.terminal.new` - 開啟新終端
- `workbench.action.terminal.toggleTerminal` - 切換終端

## 🔄 從 v1.x 遷移

### 自動遷移流程

1. **檢測階段**: 擴展啟動時自動檢測舊配置
2. **通知階段**: 顯示友好的遷移通知
3. **選擇階段**: 提供三個選項：
   - ✅ **清理配置**: 自動備份並清理
   - 🔧 **手動處理**: 用戶自行處理
   - 🔕 **不再提醒**: 禁用遷移通知

### 手動遷移步驟

#### 1. 檢查遷移狀態
```
命令面板 → MCP: Show Migration Report
```

#### 2. 清理舊配置
```
命令面板 → MCP: Clean Legacy Config
```

#### 3. 驗證結果
- 檢查 Extensions 視圖中的 MCP 服務器
- 確認 AI 可以正常使用工具

### 配置文件變更

#### v1.x 配置 (已棄用)
```json
// ~/.cursor/mcp.json
{
  "mcpServers": {
    "vscode-commands": {
      "url": "http://127.0.0.1:3000/mcp/sse",
      "transport": "sse"
    }
  }
}
```

#### v2.0 配置 (自動管理)
```
🎯 零配置！VS Code 自動管理所有 MCP 設定
✅ 無需手動編輯任何配置文件
📊 在 Extensions 視圖中可視化管理
```

## ❓ 故障排除

### Extension 相關問題

#### Extension 無法載入
```bash
# 解決方案
1. 檢查 VS Code 版本 (需要 1.85.0+)
2. 重新安裝擴展
3. 檢查開發者控制台錯誤
```

#### MCP Provider 註冊失敗
```bash
# 解決方案
1. 重新啟動 VS Code
2. 檢查擴展是否正確啟用
3. 查看 Output 面板的錯誤訊息
```

### MCP 服務器問題

#### 服務器未出現在 Extensions 視圖
```bash
# 解決方案
1. 重新啟動 VS Code/Cursor
2. 檢查 MCP 區段或搜尋 "VSCode Commands"
3. 執行：MCP: Show Migration Report
```

#### 服務器無法啟動
```bash
# 解決方案
1. 查看 Extensions 視圖 → Show Output
2. 檢查 mcp-stdio-server.js 是否存在
3. 重新編譯擴展：npm run compile
```

### AI 整合問題

#### AI 無法使用工具
```bash
# 解決方案
1. 在 Extensions 視圖中啟動 MCP 服務器
2. 檢查 Configure Model Access 設定
3. 查看 Show Sampling Requests 日誌
```

#### 命令執行失敗
```bash
# 解決方案
1. 檢查命令 ID 是否正確
2. 確認命令是否需要特定上下文
3. 查看 MCP 服務器 Output 日誌
```

### 遷移問題

#### 遷移通知一直出現
```bash
# 解決方案
1. 執行：MCP: Clean Legacy Config
2. 手動檢查 ~/.cursor/mcp.json
3. 選擇 "不再提醒" 選項
```

#### 清理失敗
```bash
# 解決方案
1. 手動備份 ~/.cursor/mcp.json
2. 手動移除 vscode-commands 配置項
3. 執行：MCP: Show Migration Report 驗證
```

## 💡 最佳實踐

### 日常使用
- ✅ 透過 Extensions 視圖管理 MCP 服務器
- 📊 定期檢查 Show Output 了解服務器狀態
- 🔒 適當配置 Model Access 權限

### 開發調試
- 🧪 使用 debug 日誌級別進行詳細調試
- 📈 查看 Show Sampling Requests 了解 AI 使用情況
- 🔄 遇到問題時重啟 MCP 服務器

### 版本管理
- 📦 定期更新擴展獲取最新功能
- 🧹 清理舊配置保持環境整潔
- 📚 關注 CHANGELOG 了解新功能

## 🔗 技術架構

### v2.0 架構圖
```
Cursor/Claude → VS Code MCP System → Stdio Transport → MCP Server → VSCode Commands API
```

### 核心組件
- **MCP Provider**: `vscode.lm.registerMcpServerDefinitionProvider`
- **Stdio Server**: 基於 stdio transport 的 MCP 服務器
- **Migration Utils**: 自動遷移和配置清理工具

## 📚 更多資訊

- 🌐 [VS Code MCP 官方指南](https://code.visualstudio.com/api/extension-guides/ai/mcp)
- 📖 [MCP 協議文檔](https://modelcontextprotocol.io/)
- 📚 [VSCode Commands 參考](https://code.visualstudio.com/api/references/commands)
- 🐙 [專案 GitHub](https://github.com/louisfghbvc/mcp-vscode-commands)

---

**零配置 × 原生整合 × 完美體驗！** 🚀✨