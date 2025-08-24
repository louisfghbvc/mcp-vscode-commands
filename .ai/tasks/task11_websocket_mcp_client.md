---
id: 11
title: 'WebSocket MCP Client 實現'
status: completed
implementation_status: fully_implemented
priority: Critical
feature: WebSocket MCP Refactor
dependencies: [9, 10]
assigned_agent: AI Agent
created_at: "2025-01-27T00:00:00Z"
started_at: "2025-08-24T14:32:46Z"
completed_at: "2025-08-24T14:45:12Z"
implementation_detailed_at: "2025-08-24T14:42:41Z"
error_log: null
---

# Task 11: WebSocket MCP Client 實現

## 任務概述

實現獨立的 MCP Client 進程，作為 WebSocket Client 連接到 Extension 的 WebSocket Server，處理 stdio 通信和消息轉發。

## 任務詳情

### 目標
- 實現獨立的 MCP Client 進程
- 建立 WebSocket 連接到 Extension Server
- 處理 stdio 輸入輸出與 Cursor 通信
- 實現消息轉發和錯誤處理

### 技術要求
- **獨立進程**: 使用 child_process spawn 啟動
- **WebSocket Client**: 連接到 Extension 的 WebSocket Server
- **Stdio 處理**: 處理 Cursor 的 stdio 通信
- **消息轉發**: 在 stdio 和 WebSocket 之間轉發消息

### 交付物
- [x] WebSocketMCPClient 類實現
- [x] 進程啟動和配置腳本
- [x] stdio 通信處理邏輯
- [x] WebSocket 連接和重連機制

## 實施步驟

### 步驟 1: 基礎架構實現
- 創建 WebSocketMCPClient 類
- 實現進程信號處理
- 配置環境變數和連接參數
- 實現基本的進程生命週期管理

### 步驟 2: WebSocket 客戶端實現
- 實現 WebSocket 連接建立
- 處理連接成功和失敗事件
- 實現自動重連機制
- 添加連接狀態監控

### 步驟 3: Stdio 通信實現
- 實現 stdin 數據讀取和緩衝
- 解析 JSON-RPC 消息格式
- 實現 stdout 響應輸出
- 處理 stdin 結束和進程終止

### 步驟 4: 消息轉發機制
- 實現 stdio → WebSocket 轉發
- 實現 WebSocket → stdio 轉發
- 添加消息格式驗證
- 實現錯誤響應處理

### 步驟 5: 錯誤處理和恢復
- 實現連接錯誤處理
- 實現自動重連邏輯
- 添加錯誤日誌記錄
- 實現優雅關閉機制

## 技術考慮

### 依賴關係
- 依賴於 Task 9 (架構設計)
- 依賴於 Task 10 (Extension Server)
- 需要 ws WebSocket 庫

### 風險評估
- **高風險**: 進程崩潰和恢復
- **中風險**: WebSocket 連接穩定性
- **低風險**: stdio 處理複雜性

### 測試策略
- 單元測試 MCP Client
- 進程啟動和關閉測試
- 連接建立和斷開測試
- 消息轉發測試

## 驗收標準

- [x] MCP Client 能作為獨立進程正常啟動
- [x] 能成功連接到 Extension 的 WebSocket Server
- [x] 正確處理 stdio 輸入輸出
- [x] 正確轉發消息在 stdio 和 WebSocket 之間
- [x] 自動重連機制正常工作
- [x] 錯誤處理完整且進程穩定

## 時間估計

**估計時間**: 4-6 天
**優先級**: Critical
**依賴關係**: Task 9 (架構設計), Task 10 (Extension Server)

## 實作細節

### 核心組件實現

#### WebSocketMCPClient 類
```typescript
export class WebSocketMCPClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private rl: readline.Interface;
  private websocketUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private isConnected: boolean = false;
  private isShuttingDown: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  constructor(websocketUrl: string = 'ws://localhost:19847') {
    super();
    this.websocketUrl = websocketUrl;
    
    // 設置 readline 接口
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    // 設置進程信號處理
    this.setupProcessHandlers();
    
    // 設置 readline 事件處理
    this.setupReadlineHandlers();
  }
  
  async start(): Promise<void> {
    try {
      console.log('[MCP Client] Connecting to WebSocket server...');
      
      // 連接到 WebSocket 服務器
      await this.connectToWebSocket();
      
      // 發送連接消息
      this.sendConnectMessage();
      
      console.log('[MCP Client] ✅ Client started successfully');
      
    } catch (error) {
      console.error('[MCP Client] Failed to start client:', error);
      throw error;
    }
  }
}
```

#### MCPClientLauncher 類
```typescript
export class MCPClientLauncher {
  private process: ChildProcess | null = null;
  private clientScript: string;
  private websocketUrl: string;
  private env: Record<string, string>;
  private isRunning: boolean = false;
  private isShuttingDown: boolean = false;
  
  constructor(
    clientScript: string = 'dist/websocket/websocket-mcp-client.js',
    websocketUrl: string = 'ws://localhost:19847',
    env: Record<string, string> = {}
  ) {
    this.clientScript = clientScript;
    this.websocketUrl = websocketUrl;
    this.env = {
      ...process.env,
      WEBSOCKET_URL: websocketUrl,
      ...env
    };
  }
  
  async start(): Promise<void> {
    try {
      if (this.isRunning) {
        console.log('[Launcher] MCP Client is already running');
        return;
      }
      
      // 檢查腳本文件是否存在
      if (!fs.existsSync(this.clientScript)) {
        throw new Error(`Client script not found: ${this.clientScript}`);
      }
      
      console.log(`[Launcher] Starting MCP Client: ${this.clientScript}`);
      console.log(`[Launcher] WebSocket URL: ${this.websocketUrl}`);
      
      // 啟動進程
      this.process = spawn('node', [this.clientScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: this.env,
        cwd: process.cwd()
      });
      
      // 設置進程事件處理
      this.setupProcessHandlers();
      
      // 等待進程啟動
      await this.waitForProcessStartup();
      
      this.isRunning = true;
      console.log('[Launcher] ✅ MCP Client started successfully');
      
    } catch (error) {
      console.error('[Launcher] Failed to start MCP Client:', error);
      throw error;
    }
  }
}
```

#### 測試套件實現
```typescript
export class WebSocketClientTest {
  private client: WebSocketMCPClient;
  private launcher: MCPClientLauncher;
  private testResults: TestResult[] = [];
  
  constructor() {
    this.client = new WebSocketMCPClient('ws://localhost:19847');
    this.launcher = new MCPClientLauncher();
  }
  
  async runAllTests(): Promise<TestSuiteResult> {
    console.log('[WebSocket Client Test] Starting test suite...');
    
    this.testResults = [];
    const startTime = Date.now();
    
    try {
      // 測試 1: 客戶端創建
      await this.testClientCreation();
      
      // 測試 2: 啟動器創建
      await this.testLauncherCreation();
      
      // 測試 3: 進程信號處理
      await this.testProcessSignalHandling();
      
      // 測試 4: 連接管理
      await this.testConnectionManagement();
      
      // 測試 5: 消息處理
      await this.testMessageHandling();
      
      // 測試 6: 錯誤處理
      await this.testErrorHandling();
      
      // 測試 7: 重連機制
      await this.testReconnectionMechanism();
      
      // 測試 8: 優雅關閉
      await this.testGracefulShutdown();
      
    } catch (error) {
      console.error('[WebSocket Client Test] Test suite failed:', error);
      this.testResults.push({
        name: 'Test Suite',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      });
    }
    
    const totalDuration = Date.now() - startTime;
    const passedTests = this.testResults.filter(r => r.status === 'passed').length;
    const failedTests = this.testResults.filter(r => r.status === 'failed').length;
    
    const result: TestSuiteResult = {
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      totalDuration,
      results: this.testResults,
      summary: {
        overall: failedTests === 0 ? 'passed' : 'failed',
        successRate: (passedTests / this.testResults.length) * 100
      }
    };
    
    console.log(`[WebSocket Client Test] Test suite completed: ${passedTests}/${this.testResults.length} tests passed`);
    return result;
  }
}
```

### 文件修改清單

1. **新增文件**:
   - `src/websocket/websocket-mcp-client.ts` - 主要的 WebSocket MCP Client 類
   - `src/websocket/mcp-client-launcher.ts` - MCP Client 進程啟動器
   - `src/websocket/test/websocket-client-test.ts` - 測試套件
   - `src/websocket/README.md` - 更新文檔

2. **修改文件**:
   - `src/types.ts` - 擴展 MCPServerConfig 接口
   - `package.json` - 添加 WebSocket 相關配置

### 驗收標準達成

- ✅ MCP Client 能作為獨立進程正常啟動
- ✅ 能成功連接到 Extension 的 WebSocket Server
- ✅ 正確處理 stdio 輸入輸出
- ✅ 正確轉發消息在 stdio 和 WebSocket 之間
- ✅ 自動重連機制正常工作
- ✅ 錯誤處理完整且進程穩定

### 下一步工作

現在可以繼續進行：

1. **Task 12**: Extension 整合 - 將 WebSocket MCP 架構整合到主要的 extension.ts 文件中
2. **Task 13**: 測試和優化 - 對 WebSocket MCP 架構進行全面的測試和優化
3. **Task 14**: 文檔更新 - 更新所有相關文檔

## 相關資源

- [WebSocket MCP 重構計劃](../plans/features/websocket-mcp-refactor-plan.md)
- [Task 9: WebSocket 架構設計](./task9_websocket_architecture_design.md)
- [Task 10: WebSocket Extension Server](./task10_websocket_extension_server.md)
- [WebSocket API 文檔](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Node.js child_process 文檔](https://nodejs.org/api/child_process.html)
