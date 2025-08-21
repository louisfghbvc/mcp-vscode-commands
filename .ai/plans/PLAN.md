# PRD: Cursor MCP Extension API 與 Stdio Transport 整合計劃

## 1. Product overview

### 1.1 Document title and version

- PRD: Cursor MCP Extension API 與 Stdio Transport 整合計劃
- Version: 2.0
- Created: 2025-08-19T16:45:00Z

### 1.2 Product summary

將現有的基於 SSE (Server-Sent Events) transport 的 MCP 實作遷移到使用 **Cursor 官方 MCP Extension API** 搭配 **stdio transport**。此架構將提供更好的性能、更簡潔的代碼和更標準的實作方式。

根據 [Cursor MCP Extension API 文檔](https://docs.cursor.com/en/context/mcp-extension-api)，我們將使用 `vscode.cursor.mcp.registerServer()` 來註冊 stdio-based MCP 服務器，完全消除對 HTTP 服務器的需求。

## 2. Goals

### 2.1 Business goals

- 採用 Cursor 官方支援的 MCP 整合方式
- 提升性能：stdio 比 HTTP/SSE 更高效
- 簡化架構：移除 HTTP 服務器依賴
- 降低資源消耗：無需網路端口和 HTTP 開銷

### 2.2 User goals

- 更快的命令執行響應時間
- 零配置安裝體驗（自動註冊）
- 更穩定的連線（無網路依賴）
- 無端口衝突問題

### 2.3 Non-goals

- 不改變現有的 tool 功能（executeCommand, listCommands）
- 不影響現有用戶的工作流程
- 不增加配置複雜度

## 3. User personas

### 3.1 Key user types

- **Cursor 用戶**: 使用 AI agent 協助開發
- **效能敏感用戶**: 需要快速命令執行的開發者
- **企業用戶**: 需要穩定可靠的自動化工具

### 3.2 Basic persona details

- **AI 驅動開發者**: 透過 AI agent 自動化 VSCode 操作
- **性能優化者**: 追求最佳工具響應時間的用戶

## 4. Functional requirements

- **Cursor MCP Extension API 整合** (Priority: critical)
  - 實作 `vscode.cursor.mcp.registerServer()` 自動註冊
  - 使用 `StdioServerConfig` 配置格式
  - 支援自動啟動和停止管理

- **Stdio-based MCP Server** (Priority: critical)
  - 移除 HTTP/SSE transport 依賴
  - 實作標準輸入/輸出通信
  - 使用 `@modelcontextprotocol/sdk` 的 stdio transport
  - 保持現有工具功能完整性

- **Extension Configuration** (Priority: high)
  - 更新 package.json 移除 HTTP 相關命令
  - 簡化配置選項
  - 添加 stdio server 管理命令

- **向後相容性** (Priority: medium)
  - 提供平滑的遷移路徑
  - 自動偵測和清理舊配置

## 5. User experience

### 5.1 Entry points & first-time user flow

用戶安裝 extension 後：
1. Extension 自動啟動 stdio MCP 服務器
2. 使用 Cursor MCP Extension API 自動註冊
3. 工具立即在 Cursor AI 中可用，無需任何配置

### 5.2 Core experience

- **安裝**: 從 marketplace 安裝 extension
  - 自動啟動 stdio 服務器進程
  - API 自動註冊到 Cursor
- **使用**: 在 Cursor AI 中無縫使用 VSCode 命令
  - 更快的命令執行（stdio vs HTTP）
  - 零延遲的本地通信
- **管理**: 簡化的服務器管理
  - 可選的手動控制命令
  - 自動錯誤恢復

### 5.3 Advanced features

- 支援開發模式調試
- 智能錯誤處理和重連
- 性能監控和日誌

## 6. Technical considerations

### 6.1 Architecture comparison

**目前 (SSE):**
```
Cursor AI ↔ HTTP/SSE ↔ Extension ↔ VSCode Commands
```

**新架構 (Stdio):**
```
Cursor AI ↔ Stdio Process ↔ Extension ↔ VSCode Commands
```

### 6.2 Cursor MCP Extension API 整合

根據 [Cursor MCP API 文檔](https://docs.cursor.com/en/context/mcp-extension-api)：

```typescript
// 註冊 stdio 服務器
vscode.cursor.mcp.registerServer({
  name: 'vscode-commands',
  server: {
    command: 'node',
    args: [path.join(extensionPath, 'out', 'mcp-stdio-server.js')],
    env: {
      'NODE_ENV': 'production',
      'VSCODE_COMMANDS_MCP': 'true'
    }
  }
});
```

### 6.3 Performance benefits

- **更低延遲**: 本地 stdio 通信 vs 網路 HTTP
- **更少資源**: 無需 HTTP 服務器和端口
- **更穩定**: 無網路依賴和端口衝突

### 6.4 Implementation strategy

1. **保持工具邏輯不變**: `VSCodeCommandsTools` 類保持相同
2. **替換 transport 層**: SSE → Stdio
3. **更新註冊方式**: HTTP config → Cursor API
4. **簡化 extension 邏輯**: 移除 HTTP 服務器管理

## 7. Milestones & sequencing

### 7.1 Project estimate

- Medium: 2-3 週

### 7.2 Suggested phases

- **Phase 1: Stdio MCP Server 實作** (1 週)
  - 創建 stdio-based MCP 服務器
  - 整合 VSCodeCommandsTools
  - 基本功能測試

- **Phase 2: Cursor API 整合** (1 週)
  - 實作 Cursor MCP Extension API 註冊
  - 更新 extension.ts 邏輯
  - 移除 HTTP/SSE 相關代碼

- **Phase 3: 測試和文檔** (0.5-1 週)
  - 端到端測試
  - 性能驗證
  - 文檔更新

## 8. User stories

### 8.1 自動 Stdio 服務器註冊

- **ID**: US-001
- **Description**: 作為用戶，我希望安裝 extension 後 MCP 服務器能透過 Cursor API 自動註冊為 stdio 進程，這樣我就能享受更快的性能。
- **Acceptance Criteria**:
  - Extension 安裝後自動啟動 stdio 服務器
  - 使用 `vscode.cursor.mcp.registerServer()` 自動註冊
  - 工具在 Cursor AI 中立即可用
  - 命令執行速度比 HTTP 方式更快

### 8.2 零配置高性能體驗

- **ID**: US-002
- **Description**: 作為開發者，我希望 VSCode 命令工具能以最佳性能運行，無需任何手動配置。
- **Acceptance Criteria**:
  - 無需編輯任何配置文件
  - Stdio 通信提供低延遲響應
  - 無端口衝突或網路問題
  - 自動錯誤恢復

### 8.3 簡化的服務器管理

- **ID**: US-003
- **Description**: 作為用戶，我希望能透過簡單的命令管理 MCP 服務器，而不需要處理 HTTP 服務器複雜性。
- **Acceptance Criteria**:
  - 提供啟動/停止服務器命令
  - 顯示服務器狀態和健康檢查
  - 自動處理進程生命週期

## 9. Success metrics

### 9.1 Performance metrics

- 命令執行延遲降低 50%+（stdio vs HTTP）
- 記憶體使用減少 30%+（無 HTTP 服務器）
- 啟動時間改善 40%+

### 9.2 User experience metrics

- 零配置安裝成功率 100%
- 用戶滿意度提升
- 技術支援請求減少

### 9.3 Technical metrics

- 程式碼複雜度降低（移除 HTTP 邏輯）
- 測試覆蓋率提升
- 穩定性改善（無網路依賴）

## 10. Implementation details

### 10.1 Stdio Server Architecture

```typescript
// 新的 stdio server 進入點
class MCPStdioServer {
  private server: Server;
  private tools: VSCodeCommandsTools;
  
  constructor() {
    this.server = new Server({
      name: 'mcp-vscode-commands',
      version: '0.2.0'
    });
    this.tools = new VSCodeCommandsTools();
    this.setupHandlers();
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}
```

### 10.2 Cursor API Integration

```typescript
// extension.ts 中的註冊邏輯
export function activate(context: vscode.ExtensionContext) {
  try {
    vscode.cursor.mcp.registerServer({
      name: 'vscode-commands',
      server: {
        command: 'node',
        args: [path.join(context.extensionPath, 'out', 'mcp-stdio-server.js')],
        env: {
          'NODE_ENV': 'production',
          'VSCODE_COMMANDS_MCP': 'true'
        }
      }
    });
  } catch (error) {
    console.error('Failed to register MCP server:', error);
  }
}
```

這個新計劃將提供更好的性能、更簡潔的架構，並充分利用 Cursor 官方的 MCP Extension API。

## 11. 未來發展方向

### 11.1 WebSocket 架構重構

為了進一步提升系統的穩定性和可維護性，我們計劃進行架構重構，從當前的 TCP 橋接模式轉換為 WebSocket 通信模式。

**新架構特點：**
- **進程分離**: MCP server 作為獨立進程運行，提供更好的錯誤隔離
- **WebSocket 通信**: 使用標準的 WebSocket 協議進行 Extension 與 MCP server 的通信
- **增強穩定性**: 更好的連接管理和錯誤恢復機制
- **擴展性**: 為未來功能擴展提供堅實的基礎

**詳細計劃**: 請參考 [WebSocket MCP 架構重構計劃](features/websocket-mcp-refactor-plan.md)

### 11.2 架構演進路線圖

1. **Phase 1**: 完成當前的 stdio + Cursor API 整合 ✅
2. **Phase 2**: WebSocket 架構重構和實現 🔄
3. **Phase 3**: 性能優化和功能擴展 📈
4. **Phase 4**: 企業級功能和部署選項 🏢
