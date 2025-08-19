#!/usr/bin/env node

/**
 * Standalone Stdio MCP Server
 * 
 * This is a standalone version of the MCP server that can be launched
 * by Cursor's MCP Extension API. It provides a bridge to the main extension
 * for actual VSCode command execution.
 */

import * as path from 'path';
import * as fs from 'fs';
import { MCPServerConfig, CommandExecutionResult } from './types';

// Dynamic imports for ES modules
let Server: any;
let StdioServerTransport: any;
let CallToolRequestSchema: any;
let ListToolsRequestSchema: any;

class StandaloneMCPServer {
    private server: any;
    private config: MCPServerConfig;
    private initialized: boolean = false;

    constructor() {
        this.config = {
            autoStart: true,
            logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
        };
    }

    /**
     * Load ES modules dynamically
     */
    private async loadESModules(): Promise<void> {
        if (this.initialized) return;
        
        try {
            // Use eval to prevent TypeScript from converting import() to require()
            const dynamicImport = eval('(specifier) => import(specifier)');
            
            const serverModule = await dynamicImport('@modelcontextprotocol/sdk/server/index.js');
            const stdioModule = await dynamicImport('@modelcontextprotocol/sdk/server/stdio.js');
            const typesModule = await dynamicImport('@modelcontextprotocol/sdk/types.js');
            
            Server = serverModule.Server;
            StdioServerTransport = stdioModule.StdioServerTransport;
            CallToolRequestSchema = typesModule.CallToolRequestSchema;
            ListToolsRequestSchema = typesModule.ListToolsRequestSchema;
            
            this.initialized = true;
            this.log('[Standalone MCP] ES modules loaded successfully');
        } catch (error) {
            console.error('[Standalone MCP] Failed to load ES modules:', error);
            throw error;
        }
    }

    /**
     * Start the standalone MCP server
     */
    async start(): Promise<void> {
        try {
            // Load ES modules first
            await this.loadESModules();
            
            // Create MCP server instance
            this.server = new Server({
                name: 'mcp-vscode-commands',
                version: '0.2.0'
            });

            // Setup error handling
            this.setupErrorHandling();

            // Register handlers
            this.registerHandlers();

            // Create stdio transport
            const transport = new StdioServerTransport();
            
            // Connect server to transport
            await this.server.connect(transport);
            
            this.log('[Standalone MCP] ✅ Server connected and ready');
            this.log('[Standalone MCP] 🚀 Stdio transport active');
            
        } catch (error) {
            console.error('[Standalone MCP] ❌ Failed to start server:', error);
            throw error;
        }
    }

    /**
     * Setup error handling
     */
    private setupErrorHandling(): void {
        if (!this.server) return;

        this.server.onerror = (error: Error) => {
            console.error('[Standalone MCP] Server error:', error);
        };

        // Handle process signals for graceful shutdown
        process.on('SIGINT', () => {
            this.log('[Standalone MCP] Received SIGINT, shutting down gracefully...');
            process.exit(0);
        });

        process.on('SIGTERM', () => {
            this.log('[Standalone MCP] Received SIGTERM, shutting down gracefully...');
            process.exit(0);
        });
    }

    /**
     * Register MCP request handlers
     */
    private registerHandlers(): void {
        if (!this.server) return;

        // Register list_tools handler
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            this.log('[Standalone MCP] 📋 Handling list_tools request');
            
            return {
                tools: [
                    {
                        name: 'vscode.executeCommand',
                        description: '執行指定的 VSCode 命令（需要 Extension 支援）',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                commandId: {
                                    type: 'string',
                                    description: '要執行的命令 ID'
                                },
                                args: {
                                    type: 'array',
                                    description: '命令參數（可選）',
                                    items: {}
                                }
                            },
                            required: ['commandId']
                        }
                    },
                    {
                        name: 'vscode.listCommands',
                        description: '列出所有可用的 VSCode 命令（需要 Extension 支援）',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                filter: {
                                    type: 'string',
                                    description: '過濾字串（可選）'
                                }
                            }
                        }
                    }
                ]
            };
        });

        // Register call_tool handler
        this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
            const { name, arguments: args } = request.params;
            
            this.log(`[Standalone MCP] 🔧 Executing tool: ${name}`, args);

            try {
                const startTime = performance.now();
                let result: CommandExecutionResult;

                // For now, return a placeholder response indicating that full VSCode integration
                // is available through the extension
                if (name === 'vscode.executeCommand') {
                    const { commandId } = args as { commandId: string };
                    result = {
                        success: false,
                        error: `⚠️  獨立模式限制: 無法執行 VSCode 命令 '${commandId}'。\n\n` +
                               `💡 解決方案: 請確保在 VS Code/Cursor 中安裝了 MCP VSCode Commands 擴展，\n` +
                               `   該擴展會提供完整的 VSCode 命令執行功能。\n\n` +
                               `🔧 Stdio 模式已就緒，等待 Extension 整合...`
                    };
                } else if (name === 'vscode.listCommands') {
                    result = {
                        success: false,
                        error: `⚠️  獨立模式限制: 無法列出 VSCode 命令。\n\n` +
                               `💡 解決方案: 請確保在 VS Code/Cursor 中安裝了 MCP VSCode Commands 擴展。\n\n` +
                               `📋 可用的預設命令包括:\n` +
                               `   • editor.action.formatDocument\n` +
                               `   • workbench.action.quickOpen\n` +
                               `   • workbench.action.files.save\n` +
                               `   • ... 以及更多`
                    };
                } else {
                    throw new Error(`未知的工具: ${name}`);
                }

                const duration = performance.now() - startTime;
                this.log(`[Standalone MCP] ⚡ Tool request processed in ${duration.toFixed(2)}ms`);

                return this.formatToolResult(result);
            } catch (error) {
                console.error('[Standalone MCP] Tool execution error:', error);
                return {
                    content: [{
                        type: 'text' as const,
                        text: `❌ 錯誤: ${error instanceof Error ? error.message : String(error)}`
                    }],
                    isError: true
                };
            }
        });
    }

    /**
     * Format tool execution result
     */
    private formatToolResult(result: CommandExecutionResult) {
        if (result.success) {
            return {
                content: [{
                    type: 'text' as const,
                    text: `✅ ${String(result.result)}`
                }]
            };
        } else {
            return {
                content: [{
                    type: 'text' as const,
                    text: `❌ ${result.error}`
                }],
                isError: true
            };
        }
    }

    /**
     * Logging utility
     */
    private log(message: string, data?: any): void {
        if (this.config.logLevel === 'debug' || process.env.NODE_ENV === 'development') {
            const timestamp = new Date().toISOString();
            console.error(`${timestamp} ${message}`, data || '');
        }
    }
}

// Main entry point for standalone process
if (require.main === module) {
    console.error('[Standalone MCP] 🚀 Starting VSCode Commands MCP Server (Standalone Stdio)');
    console.error('[Standalone MCP] 📡 Waiting for VS Code Extension integration...');
    
    const server = new StandaloneMCPServer();
    
    server.start().catch(error => {
        console.error('[Standalone MCP] ❌ Fatal error during startup:', error);
        process.exit(1);
    });
}
