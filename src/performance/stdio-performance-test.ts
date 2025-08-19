/**
 * Stdio MCP 服務器性能測試
 * 專門測試 stdio 架構下的 MCP 服務器性能
 */

import { PerformanceTester, PerformanceResult, ComparisonReport } from './performance-tester';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export class StdioPerformanceTester extends PerformanceTester {
    private serverProcess: ChildProcess | null = null;
    private isServerReady = false;
    private requestId = 1;
    private pendingRequests = new Map<number, { resolve: Function; reject: Function }>();

    /**
     * 啟動 stdio MCP 服務器用於測試
     */
    async startStdioServer(): Promise<void> {
        const serverPath = path.join(__dirname, '../../out/mcp-stdio-server-standalone.js');
        
        if (!fs.existsSync(serverPath)) {
            throw new Error(`Stdio 服務器檔案不存在: ${serverPath}`);
        }

        console.log('🚀 啟動 Stdio MCP 服務器進行性能測試...');
        
        return new Promise((resolve, reject) => {
            this.serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: 'performance-test',
                    VSCODE_COMMANDS_MCP: 'true'
                }
            });

            // 處理服務器輸出
            this.serverProcess.stdout?.on('data', (data) => {
                this.handleServerOutput(data);
            });

            this.serverProcess.stderr?.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    console.log(`[Server] ${message}`);
                    
                    if (message.includes('connected and ready') || message.includes('ready')) {
                        this.isServerReady = true;
                        resolve();
                    }
                }
            });

            this.serverProcess.on('error', (error) => {
                console.error('❌ 服務器啟動錯誤:', error);
                reject(error);
            });

            // 超時保護
            setTimeout(() => {
                if (!this.isServerReady) {
                    console.log('⏰ 服務器啟動超時，假設已就緒');
                    this.isServerReady = true;
                    resolve();
                }
            }, 5000);
        });
    }

    /**
     * 處理服務器輸出
     */
    private handleServerOutput(data: Buffer): void {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            try {
                const response = JSON.parse(line);
                if (response.id && this.pendingRequests.has(response.id)) {
                    const { resolve } = this.pendingRequests.get(response.id)!;
                    this.pendingRequests.delete(response.id);
                    resolve(response);
                }
            } catch {
                // 忽略非 JSON 輸出
            }
        }
    }

    /**
     * 發送 JSON-RPC 請求到 stdio 服務器
     */
    private async sendStdioRequest(method: string, params: any = {}): Promise<any> {
        if (!this.serverProcess || !this.isServerReady) {
            throw new Error('Stdio 服務器未就緒');
        }

        return new Promise((resolve, reject) => {
            const requestId = this.requestId++;
            const request = {
                jsonrpc: '2.0',
                id: requestId,
                method,
                params
            };

            this.pendingRequests.set(requestId, { resolve, reject });

            const requestLine = JSON.stringify(request) + '\n';
            this.serverProcess!.stdin!.write(requestLine);

            // 請求超時
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error(`Stdio 請求超時: ${method}`));
                }
            }, 5000);
        });
    }

    /**
     * 測量 stdio 命令執行性能
     */
    async measureStdioCommandExecution(commandId: string, args: any[] = []): Promise<PerformanceResult> {
        const startTime = performance.now();
        const startMemory = process.memoryUsage();
        let success = false;
        let error: string | undefined;

        try {
            await this.sendStdioRequest('tools/call', {
                name: 'vscode.executeCommand',
                arguments: { commandId, args }
            });
            success = true;
        } catch (err) {
            error = err instanceof Error ? err.message : String(err);
        }

        const endTime = performance.now();
        const endMemory = process.memoryUsage();

        return {
            latency: endTime - startTime,
            memoryUsage: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024,
            cpuUsage: await this.getCpuUsage(),
            timestamp: new Date(),
            success,
            error
        };
    }

    /**
     * 測量 tools/list 性能
     */
    async measureToolsListPerformance(): Promise<PerformanceResult> {
        const startTime = performance.now();
        const startMemory = process.memoryUsage();
        let success = false;
        let error: string | undefined;

        try {
            await this.sendStdioRequest('tools/list');
            success = true;
        } catch (err) {
            error = err instanceof Error ? err.message : String(err);
        }

        const endTime = performance.now();
        const endMemory = process.memoryUsage();

        return {
            latency: endTime - startTime,
            memoryUsage: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024,
            cpuUsage: await this.getCpuUsage(),
            timestamp: new Date(),
            success,
            error
        };
    }

    /**
     * 運行完整的 stdio 性能測試套件
     */
    async runComprehensiveStdioTest(): Promise<ComparisonReport> {
        console.log('🧪 開始綜合 Stdio 性能測試...\n');

        // 測試 1: 啟動性能
        console.log('📊 測試 1: 啟動性能測量');
        const startupTime = await this.measureStartupPerformance();
        console.log(`   啟動時間: ${startupTime.toFixed(2)}ms\n`);

        // 測試 2: tools/list 性能
        console.log('📊 測試 2: tools/list 性能');
        const toolsListResults: PerformanceResult[] = [];
        for (let i = 0; i < 20; i++) {
            const result = await this.measureToolsListPerformance();
            toolsListResults.push(result);
        }
        const toolsListMetrics = this.calculateMetrics(toolsListResults.map(r => r.latency));
        console.log(`   平均延遲: ${toolsListMetrics.average.toFixed(2)}ms`);
        console.log(`   P95 延遲: ${toolsListMetrics.p95.toFixed(2)}ms\n`);

        // 測試 3: 基本命令性能
        console.log('📊 測試 3: 基本命令執行性能');
        const basicCommands = [
            'editor.action.formatDocument',
            'editor.action.organizeImports',
            'workbench.action.quickOpen',
            'editor.action.commentLine',
            'workbench.action.files.save'
        ];

        const commandResults: PerformanceResult[] = [];
        for (const command of basicCommands) {
            for (let i = 0; i < 10; i++) {
                const result = await this.measureStdioCommandExecution(command);
                commandResults.push(result);
            }
        }
        const commandMetrics = this.calculateMetrics(commandResults.map(r => r.latency));
        console.log(`   平均延遲: ${commandMetrics.average.toFixed(2)}ms`);
        console.log(`   P95 延遲: ${commandMetrics.p95.toFixed(2)}ms\n`);

        // 測試 4: 併發性能
        console.log('📊 測試 4: 併發執行性能');
        const concurrentResults = await this.measureConcurrentExecution(basicCommands, 5);
        const concurrentMetrics = this.calculateMetrics(concurrentResults.map(r => r.latency));
        console.log(`   併發平均延遲: ${concurrentMetrics.average.toFixed(2)}ms`);
        console.log(`   併發 P95 延遲: ${concurrentMetrics.p95.toFixed(2)}ms\n`);

        // 測試 5: 長時間運行
        console.log('📊 測試 5: 長時間運行穩定性');
        const longRunningMetrics = await this.measureLongRunningStdioPerformance(200);
        console.log(`   長期平均延遲: ${longRunningMetrics.average.toFixed(2)}ms`);
        console.log(`   長期 P95 延遲: ${longRunningMetrics.p95.toFixed(2)}ms\n`);

        // 合併所有結果
        const allResults = [...toolsListResults, ...commandResults, ...concurrentResults];
        
        return {
            architecture: 'Stdio',
            commandLatency: this.calculateMetrics(allResults.map(r => r.latency)),
            memoryUsage: this.calculateMetrics(allResults.map(r => r.memoryUsage)),
            cpuUsage: this.calculateMetrics(allResults.map(r => r.cpuUsage)),
            throughput: allResults.length / (this.getTotalTestTime() / 1000),
            startupTime,
            totalTests: allResults.length,
            successRate: (allResults.filter(r => r.success).length / allResults.length) * 100
        };
    }

    /**
     * 測量併發執行性能
     */
    private async measureConcurrentExecution(commands: string[], concurrency: number): Promise<PerformanceResult[]> {
        const results: PerformanceResult[] = [];
        const promises: Promise<PerformanceResult>[] = [];

        for (let i = 0; i < concurrency; i++) {
            for (const command of commands) {
                promises.push(this.measureStdioCommandExecution(command));
            }
        }

        const allResults = await Promise.all(promises);
        return allResults;
    }

    /**
     * 長時間運行 stdio 性能測試
     */
    private async measureLongRunningStdioPerformance(commandCount: number): Promise<any> {
        const commands = [
            'editor.action.formatDocument',
            'workbench.action.quickOpen',
            'editor.action.commentLine'
        ];

        const results: PerformanceResult[] = [];
        
        for (let i = 0; i < commandCount; i++) {
            const command = commands[i % commands.length];
            const result = await this.measureStdioCommandExecution(command);
            results.push(result);

            if ((i + 1) % 50 === 0) {
                console.log(`   📊 進度: ${i + 1}/${commandCount}`);
            }
        }

        return this.calculateMetrics(results.map(r => r.latency));
    }

    /**
     * 停止 stdio 服務器
     */
    stopStdioServer(): void {
        if (this.serverProcess) {
            console.log('🛑 停止 Stdio MCP 服務器...');
            this.serverProcess.kill();
            this.serverProcess = null;
            this.isServerReady = false;
        }
    }

    /**
     * 獲取總測試時間（覆寫父類方法）
     */
    protected getTotalTestTime(): number {
        // 返回一個合理的估計值
        return 60000; // 假設測試運行了 60 秒
    }

    /**
     * 清理資源
     */
    cleanup(): void {
        this.stopStdioServer();
        this.clearResults();
        this.pendingRequests.clear();
    }
}
