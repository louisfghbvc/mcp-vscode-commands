import * as vscode from 'vscode';
import { MCPVSCodeServer } from './mcp-server.js';
import { MCPServerConfig } from './types.js';

let mcpServer: MCPVSCodeServer | undefined;

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
        mcpServer.close();
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
        mcpServer = new MCPVSCodeServer(config);
        
        // 啟動服務器 (使用 stdio)
        await mcpServer.start();
        
        vscode.window.showInformationMessage('MCP 服務器已啟動');
        console.log('MCP 服務器已成功啟動');
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
        mcpServer.close();
        mcpServer = undefined;
        vscode.window.showInformationMessage('MCP 服務器已停止');
        console.log('MCP 服務器已停止');
    } catch (error) {
        const message = `停止 MCP 服務器失敗: ${error}`;
        vscode.window.showErrorMessage(message);
        console.error(message);
    }
}

function showServerStatus(): void {
    const isRunning = mcpServer !== undefined;
    const status = isRunning ? '運行中' : '已停止';
    vscode.window.showInformationMessage(`MCP 服務器狀態: ${status}`);
}

function getConfig(): MCPServerConfig {
    const vscodeConfig = vscode.workspace.getConfiguration('mcpVscodeCommands');
    return {
        autoStart: vscodeConfig.get<boolean>('autoStart', true),
        logLevel: vscodeConfig.get<'debug' | 'info' | 'warn' | 'error'>('logLevel', 'info')
    };
}
