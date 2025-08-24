import { WebSocketMessage, MessageType } from '../websocket-server';
import { ReconnectStrategy } from '../interfaces/communication';

/**
 * 連接管理器
 * 
 * 負責管理 WebSocket 連接的生命週期，包括連接、斷開、重連等
 */
export class ConnectionManager {
  private reconnectStrategy: ReconnectStrategy;
  private healthChecker: HealthChecker;
  private connectionState: ConnectionState = 'disconnected';
  private lastConnectionTime: number = 0;
  private connectionAttempts: number = 0;
  private maxConnectionAttempts: number = 10;
  
  constructor(
    reconnectStrategy: ReconnectStrategy,
    healthChecker: HealthChecker
  ) {
    this.reconnectStrategy = reconnectStrategy;
    this.healthChecker = healthChecker;
  }
  
  /**
   * 處理連接斷開
   */
  async handleDisconnection(reason: string): Promise<void> {
    console.log(`[Connection Manager] Connection lost: ${reason}`);
    
    // 更新連接狀態
    this.connectionState = 'disconnected';
    
    // 記錄斷開原因
    this.logDisconnection(reason);
    
    // 更新健康狀態
    this.healthChecker.updateStatus('disconnected');
    
    // 檢查是否應該重連
    if (this.shouldAttemptReconnection()) {
      await this.startReconnection();
    } else {
      console.log('[Connection Manager] Max reconnection attempts reached, stopping recovery');
    }
  }
  
  /**
   * 處理重連
   */
  async handleReconnection(): Promise<void> {
    try {
      console.log('[Connection Manager] Starting reconnection process...');
      
      this.connectionState = 'reconnecting';
      this.healthChecker.updateStatus('reconnecting');
      
      // 執行重連策略
      await this.reconnectStrategy.executeReconnection();
      
      // 重連成功
      this.connectionState = 'connected';
      this.connectionAttempts = 0;
      this.lastConnectionTime = Date.now();
      
      this.healthChecker.updateStatus('connected');
      console.log('[Connection Manager] Successfully reconnected');
      
    } catch (error) {
      console.error('[Connection Manager] Reconnection failed:', error);
      
      this.connectionState = 'disconnected';
      this.healthChecker.updateStatus('disconnected');
      
      // 增加重連嘗試次數
      this.connectionAttempts++;
      
      // 檢查是否應該繼續嘗試
      if (this.shouldAttemptReconnection()) {
        await this.scheduleNextReconnection();
      }
    }
  }
  
  /**
   * 啟動重連過程
   */
  private async startReconnection(): Promise<void> {
    try {
      await this.reconnectStrategy.startReconnection();
    } catch (error) {
      console.error('[Connection Manager] Failed to start reconnection strategy:', error);
      throw error;
    }
  }
  
  /**
   * 檢查是否應該嘗試重連
   */
  private shouldAttemptReconnection(): boolean {
    return this.connectionAttempts < this.maxConnectionAttempts;
  }
  
  /**
   * 安排下次重連
   */
  private async scheduleNextReconnection(): Promise<void> {
    const delay = this.calculateReconnectionDelay();
    
    console.log(`[Connection Manager] Scheduling next reconnection attempt in ${delay}ms...`);
    
    setTimeout(() => {
      this.handleReconnection();
    }, delay);
  }
  
  /**
   * 計算重連延遲
   */
  private calculateReconnectionDelay(): number {
    // 指數退避策略，最大延遲 30 秒
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    
    const delay = baseDelay * Math.pow(2, this.connectionAttempts - 1);
    return Math.min(delay, maxDelay);
  }
  
  /**
   * 記錄斷開原因
   */
  private logDisconnection(reason: string): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      reason: reason,
      connectionAttempts: this.connectionAttempts,
      lastConnectionTime: this.lastConnectionTime ? new Date(this.lastConnectionTime).toISOString() : null
    };
    
    console.log('[Connection Manager] Disconnection logged:', logEntry);
    
    // 這裡可以將日誌寫入文件或發送到日誌系統
  }
  
  /**
   * 獲取當前連接狀態
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  /**
   * 獲取連接統計信息
   */
  getConnectionStats(): ConnectionStats {
    return {
      state: this.connectionState,
      attempts: this.connectionAttempts,
      maxAttempts: this.maxConnectionAttempts,
      lastConnectionTime: this.lastConnectionTime,
      uptime: this.lastConnectionTime ? Date.now() - this.lastConnectionTime : 0
    };
  }
  
  /**
   * 重置連接計數器
   */
  resetConnectionCounters(): void {
    this.connectionAttempts = 0;
    this.lastConnectionTime = 0;
    console.log('[Connection Manager] Connection counters reset');
  }
  
  /**
   * 強制重連
   */
  async forceReconnection(): Promise<void> {
    console.log('[Connection Manager] Force reconnection requested');
    
    this.resetConnectionCounters();
    this.connectionState = 'reconnecting';
    
    await this.handleReconnection();
  }
}

/**
 * 連接狀態類型
 */
export type ConnectionState = 'connected' | 'disconnected' | 'reconnecting';

/**
 * 連接統計信息
 */
export interface ConnectionStats {
  state: ConnectionState;
  attempts: number;
  maxAttempts: number;
  lastConnectionTime: number;
  uptime: number;
}

/**
 * 健康檢查器接口
 */
export interface HealthChecker {
  updateStatus(status: 'connected' | 'disconnected' | 'reconnecting'): void;
}
