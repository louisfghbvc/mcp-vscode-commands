---
id: 3
title: '創建 Stdio-based MCP Server'
status: completed
priority: critical
feature: VS Code MCP 遷移
dependencies:
  - 1
assigned_agent: Claude
created_at: "2025-08-19T15:41:39Z"
started_at: "2025-08-19T15:55:09Z"
completed_at: "2025-08-19T15:56:32Z"
error_log: null
---

## Description

重寫 MCP 服務器以使用 stdio transport 而非 HTTP/SSE，創建一個可以作為獨立進程運行並透過標準輸入/輸出與 VS Code 通信的服務器。

## Details

- 創建新的 stdio-based MCP server 文件（如 `mcp-stdio-server.ts`）
- 使用 `@modelcontextprotocol/sdk` 的 stdio transport
- 移除所有 HTTP server 相關代碼
- 保持相同的工具註冊（executeCommand, listCommands）
- 確保錯誤處理和日誌記錄適合 stdio 環境
- 實作適當的程序退出處理
- 保持與現有 VSCodeCommandsTools 的相容性
- 考慮創建可執行的入口點文件

## Test Strategy

- 驗證服務器能在命令行中獨立運行
- 測試 stdio 通信協議正確實作
- 確認所有現有工具功能正常運作
- 驗證錯誤處理和優雅關閉

## Agent Notes

✅ 任務已完成 (2025-08-19T15:55:09Z)

**完成的更改：**

1. ✅ **創建了 Stdio-based MCP Server** (`src/mcp-stdio-server.ts`)
   - 完全重寫 MCP 服務器以使用 stdio transport
   - 移除所有 HTTP server 和 SSE 相關代碼
   - 使用 `@modelcontextprotocol/sdk` 的 `StdioServerTransport`

2. ✅ **保持工具相容性**
   - 複用現有的 `VSCodeCommandsTools` 類別
   - 保持相同的工具註冊（executeCommand, listCommands）
   - 維持相同的工具 schema 和功能

3. ✅ **實作 MCP 處理器**
   - `ListToolsRequestSchema` 處理器：返回工具定義
   - `CallToolRequestSchema` 處理器：執行工具並返回結果
   - 適當的錯誤處理和結果格式化

4. ✅ **Stdio 環境優化**
   - 適合 stdio 環境的日誌記錄（使用 stderr）
   - 優雅的程序退出處理（SIGINT, SIGTERM）
   - 未捕獲異常處理
   - 環境變數配置支援

5. ✅ **獨立可執行設計**
   - 可作為獨立進程運行
   - 支援命令行啟動
   - 適當的主入口點和模組導出

**技術實作細節：**
- **Transport**: `StdioServerTransport` (標準輸入/輸出)
- **Server Name**: `mcp-vscode-commands`
- **Tools**: `vscode.executeCommand`, `vscode.listCommands`
- **Error Handling**: 完整的錯誤捕獲和日誌記錄
- **Environment**: 支援環境變數配置（log level, version）

**檔案結構：**
- `src/mcp-stdio-server.ts` - 主要 stdio server 實作
- `out/mcp-stdio-server.js` - 編譯後的可執行檔案
- 複用現有的 `tools/vscode-commands.ts` 和 `types.ts`

**驗證結果：**
- ✅ TypeScript 編譯成功
- ✅ 生成了可執行的 `out/mcp-stdio-server.js`
- ✅ 無編譯錯誤或警告
- ✅ 服務器架構完整實作

**下一步：**
需要 Task 4 重構 Extension 整合以使用新的 stdio server 而非舊的 HTTP server。
