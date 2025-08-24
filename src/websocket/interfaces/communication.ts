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
