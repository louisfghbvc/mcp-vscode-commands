import * as vscode from 'vscode';
import { MCPSSEServer } from './mcp-sse-server';
import { MCPServerConfig } from './types';

// Cursor MCP Extension API 類型定義
declare module 'vscode' {
    export namespace cursor {
        export namespace mcp {
            export interface RemoteServerConfig {
                name: string;
                server: {
                    url: string;
                    headers?: Record<string, string>;
                }
            }
            
            export interface StdioServerConfig {
                name: string;
                server: {
                    command: string;
                    args: string[];
                    env: Record<string, string>;
                }
            }
            
            export type ExtMCPServerConfig = StdioServerConfig | RemoteServerConfig;
            
            export const registerServer: (config: ExtMCPServerConfig) => void;
            export const unregisterServer: (serverName: string) => void;
        }
    }
}

let mcpServer: MCPSSEServer | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('MCP VSCode Commands 擴展正在啟動...');
    
    // 註冊命令
    const startCommand = vscode.commands.registerCommand('mcp-vscode-commands.start', async () => {
        await startMCPServer();
    });
    
    const stopCommand = vscode.commands.registerCommand('mcp-vscode-commands.stop', async () => {
        await stopMCPServer();
    });
    
    const statusCommand = vscode.commands.registerCommand('mcp-vscode-commands.status', () => {
        showServerStatus();
    });

    context.subscriptions.push(startCommand, stopCommand, statusCommand);

    // 根據配置自動啟動
    const config = getConfig();
    if (config.autoStart) {
        startMCPServer();
    }

    console.log('MCP VSCode Commands 擴展已啟動');
}

export function deactivate() {
    if (mcpServer) {
        mcpServer.stop();
        mcpServer = undefined;
    }
}

async function startMCPServer(): Promise<void> {
    if (mcpServer) {
        vscode.window.showInformationMessage('MCP 服務器已經在運行中');
        return;
    }

    try {
        const config = getConfig();
        mcpServer = new MCPSSEServer(config);
        
        // 啟動 SSE 服務器
        const serverInfo = await mcpServer.start();
        
        // 使用 Cursor 官方 MCP Extension API 註冊服務器
        await registerWithCursorAPI(serverInfo);
        
        vscode.window.showInformationMessage(`✅ MCP 服務器已啟動並註冊到 Cursor\n🌐 ${serverInfo.url}`);
        console.log('MCP SSE 服務器已成功啟動並註冊:', serverInfo);
    } catch (error) {
        const message = `啟動 MCP 服務器失敗: ${error}`;
        vscode.window.showErrorMessage(message);
        console.error(message);
    }
}

async function stopMCPServer(): Promise<void> {
    if (!mcpServer) {
        vscode.window.showInformationMessage('MCP 服務器未運行');
        return;
    }

    try {
        mcpServer.stop();
        mcpServer = undefined;
        
        // 使用 Cursor 官方 MCP Extension API 取消註冊服務器
        await unregisterFromCursorAPI();
        
        vscode.window.showInformationMessage('✅ MCP 服務器已停止並從 Cursor 取消註冊');
        console.log('MCP 服務器已停止並取消註冊');
    } catch (error) {
        const message = `停止 MCP 服務器失敗: ${error}`;
        vscode.window.showErrorMessage(message);
        console.error(message);
    }
}

function showServerStatus(): void {
    const isRunning = mcpServer !== undefined;
    if (isRunning && mcpServer) {
        const info = mcpServer.getServerInfo();
        vscode.window.showInformationMessage(`MCP 服務器運行中: ${info.url}`);
    } else {
        vscode.window.showInformationMessage('MCP 服務器已停止');
    }
}

function getConfig(): MCPServerConfig {
    const vscodeConfig = vscode.workspace.getConfiguration('mcpVscodeCommands');
    return {
        autoStart: vscodeConfig.get<boolean>('autoStart', true),
        logLevel: vscodeConfig.get<'debug' | 'info' | 'warn' | 'error'>('logLevel', 'info')
    };
}

/**
 * 使用 Cursor 官方 MCP Extension API 註冊服務器
 */
async function registerWithCursorAPI(serverInfo: { port: number; url: string }): Promise<void> {
    try {
        // 檢查 Cursor MCP API 是否可用
        if (!vscode.cursor?.mcp?.registerServer) {
            console.warn('Cursor MCP API 不可用，跳過自動註冊');
            vscode.window.showWarningMessage('🔸 Cursor MCP API 不可用，請手動配置 MCP 服務器');
            return;
        }

        // 使用 Cursor 官方 API 註冊 SSE 服務器
        const serverConfig: vscode.cursor.mcp.RemoteServerConfig = {
            name: 'vscode-commands',
            server: {
                url: serverInfo.url,
                headers: {
                    'User-Agent': 'VSCode Commands MCP Extension'
                }
            }
        };

        vscode.cursor.mcp.registerServer(serverConfig);
        
        console.log('✅ 已使用 Cursor MCP API 註冊服務器:', serverConfig);
        
    } catch (error) {
        console.error('使用 Cursor API 註冊 MCP 服務器失敗:', error);
        vscode.window.showWarningMessage(`⚠️ MCP 服務器註冊失敗: ${error instanceof Error ? error.message : String(error)}`);
        // 不要阻止服務器啟動
    }
}

/**
 * 使用 Cursor 官方 MCP Extension API 取消註冊服務器
 */
async function unregisterFromCursorAPI(): Promise<void> {
    try {
        // 檢查 Cursor MCP API 是否可用
        if (!vscode.cursor?.mcp?.unregisterServer) {
            console.warn('Cursor MCP API 不可用，跳過自動取消註冊');
            return;
        }

        vscode.cursor.mcp.unregisterServer('vscode-commands');
        
        console.log('✅ 已使用 Cursor MCP API 取消註冊服務器');
        
    } catch (error) {
        console.error('使用 Cursor API 取消註冊 MCP 服務器失敗:', error);
        // 不要阻止服務器停止
    }
}