/**
 * MCP Performance Testing Framework
 * 完整的性能測試和基準測試套件
 */

import * as vscode from 'vscode';
import { performance } from 'perf_hooks';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface PerformanceResult {
    latency: number;      // ms
    memoryUsage: number;  // MB
    cpuUsage: number;     // %
    timestamp: Date;
    success: boolean;
    error?: string;
}

export interface PerformanceMetrics {
    average: number;
    min: number;
    max: number;
    median: number;
    p95: number;
    p99: number;
    stdDev: number;
}

export interface ComparisonReport {
    architecture: string;
    commandLatency: PerformanceMetrics;
    memoryUsage: PerformanceMetrics;
    cpuUsage: PerformanceMetrics;
    throughput: number; // commands per second
    startupTime: number; // ms
    totalTests: number;
    successRate: number; // %
}

export class PerformanceTester {
    private results: PerformanceResult[] = [];
    private startTime: number = 0;
    private testCount: number = 0;

    /**
     * 測量單一命令執行性能
     */
    async measureCommandExecution(commandId: string, args: any[] = []): Promise<PerformanceResult> {
        const startTime = performance.now();
        const startMemory = process.memoryUsage();
        let success = false;
        let error: string | undefined;

        try {
            // 使用模擬的 VSCode 命令執行
            if (vscode.commands && vscode.commands.executeCommand) {
                await vscode.commands.executeCommand(commandId, ...args);
            } else {
                // 在非 VSCode 環境中模擬執行
                await this.simulateCommandExecution(commandId, args);
            }
            success = true;
        } catch (err) {
            error = err instanceof Error ? err.message : String(err);
        }

        const endTime = performance.now();
        const endMemory = process.memoryUsage();

        const result: PerformanceResult = {
            latency: endTime - startTime,
            memoryUsage: (endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024,
            cpuUsage: await this.getCpuUsage(),
            timestamp: new Date(),
            success,
            error
        };

        this.results.push(result);
        this.testCount++;
        
        return result;
    }

    /**
     * 模擬命令執行（用於測試環境）
     */
    private async simulateCommandExecution(commandId: string, args: any[]): Promise<void> {
        // 模擬不同命令的執行時間
        const simulatedLatency = this.getSimulatedLatency(commandId);
        await new Promise(resolve => setTimeout(resolve, simulatedLatency));
        
        // 模擬一些記憶體使用
        const buffer = Buffer.alloc(Math.random() * 1024 * 100); // 0-100KB
        buffer.fill(0);
    }

    /**
     * 獲取模擬的命令執行延遲
     */
    private getSimulatedLatency(commandId: string): number {
        const latencyMap: Record<string, number> = {
            'editor.action.formatDocument': 15 + Math.random() * 10,
            'editor.action.organizeImports': 8 + Math.random() * 5,
            'workbench.action.quickOpen': 5 + Math.random() * 3,
            'workbench.action.showCommands': 3 + Math.random() * 2,
            'editor.action.commentLine': 2 + Math.random() * 1,
            'workbench.action.files.save': 10 + Math.random() * 5,
            'editor.action.selectAll': 1 + Math.random() * 0.5,
            'editor.action.copyLinesDown': 3 + Math.random() * 2,
            'editor.action.moveLinesUp': 3 + Math.random() * 2,
            'vscode.listCommands': 12 + Math.random() * 8
        };
        
        return latencyMap[commandId] || (5 + Math.random() * 5);
    }

    /**
     * 獲取 CPU 使用率
     */
    protected async getCpuUsage(): Promise<number> {
        // 簡化的 CPU 使用率計算
        const startUsage = process.cpuUsage();
        await new Promise(resolve => setTimeout(resolve, 10));
        const endUsage = process.cpuUsage(startUsage);
        
        const totalUsage = (endUsage.user + endUsage.system) / 1000; // 轉換為毫秒
        return Math.min(100, totalUsage / 10); // 估算百分比
    }

    /**
     * 批量測試命令執行
     */
    async measureBatchCommands(commands: string[], iterations: number = 10): Promise<PerformanceResult[]> {
        const results: PerformanceResult[] = [];
        
        console.log(`🔄 執行批量測試: ${commands.length} 個命令，${iterations} 次迭代`);
        
        for (let i = 0; i < iterations; i++) {
            for (const command of commands) {
                const result = await this.measureCommandExecution(command);
                results.push(result);
                
                // 小延遲避免系統過載
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        return results;
    }

    /**
     * 測量啟動性能
     */
    async measureStartupPerformance(): Promise<number> {
        this.startTime = performance.now();
        
        // 模擬 extension 啟動過程
        await this.simulateStartupSequence();
        
        const endTime = performance.now();
        return endTime - this.startTime;
    }

    /**
     * 模擬啟動序列
     */
    private async simulateStartupSequence(): Promise<void> {
        // 模擬載入依賴
        await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 10));
        
        // 模擬初始化配置
        await new Promise(resolve => setTimeout(resolve, 15 + Math.random() * 5));
        
        // 模擬註冊命令
        await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 5));
        
        // 模擬服務器連接
        await new Promise(resolve => setTimeout(resolve, 25 + Math.random() * 15));
    }

    /**
     * 長時間運行性能測試
     */
    async measureLongRunningPerformance(commandCount: number): Promise<PerformanceMetrics> {
        console.log(`⏱️  開始長時間性能測試: ${commandCount} 個命令`);
        
        const commands = [
            'editor.action.formatDocument',
            'editor.action.organizeImports',
            'workbench.action.quickOpen',
            'editor.action.commentLine',
            'workbench.action.files.save'
        ];
        
        const results: PerformanceResult[] = [];
        const startTime = performance.now();
        
        for (let i = 0; i < commandCount; i++) {
            const command = commands[i % commands.length];
            const result = await this.measureCommandExecution(command);
            results.push(result);
            
            // 每 100 個命令報告進度
            if ((i + 1) % 100 === 0) {
                console.log(`   📊 進度: ${i + 1}/${commandCount} (${((i + 1) / commandCount * 100).toFixed(1)}%)`);
            }
        }
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        
        console.log(`✅ 長時間測試完成，總時間: ${totalTime.toFixed(2)}ms`);
        
        return this.calculateMetrics(results.map(r => r.latency));
    }

    /**
     * 計算性能指標
     */
    calculateMetrics(values: number[]): PerformanceMetrics {
        if (values.length === 0) {
            return {
                average: 0, min: 0, max: 0, median: 0,
                p95: 0, p99: 0, stdDev: 0
            };
        }

        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        const average = sum / values.length;
        
        // 計算標準差
        const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        return {
            average,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            stdDev
        };
    }

    /**
     * 生成性能報告
     */
    generateReport(architecture: string): ComparisonReport {
        const latencies = this.results.map(r => r.latency);
        const memoryUsages = this.results.map(r => r.memoryUsage);
        const cpuUsages = this.results.map(r => r.cpuUsage);
        const successCount = this.results.filter(r => r.success).length;
        
        return {
            architecture,
            commandLatency: this.calculateMetrics(latencies),
            memoryUsage: this.calculateMetrics(memoryUsages),
            cpuUsage: this.calculateMetrics(cpuUsages),
            throughput: this.results.length / (this.getTotalTestTime() / 1000), // commands per second
            startupTime: this.startTime,
            totalTests: this.results.length,
            successRate: (successCount / this.results.length) * 100
        };
    }

    /**
     * 獲取總測試時間
     */
    protected getTotalTestTime(): number {
        if (this.results.length === 0) return 0;
        
        const firstTest = this.results[0].timestamp.getTime();
        const lastTest = this.results[this.results.length - 1].timestamp.getTime();
        return lastTest - firstTest;
    }

    /**
     * 清除測試結果
     */
    clearResults(): void {
        this.results = [];
        this.testCount = 0;
        this.startTime = 0;
    }

    /**
     * 導出測試數據
     */
    exportResults(filePath: string): void {
        const data = {
            timestamp: new Date().toISOString(),
            totalTests: this.results.length,
            results: this.results,
            summary: this.generateReport('current')
        };
        
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        console.log(`📄 測試結果已導出至: ${filePath}`);
    }
}
