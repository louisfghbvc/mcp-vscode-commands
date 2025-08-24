/**
 * WebSocket 消息類型
 */
export enum MessageType {
  CONNECT = 'connect',
  MCP_REQUEST = 'mcp_request',
  MCP_RESPONSE = 'mcp_response',
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}

/**
 * WebSocket 消息接口
 */
export interface WebSocketMessage {
  id: string;
  type: MessageType;
  data?: any;
  timestamp: number;
}

/**
 * WebSocket 客戶端接口
 */
export interface WebSocketClient {
  id: string;
  ws: any; // WebSocket 實例
  connected: boolean;
  lastHeartbeat: number;
  messageCount: number;
  errorCount: number;
  
  send(message: WebSocketMessage): void;
  close(code?: number, reason?: string): void;
  getHealth(): any;
}
