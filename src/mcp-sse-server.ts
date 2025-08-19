import * as http from 'http';
import * as vscode from 'vscode';
import { MCPServerConfig, CommandExecutionResult } from './types';
import { VSCodeCommandsTools } from './tools/vscode-commands';

// Dynamic imports for ES modules
let Server: any;
let SSEServerTransport: any;
let CallToolRequestSchema: any;
let ListToolsRequestSchema: any;

export class MCPSSEServer {
    private server: any;
    private httpServer: http.Server | undefined;
    private tools: VSCodeCommandsTools;
    private config: MCPServerConfig;
    private port: number = 0; // 0 表示自動分配
    private readonly serverPath = '/mcp/sse';
    private initialized: boolean = false;

    constructor(config: MCPServerConfig) {
        this.config = config;
        this.tools = new VSCodeCommandsTools(this.config);
    }

    private async loadESModules(): Promise<void> {
        if (this.initialized) return;
        
        try {
            // Use eval to prevent TypeScript from converting import() to require()
            const dynamicImport = eval('(specifier) => import(specifier)');
            
            const serverModule = await dynamicImport('@modelcontextprotocol/sdk/server/index.js');
            const sseModule = await dynamicImport('@modelcontextprotocol/sdk/server/sse.js');
            const typesModule = await dynamicImport('@modelcontextprotocol/sdk/types.js');
            
            Server = serverModule.Server;
            SSEServerTransport = sseModule.SSEServerTransport;
            CallToolRequestSchema = typesModule.CallToolRequestSchema;
            ListToolsRequestSchema = typesModule.ListToolsRequestSchema;
            
            this.initialized = true;
            console.error('[MCP-SSE] ES modules loaded'); // stderr is safe
        } catch (error) {
            console.error('[MCP-SSE] Failed to load ES modules:', error);
            throw error;
        }
    }

    async start(): Promise<{ port: number; url: string }> {
        // Load ES modules first
        await this.loadESModules();
        
        // 使用系統自動分配端口 (設為 0)
        this.port = 0;
        
        return new Promise((resolve, reject) => {
            try {
                // 創建 HTTP server
                this.httpServer = http.createServer(async (req, res) => {
                    // 處理 CORS
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
                    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

                    if (req.method === 'OPTIONS') {
                        res.writeHead(200);
                        res.end();
                        return;
                    }

                    // 只處理 SSE 端點
                    if (req.url !== this.serverPath) {
                        res.writeHead(404);
                        res.end('Not Found');
                        return;
                    }

                    // 處理 SSE 連接
                    if (req.method === 'GET') {
                        await this.handleSSEConnection(req, res);
                    } else {
                        res.writeHead(405);
                        res.end('Method Not Allowed');
                    }
                });

                // 使用找到的端口啟動服務器
                this.httpServer.listen(this.port, '127.0.0.1', () => {
                    const address = this.httpServer!.address() as any;
                    const actualPort = address.port;
                    const url = `http://127.0.0.1:${actualPort}${this.serverPath}`;
                    
                    console.error(`[MCP-SSE] Server listening on ${url}`); // stderr is safe
                    resolve({ port: actualPort, url });
                });

                this.httpServer.on('error', (error: any) => {
                    console.error(`[MCP-SSE] Server error on port ${this.port}:`, error);
                    reject(error);
                });

            } catch (error) {
                reject(error);
            }
        });
    }



    private async handleSSEConnection(req: http.IncomingMessage, res: http.ServerResponse) {
        // 創建新的 MCP server 實例
        this.server = new Server({
            name: 'mcp-vscode-commands',
            version: '0.1.3'
        });

        // 註冊處理器
        this.registerHandlers();

        // 創建 SSE transport - 它會自動處理 SSE headers 和協議
        const transport = new SSEServerTransport(this.serverPath, res);
        
        try {
            // 連接 server 到 transport
            await this.server.connect(transport);
            
            console.error('[MCP-SSE] Client connected'); // stderr is safe

            // 處理連接關閉
            req.on('close', () => {
                console.error('[MCP-SSE] Client disconnected'); // stderr is safe
            });

        } catch (error) {
            console.error('[MCP-SSE] Connection error:', error);
            res.end();
        }
    }

    private registerHandlers(): void {
        if (!this.server) return;

        // 註冊 list_tools 處理器
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
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

        // 註冊 call_tool 處理器
        this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
            const { name, arguments: args } = request.params;
            
            console.error('[MCP-SSE] Executing tool:', name, args); // stderr is safe

            try {
                if (name === 'vscode.executeCommand') {
                    const { commandId, args: commandArgs = [] } = args as { commandId: string; args?: any[] };
                    const result = await this.tools.executeCommand(commandId, commandArgs);
                    return this.formatToolResult(result);
                } else if (name === 'vscode.listCommands') {
                    const { filter } = args as { filter?: string };
                    const result = await this.tools.listCommands(filter);
                    return this.formatToolResult(result);
                } else {
                    throw new Error(`未知的工具: ${name}`);
                }
            } catch (error) {
                console.error('[MCP-SSE] Tool execution error:', error);
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

    stop(): void {
        if (this.httpServer) {
            this.httpServer.close();
            this.httpServer = undefined;
        }
        
        if (this.server) {
            this.server = undefined;
        }
        
        console.error('[MCP-SSE] Server stopped'); // stderr is safe
    }

    getServerInfo(): { port: number; url: string } {
        return {
            port: this.port,
            url: `http://127.0.0.1:${this.port}${this.serverPath}`
        };
    }
}
