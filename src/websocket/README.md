# WebSocket MCP 架構

## 概述

這個目錄包含了 MCP VSCode Commands 擴展的 WebSocket 架構實現。新的架構將從基於 TCP 橋接的模式轉換為使用 WebSocket 通信的現代化架構。

## 架構組件

### 1. WebSocket Server (`websocket-server.ts`)

**功能**: 運行在 VS Code Extension 中，作為 WebSocket Server 處理來自 MCP Client 進程的連接和消息。

**主要特性**:
- 監聽 WebSocket 連接（默認端口 19847）
- 處理 MCP 協議消息
- 管理客戶端連接
- 實現心跳機制
- 錯誤處理和日誌記錄

**使用方式**:
```typescript
import { WebSocketServer } from './websocket/websocket-server';

const server = new WebSocketServer(19847);
// 服務器會自動開始監聽連接
```

### 2. MCP Server Process (`mcp-server-process.ts`)

**功能**: 管理獨立的 MCP 服務器進程，該進程作為 WebSocket Client 連接到 Extension 的 WebSocket Server。

**主要特性**:
- 進程生命週期管理（啟動、停止、重啟）
- 自動重連機制
- 進程健康監控
- 錯誤恢復策略

**使用方式**:
```typescript
import { MCPServerProcess } from './websocket/mcp-server-process';

const process = new MCPServerProcess();
await process.start();
```

### 3. 通信接口 (`interfaces/communication.ts`)

**功能**: 定義 Extension 和 MCP Server 進程之間的通信協議接口。

**包含接口**:
- `ProcessCommunication`: 進程間通信
- `HealthStatus`: 健康狀態
- `ConnectionStats`: 連接統計
- `ToolCallRequest/Response`: 工具調用
- `ErrorHandler`: 錯誤處理
- `ReconnectStrategy`: 重連策略
- `PerformanceMonitor`: 性能監控

### 4. 錯誤處理 (`error-handling/`)

**功能**: 實現錯誤處理和重連機制。

**組件**:
- `ConnectionManager`: 連接管理器
- `ReconnectStrategy`: 重連策略實現

### 5. 性能監控 (`monitoring/`)

**功能**: 收集和追蹤 WebSocket 通信的性能指標。

**組件**:
- `PerformanceMetrics`: 性能指標收集器
- `HealthChecker`: 健康檢查系統

## 通信流程

### 1. 啟動流程
```
Extension 啟動 → 啟動 WebSocket Server → 啟動 MCP Server 進程 → MCP Server 連接到 WebSocket Server
```

### 2. 消息流程
```
Cursor → MCP Server 進程 → WebSocket → Extension → 執行 VSCode 命令 → 返回結果
```

### 3. 錯誤處理流程
```
連接斷開 → 檢測錯誤 → 啟動重連策略 → 嘗試重連 → 恢復連接或重啟進程
```

## 配置選項

### WebSocket 服務器配置
```typescript
interface WebSocketConfig {
  server: {
    port: number;        // 默認: 19847
    host: string;        // 默認: localhost
    path: string;        // 默認: /
  };
  connection: {
    timeout: number;     // 默認: 10000ms
    maxRetries: number;  // 默認: 5
    retryDelay: number;  // 默認: 1000ms
    heartbeatInterval: number; // 默認: 30000ms
  };
  performance: {
    maxConnections: number;     // 默認: 10
    messageBufferSize: number;  // 默認: 100
    flushInterval: number;      // 默認: 100ms
  };
}
```

## 性能指標

系統會自動收集以下性能指標：

- **延遲**: 消息處理延遲
- **吞吐量**: 每秒處理的消息數
- **錯誤率**: 錯誤消息的比例
- **連接數**: 活躍連接數量
- **記憶體使用**: 記憶體消耗
- **CPU 使用率**: CPU 使用情況

## 錯誤處理策略

### 1. 連接斷開
- 自動檢測連接狀態
- 指數退避重連策略
- 最大重連嘗試次數限制

### 2. 進程崩潰
- 自動檢測進程退出
- 自動重啟進程
- 最大重啟嘗試次數限制

### 3. 消息處理錯誤
- 錯誤日誌記錄
- 錯誤響應返回
- 不影響其他消息處理

## 安全考慮

### 1. 連接驗證
- 客戶端身份驗證
- 連接來源限制
- 消息大小限制

### 2. 錯誤隔離
- 進程級別隔離
- 連接級別隔離
- 錯誤不會影響整個系統

## 監控和診斷

### 1. 健康檢查
- 定期健康狀態檢查
- 自動故障檢測
- 性能指標收集

### 2. 日誌記錄
- 結構化日誌格式
- 不同級別的日誌
- 日誌輪轉和清理

### 3. 診斷工具
- 連接狀態查詢
- 性能報告生成
- 錯誤分析工具

## 使用示例

### 基本使用
```typescript
import { WebSocketServer } from './websocket/websocket-server';
import { MCPServerProcess } from './websocket/mcp-server-process';

// 啟動 WebSocket 服務器
const server = new WebSocketServer(19847);

// 啟動 MCP 服務器進程
const mcpProcess = new MCPServerProcess();
await mcpProcess.start();

// 檢查健康狀態
const isHealthy = mcpProcess.isHealthy();
console.log('MCP Process healthy:', isHealthy);
```

### 性能監控
```typescript
import { PerformanceMetrics } from './websocket/monitoring/performance-metrics';

const metrics = new PerformanceMetrics();

// 記錄性能指標
metrics.recordMetric('message_latency', 150);
metrics.recordMetric('messages_per_second', 100);

// 獲取性能報告
const report = metrics.getPerformanceReport();
console.log('Performance report:', report);
```

## 故障排除

### 常見問題

1. **連接失敗**
   - 檢查端口是否被佔用
   - 確認防火牆設置
   - 檢查網絡連接

2. **進程啟動失敗**
   - 檢查 Node.js 版本
   - 確認腳本路徑正確
   - 檢查環境變量設置

3. **性能問題**
   - 監控記憶體使用
   - 檢查 CPU 使用率
   - 分析延遲指標

### 調試模式

設置環境變量啟用調試模式：
```bash
export NODE_ENV=development
export DEBUG=websocket:*
```

## 未來改進

1. **負載均衡**: 支援多個 MCP 服務器進程
2. **集群模式**: 支援多節點部署
3. **安全增強**: 添加 TLS 加密和身份驗證
4. **監控儀表板**: Web 界面監控系統狀態
5. **自動擴展**: 根據負載自動調整進程數量
