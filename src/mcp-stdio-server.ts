import * as vscode from 'vscode';
import { MCPServerConfig, CommandExecutionResult } from './types';
import { VSCodeCommandsTools } from './tools/vscode-commands';
import * as path from 'path';
import * as net from 'net';
// import { spawn, ChildProcess } from 'child_process'; // 不再需要獨立進程

// Dynamic imports for ES modules
let Server: any;
let StdioServerTransport: any;
let CallToolRequestSchema: any;
let ListToolsRequestSchema: any;

/**
 * High-performance Stdio-based MCP Server
 * 
 * This server runs within the VS Code extension environment and uses stdio transport
 * for communication with Cursor AI, providing better performance than HTTP/SSE transport.
 * 
 * Unlike the SSE version, this server is launched as a separate process by the extension
 * using Cursor's MCP Extension API, but it maintains access to VSCode APIs through the
 * extension environment.
 */
export class MCPStdioServer {
    private server: any;
    private tools: VSCodeCommandsTools;
    private config: MCPServerConfig;
    private initialized: boolean = false;
    private extensionContext: vscode.ExtensionContext | undefined;
    private startTime: number = 0;
    private bridgeServer: net.Server | null = null;
    private bridgePort: number = 0; // 0 = auto-assign available port

    constructor(config?: MCPServerConfig, context?: vscode.ExtensionContext) {
        this.config = config || this.getDefaultConfig();
        this.extensionContext = context;
        this.tools = new VSCodeCommandsTools(this.config);
    }

    /**
     * Load ES modules dynamically to avoid TypeScript compilation issues
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
            this.log('[MCP-Stdio] ES modules loaded successfully');
        } catch (error) {
            console.error('[MCP-Stdio] Failed to load ES modules:', error);
            throw error;
        }
    }

    /**
     * Start the stdio MCP server
     */
    async start(): Promise<void> {
        try {
            // Load ES modules first
            await this.loadESModules();
            
            // Create MCP server instance
            this.server = new Server({
                name: 'mcp-vscode-commands',
                version: this.getVersion()
            });

            // Setup error handling
            this.setupErrorHandling();

            // Register handlers
            this.registerHandlers();

            // Create stdio transport
            const transport = new StdioServerTransport();
            
            // Connect server to transport
            await this.server.connect(transport);
            
            this.initialized = true;
            this.startTime = Date.now();
            
            // Start bridge server for Cursor integration
            await this.startBridgeServer();
            
            this.log('[MCP-Stdio] ✅ Server connected and ready');
            this.log('[MCP-Stdio] 🚀 High-performance stdio transport active');
            this.log('[MCP-Stdio] 📡 Direct VSCode API access enabled');
            this.log('[MCP-Stdio] 🌉 Bridge server running on port', this.bridgePort);
            
        } catch (error) {
            console.error('[MCP-Stdio] ❌ Failed to start server:', error);
            throw error;
        }
    }

    /**
     * Create in-process stdio server for direct extension integration
     * This server runs within the extension process and has full access to VS Code API
     */
    static createInProcessServer(context: vscode.ExtensionContext): MCPStdioServer {
        // 創建預設配置
        const config: MCPServerConfig = {
            autoStart: true,
            logLevel: 'info'
        };
        const server = new MCPStdioServer(config, context);
        return server;
    }

    /**
     * Setup error handling for the server
     */
    private setupErrorHandling(): void {
        if (!this.server) return;

        // Simple error handling
        this.server.onerror = (error: Error) => {
            console.error('[MCP-Stdio] Server error:', error);
        };
    }

    /**
     * Register MCP request handlers
     */
    private registerHandlers(): void {
        if (!this.server) return;

        // Register list_tools handler
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            this.log('[MCP-Stdio] 📋 Handling list_tools request');
            
            return {
                tools: [
                    {
                        name: 'vscode.executeCommand',
                        description: '執行指定的 VSCode 命令',
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
                        description: '列出所有可用的 VSCode 命令',
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
            
            this.log(`[MCP-Stdio] 🔧 Executing tool: ${name}`, args);

            try {
                const startTime = performance.now();
                let result: CommandExecutionResult;

                if (name === 'vscode.executeCommand') {
                    const { commandId, args: commandArgs = [] } = args as { commandId: string; args?: any[] };
                    result = await this.tools.executeCommand(commandId, commandArgs);
                } else if (name === 'vscode.listCommands') {
                    const { filter } = args as { filter?: string };
                    result = await this.tools.listCommands(filter);
                } else {
                    throw new Error(`未知的工具: ${name}`);
                }

                const duration = performance.now() - startTime;
                this.log(`[MCP-Stdio] ⚡ Tool execution completed in ${duration.toFixed(2)}ms`);

                return this.formatToolResult(result);
            } catch (error) {
                console.error('[MCP-Stdio] Tool execution error:', error);
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
     * Format tool execution result for MCP response
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
                    text: `❌ 錯誤: ${result.error}`
                }],
                isError: true
            };
        }
    }

    /**
     * Format successful command execution result
     */
    private formatSuccessResult(result: any): string {
        if (result === undefined || result === null) {
            return '✅ 命令執行成功';
        }

        if (Array.isArray(result)) {
            if (result.length === 0) {
                return '✅ 命令執行成功，返回空陣列';
            }
            
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

    /**
     * Stop the MCP server
     */
    stop(): void {
        if (this.server) {
            try {
                // Note: The server will be automatically cleaned up when the process exits
                this.server = undefined;
                this.log('[MCP-Stdio] ✅ Server stopped');
            } catch (error) {
                console.error('[MCP-Stdio] Error stopping server:', error);
            }
        }
        
        if (this.bridgeServer) {
            this.bridgeServer.close();
            this.bridgeServer = null;
            this.log('[MCP-Stdio] 🛑 Bridge server stopped');
        }
    }

    /**
     * Get server health status
     */
    getHealth(): { status: string; uptime: number; memoryUsage: NodeJS.MemoryUsage } {
        const uptime = this.initialized ? (Date.now() - this.startTime) / 1000 : 0;
        return {
            status: this.initialized ? 'healthy' : 'stopped',
            uptime,
            memoryUsage: process.memoryUsage()
        };
    }

    /**
     * Get default configuration
     */
    private getDefaultConfig(): MCPServerConfig {
        return {
            autoStart: true,
            logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
        };
    }

    /**
     * Get extension version
     */
    private getVersion(): string {
        try {
            // In a real extension, this would get the version from package.json
            return process.env.VSCODE_COMMANDS_VERSION || '0.2.0';
        } catch {
            return '0.2.0';
        }
    }

    /**
     * Logging utility
     */
    private log(message: string, ...args: any[]): void {
        if (this.config.logLevel === 'debug' || this.config.logLevel === 'info') {
            console.log(message, ...args);
        }
    }

    /**
     * Start bridge server for Cursor integration
     */
    private async startBridgeServer(): Promise<void> {
        try {
            this.bridgeServer = net.createServer((socket) => {
                this.log('[MCP-Stdio] 🌉 Bridge client connected');
                
                // Handle bridge communication
                let buffer = '';
                
                socket.on('data', (data) => {
                    buffer += data.toString();
                    
                    // Process complete JSON-RPC messages
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep incomplete line in buffer
                    
                    for (const line of lines) {
                        if (line.trim()) {
                            try {
                                const message = JSON.parse(line);
                                this.handleBridgeMessage(socket, message);
                            } catch (error) {
                                this.log('[MCP-Stdio] ❌ Invalid JSON from bridge:', error);
                            }
                        }
                    }
                });
                
                socket.on('end', () => {
                    this.log('[MCP-Stdio] 🌉 Bridge client disconnected');
                });
                
                socket.on('error', (error) => {
                    this.log('[MCP-Stdio] ❌ Bridge socket error:', error);
                });
            });
            
            this.bridgeServer.listen(0, 'localhost', () => {
                const address = this.bridgeServer?.address();
                if (address && typeof address === 'object') {
                    this.bridgePort = address.port;
                    this.log('[MCP-Stdio] 🌉 Bridge server auto-assigned to port', this.bridgePort);
                }
            });
            
            this.bridgeServer.on('error', (error) => {
                this.log('[MCP-Stdio] ❌ Bridge server error:', error);
                // Auto-port assignment should prevent most conflicts
            });
            
        } catch (error) {
            this.log('[MCP-Stdio] ❌ Failed to start bridge server:', error);
            // Continue without bridge - not critical for basic operation
        }
    }

    /**
     * Handle bridge message by forwarding to appropriate MCP handler
     */
    private async handleBridgeMessage(socket: net.Socket, message: any): Promise<void> {
        try {
            let response: any;
            
            // Handle different MCP request types
            if (message.method === 'tools/list') {
                response = await this.handleListTools();
            } else if (message.method === 'tools/call') {
                response = await this.handleCallTool(message.params);
            } else {
                response = {
                    jsonrpc: '2.0',
                    id: message.id,
                    error: {
                        code: -32601,
                        message: 'Method not found'
                    }
                };
            }
            
            // Add request ID to response
            if (message.id) {
                response.id = message.id;
            }
            
            // Send response back through bridge
            socket.write(JSON.stringify(response) + '\n');
            
        } catch (error) {
            this.log('[MCP-Stdio] ❌ Error handling bridge message:', error);
            
            const errorResponse = {
                jsonrpc: '2.0',
                id: message.id,
                error: {
                    code: -32603,
                    message: 'Internal error',
                    data: error instanceof Error ? error.message : String(error)
                }
            };
            
            socket.write(JSON.stringify(errorResponse) + '\n');
        }
    }

    /**
     * Handle list tools request for bridge
     */
    private async handleListTools(): Promise<any> {
        // Return available VS Code command tools
        return {
            jsonrpc: '2.0',
            result: {
                tools: [
                    {
                        name: 'vscode.executeCommand',
                        description: '執行指定的 VSCode 命令',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                command: {
                                    type: 'string',
                                    description: '要執行的 VSCode 命令 ID'
                                },
                                args: {
                                    type: 'array',
                                    description: '命令參數列表',
                                    items: {}
                                }
                            },
                            required: ['command']
                        }
                    },
                    {
                        name: 'vscode.listCommands',
                        description: '列出所有可用的 VSCode 命令',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                filter: {
                                    type: 'string',
                                    description: '可選的命令過濾器'
                                }
                            }
                        }
                    }
                ]
            }
        };
    }

    /**
     * Get the current bridge port (for extension integration)
     */
    getBridgePort(): number {
        return this.bridgePort;
    }

    /**
     * Handle call tool request for bridge
     */
    private async handleCallTool(params: any): Promise<any> {
        try {
            let result: any;
            
            if (params.name === 'vscode.executeCommand') {
                const { command, args } = params.arguments || {};
                result = await this.tools.executeCommand(command, args || []);
            } else if (params.name === 'vscode.listCommands') {
                const { filter } = params.arguments || {};
                result = await this.tools.listCommands(filter);
            } else {
                throw new Error(`未知的工具: ${params.name}`);
            }
            
            return {
                jsonrpc: '2.0',
                result: {
                    content: [
                        {
                            type: 'text',
                            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                        }
                    ]
                }
            };
        } catch (error) {
            throw new Error(`執行工具失敗: ${error instanceof Error ? error.message : String(error)}`);
        }
    }


}

// This export is used by the extension to create and manage the stdio server
// The server runs within the extension environment for direct VSCode API access

export default MCPStdioServer;
