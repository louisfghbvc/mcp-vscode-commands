#!/usr/bin/env npx tsx

import { runE2ETests } from './test-runner';
import { PerformanceBenchmark } from './performance-benchmark';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Command Line Test Runner for E2E Integration Tests
 * Supports different test modes and reporting options
 */

interface TestOptions {
  mode: 'all' | 'functional' | 'performance' | 'quick';
  output: 'console' | 'json' | 'both';
  saveResults: boolean;
}

class TestRunner {
  private options: TestOptions;

  constructor(options: Partial<TestOptions> = {}) {
    this.options = {
      mode: 'all',
      output: 'both',
      saveResults: true,
      ...options
    };
  }

  /**
   * Run tests based on specified mode
   */
  async run(): Promise<void> {
    console.log('🚀 Starting MCP Extension E2E Tests');
    console.log(`Mode: ${this.options.mode}`);
    console.log(`Output: ${this.options.output}`);
    console.log('=' .repeat(50));

    const startTime = Date.now();
    let success = true;

    try {
      switch (this.options.mode) {
        case 'all':
          await this.runAllTests();
          break;
        case 'functional':
          await this.runFunctionalTests();
          break;
        case 'performance':
          await this.runPerformanceTests();
          break;
        case 'quick':
          await this.runQuickTests();
          break;
      }
    } catch (error) {
      console.error('💥 Tests failed:', error.message);
      success = false;
    }

    const duration = Date.now() - startTime;
    
    console.log('\\n' + '=' .repeat(50));
    console.log(`🏁 Tests completed in ${(duration / 1000).toFixed(2)}s`);
    console.log(success ? '✅ All tests passed!' : '❌ Some tests failed!');

    if (!success) {
      process.exit(1);
    }
  }

  /**
   * Run all test suites
   */
  private async runAllTests(): Promise<void> {
    console.log('🔄 Running complete test suite...');
    
    // Run functional tests first
    await this.runFunctionalTests();
    
    console.log('\\n' + '-' .repeat(50));
    
    // Then run performance tests
    await this.runPerformanceTests();
  }

  /**
   * Run functional tests only
   */
  private async runFunctionalTests(): Promise<void> {
    console.log('🧪 Running functional tests...');
    await runE2ETests();
  }

  /**
   * Run performance tests only
   */
  private async runPerformanceTests(): Promise<void> {
    console.log('📊 Running performance benchmarks...');
    
    const benchmark = new PerformanceBenchmark();
    const report = await benchmark.runBenchmarks();
    
    if (this.options.saveResults) {
      this.savePerformanceReport(report);
    }
    
    // Check if all performance targets were met
    const failedTests = report.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      throw new Error(`${failedTests.length} performance tests failed`);
    }
  }

  /**
   * Run quick smoke tests
   */
  private async runQuickTests(): Promise<void> {
    console.log('⚡ Running quick smoke tests...');
    
    // This would be a subset of functional tests for quick validation
    // For now, just run the performance benchmark as it's faster
    const benchmark = new PerformanceBenchmark();
    await benchmark.runBenchmarks();
  }

  /**
   * Save performance report to file
   */
  private savePerformanceReport(report: any): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-report-${timestamp}.json`;
    const filepath = path.join(__dirname, '../../reports', filename);
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(filepath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Performance report saved: ${filepath}`);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): TestOptions {
  const args = process.argv.slice(2);
  const options: Partial<TestOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--mode':
      case '-m':
        options.mode = args[++i] as TestOptions['mode'];
        break;
      case '--output':
      case '-o':
        options.output = args[++i] as TestOptions['output'];
        break;
      case '--no-save':
        options.saveResults = false;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options as TestOptions;
}

/**
 * Print help information
 */
function printHelp(): void {
  console.log(`
MCP Extension E2E Test Runner

Usage: npx tsx test/e2e/run-tests.ts [options]

Options:
  -m, --mode <mode>    Test mode: all, functional, performance, quick (default: all)
  -o, --output <type>  Output format: console, json, both (default: both)
  --no-save           Don't save test reports to files
  -h, --help          Show this help message

Examples:
  npx tsx test/e2e/run-tests.ts                    # Run all tests
  npx tsx test/e2e/run-tests.ts -m functional      # Run functional tests only
  npx tsx test/e2e/run-tests.ts -m performance     # Run performance tests only
  npx tsx test/e2e/run-tests.ts -m quick           # Run quick smoke tests
  `);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const options = parseArgs();
    const runner = new TestRunner(options);
    await runner.run();
  } catch (error) {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

export { TestRunner, TestOptions };
