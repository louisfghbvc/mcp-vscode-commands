# WebSocket MCP 架構文檔

## 概述

本文檔詳細描述了 MCP VSCode Commands 擴展的 WebSocket MCP 架構設計、實現細節和技術規範。該擴展專注於 WebSocket 通信，提供輕量級、高效的 MCP 服務。

## 🏗️ 架構設計

### 整體架構

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   MCP Client    │    │  WebSocket MCP   │    │   VS Code      │
│   (WebSocket)   │◄──►│     Client       │◄──►│   Extension    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  WebSocket MCP   │
                       │     Server       │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   VS Code API    │
                       │   Integration    │
                       └──────────────────┘
```

### WebSocket 架構

擴展專注於 WebSocket 通信模式：

- **WebSocket 模式**
  - 通過 WebSocket 協議進行網絡通信
  - 支持遠程連接和多客戶端
  - 使用 JSON-RPC 2.0 協議
  - 輕量級設計，專注於核心功能

## 🔌 通信協議

### JSON-RPC 2.0

WebSocket 模式使用標準的 JSON-RPC 2.0 協議：

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

### 消息格式

#### 請求消息
```typescript
interface RequestMessage {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: any;
}
```

#### 響應消息
```typescript
interface ResponseMessage {
  jsonrpc: "2.0";
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
```

#### 通知消息
```typescript
interface NotificationMessage {
  jsonrpc: "2.0";
  method: string;
  params?: any;
}
```

## 🏢 核心組件

### 1. WebSocket MCPServerExtension

主要的 WebSocket MCP 服務器擴展類：

```typescript
class WebSocketMCPServerExtension {
  private wss: WebSocket.Server;
  private clients: Map<string, WebSocketClient>;
  private tools: VSCodeCommandsTools;
  
  async start(): Promise<void>
  async stop(): Promise<void>
  getStatus(): ServerStatus
}
```

**主要職責**:
- 管理 WebSocket 服務器生命週期
- 處理客戶端連接和斷開
- 協調各個子組件
- 提供 MCP 工具支持

### 2. ConnectionManager

連接管理器，負責管理所有活躍的 WebSocket 連接：

```typescript
class ConnectionManager {
  private connections: Map<string, ConnectionInfo>;
  private stats: ConnectionStats;
  
  addConnection(id: string, connection: WebSocketClient): void
  removeConnection(id: string): void
  getConnection(id: string): WebSocketClient | undefined
  getConnectionStats(): ConnectionStats
}
```

**主要職責**:
- 維護連接池
- 收集連接統計信息
- 管理連接生命週期
- 提供連接狀態監控

### 3. WebSocketClient

單個 WebSocket 客戶端的封裝：

```typescript
class WebSocketClient {
  public id: string;
  public ws: WebSocket;
  public connected: boolean;
  
  send(message: WebSocketMessage): void
  close(code?: number, reason?: string): void
  getHealth(): any
}
```

**主要職責**:
- 處理 WebSocket 消息
- 監控連接健康狀態
- 提供客戶端標識和管理

### 4. VSCodeCommandsTools

VS Code 命令工具類，提供統一的命令執行接口：

```typescript
class VSCodeCommandsTools {
  private config: any;
  
  async executeCommand(commandId: string, args: any[]): Promise<CommandExecutionResult>
  async listCommands(filter?: string): Promise<CommandExecutionResult>
  private serializeResult(result: any): any
}
```

**主要職責**:
- 執行 VS Code 命令
- 列出可用命令
- 序列化命令執行結果

### 5. WebSocketDiagnostics

WebSocket 診斷系統，提供監控和診斷功能：

```typescript
class WebSocketDiagnostics {
  private extension: WebSocketMCPServerExtension;
  private connectionManager: ConnectionManager;
  private outputChannel: vscode.OutputChannel;
  
  showDiagnostics(): void
  private generateDiagnostics(): string
  private updateStatusBar(): void
}
```

**主要職責**:
- 提供系統診斷信息
- 監控服務器狀態
- 顯示狀態欄信息

## 🔧 配置系統

### 配置選項

```typescript
interface ExtensionConfig {
  // Stdio 模式配置
  autoStart: boolean;
  logLevel: 'info' | 'warn' | 'error' | 'debug';
  
  // WebSocket 模式配置
  websocketAutoStart: boolean;
  websocketPort: number;
  websocketMaxConnections: number;
  websocketConnectionTimeout: number;
  
  // 診斷配置
  enableDiagnostics: boolean;
}
```

### 配置驗證

```typescript
function validateConfig(config: ExtensionConfig): ValidationResult {
  const errors: string[] = [];
  
  if (config.websocketPort < 1 || config.websocketPort > 65535) {
    errors.push('WebSocket port must be between 1 and 65535');
  }
  
  if (config.websocketMaxConnections < 1) {
    errors.push('Max connections must be at least 1');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## 📊 監控和診斷

### 健康檢查

```typescript
interface ServerStatus {
  isRunning: boolean;
  uptime: number;
  port: number;
  clientCount: number;
  memoryUsage: MemoryUsage;
  cpuUsage: number;
}
```

### 性能指標

```typescript
interface PerformanceMetrics {
  messageLatency: number;
  connectionTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: MemoryUsage;
}
```

### 診斷命令

擴展提供以下診斷命令：

- `mcp-vscode-commands.diagnostics` - 顯示詳細診斷信息
- `mcp-vscode-commands.startWebSocket` - 啟動 WebSocket 服務器
- `mcp-vscode-commands.stopWebSocket` - 停止 WebSocket 服務器
- `mcp-vscode-commands.restartWebSocket` - 重啟 WebSocket 服務器

## 🚀 性能優化

### 連接池管理

- 智能連接重用
- 連接數量限制
- 自動清理閒置連接

### 消息緩衝

- 異步消息處理
- 批量消息優化
- 優先級隊列

### 資源監控

- 實時記憶體使用監控
- CPU 使用率追蹤
- 自動垃圾回收

## 🔒 安全性

### 連接驗證

- WebSocket 握手驗證
- 連接來源檢查
- 權限驗證

### 消息驗證

- JSON-RPC 格式驗證
- 命令白名單
- 參數類型檢查

### 錯誤處理

- 結構化錯誤響應
- 錯誤日誌記錄
- 安全錯誤信息

## 🧪 測試策略

### 單元測試

- 組件功能測試
- 消息處理測試
- 配置驗證測試

### 集成測試

- WebSocket 通信測試
- VS Code API 集成測試
- 端到端功能測試

### 性能測試

- 負載測試
- 壓力測試
- 記憶體洩漏測試

## 📈 擴展性

### 插件系統

- 自定義命令支持
- 第三方擴展集成
- 動態功能加載

### 集群支持

- 多實例部署
- 負載均衡
- 故障轉移

### 雲端部署

- Docker 容器化
- Kubernetes 部署
- 雲服務集成

## 🔄 版本兼容性

### VS Code 版本

- 支持 VS Code 1.74.0+
- 向後兼容性保證
- 新功能漸進式增強

### MCP 協議

- 支持 MCP 1.0 規範
- 協議版本檢測
- 自動協議升級

## 📚 參考文檔

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
- [VS Code Extension API](https://code.visualstudio.com/api)
