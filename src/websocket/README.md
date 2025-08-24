# WebSocket MCP 架構

這個目錄包含了完整的 WebSocket MCP 架構實現，包括 Extension Server 和 MCP Client。

## 架構概述

```
┌─────────────────┐    WebSocket    ┌──────────────────┐
│   MCP Client    │ ←────────────→  │ Extension Server │
│  (Independent   │                 │  (VS Code Ext)   │
│   Process)      │                 │                  │
└─────────────────┘                 └──────────────────┘
```

## 組件說明

### 1. Extension Server (`websocket-mcp-server-extension.ts`)
- VS Code Extension 端的 WebSocket 服務器
- 處理來自 MCP Client 的連接和請求
- 執行 VS Code 命令並返回結果

### 2. MCP Client (`websocket-mcp-client.ts`)
- 獨立的進程，作為 WebSocket Client
- 連接到 Extension 的 WebSocket Server
- 處理 stdio 通信和消息轉發

### 3. Client Launcher (`mcp-client-launcher.ts`)
- 用於啟動和管理 MCP Client 進程
- 提供進程生命週期管理
- 支援自動重啟和錯誤恢復

### 4. 連接管理 (`connection-manager.ts`)
- 管理 WebSocket 連接的生命週期
- 提供連接統計和健康檢查
- 支援多個並發連接

### 5. 診斷系統 (`diagnostics/websocket-diagnostics.ts`)
- 提供診斷信息和性能監控
- 實現健康檢查和狀態顯示
- 支援診斷信息導出

## 使用方法

### 啟動 Extension Server

在 VS Code 中，Extension Server 會自動啟動並監聽 WebSocket 連接。

### 啟動 MCP Client

#### 方法 1: 直接運行
```bash
# 編譯 TypeScript
npm run compile

# 運行 MCP Client
node out/websocket/websocket-mcp-client.js
```

#### 方法 2: 使用啟動器
```bash
# 啟動
node out/websocket/mcp-client-launcher.js start

# 停止
node out/websocket/mcp-client-launcher.js stop

# 重啟
node out/websocket/mcp-client-launcher.js restart

# 查看狀態
node out/websocket/mcp-client-launcher.js status
```

### 配置選項

可以通過環境變數配置 MCP Client：

```bash
export WEBSOCKET_URL=ws://localhost:19847
node out/websocket/websocket-mcp-client.js
```

## 通信協議

### 消息格式

所有 WebSocket 消息都遵循以下格式：

```typescript
interface WebSocketMessage {
  id: string;
  type: MessageType;
  timestamp: number;
  data: any;
  error?: string;
}
```

### 消息類型

- `MCP_REQUEST`: MCP 請求
- `MCP_RESPONSE`: MCP 響應
- `CONNECT`: 連接請求
- `HEARTBEAT`: 心跳消息
- `ERROR`: 錯誤消息

### MCP 請求格式

```json
{
  "jsonrpc": "2.0",
  "id": "request_1",
  "method": "tools/list",
  "params": {
    "name": "tool_name",
    "arguments": {}
  }
}
```

### MCP 響應格式

```json
{
  "jsonrpc": "2.0",
  "id": "request_1",
  "result": {
    "tools": ["tool1", "tool2"]
  }
}
```

## 錯誤處理

### 連接錯誤
- 自動重連機制
- 指數退避策略
- 最大重連次數限制

### 消息錯誤
- JSON 解析錯誤處理
- 格式驗證
- 錯誤響應返回

### 進程錯誤
- 信號處理 (SIGINT, SIGTERM)
- 異常捕獲
- 優雅關閉

## 性能優化

### 連接管理
- 連接池管理
- 超時處理
- 資源清理

### 消息處理
- 消息緩衝
- 批處理支援
- 非阻塞 I/O

### 監控指標
- 連接數量
- 消息吞吐量
- 響應時間
- 錯誤率

## 測試

運行測試套件：

```bash
# 編譯
npm run compile

# 運行測試
node out/websocket/test/websocket-client-test.js
```

測試覆蓋：
- 客戶端創建
- 啟動器功能
- 進程信號處理
- 連接管理
- 消息處理
- 錯誤處理
- 重連機制
- 優雅關閉

## 故障排除

### 常見問題

1. **連接失敗**
   - 檢查 WebSocket URL 是否正確
   - 確認 Extension Server 是否運行
   - 檢查防火牆設置

2. **進程崩潰**
   - 查看錯誤日誌
   - 檢查依賴項版本
   - 驗證配置參數

3. **性能問題**
   - 監控連接數量
   - 檢查消息大小
   - 優化重連策略

### 日誌級別

可以設置環境變數來控制日誌級別：

```bash
export LOG_LEVEL=debug
node out/websocket/websocket-mcp-client.js
```

## 開發指南

### 添加新功能

1. 在相應的類中添加方法
2. 更新接口定義
3. 添加測試用例
4. 更新文檔

### 調試

使用 VS Code 調試器：

1. 設置斷點
2. 啟動調試會話
3. 運行 MCP Client
4. 檢查變數和調用堆疊

### 性能分析

使用 Node.js 內建工具：

```bash
# CPU 分析
node --prof out/websocket/websocket-mcp-client.js

# 記憶體分析
node --inspect out/websocket/websocket-mcp-client.js
```

## 相關文檔

- [WebSocket MCP 架構設計](../.ai/tasks/task9_websocket_architecture_design.md)
- [WebSocket Extension Server 實現](../.ai/tasks/task10_websocket_extension_server.md)
- [WebSocket MCP Client 實現](../.ai/tasks/task11_websocket_mcp_client.md)
- [WebSocket MCP 重構計劃](../.ai/plans/features/websocket-mcp-refactor-plan.md)
