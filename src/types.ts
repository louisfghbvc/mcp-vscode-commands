/**
 * MCP VSCode Commands 類型定義
 */



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


