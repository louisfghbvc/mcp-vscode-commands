---
id: 3
title: '創建 Stdio-based MCP Server'
status: pending
priority: critical
feature: VS Code MCP 遷移
dependencies:
  - 1
assigned_agent: null
created_at: "2025-08-19T15:41:39Z"
started_at: null
completed_at: null
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
