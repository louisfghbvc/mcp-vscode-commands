# 開發者指南

## 概述

本文檔為開發者提供了 MCP VSCode Commands 擴展的開發指南，包括架構設計、API 使用、擴展開發和貢獻指南。

## 🏗️ 架構理解

### 整體架構

擴展採用輕量級模塊化設計，主要組件包括：

```
┌─────────────────────────────────────────────────────────────┐
│                    VS Code Extension                        │
├─────────────────────────────────────────────────────────────┤
│  Extension Entry Point (extension.ts)                      │
├─────────────────────────────────────────────────────────────┤
│  WebSocket MCP Server                                      │
│  ┌─────────────────┐                                       │
│  │ WebSocket       │                                       │
│  │ MCPServer       │                                       │
│  └─────────────────┘                                       │
├─────────────────────────────────────────────────────────────┤
│  Connection Manager │ VSCode Commands Tools │ Diagnostics  │
├─────────────────────────────────────────────────────────────┤
│                    VS Code API                             │
└─────────────────────────────────────────────────────────────┘
```

### 核心組件

#### 1. Extension Entry Point (`extension.ts`)
- 擴展的入口點
- 管理擴展生命週期
- 協調各個組件

#### 2. WebSocket MCP Server
- 處理 WebSocket 連接
- 實現 JSON-RPC 2.0 協議
- 管理客戶端連接

#### 3. Connection Manager
- 管理所有 WebSocket 連接
- 收集連接統計信息
- 實現連接池和負載均衡

#### 4. VSCode Commands Tools
- 執行 VS Code 命令
- 列出可用命令
- 序列化命令執行結果

#### 5. Diagnostics
- 提供系統診斷信息
- 監控服務器狀態
- 顯示狀態欄信息

## 🚀 開發環境設置

### 前置要求

- Node.js >= 18.x
- VS Code >= 1.74.0
- TypeScript >= 4.9.4

### 安裝依賴

```bash
# 克隆項目
git clone <repository-url>
cd mcp-vscode-commands

# 安裝依賴
npm install

# 安裝開發依賴
npm install --save-dev
```

### 編譯和測試

```bash
# 編譯 TypeScript
npm run compile

# 構建擴展
npm run build

# 清理構建文件
npm run clean

# 打包擴展
npm run package

# 監視模式編譯
npm run watch
```

### 調試配置

在 `.vscode/launch.json` 中添加：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}"
      ],
      "outFiles": [
        "${workspaceFolder}/out/**/*.js"
      ],
      "preLaunchTask": "npm: compile"
    }
  ]
}
```

## 🔌 API 開發

### 擴展現有功能

#### 1. 添加新的 MCP 方法

在 `src/websocket/message-handler.ts` 中添加：

```typescript
class MessageHandler {
  // ... existing code ...
  
  async handleRequest(message: RequestMessage): Promise<ResponseMessage> {
    switch (message.method) {
      case 'vscode.executeCommand':
        return this.handleExecuteCommand(message);
      case 'vscode.listCommands':
        return this.handleListCommands(message);
      case 'vscode.customMethod':  // 新增方法
        return this.handleCustomMethod(message);
      default:
        throw new Error(`Unknown method: ${message.method}`);
    }
  }
  
  private async handleCustomMethod(message: RequestMessage): Promise<ResponseMessage> {
    try {
      // 實現自定義邏輯
      const result = await this.vscodeAPI.customMethod(message.params);
      
      return {
        jsonrpc: "2.0",
        id: message.id,
        result
      };
    } catch (error) {
      return this.createErrorResponse(message.id, -32001, "Custom method failed", error);
    }
  }
}
```

#### 2. 擴展 VS Code API

在 `src/websocket/vscode-api.ts` 中添加：

```typescript
export class VSCodeAPI {
  // ... existing code ...
  
  async customMethod(params: any): Promise<any> {
    // 實現自定義 VS Code API 調用
    const result = await vscode.commands.executeCommand('custom.command', params);
    return result;
  }
  
  async getWorkspaceInfo(): Promise<WorkspaceInfo> {
    const folders = vscode.workspace.workspaceFolders || [];
    const activeEditor = vscode.window.activeTextEditor;
    
    return {
      folders: folders.map(folder => ({
        name: folder.name,
        uri: folder.uri.toString(),
        index: folder.index
      })),
      activeFile: activeEditor?.document.uri.toString(),
      language: activeEditor?.document.languageId
    };
  }
}
```

#### 3. 添加新的配置選項

在 `src/types.ts` 中擴展：

```typescript
export interface ExtensionConfig {
  // ... existing properties ...
  
  // 新增配置項
  customFeature: boolean;
  customTimeout: number;
  customRetries: number;
}
```

在 `src/extension.ts` 中實現：

```typescript
function getExtensionConfig(): ExtensionConfig {
  return {
    // ... existing config ...
    
    // 新增配置項
    customFeature: vscode.workspace.getConfiguration('mcpVscodeCommands').get('customFeature', false),
    customTimeout: vscode.workspace.getConfiguration('mcpVscodeCommands').get('customTimeout', 5000),
    customRetries: vscode.workspace.getConfiguration('mcpVscodeCommands').get('customRetries', 3)
  };
}
```

### 創建自定義組件

#### 1. 自定義連接管理器

```typescript
export class CustomConnectionManager extends ConnectionManager {
  private customMetrics: CustomMetrics;
  
  constructor() {
    super();
    this.customMetrics = new CustomMetrics();
  }
  
  addConnection(id: string, connection: WebSocketConnection): void {
    super.addConnection(id, connection);
    this.customMetrics.recordConnection(id);
  }
  
  removeConnection(id: string): void {
    super.removeConnection(id);
    this.customMetrics.recordDisconnection(id);
  }
  
  getCustomMetrics(): CustomMetrics {
    return this.customMetrics;
  }
}

interface CustomMetrics {
  connectionHistory: Map<string, ConnectionRecord>;
  recordConnection(id: string): void;
  recordDisconnection(id: string): void;
}
```

#### 2. 自定義診斷組件

```typescript
export class CustomDiagnostics extends WebSocketDiagnostics {
  private customHealthChecks: CustomHealthChecks;
  
  constructor() {
    super();
    this.customHealthChecks = new CustomHealthChecks();
  }
  
  async getDetailedStatus(): Promise<DetailedStatus> {
    const baseStatus = await super.getStatus();
    const customHealth = await this.customHealthChecks.run();
    
    return {
      ...baseStatus,
      custom: customHealth
    };
  }
}

interface CustomHealthChecks {
  run(): Promise<CustomHealthStatus>;
}

interface CustomHealthStatus {
  database: boolean;
  externalServices: boolean;
  cache: boolean;
}
```

## 🧪 測試開發

### 單元測試

#### 1. 組件測試

```typescript
// src/test/unit/connection-manager.test.ts
import { assert } from 'chai';
import { ConnectionManager } from '../../websocket/connection-manager';
import { WebSocketConnection } from '../../websocket/websocket-connection';

suite('ConnectionManager Tests', () => {
  let connectionManager: ConnectionManager;
  
  setup(() => {
    connectionManager = new ConnectionManager();
  });
  
  test('should add connection', () => {
    const connection = new WebSocketConnection('test-id', {} as any);
    connectionManager.addConnection('test-id', connection);
    
    const result = connectionManager.getConnection('test-id');
    assert.equal(result, connection);
  });
  
  test('should remove connection', () => {
    const connection = new WebSocketConnection('test-id', {} as any);
    connectionManager.addConnection('test-id', connection);
    connectionManager.removeConnection('test-id');
    
    const result = connectionManager.getConnection('test-id');
    assert.isUndefined(result);
  });
});
```

#### 2. API 測試

```typescript
// src/test/unit/vscode-api.test.ts
import { assert } from 'chai';
import { VSCodeAPI } from '../../websocket/vscode-api';
import * as sinon from 'sinon';

suite('VSCodeAPI Tests', () => {
  let vscodeAPI: VSCodeAPI;
  let sandbox: sinon.SinonSandbox;
  
  setup(() => {
    sandbox = sinon.createSandbox();
    vscodeAPI = new VSCodeAPI();
  });
  
  teardown(() => {
    sandbox.restore();
  });
  
  test('should execute command', async () => {
    const command = 'test.command';
    const args = ['arg1', 'arg2'];
    const expectedResult = 'success';
    
    sandbox.stub(vscode.commands, 'executeCommand').resolves(expectedResult);
    
    const result = await vscodeAPI.executeCommand(command, ...args);
    assert.equal(result, expectedResult);
  });
});
```

### 集成測試

#### 1. WebSocket 通信測試

```typescript
// src/test/integration/websocket-communication.test.ts
import { assert } from 'chai';
import { WebSocketMCPServerExtension } from '../../websocket/websocket-mcp-server-extension';
import { WebSocketMCPClient } from '../../websocket/websocket-mcp-client';

suite('WebSocket Communication Tests', () => {
  let server: WebSocketMCPServerExtension;
  let client: WebSocketMCPClient;
  
  setup(async () => {
    server = new WebSocketMCPServerExtension();
    await server.start(19847);
    
    client = new WebSocketMCPClient('ws://localhost:19847');
    await client.connect();
  });
  
  teardown(async () => {
    await client.disconnect();
    await server.stop();
  });
  
  test('should execute command via WebSocket', async () => {
    const result = await client.executeCommand('vscode.listCommands');
    assert.isArray(result.commands);
  });
});
```

#### 2. 端到端測試

```typescript
// src/test/e2e/full-workflow.test.ts
import { assert } from 'chai';
import { runTests } from '@vscode/test-electron';

suite('Full Workflow Tests', () => {
  test('should complete full workflow', async () => {
    // 啟動擴展
    // 連接 WebSocket 服務器
    // 執行命令
    // 驗證結果
    // 清理資源
  });
});
```

## 🔧 構建和部署

### 構建配置

#### 1. TypeScript 配置

`tsconfig.json` 關鍵配置：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "out",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "out",
    "test"
  ]
}
```

#### 2. 構建腳本

`package.json` 構建腳本：

```json
{
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "lint": "eslint src --ext ts",
    "test": "node ./out/test/runTest.js",
    "test:vscode": "node run-vscode-tests.js",
    "test:websocket": "node test-runner.js",
    "build": "npm run compile && npm run package",
    "package": "vsce package",
    "publish": "vsce publish"
  }
}
```

### 打包和發布

#### 1. 本地打包

```bash
# 安裝 vsce
npm install -g @vscode/vsce

# 打包擴展
npm run build

# 生成 .vsix 文件
vsce package
```

#### 2. 發布到市場

```bash
# 發布到 VS Code 市場
vsce publish

# 發布到私有市場
vsce publish --registry <private-registry-url>
```

## 📚 最佳實踐

### 代碼組織

#### 1. 文件結構

```
src/
├── extension.ts              # 擴展入口點
├── types.ts                 # 類型定義
├── websocket/               # WebSocket 相關
│   ├── websocket-mcp-server-extension.ts
│   ├── connection-manager.ts
│   ├── websocket-connection.ts
│   ├── message-handler.ts
│   ├── vscode-api.ts
│   └── diagnostics/
├── stdio/                   # Stdio 相關
├── utils/                   # 工具函數
└── test/                    # 測試文件
```

#### 2. 命名約定

- 文件名：kebab-case (`websocket-mcp-server.ts`)
- 類名：PascalCase (`WebSocketMCPServer`)
- 函數名：camelCase (`startServer`)
- 常量：UPPER_SNAKE_CASE (`MAX_CONNECTIONS`)

### 錯誤處理

#### 1. 統一錯誤處理

```typescript
export class MCPError extends Error {
  constructor(
    message: string,
    public code: number,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPError';
  }
}

export function handleError(error: unknown): MCPError {
  if (error instanceof MCPError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new MCPError(error.message, -32603, { originalError: error });
  }
  
  return new MCPError('Unknown error', -32603, { originalError: error });
}
```

#### 2. 日誌記錄

```typescript
export class Logger {
  private static instance: Logger;
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  info(message: string, ...args: any[]): void {
    console.log(`[INFO] ${message}`, ...args);
  }
  
  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error);
  }
  
  debug(message: string, ...args: any[]): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }
}
```

### 性能優化

#### 1. 連接池管理

```typescript
export class ConnectionPool {
  private connections: Map<string, WebSocketConnection> = new Map();
  private maxConnections: number;
  
  constructor(maxConnections: number = 10) {
    this.maxConnections = maxConnections;
  }
  
  async acquire(): Promise<WebSocketConnection> {
    if (this.connections.size >= this.maxConnections) {
      await this.waitForConnection();
    }
    
    const connection = new WebSocketConnection();
    this.connections.set(connection.id, connection);
    return connection;
  }
  
  release(connection: WebSocketConnection): void {
    this.connections.delete(connection.id);
    connection.close();
  }
  
  private async waitForConnection(): Promise<void> {
    return new Promise(resolve => {
      const checkInterval = setInterval(() => {
        if (this.connections.size < this.maxConnections) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }
}
```

#### 2. 消息緩衝

```typescript
export class MessageBuffer {
  private buffer: any[] = [];
  private maxSize: number;
  private flushInterval: number;
  
  constructor(maxSize: number = 100, flushInterval: number = 1000) {
    this.maxSize = maxSize;
    this.flushInterval = flushInterval;
    this.startFlushTimer();
  }
  
  add(message: any): void {
    this.buffer.push(message);
    
    if (this.buffer.length >= this.maxSize) {
      this.flush();
    }
  }
  
  private startFlushTimer(): void {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  
  private flush(): void {
    if (this.buffer.length > 0) {
      // 處理緩衝的消息
      this.processMessages(this.buffer);
      this.buffer = [];
    }
  }
  
  private processMessages(messages: any[]): void {
    // 實現批量消息處理邏輯
  }
}
```

## 🤝 貢獻指南

### 開發流程

#### 1. Fork 和克隆

```bash
# Fork 項目到你的 GitHub 賬戶
# 克隆你的 fork
git clone https://github.com/your-username/mcp-vscode-commands.git
cd mcp-vscode-commands

# 添加上游遠程倉庫
git remote add upstream https://github.com/original-owner/mcp-vscode-commands.git
```

#### 2. 創建功能分支

```bash
# 創建功能分支
git checkout -b feature/your-feature-name

# 或者創建修復分支
git checkout -b fix/issue-description
```

#### 3. 開發和測試

```bash
# 安裝依賴
npm install

# 編譯項目
npm run compile

# 運行測試
npm run test

# 運行所有測試
npm run test:all
```

#### 4. 提交和推送

```bash
# 添加更改
git add .

# 提交更改
git commit -m "feat: add new feature description"

# 推送到你的 fork
git push origin feature/your-feature-name
```

#### 5. 創建 Pull Request

1. 在 GitHub 上創建 Pull Request
2. 填寫詳細的描述
3. 等待代碼審查
4. 根據反饋進行修改

### 代碼標準

#### 1. 提交消息格式

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

類型：
- `feat`: 新功能
- `fix`: 修復 bug
- `docs`: 文檔更新
- `style`: 代碼格式
- `refactor`: 重構
- `test`: 測試
- `chore`: 構建過程或輔助工具的變動

#### 2. 代碼風格

- 使用 Prettier 格式化代碼
- 遵循 ESLint 規則
- 使用 TypeScript 嚴格模式
- 添加適當的註釋和文檔

#### 3. 測試要求

- 新功能必須包含測試
- 修復必須包含回歸測試
- 測試覆蓋率不低於 80%
- 所有測試必須通過

## 📚 學習資源

### 官方文檔

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [JSON-RPC 2.0](https://www.jsonrpc.org/specification)

### 示例項目

- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)
- [WebSocket Examples](https://github.com/websockets/ws/tree/master/examples)
- [MCP Examples](https://github.com/modelcontextprotocol/examples)

### 社區資源

- [VS Code Extension Community](https://github.com/microsoft/vscode-extension-samples)
- [MCP Community](https://github.com/modelcontextprotocol)
- [WebSocket Community](https://github.com/websockets)

## 🔗 相關文檔

- [架構文檔](./architecture.md)
- [API 參考](./api-reference.md)
- [配置指南](./configuration.md)
- [故障排除](./troubleshooting.md)
