import * as vscode from 'vscode';
import WebSocket from 'ws';

/**
 * Stdio MCP Server - 提供 MCP 工具給 Cursor 註冊
 * 實際執行時連接到 WebSocket 來獲取 VS Code 命令
 * 
 * 這個類有兩種模式：
 * 1. Extension 模式：在 extension 中運行，用於註冊到 Cursor MCP API
 * 2. Stdio 進程模式：作為獨立進程運行，通過 WebSocket 連接到 extension
 */
export class StdioMCPServer {
    private websocketClient?: WebSocket;
    private websocketPort: number;
    private isRunning: boolean = false;
    private isExtensionMode: boolean;
    private extensionPath?: string;
    private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();

    constructor(extensionPath?: string, websocketPort?: number) {
        this.extensionPath = extensionPath;
        // 從參數或環境變量獲取 WebSocket 端口
        this.websocketPort = websocketPort || parseInt(process.env.WEBSOCKET_PORT || '19847', 10);
        // 判斷是否在 extension 環境中運行
        this.isExtensionMode = typeof vscode !== 'undefined' && !!vscode.env && !!vscode.workspace;
    }

    /**
     * 啟動 Stdio MCP Server
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        try {
            // 如果是 extension 模式，註冊到 Cursor MCP API
            if (this.isExtensionMode) {
                await this.registerMCPTools();
            } else {
                // 如果是 stdio 進程模式，連接到 WebSocket Server
                await this.connectToWebSocket();
            }
            
            this.isRunning = true;
            console.log('[Stdio MCP Server] ✅ 已啟動 (模式: ' + (this.isExtensionMode ? 'Extension' : 'Stdio') + ')');
        } catch (error) {
            console.error('[Stdio MCP Server] ❌ 啟動失敗:', error);
            throw error;
        }
    }

    /**
     * 停止 Stdio MCP Server
     */
    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        try {
            if (this.isExtensionMode) {
                // 取消註冊 MCP 工具
                await this.unregisterMCPTools();
            } else {
                // 斷開 WebSocket 連接
                this.disconnectWebSocket();
            }
            
            this.isRunning = false;
            console.log('[Stdio MCP Server] ✅ 已停止');
        } catch (error) {
            console.error('[Stdio MCP Server] ❌ 停止失敗:', error);
            throw error;
        }
    }

    /**
     * 註冊 MCP 工具
     */
    private async registerMCPTools(): Promise<void> {
        try {
            // 使用 Cursor MCP Extension API 註冊服務器
            if (vscode.cursor?.mcp?.registerServer) {
                // 獲取編譯後的 stdio server 路徑
                const stdioServerPath = this.extensionPath 
                    ? require('path').join(this.extensionPath, 'out', 'stdio-mcp-server.js')
                    : require('path').join(__dirname, 'stdio-mcp-server.js');
                
                vscode.cursor.mcp.registerServer({
                    name: 'vscode-commands',
                    server: {
                        command: 'node',
                        args: [stdioServerPath],
                        env: {
                            MCP_SERVER_MODE: 'stdio',
                            WEBSOCKET_PORT: this.websocketPort.toString()
                        }
                    }
                });
                console.log('[Stdio MCP Server] ✅ 已註冊到 Cursor MCP API');
                console.log(`[Stdio MCP Server] 📁 Server 路徑: ${stdioServerPath}`);
                console.log(`[Stdio MCP Server] 🔌 WebSocket 端口: ${this.websocketPort}`);
            } else {
                console.warn('[Stdio MCP Server] ⚠️ Cursor MCP API 不可用');
            }
        } catch (error) {
            console.error('[Stdio MCP Server] ❌ 註冊 MCP 工具失敗:', error);
            throw error;
        }
    }

    /**
     * 取消註冊 MCP 工具
     */
    private async unregisterMCPTools(): Promise<void> {
        try {
            if (vscode.cursor?.mcp?.unregisterServer) {
                vscode.cursor.mcp.unregisterServer('vscode-commands');
                console.log('[Stdio MCP Server] ✅ 已從 Cursor MCP API 取消註冊');
            }
        } catch (error) {
            console.error('[Stdio MCP Server] ❌ 取消註冊 MCP 工具失敗:', error);
        }
    }

    /**
     * 獲取 MCP 工具列表
     */
    getMCPTools(): any[] {
        return [
            {
                name: 'vscode.listCommands',
                description: '列出所有可用的 VS Code 命令',
                inputSchema: {
                    type: 'object',
                    properties: {
                        filter: {
                            type: 'string',
                            description: '可選的過濾器，用於篩選命令'
                        }
                    }
                }
            },
            {
                name: 'vscode.executeCommand',
                description: '執行 VS Code 命令',
                inputSchema: {
                    type: 'object',
                    required: ['command'],
                    properties: {
                        command: {
                            type: 'string',
                            description: '要執行的 VS Code 命令 ID'
                        },
                        args: {
                            type: 'array',
                            description: '命令參數',
                            items: {
                                type: 'any'
                            }
                        }
                    }
                }
            }
        ];
    }

    /**
     * 連接到 WebSocket Server
     */
    private async connectToWebSocket(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const wsUrl = `ws://localhost:${this.websocketPort}`;
                console.log(`[Stdio MCP Server] 🔌 連接到 WebSocket Server: ${wsUrl}`);
                
                this.websocketClient = new WebSocket(wsUrl);
                
                this.websocketClient.on('open', () => {
                    console.log('[Stdio MCP Server] ✅ WebSocket 連接成功');
                    resolve();
                });
                
                this.websocketClient.on('message', (data: WebSocket.Data) => {
                    this.handleWebSocketMessage(data);
                });
                
                this.websocketClient.on('error', (error: Error) => {
                    console.error('[Stdio MCP Server] ❌ WebSocket 連接錯誤:', error);
                    reject(error);
                });
                
                this.websocketClient.on('close', () => {
                    console.log('[Stdio MCP Server] 🔌 WebSocket 連接已關閉');
                    this.websocketClient = undefined;
                });
                
            } catch (error) {
                console.error('[Stdio MCP Server] ❌ 創建 WebSocket 連接失敗:', error);
                reject(error);
            }
        });
    }
    
    /**
     * 斷開 WebSocket 連接
     */
    private disconnectWebSocket(): void {
        if (this.websocketClient) {
            this.websocketClient.close();
            this.websocketClient = undefined;
        }
    }
    
    /**
     * 處理 WebSocket 消息（簡化版 - 直接處理 JSON-RPC 2.0 響應）
     */
    private handleWebSocketMessage(data: WebSocket.Data): void {
        try {
            const message = JSON.parse(data.toString());
            
            // 驗證 JSON-RPC 2.0 格式
            if (message.jsonrpc !== '2.0' || !message.id) {
                return;
            }
            
            const requestId = message.id;
            if (this.pendingRequests.has(requestId)) {
                const { resolve, reject } = this.pendingRequests.get(requestId)!;
                this.pendingRequests.delete(requestId);
                
                if (message.error) {
                    reject(new Error(message.error.message || 'WebSocket request failed'));
                } else {
                    resolve(message.result);
                }
            }
        } catch (error) {
            console.error('[Stdio MCP Server] ❌ 處理 WebSocket 消息失敗:', error);
        }
    }
    
    /**
     * 通過 WebSocket 發送 MCP 請求（簡化版 - 直接使用 JSON-RPC 2.0）
     */
    private async sendMCPRequest(method: string, params: any): Promise<any> {
        if (!this.websocketClient || this.websocketClient.readyState !== WebSocket.OPEN) {
            // 如果未連接，先嘗試連接
            if (!this.websocketClient) {
                await this.connectToWebSocket();
            } else {
                throw new Error('WebSocket 連接未就緒');
            }
        }
        
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return new Promise((resolve, reject) => {
            if (!this.websocketClient) {
                reject(new Error('WebSocket 客戶端不存在'));
                return;
            }
            
            // 保存請求的回調
            this.pendingRequests.set(requestId, { resolve, reject });
            
            // 設置超時（10秒）
            const timeout = setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error('WebSocket 請求超時'));
                }
            }, 10000);
            
            // 直接使用 JSON-RPC 2.0 格式發送請求
            const request = {
                jsonrpc: '2.0',
                id: requestId,
                method: method,
                params: params
            };
            
            try {
                this.websocketClient.send(JSON.stringify(request));
                
                // 創建包裝的 resolve 和 reject 來清除超時
                const wrappedResolve = (value: any) => {
                    clearTimeout(timeout);
                    resolve(value);
                };
                
                const wrappedReject = (error: any) => {
                    clearTimeout(timeout);
                    reject(error);
                };
                
                // 更新 pendingRequests 中的回調
                this.pendingRequests.set(requestId, { resolve: wrappedResolve, reject: wrappedReject });
            } catch (error) {
                clearTimeout(timeout);
                this.pendingRequests.delete(requestId);
                reject(error);
            }
        });
    }

    /**
     * 執行 MCP 工具
     */
    async executeMCPTool(toolName: string, args: any): Promise<any> {
        try {
            // 在 stdio 進程模式：通過 WebSocket 發送請求
            let method: string;
            let params: any;
            
            switch (toolName) {
                case 'vscode.listCommands':
                    method = 'tools/list';
                    params = { filter: args.filter };
                    break;
                
                case 'vscode.executeCommand':
                    method = 'tools/call';
                    params = {
                        name: args.command,
                        arguments: args.args || []
                    };
                    break;
                
                default:
                    throw new Error(`未知的 MCP 工具: ${toolName}`);
            }
            
            return await this.sendMCPRequest(method, params);
        } catch (error) {
            console.error(`[Stdio MCP Server] ❌ 執行工具 ${toolName} 失敗:`, error);
            throw error;
        }
    }

    /**
     * 檢查服務器狀態
     */
    getStatus(): { isRunning: boolean; tools: any[] } {
        return {
            isRunning: this.isRunning,
            tools: this.getMCPTools()
        };
    }
}

// 當作為獨立進程運行時（stdio 模式）
// 檢查是否在 stdio 模式（環境變量 MCP_SERVER_MODE === 'stdio'）
if (process.env.MCP_SERVER_MODE === 'stdio' && require.main === module) {
    // 動態導入 MCP SDK，因為它可能不在 stdio 進程中可用
    // 使用 require 而不是 import 來避免 TypeScript 編譯時錯誤
    const mcp = require('@modelcontextprotocol/sdk');
    const { Server } = mcp;
    const { StdioServerTransport } = mcp;
    
    (async () => {
        try {
            console.error('[Stdio MCP Server] 🚀 啟動 stdio MCP server 進程...');
            
            // 創建 Stdio MCP Server 實例（不傳入 websocketServer，因為這是獨立進程）
            const stdioServer = new StdioMCPServer();
            
            // 啟動並連接到 WebSocket
            await stdioServer.start();
            
            // 創建 MCP Server
            const server = new Server(
                {
                    name: 'vscode-commands',
                    version: '0.2.0',
                },
                {
                    capabilities: {
                        tools: {},
                    },
                }
            );
            
            // 註冊工具列表處理器
            server.setRequestHandler(mcp.ListToolsRequestSchema, async () => {
                const tools = stdioServer.getMCPTools();
                return {
                    tools: tools.map(tool => ({
                        name: tool.name,
                        description: tool.description,
                        inputSchema: tool.inputSchema,
                    })),
                };
            });
            
            // 註冊工具調用處理器
            server.setRequestHandler(mcp.CallToolRequestSchema, async (request: any) => {
                const { name, arguments: args } = request.params;
                try {
                    const result = await stdioServer.executeMCPTool(name, args || {});
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(result, null, 2),
                            },
                        ],
                    };
                } catch (error) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                            },
                        ],
                        isError: true,
                    };
                }
            });
            
            // 使用 stdio transport 連接
            const transport = new StdioServerTransport();
            await server.connect(transport);
            
            console.error('[Stdio MCP Server] ✅ Stdio MCP server 已啟動並連接到 WebSocket');
            
            // 處理進程退出
            process.on('SIGINT', async () => {
                console.error('[Stdio MCP Server] 收到 SIGINT，正在關閉...');
                await stdioServer.stop();
                process.exit(0);
            });
            
            process.on('SIGTERM', async () => {
                console.error('[Stdio MCP Server] 收到 SIGTERM，正在關閉...');
                await stdioServer.stop();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('[Stdio MCP Server] ❌ 啟動失敗:', error);
            process.exit(1);
        }
    })();
}
