import { performance } from 'perf_hooks';
import { MCPTestClient } from './test-runner';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Performance Benchmark Suite for MCP Integration
 * Measures and validates performance metrics against targets
 */

interface BenchmarkResult {
  metric: string;
  value: number;
  unit: string;
  target: number;
  passed: boolean;
  details?: any;
}

interface PerformanceReport {
  timestamp: string;
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    memory: number;
    cpus: number;
  };
  results: BenchmarkResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    overallScore: number;
  };
}

class PerformanceBenchmark {
  private mcpClient: MCPTestClient;
  private results: BenchmarkResult[] = [];

  constructor() {
    this.mcpClient = new MCPTestClient();
  }

  /**
   * Run complete performance benchmark suite
   */
  async runBenchmarks(): Promise<PerformanceReport> {
    console.log('🏃‍♂️ Starting Performance Benchmark Suite...');
    
    await this.setupEnvironment();
    
    try {
      await this.benchmarkStartupTime();
      await this.benchmarkCommandLatency();
      await this.benchmarkThroughput();
      await this.benchmarkMemoryUsage();
      await this.benchmarkConcurrentLoad();
      await this.benchmarkStressTest();
      
      return this.generateReport();
    } finally {
      await this.cleanupEnvironment();
    }
  }

  /**
   * Setup test environment
   */
  private async setupEnvironment(): Promise<void> {
    console.log('🔧 Setting up performance test environment...');
    await this.mcpClient.startMCPServer();
    
    // Warm up the server
    for (let i = 0; i < 5; i++) {
      await this.mcpClient.listTools();
    }
    
    console.log('✅ Environment ready');
  }

  /**
   * Cleanup test environment
   */
  private async cleanupEnvironment(): Promise<void> {
    await this.mcpClient.stopMCPServer();
  }

  /**
   * Benchmark: Server startup time
   */
  private async benchmarkStartupTime(): Promise<void> {
    console.log('\n⏱️  Benchmarking startup time...');
    
    // Stop current server and measure restart time
    await this.mcpClient.stopMCPServer();
    
    const startTime = performance.now();
    await this.mcpClient.startMCPServer();
    const startupTime = performance.now() - startTime;
    
    this.results.push({
      metric: 'Startup Time',
      value: startupTime,
      unit: 'ms',
      target: 1500,
      passed: startupTime < 1500,
      details: { serverRestartTime: startupTime }
    });
    
    console.log(`   Startup time: ${startupTime.toFixed(2)}ms (target: < 1500ms)`);
  }

  /**
   * Benchmark: Command execution latency
   */
  private async benchmarkCommandLatency(): Promise<void> {
    console.log('\n⚡ Benchmarking command latency...');
    
    const commands = [
      'vscode.executeCommand',
      'vscode.listCommands'
    ];
    
    const latencies: number[] = [];
    
    for (const command of commands) {
      for (let i = 0; i < 10; i++) {
        const startTime = performance.now();
        
        try {
          if (command === 'vscode.executeCommand') {
            await this.mcpClient.callTool(command, { commandId: 'editor.action.formatDocument' });
          } else {
            await this.mcpClient.callTool(command, {});
          }
          
          const latency = performance.now() - startTime;
          latencies.push(latency);
        } catch (error) {
          console.warn(`   Warning: ${command} failed:`, error.message);
        }
      }
    }
    
    const avgLatency = latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
    
    this.results.push({
      metric: 'Average Command Latency',
      value: avgLatency,
      unit: 'ms',
      target: 25,
      passed: avgLatency < 25,
      details: { maxLatency, p95Latency, samples: latencies.length }
    });
    
    console.log(`   Average latency: ${avgLatency.toFixed(2)}ms (target: < 25ms)`);
    console.log(`   P95 latency: ${p95Latency.toFixed(2)}ms`);
    console.log(`   Max latency: ${maxLatency.toFixed(2)}ms`);
  }

  /**
   * Benchmark: Command throughput
   */
  private async benchmarkThroughput(): Promise<void> {
    console.log('\n📈 Benchmarking throughput...');
    
    const commandCount = 100;
    const startTime = performance.now();
    
    const promises = [];
    for (let i = 0; i < commandCount; i++) {
      promises.push(
        this.mcpClient.callTool('vscode.listCommands', {})
          .catch(error => ({ error: error.message }))
      );
    }
    
    const results = await Promise.all(promises);
    const duration = performance.now() - startTime;
    
    const successCount = results.filter(r => !r.error).length;
    const throughput = (successCount / duration) * 1000; // commands per second
    
    this.results.push({
      metric: 'Command Throughput',
      value: throughput,
      unit: 'commands/sec',
      target: 10,
      passed: throughput > 10,
      details: { 
        totalCommands: commandCount, 
        successCount, 
        duration,
        successRate: successCount / commandCount 
      }
    });
    
    console.log(`   Throughput: ${throughput.toFixed(2)} commands/sec (target: > 10 commands/sec)`);
    console.log(`   Success rate: ${(successCount / commandCount * 100).toFixed(1)}%`);
  }

  /**
   * Benchmark: Memory usage
   */
  private async benchmarkMemoryUsage(): Promise<void> {
    console.log('\n🧠 Benchmarking memory usage...');
    
    const initialMemory = process.memoryUsage();
    let peakMemory = initialMemory.heapUsed;
    
    // Execute memory-intensive operations
    for (let i = 0; i < 50; i++) {
      await this.mcpClient.callTool('vscode.executeCommand', { 
        commandId: 'workbench.action.quickOpen' 
      });
      
      if (i % 10 === 0) {
        const currentMemory = process.memoryUsage();
        peakMemory = Math.max(peakMemory, currentMemory.heapUsed);
      }
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    const peakMemoryMB = peakMemory / 1024 / 1024;
    
    this.results.push({
      metric: 'Peak Memory Usage',
      value: peakMemoryMB,
      unit: 'MB',
      target: 100,
      passed: peakMemoryMB < 100,
      details: { 
        initialMemory: initialMemory.heapUsed / 1024 / 1024,
        finalMemory: finalMemory.heapUsed / 1024 / 1024,
        memoryIncrease: memoryIncrease / 1024 / 1024
      }
    });
    
    console.log(`   Peak memory: ${peakMemoryMB.toFixed(2)}MB (target: < 100MB)`);
    console.log(`   Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
  }

  /**
   * Benchmark: Concurrent load handling
   */
  private async benchmarkConcurrentLoad(): Promise<void> {
    console.log('\n🔀 Benchmarking concurrent load...');
    
    const concurrentCommands = 50;
    const startTime = performance.now();
    
    const commands = Array(concurrentCommands).fill(0).map((_, i) => 
      this.mcpClient.callTool('vscode.executeCommand', {
        commandId: i % 2 === 0 ? 'editor.action.formatDocument' : 'editor.action.commentLine'
      }).catch(error => ({ error: error.message }))
    );
    
    const results = await Promise.all(commands);
    const duration = performance.now() - startTime;
    
    const successCount = results.filter(r => !r.error).length;
    const concurrentThroughput = (successCount / duration) * 1000;
    
    this.results.push({
      metric: 'Concurrent Load Handling',
      value: concurrentThroughput,
      unit: 'commands/sec',
      target: 20,
      passed: concurrentThroughput > 20 && successCount / concurrentCommands > 0.9,
      details: { 
        concurrentCommands,
        successCount,
        successRate: successCount / concurrentCommands,
        duration
      }
    });
    
    console.log(`   Concurrent throughput: ${concurrentThroughput.toFixed(2)} commands/sec`);
    console.log(`   Success rate: ${(successCount / concurrentCommands * 100).toFixed(1)}%`);
  }

  /**
   * Benchmark: Stress test
   */
  private async benchmarkStressTest(): Promise<void> {
    console.log('\n💪 Running stress test...');
    
    const stressTestDuration = 10000; // 10 seconds
    const startTime = performance.now();
    let commandCount = 0;
    let errorCount = 0;
    
    const endTime = startTime + stressTestDuration;
    
    while (performance.now() < endTime) {
      try {
        await this.mcpClient.callTool('vscode.listCommands', {});
        commandCount++;
      } catch (error) {
        errorCount++;
      }
      
      // Brief pause to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const actualDuration = performance.now() - startTime;
    const stressThroughput = (commandCount / actualDuration) * 1000;
    const errorRate = errorCount / (commandCount + errorCount);
    
    this.results.push({
      metric: 'Stress Test Throughput',
      value: stressThroughput,
      unit: 'commands/sec',
      target: 5,
      passed: stressThroughput > 5 && errorRate < 0.05,
      details: { 
        duration: actualDuration,
        commandCount,
        errorCount,
        errorRate
      }
    });
    
    console.log(`   Stress throughput: ${stressThroughput.toFixed(2)} commands/sec`);
    console.log(`   Error rate: ${(errorRate * 100).toFixed(2)}%`);
    console.log(`   Commands executed: ${commandCount}`);
  }

  /**
   * Generate performance report
   */
  private generateReport(): PerformanceReport {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;
    const overallScore = (passed / this.results.length) * 100;
    
    const report: PerformanceReport = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        memory: os.totalmem() / 1024 / 1024 / 1024, // GB
        cpus: os.cpus().length
      },
      results: this.results,
      summary: {
        totalTests: this.results.length,
        passed,
        failed,
        overallScore
      }
    };
    
    this.printReport(report);
    this.saveReport(report);
    
    return report;
  }

  /**
   * Print performance report to console
   */
  private printReport(report: PerformanceReport): void {
    console.log('\n📊 Performance Benchmark Report');
    console.log('================================');
    console.log(`Timestamp: ${report.timestamp}`);
    console.log(`Platform: ${report.environment.platform} ${report.environment.arch}`);
    console.log(`Node.js: ${report.environment.nodeVersion}`);
    console.log(`Memory: ${report.environment.memory.toFixed(1)}GB`);
    console.log(`CPUs: ${report.environment.cpus}`);
    console.log('');
    
    console.log('Performance Results:');
    console.log('-------------------');
    
    for (const result of report.results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.metric}: ${result.value.toFixed(2)} ${result.unit} (target: ${result.target} ${result.unit})`);
    }
    
    console.log('');
    console.log('Summary:');
    console.log(`  Total Tests: ${report.summary.totalTests}`);
    console.log(`  Passed: ${report.summary.passed}`);
    console.log(`  Failed: ${report.summary.failed}`);
    console.log(`  Overall Score: ${report.summary.overallScore.toFixed(1)}%`);
    
    if (report.summary.failed > 0) {
      console.log('\n⚠️  Performance targets not met. Consider optimization.');
    } else {
      console.log('\n🎉 All performance targets achieved!');
    }
  }

  /**
   * Save performance report to file
   */
  private saveReport(report: PerformanceReport): void {
    const reportPath = path.join(__dirname, '../../performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Performance report saved to: ${reportPath}`);
  }
}

export { PerformanceBenchmark, PerformanceReport, BenchmarkResult };
