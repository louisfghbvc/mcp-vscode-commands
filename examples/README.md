# 📚 MCP VSCode Commands 範例與指南

## 🚀 快速開始

### 📋 [快速入門指南](./QUICKSTART.md)
5 分鐘設定完成！從安裝到使用的完整流程。

### ⚙️ [詳細設定指南](./README-MCP-Setup.md)
深入的配置說明，包含自動設定和手動配置選項。

### 🛠️ [基本使用範例](./basic-usage.md)
所有可用的 MCP 工具使用方法和常用 VSCode 命令。

## 🔧 配置文件

### 📄 [cursor-config.json](./cursor-config.json)
基本的 Cursor MCP 配置範例

### 📄 [cursor-config-example.json](./cursor-config-example.json)
帶有詳細註解的配置範例

## 🧪 測試與調試

### 🔍 [SSE 伺服器測試工具](./test-sse-server.js)
```bash
# 自動掃描並測試連接
node examples/test-sse-server.js

# 測試特定端口
node examples/test-sse-server.js 3000

# 掃描端口範圍
node examples/test-sse-server.js scan 3000 8080
```

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

## ❓ 故障排除

### 🔧 常見問題
1. **Server 無法啟動**: 檢查端口是否被占用
2. **Cursor 無法連接**: 確認配置文件路徑和格式
3. **命令執行失敗**: 檢查命令 ID 是否正確

### 📊 診斷工具
- 使用 `test-sse-server.js` 測試連接
- 檢查 VSCode 開發者控制台
- 查看 `~/.cursor/mcp.json` 配置

### 💡 最佳實踐
- 定期重啟 Cursor 以載入新配置
- 使用 `Show MCP Server Status` 檢查狀態
- 在 VSCode 中保持 MCP 擴展啟用

## 🔗 相關連結

- 🌐 [MCP 官方文檔](https://modelcontextprotocol.io/)
- 📚 [VSCode Commands 參考](https://code.visualstudio.com/api/references/commands)
- 🐙 [專案 GitHub](https://github.com/louisfghbvc/mcp-vscode-commands)

---

**讓 AI 成為你的 VSCode 副駕駛！** 🤖✨
