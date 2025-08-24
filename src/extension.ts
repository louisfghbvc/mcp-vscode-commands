import * as vscode from 'vscode';
import * as path from 'path';
import { MCPServerConfig } from './types';
import { WebSocketMCPServerExtension } from './websocket/websocket-mcp-server-extension';
import { MCPClientLauncher } from './websocket/mcp-client-launcher';
import { WebSocketDiagnostics } from './websocket/diagnostics/websocket-diagnostics';
import { ConnectionManager } from './websocket/connection-manager';

// Cursor MCP Extension API 類型定義
declare module 'vscode' {
    export namespace cursor {
        export namespace mcp {
            export interface StdioServerConfig {
                name: string;
                server: {
                    command: string;
                    args: string[];
                    env: Record<string, string>;
                }
            }
            
            export const registerServer: (config: StdioServerConfig) => void;
            export const unregisterServer: (serverName: string) => void;
        }
    }
}

let websocketMCPServer: WebSocketMCPServerExtension | undefined;
let mcpClientLauncher: MCPClientLauncher | undefined;
let websocketDiagnostics: WebSocketDiagnostics | undefined;
let connectionManager: ConnectionManager | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('[MCP Extension] 🚀 啟動 WebSocket MCP 擴展...');
    
    try {
        // 註冊管理命令
        registerManagementCommands(context);
        
        // 檢查是否應該自動啟動
        const extensionConfig = getExtensionConfig();
        
        if (extensionConfig.autoStart) {
            // 自動啟動 WebSocket MCP 服務器
            await startWebSocketMCPServer(context);
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

export function deactivate() {
    console.log('[MCP Extension] 正在停用擴展...');
    
    try {
        // 停止 WebSocket MCP 服務器
        stopWebSocketMCPServer();
        
        // 停止 MCP Client 啟動器
        if (mcpClientLauncher) {
            mcpClientLauncher.dispose();
            mcpClientLauncher = undefined;
        }
        

        
        // 清理 WebSocket 診斷
        if (websocketDiagnostics) {
            websocketDiagnostics.dispose();
            websocketDiagnostics = undefined;
        }
        
        // 清理連接管理器
        if (connectionManager) {
            connectionManager.dispose();
            connectionManager = undefined;
        }
        
        console.log('[MCP Extension] ✅ 擴展已停用');
    } catch (error) {
        console.error('[MCP Extension] 停用過程中發生錯誤:', error);
    }
}

/**
 * 啟動 WebSocket MCP 服務器
 */
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

/**
 * 停止 WebSocket MCP 服務器
 */
async function stopWebSocketMCPServer(): Promise<void> {
    try {
        if (websocketMCPServer) {
            await websocketMCPServer.stop();
            websocketMCPServer = undefined;
            console.log('[MCP Extension] ✅ WebSocket MCP 服務器已停止');
        }
    } catch (error) {
        console.error('[MCP Extension] 停止 WebSocket MCP 服務器失敗:', error);
    }
}

/**
 * 重啟 WebSocket MCP 服務器
 */
async function restartWebSocketMCPServer(context: vscode.ExtensionContext): Promise<void> {
    try {
        console.log('[MCP Extension] 🔄 重啟 WebSocket MCP 服務器...');
        
        // 停止現有服務器
        await stopWebSocketMCPServer();
        
        // 等待一下
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 重新啟動
        await startWebSocketMCPServer(context);
        
        vscode.window.showInformationMessage('✅ WebSocket MCP 服務器已重啟');
        
    } catch (error) {
        console.error('[MCP Extension] 重啟 WebSocket MCP 服務器失敗:', error);
        vscode.window.showErrorMessage(`重啟 WebSocket MCP 服務器失敗: ${error instanceof Error ? error.message : String(error)}`);
    }
}
















// 移除舊的 getConfig 函數，使用 getExtensionConfig 代替

/**
 * 獲取擴展配置
 */
function getExtensionConfig(): { autoStart: boolean; websocketAutoStart: boolean; websocketPort: number; logLevel: 'debug' | 'info' | 'warn' | 'error' } {
    const vscodeConfig = vscode.workspace.getConfiguration('mcpVscodeCommands');
    return {
        autoStart: vscodeConfig.get<boolean>('autoStart', true),
        websocketAutoStart: vscodeConfig.get<boolean>('websocketAutoStart', false),
        websocketPort: vscodeConfig.get<number>('websocketPort', 19847),
        logLevel: vscodeConfig.get<'debug' | 'info' | 'warn' | 'error'>('logLevel', 'info')
    };
}

/**
 * 註冊管理命令
 */
function registerManagementCommands(context: vscode.ExtensionContext): void {
    // 重啟 WebSocket MCP 服務器命令
    const restartCommand = vscode.commands.registerCommand('mcp-vscode-commands.restart', async () => {
        try {
            console.log('[MCP Extension] 重啟 WebSocket MCP 服務器...');
            
            // 停止 WebSocket MCP 服務器
            await stopWebSocketMCPServer();
            
            // 等待一下
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 重新啟動
            await startWebSocketMCPServer(context);
            
            vscode.window.showInformationMessage('✅ WebSocket MCP 服務器已重啟');
            
        } catch (error) {
            console.error('[MCP Extension] 重啟失敗:', error);
            vscode.window.showErrorMessage(`重啟 WebSocket MCP 服務器失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // 顯示診斷資訊命令
    const diagnosticsCommand = vscode.commands.registerCommand('mcp-vscode-commands.diagnostics', () => {
        const diagnostics = getDiagnostics();
        vscode.window.showInformationMessage(diagnostics);
    });

    // 啟動 WebSocket MCP 服務器命令
    const startWebSocketCommand = vscode.commands.registerCommand('mcp-vscode-commands.startWebSocket', async () => {
        try {
            console.log('[MCP Extension] 🚀 啟動 WebSocket MCP 服務器...');
            await startWebSocketMCPServer(context);
            vscode.window.showInformationMessage('✅ WebSocket MCP 服務器已啟動');
        } catch (error) {
            console.error('[MCP Extension] 啟動 WebSocket MCP 服務器失敗:', error);
            vscode.window.showErrorMessage(`啟動 WebSocket MCP 服務器失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // 停止 WebSocket MCP 服務器命令
    const stopWebSocketCommand = vscode.commands.registerCommand('mcp-vscode-commands.stopWebSocket', async () => {
        try {
            console.log('[MCP Extension] 🛑 停止 WebSocket MCP 服務器...');
            await stopWebSocketMCPServer();
            vscode.window.showInformationMessage('✅ WebSocket MCP 服務器已停止');
        } catch (error) {
            console.error('[MCP Extension] 停止 WebSocket MCP 服務器失敗:', error);
            vscode.window.showErrorMessage(`停止 WebSocket MCP 服務器失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    // 重啟 WebSocket MCP 服務器命令
    const restartWebSocketCommand = vscode.commands.registerCommand('mcp-vscode-commands.restartWebSocket', async () => {
        try {
            console.log('[MCP Extension] 🔄 重啟 WebSocket MCP 服務器...');
            await restartWebSocketMCPServer(context);
            vscode.window.showInformationMessage('✅ WebSocket MCP 服務器已重啟');
        } catch (error) {
            console.error('[MCP Extension] 重啟 WebSocket MCP 服務器失敗:', error);
            vscode.window.showErrorMessage(`重啟 WebSocket MCP 服務器失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    context.subscriptions.push(restartCommand, diagnosticsCommand, startWebSocketCommand, stopWebSocketCommand, restartWebSocketCommand);
}

/**
 * 獲取診斷資訊
 */
function getDiagnostics(): string {
    const diagnostics = [];
    
    // Cursor API 可用性
    const cursorApiAvailable = !!(vscode.cursor?.mcp?.registerServer);
    diagnostics.push(`🔌 Cursor MCP API: ${cursorApiAvailable ? '✅ 可用' : '❌ 不可用'}`);
    


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
    diagnostics.push(`🌐 WebSocket 自動啟動: ${extensionConfig.websocketAutoStart ? '✅' : '❌'}`);
    diagnostics.push(`🌐 WebSocket 端口: ${extensionConfig.websocketPort}`);
    
    // 添加技術資訊
    const nodeVersion = process.version;
    const platform = process.platform;
    const arch = process.arch;
    diagnostics.push(`\n--- 詳細系統資訊 ---`);
    diagnostics.push(`🖥️  平台: ${platform} (${arch})`);
    diagnostics.push(`📦 Node.js: ${nodeVersion}`);
    diagnostics.push(`🔧 VSCode API: ${vscode.version || 'N/A'}`);
    


    if (websocketMCPServer) {
        try {
            const status = websocketMCPServer.getStatus();
            diagnostics.push(`\n--- WebSocket 服務器詳細狀態 ---`);
            diagnostics.push(`🔄 運行狀態: ${status.isRunning ? '運行中' : '已停止'}`);
            diagnostics.push(`🔌 監聽端口: ${status.port}`);
            diagnostics.push(`👥 活躍客戶端: ${status.clientCount}`);
            diagnostics.push(`⏱️  服務器運行時間: ${status.uptime.toFixed(2)}s`);
        } catch (error) {
            diagnostics.push(`⚠️  WebSocket 服務器詳細狀態獲取失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    return diagnostics.join('\n');
}