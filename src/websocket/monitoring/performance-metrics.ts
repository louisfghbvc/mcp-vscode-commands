import { MetricValue, PerformanceReport } from '../interfaces/communication';

/**
 * 性能指標收集器
 * 
 * 收集和追蹤 WebSocket 通信的性能指標，包括延遲、吞吐量、錯誤率等
 */
export class PerformanceMetrics {
  private metrics: Map<string, MetricValue[]> = new Map();
  private maxDataPoints = 1000; // 每個指標最多保存 1000 個數據點
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startCleanupTimer();
  }
  
  /**
   * 記錄性能指標
   */
  recordMetric(name: string, value: number, timestamp: number = Date.now()): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metricValues = this.metrics.get(name)!;
    metricValues.push({ value, timestamp });
    
    // 保持最近 maxDataPoints 個數據點
    if (metricValues.length > this.maxDataPoints) {
      metricValues.splice(0, metricValues.length - this.maxDataPoints);
    }
    
    // 記錄到控制台（可選）
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value} (${new Date(timestamp).toISOString()})`);
    }
  }
  
  /**
   * 獲取指定指標的所有數據
   */
  getMetric(name: string): MetricValue[] {
    return this.metrics.get(name) || [];
  }
  
  /**
   * 獲取指定指標的平均值
   */
  getAverage(name: string): number {
    const values = this.getMetric(name);
    if (values.length === 0) return 0;
    
    const sum = values.reduce((acc, val) => acc + val.value, 0);
    return sum / values.length;
  }
  
  /**
   * 獲取指定指標的最小值
   */
  getMin(name: string): number {
    const values = this.getMetric(name);
    if (values.length === 0) return 0;
    
    return Math.min(...values.map(v => v.value));
  }
  
  /**
   * 獲取指定指標的最大值
   */
  getMax(name: string): number {
    const values = this.getMetric(name);
    if (values.length === 0) return 0;
    
    return Math.max(...values.map(v => v.value));
  }
  
  /**
   * 獲取指定指標的當前值（最新值）
   */
  getCurrent(name: string): number {
    const values = this.getMetric(name);
    if (values.length === 0) return 0;
    
    return values[values.length - 1].value;
  }
  
  /**
   * 獲取指定指標的統計信息
   */
  getMetricStats(name: string): {
    current: number;
    average: number;
    min: number;
    max: number;
    count: number;
    lastUpdate: number;
  } {
    const values = this.getMetric(name);
    
    return {
      current: this.getCurrent(name),
      average: this.getAverage(name),
      min: this.getMin(name),
      max: this.getMax(name),
      count: values.length,
      lastUpdate: values.length > 0 ? values[values.length - 1].timestamp : 0
    };
  }
  
  /**
   * 獲取平均延遲
   */
  getLatency(): number {
    return this.getAverage('message_latency');
  }
  
  /**
   * 獲取吞吐量（每秒消息數）
   */
  getThroughput(): number {
    const messageCount = this.getCurrent('messages_per_second');
    return messageCount || 0;
  }
  
  /**
   * 獲取錯誤率
   */
  getErrorRate(): number {
    const totalMessages = this.getCurrent('total_messages') || 0;
    const errorMessages = this.getCurrent('error_messages') || 0;
    
    if (totalMessages === 0) return 0;
    
    return (errorMessages / totalMessages) * 100;
  }
  
  /**
   * 獲取連接數
   */
  getConnectionCount(): number {
    return this.getCurrent('active_connections') || 0;
  }
  
  /**
   * 獲取記憶體使用量
   */
  getMemoryUsage(): number {
    return this.getCurrent('memory_usage') || 0;
  }
  
  /**
   * 獲取 CPU 使用率
   */
  getCPUUsage(): number {
    return this.getCurrent('cpu_usage') || 0;
  }
  
  /**
   * 獲取性能報告
   */
  getPerformanceReport(): PerformanceReport {
    const timestamp = Date.now();
    const allMetrics = Array.from(this.metrics.keys());
    
    const metrics: Record<string, any> = {};
    allMetrics.forEach(name => {
      metrics[name] = this.getMetricStats(name);
    });
    
    const summary = {
      totalMetrics: allMetrics.length,
      averageLatency: this.getLatency(),
      errorRate: this.getErrorRate(),
      throughput: this.getThroughput()
    };
    
    return {
      timestamp,
      metrics,
      summary
    };
  }
  
  /**
   * 清理舊的性能數據
   */
  cleanupOldMetrics(maxAge: number = 24 * 60 * 60 * 1000): void { // 默認 24 小時
    const cutoffTime = Date.now() - maxAge;
    let totalCleaned = 0;
    
    this.metrics.forEach((values, name) => {
      const originalLength = values.length;
      const filteredValues = values.filter(v => v.timestamp >= cutoffTime);
      
      if (filteredValues.length < originalLength) {
        this.metrics.set(name, filteredValues);
        totalCleaned += originalLength - filteredValues.length;
      }
    });
    
    if (totalCleaned > 0) {
      console.log(`[Performance] Cleaned up ${totalCleaned} old metric data points`);
    }
  }
  
  /**
   * 開始清理定時器
   */
  private startCleanupTimer(): void {
    // 每小時清理一次舊數據
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000);
  }
  
  /**
   * 停止清理定時器
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
  
  /**
   * 重置所有指標
   */
  reset(): void {
    this.metrics.clear();
    console.log('[Performance] All metrics reset');
  }
  
  /**
   * 導出指標數據
   */
  export(): Record<string, MetricValue[]> {
    const exportData: Record<string, MetricValue[]> = {};
    
    this.metrics.forEach((values, name) => {
      exportData[name] = [...values];
    });
    
    return exportData;
  }
  
  /**
   * 導入指標數據
   */
  import(data: Record<string, MetricValue[]>): void {
    this.metrics.clear();
    
    Object.entries(data).forEach(([name, values]) => {
      this.metrics.set(name, [...values]);
    });
    
    console.log(`[Performance] Imported ${Object.keys(data).length} metrics`);
  }
  
  /**
   * 獲取所有指標名稱
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }
  
  /**
   * 檢查指標是否存在
   */
  hasMetric(name: string): boolean {
    return this.metrics.has(name);
  }
  
  /**
   * 獲取指標數據點數量
   */
  getMetricCount(name: string): number {
    const values = this.getMetric(name);
    return values.length;
  }
  
  /**
   * 獲取總指標數量
   */
  getTotalMetricCount(): number {
    let total = 0;
    this.metrics.forEach(values => {
      total += values.length;
    });
    return total;
  }
}
