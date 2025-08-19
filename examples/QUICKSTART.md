# 🚀 MCP VSCode Commands Extension - 快速開始指南 (v0.2.0)

最快速的方式開始使用新的高效能 Stdio 架構！

> 🎯 **零配置承諾**: 真正的安裝即用，30 秒內完成設定！

## ⏱️ 30 秒快速設定

### 步驟 1: 安裝 Extension (20 秒)

#### 方法 A: 從 Marketplace (推薦)
1. 開啟 VS Code 或 Cursor
2. 按 `Ctrl+Shift+X` 開啟 Extensions 視圖
3. 搜尋 "MCP VSCode Commands"
4. 點擊 "Install"

#### 方法 B: 從 VSIX 檔案
```bash
# 下載並安裝 VSIX
code --install-extension mcp-vscode-commands-0.2.0.vsix
```

### 步驟 2: 自動設定 (< 10 秒)

Extension 會智能自動：
- ✅ 檢測 Cursor MCP Extension API
- ✅ 啟動高效能 Stdio 服務器 (無端口需求)
- ✅ 使用官方 `vscode.cursor.mcp.registerServer` 註冊
- ✅ 自動回退到內建模式 (如 API 不可用)
- ✅ 立即可用於 Cursor AI

你會在 VSCode 右下角看到成功通知！

### 步驟 3: 驗證設定 (< 5 秒)

打開 Cursor AI 並測試：

```
請幫我列出所有可用的 VSCode 命令
```

如果看到命令列表，說明設定成功！🎉

## 🎮 立即開始使用

### 基本命令執行

試試這些自然語言指令：

```
請格式化當前文檔
```

```
請幫我開啟設定頁面
```

```
請關閉當前分頁
```

### 進階用法

```
請列出所有包含 "editor" 的命令
```

```
請執行 workbench.action.toggleSidebar
```

```
請開啟一個新的終端視窗
```

## 🔧 管理功能

### 診斷工具
如果遇到問題，使用內建診斷：

1. 按 `Ctrl+Shift+P`
2. 輸入 "Show MCP Diagnostics"
3. 查看詳細狀態資訊

### 重啟服務器
如果需要重啟服務器：

1. 按 `Ctrl+Shift+P`
2. 輸入 "Restart MCP Server"
3. 等待重啟完成

## 📊 性能亮點

使用新的 Stdio 架構，你將享受到：

| 指標 | v0.1.x | v0.2.0 | 改善 |
|------|--------|--------|------|
| 命令延遲 | ~42ms | ~2ms | **95%** ⬇️ |
| 啟動時間 | ~185ms | ~48ms | **74%** ⬇️ |
| 記憶體 | 12.8MB | 1.1MB | **92%** ⬇️ |

## 🛠️ 配置選項 (可選)

Extension 提供一些可選配置：

```json
{
  "mcpVscodeCommands.logLevel": "info",
  "mcpVscodeCommands.enableDiagnostics": false,
  "mcpVscodeCommands.autoStart": true
}
```

### 推薦配置
對於開發者，建議啟用詳細診斷：

```json
{
  "mcpVscodeCommands.enableDiagnostics": true,
  "mcpVscodeCommands.logLevel": "debug"
}
```

## ❓ 常見問題

### Q: 服務器沒有自動註冊？
**A**: 這是正常現象！Extension 會自動回退到內建模式，功能完全正常。

### Q: 如何確認 Cursor API 是否可用？
**A**: 使用診斷命令 (`Show MCP Diagnostics`) 查看 API 狀態。

### Q: 性能提升明顯嗎？
**A**: 非常明顯！延遲降低 95%，記憶體使用減少 92%。

### Q: 需要手動配置 mcp.json 嗎？
**A**: 完全不需要！Extension 會自動處理所有配置。

## 🎯 下一步

### 探索更多功能
- 查看 [基本使用範例](basic-usage.md) 了解所有可用工具
- 閱讀 [設定指南](README-MCP-Setup.md) 了解技術細節
- 參考 [性能報告](../performance-report.md) 了解改善詳情

### 進階配置
- 啟用詳細診斷模式
- 自定義日誌級別
- 配置開發環境

### 貢獻和回饋
- 回報使用體驗
- 提出改善建議
- 參與開發貢獻

---

> 🚀 **開始享受革命性的 AI 輔助開發體驗吧！** 任何問題都可以使用診斷工具快速解決。