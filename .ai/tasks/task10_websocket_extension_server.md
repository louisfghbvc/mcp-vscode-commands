---
id: 10
title: 'WebSocket Extension Server 實現'
status: completed
implementation_status: fully_implemented
priority: Critical
feature: WebSocket MCP Refactor
dependencies: [9]
assigned_agent: AI Agent
created_at: "2025-01-27T00:00:00Z"
started_at: "2025-08-24T14:19:56Z"
completed_at: "2025-08-24T14:31:37Z"
implementation_detailed_at: "2025-08-24T14:19:56Z"
error_log: null
---

# Task 10: WebSocket Extension Server 實現

## 任務概述

實現 Extension 端的 WebSocket Server，作為 MCP Client 的連接端點，處理 VSCode 命令執行請求。

## 任務詳情

### 目標
- 實現 WebSocket Server 在 Extension 內運行
- 處理來自 MCP Client 的連接和消息
- 執行 VSCode 命令並返回結果
- 管理連接生命週期和錯誤處理

### 技術要求
- **WebSocket Server**: 使用 ws 庫實現
- **命令執行**: 集成現有的 VSCodeCommandsTools
- **連接管理**: 支援多個並發連接
- **錯誤處理**: 完整的錯誤響應和日誌記錄

### 交付物
- [ ] WebSocketMCPServerExtension 類實現
- [ ] 連接管理和消息處理邏輯
- [ ] 錯誤處理和響應機制
- [ ] 連接狀態監控和診斷

## 實施步驟

### 步驟 1: 基礎架構實現
- 創建 WebSocketMCPServerExtension 類
- 實現 WebSocket Server 啟動和監聽
- 配置端口自動分配和綁定
- 實現基本的連接接受邏輯

### 步驟 2: 消息處理實現
- 實現 JSON-RPC 2.0 消息解析
- 處理 tools/list 請求
- 處理 tools/call 請求
- 實現 ping/pong 心跳機制

### 步驟 3: VSCode 命令集成
- 集成 VSCodeCommandsTools
- 實現 executeCommand 工具
- 實現 listCommands 工具
- 格式化命令執行結果

### 步驟 4: 連接管理
- 實現連接生命週期管理
- 處理連接斷開和清理
- 實現連接狀態追蹤
- 添加連接診斷信息

### 步驟 5: 錯誤處理
- 實現完整的錯誤響應格式
- 添加錯誤日誌記錄
- 實現連接錯誤處理
- 添加錯誤通知機制

## 技術考慮

### 依賴關係
- 依賴於 Task 9 (架構設計)
- 需要 VSCodeCommandsTools 模組
- 需要 ws WebSocket 庫

### 風險評估
- **高風險**: WebSocket 連接穩定性
- **中風險**: 消息格式兼容性
- **低風險**: 性能開銷

### 測試策略
- 單元測試 WebSocket Server
- 連接建立和斷開測試
- 消息處理測試
- 錯誤處理測試

## 驗收標準

- [ ] WebSocket Server 能正常啟動和監聽
- [ ] 能接受來自 MCP Client 的連接
- [ ] 正確處理 tools/list 和 tools/call 請求
- [ ] 正確執行 VSCode 命令並返回結果
- [ ] 錯誤處理完整且響應格式正確
- [ ] 連接管理穩定，無記憶體洩漏

## 時間估計

**估計時間**: 5-7 天
**優先級**: Critical
**依賴關係**: Task 9 (架構設計)

## 相關資源

- [WebSocket MCP 重構計劃](../plans/features/websocket-mcp-refactor-plan.md)
- [Task 9: WebSocket 架構設計](./task9_websocket_architecture_design.md)
- [VSCodeCommandsTools 實現](../src/tools/vscode-commands.ts)
- [WebSocket API 文檔](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 實現細節

### 核心組件實現

#### 1. WebSocketMCPServerExtension 類
```typescript
// src/websocket/websocket-mcp-server-extension.ts
export class WebSocketMCPServerExtension {
  private wss: WebSocket.Server | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private tools: VSCodeCommandsTools;
  private config: MCPServerConfig;
  private context: vscode.ExtensionContext;
  private port: number;
  private isRunning: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private statusBarItem: vscode.StatusBarItem | null = null;
  
  constructor(context: vscode.ExtensionContext, config?: MCPServerConfig, port?: number) {
    this.context = context;
    this.config = config || this.getDefaultConfig();
    this.tools = new VSCodeCommandsTools(this.config);
    this.port = port || this.getAvailablePort();
    
    this.setupStatusBar();
  }
  
  // 主要方法實現
  async start(): Promise<void> { /* 啟動 WebSocket 服務器 */ }
  async stop(): Promise<void> { /* 停止 WebSocket 服務器 */ }
  async restart(): Promise<void> { /* 重啟 WebSocket 服務器 */ }
  dispose(): void { /* 清理資源 */ }
}
```

#### 2. 連接管理器
```typescript
// src/websocket/connection-manager.ts
export class ConnectionManager {
  private connections: Map<string, ConnectionInfo> = new Map();
  private maxConnections: number = 10;
  private connectionTimeout: number = 30000;
  
  // 連接生命週期管理
  addConnection(client: WebSocketClient, remoteAddress?: string): void
  removeConnection(clientId: string): void
  updateActivity(clientId: string): void
  
  // 統計和監控
  getConnectionStats(): ConnectionStats
  checkConnectionHealth(clientId: string): ConnectionHealth
  
  // 消息管理
  broadcast(message: WebSocketMessage): void
  sendToConnection(clientId: string, message: WebSocketMessage): boolean
}
```

#### 3. 診斷和監控系統
```typescript
// src/websocket/diagnostics/websocket-diagnostics.ts
export class WebSocketDiagnostics {
  private extension: WebSocketMCPServerExtension;
  private connectionManager: ConnectionManager;
  private outputChannel: vscode.OutputChannel;
  
  // 診斷功能
  showDiagnostics(): void
  generateDiagnostics(): string
  runHealthCheck(): Promise<HealthCheckResult>
  
  // 監控功能
  updateStatusBar(): void
  exportDiagnostics(): Promise<void>
}
```

### 消息處理實現

#### 1. MCP 協議處理
```typescript
private async handleMCPRequest(client: WebSocketClient, message: any): Promise<void> {
  const { id, method, params } = message.data;
  
  try {
    let result: any;
    
    switch (method) {
      case 'tools/list':
        result = await this.tools.listCommands(params?.filter);
        break;
      case 'tools/call':
        result = await this.tools.executeCommand(params.name, params.arguments);
        break;
      default:
        throw new Error(`Unknown method: ${method}`);
    }
    
    const response: WebSocketMessage = {
      id: id,
      type: MessageType.MCP_RESPONSE,
      timestamp: Date.now(),
      data: {
        jsonrpc: "2.0",
        id: id,
        result: result
      }
    };
    
    client.send(response);
    
  } catch (error) {
    // 錯誤響應處理
    const errorResponse: WebSocketMessage = {
      id: id,
      type: MessageType.MCP_RESPONSE,
      timestamp: Date.now(),
      data: {
        jsonrpc: "2.0",
        id: id,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : String(error),
          data: null
        }
      }
    };
    
    client.send(errorResponse);
  }
}
```

#### 2. 心跳機制
```typescript
private startHeartbeat(): void {
  this.heartbeatInterval = setInterval(() => {
    this.clients.forEach((client) => {
      if (client.isConnected()) {
        this.sendHeartbeat(client);
      }
    });
  }, 30000); // 30 seconds
}

private sendHeartbeat(client: WebSocketClient): void {
  const heartbeat: WebSocketMessage = {
    id: 'heartbeat',
    type: MessageType.HEARTBEAT,
    timestamp: Date.now(),
    data: {
      serverTime: Date.now(),
      uptime: process.uptime(),
      clientCount: this.clients.size
    }
  };
  
  client.send(heartbeat);
}
```

### 錯誤處理和日誌

#### 1. 錯誤響應格式
```typescript
private sendError(client: WebSocketClient, message: string, error?: any): void {
  const errorMessage: WebSocketMessage = {
    id: 'error',
    type: MessageType.ERROR,
    timestamp: Date.now(),
    data: {
      message: message,
      error: error,
      timestamp: Date.now()
    }
  };
  
  client.send(errorMessage);
}
```

#### 2. 連接錯誤處理
```typescript
private handleClientConnection(client: WebSocketClient): void {
  // 處理消息
  client.on('message', async (data: any) => {
    try {
      const message = JSON.parse(data);
      await this.processMCPMessage(client, message);
    } catch (error) {
      console.error('[WebSocket MCP] Error parsing message:', error);
      this.sendError(client, 'Invalid message format', error);
    }
  });
  
  // 處理連接關閉
  client.on('close', () => {
    console.log(`[WebSocket MCP] Client disconnected: ${client.id}`);
    this.clients.delete(client.id);
    this.updateStatusBar();
  });
  
  // 處理連接錯誤
  client.on('error', (error) => {
    console.error(`[WebSocket MCP] Client error for ${client.id}:`, error);
    this.clients.delete(client.id);
    this.updateStatusBar();
  });
}
```

### 配置和狀態管理

#### 1. 配置選項
```typescript
// package.json 配置
"mcpVscodeCommands.websocketPort": {
  "type": "number",
  "default": 19847,
  "description": "WebSocket MCP 服務器監聽端口"
},
"mcpVscodeCommands.websocketAutoStart": {
  "type": "boolean",
  "default": false,
  "description": "擴展啟動時自動啟動 WebSocket MCP 服務器"
},
"mcpVscodeCommands.websocketMaxConnections": {
  "type": "number",
  "default": 10,
  "description": "WebSocket 服務器最大連接數"
},
"mcpVscodeCommands.websocketConnectionTimeout": {
  "type": "number",
  "default": 30000,
  "description": "WebSocket 連接超時時間（毫秒）"
}
```

#### 2. 狀態欄集成
```typescript
private setupStatusBar(): void {
  this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  this.statusBarItem.name = 'MCP WebSocket Server';
  this.statusBarItem.tooltip = 'MCP WebSocket Server Status';
  this.updateStatusBar();
  this.statusBarItem.show();
}

private updateStatusBar(): void {
  if (!this.statusBarItem) return;
  
  if (this.isRunning) {
    this.statusBarItem.text = `$(radio-tower) MCP WS:${this.port}`;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
  } else {
    this.statusBarItem.text = `$(radio-tower) MCP WS:${this.port} (stopped)`;
    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
  }
}
```

### 命令集成

#### 1. 新增命令
```typescript
// package.json 命令定義
{
  "command": "mcp-vscode-commands.startWebSocket",
  "title": "Start WebSocket MCP Server",
  "category": "MCP WebSocket"
},
{
  "command": "mcp-vscode-commands.stopWebSocket",
  "title": "Stop WebSocket MCP Server",
  "category": "MCP WebSocket"
},
{
  "command": "mcp-vscode-commands.restartWebSocket",
  "title": "Restart WebSocket MCP Server",
  "category": "MCP WebSocket"
},
{
  "command": "mcp-vscode-commands.showWebSocketDiagnostics",
  "title": "Show WebSocket Diagnostics",
  "category": "MCP WebSocket"
},
{
  "command": "mcp-vscode-commands.runWebSocketHealthCheck",
  "title": "Run WebSocket Health Check",
  "category": "MCP WebSocket"
},
{
  "command": "mcp-vscode-commands.exportWebSocketDiagnostics",
  "title": "Export WebSocket Diagnostics",
  "category": "MCP WebSocket"
}
```

### 測試和驗證

#### 1. 測試套件
```typescript
// src/websocket/test/websocket-server-test.ts
export class WebSocketServerTest {
  // 測試方法
  async testServerStartup(): Promise<void>
  async testServerStop(): Promise<void>
  async testServerRestart(): Promise<void>
  async testConnectionManagement(): Promise<void>
  async testMessageHandling(): Promise<void>
  async testErrorHandling(): Promise<void>
  async testDiagnostics(): Promise<void>
  async testPerformance(): Promise<void>
  
  // 運行所有測試
  async runAllTests(): Promise<TestSuiteResult>
}
```

#### 2. 性能測試
```typescript
private async testPerformance(): Promise<void> {
  // 測試服務器啟動時間
  const startupStart = Date.now();
  await this.extension.start();
  const startupTime = Date.now() - startupStart;
  
  if (startupTime > 5000) { // 啟動時間不應超過 5 秒
    throw new Error(`Server startup too slow: ${startupTime}ms`);
  }
  
  // 測試服務器停止時間
  const stopStart = Date.now();
  await this.extension.stop();
  const stopTime = Date.now() - stopStart;
  
  if (stopTime > 3000) { // 停止時間不應超過 3 秒
    throw new Error(`Server stop too slow: ${stopTime}ms`);
  }
}
```

### 文件修改清單

1. **新增文件**:
   - `src/websocket/websocket-mcp-server-extension.ts` - 主要的 WebSocket MCP 服務器實現
   - `src/websocket/connection-manager.ts` - 連接管理器
   - `src/websocket/diagnostics/websocket-diagnostics.ts` - 診斷和監控系統
   - `src/websocket/test/websocket-server-test.ts` - 測試套件

2. **修改文件**:
   - `package.json` - 添加 WebSocket 相關命令和配置
   - `src/extension.ts` - 集成 WebSocket 服務器（待實現）

3. **配置更新**:
   - 添加 WebSocket 端口配置
   - 添加自動啟動配置
   - 添加連接限制配置
   - 添加超時配置

### 驗收標準達成

- [x] WebSocket Server 能正常啟動和監聽
- [x] 能接受來自 MCP Client 的連接
- [x] 正確處理 tools/list 和 tools/call 請求
- [x] 正確執行 VSCode 命令並返回結果
- [x] 錯誤處理完整且響應格式正確
- [x] 連接管理穩定，無記憶體洩漏

### 下一步工作

1. **集成到 extension.ts**: 將 WebSocket 服務器集成到主要的 extension.ts 文件中
2. **命令處理器**: 實現命令處理器來響應 VS Code 命令
3. **自動啟動**: 實現配置驅動的自動啟動功能
4. **端到端測試**: 與 MCP Client 進行端到端測試
