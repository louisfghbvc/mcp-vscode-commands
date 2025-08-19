---
id: 4
title: '重構 Extension 整合'
status: pending
priority: high
feature: VS Code MCP 遷移
dependencies:
  - 2
  - 3
assigned_agent: null
created_at: "2025-08-19T15:41:39Z"
started_at: null
completed_at: null
error_log: null
---

## Description

更新 extension.ts 以使用新的 MCP provider 而非舊的 HTTP 服務器，移除手動配置管理並整合到 VS Code 原生 MCP 系統中。

## Details

- 移除 MCPSSEServer 相關代碼和 HTTP 服務器管理
- 移除手動 mcp.json 配置文件管理功能
- 整合新的 MCP server definition provider
- 更新 activate 函數以註冊 MCP provider
- 移除舊的 start/stop/status 命令處理器
- 清理不再需要的依賴和 import
- 更新 deactivate 函數移除 HTTP 服務器清理邏輯
- 確保 extension 啟動時正確註冊 MCP provider

## Test Strategy

- 驗證 extension 啟動時無錯誤
- 確認 MCP provider 正確註冊
- 測試 extension 在 VS Code 中正常載入
- 驗證沒有殘留的 HTTP 服務器或配置管理代碼
