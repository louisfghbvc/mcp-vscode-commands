#!/usr/bin/env npx tsx

/**
 * Standalone Test Runner - Tests core functionality without MCP server dependency
 * This provides a quick validation of the test framework itself
 */

import { performance } from 'perf_hooks';
import * as assert from 'assert';

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

class StandaloneTestSuite {
  private results: TestResult[] = [];

  async runTests(): Promise<void> {
    console.log('🧪 Running Standalone Test Suite...');
    console.log('====================================');

    await this.testFrameworkSetup();
    await this.testMockVSCode();
    await this.testPerformanceMeasurement();
    await this.testAsyncOperations();
    await this.testErrorHandling();

    this.generateReport();
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`  ▶️ Running ${name}...`);
      await testFn();
      const duration = performance.now() - startTime;
      
      this.results.push({
        name,
        success: true,
        duration
      });
      
      console.log(`  ✅ ${name} passed (${duration.toFixed(2)}ms)`);
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.results.push({
        name,
        success: false,
        duration,
        error: error.message
      });
      
      console.log(`  ❌ ${name} failed: ${error.message}`);
    }
  }

  private async testFrameworkSetup(): Promise<void> {
    await this.runTest('Framework Setup', async () => {
      // Test that assert works
      assert.ok(true, 'Assert should work');
      
      // Test that performance measurement works
      const start = performance.now();
      await new Promise(resolve => setTimeout(resolve, 10));
      const duration = performance.now() - start;
      assert.ok(duration > 5, 'Performance measurement should work');
    });
  }

  private async testMockVSCode(): Promise<void> {
    await this.runTest('Mock VSCode API', async () => {
      // Import mock vscode
      const vscode = require('./mocks/vscode');
      
      // Test extensions API
      const extension = vscode.extensions.getExtension('louisfghbvc.mcp-vscode-commands');
      assert.ok(extension, 'Mock extension should exist');
      assert.ok(extension.isActive, 'Mock extension should be active');
      
      // Test commands API
      const commands = await vscode.commands.getCommands();
      assert.ok(Array.isArray(commands), 'Commands should be an array');
      assert.ok(commands.length > 0, 'Should have some commands');
      assert.ok(commands.includes('editor.action.formatDocument'), 'Should include format document command');
      
      // Test command execution
      const result = await vscode.commands.executeCommand('editor.action.formatDocument');
      assert.ok(result !== undefined, 'Command execution should return result');
    });
  }

  private async testPerformanceMeasurement(): Promise<void> {
    await this.runTest('Performance Measurement', async () => {
      // Test latency measurement
      const iterations = 100;
      const latencies: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await new Promise(resolve => setImmediate(resolve));
        const latency = performance.now() - start;
        latencies.push(latency);
      }
      
      const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      
      assert.ok(avgLatency >= 0, 'Average latency should be non-negative');
      assert.ok(maxLatency >= avgLatency, 'Max latency should be >= average');
      
      console.log(`    Average latency: ${avgLatency.toFixed(2)}ms`);
      console.log(`    Max latency: ${maxLatency.toFixed(2)}ms`);
    });
  }

  private async testAsyncOperations(): Promise<void> {
    await this.runTest('Async Operations', async () => {
      // Test concurrent async operations
      const concurrentOps = 10;
      const operations = Array(concurrentOps).fill(0).map(async (_, i) => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return i * 2;
      });
      
      const results = await Promise.all(operations);
      
      assert.ok(results.length === concurrentOps, 'Should complete all operations');
      assert.ok(results.every(r => typeof r === 'number'), 'All results should be numbers');
      
      console.log(`    Completed ${concurrentOps} concurrent operations`);
    });
  }

  private async testErrorHandling(): Promise<void> {
    await this.runTest('Error Handling', async () => {
      // Test that errors are properly caught and handled
      let errorCaught = false;
      
      try {
        throw new Error('Test error');
      } catch (error) {
        errorCaught = true;
        assert.ok(error.message === 'Test error', 'Error message should match');
      }
      
      assert.ok(errorCaught, 'Error should have been caught');
      
      // Test async error handling
      let asyncErrorCaught = false;
      
      try {
        await Promise.reject(new Error('Async test error'));
      } catch (error) {
        asyncErrorCaught = true;
        assert.ok(error.message === 'Async test error', 'Async error message should match');
      }
      
      assert.ok(asyncErrorCaught, 'Async error should have been caught');
    });
  }

  private generateReport(): void {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.length - passed;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log('\\n📊 Test Report');
    console.log('=============');
    
    for (const result of this.results) {
      const status = result.success ? '✅' : '❌';
      const duration = result.duration.toFixed(2);
      console.log(`${status} ${result.name}: ${duration}ms${result.error ? ' - ' + result.error : ''}`);
    }
    
    console.log('\\nSummary:');
    console.log(`  Total Tests: ${this.results.length}`);
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total Duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`  Success Rate: ${(passed / this.results.length * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\\n❌ Some tests failed!');
      process.exit(1);
    } else {
      console.log('\\n🎉 All tests passed!');
    }
  }
}

// Run if this file is executed directly
async function main(): Promise<void> {
  const testSuite = new StandaloneTestSuite();
  await testSuite.runTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { StandaloneTestSuite };
