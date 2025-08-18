import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { MCPSSEServer } from './mcp-sse-server';
import { MCPServerConfig } from './types';

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
        
        // 更新 Cursor MCP 配置
        await updateCursorMCPConfig(serverInfo);
        
        vscode.window.showInformationMessage(`MCP SSE 服務器已啟動在 ${serverInfo.url}`);
        console.log('MCP SSE 服務器已成功啟動:', serverInfo);
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
        
        // 從 Cursor MCP 配置中移除
        await removeCursorMCPConfig();
        
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

async function updateCursorMCPConfig(serverInfo: { port: number; url: string }): Promise<void> {
    try {
        // Cursor MCP 配置文件路徑
        const configPath = path.join(os.homedir(), '.cursor', 'mcp.json');
        const configDir = path.dirname(configPath);
        
        // 確保目錄存在
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        // 讀取現有配置
        let config: any = {};
        if (fs.existsSync(configPath)) {
            const content = fs.readFileSync(configPath, 'utf-8');
            try {
                config = JSON.parse(content);
            } catch (e) {
                config = {};
            }
        }
        
        // 確保有 mcpServers 對象
        if (!config.mcpServers) {
            config.mcpServers = {};
        }
        
        // 添加或更新 VSCode Commands 服務器配置
        config.mcpServers['vscode-commands'] = {
            url: serverInfo.url,
            transport: 'sse'
        };
        
        // 寫回配置文件
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        console.log('Cursor MCP 配置已更新:', configPath);
        vscode.window.showInformationMessage('已自動更新 Cursor MCP 配置');
        
    } catch (error) {
        console.error('更新 Cursor MCP 配置失敗:', error);
        // 不要阻止服務器啟動
    }
}

async function removeCursorMCPConfig(): Promise<void> {
    try {
        const configPath = path.join(os.homedir(), '.cursor', 'mcp.json');
        
        if (!fs.existsSync(configPath)) {
            return;
        }
        
        const content = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        
        if (config.servers && config.servers['vscode-commands']) {
            delete config.servers['vscode-commands'];
            
            // 如果 servers 對象為空，也刪除它
            if (Object.keys(config.servers).length === 0) {
                delete config.servers;
            }
            
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
            console.log('已從 Cursor MCP 配置中移除 vscode-commands');
        }
    } catch (error) {
        console.error('移除 Cursor MCP 配置失敗:', error);
    }
}
