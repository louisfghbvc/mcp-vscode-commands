import { WebSocketMessage } from '../websocket-server';

/**
 * 進程間通信接口
 * 
 * 定義 Extension 和 MCP Server 進程之間的通信協議
 */
export interface ProcessCommunication {
  // 啟動 MCP 服務器進程
  startMCPServer(): Promise<void>;
  
  // 停止 MCP 服務器進程
  stopMCPServer(): Promise<void>;
  
  // 發送消息到 MCP 服務器
  sendMessage(message: WebSocketMessage): Promise<void>;
  
  // 接收來自 MCP 服務器的消息
  onMessage(callback: (message: WebSocketMessage) => void): void;
  
  // 檢查進程健康狀態
  checkHealth(): Promise<HealthStatus>;
  
  // 獲取連接統計信息
  getConnectionStats(): ConnectionStats;
}

/**
 * 健康狀態接口
 */
export interface HealthStatus {
  isAlive: boolean;
  uptime: number;
  memoryUsage: number;
  lastHeartbeat: number;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  processStatus: 'running' | 'stopped' | 'crashed';
  websocketStatus: 'open' | 'closed' | 'connecting';
}

/**
 * 連接統計信息
 */
export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  failedConnections: number;
  reconnectAttempts: number;
  averageLatency: number;
  messageCount: {
    sent: number;
    received: number;
    errors: number;
  };
  uptime: number;
}

/**
 * MCP 工具調用請求
 */
export interface ToolCallRequest {
  name: string;
  arguments: Record<string, any>;
  timeout?: number;
  metadata?: {
    source: string;
    timestamp: number;
    requestId: string;
  };
}

/**
 * MCP 工具調用響應
 */
export interface ToolCallResponse {
  content: Array<{
    type: 'text' | 'image_url' | 'error';
    text?: string;
    image_url?: string;
    error?: string;
  }>;
  isError: boolean;
  errorMessage?: string;
  metadata?: {
    executionTime: number;
    timestamp: number;
    requestId: string;
  };
}

/**
 * 錯誤處理接口
 */
export interface ErrorHandler {
  // 處理連接錯誤
  handleConnectionError(error: Error, context: string): Promise<void>;
  
  // 處理消息處理錯誤
  handleMessageError(error: Error, message: WebSocketMessage): Promise<void>;
  
  // 處理進程錯誤
  handleProcessError(error: Error, processId: string): Promise<void>;
  
  // 記錄錯誤
  logError(error: Error, context: string, metadata?: Record<string, any>): void;
}

/**
 * 重連策略接口
 */
export interface ReconnectStrategy {
  // 啟動重連
  startReconnection(): Promise<void>;
  
  // 執行重連
  executeReconnection(): Promise<void>;
  
  // 檢查是否應該重連
  shouldReconnect(): boolean;
  
  // 獲取重連延遲
  getReconnectDelay(): number;
  
  // 重置重連計數器
  resetReconnectCount(): void;
}

/**
 * 性能監控接口
 */
export interface PerformanceMonitor {
  // 記錄性能指標
  recordMetric(name: string, value: number, timestamp?: number): void;
  
  // 獲取性能指標
  getMetric(name: string): MetricValue[];
  
  // 獲取平均性能指標
  getAverageMetric(name: string): number;
  
  // 獲取性能報告
  getPerformanceReport(): PerformanceReport;
  
  // 清理舊的性能數據
  cleanupOldMetrics(maxAge: number): void;
}

/**
 * 性能指標值
 */
export interface MetricValue {
  value: number;
  timestamp: number;
}

/**
 * 性能報告
 */
export interface PerformanceReport {
  timestamp: number;
  metrics: Record<string, {
    current: number;
    average: number;
    min: number;
    max: number;
    count: number;
  }>;
  summary: {
    totalMetrics: number;
    averageLatency: number;
    errorRate: number;
    throughput: number;
  };
}

/**
 * 配置接口
 */
export interface WebSocketConfig {
  // WebSocket 服務器配置
  server: {
    port: number;
    host: string;
    path: string;
  };
  
  // 連接配置
  connection: {
    timeout: number;
    maxRetries: number;
    retryDelay: number;
    heartbeatInterval: number;
  };
  
  // 性能配置
  performance: {
    maxConnections: number;
    messageBufferSize: number;
    flushInterval: number;
    maxMessageSize: number;
  };
  
  // 安全配置
  security: {
    enableAuth: boolean;
    allowedOrigins: string[];
    maxRequestSize: number;
  };
  
  // 日誌配置
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableRequestLogging: boolean;
    enablePerformanceLogging: boolean;
  };
}

/**
 * 事件接口
 */
export interface EventEmitter {
  // 註冊事件監聽器
  on(event: string, listener: (...args: any[]) => void): void;
  
  // 移除事件監聽器
  off(event: string, listener: (...args: any[]) => void): void;
  
  // 觸發事件
  emit(event: string, ...args: any[]): void;
  
  // 移除所有事件監聽器
  removeAllListeners(event?: string): void;
}

/**
 * 生命週期管理接口
 */
export interface LifecycleManager {
  // 初始化
  initialize(): Promise<void>;
  
  // 啟動
  start(): Promise<void>;
  
  // 停止
  stop(): Promise<void>;
  
  // 重啟
  restart(): Promise<void>;
  
  // 檢查狀態
  getStatus(): 'initializing' | 'running' | 'stopped' | 'error';
  
  // 等待就緒
  waitForReady(): Promise<void>;
}
