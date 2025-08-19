---
id: 1
title: "創建 Stdio-based MCP Server"
status: completed
priority: critical
dependencies: []
created: 2025-08-19T16:37:59Z
---

# Task 1: 創建 Stdio-based MCP Server

## Description

實作新的 stdio 傳輸 MCP 服務器，取代現有的 SSE 實作。使用 `@modelcontextprotocol/sdk` 的 `StdioServerTransport` 來建立高效能的本地通信。

## Specific Steps

1. **創建 `src/mcp-stdio-server.ts`**
   - 實作 `MCPStdioServer` 類
   - 使用 `StdioServerTransport` 而非 SSE
   - 整合現有的 `VSCodeCommandsTools`
   - 建立 standalone 進程進入點

2. **實作核心功能**
   - 註冊 `list_tools` 和 `call_tool` 處理器
   - 保持與現有 SSE 版本相同的工具功能
   - 實作適當的錯誤處理和日誌

3. **進程管理**
   - 支援作為獨立進程運行
   - 實作優雅的啟動和關閉
   - 處理進程間通信

4. **效能優化**
   - 確保 stdio 通信效率
   - 減少不必要的資源使用
   - 實作連線健康檢查

## Expected Output

- `src/mcp-stdio-server.ts` 檔案
- 可執行的 `out/mcp-stdio-server.js` 編譯產物
- 支援以下命令列啟動：
  ```bash
  node out/mcp-stdio-server.js
  ```

## Test Strategy

1. **單元測試**
   - 測試工具註冊和執行
   - 驗證 stdio 通信協定
   - 錯誤處理測試

2. **整合測試**
   - 與 VSCode 命令整合測試
   - 進程生命週期測試
   - 性能基準測試

3. **手動測試**
   - 使用 MCP client 連接測試
   - 驗證工具功能正確性
   - 檢查記憶體和 CPU 使用

## Technical Notes

- 基於 [Cursor MCP API 文檔](https://docs.cursor.com/en/context/mcp-extension-api) 的 StdioServerConfig 格式
- 必須保持與現有 SSE 版本的功能相容性
- 目標：比 HTTP/SSE 版本快 50% 以上的響應時間

## Acceptance Criteria

- [ ] 成功創建 stdio MCP 服務器
- [ ] 工具功能與 SSE 版本完全相容
- [ ] 進程可獨立啟動和運行
- [ ] 通過所有單元和整合測試
- [ ] 性能優於 HTTP/SSE 版本
