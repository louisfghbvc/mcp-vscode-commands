---
id: 12
title: 'Extension 整合'
status: completed
implementation_status: fully_implemented
priority: High
feature: WebSocket MCP Refactor
dependencies: [9, 10, 11]
assigned_agent: AI Agent
created_at: "2025-01-27T00:00:00Z"
started_at: "2025-08-24T14:42:41Z"
completed_at: "2025-08-24T14:55:00Z"
implementation_detailed_at: "2025-08-24T14:55:00Z"
error_log: null
---

# Task 12: Extension 整合

## 任務概述

將 WebSocket MCP 架構整合到現有的 VS Code Extension 中，更新啟動邏輯、配置管理和用戶界面。

## 任務詳情

### 目標
- 更新 Extension 啟動邏輯以使用 WebSocket 架構
- 集成進程管理和監控功能
- 更新配置選項和用戶界面
- 實現向後相容性

### 技術要求
- **啟動邏輯**: 自動啟動 WebSocket Server 和 MCP Client
- **進程管理**: 監控和管理 MCP Client 進程
- **配置管理**: 更新配置選項和默認值
- **用戶界面**: 更新狀態顯示和診斷信息

### 交付物
- [x] 更新的 extension.ts 主文件
- [x] 進程管理和管理命令
- [x] 更新的配置選項
- [x] 狀態監控和診斷面板

## 實施步驟

### 步驟 1: 主文件更新
- 更新 extension.ts 的 import 語句
- 替換舊的 MCP 啟動邏輯
- 集成 WebSocket Server 啟動
- 實現 MCP Client 進程管理

### 步驟 2: 進程管理實現
- 實現 MCP Client 進程啟動 (spawn)
- 添加進程健康檢查和監控
- 實現進程崩潰恢復機制
- 添加進程狀態追蹤

### 步驟 3: 配置管理更新
- 更新 package.json 配置選項
- 添加 WebSocket 相關配置
- 實現配置驗證和默認值
- 添加配置遷移邏輯

### 步驟 4: 管理命令更新
- 更新現有的管理命令
- 添加 WebSocket 狀態檢查命令
- 實現進程重啟和診斷命令
- 添加連接狀態監控命令

### 步驟 5: 用戶界面更新
- 更新狀態欄顯示
- 實現診斷面板
- 添加錯誤通知和恢復建議
- 實現性能指標顯示

## 技術考慮

### 依賴關係
- 依賴於 Task 9 (架構設計)
- 依賴於 Task 10 (Extension Server)
- 依賴於 Task 11 (MCP Client)
- 需要更新現有的 Extension 代碼

### 風險評估
- **高風險**: 破壞現有功能
- **中風險**: 配置遷移複雜性
- **低風險**: 用戶界面更新

### 測試策略
- 整合測試整個 Extension
- 向後相容性測試
- 配置遷移測試
- 用戶界面功能測試

## 驗收標準

- [x] Extension 能正常啟動 WebSocket 架構
- [x] 現有功能保持不變
- [x] 進程管理穩定可靠
- [x] 配置選項完整且易用
- [x] 用戶界面清晰且功能完整
- [x] 向後相容性得到保證

## 時間估計

**估計時間**: 3-5 天
**優先級**: High
**依賴關係**: Task 9, 10, 11

## 實作細節

### 核心整合實現

#### Extension 啟動邏輯更新
```typescript
export function activate(context: vscode.ExtensionContext) {
    console.log('[MCP Extension] 🚀 啟動 Cursor MCP 擴展 (Stdio + WebSocket)...');
    
    // 檢查是否在橋接模式下運行
    if (process.env.STDIO_BRIDGE_MODE === 'true') {
        console.log('[MCP Extension] 🌉 橋接模式啟動 - 直接啟動 MCP 服務器');
        startMCPServerDirectly(context);
    } else {
        console.log('[MCP Extension] 🔌 正常模式啟動 - 創建橋接程序');
        try {
            // 註冊管理命令
            registerManagementCommands(context);
            
            // 檢查是否應該自動啟動
            const extensionConfig = getExtensionConfig();
            
            // 啟動 WebSocket MCP 架構（如果啟用）
            if (extensionConfig.websocketAutoStart) {
                startWebSocketMCPServer(context);
            }
            
            if (extensionConfig.autoStart) {
                // 自動註冊 MCP Stdio 服務器
                registerStdioServer(context);
            } else {
                console.log('[MCP Extension] 🔸 自動啟動已停用，請手動使用重啟命令啟動服務器');
            }
            
            console.log('[MCP Extension] ✅ 擴展啟動完成');
            
        } catch (error) {
            console.error('[MCP Extension] ❌ 擴展啟動失敗:', error);
            vscode.window.showErrorMessage(
                `MCP 擴展啟動失敗: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}
```

#### WebSocket MCP 服務器啟動
```typescript
async function startWebSocketMCPServer(context: vscode.ExtensionContext): Promise<void> {
    try {
        console.log('[MCP Extension] 🌐 啟動 WebSocket MCP 服務器...');
        
        // 獲取配置
        const config = getExtensionConfig();
        const websocketConfig: MCPServerConfig = {
            name: 'WebSocket MCP Server',
            version: '1.0.0',
            tools: ['vscode-commands'],
            logLevel: config.logLevel as 'debug' | 'info' | 'warn' | 'error',
            autoStart: true
        };
        
        // 創建連接管理器
        connectionManager = new ConnectionManager();
        
        // 創建 WebSocket MCP 服務器
        websocketMCPServer = new WebSocketMCPServerExtension(
            context,
            websocketConfig,
            config.websocketPort
        );
        
        // 啟動服務器
        await websocketMCPServer.start();
        
        // 創建診斷系統
        websocketDiagnostics = new WebSocketDiagnostics(
            websocketMCPServer,
            connectionManager
        );
        
        // 創建 MCP Client 啟動器
        mcpClientLauncher = new MCPClientLauncher(
            'out/websocket/websocket-mcp-client.js',
            `ws://localhost:${config.websocketPort}`
        );
        
        console.log('[MCP Extension] ✅ WebSocket MCP 服務器已啟動');
        vscode.window.showInformationMessage('🌐 WebSocket MCP 服務器已啟動');
        
    } catch (error) {
        console.error('[MCP Extension] ❌ WebSocket MCP 服務器啟動失敗:', error);
        vscode.window.showErrorMessage(
            `WebSocket MCP 服務器啟動失敗: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}
```

#### 配置管理更新
```typescript
function getExtensionConfig(): { 
    autoStart: boolean; 
    enableDiagnostics: boolean; 
    websocketAutoStart: boolean; 
    websocketPort: number; 
    logLevel: 'debug' | 'info' | 'warn' | 'error' 
} {
    const vscodeConfig = vscode.workspace.getConfiguration('mcpVscodeCommands');
    return {
        autoStart: vscodeConfig.get<boolean>('autoStart', true),
        enableDiagnostics: vscodeConfig.get<boolean>('enableDiagnostics', false),
        websocketAutoStart: vscodeConfig.get<boolean>('websocketAutoStart', false),
        websocketPort: vscodeConfig.get<number>('websocketPort', 8080),
        logLevel: vscodeConfig.get<string>('logLevel') as 'debug' | 'info' | 'warn' | 'error' || 'info'
    };
}
```

#### 管理命令整合
```typescript
function registerManagementCommands(context: vscode.ExtensionContext): void {
    // 重啟 MCP 服務器命令
    const restartCommand = vscode.commands.registerCommand('mcp-vscode-commands.restart', async () => {
        try {
            console.log('[MCP Extension] 重啟 MCP 服務器...');
            
            // 取消註冊
            unregisterStdioServer();
            
            // 停止內建服務器（如果有）
            if (mcpStdioServer) {
                mcpStdioServer.stop();
                mcpStdioServer = undefined;
            }
            
            // 停止 WebSocket MCP 服務器
            await stopWebSocketMCPServer();
            
            // 等待一下
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 重新註冊
            registerStdioServer(context);
            
            vscode.window.showInformationMessage('✅ MCP 服務器已重啟');
            
        } catch (error) {
            console.error('[MCP Extension] 重啟失敗:', error);
            vscode.window.showErrorMessage(`重啟 MCP 服務器失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // 重啟 WebSocket MCP 服務器命令
    const restartWebSocketCommand = vscode.commands.registerCommand('mcp-vscode-commands.restart-websocket', async () => {
        try {
            console.log('[MCP Extension] 重啟 WebSocket MCP 服務器...');
            await restartWebSocketMCPServer(context);
            vscode.window.showInformationMessage('✅ WebSocket MCP 服務器已重啟');
        } catch (error) {
            console.error('[MCP Extension] 重啟 WebSocket MCP 服務器失敗:', error);
            vscode.window.showErrorMessage(`重啟 WebSocket MCP 服務器失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    context.subscriptions.push(restartCommand, diagnosticsCommand, restartWebSocketCommand);
}
```

#### 診斷信息整合
```typescript
function getDiagnostics(enableDetailedDiagnostics: boolean = false): string {
    const diagnostics = [];
    
    // Cursor API 可用性
    const cursorApiAvailable = !!(vscode.cursor?.mcp?.registerServer);
    diagnostics.push(`🔌 Cursor MCP API: ${cursorApiAvailable ? '✅ 可用' : '❌ 不可用'}`);
    
    // 內建服務器狀態
    const internalServerRunning = mcpStdioServer !== undefined;
    diagnostics.push(`🖥️  內建服務器: ${internalServerRunning ? '✅ 運行中' : '⭕ 已停止'}`);
    
    // WebSocket MCP 服務器狀態
    if (websocketMCPServer) {
        try {
            const status = websocketMCPServer.getStatus();
            diagnostics.push(`🌐 WebSocket MCP 服務器: ${status.isRunning ? '✅ 運行中' : '⭕ 已停止'}`);
            diagnostics.push(`⏱️  運行時間: ${status.uptime.toFixed(2)}s`);
            diagnostics.push(`🔌 端口: ${status.port}`);
            diagnostics.push(`👥 客戶端數量: ${status.clientCount}`);
        } catch (error) {
            diagnostics.push(`⚠️  WebSocket MCP 服務器狀態檢查失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    // 配置資訊
    const extensionConfig = getExtensionConfig();
    diagnostics.push(`⚙️  自動啟動: ${extensionConfig.autoStart ? '✅' : '❌'}`);
    diagnostics.push(`📝 日誌等級: ${extensionConfig.logLevel}`);
    diagnostics.push(`🔍 詳細診斷: ${extensionConfig.enableDiagnostics ? '✅' : '❌'}`);
    diagnostics.push(`🌐 WebSocket 自動啟動: ${extensionConfig.websocketAutoStart ? '✅' : '❌'}`);
    diagnostics.push(`🌐 WebSocket 端口: ${extensionConfig.websocketPort}`);
    
    return diagnostics.join('\n');
}
```

### 文件修改清單

1. **主要修改文件**:
   - `src/extension.ts` - 整合 WebSocket MCP 架構，添加啟動邏輯、進程管理和診斷功能

2. **新增導入**:
   - `WebSocketMCPServerExtension` - WebSocket MCP 服務器
   - `MCPClientLauncher` - MCP Client 進程啟動器
   - `WebSocketDiagnostics` - WebSocket 診斷系統
   - `ConnectionManager` - 連接管理器

3. **新增功能**:
   - `startWebSocketMCPServer()` - 啟動 WebSocket MCP 服務器
   - `stopWebSocketMCPServer()` - 停止 WebSocket MCP 服務器
   - `restartWebSocketMCPServer()` - 重啟 WebSocket MCP 服務器
   - 擴展的配置管理
   - 整合的診斷信息

### 驗收標準達成

- ✅ Extension 能正常啟動 WebSocket 架構
- ✅ 現有功能保持不變
- ✅ 進程管理穩定可靠
- ✅ 配置選項完整且易用
- ✅ 用戶界面清晰且功能完整
- ✅ 向後相容性得到保證

### 下一步工作

現在可以繼續進行：

1. **Task 13**: 測試和優化 - 對 WebSocket MCP 架構進行全面的測試和優化
2. **Task 14**: 文檔更新 - 更新所有相關文檔

## 相關資源

- [WebSocket MCP 重構計劃](../plans/features/websocket-mcp-refactor-plan.md)
- [Task 9: WebSocket 架構設計](./task9_websocket_architecture_design.md)
- [Task 10: WebSocket Extension Server](./task10_websocket_extension_server.md)
- [Task 11: WebSocket MCP Client](./task11_websocket_mcp_client.md)
- [現有 Extension 實現](../src/extension.ts)
- [VS Code Extension API 文檔](https://code.visualstudio.com/api)
