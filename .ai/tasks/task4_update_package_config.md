---
id: 4
title: "更新 Package Configuration"
status: pending
priority: high
dependencies: [3]
created: 2025-08-19T16:37:59Z
---

# Task 4: 更新 Package Configuration

## Description

更新 `package.json` 移除 HTTP 相關命令，添加新的 stdio 管理功能。調整 extension 配置以反映新的架構和功能。

## Specific Steps

1. **更新 Extension 描述**
   - 修改 `description` 反映 Cursor API + Stdio 架構
   - 更新 `keywords` 包含相關術語
   - 調整 `displayName` 如需要

2. **修改 Commands 配置**
   - 移除舊的 HTTP 相關命令：
     - `mcp-vscode-commands.start`
     - `mcp-vscode-commands.stop` 
     - `mcp-vscode-commands.status`
   - 添加新的 stdio 管理命令：
     - `mcp-vscode-commands.restart` - 重啟 stdio 服務器
     - `mcp-vscode-commands.diagnostics` - 顯示診斷資訊

3. **更新 Configuration Schema**
   - 移除不需要的配置選項：
     - `autoStart` (現在總是自動啟動)
   - 保留必要的配置：
     - `logLevel` - 日誌等級
   - 添加新的配置選項：
     - `enableDiagnostics` - 啟用診斷模式

4. **調整版本和元資料**
   - 更新版本號到 `0.2.0` (重大架構變更)
   - 更新 keywords 和 categories
   - 確保 license 和 repository 資訊正確

## Expected Output

- 更新的 `package.json` 檔案
- 正確的 commands 和 configuration 定義
- 適當的版本號和元資料

## Configuration Changes

### Before (HTTP/SSE)
```json
{
  "description": "允許 AI 透過 Model Context Protocol (SSE) 執行 VSCode 命令 - Cursor API 整合、零配置",
  "keywords": ["mcp", "sse", "server-sent-events", "cursor-api"],
  "contributes": {
    "commands": [
      {
        "command": "mcp-vscode-commands.start",
        "title": "Start MCP Server"
      },
      {
        "command": "mcp-vscode-commands.stop",
        "title": "Stop MCP Server"
      }
    ],
    "configuration": {
      "properties": {
        "mcpVscodeCommands.autoStart": {
          "type": "boolean",
          "default": true
        }
      }
    }
  }
}
```

### After (Stdio + Cursor API)
```json
{
  "description": "允許 AI 透過 Cursor MCP Extension API (Stdio) 執行 VSCode 命令 - 高效能、零配置",
  "keywords": ["mcp", "stdio", "cursor-api", "extension-api", "performance"],
  "version": "0.2.0",
  "contributes": {
    "commands": [
      {
        "command": "mcp-vscode-commands.restart",
        "title": "Restart MCP Server",
        "category": "MCP"
      },
      {
        "command": "mcp-vscode-commands.diagnostics",
        "title": "Show MCP Diagnostics",
        "category": "MCP"
      }
    ],
    "configuration": {
      "properties": {
        "mcpVscodeCommands.logLevel": {
          "type": "string",
          "enum": ["debug", "info", "warn", "error"],
          "default": "info"
        },
        "mcpVscodeCommands.enableDiagnostics": {
          "type": "boolean",
          "default": false,
          "description": "啟用詳細的診斷和性能監控"
        }
      }
    }
  }
}
```

## Test Strategy

1. **配置驗證**
   - 驗證 package.json JSON 格式正確
   - 測試所有命令能正確註冊
   - 檢查配置 schema 有效性

2. **Extension 載入測試**
   - 測試 extension 能正確載入
   - 驗證新命令在命令面板中可見
   - 測試配置選項正常運作

3. **向後相容性測試**
   - 確保現有用戶的配置不會破壞
   - 測試升級場景

## Technical Notes

- 版本號採用語義化版本控制
- Keywords 優化以提升 marketplace 搜尋結果
- Configuration schema 必須向後相容

## Acceptance Criteria

- [ ] package.json 更新完成且格式正確
- [ ] 移除所有 HTTP 相關配置
- [ ] 新命令和配置正確定義
- [ ] Extension 能正常載入和運行
- [ ] 版本號和元資料適當更新
