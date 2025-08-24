import * as WebSocket from 'ws';
import { WebSocketMessage, MessageType } from './interfaces/websocket';

/**
 * WebSocket 客戶端實現
 */
export class WebSocketClient {
  public id: string;
  public ws: WebSocket;
  public connected: boolean = false;
  public lastHeartbeat: number = Date.now();
  public messageCount: number = 0;
  public errorCount: number = 0;

  constructor(id: string, ws: WebSocket) {
    this.id = id;
    this.ws = ws;
    this.connected = true;
    this.setupEventHandlers();
  }

  /**
   * 設置事件處理器
   */
  private setupEventHandlers(): void {
    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.messageCount++;
        this.handleMessage(message);
      } catch (error) {
        this.errorCount++;
        console.error(`[WebSocketClient] Failed to parse message:`, error);
      }
    });

    this.ws.on('close', () => {
      this.connected = false;
      console.log(`[WebSocketClient] Client ${this.id} disconnected`);
    });

    this.ws.on('error', (error) => {
      this.errorCount++;
      console.error(`[WebSocketClient] Client ${this.id} error:`, error);
    });
  }

  /**
   * 處理接收到的消息
   */
  private handleMessage(message: any): void {
    // 這裡可以添加消息處理邏輯
    console.log(`[WebSocketClient] Received message from ${this.id}:`, message);
  }

  /**
   * 發送消息
   */
  public send(message: WebSocketMessage): void {
    if (this.connected && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        this.errorCount++;
        console.error(`[WebSocketClient] Failed to send message:`, error);
      }
    }
  }

  /**
   * 關閉連接
   */
  public close(code?: number, reason?: string): void {
    this.connected = false;
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(code, reason);
    }
  }

  /**
   * 獲取健康狀態
   */
  public getHealth(): any {
    return {
      id: this.id,
      connected: this.connected,
      lastHeartbeat: this.lastHeartbeat,
      messageCount: this.messageCount,
      errorCount: this.errorCount,
      uptime: Date.now() - this.lastHeartbeat
    };
  }

  /**
   * 檢查是否連接
   */
  public get isConnected(): boolean {
    return this.connected && this.ws.readyState === WebSocket.OPEN;
  }
}
