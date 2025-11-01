import WebSocket from 'ws';
import { VSCodeCommandsTools } from './vscode-commands-tools';

/**
 * Simple WebSocket Server for MCP
 * 
 * 簡化版 WebSocket Server，只處理核心的 MCP 工具調用
 */
export class SimpleWebSocketServer {
    private server: WebSocket.Server | null = null;
    private tools: VSCodeCommandsTools;
    private port: number;
    private isRunning: boolean = false;

    constructor(port: number = 19847) {
        this.port = port;
        this.tools = new VSCodeCommandsTools({});
    }

    /**
     * 啟動 WebSocket Server
     */
    async start(): Promise<void> {
        if (this.isRunning) {
            return;
        }

        return new Promise((resolve, reject) => {
            try {
                this.server = new WebSocket.Server({ port: this.port });

                this.server.on('connection', (ws: WebSocket) => {
                    this.handleConnection(ws);
                });

                this.server.on('error', (error: Error) => {
                    console.error('[WebSocket] Server error:', error);
                    reject(error);
                });

                this.server.on('listening', () => {
                    this.isRunning = true;
                    console.log(`[WebSocket] ✅ Server started on port ${this.port}`);
                    resolve();
                });

            } catch (error) {
                console.error('[WebSocket] Failed to start:', error);
                reject(error);
            }
        });
    }

    /**
     * 停止 WebSocket Server
     */
    async stop(): Promise<void> {
        if (!this.isRunning || !this.server) {
            return;
        }

        return new Promise((resolve) => {
            this.server!.close(() => {
                this.isRunning = false;
                this.server = null;
                console.log('[WebSocket] ✅ Server stopped');
                resolve();
            });

            // 關閉所有連接
            this.server!.clients.forEach((client) => {
                client.close();
            });
        });
    }

    /**
     * 處理新連接
     */
    private handleConnection(ws: WebSocket): void {
        console.log('[WebSocket] New client connected');

        ws.on('message', async (data: WebSocket.Data) => {
            try {
                const request = JSON.parse(data.toString());
                await this.handleRequest(ws, request);
            } catch (error) {
                this.sendError(ws, null, -32700, 'Parse error', error);
            }
        });

        ws.on('close', () => {
            console.log('[WebSocket] Client disconnected');
        });

        ws.on('error', (error: Error) => {
            console.error('[WebSocket] Client error:', error);
        });
    }

    /**
     * 處理 JSON-RPC 2.0 請求
     */
    private async handleRequest(ws: WebSocket, request: any): Promise<void> {
        // 驗證 JSON-RPC 2.0 格式
        if (request.jsonrpc !== '2.0') {
            this.sendError(ws, request.id, -32600, 'Invalid Request', null);
            return;
        }

        const { id, method, params } = request;
        let result: any;

        try {
            // 處理工具調用
            switch (method) {
                case 'tools/list':
                    result = await this.tools.listCommands(params?.filter);
                    break;

                case 'tools/call':
                    // params.name 是工具名稱（如 'vscode.executeCommand'）
                    // params.arguments 是工具參數
                    const toolName = params.name;
                    const toolArgs = params.arguments || {};

                    if (toolName === 'vscode.listCommands') {
                        result = await this.tools.listCommands(toolArgs.filter);
                    } else if (toolName === 'vscode.executeCommand') {
                        result = await this.tools.executeCommand(toolArgs.command, toolArgs.args || []);
                    } else {
                        throw new Error(`Unknown tool: ${toolName}`);
                    }
                    break;

                default:
                    throw new Error(`Unknown method: ${method}`);
            }

            // 發送成功響應
            this.sendResponse(ws, id, result);

        } catch (error) {
            // 發送錯誤響應
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.sendError(ws, id, -32603, 'Internal error', errorMessage);
        }
    }

    /**
     * 發送成功響應
     */
    private sendResponse(ws: WebSocket, id: string | number | null, result: any): void {
        if (id === null || id === undefined) {
            return; // 通知消息不需要響應
        }

        const response = {
            jsonrpc: '2.0',
            id: id,
            result: result
        };

        ws.send(JSON.stringify(response));
    }

    /**
     * 發送錯誤響應
     */
    private sendError(
        ws: WebSocket,
        id: string | number | null,
        code: number,
        message: string,
        data: any
    ): void {
        if (id === null || id === undefined) {
            return; // 通知消息不需要響應
        }

        const response = {
            jsonrpc: '2.0',
            id: id,
            error: {
                code: code,
                message: message,
                data: data
            }
        };

        ws.send(JSON.stringify(response));
    }

    /**
     * 獲取服務器狀態
     */
    getStatus(): {
        isRunning: boolean;
        port: number;
        clientCount: number;
    } {
        return {
            isRunning: this.isRunning,
            port: this.port,
            clientCount: this.server?.clients.size || 0
        };
    }
}

