#!/usr/bin/env node

/**
 * WebSocket MCP Client
 * 
 * 獨立的進程，作為 WebSocket Client 連接到 Extension 的 WebSocket Server
 * 處理 stdio 通信和消息轉發
 */

import WebSocket from 'ws';
import * as readline from 'readline';
import { EventEmitter } from 'events';

// 消息類型定義
export enum MessageType {
  MCP_REQUEST = 'mcp_request',
  MCP_RESPONSE = 'mcp_response',
  MCP_NOTIFICATION = 'mcp_notification',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}

// WebSocket 消息接口
export interface WebSocketMessage {
  id: string;
  type: MessageType;
  timestamp: number;
  data: any;
  error?: string;
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

/**
 * WebSocket MCP Client 主類
 */
export class WebSocketMCPClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private rl: readline.Interface;
  private websocketUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private isConnected: boolean = false;
  private isShuttingDown: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  
  constructor(websocketUrl: string = 'ws://localhost:19847') {
    super();
    this.websocketUrl = websocketUrl;
    
    // 設置 readline 接口
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });
    
    // 設置進程信號處理
    this.setupProcessHandlers();
    
    // 設置 readline 事件處理
    this.setupReadlineHandlers();
    
    console.log(`[MCP Client] Starting WebSocket MCP Client...`);
    console.log(`[MCP Client] Target URL: ${this.websocketUrl}`);
  }
  
  /**
   * 啟動客戶端
   */
  async start(): Promise<void> {
    try {
      console.log('[MCP Client] Connecting to WebSocket server...');
      
      // 連接到 WebSocket 服務器
      await this.connectToWebSocket();
      
      // 發送連接消息
      this.sendConnectMessage();
      
      console.log('[MCP Client] ✅ Client started successfully');
      
    } catch (error) {
      console.error('[MCP Client] Failed to start client:', error);
      throw error;
    }
  }
  
  /**
   * 連接到 WebSocket 服務器
   */
  private async connectToWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.websocketUrl);
        
        if (this.ws) {
          this.ws.on('open', () => {
            console.log('[MCP Client] WebSocket connection established');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.startHeartbeat();
            resolve();
          });
          
          this.ws.on('message', (data: WebSocket.Data) => {
            this.handleWebSocketMessage(data);
          });
          
          this.ws.on('close', (code: number, reason: Buffer) => {
            console.log(`[MCP Client] WebSocket connection closed: ${code} - ${reason.toString()}`);
            this.handleWebSocketDisconnection();
          });
          
          this.ws.on('error', (error: Error) => {
            console.error('[MCP Client] WebSocket error:', error.message);
            reject(error);
          });
        }
        
        // 設置連接超時
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('Connection timeout'));
          }
        }, 10000);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * 處理 WebSocket 消息
   */
  private handleWebSocketMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      console.log(`[MCP Client] Received message: ${message.type}`);
      
      switch (message.type) {
        case MessageType.MCP_RESPONSE:
          this.forwardToStdout(message);
          break;
        case MessageType.HEARTBEAT:
          this.handleHeartbeat(message);
          break;
        case MessageType.CONNECT:
          this.handleConnectResponse(message);
          break;
        case MessageType.ERROR:
          this.handleErrorMessage(message);
          break;
        default:
          console.log(`[MCP Client] Unknown message type: ${message.type}`);
      }
      
    } catch (error) {
      console.error('[MCP Client] Error parsing WebSocket message:', error);
    }
  }
  
  /**
   * 處理連接響應
   */
  private handleConnectResponse(message: WebSocketMessage): void {
    console.log('[MCP Client] Connection confirmed by server');
    
    if (message.data && message.data.status === 'connected') {
      console.log(`[MCP Client] Server assigned client ID: ${message.data.clientId}`);
    }
  }
  
  /**
   * 處理心跳消息
   */
  private handleHeartbeat(message: WebSocketMessage): void {
    // 回應心跳
    this.sendHeartbeat();
  }
  
  /**
   * 處理錯誤消息
   */
  private handleErrorMessage(message: WebSocketMessage): void {
    console.error('[MCP Client] Server error:', message.data);
    
    // 將錯誤轉發到 stdout
    this.forwardToStdout({
      jsonrpc: "2.0",
      id: message.id || 'error',
      error: {
        code: -32603,
        message: message.data.message || 'Server error',
        data: message.data.error
      }
    });
  }
  
  /**
   * 發送連接消息
   */
  private sendConnectMessage(): void {
    const connectMessage: WebSocketMessage = {
      id: 'connect',
      type: MessageType.CONNECT,
      timestamp: Date.now(),
      data: {
        clientType: 'mcp_client',
        version: '1.0.0',
        capabilities: ['mcp_request', 'mcp_response'],
        processId: process.pid
      }
    };
    
    this.sendWebSocketMessage(connectMessage);
  }
  
  /**
   * 發送心跳
   */
  private sendHeartbeat(): void {
    const heartbeat: WebSocketMessage = {
      id: 'heartbeat',
      type: MessageType.HEARTBEAT,
      timestamp: Date.now(),
      data: {
        clientTime: Date.now(),
        uptime: process.uptime(),
        processId: process.pid
      }
    };
    
    this.sendWebSocketMessage(heartbeat);
  }
  
  /**
   * 開始心跳機制
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendHeartbeat();
      }
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
   * 處理 WebSocket 斷開連接
   */
  private handleWebSocketDisconnection(): void {
    this.isConnected = false;
    this.stopHeartbeat();
    
    if (this.isShuttingDown) {
      return;
    }
    
    console.log('[MCP Client] WebSocket disconnected, attempting to reconnect...');
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
      
      console.log(`[MCP Client] Reconnection attempt ${this.reconnectAttempts}, waiting ${delay}ms...`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnect();
      }, delay);
    } else {
      console.error('[MCP Client] Max reconnection attempts reached');
      this.shutdown(1);
    }
  }
  
  /**
   * 重連
   */
  private async reconnect(): Promise<void> {
    try {
      console.log('[MCP Client] Attempting to reconnect...');
      await this.connectToWebSocket();
      this.sendConnectMessage();
      console.log('[MCP Client] Reconnection successful');
    } catch (error) {
      console.error('[MCP Client] Reconnection failed:', error);
      this.handleWebSocketDisconnection();
    }
  }
  
  /**
   * 設置進程信號處理
   */
  private setupProcessHandlers(): void {
    process.on('SIGINT', () => {
      console.log('[MCP Client] Received SIGINT, shutting down...');
      this.shutdown(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('[MCP Client] Received SIGTERM, shutting down...');
      this.shutdown(0);
    });
    
    process.on('uncaughtException', (error: Error) => {
      console.error('[MCP Client] Uncaught exception:', error);
      this.shutdown(1);
    });
    
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      console.error('[MCP Client] Unhandled rejection at:', promise, 'reason:', reason);
      this.shutdown(1);
    });
  }
  
  /**
   * 設置 readline 事件處理
   */
  private setupReadlineHandlers(): void {
    this.rl.on('line', (input: string) => {
      this.handleStdinInput(input);
    });
    
    this.rl.on('close', () => {
      console.log('[MCP Client] Stdin closed, shutting down...');
      this.shutdown(0);
    });
  }
  
  /**
   * 處理 stdin 輸入
   */
  private handleStdinInput(input: string): void {
    try {
      if (!input.trim()) {
        return;
      }
      
      const message = JSON.parse(input);
      console.log(`[MCP Client] Received stdin message: ${message.method || 'unknown'}`);
      
      // 轉發到 WebSocket
      this.forwardToWebSocket(message);
      
    } catch (error) {
      console.error('[MCP Client] Error parsing stdin input:', error);
      
      // 發送錯誤響應到 stdout
      const errorResponse: MCPResponse = {
        jsonrpc: "2.0",
        id: 'parse_error',
        error: {
          code: -32700,
          message: 'Parse error',
          data: error instanceof Error ? error.message : String(error)
        }
      };
      
      this.forwardToStdout(errorResponse);
    }
  }
  
  /**
   * 轉發消息到 WebSocket
   */
  private forwardToWebSocket(message: any): void {
    if (!this.isConnected || !this.ws) {
      console.error('[MCP Client] WebSocket not connected, cannot forward message');
      
      // 發送錯誤響應
      const errorResponse: MCPResponse = {
        jsonrpc: "2.0",
        id: message.id || 'error',
        error: {
          code: -32000,
          message: 'WebSocket not connected',
          data: null
        }
      };
      
      this.forwardToStdout(errorResponse);
      return;
    }
    
    try {
      // 包裝消息
      const websocketMessage: WebSocketMessage = {
        id: message.id || `msg_${Date.now()}`,
        type: MessageType.MCP_REQUEST,
        timestamp: Date.now(),
        data: message
      };
      
      this.sendWebSocketMessage(websocketMessage);
      
    } catch (error) {
      console.error('[MCP Client] Error forwarding message to WebSocket:', error);
      
      // 發送錯誤響應
      const errorResponse: MCPResponse = {
        jsonrpc: "2.0",
        id: message.id || 'error',
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        }
      };
      
      this.forwardToStdout(errorResponse);
    }
  }
  
  /**
   * 轉發消息到 stdout
   */
  private forwardToStdout(message: any): void {
    try {
      const output = JSON.stringify(message);
      console.log(output);
    } catch (error) {
      console.error('[MCP Client] Error forwarding message to stdout:', error);
    }
  }
  
  /**
   * 發送 WebSocket 消息
   */
  private sendWebSocketMessage(message: WebSocketMessage): void {
    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[MCP Client] Error sending WebSocket message:', error);
      }
    }
  }
  
  /**
   * 關閉客戶端
   */
  async shutdown(exitCode: number = 0): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    
    this.isShuttingDown = true;
    console.log('[MCP Client] Shutting down...');
    
    try {
      // 停止心跳
      this.stopHeartbeat();
      
      // 清除重連定時器
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      // 關閉 WebSocket 連接
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      
      // 關閉 readline 接口
      this.rl.close();
      
      console.log('[MCP Client] ✅ Shutdown completed');
      
    } catch (error) {
      console.error('[MCP Client] Error during shutdown:', error);
    } finally {
      process.exit(exitCode);
    }
  }
  
  /**
   * 獲取客戶端狀態
   */
  getStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    uptime: number;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      uptime: process.uptime()
    };
  }
  
  /**
   * 清理資源
   */
  dispose(): void {
    this.shutdown(0);
  }
}

// 如果直接運行此文件，啟動客戶端
if (require.main === module) {
  const client = new WebSocketMCPClient();
  
  client.start().catch((error) => {
    console.error('[MCP Client] Failed to start client:', error);
    process.exit(1);
  });
}
