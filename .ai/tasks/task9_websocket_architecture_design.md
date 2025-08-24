---
id: 9
title: 'WebSocket 架構設計'
status: completed
implementation_status: fully_implemented
priority: Critical
feature: WebSocket MCP Refactor
dependencies: []
assigned_agent: AI Agent
created_at: "2025-01-27T00:00:00Z"
started_at: "2025-08-24T14:09:43Z"
completed_at: "2025-08-24T14:18:33Z"
implementation_detailed_at: "2025-08-24T14:09:43Z"
error_log: null
---

# Task 9: WebSocket 架構設計

## 任務概述

設計新的 WebSocket MCP 架構，從當前的 TCP 橋接模式轉換為 WebSocket 通信模式。

## 任務詳情

### 目標
- 設計 WebSocket 通信協議
- 定義架構組件和接口
- 創建技術架構文檔
- 設計錯誤處理和重連機制

### 技術要求
- **架構模式**: Extension 作為 WebSocket Server，MCP Server 作為 Client
- **通信協議**: JSON-RPC 2.0 over WebSocket
- **進程管理**: 獨立進程啟動和監控
- **錯誤處理**: 自動重連、故障轉移、健康檢查

### 交付物
- [ ] WebSocket 協議規範文檔
- [ ] 架構圖和組件設計
- [ ] 接口定義和數據流圖
- [ ] 錯誤處理策略文檔

## 實施步驟

### 步驟 1: 協議設計
- 定義 WebSocket 消息格式
- 設計 JSON-RPC 2.0 協議映射
- 定義工具調用和響應格式
- 設計心跳和連接管理機制

### 步驟 2: 架構設計
- 設計 Extension WebSocket Server
- 設計 MCP Client 進程
- 定義進程間通信接口
- 設計資源管理和清理機制

### 步驟 3: 錯誤處理設計
- 設計連接斷開處理
- 設計自動重連機制
- 設計進程崩潰恢復
- 設計錯誤通知和日誌

### 步驟 4: 性能優化設計
- 設計連接池管理
- 設計消息緩衝和批處理
- 設計記憶體使用優化
- 設計監控和診斷機制

## 技術考慮

### 依賴關係
- 需要 WebSocket 庫 (ws)
- 需要進程管理 (child_process)
- 需要錯誤處理和日誌系統

### 風險評估
- **高風險**: WebSocket 連接穩定性
- **中風險**: 進程間通信錯誤處理
- **低風險**: 性能開銷增加

### 測試策略
- 協議兼容性測試
- 連接穩定性測試
- 錯誤恢復測試
- 性能基準測試

## 驗收標準

- [ ] WebSocket 協議文檔完整且清晰
- [ ] 架構設計符合可擴展性要求
- [ ] 錯誤處理策略覆蓋所有邊界情況
- [ ] 性能指標滿足要求 (< 10ms 延遲)
- [ ] 文檔通過技術審查

## 時間估計

**估計時間**: 3-5 天
**優先級**: Critical
**依賴關係**: 無前置依賴

## 相關資源

- [WebSocket MCP 重構計劃](../plans/features/websocket-mcp-refactor-plan.md)
- [Model Context Protocol 規範](https://modelcontextprotocol.io/)
- [WebSocket API 文檔](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 實現細節

### WebSocket 協議規範

#### 1. 消息格式
```typescript
// WebSocket 消息基礎結構
interface WebSocketMessage {
  id: string;           // 唯一標識符
  type: MessageType;    // 消息類型
  timestamp: number;    // 時間戳
  data: any;           // 消息數據
  error?: string;      // 錯誤信息（可選）
}

enum MessageType {
  // MCP 協議消息
  MCP_REQUEST = 'mcp_request',
  MCP_RESPONSE = 'mcp_response',
  MCP_NOTIFICATION = 'mcp_notification',
  
  // 連接管理
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  RECONNECT = 'reconnect',
  
  // 錯誤處理
  ERROR = 'error',
  RETRY = 'retry'
}
```

#### 2. JSON-RPC 2.0 協議映射
```typescript
// MCP 請求格式
interface MCPRequest {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

// MCP 響應格式
interface MCPResponse {
  jsonrpc: "2.0";
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

#### 3. 工具調用格式
```typescript
// 工具調用請求
interface ToolCallRequest {
  name: string;
  arguments: Record<string, any>;
  timeout?: number;
}

// 工具調用響應
interface ToolCallResponse {
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: string;
  }>;
  isError: boolean;
  errorMessage?: string;
}
```

### 架構組件設計

#### 1. Extension WebSocket Server
```typescript
// src/websocket/websocket-server.ts
export class WebSocketServer {
  private wss: WebSocket.Server;
  private clients: Map<string, WebSocketClient>;
  private mcpServer: MCPServer;
  
  constructor(port: number = 19847) {
    this.wss = new WebSocket.Server({ port });
    this.clients = new Map();
    this.setupWebSocketServer();
  }
  
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = this.generateClientId();
      const client = new WebSocketClient(clientId, ws);
      
      this.clients.set(clientId, client);
      this.handleClientConnection(client);
    });
  }
  
  private handleClientConnection(client: WebSocketClient): void {
    client.on('message', async (data: string) => {
      try {
        const message = JSON.parse(data);
        await this.processMCPMessage(client, message);
      } catch (error) {
        this.sendError(client, 'Invalid message format', error);
      }
    });
    
    client.on('close', () => {
      this.clients.delete(client.id);
    });
  }
  
  private async processMCPMessage(client: WebSocketClient, message: any): Promise<void> {
    switch (message.type) {
      case MessageType.MCP_REQUEST:
        await this.handleMCPRequest(client, message);
        break;
      case MessageType.HEARTBEAT:
        this.sendHeartbeat(client);
        break;
      default:
        this.sendError(client, 'Unknown message type', message);
    }
  }
}
```

#### 2. MCP Server 進程
```typescript
// src/websocket/mcp-server-process.ts
export class MCPServerProcess {
  private process: ChildProcess | null = null;
  private websocketClient: WebSocketClient | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  async start(): Promise<void> {
    try {
      // 啟動 MCP 服務器進程
      this.process = spawn('node', ['dist/mcp-server.js'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, WEBSOCKET_MODE: 'true' }
      });
      
      // 連接到 Extension WebSocket Server
      await this.connectToExtension();
      
      // 設置進程監控
      this.setupProcessMonitoring();
      
    } catch (error) {
      console.error('Failed to start MCP server process:', error);
      throw error;
    }
  }
  
  private async connectToExtension(): Promise<void> {
    this.websocketClient = new WebSocketClient('ws://localhost:19847');
    
    this.websocketClient.on('open', () => {
      console.log('Connected to Extension WebSocket Server');
      this.reconnectAttempts = 0;
    });
    
    this.websocketClient.on('close', () => {
      this.handleDisconnection();
    });
    
    this.websocketClient.on('error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleDisconnection();
    });
  }
  
  private handleDisconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        this.connectToExtension();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      process.exit(1);
    }
  }
}
```

#### 3. 進程間通信接口
```typescript
// src/websocket/interfaces/communication.ts
export interface ProcessCommunication {
  // 啟動 MCP 服務器進程
  startMCPServer(): Promise<void>;
  
  // 停止 MCP 服務器進程
  stopMCPServer(): Promise<void>;
  
  // 發送消息到 MCP 服務器
  sendMessage(message: WebSocketMessage): Promise<void>;
  
  // 接收來自 MCP 服務器的消息
  onMessage(callback: (message: WebSocketMessage) => void): void;
  
  // 檢查進程健康狀態
  checkHealth(): Promise<HealthStatus>;
}

export interface HealthStatus {
  isAlive: boolean;
  uptime: number;
  memoryUsage: number;
  lastHeartbeat: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}
```

### 錯誤處理和重連機制

#### 1. 連接斷開處理
```typescript
// src/websocket/error-handling/connection-manager.ts
export class ConnectionManager {
  private reconnectStrategy: ReconnectStrategy;
  private healthChecker: HealthChecker;
  
  async handleDisconnection(reason: string): Promise<void> {
    console.log(`Connection lost: ${reason}`);
    
    // 記錄斷開原因
    this.logDisconnection(reason);
    
    // 啟動重連策略
    await this.reconnectStrategy.startReconnection();
    
    // 更新健康狀態
    this.healthChecker.updateStatus('disconnected');
  }
  
  async handleReconnection(): Promise<void> {
    try {
      await this.reconnectStrategy.executeReconnection();
      this.healthChecker.updateStatus('connected');
      console.log('Successfully reconnected');
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.healthChecker.updateStatus('reconnecting');
    }
  }
}
```

#### 2. 自動重連機制
```typescript
// src/websocket/error-handling/reconnect-strategy.ts
export class ReconnectStrategy {
  private baseDelay = 1000; // 1 second
  private maxDelay = 30000; // 30 seconds
  private maxAttempts = 10;
  
  async startReconnection(): Promise<void> {
    let attempt = 0;
    
    while (attempt < this.maxAttempts) {
      try {
        await this.attemptReconnection();
        return; // 成功重連
      } catch (error) {
        attempt++;
        const delay = this.calculateDelay(attempt);
        
        console.log(`Reconnection attempt ${attempt} failed, retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    throw new Error('Max reconnection attempts reached');
  }
  
  private calculateDelay(attempt: number): number {
    // 指數退避策略
    const delay = this.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.maxDelay);
  }
}
```

#### 3. 進程崩潰恢復
```typescript
// src/websocket/process-management/process-manager.ts
export class ProcessManager {
  private process: ChildProcess | null = null;
  private restartAttempts = 0;
  private maxRestartAttempts = 3;
  
  async handleProcessCrash(exitCode: number, signal: string): Promise<void> {
    console.error(`MCP Server process crashed: exit code ${exitCode}, signal ${signal}`);
    
    if (this.restartAttempts < this.maxRestartAttempts) {
      this.restartAttempts++;
      console.log(`Attempting to restart process (attempt ${this.restartAttempts})`);
      
      await this.restartProcess();
    } else {
      console.error('Max restart attempts reached, stopping recovery');
      throw new Error('Process recovery failed');
    }
  }
  
  private async restartProcess(): Promise<void> {
    try {
      // 清理舊進程
      if (this.process) {
        this.process.removeAllListeners();
        this.process = null;
      }
      
      // 等待一段時間再重啟
      await this.sleep(2000);
      
      // 重新啟動進程
      await this.startProcess();
      
    } catch (error) {
      console.error('Process restart failed:', error);
      throw error;
    }
  }
}
```

### 性能優化設計

#### 1. 連接池管理
```typescript
// src/websocket/performance/connection-pool.ts
export class ConnectionPool {
  private connections: Map<string, WebSocketClient> = new Map();
  private maxConnections = 10;
  private connectionTimeout = 30000; // 30 seconds
  
  async getConnection(): Promise<WebSocketClient> {
    // 檢查是否有可用的連接
    for (const [id, connection] of this.connections) {
      if (connection.isAvailable()) {
        return connection;
      }
    }
    
    // 創建新連接
    if (this.connections.size < this.maxConnections) {
      const connection = await this.createConnection();
      this.connections.set(connection.id, connection);
      return connection;
    }
    
    // 等待可用連接
    return this.waitForAvailableConnection();
  }
  
  private async waitForAvailableConnection(): Promise<WebSocketClient> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        for (const [id, connection] of this.connections) {
          if (connection.isAvailable()) {
            clearInterval(checkInterval);
            resolve(connection);
            return;
          }
        }
      }, 100);
      
      // 設置超時
      setTimeout(() => {
        clearInterval(checkInterval);
        throw new Error('Connection pool timeout');
      }, this.connectionTimeout);
    });
  }
}
```

#### 2. 消息緩衝和批處理
```typescript
// src/websocket/performance/message-buffer.ts
export class MessageBuffer {
  private buffer: WebSocketMessage[] = [];
  private maxBufferSize = 100;
  private flushInterval = 100; // 100ms
  
  constructor() {
    this.startFlushTimer();
  }
  
  addMessage(message: WebSocketMessage): void {
    this.buffer.push(message);
    
    // 如果緩衝區滿了，立即刷新
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }
  
  private startFlushTimer(): void {
    setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }
  
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const messages = [...this.buffer];
    this.buffer = [];
    
    // 批量發送消息
    await this.sendBatch(messages);
  }
  
  private async sendBatch(messages: WebSocketMessage[]): Promise<void> {
    // 實現批量發送邏輯
    console.log(`Sending batch of ${messages.length} messages`);
  }
}
```

### 監控和診斷機制

#### 1. 性能指標收集
```typescript
// src/websocket/monitoring/performance-metrics.ts
export class PerformanceMetrics {
  private metrics: Map<string, MetricValue> = new Map();
  
  recordMetric(name: string, value: number, timestamp: number = Date.now()): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push({ value, timestamp });
    
    // 保持最近 1000 個數據點
    const values = this.metrics.get(name)!;
    if (values.length > 1000) {
      values.splice(0, values.length - 1000);
    }
  }
  
  getMetric(name: string): MetricValue {
    return this.metrics.get(name) || [];
  }
  
  getAverage(name: string): number {
    const values = this.getMetric(name);
    if (values.length === 0) return 0;
    
    const sum = values.reduce((acc, val) => acc + val.value, 0);
    return sum / values.length;
  }
  
  getLatency(): number {
    // 計算平均延遲
    return this.getAverage('message_latency');
  }
}

interface MetricValue {
  value: number;
  timestamp: number;
}
```

#### 2. 健康檢查系統
```typescript
// src/websocket/monitoring/health-checker.ts
export class HealthChecker {
  private checks: HealthCheck[] = [];
  private status: HealthStatus = 'healthy';
  
  addCheck(check: HealthCheck): void {
    this.checks.push(check);
  }
  
  async runHealthChecks(): Promise<HealthReport> {
    const results: HealthCheckResult[] = [];
    
    for (const check of this.checks) {
      try {
        const result = await check.execute();
        results.push(result);
        
        if (!result.healthy) {
          this.status = 'unhealthy';
        }
      } catch (error) {
        results.push({
          name: check.name,
          healthy: false,
          error: error instanceof Error ? error.message : String(error),
          duration: 0
        });
        this.status = 'unhealthy';
      }
    }
    
    return {
      status: this.status,
      timestamp: Date.now(),
      checks: results,
      summary: this.generateSummary(results)
    };
  }
  
  private generateSummary(results: HealthCheckResult[]): HealthSummary {
    const total = results.length;
    const healthy = results.filter(r => r.healthy).length;
    const unhealthy = total - healthy;
    
    return {
      total,
      healthy,
      unhealthy,
      healthPercentage: (healthy / total) * 100
    };
  }
}

interface HealthCheck {
  name: string;
  execute(): Promise<HealthCheckResult>;
}

interface HealthCheckResult {
  name: string;
  healthy: boolean;
  error?: string;
  duration: number;
}
```

### 文件修改清單

1. **新增文件**:
   - `src/websocket/websocket-server.ts` - WebSocket 服務器實現
   - `src/websocket/mcp-server-process.ts` - MCP 服務器進程管理
   - `src/websocket/interfaces/communication.ts` - 通信接口定義
   - `src/websocket/error-handling/connection-manager.ts` - 連接管理
   - `src/websocket/error-handling/reconnect-strategy.ts` - 重連策略
   - `src/websocket/process-management/process-manager.ts` - 進程管理
   - `src/websocket/performance/connection-pool.ts` - 連接池
   - `src/websocket/performance/message-buffer.ts` - 消息緩衝
   - `src/websocket/monitoring/performance-metrics.ts` - 性能指標
   - `src/websocket/monitoring/health-checker.ts` - 健康檢查

2. **修改文件**:
   - `src/extension.ts` - 集成 WebSocket 服務器
   - `package.json` - 添加 WebSocket 依賴
   - `tsconfig.json` - 更新編譯配置

3. **配置更新**:
   - 添加 WebSocket 端口配置
   - 添加重連策略配置
   - 添加性能監控配置
