# Task 12: Extension 整合

## 任務概述

將 WebSocket MCP 架構整合到現有的 VS Code Extension 中，更新啟動邏輯、配置管理和用戶界面。

## 任務詳情

### 目標
- 更新 Extension 啟動邏輯以使用 WebSocket 架構
- 集成進程管理和監控功能
- 更新配置選項和用戶界面
- 實現向後相容性

### 技術要求
- **啟動邏輯**: 自動啟動 WebSocket Server 和 MCP Client
- **進程管理**: 監控和管理 MCP Client 進程
- **配置管理**: 更新配置選項和默認值
- **用戶界面**: 更新狀態顯示和診斷信息

### 交付物
- [ ] 更新的 extension.ts 主文件
- [ ] 進程管理和管理命令
- [ ] 更新的配置選項
- [ ] 狀態監控和診斷面板

## 實施步驟

### 步驟 1: 主文件更新
- 更新 extension.ts 的 import 語句
- 替換舊的 MCP 啟動邏輯
- 集成 WebSocket Server 啟動
- 實現 MCP Client 進程管理

### 步驟 2: 進程管理實現
- 實現 MCP Client 進程啟動 (spawn)
- 添加進程健康檢查和監控
- 實現進程崩潰恢復機制
- 添加進程狀態追蹤

### 步驟 3: 配置管理更新
- 更新 package.json 配置選項
- 添加 WebSocket 相關配置
- 實現配置驗證和默認值
- 添加配置遷移邏輯

### 步驟 4: 管理命令更新
- 更新現有的管理命令
- 添加 WebSocket 狀態檢查命令
- 實現進程重啟和診斷命令
- 添加連接狀態監控命令

### 步驟 5: 用戶界面更新
- 更新狀態欄顯示
- 實現診斷面板
- 添加錯誤通知和恢復建議
- 實現性能指標顯示

## 技術考慮

### 依賴關係
- 依賴於 Task 9 (架構設計)
- 依賴於 Task 10 (Extension Server)
- 依賴於 Task 11 (MCP Client)
- 需要更新現有的 Extension 代碼

### 風險評估
- **高風險**: 破壞現有功能
- **中風險**: 配置遷移複雜性
- **低風險**: 用戶界面更新

### 測試策略
- 整合測試整個 Extension
- 向後相容性測試
- 配置遷移測試
- 用戶界面功能測試

## 驗收標準

- [ ] Extension 能正常啟動 WebSocket 架構
- [ ] 現有功能保持不變
- [ ] 進程管理穩定可靠
- [ ] 配置選項完整且易用
- [ ] 用戶界面清晰且功能完整
- [ ] 向後相容性得到保證

## 時間估計

**估計時間**: 3-5 天
**優先級**: High
**依賴關係**: Task 9, 10, 11

## 相關資源

- [WebSocket MCP 重構計劃](../plans/features/websocket-mcp-refactor-plan.md)
- [Task 9: WebSocket 架構設計](./task9_websocket_architecture_design.md)
- [Task 10: WebSocket Extension Server](./task10_websocket_extension_server.md)
- [Task 11: WebSocket MCP Client](./task11_websocket_mcp_client.md)
- [現有 Extension 實現](../src/extension.ts)
- [VS Code Extension API 文檔](https://code.visualstudio.com/api)
