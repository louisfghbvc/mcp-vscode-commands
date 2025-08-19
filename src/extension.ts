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
 * 使用 Cursor MCP Extension API 註冊 stdio 服務器
 */
function registerStdioServer(context: vscode.ExtensionContext): void {
    try {
        // 檢查 Cursor MCP API 是否可用
        if (!vscode.cursor?.mcp?.registerServer) {
            console.warn('[MCP Extension] Cursor MCP API 不可用，嘗試回退到內建模式');
            
            // 回退到內建模式 - 在 extension 環境中直接運行 stdio 服務器
            startInternalStdioServer(context);
            
            console.log('[MCP Extension] 🔸 Cursor API 不可用，已啟用內建回退模式');
            return;
        }

        // 使用 Cursor 官方 API 註冊 stdio 服務器
        const serverConfig: vscode.cursor.mcp.StdioServerConfig = {
            name: 'vscode-commands',
            server: {
                command: 'node',
                args: [path.join(context.extensionPath, 'out', 'mcp-stdio-server-standalone.js')],
                env: {
                    'NODE_ENV': 'production',
                    'VSCODE_COMMANDS_MCP': 'true',
                    'EXTENSION_PATH': context.extensionPath
                }
            }
        };

        vscode.cursor.mcp.registerServer(serverConfig);
        
        console.log('[MCP Extension] ✅ 已使用 Cursor MCP API 註冊 stdio 服務器:', serverConfig);
        
        console.log('[MCP Extension] 🎉 Stdio MCP 服務器已自動註冊到 Cursor');
        
    } catch (error) {
        console.error('[MCP Extension] 使用 Cursor API 註冊失敗:', error);
        
        // 嘗試回退到內建模式
        try {
            startInternalStdioServer(context);
            vscode.window.showWarningMessage(
                `⚠️ Cursor API 註冊失敗，已啟用內建模式。\n錯誤: ${error instanceof Error ? error.message : String(error)}`
            );
        } catch (fallbackError) {
            vscode.window.showErrorMessage(
                `❌ MCP 服務器啟動失敗: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
            );
        }
    }
}

/**
 * 啟動內建 stdio 服務器（回退模式）
 */
async function startInternalStdioServer(context: vscode.ExtensionContext): Promise<void> {
    try {
        if (mcpStdioServer) {
            console.log('[MCP Extension] Stdio 服務器已在運行中');
            return;
        }

        const config = getConfig();
        mcpStdioServer = new MCPStdioServer(config, context);
        
        // 在 extension 環境中啟動 stdio 服務器
        await mcpStdioServer.start();
        
        console.log('[MCP Extension] ✅ 內建 Stdio 服務器已啟動');
        
    } catch (error) {
        console.error('[MCP Extension] 內建服務器啟動失敗:', error);
        throw error;
    }
}

/**
 * 取消註冊 stdio 服務器
 */
function unregisterStdioServer(): void {
    try {
        // 檢查 Cursor MCP API 是否可用
        if (!vscode.cursor?.mcp?.unregisterServer) {
            console.warn('[MCP Extension] Cursor MCP API 不可用，跳過自動取消註冊');
            return;
        }

        vscode.cursor.mcp.unregisterServer('vscode-commands');
        
        console.log('[MCP Extension] ✅ 已使用 Cursor MCP API 取消註冊服務器');
        
    } catch (error) {
        console.error('[MCP Extension] 使用 Cursor API 取消註冊失敗:', error);
        // 不要阻止擴展停用
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
    const config = getConfig();
    const extensionConfig = getExtensionConfig();
    diagnostics.push(`⚙️  自動啟動: ${extensionConfig.autoStart ? '✅' : '❌'}`);
    diagnostics.push(`📝 日誌等級: ${config.logLevel}`);
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