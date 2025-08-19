---
id: 2
title: '實作 MCP Server Definition Provider'
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

實作 vscode.lm.registerMcpServerDefinitionProvider API 來註冊 MCP 服務器，使其能在 VS Code Extensions 視圖中被管理。

## Details

- 創建 MCP server definition provider 實作
- 使用 `vscode.lm.registerMcpServerDefinitionProvider` 註冊 provider
- 實作 `provideMcpServerDefinitions` 方法返回 stdio server 配置
- 實作 `resolveMcpServerDefinition` 方法處理服務器啟動時的解析
- 設定 `onDidChangeMcpServerDefinitions` event emitter
- 配置為 stdio transport 而非 HTTP/SSE
- 處理服務器標籤、命令路徑和參數配置
- 確保與現有 VSCodeCommandsTools 相容

## Test Strategy

- 驗證 provider 能正確註冊到 VS Code
- 確認 MCP 服務器出現在 Extensions 視圖中
- 測試服務器能正確啟動和停止
- 驗證 stdio 通信正常運作
