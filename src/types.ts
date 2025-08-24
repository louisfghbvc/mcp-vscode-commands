/**
 * MCP VSCode Commands 類型定義
 */

export interface MCPToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
}

export interface VSCodeCommandInfo {
  id: string;
  title?: string;
  category?: string;
}

export interface CommandExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
}

export interface MCPServerConfig {
  autoStart?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  name?: string;
  version?: string;
  tools?: string[];
}

export interface LogContext {
  command?: string;
  args?: any;
  filter?: string;
  error?: string;
  timestamp: string;
}
