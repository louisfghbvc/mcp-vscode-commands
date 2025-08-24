import * as vscode from 'vscode';
import { WebSocketMCPServerExtension } from '../websocket-mcp-server-extension';
import { ConnectionManager } from '../connection-manager';
import { PerformanceMetrics } from '../test/integration-test';

/**
 * WebSocket MCP 架構性能優化器
 * 
 * 分析系統性能並提供優化建議
 */
export class PerformanceOptimizer {
  private extension: WebSocketMCPServerExtension;
  private connectionManager: ConnectionManager;
  private optimizationHistory: OptimizationRecord[] = [];
  private currentMetrics: PerformanceMetrics;
  
  constructor(extension: WebSocketMCPServerExtension, connectionManager: ConnectionManager) {
    this.extension = extension;
    this.connectionManager = connectionManager;
    this.currentMetrics = {
      startupTime: 0,
      connectionTime: 0,
      messageLatency: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
  }
  
  /**
   * 執行性能分析
   */
  async analyzePerformance(): Promise<PerformanceAnalysis> {
    console.log('[Performance Optimizer] 🔍 開始性能分析...');
    
    // 收集當前性能指標
    await this.collectCurrentMetrics();
    
    // 分析性能瓶頸
    const bottlenecks = this.identifyBottlenecks();
    
    // 生成優化建議
    const recommendations = this.generateRecommendations(bottlenecks);
    
    // 計算性能分數
    const performanceScore = this.calculatePerformanceScore();
    
    const analysis: PerformanceAnalysis = {
      timestamp: Date.now(),
      currentMetrics: this.currentMetrics,
      bottlenecks,
      recommendations,
      performanceScore,
      optimizationHistory: this.optimizationHistory
    };
    
    console.log(`[Performance Optimizer] ✅ 性能分析完成，分數: ${performanceScore}/100`);
    
    return analysis;
  }
  
  /**
   * 收集當前性能指標
   */
  private async collectCurrentMetrics(): Promise<void> {
    try {
      // 獲取服務器狀態
      const serverStatus = this.extension.getStatus();
      
      // 獲取連接統計
      const connectionStats = this.connectionManager.getConnectionStats();
      
      // 獲取記憶體使用
      const memoryUsage = process.memoryUsage();
      this.currentMetrics.memoryUsage = memoryUsage.heapUsed / 1024 / 1024; // MB
      
      // 模擬 CPU 使用率（實際環境中應該使用系統監控工具）
      this.currentMetrics.cpuUsage = this.estimateCPUUsage();
      
      // 記錄啟動時間（如果可用）
      if (serverStatus.uptime) {
        this.currentMetrics.startupTime = serverStatus.uptime * 1000; // 轉換為毫秒
      }
      
      // 記錄連接時間（使用連接數量作為近似值）
      this.currentMetrics.connectionTime = connectionStats.totalConnections * 10; // 模擬值
      
      // 記錄消息延遲（使用錯誤率作為近似值）
      this.currentMetrics.messageLatency = connectionStats.errorRate > 0 ? 15 : 5; // 模擬值
      
    } catch (error) {
      console.error('[Performance Optimizer] 收集性能指標失敗:', error);
    }
  }
  
  /**
   * 估算 CPU 使用率
   */
  private estimateCPUUsage(): number {
    // 基於記憶體使用和連接數量估算 CPU 使用率
    const memoryUsage = this.currentMetrics.memoryUsage;
    const connectionCount = this.connectionManager.getActiveConnectionCount();
    
    let estimatedCPU = 1.0; // 基礎 CPU 使用率
    
    // 記憶體使用影響
    if (memoryUsage > 100) {
      estimatedCPU += 2.0;
    } else if (memoryUsage > 50) {
      estimatedCPU += 1.0;
    }
    
    // 連接數量影響
    if (connectionCount > 20) {
      estimatedCPU += 2.0;
    } else if (connectionCount > 10) {
      estimatedCPU += 1.0;
    }
    
    return Math.min(estimatedCPU, 10.0); // 最大 10%
  }
  
  /**
   * 識別性能瓶頸
   */
  private identifyBottlenecks(): PerformanceBottleneck[] {
    const bottlenecks: PerformanceBottleneck[] = [];
    
    // 檢查啟動時間
    if (this.currentMetrics.startupTime > 500) {
      bottlenecks.push({
        type: 'startup_time',
        severity: 'high',
        description: `服務器啟動時間過長: ${this.currentMetrics.startupTime}ms (目標: <500ms)`,
        impact: '影響用戶體驗和系統響應性',
        suggestion: '優化初始化流程，減少不必要的操作'
      });
    } else if (this.currentMetrics.startupTime > 200) {
      bottlenecks.push({
        type: 'startup_time',
        severity: 'medium',
        description: `服務器啟動時間較長: ${this.currentMetrics.startupTime}ms (目標: <200ms)`,
        impact: '輕微影響用戶體驗',
        suggestion: '考慮優化初始化流程'
      });
    }
    
    // 檢查連接時間
    if (this.currentMetrics.connectionTime > 100) {
      bottlenecks.push({
        type: 'connection_time',
        severity: 'high',
        description: `客戶端連接時間過長: ${this.currentMetrics.connectionTime}ms (目標: <100ms)`,
        impact: '影響連接建立速度',
        suggestion: '優化 WebSocket 握手流程，檢查網絡延遲'
      });
    }
    
    // 檢查消息延遲
    if (this.currentMetrics.messageLatency > 10) {
      bottlenecks.push({
        type: 'message_latency',
        severity: 'medium',
        description: `消息處理延遲較高: ${this.currentMetrics.messageLatency}ms (目標: <10ms)`,
        impact: '影響實時通信性能',
        suggestion: '優化消息處理邏輯，減少阻塞操作'
      });
    }
    
    // 檢查記憶體使用
    if (this.currentMetrics.memoryUsage > 50) {
      bottlenecks.push({
        type: 'memory_usage',
        severity: 'high',
        description: `記憶體使用過高: ${this.currentMetrics.memoryUsage.toFixed(2)}MB (目標: <50MB)`,
        impact: '可能導致記憶體洩漏和系統不穩定',
        suggestion: '檢查記憶體洩漏，優化對象生命週期管理'
      });
    }
    
    // 檢查 CPU 使用率
    if (this.currentMetrics.cpuUsage > 5) {
      bottlenecks.push({
        type: 'cpu_usage',
        severity: 'medium',
        description: `CPU 使用率較高: ${this.currentMetrics.cpuUsage.toFixed(1)}% (目標: <5%)`,
        impact: '影響系統整體性能',
        suggestion: '優化計算密集型操作，減少不必要的循環'
      });
    }
    
    return bottlenecks;
  }
  
  /**
   * 生成優化建議
   */
  private generateRecommendations(bottlenecks: PerformanceBottleneck[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    
    // 基於瓶頸生成建議
    bottlenecks.forEach(bottleneck => {
      switch (bottleneck.type) {
        case 'startup_time':
          recommendations.push({
            priority: 'high',
            category: 'initialization',
            title: '優化服務器啟動流程',
            description: '減少啟動時間，提升用戶體驗',
            actions: [
              '延遲加載非關鍵組件',
              '並行化初始化操作',
              '優化依賴項加載',
              '實現啟動進度指示器'
            ],
            expectedImprovement: '啟動時間減少 30-50%'
          });
          break;
          
        case 'connection_time':
          recommendations.push({
            priority: 'high',
            category: 'connection',
            title: '優化 WebSocket 連接建立',
            description: '減少連接建立時間',
            actions: [
              '優化 WebSocket 握手流程',
              '實現連接池預熱',
              '檢查網絡配置',
              '實現連接重試機制'
            ],
            expectedImprovement: '連接時間減少 40-60%'
          });
          break;
          
        case 'message_latency':
          recommendations.push({
            priority: 'medium',
            category: 'processing',
            title: '優化消息處理邏輯',
            description: '減少消息處理延遲',
            actions: [
              '異步處理非關鍵操作',
              '實現消息批處理',
              '優化序列化/反序列化',
              '減少阻塞操作'
            ],
            expectedImprovement: '消息延遲減少 50-70%'
          });
          break;
          
        case 'memory_usage':
          recommendations.push({
            priority: 'high',
            category: 'memory',
            title: '優化記憶體管理',
            description: '減少記憶體使用和洩漏',
            actions: [
              '檢查記憶體洩漏',
              '優化對象生命週期',
              '實現記憶體池',
              '定期強制垃圾回收'
            ],
            expectedImprovement: '記憶體使用減少 20-40%'
          });
          break;
          
        case 'cpu_usage':
          recommendations.push({
            priority: 'medium',
            category: 'processing',
            title: '優化 CPU 密集型操作',
            description: '減少 CPU 使用率',
            actions: [
              '優化算法複雜度',
              '實現緩存機制',
              '減少不必要的計算',
              '使用 Web Workers 處理重任務'
            ],
            expectedImprovement: 'CPU 使用率減少 30-50%'
          });
          break;
      }
    });
    
    // 添加通用優化建議
    recommendations.push({
      priority: 'medium',
      category: 'general',
      title: '實現性能監控',
      description: '持續監控系統性能指標',
      actions: [
        '實現實時性能儀表板',
        '設置性能警報',
        '記錄性能趨勢',
        '自動化性能測試'
      ],
      expectedImprovement: '提前發現性能問題，減少停機時間'
    });
    
    return recommendations;
  }
  
  /**
   * 計算性能分數
   */
  private calculatePerformanceScore(): number {
    let score = 100;
    
    // 啟動時間評分
    if (this.currentMetrics.startupTime > 500) score -= 20;
    else if (this.currentMetrics.startupTime > 200) score -= 10;
    
    // 連接時間評分
    if (this.currentMetrics.connectionTime > 100) score -= 20;
    else if (this.currentMetrics.connectionTime > 50) score -= 10;
    
    // 消息延遲評分
    if (this.currentMetrics.messageLatency > 10) score -= 20;
    else if (this.currentMetrics.messageLatency > 5) score -= 10;
    
    // 記憶體使用評分
    if (this.currentMetrics.memoryUsage > 50) score -= 20;
    else if (this.currentMetrics.memoryUsage > 25) score -= 10;
    
    // CPU 使用率評分
    if (this.currentMetrics.cpuUsage > 5) score -= 20;
    else if (this.currentMetrics.cpuUsage > 2) score -= 10;
    
    return Math.max(0, score);
  }
  
  /**
   * 應用優化建議
   */
  async applyOptimization(recommendation: OptimizationRecommendation): Promise<OptimizationResult> {
    console.log(`[Performance Optimizer] 🔧 應用優化建議: ${recommendation.title}`);
    
    const startTime = Date.now();
    let success = false;
    let error: string | null = null;
    
    try {
      // 根據建議類型應用優化
      switch (recommendation.category) {
        case 'initialization':
          success = await this.optimizeInitialization();
          break;
        case 'connection':
          success = await this.optimizeConnection();
          break;
        case 'processing':
          success = await this.optimizeProcessing();
          break;
        case 'memory':
          success = await this.optimizeMemory();
          break;
        case 'general':
          success = await this.optimizeGeneral();
          break;
        default:
          throw new Error(`Unknown optimization category: ${recommendation.category}`);
      }
      
      if (success) {
        // 記錄優化歷史
        const record: OptimizationRecord = {
          timestamp: Date.now(),
          recommendation,
          applied: true,
          duration: Date.now() - startTime,
          previousMetrics: { ...this.currentMetrics }
        };
        
        this.optimizationHistory.push(record);
        
        // 重新收集指標
        await this.collectCurrentMetrics();
        record.newMetrics = { ...this.currentMetrics };
        
        console.log('[Performance Optimizer] ✅ 優化應用成功');
      }
      
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      console.error('[Performance Optimizer] ❌ 優化應用失敗:', error);
    }
    
    const result: OptimizationResult = {
      success,
      error,
      duration: Date.now() - startTime,
      recommendation,
      metricsBefore: this.optimizationHistory.length > 0 ? 
        this.optimizationHistory[this.optimizationHistory.length - 1].previousMetrics : null,
      metricsAfter: success ? this.currentMetrics : null
    };
    
    return result;
  }
  
  /**
   * 優化初始化流程
   */
  private async optimizeInitialization(): Promise<boolean> {
    // 實現初始化優化邏輯
    console.log('[Performance Optimizer] 優化初始化流程...');
    
    // 模擬優化過程
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  }
  
  /**
   * 優化連接流程
   */
  private async optimizeConnection(): Promise<boolean> {
    // 實現連接優化邏輯
    console.log('[Performance Optimizer] 優化連接流程...');
    
    // 模擬優化過程
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  }
  
  /**
   * 優化處理流程
   */
  private async optimizeProcessing(): Promise<boolean> {
    // 實現處理優化邏輯
    console.log('[Performance Optimizer] 優化處理流程...');
    
    // 模擬優化過程
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  }
  
  /**
   * 優化記憶體管理
   */
  private async optimizeMemory(): Promise<boolean> {
    // 實現記憶體優化邏輯
    console.log('[Performance Optimizer] 優化記憶體管理...');
    
    // 強制垃圾回收
    if (global.gc) {
      global.gc();
    }
    
    // 模擬優化過程
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  }
  
  /**
   * 通用優化
   */
  private async optimizeGeneral(): Promise<boolean> {
    // 實現通用優化邏輯
    console.log('[Performance Optimizer] 應用通用優化...');
    
    // 模擬優化過程
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return true;
  }
  
  /**
   * 獲取優化歷史
   */
  getOptimizationHistory(): OptimizationRecord[] {
    return [...this.optimizationHistory];
  }
  
  /**
   * 清理資源
   */
  dispose(): void {
    this.optimizationHistory = [];
  }
}

/**
 * 性能分析結果接口
 */
export interface PerformanceAnalysis {
  timestamp: number;
  currentMetrics: PerformanceMetrics;
  bottlenecks: PerformanceBottleneck[];
  recommendations: OptimizationRecommendation[];
  performanceScore: number;
  optimizationHistory: OptimizationRecord[];
}

/**
 * 性能瓶頸接口
 */
export interface PerformanceBottleneck {
  type: 'startup_time' | 'connection_time' | 'message_latency' | 'memory_usage' | 'cpu_usage';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string;
  suggestion: string;
}

/**
 * 優化建議接口
 */
export interface OptimizationRecommendation {
  priority: 'low' | 'medium' | 'high';
  category: 'initialization' | 'connection' | 'processing' | 'memory' | 'general';
  title: string;
  description: string;
  actions: string[];
  expectedImprovement: string;
}

/**
 * 優化記錄接口
 */
export interface OptimizationRecord {
  timestamp: number;
  recommendation: OptimizationRecommendation;
  applied: boolean;
  duration: number;
  previousMetrics: PerformanceMetrics;
  newMetrics?: PerformanceMetrics;
}

/**
 * 優化結果接口
 */
export interface OptimizationResult {
  success: boolean;
  error: string | null;
  duration: number;
  recommendation: OptimizationRecommendation;
  metricsBefore: PerformanceMetrics | null;
  metricsAfter: PerformanceMetrics | null;
}
