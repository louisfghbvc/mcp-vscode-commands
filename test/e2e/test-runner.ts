import { spawn, ChildProcess } from 'child_process';
import { E2ETestSuite } from './e2e-test-suite';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Test Runner for End-to-End Integration Tests
 * Handles MCP server lifecycle and test execution
 */

interface MCPMessage {
  jsonrpc: string;
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: any;
}

class MCPTestClient {
  private mcpProcess: ChildProcess | null = null;
  private messageId = 1;
  private pendingRequests = new Map<string | number, { resolve: Function; reject: Function }>();

  /**
   * Start the MCP server for testing
   */
  async startMCPServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      const serverPath = path.join(__dirname, '../../src/mcp-stdio-server-standalone.ts');
      
      // Compile and run the TypeScript server
      this.mcpProcess = spawn('npx', ['tsx', serverPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: path.join(__dirname, '../..')
      });

      if (!this.mcpProcess.stdout || !this.mcpProcess.stdin || !this.mcpProcess.stderr) {
        return reject(new Error('Failed to create MCP server process'));
      }

      // Handle server output
      this.mcpProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const message: MCPMessage = JSON.parse(line);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse MCP message:', line);
          }
        }
      });

      this.mcpProcess.stderr.on('data', (data) => {
        console.error('MCP Server Error:', data.toString());
      });

      this.mcpProcess.on('error', (error) => {
        console.error('MCP Process Error:', error);
        reject(error);
      });

      // Initialize the server
      setTimeout(async () => {
        try {
          await this.initialize();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 1000);
    });
  }

  /**
   * Stop the MCP server
   */
  async stopMCPServer(): Promise<void> {
    if (this.mcpProcess) {
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }
  }

  /**
   * Initialize MCP connection
   */
  private async initialize(): Promise<void> {
    const initMessage = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'e2e-test-client',
          version: '1.0.0'
        }
      }
    };

    await this.sendMessage(initMessage);
    
    // Send initialized notification
    await this.sendNotification('notifications/initialized', {});
  }

  /**
   * Call an MCP tool
   */
  async callTool(toolName: string, arguments_: any = {}): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: arguments_
      }
    };

    return this.sendMessage(message);
  }

  /**
   * List available tools
   */
  async listTools(): Promise<any> {
    const message = {
      jsonrpc: '2.0',
      id: this.messageId++,
      method: 'tools/list',
      params: {}
    };

    return this.sendMessage(message);
  }

  /**
   * Send a message to the MCP server
   */
  private async sendMessage(message: MCPMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.mcpProcess?.stdin) {
        return reject(new Error('MCP server not running'));
      }

      const messageStr = JSON.stringify(message) + '\n';
      
      if (message.id !== undefined) {
        this.pendingRequests.set(message.id, { resolve, reject });
        
        // Set timeout for requests
        setTimeout(() => {
          if (this.pendingRequests.has(message.id!)) {
            this.pendingRequests.delete(message.id!);
            reject(new Error(`Request timeout for message ${message.id}`));
          }
        }, 10000); // 10 second timeout
      }

      this.mcpProcess.stdin.write(messageStr);
      
      if (message.id === undefined) {
        resolve(undefined); // Notification, no response expected
      }
    });
  }

  /**
   * Send a notification (no response expected)
   */
  private async sendNotification(method: string, params: any): Promise<void> {
    const message = {
      jsonrpc: '2.0',
      method,
      params
    };

    await this.sendMessage(message);
  }

  /**
   * Handle incoming messages from MCP server
   */
  private handleMessage(message: MCPMessage): void {
    if (message.id !== undefined && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(message.error.message || 'MCP Error'));
      } else {
        resolve(message.result);
      }
    }
  }
}

/**
 * Real MCP Integration Test Suite
 */
class RealMCPTestSuite extends E2ETestSuite {
  private mcpClient: MCPTestClient;

  constructor() {
    super();
    this.mcpClient = new MCPTestClient();
  }

  /**
   * Override parent method to use real MCP client
   */
  protected async callMCPTool(toolName: string, args?: any): Promise<any> {
    try {
      const result = await this.mcpClient.callTool(toolName, args);
      
      if (result.isError) {
        return {
          isError: true,
          content: result.content || [{ type: 'text', text: '❌ Tool call failed' }]
        };
      }
      
      return {
        isError: false,
        content: result.content || [{ type: 'text', text: '✅ Tool call succeeded' }]
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: 'text', text: `❌ Tool call error: ${error.message}` }]
      };
    }
  }

  /**
   * Setup test environment
   */
  async setup(): Promise<void> {
    console.log('🚀 Setting up MCP test environment...');
    await this.mcpClient.startMCPServer();
    console.log('✅ MCP server started');
  }

  /**
   * Cleanup test environment
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');
    await this.mcpClient.stopMCPServer();
    console.log('✅ MCP server stopped');
  }

  /**
   * Test actual MCP tools
   */
  async testRealMCPTools(): Promise<void> {
    console.log('\n🔧 Testing Real MCP Tools...');

    // Test list tools
    try {
      const tools = await this.mcpClient.listTools();
      console.log('📋 Available tools:', tools.tools?.map(t => t.name) || []);
      
      // Test each available tool
      for (const tool of tools.tools || []) {
        console.log(`  Testing ${tool.name}...`);
        
        if (tool.name === 'vscode.executeCommand') {
          await this.testExecuteCommand();
        } else if (tool.name === 'vscode.listCommands') {
          await this.testListCommands();
        }
      }
    } catch (error) {
      console.error('❌ Failed to test MCP tools:', error);
      throw error;
    }
  }

  /**
   * Test executeCommand tool specifically
   */
  private async testExecuteCommand(): Promise<void> {
    const testCommands = [
      'editor.action.formatDocument',
      'workbench.action.quickOpen',
      'editor.action.commentLine'
    ];

    for (const commandId of testCommands) {
      try {
        const result = await this.mcpClient.callTool('vscode.executeCommand', { commandId });
        console.log(`    ✅ ${commandId}: ${result.content?.[0]?.text || 'Success'}`);
      } catch (error) {
        console.log(`    ❌ ${commandId}: ${error.message}`);
      }
    }
  }

  /**
   * Test listCommands tool specifically
   */
  private async testListCommands(): Promise<void> {
    try {
      const result = await this.mcpClient.callTool('vscode.listCommands', { filter: 'editor' });
      console.log(`    ✅ listCommands: Found ${result.content?.[0]?.text?.split('\\n')?.length || 0} commands`);
    } catch (error) {
      console.log(`    ❌ listCommands: ${error.message}`);
    }
  }
}

/**
 * Main test execution function
 */
async function runE2ETests(): Promise<void> {
  const testSuite = new RealMCPTestSuite();
  
  try {
    await testSuite.setup();
    await testSuite.testRealMCPTools();
    await testSuite.runAllTests();
    console.log('🎉 All E2E tests completed successfully!');
  } catch (error) {
    console.error('💥 E2E tests failed:', error);
    process.exit(1);
  } finally {
    await testSuite.cleanup();
  }
}

// Export for use in other test files
export { RealMCPTestSuite, MCPTestClient, runE2ETests };

// Run tests if this file is executed directly
if (require.main === module) {
  runE2ETests();
}
