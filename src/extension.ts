import * as vscode from 'vscode';
import { SimpleWebSocketServer } from './websocket/simple-websocket-server';
import { StdioMCPServer } from './stdio-mcp-server';

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

let websocketServer: SimpleWebSocketServer | undefined;
let stdioMCPServer: StdioMCPServer | undefined;

export async function activate(context: vscode.ExtensionContext) {
    console.log('[MCP Extension] 🚀 啟動...');
    
    try {
        registerManagementCommands(context);
        
        const config = getExtensionConfig();
        if (config.autoStart) {
            await startWebSocketMCPServer(context);
        }
        
        console.log('[MCP Extension] ✅ 啟動完成');
    } catch (error) {
        console.error('[MCP Extension] ❌ 啟動失敗:', error);
        vscode.window.showErrorMessage(
            `MCP 擴展啟動失敗: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

export function deactivate() {
    console.log('[MCP Extension] 正在停用...');
    try {
        stopWebSocketMCPServer();
        console.log('[MCP Extension] ✅ 已停用');
    } catch (error) {
        console.error('[MCP Extension] 停用錯誤:', error);
    }
}

async function startWebSocketMCPServer(context: vscode.ExtensionContext): Promise<void> {
    try {
        console.log('[MCP Extension] 🌐 啟動 WebSocket 服務器...');
        
        const config = getExtensionConfig();
        websocketServer = new SimpleWebSocketServer(config.websocketPort);
        await websocketServer.start();
        
        stdioMCPServer = new StdioMCPServer(context.extensionPath, config.websocketPort);
        await stdioMCPServer.start();
        
        console.log('[MCP Extension] ✅ 服務器已啟動');
    } catch (error) {
        console.error('[MCP Extension] ❌ 啟動失敗:', error);
        vscode.window.showErrorMessage(
            `啟動失敗: ${error instanceof Error ? error.message : String(error)}`
        );
    }
}

async function stopWebSocketMCPServer(): Promise<void> {
    try {
        if (stdioMCPServer) {
            await stdioMCPServer.stop();
            stdioMCPServer = undefined;
        }
        if (websocketServer) {
            await websocketServer.stop();
            websocketServer = undefined;
        }
    } catch (error) {
        console.error('[MCP Extension] 停止失敗:', error);
    }
}

function getExtensionConfig(): { autoStart: boolean; websocketPort: number } {
    const vscodeConfig = vscode.workspace.getConfiguration('mcpVscodeCommands');
    return {
        autoStart: vscodeConfig.get<boolean>('autoStart', true),
        websocketPort: vscodeConfig.get<number>('websocketPort', 19847)
    };
}

function registerManagementCommands(context: vscode.ExtensionContext): void {
    const restartCommand = vscode.commands.registerCommand('mcp-vscode-commands.restart', async () => {
        try {
            await stopWebSocketMCPServer();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await startWebSocketMCPServer(context);
            vscode.window.showInformationMessage('✅ MCP 服務器已重啟');
        } catch (error) {
            vscode.window.showErrorMessage(`重啟失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    });

    const diagnosticsCommand = vscode.commands.registerCommand('mcp-vscode-commands.diagnostics', () => {
        const diagnostics = getDiagnostics();
        vscode.window.showInformationMessage(diagnostics);
    });

    context.subscriptions.push(restartCommand, diagnosticsCommand);
}

function getDiagnostics(): string {
    const diagnostics = [];
    
    const cursorApiAvailable = !!(vscode.cursor?.mcp?.registerServer);
    diagnostics.push(`🔌 Cursor MCP API: ${cursorApiAvailable ? '✅ 可用' : '❌ 不可用'}`);

    if (websocketServer) {
        const status = websocketServer.getStatus();
        diagnostics.push(`🌐 WebSocket: ${status.isRunning ? '✅ 運行中' : '⭕ 已停止'}`);
        diagnostics.push(`🔌 端口: ${status.port}`);
        diagnostics.push(`👥 客戶端: ${status.clientCount}`);
    } else {
        diagnostics.push('🌐 WebSocket: ❌ 未啟動');
    }
    
    if (stdioMCPServer) {
        const status = stdioMCPServer.getStatus();
        diagnostics.push(`📡 Stdio: ${status.isRunning ? '✅ 運行中' : '⭕ 已停止'}`);
        if (status.isRunning) {
            diagnostics.push(`   - 工具: ${status.tools.map(t => t.name).join(', ')}`);
        }
    } else {
        diagnostics.push('📡 Stdio: ❌ 未啟動');
    }
    
    const config = getExtensionConfig();
    diagnostics.push(`⚙️  自動啟動: ${config.autoStart ? '✅' : '❌'}`);
    diagnostics.push(`🌐 端口: ${config.websocketPort}`);
    
    return diagnostics.join('\n');
}
