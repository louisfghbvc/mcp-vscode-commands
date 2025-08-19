---
id: 3
title: "重構 Extension 架構"
status: pending
priority: high
dependencies: [1, 2]
created: 2025-08-19T16:37:59Z
---

# Task 3: 重構 Extension 架構

## Description

更新 `extension.ts` 以使用新的 stdio 架構並移除 HTTP/SSE 邏輯。簡化 extension 程式碼，專注於 Cursor API 整合和 stdio 服務器管理。

## Specific Steps

1. **移除 HTTP/SSE 相關程式碼**
   - 刪除 `MCPSSEServer` 實例和相關邏輯
   - 移除 HTTP 服務器啟動/停止函數
   - 清理不需要的 imports 和依賴

2. **實作新的 Stdio 架構**
   - 替換為 Cursor API 註冊邏輯
   - 實作 stdio 服務器生命週期管理
   - 簡化 extension 主要邏輯

3. **更新命令處理器**
   - 修改或移除舊的 HTTP 相關命令
   - 添加新的 stdio 服務器管理命令
   - 實作狀態查詢和診斷功能

4. **優化啟動流程**
   - 簡化 `activate()` 函數
   - 實作更快的啟動時間
   - 減少啟動時的資源使用

## Expected Output

- 重構後的 `src/extension.ts`
- 大幅簡化的程式碼結構
- 移除的檔案：與 HTTP/SSE 相關的模組

## Code Changes Preview

### 舊架構 (SSE)
```typescript
// 複雜的 HTTP 服務器管理
let mcpServer: MCPSSEServer | undefined;

export function activate(context: vscode.ExtensionContext) {
  // HTTP 服務器啟動邏輯
  // 端口管理
  // mcp.json 配置管理
  // 複雜的錯誤處理
}
```

### 新架構 (Stdio + Cursor API)
```typescript
// 簡潔的 API 整合
export function activate(context: vscode.ExtensionContext) {
  try {
    // 簡單的一次性註冊
    registerStdioServer(context);
    console.log('✅ MCP Server registered successfully');
  } catch (error) {
    console.error('❌ Registration failed:', error);
  }
}
```

## Test Strategy

1. **程式碼品質測試**
   - ESLint 和 TypeScript 編譯測試
   - 確保沒有未使用的 imports
   - 檢查程式碼覆蓋率改善

2. **功能測試**
   - 測試 extension 啟動和停用
   - 驗證 stdio 服務器註冊成功
   - 測試新的命令處理器

3. **性能測試**
   - 測量啟動時間改善
   - 檢查記憶體使用減少
   - 驗證 CPU 使用優化

## Refactoring Goals

- **程式碼減少**: 目標減少 60%+ 的程式碼行數
- **複雜度降低**: 移除 HTTP 服務器管理複雜性
- **啟動時間**: 改善 40%+ 的啟動速度
- **維護性**: 更簡潔、易理解的程式碼結構

## Technical Notes

- 保持向後相容的配置選項
- 確保所有 VS Code API 使用正確
- 移除對檔案系統的不必要操作（mcp.json 管理）

## Acceptance Criteria

- [ ] 成功移除所有 HTTP/SSE 相關程式碼
- [ ] 實作完整的 stdio 架構整合
- [ ] Extension 啟動和功能正常
- [ ] 程式碼複雜度顯著降低
- [ ] 通過所有單元和整合測試
- [ ] 性能指標達到預期改善
