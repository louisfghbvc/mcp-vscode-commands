---
id: 2
title: "整合 Cursor MCP Extension API"
status: completed
priority: critical
dependencies: [1]
created: 2025-08-19T16:37:59Z
---

# Task 2: 整合 Cursor MCP Extension API

## Description

實作 `vscode.cursor.mcp.registerServer` API 來自動註冊 stdio 服務器。根據 [Cursor MCP Extension API 文檔](https://docs.cursor.com/en/context/mcp-extension-api)，使用官方支援的方式管理 MCP 服務器。

## Specific Steps

1. **添加 Cursor API 類型定義**
   - 在 `src/types.ts` 或 extension 檔案中添加 Cursor MCP API 類型
   - 確保 TypeScript 支援正確

2. **實作自動註冊功能**
   - 在 `extension.ts` 中實作 `registerStdioServer()` 函數
   - 使用 `StdioServerConfig` 格式註冊服務器
   - 處理註冊成功和失敗情況

3. **服務器生命週期管理**
   - 實作自動啟動邏輯
   - 處理服務器重啟和錯誤恢復
   - 實作 extension 停用時的清理

4. **錯誤處理和回退**
   - 檢測 Cursor API 可用性
   - 提供適當的錯誤訊息
   - 實作回退機制（如果 API 不可用）

## Expected Output

- 更新的 `src/extension.ts` 包含 Cursor API 整合
- 類型定義檔案支援 Cursor MCP API
- 自動註冊和生命週期管理功能

## Test Strategy

1. **API 可用性測試**
   - 測試 `vscode.cursor.mcp.registerServer` 是否可用
   - 驗證類型定義正確性

2. **註冊功能測試**
   - 測試服務器成功註冊到 Cursor
   - 驗證 StdioServerConfig 參數正確
   - 測試錯誤情況處理

3. **生命週期測試**
   - 測試 extension 啟動時的自動註冊
   - 測試 extension 停用時的清理
   - 測試服務器重啟場景

## Implementation Example

```typescript
// 註冊 stdio 服務器
export function registerStdioServer(context: vscode.ExtensionContext): void {
  try {
    if (!vscode.cursor?.mcp?.registerServer) {
      throw new Error('Cursor MCP API not available');
    }

    const serverConfig: vscode.cursor.mcp.StdioServerConfig = {
      name: 'vscode-commands',
      server: {
        command: 'node',
        args: [path.join(context.extensionPath, 'out', 'mcp-stdio-server.js')],
        env: {
          'NODE_ENV': 'production',
          'VSCODE_COMMANDS_MCP': 'true'
        }
      }
    };

    vscode.cursor.mcp.registerServer(serverConfig);
    console.log('✅ Successfully registered stdio MCP server');
    
  } catch (error) {
    console.error('❌ Failed to register MCP server:', error);
    vscode.window.showErrorMessage(`MCP 服務器註冊失敗: ${error.message}`);
  }
}
```

## Technical Notes

- 必須使用 Cursor 官方的 `StdioServerConfig` 格式
- 服務器執行檔路徑必須正確指向編譯後的 `mcp-stdio-server.js`
- 需要適當的環境變數設定

## Acceptance Criteria

- [ ] 成功實作 Cursor MCP Extension API 整合
- [ ] 服務器能自動註冊到 Cursor
- [ ] 類型安全的 TypeScript 實作
- [ ] 適當的錯誤處理和回退機制
- [ ] Extension 生命週期管理正確
