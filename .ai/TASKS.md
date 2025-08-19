# Project Tasks

## Cursor MCP Extension API 與 Stdio Transport 整合任務

- [x] **ID 1: 創建 Stdio-based MCP Server** (Priority: critical)
> 實作新的 stdio 傳輸 MCP 服務器，取代現有的 SSE 實作

- [x] **ID 2: 整合 Cursor MCP Extension API** (Priority: critical)
> Dependencies: 1
> 實作 vscode.cursor.mcp.registerServer API 來自動註冊 stdio 服務器

- [x] **ID 3: 重構 Extension 架構** (Priority: high)
> Dependencies: 1, 2
> 更新 extension.ts 以使用新的 stdio 架構並移除 HTTP/SSE 邏輯

- [x] **ID 4: 更新 Package Configuration** (Priority: high)  
> Dependencies: 3
> 更新 package.json 移除 HTTP 相關命令，添加新的 stdio 管理功能

- [x] **ID 5: 驗證工具相容性** (Priority: medium)
> Dependencies: 1
> 確保 VSCodeCommandsTools 與新的 stdio transport 完全相容

- [ ] **ID 6: 效能測試與優化** (Priority: medium)
> Dependencies: 2, 3
> 測試 stdio vs SSE 性能差異，驗證改善效果

- [ ] **ID 7: 更新文檔與範例** (Priority: low)
> Dependencies: 4, 6
> 更新所有文檔以反映新的 Cursor API + Stdio 架構

- [ ] **ID 8: 端到端整合測試** (Priority: high)
> Dependencies: 5, 6
> 完整測試新架構的所有功能和性能指標
