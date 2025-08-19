---
id: 5
title: "驗證工具相容性"
status: pending
priority: medium
dependencies: [1]
created: 2025-08-19T16:37:59Z
---

# Task 5: 驗證工具相容性

## Description

確保 `VSCodeCommandsTools` 與新的 stdio transport 完全相容。驗證所有工具功能在新架構下正常運作，確保無縫遷移。

## Specific Steps

1. **檢查 VSCodeCommandsTools 程式碼**
   - 分析現有的 `src/tools/vscode-commands.ts`
   - 確認其 transport 無關性
   - 檢查對外部依賴的使用

2. **執行相容性測試**
   - 測試 `executeCommand` 功能
   - 測試 `listCommands` 功能
   - 驗證錯誤處理機制

3. **性能基準測試**
   - 比較 stdio vs SSE 的工具執行時間
   - 測量記憶體使用差異
   - 評估 CPU 使用效率

4. **邊緣案例測試**
   - 測試長時間運行的命令
   - 測試大量並發命令執行
   - 測試錯誤和例外情況

## Expected Output

- 相容性測試報告
- 性能比較數據
- 任何需要的程式碼調整

## Compatibility Analysis

### VSCodeCommandsTools 架構
```typescript
export class VSCodeCommandsTools {
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  async executeCommand(commandId: string, args?: any[]): Promise<CommandExecutionResult> {
    // 直接使用 vscode.commands.executeCommand
    // 沒有依賴特定的 transport
  }

  async listCommands(filter?: string): Promise<CommandExecutionResult> {
    // 直接使用 vscode.commands.getCommands
    // 沒有依賴特定的 transport
  }
}
```

### 預期相容性狀況
- ✅ **完全相容**: VSCodeCommandsTools 只依賴 VSCode API
- ✅ **無 transport 依賴**: 工具邏輯與傳輸層分離
- ✅ **配置保持相同**: MCPServerConfig 介面不變

## Test Strategy

1. **單元測試**
   - 測試個別工具方法
   - 驗證回傳值格式
   - 測試錯誤處理邏輯

2. **整合測試**
   - 在 stdio 環境中測試工具
   - 與實際 VSCode 命令互動測試
   - 端到端工作流程測試

3. **性能測試**
   ```typescript
   // 性能測試範例
   const startTime = performance.now();
   await tools.executeCommand('editor.action.formatDocument');
   const endTime = performance.now();
   console.log(`Command execution time: ${endTime - startTime}ms`);
   ```

4. **回歸測試**
   - 與 SSE 版本功能對照
   - 確保所有現有功能正常
   - 驗證工具回應格式一致

## Performance Expectations

| 指標 | SSE (基準) | Stdio (目標) | 改善 |
|------|------------|--------------|------|
| 命令執行延遲 | ~50ms | ~25ms | 50% |
| 記憶體使用 | 基準 | -30% | 30% |
| CPU 使用 | 基準 | -20% | 20% |

## Technical Notes

- VSCodeCommandsTools 設計為 transport-agnostic
- 所有工具直接呼叫 VSCode API，不透過網路
- 主要性能改善來自 transport 層，不是工具層

## Potential Issues

1. **配置物件變更**
   - 如果 MCPServerConfig 需要調整
   - 解決方案：保持介面相容或提供適配器

2. **錯誤處理差異**
   - Stdio vs HTTP 的錯誤傳播可能不同
   - 解決方案：標準化錯誤處理邏輯

3. **日誌和調試**
   - Stdio 環境的日誌可能需要調整
   - 解決方案：統一日誌介面

## Acceptance Criteria

- [ ] VSCodeCommandsTools 在 stdio 環境下正常運作
- [ ] 所有工具功能測試通過
- [ ] 性能指標達到或超過預期
- [ ] 無需修改現有工具邏輯
- [ ] 完整的相容性測試報告
