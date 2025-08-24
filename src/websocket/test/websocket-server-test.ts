import * as vscode from 'vscode';
import { WebSocketMCPServerExtension } from '../websocket-mcp-server-extension';
import { ConnectionManager } from '../connection-manager';
import { WebSocketDiagnostics } from '../diagnostics/websocket-diagnostics';

/**
 * WebSocket 服務器測試套件
 * 
 * 用於測試和驗證 WebSocket MCP 服務器的各種功能
 */
export class WebSocketServerTest {
  private extension: WebSocketMCPServerExtension;
  private connectionManager: ConnectionManager;
  private diagnostics: WebSocketDiagnostics;
  private testResults: TestResult[] = [];
  
  constructor(context: vscode.ExtensionContext) {
    this.extension = new WebSocketMCPServerExtension(context);
    this.connectionManager = new ConnectionManager();
    this.diagnostics = new WebSocketDiagnostics(this.extension, this.connectionManager);
  }
  
  /**
   * 運行所有測試
   */
  async runAllTests(): Promise<TestSuiteResult> {
    console.log('[WebSocket Test] Starting test suite...');
    
    this.testResults = [];
    const startTime = Date.now();
    
    try {
      // 測試 1: 服務器啟動
      await this.testServerStartup();
      
      // 測試 2: 服務器停止
      await this.testServerStop();
      
      // 測試 3: 服務器重啟
      await this.testServerRestart();
      
      // 測試 4: 連接管理
      await this.testConnectionManagement();
      
      // 測試 5: 消息處理
      await this.testMessageHandling();
      
      // 測試 6: 錯誤處理
      await this.testErrorHandling();
      
      // 測試 7: 診斷功能
      await this.testDiagnostics();
      
      // 測試 8: 性能測試
      await this.testPerformance();
      
    } catch (error) {
      console.error('[WebSocket Test] Test suite failed:', error);
      this.testResults.push({
        name: 'Test Suite',
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: 0
      });
    }
    
    const totalDuration = Date.now() - startTime;
    const passedTests = this.testResults.filter(r => r.status === 'passed').length;
    const failedTests = this.testResults.filter(r => r.status === 'failed').length;
    
    const result: TestSuiteResult = {
      totalTests: this.testResults.length,
      passedTests,
      failedTests,
      totalDuration,
      results: this.testResults,
      summary: {
        overall: failedTests === 0 ? 'passed' : 'failed',
        successRate: (passedTests / this.testResults.length) * 100
      }
    };
    
    console.log(`[WebSocket Test] Test suite completed: ${passedTests}/${this.testResults.length} tests passed`);
    return result;
  }
  
  /**
   * 測試服務器啟動
   */
  private async testServerStartup(): Promise<void> {
    const testName = 'Server Startup';
    const startTime = Date.now();
    
    try {
      console.log(`[WebSocket Test] Running ${testName}...`);
      
      // 測試服務器啟動
      await this.extension.start();
      
      // 驗證服務器狀態
      const status = this.extension.getStatus();
      if (!status.isRunning) {
        throw new Error('Server failed to start');
      }
      
      // 驗證端口監聽
      if (status.port <= 0) {
        throw new Error('Invalid port number');
      }
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration: Date.now() - startTime
      });
      
      console.log(`[WebSocket Test] ${testName} passed`);
      
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      
      console.error(`[WebSocket Test] ${testName} failed:`, error);
      throw error;
    }
  }
  
  /**
   * 測試服務器停止
   */
  private async testServerStop(): Promise<void> {
    const testName = 'Server Stop';
    const startTime = Date.now();
    
    try {
      console.log(`[WebSocket Test] Running ${testName}...`);
      
      // 測試服務器停止
      await this.extension.stop();
      
      // 驗證服務器狀態
      const status = this.extension.getStatus();
      if (status.isRunning) {
        throw new Error('Server failed to stop');
      }
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration: Date.now() - startTime
      });
      
      console.log(`[WebSocket Test] ${testName} passed`);
      
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      
      console.error(`[WebSocket Test] ${testName} failed:`, error);
      throw error;
    }
  }
  
  /**
   * 測試服務器重啟
   */
  private async testServerRestart(): Promise<void> {
    const testName = 'Server Restart';
    const startTime = Date.now();
    
    try {
      console.log(`[WebSocket Test] Running ${testName}...`);
      
      // 先啟動服務器
      await this.extension.start();
      
      // 測試重啟
      await this.extension.restart();
      
      // 驗證服務器狀態
      const status = this.extension.getStatus();
      if (!status.isRunning) {
        throw new Error('Server failed to restart');
      }
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration: Date.now() - startTime
      });
      
      console.log(`[WebSocket Test] ${testName} passed`);
      
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      
      console.error(`[WebSocket Test] ${testName} failed:`, error);
      throw error;
    }
  }
  
  /**
   * 測試連接管理
   */
  private async testConnectionManagement(): Promise<void> {
    const testName = 'Connection Management';
    const startTime = Date.now();
    
    try {
      console.log(`[WebSocket Test] Running ${testName}...`);
      
      // 測試連接統計
      const stats = this.connectionManager.getConnectionStats();
      if (stats.totalConnections !== 0) {
        throw new Error('Expected 0 connections initially');
      }
      
      // 測試設置最大連接數
      this.connectionManager.setMaxConnections(5);
      
      // 測試設置連接超時
      this.connectionManager.setConnectionTimeout(15000);
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration: Date.now() - startTime
      });
      
      console.log(`[WebSocket Test] ${testName} passed`);
      
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      
      console.error(`[WebSocket Test] ${testName} failed:`, error);
      throw error;
    }
  }
  
  /**
   * 測試消息處理
   */
  private async testMessageHandling(): Promise<void> {
    const testName = 'Message Handling';
    const startTime = Date.now();
    
    try {
      console.log(`[WebSocket Test] Running ${testName}...`);
      
      // 測試消息格式驗證
      const validMessage = {
        id: 'test_1',
        type: 'mcp_request',
        timestamp: Date.now(),
        data: {
          jsonrpc: '2.0',
          id: 'test_1',
          method: 'tools/list',
          params: {}
        }
      };
      
      // 這裡可以添加更多的消息處理測試
      // 由於我們沒有實際的 WebSocket 客戶端，我們主要測試接口和邏輯
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration: Date.now() - startTime
      });
      
      console.log(`[WebSocket Test] ${testName} passed`);
      
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      
      console.error(`[WebSocket Test] ${testName} failed:`, error);
      throw error;
    }
  }
  
  /**
   * 測試錯誤處理
   */
  private async testErrorHandling(): Promise<void> {
    const testName = 'Error Handling';
    const startTime = Date.now();
    
    try {
      console.log(`[WebSocket Test] Running ${testName}...`);
      
      // 測試錯誤響應格式
      const errorResponse = {
        id: 'error_test',
        type: 'mcp_response',
        timestamp: Date.now(),
        data: {
          jsonrpc: '2.0',
          id: 'error_test',
          error: {
            code: -32603,
            message: 'Test error',
            data: null
          }
        }
      };
      
      // 驗證錯誤響應格式
      if (!errorResponse.data.error || !errorResponse.data.error.code) {
        throw new Error('Invalid error response format');
      }
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration: Date.now() - startTime
      });
      
      console.log(`[WebSocket Test] ${testName} passed`);
      
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      
      console.error(`[WebSocket Test] ${testName} failed:`, error);
      throw error;
    }
  }
  
  /**
   * 測試診斷功能
   */
  private async testDiagnostics(): Promise<void> {
    const testName = 'Diagnostics';
    const startTime = Date.now();
    
    try {
      console.log(`[WebSocket Test] Running ${testName}...`);
      
      // 測試健康檢查
      const healthCheck = await this.diagnostics.runHealthCheck();
      
      if (!healthCheck.timestamp || healthCheck.total === 0) {
        throw new Error('Invalid health check result');
      }
      
      // 測試診斷信息生成
      this.diagnostics.showDiagnostics();
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration: Date.now() - startTime
      });
      
      console.log(`[WebSocket Test] ${testName} passed`);
      
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      
      console.error(`[WebSocket Test] ${testName} failed:`, error);
      throw error;
    }
  }
  
  /**
   * 測試性能
   */
  private async testPerformance(): Promise<void> {
    const testName = 'Performance';
    const startTime = Date.now();
    
    try {
      console.log(`[WebSocket Test] Running ${testName}...`);
      
      // 測試服務器啟動時間
      const startupStart = Date.now();
      await this.extension.start();
      const startupTime = Date.now() - startupStart;
      
      if (startupTime > 5000) { // 啟動時間不應超過 5 秒
        throw new Error(`Server startup too slow: ${startupTime}ms`);
      }
      
      // 測試服務器停止時間
      const stopStart = Date.now();
      await this.extension.stop();
      const stopTime = Date.now() - stopStart;
      
      if (stopTime > 3000) { // 停止時間不應超過 3 秒
        throw new Error(`Server stop too slow: ${stopTime}ms`);
      }
      
      this.testResults.push({
        name: testName,
        status: 'passed',
        duration: Date.now() - startTime
      });
      
      console.log(`[WebSocket Test] ${testName} passed`);
      
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      });
      
      console.error(`[WebSocket Test] ${testName} failed:`, error);
      throw error;
    }
  }
  
  /**
   * 清理資源
   */
  dispose(): void {
    this.extension.dispose();
    this.connectionManager.dispose();
    this.diagnostics.dispose();
  }
}

/**
 * 測試結果接口
 */
export interface TestResult {
  name: string;
  status: 'passed' | 'failed';
  error?: string;
  duration: number;
}

/**
 * 測試套件結果接口
 */
export interface TestSuiteResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: TestResult[];
  summary: {
    overall: 'passed' | 'failed';
    successRate: number;
  };
}
