# Project Tasks

## VS Code 原生 MCP 遷移任務

- [x] **ID 1: 更新 package.json 配置** (Priority: critical)
> 更新 package.json 以支援 VS Code MCP extension points 和移除舊的 HTTP 服務器命令

- [x] **ID 2: 實作 MCP Server Definition Provider** (Priority: critical)
> Dependencies: 1
> 實作 vscode.lm.registerMcpServerDefinitionProvider API 來註冊 MCP 服務器

- [x] **ID 3: 創建 Stdio-based MCP Server** (Priority: critical)  
> Dependencies: 1
> 重寫 MCP 服務器以使用 stdio transport 而非 HTTP/SSE

- [x] **ID 4: 重構 Extension 整合** (Priority: high)
> Dependencies: 2, 3
> 更新 extension.ts 以使用新的 MCP provider 而非 HTTP 服務器

- [x] **ID 5: 更新工具實作** (Priority: medium)
> Dependencies: 3
> 確保 VSCodeCommandsTools 與新的 stdio transport 相容

- [x] **ID 6: 創建遷移支援** (Priority: medium)
> Dependencies: 4
> 實作工具來偵測和清理舊的 mcp.json 配置

- [x] **ID 7: 更新文檔和範例** (Priority: low)
> Dependencies: 4, 6
> 更新 README、範例和使用說明以反映新的 VS Code 原生架構

- [ ] **ID 8: 整合測試** (Priority: high)
> Dependencies: 5, 6
> 測試新的 VS Code MCP 整合並驗證所有功能正常運作
