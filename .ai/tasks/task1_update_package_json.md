---
id: 1
title: '更新 package.json 配置'
status: pending
priority: critical
feature: VS Code MCP 遷移
dependencies: []
assigned_agent: null
created_at: "2025-08-19T15:41:39Z"
started_at: null
completed_at: null
error_log: null
---

## Description

更新 package.json 以支援 VS Code MCP extension points，添加 mcpServerDefinitionProviders contribution point，並移除舊的 HTTP 服務器相關命令。

## Details

- 在 `contributes` 中添加 `mcpServerDefinitionProviders` 配置
- 移除舊的 start/stop/status 命令（因為將由 VS Code 原生管理）
- 更新 extension 描述以反映新的原生 MCP 支援
- 確保所有必要的 VS Code API 版本需求
- 更新 keywords 以包含 "mcp-native" 或相關標籤
- 檢查是否需要添加新的 activation events

## Test Strategy

- 驗證 package.json 語法正確
- 確認 VS Code 能正確識別 MCP contribution points
- 檢查 extension 能正常載入且沒有錯誤
