---
id: 6
title: '創建遷移支援'
status: pending
priority: medium
feature: VS Code MCP 遷移
dependencies:
  - 4
assigned_agent: null
created_at: "2025-08-19T15:41:39Z"
started_at: null
completed_at: null
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
