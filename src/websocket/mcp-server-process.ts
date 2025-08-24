import { spawn, ChildProcess } from 'child_process';
import { WebSocketClient } from './websocket-server';
import { WebSocketMessage, MessageType } from './websocket-server';

/**
 * MCP Server Process Manager
 * 
 * 管理獨立的 MCP 服務器進程，該進程作為 WebSocket Client
 * 連接到 Extension 的 WebSocket Server
 */
export class MCPServerProcess {
  private process: ChildProcess | null = null;
  private websocketClient: WebSocketClient | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 second
  private maxReconnectDelay = 30000; // 30 seconds
  private isShuttingDown = false;
  
  constructor(
    private serverScript: string = 'dist/mcp-server.js',
    private websocketUrl: string = 'ws://localhost:19847',
    private env: Record<string, string> = {}
  ) {}
  
  /**
   * 啟動 MCP 服務器進程
   */
  async start(): Promise<void> {
    try {
      console.log('[MCP Process] Starting MCP server process...');
      
      // 啟動 MCP 服務器進程
      this.process = spawn('node', [this.serverScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env, 
          WEBSOCKET_MODE: 'true',
          ...this.env
        }
      });
      
      // 設置進程監控
      this.setupProcessMonitoring();
      
      // 等待進程啟動
      await this.waitForProcessStartup();
      
      // 連接到 Extension WebSocket Server
      await this.connectToExtension();
      
      console.log('[MCP Process] MCP server process started successfully');
      
    } catch (error) {
      console.error('[MCP Process] Failed to start MCP server process:', error);
      throw error;
    }
  }
  
  /**
   * 停止 MCP 服務器進程
   */
  async stop(): Promise<void> {
    try {
      console.log('[MCP Process] Stopping MCP server process...');
      
      this.isShuttingDown = true;
      
      // 關閉 WebSocket 連接
      if (this.websocketClient) {
        this.websocketClient.close();
        this.websocketClient = null;
      }
      
      // 終止進程
      if (this.process) {
        this.process.removeAllListeners();
        this.process.kill('SIGTERM');
        
        // 等待進程正常終止
        await this.waitForProcessTermination();
        
        this.process = null;
      }
      
      console.log('[MCP Process] MCP server process stopped');
      
    } catch (error) {
      console.error('[MCP Process] Error stopping process:', error);
      
      // 強制終止進程
      if (this.process) {
        this.process.kill('SIGKILL');
        this.process = null;
      }
    }
  }
  
  /**
   * 設置進程監控
   */
  private setupProcessMonitoring(): void {
    if (!this.process) return;
    
    // 監控進程輸出
    this.process.stdout?.on('data', (data: Buffer) => {
      console.log(`[MCP Process] stdout: ${data.toString().trim()}`);
    });
    
    this.process.stderr?.on('data', (data: Buffer) => {
      console.error(`[MCP Process] stderr: ${data.toString().trim()}`);
    });
    
    // 監控進程退出
    this.process.on('exit', (code: number, signal: string) => {
      console.log(`[MCP Process] Process exited with code ${code}, signal ${signal}`);
      
      if (!this.isShuttingDown) {
        this.handleProcessExit(code, signal);
      }
    });
    
    // 監控進程錯誤
    this.process.on('error', (error: Error) => {
      console.error('[MCP Process] Process error:', error);
      
      if (!this.isShuttingDown) {
        this.handleProcessError(error);
      }
    });
  }
  
  /**
   * 等待進程啟動
   */
  private async waitForProcessStartup(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('Process not started'));
        return;
      }
      
      // 檢查進程是否已經啟動
      if (this.process.pid) {
        resolve();
        return;
      }
      
      // 等待進程啟動
      const timeout = setTimeout(() => {
        reject(new Error('Process startup timeout'));
      }, 10000); // 10 seconds
      
      this.process.once('spawn', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
  
  /**
   * 等待進程終止
   */
  private async waitForProcessTermination(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }
      
      const timeout = setTimeout(() => {
        resolve();
      }, 5000); // 5 seconds
      
      this.process!.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
  
  /**
   * 連接到 Extension WebSocket Server
   */
  private async connectToExtension(): Promise<void> {
    try {
      console.log(`[MCP Process] Connecting to Extension WebSocket Server: ${this.websocketUrl}`);
      
      // 創建 WebSocket 客戶端
      this.websocketClient = new WebSocketClient('mcp_process', this.websocketUrl);
      
      // 設置連接事件處理
      this.setupWebSocketEventHandlers();
      
      // 等待連接建立
      await this.waitForWebSocketConnection();
      
      console.log('[MCP Process] Successfully connected to Extension WebSocket Server');
      
    } catch (error) {
      console.error('[MCP Process] Failed to connect to Extension:', error);
      throw error;
    }
  }
  
  /**
   * 設置 WebSocket 事件處理器
   */
  private setupWebSocketEventHandlers(): void {
    if (!this.websocketClient) return;
    
    this.websocketClient.on('open', () => {
      console.log('[MCP Process] WebSocket connection opened');
      this.reconnectAttempts = 0;
      
      // 發送連接消息
      this.sendConnectMessage();
    });
    
    this.websocketClient.on('close', () => {
      console.log('[MCP Process] WebSocket connection closed');
      this.handleWebSocketDisconnection();
    });
    
    this.websocketClient.on('error', (error) => {
      console.error('[MCP Process] WebSocket connection error:', error);
      this.handleWebSocketDisconnection();
    });
    
    this.websocketClient.on('message', (data: any) => {
      this.handleWebSocketMessage(data);
    });
  }
  
  /**
   * 等待 WebSocket 連接建立
   */
  private async waitForWebSocketConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.websocketClient) {
        reject(new Error('WebSocket client not created'));
        return;
      }
      
      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000); // 10 seconds
      
      this.websocketClient!.on('open', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
  
  /**
   * 發送連接消息
   */
  private sendConnectMessage(): void {
    if (!this.websocketClient) return;
    
    const connectMessage: WebSocketMessage = {
      id: 'connect',
      type: MessageType.CONNECT,
      timestamp: Date.now(),
      data: {
        clientType: 'mcp_server',
        version: '1.0.0',
        capabilities: ['mcp_request', 'mcp_response']
      }
    };
    
    this.websocketClient.send(connectMessage);
  }
  
  /**
   * 處理 WebSocket 消息
   */
  private handleWebSocketMessage(data: any): void {
    try {
      const message = JSON.parse(data);
      console.log(`[MCP Process] Received message: ${message.type}`);
      
      // 處理不同類型的消息
      switch (message.type) {
        case MessageType.HEARTBEAT:
          this.handleHeartbeat(message);
          break;
        case MessageType.MCP_REQUEST:
          this.handleMCPRequest(message);
          break;
        default:
          console.log(`[MCP Process] Unknown message type: ${message.type}`);
      }
      
    } catch (error) {
      console.error('[MCP Process] Error parsing WebSocket message:', error);
    }
  }
  
  /**
   * 處理心跳消息
   */
  private handleHeartbeat(message: any): void {
    // 回應心跳
    if (this.websocketClient) {
      const heartbeatResponse: WebSocketMessage = {
        id: 'heartbeat_response',
        type: MessageType.HEARTBEAT,
        timestamp: Date.now(),
        data: {
          clientTime: Date.now(),
          uptime: process.uptime()
        }
      };
      
      this.websocketClient.send(heartbeatResponse);
    }
  }
  
  /**
   * 處理 MCP 請求
   */
  private handleMCPRequest(message: any): void {
    // 這裡應該實現 MCP 協議的處理邏輯
    // 目前只是記錄請求
    console.log(`[MCP Process] MCP request: ${JSON.stringify(message.data)}`);
    
    // 發送響應（示例）
    if (this.websocketClient) {
      const response: WebSocketMessage = {
        id: message.id || 'response',
        type: MessageType.MCP_RESPONSE,
        timestamp: Date.now(),
        data: {
          jsonrpc: "2.0",
          id: message.id || 'response',
          result: {
            status: 'processed',
            message: 'MCP request received'
          }
        }
      };
      
      this.websocketClient.send(response);
    }
  }
  
  /**
   * 處理 WebSocket 斷開連接
   */
  private handleWebSocketDisconnection(): void {
    if (this.isShuttingDown) return;
    
    console.log('[MCP Process] WebSocket disconnected, attempting to reconnect...');
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
      
      console.log(`[MCP Process] Reconnection attempt ${this.reconnectAttempts}, waiting ${delay}ms...`);
      
      setTimeout(() => {
        this.connectToExtension();
      }, delay);
    } else {
      console.error('[MCP Process] Max reconnection attempts reached');
      this.handleMaxReconnectionAttemptsReached();
    }
  }
  
  /**
   * 處理進程退出
   */
  private handleProcessExit(code: number, signal: string): void {
    console.error(`[MCP Process] Process crashed: exit code ${code}, signal ${signal}`);
    
    if (!this.isShuttingDown) {
      // 嘗試重啟進程
      this.restartProcess();
    }
  }
  
  /**
   * 處理進程錯誤
   */
  private handleProcessError(error: Error): void {
    console.error('[MCP Process] Process error:', error);
    
    if (!this.isShuttingDown) {
      // 嘗試重啟進程
      this.restartProcess();
    }
  }
  
  /**
   * 重啟進程
   */
  private async restartProcess(): Promise<void> {
    try {
      console.log('[MCP Process] Attempting to restart process...');
      
      // 清理舊進程
      if (this.process) {
        this.process.removeAllListeners();
        this.process = null;
      }
      
      // 等待一段時間再重啟
      await this.sleep(2000);
      
      // 重新啟動進程
      await this.start();
      
    } catch (error) {
      console.error('[MCP Process] Process restart failed:', error);
      throw error;
    }
  }
  
  /**
   * 處理最大重連嘗試次數達到
   */
  private handleMaxReconnectionAttemptsReached(): void {
    console.error('[MCP Process] Max reconnection attempts reached, stopping recovery');
    
    // 可以選擇重啟整個進程或者退出
    this.restartProcess();
  }
  
  /**
   * 檢查進程健康狀態
   */
  public isHealthy(): boolean {
    return this.process !== null && 
           this.websocketClient !== null && 
           this.websocketClient.isConnected();
  }
  
  /**
   * 獲取進程狀態信息
   */
  public getStatus(): {
    processAlive: boolean;
    websocketConnected: boolean;
    reconnectAttempts: number;
    uptime: number;
  } {
    return {
      processAlive: this.process !== null,
      websocketConnected: this.websocketClient?.isConnected() || false,
      reconnectAttempts: this.reconnectAttempts,
      uptime: this.process ? process.uptime() : 0
    };
  }
  
  /**
   * 工具函數：延遲
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
