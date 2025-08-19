#!/usr/bin/env node

/**
 * VS Code MCP Stdio Server
 * 
 * 基於 stdio transport 的 MCP 服務器實作
 * 替代原有的 SSE-based 實作
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
} from '@modelcontextprotocol/sdk/types.js';
import * as vscode from 'vscode';
import { VSCodeCommandsTools } from './tools/vscode-commands.js';
import { CommandExecutionResult, MCPServerConfig } from './types.js';

/**
 * MCP Stdio Server 主類別
 */
class MCPStdioServer {
    private server: Server;
    private tools: VSCodeCommandsTools;
    private config: MCPServerConfig;

    constructor() {
        this.config = this.getConfig();
        this.tools = new VSCodeCommandsTools(this.config);
        
        // 創建 MCP server 實例
        this.server = new Server({
            name: 'mcp-vscode-commands',
            version: this.getVersion()
        });

        this.setupHandlers();
        this.setupErrorHandling();
    }

    /**
     * 獲取配置
     */
    private getConfig(): MCPServerConfig {
        return {
            autoStart: false, // stdio mode 不需要 autoStart
            logLevel: (process.env.VSCODE_COMMANDS_MCP_LOG_LEVEL as any) || 'info'
        };
    }

    /**
     * 獲取版本資訊
     */
    private getVersion(): string {
        try {
            // 嘗試從環境變數或 package.json 獲取版本
            return process.env.VSCODE_COMMANDS_MCP_VERSION || '0.1.3';
        } catch {
            return '0.1.3';
        }
    }

    /**
     * 設定 MCP 處理器
     */
    private setupHandlers(): void {
        // 註冊 list_tools 處理器
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            this.log('[Stdio Server] Handling list_tools request');
            
            return {
                tools: [
                    {
                        name: 'vscode.executeCommand',
                        description: 'Execute a VS Code command with optional arguments',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                commandId: {
                                    type: 'string',
                                    description: 'The VS Code command ID to execute'
                                },
                                args: {
                                    type: 'array',
                                    description: 'Optional command arguments',
                                    items: {}
                                }
                            },
                            required: ['commandId']
                        }
                    },
                    {
                        name: 'vscode.listCommands',
                        description: 'List all available VS Code commands with optional filtering',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                filter: {
                                    type: 'string',
                                    description: 'Optional filter string to search commands'
                                }
                            }
                        }
                    }
                ]
            };
        });

        // 註冊 call_tool 處理器
        this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
            const { name, arguments: args } = request.params;
            
            this.log(`[Stdio Server] Executing tool: ${name}`, args);

            try {
                if (name === 'vscode.executeCommand') {
                    const { commandId, args: commandArgs = [] } = args as { 
                        commandId: string; 
                        args?: any[] 
                    };
                    
                    const result = await this.tools.executeCommand(commandId, commandArgs);
                    return this.formatToolResult(result);
                    
                } else if (name === 'vscode.listCommands') {
                    const { filter } = args as { filter?: string };
                    
                    const result = await this.tools.listCommands(filter);
                    return this.formatToolResult(result);
                    
                } else {
                    this.logError(`[Stdio Server] Unknown tool: ${name}`);
                    return {
                        content: [{
                            type: 'text' as const,
                            text: `❌ Error: Unknown tool '${name}'`
                        }],
                        isError: true
                    };
                }
            } catch (error) {
                this.logError('[Stdio Server] Tool execution error:', error);
                return {
                    content: [{
                        type: 'text' as const,
                        text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        });
    }

    /**
     * 設定錯誤處理
     */
    private setupErrorHandling(): void {
        // 處理未捕獲的錯誤
        process.on('uncaughtException', (error) => {
            this.logError('[Stdio Server] Uncaught exception:', error);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.logError('[Stdio Server] Unhandled rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

        // 處理程序退出信號
        process.on('SIGINT', () => {
            this.log('[Stdio Server] Received SIGINT, shutting down gracefully');
            this.shutdown();
        });

        process.on('SIGTERM', () => {
            this.log('[Stdio Server] Received SIGTERM, shutting down gracefully');
            this.shutdown();
        });
    }

    /**
     * 格式化工具執行結果
     */
    private formatToolResult(result: CommandExecutionResult) {
        if (result.success) {
            return {
                content: [{
                    type: 'text' as const,
                    text: this.formatSuccessResult(result.result)
                }]
            };
        } else {
            return {
                content: [{
                    type: 'text' as const,
                    text: `❌ Error: ${result.error}`
                }],
                isError: true
            };
        }
    }

    /**
     * 格式化成功結果
     */
    private formatSuccessResult(result: any): string {
        if (result === undefined || result === null) {
            return '✅ Command executed successfully';
        }

        if (Array.isArray(result)) {
            if (result.length === 0) {
                return '✅ Command executed successfully, returned empty array';
            }
            
            if (typeof result[0] === 'string') {
                return `✅ Found ${result.length} commands:\n${result.slice(0, 20).map(cmd => `• ${cmd}`).join('\n')}${result.length > 20 ? `\n... and ${result.length - 20} more commands` : ''}`;
            }
            
            return `✅ Command executed successfully, returned array (${result.length} items):\n${JSON.stringify(result, null, 2)}`;
        }

        if (typeof result === 'string') {
            return `✅ Command executed successfully: ${result}`;
        }

        if (typeof result === 'object') {
            return `✅ Command executed successfully:\n${JSON.stringify(result, null, 2)}`;
        }

        return `✅ Command executed successfully: ${String(result)}`;
    }

    /**
     * 日誌記錄
     */
    private log(message: string, ...args: any[]): void {
        if (this.config.logLevel === 'debug' || this.config.logLevel === 'info') {
            console.error(message, ...args); // 使用 stderr 避免干擾 stdio 通信
        }
    }

    /**
     * 錯誤日誌記錄
     */
    private logError(message: string, ...args: any[]): void {
        console.error(message, ...args); // stderr 是安全的
    }

    /**
     * 啟動服務器
     */
    async start(): Promise<void> {
        this.log('[Stdio Server] Starting MCP stdio server...');

        // 創建 stdio transport
        const transport = new StdioServerTransport();
        
        try {
            // 連接服務器到 transport
            await this.server.connect(transport);
            this.log('[Stdio Server] MCP stdio server started and connected');
            
        } catch (error) {
            this.logError('[Stdio Server] Failed to start server:', error);
            throw error;
        }
    }

    /**
     * 優雅關閉
     */
    private shutdown(): void {
        this.log('[Stdio Server] Shutting down...');
        process.exit(0);
    }
}

/**
 * 主入口點
 */
async function main() {
    try {
        const server = new MCPStdioServer();
        await server.start();
        
        // 保持進程運行
        process.stdin.resume();
        
    } catch (error) {
        console.error('[Stdio Server] Failed to start:', error);
        process.exit(1);
    }
}

// 如果作為主模組運行，啟動服務器
if (require.main === module) {
    main().catch((error) => {
        console.error('[Stdio Server] Fatal error:', error);
        process.exit(1);
    });
}

export { MCPStdioServer };
