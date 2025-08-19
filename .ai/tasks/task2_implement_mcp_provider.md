---
id: 2
title: '實作 MCP Server Definition Provider'
status: completed
priority: critical
feature: VS Code MCP 遷移
dependencies:
  - 1
assigned_agent: null
created_at: "2025-08-19T15:41:39Z"
started_at: "2025-08-19T15:50:37Z"
completed_at: "2025-08-19T15:53:03Z"
error_log: null
---

## Description

實作 vscode.lm.registerMcpServerDefinitionProvider API 來註冊 MCP 服務器，使其能在 VS Code Extensions 視圖中被管理。

## Details

- 創建 MCP server definition provider 實作
- 使用 `vscode.lm.registerMcpServerDefinitionProvider` 註冊 provider
- 實作 `provideMcpServerDefinitions` 方法返回 stdio server 配置
- 實作 `resolveMcpServerDefinition` 方法處理服務器啟動時的解析
- 設定 `onDidChangeMcpServerDefinitions` event emitter
- 配置為 stdio transport 而非 HTTP/SSE
- 處理服務器標籤、命令路徑和參數配置
- 確保與現有 VSCodeCommandsTools 相容

## Test Strategy

- 驗證 provider 能正確註冊到 VS Code
- 確認 MCP 服務器出現在 Extensions 視圖中
- 測試服務器能正確啟動和停止
- 驗證 stdio 通信正常運作

## Agent Notes

✅ 任務已完成 (2025-08-19T15:50:37Z)

**完成的更改：**

1. ✅ **創建了 MCP Server Definition Provider** (`src/mcp-provider.ts`)
   - 實作了 `vscode.McpServerDefinitionProvider` 介面
   - 提供 `provideMcpServerDefinitions` 方法返回 stdio server 配置
   - 實作 `resolveMcpServerDefinition` 方法處理服務器啟動時的解析
   - 設定 `onDidChangeMcpServerDefinitions` event emitter

2. ✅ **註冊 MCP Provider** (更新 `src/extension.ts`)
   - 使用 `vscode.lm.registerMcpServerDefinitionProvider` 註冊 provider
   - ID: "vscodeCommandsProvider" (與 package.json 中的配置匹配)
   - 添加適當的錯誤處理和日誌記錄
   - 實作 provider 生命週期管理

3. ✅ **配置 Stdio Transport**
   - 配置使用 Node.js 運行 `out/mcp-stdio-server.js`
   - 設定適當的環境變數
   - 動態獲取擴展版本

4. ✅ **向後相容性**
   - 保持舊的 HTTP 服務器代碼以防回滾需要
   - 更新 `getConfig` 函數移除 autoStart 依賴
   - 適當的資源清理 (`deactivate` 函數)

5. ✅ **錯誤處理與驗證**
   - 檢查 stdio server 檔案是否存在
   - 提供用戶友好的錯誤訊息
   - 編譯驗證通過

**技術細節：**
- Provider ID: `vscodeCommandsProvider`
- Server Label: `VSCode Commands`
- Transport: stdio (Node.js + mcp-stdio-server.js)
- 環境變數: NODE_ENV=production, VSCODE_COMMANDS_MCP=true

**驗證結果：**
- ✅ TypeScript 編譯成功
- ✅ 無 linter 錯誤
- ✅ VS Code MCP API 正確使用
- ✅ Provider 註冊邏輯實作完成

**下一步：**
需要 Task 3 創建 `mcp-stdio-server.js` 以完成完整的 stdio MCP 實作。
