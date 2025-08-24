import * as vscode from 'vscode';
import { WebSocketClient } from './websocket-client';
import { WebSocketMessage, MessageType } from './interfaces/websocket';

/**
 * 連接管理器
 * 
 * 負責管理 WebSocket 連接的生命週期，包括連接建立、維護、斷開等
 */
export class ConnectionManager {
  private connections: Map<string, ConnectionInfo> = new Map();
  private maxConnections: number = 10;
  private connectionTimeout: number = 30000; // 30 seconds
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startCleanupTimer();
  }
  
  /**
   * 添加新連接
   */
  addConnection(client: WebSocketClient, remoteAddress?: string): void {
    const connectionInfo: ConnectionInfo = {
      id: client.id,
      client: client,
      remoteAddress: remoteAddress || 'unknown',
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      messageCount: {
        sent: 0,
        received: 0,
        errors: 0
      },
      status: 'active'
    };
    
    this.connections.set(client.id, connectionInfo);
    
    console.log(`[Connection Manager] New connection added: ${client.id} from ${remoteAddress}`);
    
    // 檢查是否超過最大連接數
    if (this.connections.size > this.maxConnections) {
      this.handleMaxConnectionsReached();
    }
  }
  
  /**
   * 移除連接
   */
  removeConnection(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      console.log(`[Connection Manager] Connection removed: ${clientId}`);
      this.connections.delete(clientId);
    }
  }
  
  /**
   * 更新連接活動時間
   */
  updateActivity(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.lastActivity = Date.now();
    }
  }
  
  /**
   * 記錄發送的消息
   */
  recordSentMessage(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.messageCount.sent++;
      connection.lastActivity = Date.now();
    }
  }
  
  /**
   * 記錄接收的消息
   */
  recordReceivedMessage(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.messageCount.received++;
      connection.lastActivity = Date.now();
    }
  }
  
  /**
   * 記錄錯誤消息
   */
  recordErrorMessage(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.messageCount.errors++;
      connection.lastActivity = Date.now();
    }
  }
  
  /**
   * 設置連接狀態
   */
  setConnectionStatus(clientId: string, status: ConnectionStatus): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.status = status;
      console.log(`[Connection Manager] Connection ${clientId} status changed to: ${status}`);
    }
  }
  
  /**
   * 獲取連接信息
   */
  getConnection(clientId: string): ConnectionInfo | undefined {
    return this.connections.get(clientId);
  }
  
  /**
   * 獲取所有連接
   */
  getAllConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }
  
  /**
   * 獲取活躍連接數量
   */
  getActiveConnectionCount(): number {
    return Array.from(this.connections.values()).filter(conn => conn.status === 'active').length;
  }
  
  /**
   * 獲取連接統計信息
   */
  getConnectionStats(): ConnectionStats {
    const totalConnections = this.connections.size;
    const activeConnections = this.getActiveConnectionCount();
    const totalMessages = Array.from(this.connections.values()).reduce((total, conn) => {
      return total + conn.messageCount.sent + conn.messageCount.received;
    }, 0);
    const totalErrors = Array.from(this.connections.values()).reduce((total, conn) => {
      return total + conn.messageCount.errors;
    }, 0);
    
    return {
      totalConnections,
      activeConnections,
      inactiveConnections: totalConnections - activeConnections,
      totalMessages,
      totalErrors,
      errorRate: totalMessages > 0 ? (totalErrors / totalMessages) * 100 : 0,
      uptime: process.uptime()
    };
  }
  
  /**
   * 檢查連接健康狀態
   */
  checkConnectionHealth(clientId: string): ConnectionHealth {
    const connection = this.connections.get(clientId);
    if (!connection) {
      return { isHealthy: false, reason: 'Connection not found' };
    }
    
    const now = Date.now();
    const timeSinceLastActivity = now - connection.lastActivity;
    const timeSinceConnected = now - connection.connectedAt;
    
    // 檢查連接是否超時
    if (timeSinceLastActivity > this.connectionTimeout) {
      return { 
        isHealthy: false, 
        reason: 'Connection timeout',
        details: {
          lastActivity: timeSinceLastActivity,
          timeout: this.connectionTimeout
        }
      };
    }
    
    // 檢查連接狀態
    if (connection.status !== 'active') {
      return { 
        isHealthy: false, 
        reason: `Connection status: ${connection.status}` 
      };
    }
    
    // 檢查錯誤率
    const totalMessages = connection.messageCount.sent + connection.messageCount.received;
    const errorRate = totalMessages > 0 ? (connection.messageCount.errors / totalMessages) * 100 : 0;
    
    if (errorRate > 50) { // 錯誤率超過 50%
      return { 
        isHealthy: false, 
        reason: 'High error rate',
        details: {
          errorRate: errorRate,
          threshold: 50
        }
      };
    }
    
    return { 
      isHealthy: true, 
      reason: 'Connection healthy',
      details: {
        uptime: timeSinceConnected,
        messageCount: totalMessages,
        errorRate: errorRate
      }
    };
  }
  
  /**
   * 處理最大連接數達到
   */
  private handleMaxConnectionsReached(): void {
    console.warn(`[Connection Manager] Maximum connections (${this.maxConnections}) reached`);
    
    // 找到最舊的連接並關閉
    const oldestConnection = Array.from(this.connections.values())
      .sort((a, b) => a.connectedAt - b.connectedAt)[0];
    
    if (oldestConnection) {
      console.log(`[Connection Manager] Closing oldest connection: ${oldestConnection.id}`);
      oldestConnection.client.close();
      this.removeConnection(oldestConnection.id);
    }
  }
  
  /**
   * 清理超時連接
   */
  private cleanupTimeoutConnections(): void {
    const now = Date.now();
    const timeoutConnections: string[] = [];
    
    this.connections.forEach((connection, clientId) => {
      if (now - connection.lastActivity > this.connectionTimeout) {
        timeoutConnections.push(clientId);
      }
    });
    
    timeoutConnections.forEach(clientId => {
      const connection = this.connections.get(clientId);
      if (connection) {
        console.log(`[Connection Manager] Closing timeout connection: ${clientId}`);
        connection.client.close();
        this.removeConnection(clientId);
      }
    });
    
    if (timeoutConnections.length > 0) {
      console.log(`[Connection Manager] Cleaned up ${timeoutConnections.length} timeout connections`);
    }
  }
  
  /**
   * 開始清理定時器
   */
  private startCleanupTimer(): void {
    // 每分鐘清理一次超時連接
    this.cleanupInterval = setInterval(() => {
      this.cleanupTimeoutConnections();
    }, 60 * 1000);
  }
  
  /**
   * 停止清理定時器
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
  
  /**
   * 廣播消息到所有活躍連接
   */
  broadcast(message: WebSocketMessage): void {
    let sentCount = 0;
    
    this.connections.forEach((connection) => {
              if (connection.status === 'active' && connection.client.isConnected) {
        try {
          connection.client.send(message);
          sentCount++;
        } catch (error) {
          console.error(`[Connection Manager] Failed to send broadcast to ${connection.id}:`, error);
          this.recordErrorMessage(connection.id);
        }
      }
    });
    
    console.log(`[Connection Manager] Broadcast sent to ${sentCount} connections`);
  }
  
  /**
   * 發送消息到特定連接
   */
  sendToConnection(clientId: string, message: WebSocketMessage): boolean {
    const connection = this.connections.get(clientId);
            if (connection && connection.status === 'active' && connection.client.isConnected) {
      try {
        connection.client.send(message);
        this.recordSentMessage(clientId);
        return true;
      } catch (error) {
        console.error(`[Connection Manager] Failed to send message to ${clientId}:`, error);
        this.recordErrorMessage(clientId);
        return false;
      }
    }
    return false;
  }
  
  /**
   * 斷開所有連接
   */
  disconnectAll(): void {
    console.log(`[Connection Manager] Disconnecting all ${this.connections.size} connections`);
    
    this.connections.forEach((connection) => {
      try {
        connection.client.close();
      } catch (error) {
        console.error(`[Connection Manager] Error closing connection ${connection.id}:`, error);
      }
    });
    
    this.connections.clear();
  }
  
  /**
   * 設置最大連接數
   */
  setMaxConnections(maxConnections: number): void {
    this.maxConnections = maxConnections;
    console.log(`[Connection Manager] Max connections set to: ${maxConnections}`);
  }
  
  /**
   * 設置連接超時時間
   */
  setConnectionTimeout(timeout: number): void {
    this.connectionTimeout = timeout;
    console.log(`[Connection Manager] Connection timeout set to: ${timeout}ms`);
  }
  
  /**
   * 清理資源
   */
  dispose(): void {
    this.stopCleanupTimer();
    this.disconnectAll();
  }
}

/**
 * 連接信息接口
 */
export interface ConnectionInfo {
  id: string;
  client: WebSocketClient;
  remoteAddress: string;
  connectedAt: number;
  lastActivity: number;
  messageCount: {
    sent: number;
    received: number;
    errors: number;
  };
  status: ConnectionStatus;
}

/**
 * 連接狀態類型
 */
export type ConnectionStatus = 'active' | 'inactive' | 'error' | 'closing';

/**
 * 連接統計信息
 */
export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  inactiveConnections: number;
  totalMessages: number;
  totalErrors: number;
  errorRate: number;
  uptime: number;
}

/**
 * 連接健康狀態
 */
export interface ConnectionHealth {
  isHealthy: boolean;
  reason: string;
  details?: {
    lastActivity?: number;
    timeout?: number;
    uptime?: number;
    messageCount?: number;
    errorRate?: number;
    threshold?: number;
  };
}
