---
id: 6
title: '創建遷移支援'
status: completed
priority: medium
feature: VS Code MCP 遷移
dependencies:
  - 4
assigned_agent: null
created_at: "2025-08-19T15:41:39Z"
started_at: "2025-08-19T16:04:52Z"
completed_at: "2025-08-19T16:07:07Z"
error_log: null
---

## Description

實作工具來偵測和清理舊的 mcp.json 配置，並提供用戶遷移指導和選項。

## Details

- 創建功能來偵測用戶的 ~/.cursor/mcp.json 中是否有舊的配置
- 實作可選的清理工具移除舊的 vscode-commands 配置項
- 添加用戶通知提醒關於新的原生 MCP 支援
- 提供遷移指南或說明文件
- 考慮添加 VS Code 命令來手動觸發清理
- 確保遷移過程是安全且可逆的
- 實作適當的錯誤處理和用戶反馈

## Test Strategy

- 測試舊配置偵測功能正確運作
- 驗證清理工具只移除相關配置而不影響其他 MCP 服務器
- 確認用戶通知和指導訊息清晰易懂
- 測試在沒有舊配置時的行為

## Agent Notes

✅ 任務已完成 (2025-08-19T16:04:52Z)

**完成的更改：**

1. ✅ **創建遷移工具模組** (`src/migration-utils.ts`)
   - 實作 `MigrationUtils` 類別提供完整的遷移功能
   - 偵測舊配置：支援 `mcpServers.vscode-commands` 和 `servers.vscode-commands`
   - 安全清理：自動創建備份文件
   - 智能處理：空配置文件自動刪除

2. ✅ **整合到 Extension** (更新 `src/extension.ts`)
   - 自動遷移檢查：啟動 2 秒後檢查舊配置
   - 用戶友好通知：提供多種選項（清理/手動/禁用）
   - 延遲執行：避免阻塞 extension 啟動

3. ✅ **添加 VS Code 命令** (更新 `package.json`)
   - `MCP: Clean Legacy Config`: 手動觸發清理
   - `MCP: Show Migration Report`: 顯示遷移狀態報告
   - 配置選項：`showMigrationNotifications` 控制通知

4. ✅ **安全和可逆設計**
   - 自動備份：清理前創建帶時間戳的備份文件
   - 選擇性清理：只移除 `vscode-commands` 相關配置
   - 智能檢測：保護其他 MCP 服務器配置
   - 錯誤處理：完整的 try-catch 和用戶反馈

5. ✅ **用戶體驗優化**
   - 友好的通知訊息和確認對話框
   - 清晰的狀態報告和指導
   - 可配置的通知偏好設定
   - 手動命令作為備用選項

**技術實作細節：**

**配置檢測：**
- 檢查 `~/.cursor/mcp.json` 中的舊配置
- 支援新格式 (`mcpServers`) 和舊格式 (`servers`)
- 安全性評估：確保不影響其他服務器

**清理邏輯：**
- 創建備份：`mcp.json.backup-YYYY-MM-DDTHH-MM-SS`
- 選擇性移除：只刪除 `vscode-commands` 項目
- 空對象清理：移除空的 `mcpServers` 或 `servers` 對象
- 空文件處理：完全空的配置文件將被刪除

**用戶通知流程：**
1. 啟動檢測舊配置 (2 秒延遲)
2. 顯示友好的遷移通知
3. 提供三個選項：清理配置/手動處理/不再提醒
4. 執行用戶選擇的操作

**VS Code 命令：**
- **Clean Legacy Config**: 確認後執行清理
- **Show Migration Report**: 顯示詳細的遷移狀態

**配置選項：**
- `showMigrationNotifications`: 控制自動通知（預設啟用）
- `showWelcomeMessage`: 歡迎訊息（保留）
- `logLevel`: 日誌級別（保留）

**驗證結果：**
- ✅ TypeScript 編譯成功
- ✅ 無 linter 錯誤
- ✅ 所有命令正確註冊
- ✅ 完整的錯誤處理和用戶反馈

**下一步：**
遷移支援已完成，用戶可以：
1. 自動接收遷移通知
2. 使用命令面板手動清理
3. 查看詳細的遷移報告
4. 安全地從舊配置遷移到新架構
