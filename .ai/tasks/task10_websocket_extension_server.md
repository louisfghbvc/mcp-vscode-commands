# Task 10: WebSocket Extension Server 實現

## 任務概述

實現 Extension 端的 WebSocket Server，作為 MCP Client 的連接端點，處理 VSCode 命令執行請求。

## 任務詳情

### 目標
- 實現 WebSocket Server 在 Extension 內運行
- 處理來自 MCP Client 的連接和消息
- 執行 VSCode 命令並返回結果
- 管理連接生命週期和錯誤處理

### 技術要求
- **WebSocket Server**: 使用 ws 庫實現
- **命令執行**: 集成現有的 VSCodeCommandsTools
- **連接管理**: 支援多個並發連接
- **錯誤處理**: 完整的錯誤響應和日誌記錄

### 交付物
- [ ] WebSocketMCPServerExtension 類實現
- [ ] 連接管理和消息處理邏輯
- [ ] 錯誤處理和響應機制
- [ ] 連接狀態監控和診斷

## 實施步驟

### 步驟 1: 基礎架構實現
- 創建 WebSocketMCPServerExtension 類
- 實現 WebSocket Server 啟動和監聽
- 配置端口自動分配和綁定
- 實現基本的連接接受邏輯

### 步驟 2: 消息處理實現
- 實現 JSON-RPC 2.0 消息解析
- 處理 tools/list 請求
- 處理 tools/call 請求
- 實現 ping/pong 心跳機制

### 步驟 3: VSCode 命令集成
- 集成 VSCodeCommandsTools
- 實現 executeCommand 工具
- 實現 listCommands 工具
- 格式化命令執行結果

### 步驟 4: 連接管理
- 實現連接生命週期管理
- 處理連接斷開和清理
- 實現連接狀態追蹤
- 添加連接診斷信息

### 步驟 5: 錯誤處理
- 實現完整的錯誤響應格式
- 添加錯誤日誌記錄
- 實現連接錯誤處理
- 添加錯誤通知機制

## 技術考慮

### 依賴關係
- 依賴於 Task 9 (架構設計)
- 需要 VSCodeCommandsTools 模組
- 需要 ws WebSocket 庫

### 風險評估
- **高風險**: WebSocket 連接穩定性
- **中風險**: 消息格式兼容性
- **低風險**: 性能開銷

### 測試策略
- 單元測試 WebSocket Server
- 連接建立和斷開測試
- 消息處理測試
- 錯誤處理測試

## 驗收標準

- [ ] WebSocket Server 能正常啟動和監聽
- [ ] 能接受來自 MCP Client 的連接
- [ ] 正確處理 tools/list 和 tools/call 請求
- [ ] 正確執行 VSCode 命令並返回結果
- [ ] 錯誤處理完整且響應格式正確
- [ ] 連接管理穩定，無記憶體洩漏

## 時間估計

**估計時間**: 5-7 天
**優先級**: Critical
**依賴關係**: Task 9 (架構設計)

## 相關資源

- [WebSocket MCP 重構計劃](../plans/features/websocket-mcp-refactor-plan.md)
- [Task 9: WebSocket 架構設計](./task9_websocket_architecture_design.md)
- [VSCodeCommandsTools 實現](../src/tools/vscode-commands.ts)
- [WebSocket API 文檔](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
