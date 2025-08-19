---
id: 1
title: '更新 package.json 配置'
status: completed
priority: critical
feature: VS Code MCP 遷移
dependencies: []
assigned_agent: null
created_at: "2025-08-19T15:41:39Z"
started_at: "2025-08-19T15:47:13Z"
completed_at: "2025-08-19T15:48:52Z"
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

## Agent Notes

✅ 任務已完成 (2025-08-19T15:47:13Z)

**完成的更改：**
1. ✅ 添加了 `mcpServerDefinitionProviders` contribution point (id: "vscodeCommandsProvider")
2. ✅ 移除了舊的 start/stop/status 命令（將由 VS Code 原生管理）
3. ✅ 更新描述：從 "SSE" 改為 "VS Code 原生 MCP" 和 "零配置、原生整合"
4. ✅ 升級 VS Code 引擎版本：^1.74.0 → ^1.85.0 (MCP 支援所需)
5. ✅ 更新 @types/vscode：^1.74.0 → ^1.85.0 (版本匹配)
6. ✅ 更新 keywords：移除 "sse"、"server-sent-events"，添加 "mcp-native"、"agent-mode"、"stdio"
7. ✅ 移除了 `autoStart` 配置項（不再需要手動啟動）
8. ✅ 保持 `onStartupFinished` activation event

**驗證結果：**
- ✅ JSON 語法正確
- ✅ 無 linter 錯誤
- ✅ 所有必要的 MCP extension points 已配置
