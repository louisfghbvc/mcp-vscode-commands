import * as vscode from 'vscode';
import * as path from 'path';
import { MCPStdioServer } from './mcp-stdio-server';
import { MCPServerConfig } from './types';


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

let mcpStdioServer: MCPStdioServer | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('[MCP Extension] 🚀 啟動 Cursor MCP Stdio 擴展...');
    
    try {

        // 註冊管理命令
        registerManagementCommands(context);
        
        // 檢查是否應該自動啟動
        const extensionConfig = getExtensionConfig();
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

export function deactivate() {
    console.log('[MCP Extension] 正在停用擴展...');
    
    try {
        // 取消註冊 MCP 服務器
        unregisterStdioServer();
        
        // 清理 stdio 服務器實例
        if (mcpStdioServer) {
            mcpStdioServer.stop();
            mcpStdioServer = undefined;
        }
        
        console.log('[MCP Extension] ✅ 擴展已停用');
    } catch (error) {
        console.error('[MCP Extension] 停用過程中發生錯誤:', error);
    }
}

/**
 * 啟動內嵌式 MCP 服務器（直接在 extension 內運行）
 */
async function registerStdioServer(context: vscode.ExtensionContext): Promise<void> {
    try {
        // 創建內嵌式 MCP 服務器，確保能夠訪問 VS Code API
        mcpStdioServer = MCPStdioServer.createInProcessServer(context);
        
        // 啟動服務器
        await mcpStdioServer.start();
        
        console.log('[MCP Extension] ✅ 內嵌式 MCP 服務器已啟動，可完整訪問 VS Code API');
        
        // 等待橋接服務器啟動並獲取端口
        const bridgePort = await waitForBridgePort(mcpStdioServer);
        
        // 創建橋接程序以供 Cursor 發現和使用
        await createStdioBridge(context, bridgePort);
        
        vscode.window.showInformationMessage('🎉 MCP VSCode Commands 已啟動 (內嵌模式 + Cursor 橋接)');
        
    } catch (error) {
        console.error('[MCP Extension] MCP 服務器啟動失敗:', error);
        vscode.window.showErrorMessage(
            `❌ MCP 服務器啟動失敗: ${error instanceof Error ? error.message : String(error)}`
        );
        throw error;
    }
}

// 移除不必要的回退模式函數 - 現在統一使用 registerStdioServer 的內嵌模式

/**
 * 停止內嵌式 MCP 服務器
 */
function unregisterStdioServer(): void {
    try {
        if (mcpStdioServer) {
            mcpStdioServer.stop();
            mcpStdioServer = undefined;
            console.log('[MCP Extension] ✅ 內嵌式 MCP 服務器已停止');
        }
    } catch (error) {
        console.error('[MCP Extension] 停止 MCP 服務器失敗:', error);
        // 不要阻止擴展停用
    }
}

/**
 * 創建 stdio 橋接程序以供 Cursor 發現和使用
 */
async function createStdioBridge(context: vscode.ExtensionContext, bridgePort: number): Promise<void> {
    try {
        const bridgeScript = `#!/usr/bin/env node

/**
 * Stdio Bridge for MCP VSCode Commands
 * 
 * This lightweight bridge connects Cursor's MCP API to the
 * MCP server running within the VS Code extension.
 */

const net = require('net');

// Bridge configuration - port will be passed from server
const BRIDGE_PORT = bridgePort; // Auto-assigned port from server
const TIMEOUT = 10000; // 10 seconds timeout
const RETRY_ATTEMPTS = 5;
const RETRY_DELAY = 1000; // 1 second

class StdioBridge {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.retryCount = 0;
        this.setupStdioForwarding();
    }

    async setupStdioForwarding() {
        await this.connectWithRetry();
    }

    async connectWithRetry() {
        while (this.retryCount < RETRY_ATTEMPTS && !this.isConnected) {
            try {
                await this.connectToExtension();
                break;
            } catch (error) {
                this.retryCount++;
                if (this.retryCount >= RETRY_ATTEMPTS) {
                    console.error('[Bridge] ❌ Failed to connect after ' + RETRY_ATTEMPTS + ' attempts');
                    process.exit(1);
                } else {
                    console.error('[Bridge] ⚠️ Connection attempt ' + this.retryCount + ' failed, retrying...');
                    await this.sleep(RETRY_DELAY);
                }
            }
        }
    }

    connectToExtension() {
        return new Promise((resolve, reject) => {
            this.client = net.createConnection(BRIDGE_PORT, 'localhost');
            
            this.client.on('connect', () => {
                console.error('[Bridge] ✅ Connected to extension MCP server');
                this.isConnected = true;
                this.setupBidirectionalForwarding();
                resolve();
            });
            
            this.client.on('error', (error) => {
                reject(error);
            });
            
            this.client.on('close', () => {
                if (this.isConnected) {
                    console.error('[Bridge] Connection closed');
                    process.exit(0);
                }
            });
            
            setTimeout(() => {
                if (!this.isConnected) {
                    reject(new Error('Connection timeout'));
                }
            }, TIMEOUT);
        });
    }

    setupBidirectionalForwarding() {
        if (!this.client) return;

        // Forward stdin to extension
        process.stdin.pipe(this.client);
        
        // Forward extension responses to stdout
        this.client.pipe(process.stdout);
        
        // Handle termination - only for bridge script, not extension
        process.stdin.on('end', () => {
            process.exit(0);
        });
        
        process.on('SIGTERM', () => {
            this.cleanup();
            process.exit(0);
        });
        
        process.on('SIGINT', () => {
            this.cleanup();
            process.exit(0);
        });
    }

    cleanup() {
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the bridge
new StdioBridge();
`;

        const bridgePath = path.join(context.extensionPath, 'out', 'stdio-bridge.js');
        
        // 確保目錄存在
        const outDir = path.dirname(bridgePath);
        if (!require('fs').existsSync(outDir)) {
            require('fs').mkdirSync(outDir, { recursive: true });
        }
        
        // 寫入橋接腳本
        require('fs').writeFileSync(bridgePath, bridgeScript);
        
        console.log('[MCP Extension] 📁 Stdio 橋接程序已創建:', bridgePath);
        console.log('[MCP Extension] 🌉 橋接端口:', bridgePort);
        
        // 嘗試使用 Cursor API 註冊橋接程序
        if (vscode.cursor?.mcp?.registerServer) {
            try {
                const serverConfig: vscode.cursor.mcp.StdioServerConfig = {
                    name: 'vscode-commands',
                    server: {
                        command: 'node',
                        args: [bridgePath],
                        env: {
                            'NODE_ENV': 'production',
                            'VSCODE_COMMANDS_MCP': 'true',
                            'EXTENSION_PATH': context.extensionPath
                        }
                    }
                };

                vscode.cursor.mcp.registerServer(serverConfig);
                console.log('[MCP Extension] 🌉 已透過 Cursor API 註冊橋接程序');
                
            } catch (cursorError) {
                console.warn('[MCP Extension] ⚠️ Cursor API 註冊失敗，但內嵌服務器仍正常運行:', cursorError);
            }
        } else {
            console.log('[MCP Extension] 💡 Cursor API 不可用，請手動配置 MCP server:');
            console.log('[MCP Extension] 📋 配置範例:');
            console.log('  {');
            console.log('    "name": "vscode-commands",');
            console.log('    "command": "node",');
            console.log('    "args": ["' + bridgePath + '"]');
            console.log('  }');
        }
        
    } catch (error) {
        console.error('[MCP Extension] ❌ 創建橋接程序失敗:', error);
        // 繼續運行，橋接不是核心功能
    }
}

/**
 * 等待橋接服務器啟動並獲取自動分配的端口
 */
async function waitForBridgePort(mcpServer: MCPStdioServer, maxWaitMs: number = 5000): Promise<number> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
        const port = mcpServer.getBridgePort();
        if (port > 0) {
            console.log('[MCP Extension] ✅ 橋接端口已分配:', port);
            return port;
        }
        
        // 等待 100ms 後重試
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error('等待橋接端口分配超時');
}

// 移除舊的 getConfig 函數，使用 getExtensionConfig 代替

/**
 * 獲取擴展配置
 */
function getExtensionConfig(): { autoStart: boolean; enableDiagnostics: boolean } {
    const vscodeConfig = vscode.workspace.getConfiguration('mcpVscodeCommands');
    return {
        autoStart: vscodeConfig.get<boolean>('autoStart', true),
        enableDiagnostics: vscodeConfig.get<boolean>('enableDiagnostics', false)
    };
}

/**
 * 註冊管理命令
 */
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

    // 顯示診斷資訊命令
    const diagnosticsCommand = vscode.commands.registerCommand('mcp-vscode-commands.diagnostics', () => {
        const extensionConfig = getExtensionConfig();
        const diagnostics = getDiagnostics(extensionConfig.enableDiagnostics);
        
        if (extensionConfig.enableDiagnostics) {
            // 詳細診斷模式
            vscode.window.showInformationMessage(
                `📊 MCP 服務器詳細診斷資訊:\n\n${diagnostics}`,
                { modal: true }
            );
        } else {
            // 簡化診斷模式
            vscode.window.showInformationMessage(diagnostics);
        }
    });

    context.subscriptions.push(restartCommand, diagnosticsCommand);
}

/**
 * 獲取診斷資訊
 */
function getDiagnostics(enableDetailedDiagnostics: boolean = false): string {
    const diagnostics = [];
    
    // Cursor API 可用性
    const cursorApiAvailable = !!(vscode.cursor?.mcp?.registerServer);
    diagnostics.push(`🔌 Cursor MCP API: ${cursorApiAvailable ? '✅ 可用' : '❌ 不可用'}`);
    
    // 內建服務器狀態
    const internalServerRunning = mcpStdioServer !== undefined;
    diagnostics.push(`🖥️  內建服務器: ${internalServerRunning ? '✅ 運行中' : '⭕ 已停止'}`);
    
    // 服務器健康狀態
    if (mcpStdioServer) {
        try {
            const health = mcpStdioServer.getHealth();
            diagnostics.push(`📈 服務器狀態: ${health.status}`);
            diagnostics.push(`⏱️  運行時間: ${health.uptime.toFixed(2)}s`);
            diagnostics.push(`💾 記憶體使用: ${(health.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
        } catch (error) {
            diagnostics.push(`⚠️  健康檢查失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    
    // 配置資訊
    const extensionConfig = getExtensionConfig();
    diagnostics.push(`⚙️  自動啟動: ${extensionConfig.autoStart ? '✅' : '❌'}`);
    diagnostics.push(`📝 日誌等級: info`); // 預設日誌等級
    diagnostics.push(`🔍 詳細診斷: ${extensionConfig.enableDiagnostics ? '✅' : '❌'}`);
    
    // 如果啟用詳細診斷，添加更多技術資訊
    if (enableDetailedDiagnostics) {
        const nodeVersion = process.version;
        const platform = process.platform;
        const arch = process.arch;
        diagnostics.push(`\n--- 詳細系統資訊 ---`);
        diagnostics.push(`🖥️  平台: ${platform} (${arch})`);
        diagnostics.push(`📦 Node.js: ${nodeVersion}`);
        diagnostics.push(`🔧 VSCode API: ${vscode.version || 'N/A'}`);
        
        if (mcpStdioServer) {
            try {
                const health = mcpStdioServer.getHealth();
                diagnostics.push(`\n--- 服務器詳細狀態 ---`);
                diagnostics.push(`🔄 CPU 使用: ${(health.memoryUsage.heapUsed / health.memoryUsage.heapTotal * 100).toFixed(1)}%`);
                diagnostics.push(`📚 堆積大小: ${(health.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`);
                diagnostics.push(`🗂️  外部記憶體: ${(health.memoryUsage.external / 1024 / 1024).toFixed(2)}MB`);
            } catch (error) {
                diagnostics.push(`⚠️  詳細狀態獲取失敗: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    }
    
    return diagnostics.join('\n');
}