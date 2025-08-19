# 📚 MCP VSCode Commands 範例與指南 (v2.0)

## 🎉 全新 VS Code 原生 MCP 架構

歡迎使用 v2.0！現在是**零配置**、**原生整合**的 VS Code MCP 擴展。

## 🚀 快速開始

### 📋 [快速入門指南](./QUICKSTART.md)
**30 秒設定完成！** 從安裝到使用的超簡化流程。

### ⚙️ [設定指南](./README-MCP-Setup.md)
了解新的原生 MCP 架構和管理方式。

### 🛠️ [基本使用範例](./basic-usage.md)
所有可用的 MCP 工具使用方法和常用 VSCode 命令。

## 🆕 v2.0 新功能

### ✨ 零配置體驗
- 🚀 **安裝即用**: 無需手動配置
- 🎯 **原生整合**: VS Code 內建 MCP 支援
- 📊 **原生管理**: Extensions 視圖管理

### 🛡️ 自動遷移
- 🔄 **智能檢測**: 自動發現舊配置
- 🧹 **安全清理**: 備份後清理舊設定
- 📋 **遷移報告**: 詳細的遷移狀態

## 📖 使用場景

### 🤖 在 Cursor 中的自然語言指令

```
請幫我格式化當前的 TypeScript 文件
```

```
請列出所有跟文件操作相關的命令
```

```
請開啟新的終端並切換到專案根目錄
```

```
請幫我整理 imports 並保存文件
```

### 🔧 直接的 MCP 工具調用

#### 格式化代碼
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "editor.action.formatDocument"
  }
}
```

#### 搜尋檔案
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "workbench.action.quickOpen"
  }
}
```

#### 列出命令
```json
{
  "name": "vscode.listCommands",
  "arguments": {
    "filter": "terminal"
  }
}
```

## 🎯 常見使用情境

### 📝 程式碼編輯
- 格式化代碼
- 整理 imports
- 註解/取消註解
- 重構重命名

### 💾 檔案管理
- 保存檔案
- 建立新檔案
- 開啟檔案
- 關閉編輯器

### 🔍 導航搜尋
- 快速開啟檔案
- 跳到定義
- 搜尋符號
- 全域搜尋

### 🖥️ 開發環境
- 開啟終端
- 切換面板
- 修改設定
- 安裝擴展

## 📊 VS Code Extensions 視圖管理

### 在 Extensions 視圖中管理 MCP 服務器：

1. **開啟 Extensions 視圖** (`Ctrl/Cmd + Shift + X`)
2. **找到 MCP 區段** 或搜尋 "VSCode Commands"
3. **右鍵管理選項**:
   - ▶️ **Start**: 啟動 MCP 服務器
   - ⏸️ **Stop**: 停止 MCP 服務器
   - 🔄 **Restart**: 重啟 MCP 服務器
   - 📊 **Show Output**: 查看服務器日誌
   - ⚙️ **Show Configuration**: 查看配置
   - 🔒 **Configure Model Access**: 配置權限

## 🔧 MCP 管理命令

使用命令面板 (`Ctrl/Cmd + Shift + P`)：

### 🧹 `MCP: Clean Legacy Config`
清理舊的 v1.x SSE 配置文件
- 自動備份現有配置
- 只移除 vscode-commands 相關設定
- 保護其他 MCP 服務器配置

### 📋 `MCP: Show Migration Report`
顯示詳細的遷移狀態報告
- 檢查舊配置存在性
- 提供清理建議
- 顯示配置文件路徑

## ❓ 故障排除

### 🔧 v2.0 常見問題

#### MCP 服務器未出現在 Extensions 視圖
```
1. 重新啟動 VS Code/Cursor
2. 檢查是否為 VS Code 1.85.0+ 版本
3. 執行 "MCP: Show Migration Report" 檢查狀態
```

#### AI 無法使用工具
```
1. 在 Extensions 視圖中啟動 MCP 服務器
2. 檢查模型存取權限配置
3. 查看 MCP 服務器日誌
```

#### 遷移問題
```
1. 執行 "MCP: Clean Legacy Config"
2. 檢查 ~/.cursor/mcp.json 是否有殘留配置
3. 執行 "MCP: Show Migration Report" 驗證狀態
```

### 📊 診斷工具

#### 檢查 MCP 服務器狀態
- Extensions 視圖 → VSCode Commands → Show Output

#### 查看遷移狀態
- 命令面板 → `MCP: Show Migration Report`

#### 清理舊配置
- 命令面板 → `MCP: Clean Legacy Config`

### 💡 最佳實踐

- ✅ 使用 VS Code 1.85.0 或更新版本
- 🔄 定期檢查 Extensions 視圖中的 MCP 狀態
- 🧹 遷移後執行清理命令移除舊配置
- 📊 使用內建的 MCP 管理功能而非手動配置

## 🔄 從 v1.x 遷移

### 自動遷移
1. **安裝 v2.0**: 從 Marketplace 安裝新版本
2. **跟隨通知**: 擴展會自動檢測舊配置
3. **選擇選項**: 自動清理、手動處理或關閉通知

### 手動遷移
1. **執行清理**: `MCP: Clean Legacy Config`
2. **驗證狀態**: `MCP: Show Migration Report`
3. **確認運作**: 在 Extensions 視圖中啟動服務器

## 🗑️ 已移除內容 (v1.x)

以下功能在 v2.0 中已不再需要：
- ❌ **SSE 服務器**: 不再使用 HTTP/SSE transport
- ❌ **手動配置**: 不需要編輯 mcp.json
- ❌ **端口管理**: 不需要端口分配
- ❌ **Start/Stop 命令**: 由 VS Code 原生管理
- ❌ **測試腳本**: test-sse-server.js 已過時

## 🔗 相關連結

- 🌐 [VS Code MCP 指南](https://code.visualstudio.com/api/extension-guides/ai/mcp)
- 📚 [VSCode Commands 參考](https://code.visualstudio.com/api/references/commands)
- 🐙 [專案 GitHub](https://github.com/louisfghbvc/mcp-vscode-commands)
- 📖 [MCP 官方文檔](https://modelcontextprotocol.io/)

---

**零配置 × 原生整合 × 無縫體驗！** 🚀✨