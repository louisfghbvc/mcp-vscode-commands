# API 參考文檔

## 概述

本文檔提供了 MCP VSCode Commands 擴展的完整 API 參考，包括所有可用的命令、配置選項和接口定義。

## 🔌 MCP 協議接口

### 核心 MCP 方法

#### `vscode.executeCommand`

執行 VS Code 命令。

**參數**:
```typescript
interface ExecuteCommandParams {
  command: string;        // 要執行的命令名稱
  args?: any[];          // 命令參數（可選）
}
```

**返回值**:
```typescript
interface ExecuteCommandResult {
  success: boolean;       // 命令是否成功執行
  result?: any;          // 命令執行結果
  error?: string;        // 錯誤信息（如果失敗）
}
```

**範例**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "vscode.executeCommand",
  "params": {
    "command": "editor.action.formatDocument",
    "args": []
  }
}
```

#### `vscode.listCommands`

列出可用的 VS Code 命令。

**參數**:
```typescript
interface ListCommandsParams {
  filter?: string;        // 過濾條件（可選）
}
```

**返回值**:
```typescript
interface ListCommandsResult {
  commands: string[];     // 命令列表
  total: number;         // 總命令數量
}
```

**範例**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "vscode.listCommands",
  "params": {
    "filter": "editor"
  }
}
```

#### `vscode.getWorkspaceInfo`

獲取工作區信息。

**參數**: 無

**返回值**:
```typescript
interface WorkspaceInfo {
  folders: WorkspaceFolder[];
  activeFile?: string;
  language: string;
}
```

**範例**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "vscode.getWorkspaceInfo",
  "params": {}
}
```

## 🛠️ 擴展管理命令

### WebSocket 服務器管理

#### `mcp-vscode-commands.startWebSocket`

啟動 WebSocket MCP 服務器。

**參數**: 無

**返回值**:
```typescript
interface StartWebSocketResult {
  success: boolean;
  port: number;
  message: string;
}
```

**範例**:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "mcp-vscode-commands.startWebSocket",
  "params": {}
}
```

#### `mcp-vscode-commands.stopWebSocket`

停止 WebSocket MCP 服務器。

**參數**: 無

**返回值**:
```typescript
interface StopWebSocketResult {
  success: boolean;
  message: string;
}
```

**範例**:
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "mcp-vscode-commands.stopWebSocket",
  "params": {}
}
```

#### `mcp-vscode-commands.restartWebSocket`

重啟 WebSocket MCP 服務器。

**參數**: 無

**返回值**:
```typescript
interface RestartWebSocketResult {
  success: boolean;
  port: number;
  message: string;
}
```

**範例**:
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "mcp-vscode-commands.restartWebSocket",
  "params": {}
}
```

### 診斷和監控

#### `mcp-vscode-commands.diagnostics`

獲取系統診斷信息。

**參數**:
```typescript
interface DiagnosticsParams {
  detailed?: boolean;     // 是否包含詳細信息
}
```

**返回值**:
```typescript
interface DiagnosticsResult {
  status: SystemStatus;
  websocket: WebSocketStatus;
  stdio: StdioStatus;
  performance: PerformanceMetrics;
  configuration: ExtensionConfig;
}
```

**範例**:
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "mcp-vscode-commands.diagnostics",
  "params": {
    "detailed": true
  }
}
```

## 🔧 配置接口

### 擴展配置

#### 獲取配置

```typescript
interface ExtensionConfig {
  // Stdio 模式配置
  autoStart: boolean;                    // 是否自動啟動 Stdio 服務器
  logLevel: 'info' | 'warn' | 'error' | 'debug';  // 日誌等級
  
  // WebSocket 模式配置
  websocketAutoStart: boolean;           // 是否自動啟動 WebSocket 服務器
  websocketPort: number;                 // WebSocket 服務器端口
  websocketMaxConnections: number;       // 最大連接數
  websocketConnectionTimeout: number;    // 連接超時時間（毫秒）
  
  // 診斷配置
  enableDiagnostics: boolean;            // 是否啟用詳細診斷
}
```

#### 更新配置

```typescript
interface UpdateConfigParams {
  key: keyof ExtensionConfig;
  value: any;
  target?: 'user' | 'workspace' | 'global';
}
```

**範例**:
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "mcp-vscode-commands.updateConfig",
  "params": {
    "key": "websocketPort",
    "value": 19848,
    "target": "global"
  }
}
```

## 📊 狀態和監控接口

### 服務器狀態

#### WebSocket 服務器狀態

```typescript
interface WebSocketStatus {
  isRunning: boolean;                    // 服務器是否運行
  uptime: number;                        // 運行時間（秒）
  port: number;                          // 監聽端口
  clientCount: number;                   // 當前客戶端數量
  maxConnections: number;                // 最大連接數
  totalConnections: number;              // 總連接數
  activeConnections: number;             // 活躍連接數
}
```

#### Stdio 服務器狀態

```typescript
interface StdioStatus {
  isRunning: boolean;                    // 服務器是否運行
  uptime: number;                        // 運行時間（秒）
  bridgePort: number;                    // 橋接端口
  messageCount: number;                  // 處理的消息數量
  errorCount: number;                    // 錯誤數量
}
```

### 性能指標

```typescript
interface PerformanceMetrics {
  messageLatency: number;                // 消息延遲（毫秒）
  connectionTime: number;                // 連接建立時間（毫秒）
  throughput: number;                    // 吞吐量（消息/秒）
  errorRate: number;                     // 錯誤率
  memoryUsage: MemoryUsage;              // 記憶體使用情況
  cpuUsage: number;                      // CPU 使用率
}
```

### 記憶體使用情況

```typescript
interface MemoryUsage {
  heapUsed: number;                      // 堆積使用量（字節）
  heapTotal: number;                     // 堆積總量（字節）
  external: number;                      // 外部記憶體（字節）
  rss: number;                           // 常駐集大小（字節）
}
```

## 🔌 WebSocket 連接接口

### 連接管理

#### 連接統計

```typescript
interface ConnectionStats {
  totalConnections: number;              // 總連接數
  activeConnections: number;             // 活躍連接數
  failedConnections: number;             // 失敗連接數
  averageLatency: number;                // 平均延遲（毫秒）
  errorRate: number;                     // 錯誤率
}
```

#### 連接健康狀態

```typescript
interface ConnectionHealth {
  isAlive: boolean;                      // 連接是否活躍
  lastMessageTime: number;               // 最後消息時間
  messageCount: number;                  // 消息數量
  errorCount: number;                    // 錯誤數量
  latency: number;                       // 當前延遲（毫秒）
}
```

## 📝 錯誤處理

### 錯誤代碼

```typescript
enum ErrorCodes {
  // 通用錯誤
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
  
  // 自定義錯誤
  COMMAND_EXECUTION_FAILED = -32001,
  CONNECTION_FAILED = -32002,
  CONFIGURATION_ERROR = -32003,
  PERMISSION_DENIED = -32004,
  RESOURCE_NOT_FOUND = -32005,
  TIMEOUT = -32006,
  RATE_LIMIT_EXCEEDED = -32007
}
```

### 錯誤響應格式

```typescript
interface ErrorResponse {
  jsonrpc: "2.0";
  id: string | number;
  error: {
    code: number;
    message: string;
    data?: {
      details?: string;
      suggestion?: string;
      retryAfter?: number;
    };
  };
}
```

**範例**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32001,
    "message": "Command execution failed",
    "data": {
      "details": "The command 'invalid.command' does not exist",
      "suggestion": "Use 'mcp-vscode-commands.diagnostics' to list available commands"
    }
  }
}
```

## 🔄 事件和通知

### 系統事件

#### 服務器狀態變化

```typescript
interface ServerStatusChangeNotification {
  jsonrpc: "2.0";
  method: "server.statusChanged";
  params: {
    type: 'started' | 'stopped' | 'restarted';
    timestamp: number;
    details: WebSocketStatus | StdioStatus;
  };
}
```

#### 連接事件

```typescript
interface ConnectionEventNotification {
  jsonrpc: "2.0";
  method: "connection.event";
  params: {
    type: 'connected' | 'disconnected' | 'error';
    connectionId: string;
    timestamp: number;
    details?: any;
  };
}
```

#### 性能警告

```typescript
interface PerformanceWarningNotification {
  jsonrpc: "2.0";
  method: "performance.warning";
  params: {
    type: 'high_memory' | 'high_cpu' | 'high_latency';
    severity: 'low' | 'medium' | 'high';
    message: string;
    metrics: PerformanceMetrics;
  };
}
```

## 📋 使用範例

### 完整的命令執行流程

```json
// 1. 啟動 WebSocket 服務器
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "mcp-vscode-commands.startWebSocket",
  "params": {}
}

// 2. 執行 VS Code 命令
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "vscode.executeCommand",
  "params": {
    "command": "editor.action.formatDocument",
    "args": []
  }
}

// 3. 獲取診斷信息
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "mcp-vscode-commands.diagnostics",
  "params": {
    "detailed": true
  }
}

// 4. 停止 WebSocket 服務器
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "mcp-vscode-commands.stopWebSocket",
  "params": {}
}
```

### 錯誤處理範例

```json
// 處理命令執行錯誤
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "vscode.executeCommand",
  "params": {
    "command": "nonexistent.command",
    "args": []
  }
}

// 錯誤響應
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32001,
    "message": "Command execution failed",
    "data": {
      "details": "The command 'nonexistent.command' does not exist",
      "suggestion": "Use 'mcp-vscode-commands.diagnostics' to list available commands"
    }
  }
}
```

## 🔗 相關文檔

- [架構文檔](./architecture.md)
- [配置指南](./configuration.md)
- [故障排除](./troubleshooting.md)
- [開發者指南](./developer-guide.md)
