import * as vscode from 'vscode';
import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { VSCodeCommandsTools } from '../tools/vscode-commands';
import { MCPServerConfig } from '../types';
import { WebSocketMessage, MessageType, WebSocketClient } from './websocket-server';

/**
 * WebSocket MCP Server Extension
 * 
 * 這個類集成到 VS Code Extension 中，作為 WebSocket Server
 * 處理來自 MCP Client 的連接和消息，執行 VSCode 命令
 */
export class WebSocketMCPServerExtension {
  private wss: WebSocket.Server | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private tools: VSCodeCommandsTools;
  private config: MCPServerConfig;
  private context: vscode.ExtensionContext;
  private port: number;
  private isRunning: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private statusBarItem: vscode.StatusBarItem | null = null;
  
  constructor(context: vscode.ExtensionContext, config?: MCPServerConfig, port?: number) {
    this.context = context;
    this.config = config || this.getDefaultConfig();
    this.tools = new VSCodeCommandsTools(this.config);
    this.port = port || this.getAvailablePort();
    
    this.setupStatusBar();
  }
  
  /**
   * 獲取默認配置
   */
  private getDefaultConfig(): MCPServerConfig {
    return {
      name: 'mcp-vscode-commands-websocket',
      version: '1.0.0',
      tools: ['executeCommand', 'listCommands'],
      logLevel: 'info'
    };
  }
  
  /**
   * 獲取可用端口
   */
  private getAvailablePort(): number {
    // 從配置中讀取端口，默認使用 19847
    const config = vscode.workspace.getConfiguration('mcpVscodeCommands');
    return config.get('websocketPort', 19847);
  }
  
  /**
   * 設置狀態欄
   */
  private setupStatusBar(): void {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBarItem.name = 'MCP WebSocket Server';
    this.statusBarItem.tooltip = 'MCP WebSocket Server Status';
    this.updateStatusBar();
    this.statusBarItem.show();
  }
  
  /**
   * 更新狀態欄
   */
  private updateStatusBar(): void {
    if (!this.statusBarItem) return;
    
    if (this.isRunning) {
      this.statusBarItem.text = `$(radio-tower) MCP WS:${this.port}`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    } else {
      this.statusBarItem.text = `$(radio-tower) MCP WS:${this.port} (stopped)`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
  }
  
  /**
   * 啟動 WebSocket Server
   */
  async start(): Promise<void> {
    try {
      if (this.isRunning) {
        console.log('[WebSocket MCP] Server is already running');
        return;
      }
      
      console.log(`[WebSocket MCP] Starting WebSocket server on port ${this.port}...`);
      
      // 創建 WebSocket 服務器
      this.wss = new WebSocket.Server({ 
        port: this.port,
        perMessageDeflate: false // 禁用消息壓縮以提高性能
      });
      
      // 設置服務器事件處理
      this.setupServerEventHandlers();
      
      // 啟動心跳機制
      this.startHeartbeat();
      
      this.isRunning = true;
      this.updateStatusBar();
      
      console.log(`[WebSocket MCP] ✅ Server started successfully on port ${this.port}`);
      
      // 顯示通知
      vscode.window.showInformationMessage(`🚀 MCP WebSocket Server started on port ${this.port}`);
      
    } catch (error) {
      console.error('[WebSocket MCP] Failed to start server:', error);
      vscode.window.showErrorMessage(
        `❌ Failed to start MCP WebSocket Server: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }
  
  /**
   * 停止 WebSocket Server
   */
  async stop(): Promise<void> {
    try {
      if (!this.isRunning) {
        console.log('[WebSocket MCP] Server is not running');
        return;
      }
      
      console.log('[WebSocket MCP] Stopping server...');
      
      // 停止心跳
      this.stopHeartbeat();
      
      // 關閉所有客戶端連接
      this.clients.forEach(client => {
        client.close();
      });
      this.clients.clear();
      
      // 關閉 WebSocket 服務器
      if (this.wss) {
        this.wss.close();
        this.wss = null;
      }
      
      this.isRunning = false;
      this.updateStatusBar();
      
      console.log('[WebSocket MCP] ✅ Server stopped successfully');
      
      // 顯示通知
      vscode.window.showInformationMessage('🛑 MCP WebSocket Server stopped');
      
    } catch (error) {
      console.error('[WebSocket MCP] Error stopping server:', error);
      throw error;
    }
  }
  
  /**
   * 設置服務器事件處理器
   */
  private setupServerEventHandlers(): void {
    if (!this.wss) return;
    
    // 處理新連接
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = this.generateClientId();
      const client = new WebSocketClient(clientId, ws);
      
      console.log(`[WebSocket MCP] New client connected: ${clientId} from ${req.socket.remoteAddress}`);
      
      this.clients.set(clientId, client);
      this.handleClientConnection(client);
      this.sendWelcomeMessage(client);
      
      // 更新狀態欄
      this.updateStatusBar();
    });
    
    // 處理服務器錯誤
    this.wss.on('error', (error) => {
      console.error('[WebSocket MCP] Server error:', error);
      vscode.window.showErrorMessage(`MCP WebSocket Server error: ${error.message}`);
    });
    
    // 處理服務器關閉
    this.wss.on('close', () => {
      console.log('[WebSocket MCP] Server closed');
      this.isRunning = false;
      this.updateStatusBar();
    });
  }
  
  /**
   * 生成客戶端 ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 處理客戶端連接
   */
  private handleClientConnection(client: WebSocketClient): void {
    // 處理消息
    client.on('message', async (data: any) => {
      try {
        const message = JSON.parse(data);
        await this.processMCPMessage(client, message);
      } catch (error) {
        console.error('[WebSocket MCP] Error parsing message:', error);
        this.sendError(client, 'Invalid message format', error);
      }
    });
    
    // 處理連接關閉
    client.on('close', () => {
      console.log(`[WebSocket MCP] Client disconnected: ${client.id}`);
      this.clients.delete(client.id);
      this.updateStatusBar();
    });
    
    // 處理連接錯誤
    client.on('error', (error) => {
      console.error(`[WebSocket MCP] Client error for ${client.id}:`, error);
      this.clients.delete(client.id);
      this.updateStatusBar();
    });
  }
  
  /**
   * 發送歡迎消息
   */
  private sendWelcomeMessage(client: WebSocketClient): void {
    const welcomeMessage: WebSocketMessage = {
      id: 'welcome',
      type: MessageType.CONNECT,
      timestamp: Date.now(),
      data: {
        message: 'Welcome to MCP WebSocket Server',
        serverInfo: {
          name: this.config.name,
          version: this.config.version,
          tools: this.config.tools,
          port: this.port
        }
      }
    };
    
    client.send(welcomeMessage);
  }
  
  /**
   * 處理 MCP 消息
   */
  private async processMCPMessage(client: WebSocketClient, message: any): Promise<void> {
    try {
      const startTime = Date.now();
      
      switch (message.type) {
        case MessageType.MCP_REQUEST:
          await this.handleMCPRequest(client, message);
          break;
        case MessageType.HEARTBEAT:
          this.sendHeartbeat(client);
          break;
        case MessageType.CONNECT:
          this.handleConnect(client, message);
          break;
        default:
          this.sendError(client, 'Unknown message type', message);
      }
      
      // 記錄性能指標
      const processingTime = Date.now() - startTime;
      console.log(`[WebSocket MCP] Message processed in ${processingTime}ms: ${message.type}`);
      
    } catch (error) {
      console.error('[WebSocket MCP] Error processing message:', error);
      this.sendError(client, 'Internal server error', error);
    }
  }
  
  /**
   * 處理 MCP 請求
   */
  private async handleMCPRequest(client: WebSocketClient, message: any): Promise<void> {
    const { id, method, params } = message.data;
    
    try {
      let result: any;
      
      switch (method) {
        case 'tools/list':
          result = await this.tools.listCommands(params?.filter);
          break;
        case 'tools/call':
          result = await this.tools.executeCommand(params.name, params.arguments);
          break;
        default:
          throw new Error(`Unknown method: ${method}`);
      }
      
      const response: WebSocketMessage = {
        id: id,
        type: MessageType.MCP_RESPONSE,
        timestamp: Date.now(),
        data: {
          jsonrpc: "2.0",
          id: id,
          result: result
        }
      };
      
      client.send(response);
      
    } catch (error) {
      const errorResponse: WebSocketMessage = {
        id: id,
        type: MessageType.MCP_RESPONSE,
        timestamp: Date.now(),
        data: {
          jsonrpc: "2.0",
          id: id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : String(error),
            data: null
          }
        }
      };
      
      client.send(errorResponse);
    }
  }
  
  /**
   * 處理連接消息
   */
  private handleConnect(client: WebSocketClient, message: any): void {
    console.log(`[WebSocket MCP] Client ${client.id} authenticated`);
    
    const response: WebSocketMessage = {
      id: message.id || 'connect_ack',
      type: MessageType.CONNECT,
      timestamp: Date.now(),
      data: {
        status: 'connected',
        clientId: client.id,
        serverTime: Date.now()
      }
    };
    
    client.send(response);
  }
  
  /**
   * 發送心跳
   */
  private sendHeartbeat(client: WebSocketClient): void {
    const heartbeat: WebSocketMessage = {
      id: 'heartbeat',
      type: MessageType.HEARTBEAT,
      timestamp: Date.now(),
      data: {
        serverTime: Date.now(),
        uptime: process.uptime(),
        clientCount: this.clients.size
      }
    };
    
    client.send(heartbeat);
  }
  
  /**
   * 啟動心跳機制
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (client.isConnected()) {
          this.sendHeartbeat(client);
        }
      });
    }, 30000); // 30 seconds
  }
  
  /**
   * 停止心跳機制
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  /**
   * 發送錯誤消息
   */
  private sendError(client: WebSocketClient, message: string, error?: any): void {
    const errorMessage: WebSocketMessage = {
      id: 'error',
      type: MessageType.ERROR,
      timestamp: Date.now(),
      data: {
        message: message,
        error: error,
        timestamp: Date.now()
      }
    };
    
    client.send(errorMessage);
  }
  
  /**
   * 獲取服務器狀態
   */
  public getStatus(): {
    isRunning: boolean;
    port: number;
    clientCount: number;
    uptime: number;
  } {
    return {
      isRunning: this.isRunning,
      port: this.port,
      clientCount: this.clients.size,
      uptime: process.uptime()
    };
  }
  
  /**
   * 獲取客戶端信息
   */
  public getClients(): Array<{
    id: string;
    connected: boolean;
    remoteAddress?: string;
  }> {
    return Array.from(this.clients.values()).map(client => ({
      id: client.id,
      connected: client.isConnected()
    }));
  }
  
  /**
   * 廣播消息到所有客戶端
   */
  public broadcast(message: WebSocketMessage): void {
    this.clients.forEach((client) => {
      if (client.isConnected()) {
        client.send(message);
      }
    });
  }
  
  /**
   * 重啟服務器
   */
  async restart(): Promise<void> {
    console.log('[WebSocket MCP] Restarting server...');
    await this.stop();
    await this.sleep(1000); // 等待 1 秒
    await this.start();
  }
  
  /**
   * 工具函數：延遲
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 清理資源
   */
  dispose(): void {
    this.stop();
    
    if (this.statusBarItem) {
      this.statusBarItem.dispose();
      this.statusBarItem = null;
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
