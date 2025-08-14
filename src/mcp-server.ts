import * as vscode from 'vscode';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { z } from 'zod';
import { MCPServerConfig, CommandExecutionResult, LogContext } from './types';
import { VSCodeCommandsTools } from './tools/vscode-commands';

export class MCPVSCodeServer {
    private mcpServer: McpServer;
    private transport: StdioServerTransport | undefined;
    private config: MCPServerConfig;
    private tools: VSCodeCommandsTools;

    constructor(config: MCPServerConfig) {
        this.config = config;
        
        // 初始化 MCP 服務器
        this.mcpServer = new McpServer({
            name: 'mcp-vscode-commands',
            version: '0.1.0'
        });

        // 初始化工具集
        this.tools = new VSCodeCommandsTools(this.config);
        
        // 註冊工具
        this.registerTools();
        
        this.log('info', 'MCP VSCode Server 已初始化');
    }

    private registerTools(): void {
        // 註冊 executeCommand 工具
        this.mcpServer.registerTool(
            'vscode.executeCommand',
            {
                title: 'Execute VSCode Command',
                description: '執行指定的 VSCode 命令',
                inputSchema: {
                    commandId: z.string().describe('要執行的命令 ID'),
                    args: z.array(z.any()).optional().describe('命令參數（可選）')
                }
            },
            async ({ commandId, args = [] }: { commandId: string; args?: any[] }) => {
                this.log('info', '執行命令', { command: commandId, args });
                const result = await this.tools.executeCommand(commandId, args);
                return this.formatToolResult(result);
            }
        );

        // 註冊 listCommands 工具
        this.mcpServer.registerTool(
            'vscode.listCommands',
            {
                title: 'List VSCode Commands',
                description: '列出所有可用的 VSCode 命令',
                inputSchema: {
                    filter: z.string().optional().describe('過濾字串（可選）')
                }
            },
            async ({ filter }: { filter?: string }) => {
                this.log('info', '列出命令', { filter });
                const result = await this.tools.listCommands(filter);
                return this.formatToolResult(result);
            }
        );

        this.log('info', '所有工具已註冊完成');
    }

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
                    text: `❌ 錯誤: ${result.error}`
                }],
                isError: true
            };
        }
    }

    private formatSuccessResult(result: any): string {
        if (result === undefined || result === null) {
            return '✅ 命令執行成功';
        }

        if (Array.isArray(result)) {
            if (result.length === 0) {
                return '✅ 命令執行成功，返回空陣列';
            }
            
            // 如果是命令列表，格式化顯示
            if (typeof result[0] === 'string') {
                return `✅ 找到 ${result.length} 個命令:\n${result.slice(0, 20).map(cmd => `• ${cmd}`).join('\n')}${result.length > 20 ? `\n... 還有 ${result.length - 20} 個命令` : ''}`;
            }
            
            return `✅ 命令執行成功，返回陣列 (${result.length} 項):\n${JSON.stringify(result, null, 2)}`;
        }

        if (typeof result === 'string') {
            return `✅ 命令執行成功: ${result}`;
        }

        if (typeof result === 'object') {
            return `✅ 命令執行成功:\n${JSON.stringify(result, null, 2)}`;
        }

        return `✅ 命令執行成功: ${String(result)}`;
    }

    async start(): Promise<void> {
        try {
            // 建立 stdio transport
            this.transport = new StdioServerTransport();
            
            // 連接到 transport
            await this.mcpServer.connect(this.transport);
            
            this.log('info', 'MCP 服務器已啟動，等待連接...');
        } catch (error) {
            this.log('error', '啟動 MCP 服務器失敗', { error: String(error) });
            throw error;
        }
    }

    close(): void {
        try {
            if (this.transport) {
                // Note: 根據 SDK 文檔，transport 會在服務器關閉時自動清理
                this.transport = undefined;
            }
            
            this.log('info', 'MCP 服務器已關閉');
        } catch (error) {
            this.log('error', '關閉 MCP 服務器時發生錯誤', { error: String(error) });
        }
    }

    private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, context?: Partial<LogContext>): void {
        // 檢查是否應該記錄這個級別
        const levels = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.config.logLevel);
        const messageLevelIndex = levels.indexOf(level);
        
        if (messageLevelIndex < currentLevelIndex) {
            return;
        }

        const logContext: LogContext = {
            timestamp: new Date().toISOString(),
            ...context
        };

        const logMessage = `[MCP-VSCode] ${message}`;
        
        switch (level) {
            case 'debug':
                console.debug(logMessage, logContext);
                break;
            case 'info':
                console.log(logMessage, logContext);
                break;
            case 'warn':
                console.warn(logMessage, logContext);
                break;
            case 'error':
                console.error(logMessage, logContext);
                break;
        }
    }
}
