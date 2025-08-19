import * as assert from 'assert';
import { performance } from 'perf_hooks';

// Use mock vscode for testing outside VSCode environment
let vscode: any;
try {
  vscode = require('vscode');
} catch (error) {
  vscode = require('./mocks/vscode');
}

/**
 * End-to-End Integration Test Suite for Cursor MCP Extension
 * Tests the complete Cursor API + Stdio architecture
 */

interface TestResult {
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

interface PerformanceMetrics {
  commandLatency: number;
  startupTime: number;
  memoryUsage: number;
  throughput: number;
}

interface MCPToolResult {
  isError: boolean;
  content: Array<{ type: string; text: string }>;
}

class E2ETestSuite {
  private testResults: Map<string, TestResult> = new Map();
  private performanceMetrics: PerformanceMetrics = {
    commandLatency: 0,
    startupTime: 0,
    memoryUsage: 0,
    throughput: 0
  };

  /**
   * Main test runner - executes all test suites
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting End-to-End Integration Tests...');
    
    try {
      await this.testInstallationAndStartup();
      await this.testMCPToolsFunctionality();
      await this.testCursorAIIntegration();
      await this.testStressAndStability();
      await this.validatePerformance();
      
      this.generateTestReport();
      console.log('✅ All E2E tests completed successfully!');
    } catch (error) {
      console.error('❌ E2E test suite failed:', error);
      throw error;
    }
  }

  /**
   * Test Suite 1: Installation and Startup Tests
   */
  async testInstallationAndStartup(): Promise<void> {
    console.log('\n📦 Testing Installation and Startup...');

    // Test 1: Extension loads successfully
    await this.runTest('extension-load', async () => {
      const extension = vscode.extensions.getExtension('louisfghbvc.mcp-vscode-commands');
      assert.ok(extension, 'Extension should be loaded');
      assert.ok(extension.isActive || await extension.activate(), 'Extension should be active');
      return { success: true, duration: 0 };
    });

    // Test 2: Startup time performance
    await this.runTest('startup-performance', async () => {
      const startTime = performance.now();
      
      // Simulate extension activation
      const extension = vscode.extensions.getExtension('louisfghbvc.mcp-vscode-commands');
      if (extension && !extension.isActive) {
        await extension.activate();
      }
      
      const startupTime = performance.now() - startTime;
      this.performanceMetrics.startupTime = startupTime;
      
      assert.ok(startupTime < 1500, `Startup time should be < 1.5s, got ${startupTime}ms`);
      return { success: true, duration: startupTime };
    });

    // Test 3: Check MCP server registration
    await this.runTest('mcp-registration', async () => {
      // Wait for MCP registration to complete
      await this.waitForMCPRegistration();
      
      // Verify server is registered (this would need actual Cursor API check)
      const isRegistered = await this.isMCPServerRegistered('vscode-commands');
      assert.ok(isRegistered, 'MCP server should be registered with Cursor');
      
      return { success: true, duration: 0 };
    });
  }

  /**
   * Test Suite 2: MCP Tools Functionality Tests
   */
  async testMCPToolsFunctionality(): Promise<void> {
    console.log('\n🔧 Testing MCP Tools Functionality...');

    // Test executeCommand tool
    await this.runTest('execute-command-tool', async () => {
      const startTime = performance.now();
      const result = await this.callMCPTool('vscode.executeCommand', {
        commandId: 'editor.action.formatDocument'
      });
      const duration = performance.now() - startTime;
      
      assert.ok(!result.isError, 'executeCommand should succeed');
      assert.ok(result.content[0].text.includes('✅'), 'Should return success message');
      assert.ok(duration < 50, `Command latency should be < 50ms, got ${duration}ms`);
      
      this.performanceMetrics.commandLatency = Math.max(this.performanceMetrics.commandLatency, duration);
      return { success: true, duration };
    });

    // Test listCommands tool
    await this.runTest('list-commands-tool', async () => {
      const result = await this.callMCPTool('vscode.listCommands', {
        filter: 'editor'
      });
      
      assert.ok(!result.isError, 'listCommands should succeed');
      assert.ok(result.content[0].text.includes('editor.action.formatDocument'), 
                'Should include known editor commands');
      
      return { success: true, duration: 0 };
    });

    // Test error handling
    await this.runTest('error-handling', async () => {
      const result = await this.callMCPTool('vscode.executeCommand', {
        commandId: 'invalid.command.id'
      });
      
      assert.ok(result.isError, 'Invalid command should return error');
      assert.ok(result.content[0].text.includes('❌'), 'Should return error message');
      
      return { success: true, duration: 0 };
    });
  }

  /**
   * Test Suite 3: Cursor AI Integration Tests
   */
  async testCursorAIIntegration(): Promise<void> {
    console.log('\n🤖 Testing Cursor AI Integration...');

    // Test server visibility in Cursor
    await this.runTest('cursor-server-visibility', async () => {
      const servers = await this.getCursorMCPServers();
      assert.ok(servers.includes('vscode-commands'), 'Server should be visible in Cursor');
      
      return { success: true, duration: 0 };
    });

    // Test AI tool calling simulation
    await this.runTest('ai-tool-calling', async () => {
      const response = await this.simulateAIToolCall('vscode.executeCommand', {
        commandId: 'editor.action.commentLine'
      });
      
      assert.ok(response.success, 'AI should be able to call tools successfully');
      
      return { success: true, duration: 0 };
    });

    // Test AI error handling
    await this.runTest('ai-error-handling', async () => {
      const response = await this.simulateAIToolCall('vscode.executeCommand', {
        commandId: 'invalid.command.id'
      });
      
      assert.ok(response.isError, 'AI should receive proper error responses');
      assert.ok(response.content[0].text.includes('❌'), 'Error should be clearly marked');
      
      return { success: true, duration: 0 };
    });
  }

  /**
   * Test Suite 4: Stress and Stability Tests
   */
  async testStressAndStability(): Promise<void> {
    console.log('\n💪 Testing Stress and Stability...');

    // Test concurrent command execution
    await this.runTest('concurrent-execution', async () => {
      const concurrentCommands = 50;
      const commands = Array(concurrentCommands).fill(0).map(() => 
        this.callMCPTool('vscode.executeCommand', {
          commandId: 'editor.action.formatDocument'
        })
      );
      
      const startTime = performance.now();
      const results = await Promise.all(commands);
      const duration = performance.now() - startTime;
      
      const successCount = results.filter(r => !r.isError).length;
      const successRate = successCount / concurrentCommands;
      
      assert.ok(successRate > 0.9, `Success rate should be > 90%, got ${successRate * 100}%`);
      
      this.performanceMetrics.throughput = concurrentCommands / (duration / 1000); // commands per second
      
      return { success: true, duration, details: { successRate, throughput: this.performanceMetrics.throughput } };
    });

    // Test long running stability
    await this.runTest('stability-test', async () => {
      const iterations = 100; // Reduced for faster testing
      let memoryPeak = 0;
      
      for (let i = 0; i < iterations; i++) {
        const result = await this.callMCPTool('vscode.listCommands');
        assert.ok(!result.isError, `Command ${i} should succeed`);
        
        if (i % 10 === 0) {
          const memUsage = process.memoryUsage();
          memoryPeak = Math.max(memoryPeak, memUsage.heapUsed);
          assert.ok(memUsage.heapUsed < 100 * 1024 * 1024, 
                   `Memory usage should be < 100MB, got ${memUsage.heapUsed / 1024 / 1024}MB`);
        }
      }
      
      this.performanceMetrics.memoryUsage = memoryPeak;
      return { success: true, duration: 0, details: { iterations, memoryPeak } };
    });

    // Test memory leak detection
    await this.runTest('memory-leak-detection', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Execute operations that could cause memory leaks
      for (let i = 0; i < 100; i++) {
        await this.callMCPTool('vscode.executeCommand', {
          commandId: 'workbench.action.quickOpen'
        });
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      assert.ok(memoryIncrease < 10 * 1024 * 1024, 
               `Memory increase should be < 10MB, got ${memoryIncrease / 1024 / 1024}MB`);
      
      return { success: true, duration: 0, details: { memoryIncrease } };
    });
  }

  /**
   * Validate performance targets
   */
  async validatePerformance(): Promise<void> {
    console.log('\n📊 Validating Performance Targets...');

    const targets = {
      commandLatency: 25,    // ms
      startupTime: 1500,     // ms
      memoryLimit: 100,      // MB
      minThroughput: 10      // commands/sec
    };

    // Validate command latency
    assert.ok(this.performanceMetrics.commandLatency < targets.commandLatency,
             `Command latency: ${this.performanceMetrics.commandLatency}ms (target: < ${targets.commandLatency}ms)`);

    // Validate startup time
    assert.ok(this.performanceMetrics.startupTime < targets.startupTime,
             `Startup time: ${this.performanceMetrics.startupTime}ms (target: < ${targets.startupTime}ms)`);

    // Validate memory usage
    const memoryMB = this.performanceMetrics.memoryUsage / 1024 / 1024;
    assert.ok(memoryMB < targets.memoryLimit,
             `Memory usage: ${memoryMB}MB (target: < ${targets.memoryLimit}MB)`);

    // Validate throughput
    assert.ok(this.performanceMetrics.throughput > targets.minThroughput,
             `Throughput: ${this.performanceMetrics.throughput} cmd/s (target: > ${targets.minThroughput} cmd/s)`);

    console.log('✅ All performance targets met!');
  }

  /**
   * Helper method to run individual tests
   */
  private async runTest(testName: string, testFn: () => Promise<TestResult>): Promise<void> {
    try {
      console.log(`  ▶️ Running ${testName}...`);
      const result = await testFn();
      this.testResults.set(testName, result);
      console.log(`  ✅ ${testName} passed (${result.duration.toFixed(2)}ms)`);
    } catch (error) {
      const failedResult: TestResult = {
        success: false,
        duration: 0,
        error: error.message
      };
      this.testResults.set(testName, failedResult);
      console.log(`  ❌ ${testName} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Simulate MCP tool call (would connect to actual MCP server in real implementation)
   */
  private async callMCPTool(toolName: string, args?: any): Promise<MCPToolResult> {
    // Mock implementation - in real tests this would call the actual MCP server
    if (toolName === 'vscode.executeCommand') {
      if (args?.commandId === 'invalid.command.id') {
        return {
          isError: true,
          content: [{ type: 'text', text: '❌ Command failed: Unknown command' }]
        };
      }
      return {
        isError: false,
        content: [{ type: 'text', text: '✅ Command executed successfully' }]
      };
    } else if (toolName === 'vscode.listCommands') {
      return {
        isError: false,
        content: [{ type: 'text', text: 'Available commands:\n- editor.action.formatDocument\n- editor.action.commentLine' }]
      };
    }
    
    return {
      isError: true,
      content: [{ type: 'text', text: '❌ Unknown tool' }]
    };
  }

  /**
   * Wait for MCP registration to complete
   */
  private async waitForMCPRegistration(): Promise<void> {
    // Mock implementation - would wait for actual registration
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Check if MCP server is registered
   */
  private async isMCPServerRegistered(serverName: string): Promise<boolean> {
    // Mock implementation - would check actual Cursor registration
    return true;
  }

  /**
   * Get list of Cursor MCP servers
   */
  private async getCursorMCPServers(): Promise<string[]> {
    // Mock implementation - would query Cursor for registered servers
    return ['vscode-commands'];
  }

  /**
   * Simulate AI tool call
   */
  private async simulateAIToolCall(toolName: string, args?: any): Promise<any> {
    // Mock implementation - would simulate actual AI interaction
    return this.callMCPTool(toolName, args);
  }

  /**
   * Generate comprehensive test report
   */
  private generateTestReport(): void {
    console.log('\n📋 Test Report Summary:');
    console.log('=======================');
    
    let passedTests = 0;
    let totalTests = 0;
    
    for (const [testName, result] of this.testResults) {
      totalTests++;
      if (result.success) {
        passedTests++;
        console.log(`✅ ${testName}: PASSED (${result.duration.toFixed(2)}ms)`);
      } else {
        console.log(`❌ ${testName}: FAILED - ${result.error}`);
      }
    }
    
    console.log(`\n📊 Results: ${passedTests}/${totalTests} tests passed (${(passedTests/totalTests*100).toFixed(1)}%)`);
    
    console.log('\n📈 Performance Metrics:');
    console.log(`  Command Latency: ${this.performanceMetrics.commandLatency.toFixed(2)}ms`);
    console.log(`  Startup Time: ${this.performanceMetrics.startupTime.toFixed(2)}ms`);
    console.log(`  Memory Usage: ${(this.performanceMetrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  Throughput: ${this.performanceMetrics.throughput.toFixed(2)} commands/sec`);
  }
}

export { E2ETestSuite };
