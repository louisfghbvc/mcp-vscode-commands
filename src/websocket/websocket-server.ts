import * as WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { VSCodeCommandsTools } from '../tools/vscode-commands';
import { MCPServerConfig } from '../types';

// WebSocket 消息類型定義
export enum MessageType {
  // MCP 協議消息
  MCP_REQUEST = 'mcp_request',
  MCP_RESPONSE = 'mcp_response',
  MCP_NOTIFICATION = 'mcp_notification',
  
  // 連接管理
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  RECONNECT = 'reconnect',
  
  // 錯誤處理
  ERROR = 'error',
  RETRY = 'retry'
}

// WebSocket 消息基礎結構
export interface WebSocketMessage {
  id: string;           // 唯一標識符
  type: MessageType;    // 消息類型
  timestamp: number;    // 時間戳
  data: any;           // 消息數據
  error?: string;      // 錯誤信息（可選）
}

// MCP 請求格式
export interface MCPRequest {
  jsonrpc: "2.0";
  id: string;
  method: string;
  params: {
    name: string;
    arguments: Record<string, any>;
  };
}

// MCP 響應格式
export interface MCPResponse {
  jsonrpc: "2.0";
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// WebSocket 客戶端封裝
export class WebSocketClient {
  public id: string;
  private ws: WebSocket;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  
  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });
    
    this.ws.on('close', () => {
      this.emit('close');
    });
    
    this.ws.on('error', (error) => {
      this.emit('error', error);
    });
  }
  
  private handleMessage(message: any): void {
    const handler = this.messageHandlers.get(message.type);
    if (handler) {
      handler(message.data);
    }
  }
  
  on(event: string, callback: (data?: any) => void): void {
    this.messageHandlers.set(event, callback);
  }
  
  emit(event: string, data?: any): void {
    const handler = this.messageHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }
  
  send(message: WebSocketMessage): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  close(): void {
    this.ws.close();
  }
  
  isConnected(): boolean {
    return this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * WebSocket MCP Server
 * 
 * 這個服務器運行在 VS Code Extension 中，作為 WebSocket Server
 * 處理來自 MCP Client 進程的連接和消息
 */
export class WebSocketServer {
  private wss: WebSocket.Server;
  private clients: Map<string, WebSocketClient>;
  private tools: VSCodeCommandsTools;
  private config: MCPServerConfig;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  
  constructor(port: number = 19847, config?: MCPServerConfig) {
    this.wss = new WebSocket.Server({ port });
    this.clients = new Map();
    this.config = config || this.getDefaultConfig();
    this.tools = new VSCodeCommandsTools(this.config);
    
    this.setupWebSocketServer();
    this.startHeartbeat();
  }
  
  private getDefaultConfig(): MCPServerConfig {
    return {
      name: 'mcp-vscode-commands-websocket',
      version: '1.0.0',
      tools: ['executeCommand', 'listCommands'],
      logLevel: 'info'
    };
  }
  
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const clientId = this.generateClientId();
      const client = new WebSocketClient(clientId, ws);
      
      console.log(`[WebSocket] New client connected: ${clientId}`);
      this.clients.set(clientId, client);
      
      this.handleClientConnection(client);
      this.sendWelcomeMessage(client);
    });
    
    this.wss.on('error', (error) => {
      console.error('[WebSocket] Server error:', error);
    });
    
    console.log(`[WebSocket] Server started on port ${this.wss.options.port}`);
  }
  
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private handleClientConnection(client: WebSocketClient): void {
    client.on('message', async (data: any) => {
      try {
        const message = JSON.parse(data);
        await this.processMCPMessage(client, message);
      } catch (error) {
        this.sendError(client, 'Invalid message format', error);
      }
    });
    
    client.on('close', () => {
      console.log(`[WebSocket] Client disconnected: ${client.id}`);
      this.clients.delete(client.id);
    });
    
    client.on('error', (error) => {
      console.error(`[WebSocket] Client error for ${client.id}:`, error);
      this.clients.delete(client.id);
    });
  }
  
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
          tools: this.config.tools
        }
      }
    };
    
    client.send(welcomeMessage);
  }
  
  private async processMCPMessage(client: WebSocketClient, message: any): Promise<void> {
    try {
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
    } catch (error) {
      console.error('[WebSocket] Error processing message:', error);
      this.sendError(client, 'Internal server error', error);
    }
  }
  
  private async handleMCPRequest(client: WebSocketClient, message: any): Promise<void> {
    const { id, method, params } = message.data;
    
    try {
      let result: any;
      
      switch (method) {
        case 'tools/list':
          result = await this.tools.listCommands();
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
  
  private handleConnect(client: WebSocketClient, message: any): void {
    console.log(`[WebSocket] Client ${client.id} authenticated`);
    
    const response: WebSocketMessage = {
      id: message.id || 'connect_ack',
      type: MessageType.CONNECT,
      timestamp: Date.now(),
      data: {
        status: 'connected',
        clientId: client.id
      }
    };
    
    client.send(response);
  }
  
  private sendHeartbeat(client: WebSocketClient): void {
    const heartbeat: WebSocketMessage = {
      id: 'heartbeat',
      type: MessageType.HEARTBEAT,
      timestamp: Date.now(),
      data: {
        serverTime: Date.now(),
        uptime: process.uptime()
      }
    };
    
    client.send(heartbeat);
  }
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (client.isConnected()) {
          this.sendHeartbeat(client);
        }
      });
    }, 30000); // 30 seconds
  }
  
  private sendError(client: WebSocketClient, message: string, error?: any): void {
    const errorMessage: WebSocketMessage = {
      id: 'error',
      type: MessageType.ERROR,
      timestamp: Date.now(),
      data: {
        message: message,
        error: error
      }
    };
    
    client.send(errorMessage);
  }
  
  public getClientCount(): number {
    return this.clients.size;
  }
  
  public getClients(): WebSocketClient[] {
    return Array.from(this.clients.values());
  }
  
  public broadcast(message: WebSocketMessage): void {
    this.clients.forEach((client) => {
      if (client.isConnected()) {
        client.send(message);
      }
    });
  }
  
  public stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.clients.forEach((client) => {
      client.close();
    });
    
    this.wss.close();
    console.log('[WebSocket] Server stopped');
  }
}
