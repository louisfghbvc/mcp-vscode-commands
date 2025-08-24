import * as vscode from 'vscode';
import { WebSocketMCPServerExtension } from '../websocket-mcp-server-extension';
import { ConnectionManager } from '../connection-manager';

/**
 * WebSocket 診斷和監控系統
 * 
 * 提供 WebSocket 服務器的診斷信息、性能監控和故障排除功能
 */
export class WebSocketDiagnostics {
  private extension: WebSocketMCPServerExtension;
  private connectionManager: ConnectionManager;
  private outputChannel: vscode.OutputChannel;
  private statusBarItem: vscode.StatusBarItem | null = null;
  
  constructor(extension: WebSocketMCPServerExtension, connectionManager: ConnectionManager) {
    this.extension = extension;
    this.connectionManager = connectionManager;
    this.outputChannel = vscode.window.createOutputChannel('MCP WebSocket Diagnostics');
    this.setupStatusBar();
  }
  
  /**
   * 設置狀態欄
   */
  private setupStatusBar(): void {
    this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 99);
    this.statusBarItem.name = 'MCP WebSocket Diagnostics';
    this.statusBarItem.tooltip = 'Click to show diagnostics';
    this.statusBarItem.command = 'mcp-vscode-commands.showWebSocketDiagnostics';
    this.updateStatusBar();
    this.statusBarItem.show();
  }
  
  /**
   * 更新狀態欄
   */
  private updateStatusBar(): void {
    if (!this.statusBarItem) return;
    
    const status = this.extension.getStatus();
    const connectionStats = this.connectionManager.getConnectionStats();
    
    if (status.isRunning) {
      this.statusBarItem.text = `$(pulse) ${connectionStats.activeConnections}/${connectionStats.totalConnections}`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
    } else {
      this.statusBarItem.text = `$(pulse) 0/0 (stopped)`;
      this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
    }
  }
  
  /**
   * 顯示診斷信息
   */
  showDiagnostics(): void {
    this.outputChannel.clear();
    this.outputChannel.show();
    
    const diagnostics = this.generateDiagnostics();
    this.outputChannel.appendLine(diagnostics);
  }
  
  /**
   * 生成診斷信息
   */
  private generateDiagnostics(): string {
    const timestamp = new Date().toISOString();
    const status = this.extension.getStatus();
    const connectionStats = this.connectionManager.getConnectionStats();
    const clients = this.extension.getClients();
    
    let diagnostics = '';
    diagnostics += `=== MCP WebSocket Server Diagnostics ===\n`;
    diagnostics += `Timestamp: ${timestamp}\n`;
    diagnostics += `\n`;
    
    // 服務器狀態
    diagnostics += `--- Server Status ---\n`;
    diagnostics += `Status: ${status.isRunning ? 'Running' : 'Stopped'}\n`;
    diagnostics += `Port: ${status.port}\n`;
    diagnostics += `Uptime: ${this.formatUptime(status.uptime)}\n`;
    diagnostics += `\n`;
    
    // 連接統計
    diagnostics += `--- Connection Statistics ---\n`;
    diagnostics += `Total Connections: ${connectionStats.totalConnections}\n`;
    diagnostics += `Active Connections: ${connectionStats.activeConnections}\n`;
    diagnostics += `Inactive Connections: ${connectionStats.inactiveConnections}\n`;
    diagnostics += `Total Messages: ${connectionStats.totalMessages}\n`;
    diagnostics += `Total Errors: ${connectionStats.totalErrors}\n`;
    diagnostics += `Error Rate: ${connectionStats.errorRate.toFixed(2)}%\n`;
    diagnostics += `\n`;
    
    // 客戶端詳細信息
    if (clients.length > 0) {
      diagnostics += `--- Client Details ---\n`;
      clients.forEach((client, index) => {
        diagnostics += `${index + 1}. Client ID: ${client.id}\n`;
        diagnostics += `   Status: ${client.connected ? 'Connected' : 'Disconnected'}\n`;
        
        // 獲取連接的詳細信息
        const connectionInfo = this.connectionManager.getConnection(client.id);
        if (connectionInfo) {
          const health = this.connectionManager.checkConnectionHealth(client.id);
          diagnostics += `   Remote Address: ${connectionInfo.remoteAddress}\n`;
          diagnostics += `   Connected At: ${new Date(connectionInfo.connectedAt).toISOString()}\n`;
          diagnostics += `   Last Activity: ${new Date(connectionInfo.lastActivity).toISOString()}\n`;
          diagnostics += `   Messages Sent: ${connectionInfo.messageCount.sent}\n`;
          diagnostics += `   Messages Received: ${connectionInfo.messageCount.received}\n`;
          diagnostics += `   Errors: ${connectionInfo.messageCount.errors}\n`;
          diagnostics += `   Health: ${health.isHealthy ? 'Healthy' : 'Unhealthy'}\n`;
          if (!health.isHealthy) {
            diagnostics += `   Health Reason: ${health.reason}\n`;
          }
        }
        diagnostics += `\n`;
      });
    } else {
      diagnostics += `--- Client Details ---\n`;
      diagnostics += `No active clients\n\n`;
    }
    
    // 性能指標
    diagnostics += `--- Performance Metrics ---\n`;
    diagnostics += `Memory Usage: ${this.getMemoryUsage()}\n`;
    diagnostics += `CPU Usage: ${this.getCPUUsage()}\n`;
    diagnostics += `\n`;
    
    // 配置信息
    diagnostics += `--- Configuration ---\n`;
    diagnostics += `Max Connections: ${this.connectionManager['maxConnections']}\n`;
    diagnostics += `Connection Timeout: ${this.connectionManager['connectionTimeout']}ms\n`;
    diagnostics += `\n`;
    
    // 建議和警告
    diagnostics += `--- Recommendations ---\n`;
    const recommendations = this.generateRecommendations(status, connectionStats);
    recommendations.forEach(rec => {
      diagnostics += `- ${rec}\n`;
    });
    
    return diagnostics;
  }
  
  /**
   * 生成建議
   */
  private generateRecommendations(status: any, connectionStats: any): string[] {
    const recommendations: string[] = [];
    
    if (!status.isRunning) {
      recommendations.push('Server is not running. Consider starting the WebSocket server.');
    }
    
    if (connectionStats.errorRate > 10) {
      recommendations.push(`High error rate (${connectionStats.errorRate.toFixed(2)}%). Check network stability and client implementations.`);
    }
    
    if (connectionStats.totalConnections === 0) {
      recommendations.push('No active connections. Verify client connectivity and authentication.');
    }
    
    if (connectionStats.activeConnections > 8) {
      recommendations.push('High connection count. Consider increasing max connections limit if needed.');
    }
    
    const memoryUsage = this.getMemoryUsage();
    const usedMB = parseInt(memoryUsage.split('MB')[0]);
    if (usedMB > 100) {
      recommendations.push('High memory usage detected. Monitor for memory leaks.');
    }
    
    return recommendations;
  }
  
  /**
   * 獲取記憶體使用量
   */
  private getMemoryUsage(): string {
    const memUsage = process.memoryUsage();
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    return `${usedMB}MB / ${totalMB}MB`;
  }
  
  /**
   * 獲取 CPU 使用率（簡化版本）
   */
  private getCPUUsage(): string {
    // 這裡可以實現更複雜的 CPU 使用率計算
    // 目前返回一個簡化的指標
    return 'N/A (requires additional monitoring)';
  }
  
  /**
   * 格式化運行時間
   */
  private formatUptime(uptime: number): string {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * 執行健康檢查
   */
  async runHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const results: HealthCheckItem[] = [];
    
    try {
      // 檢查服務器狀態
      const serverStatus = this.extension.getStatus();
      results.push({
        name: 'Server Status',
        status: serverStatus.isRunning ? 'healthy' : 'unhealthy',
        details: serverStatus.isRunning ? 'Server is running' : 'Server is stopped',
        duration: 0
      });
      
      // 檢查連接健康狀態
      const clients = this.extension.getClients();
      clients.forEach(client => {
        const health = this.connectionManager.checkConnectionHealth(client.id);
        results.push({
          name: `Connection ${client.id}`,
          status: health.isHealthy ? 'healthy' : 'unhealthy',
          details: health.reason,
          duration: 0
        });
      });
      
      // 檢查記憶體使用
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const memoryStatus = heapUsedMB < 100 ? 'healthy' : 'warning';
      results.push({
        name: 'Memory Usage',
        status: memoryStatus,
        details: `Heap used: ${heapUsedMB.toFixed(2)}MB`,
        duration: 0
      });
      
      // 檢查錯誤率
      const connectionStats = this.connectionManager.getConnectionStats();
      const errorRateStatus = connectionStats.errorRate < 5 ? 'healthy' : 'warning';
      results.push({
        name: 'Error Rate',
        status: errorRateStatus,
        details: `Error rate: ${connectionStats.errorRate.toFixed(2)}%`,
        duration: 0
      });
      
    } catch (error) {
      results.push({
        name: 'Health Check',
        status: 'error',
        details: error instanceof Error ? error.message : String(error),
        duration: 0
      });
    }
    
    const duration = Date.now() - startTime;
    const healthyCount = results.filter(r => r.status === 'healthy').length;
    const totalCount = results.length;
    
    return {
      timestamp: new Date().toISOString(),
      duration: duration,
      total: totalCount,
      healthy: healthyCount,
      unhealthy: totalCount - healthyCount,
      results: results,
      summary: {
        overall: healthyCount === totalCount ? 'healthy' : 'unhealthy',
        healthPercentage: (healthyCount / totalCount) * 100
      }
    };
  }
  
  /**
   * 顯示健康檢查結果
   */
  async showHealthCheck(): Promise<void> {
    this.outputChannel.clear();
    this.outputChannel.show();
    
    this.outputChannel.appendLine('Running health check...');
    const result = await this.runHealthCheck();
    
    this.outputChannel.appendLine('\n=== Health Check Results ===\n');
    this.outputChannel.appendLine(`Timestamp: ${result.timestamp}`);
    this.outputChannel.appendLine(`Duration: ${result.duration}ms`);
    this.outputChannel.appendLine(`Overall Status: ${result.summary.overall}`);
    this.outputChannel.appendLine(`Health Percentage: ${result.summary.healthPercentage.toFixed(1)}%`);
    this.outputChannel.appendLine(`\n--- Detailed Results ---\n`);
    
    result.results.forEach((item, index) => {
      const statusIcon = item.status === 'healthy' ? '✅' : item.status === 'warning' ? '⚠️' : '❌';
      this.outputChannel.appendLine(`${index + 1}. ${statusIcon} ${item.name}`);
      this.outputChannel.appendLine(`   Status: ${item.status}`);
      this.outputChannel.appendLine(`   Details: ${item.details}`);
      this.outputChannel.appendLine('');
    });
  }
  
  /**
   * 導出診斷信息到文件
   */
  async exportDiagnostics(): Promise<void> {
    try {
      const diagnostics = this.generateDiagnostics();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `mcp-websocket-diagnostics-${timestamp}.txt`;
      
      const uri = await vscode.window.showSaveDialog({
        defaultUri: vscode.Uri.file(filename),
        filters: {
          'Text Files': ['txt'],
          'All Files': ['*']
        }
      });
      
      if (uri) {
        const encoder = new TextEncoder();
        const data = encoder.encode(diagnostics);
        await vscode.workspace.fs.writeFile(uri, data);
        
        vscode.window.showInformationMessage(`Diagnostics exported to: ${uri.fsPath}`);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to export diagnostics: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 清理資源
   */
  dispose(): void {
    if (this.statusBarItem) {
      this.statusBarItem.dispose();
      this.statusBarItem = null;
    }
    
    if (this.outputChannel) {
      this.outputChannel.dispose();
    }
  }
}

/**
 * 健康檢查結果接口
 */
export interface HealthCheckResult {
  timestamp: string;
  duration: number;
  total: number;
  healthy: number;
  unhealthy: number;
  results: HealthCheckItem[];
  summary: {
    overall: 'healthy' | 'unhealthy' | 'warning';
    healthPercentage: number;
  };
}

/**
 * 健康檢查項目接口
 */
export interface HealthCheckItem {
  name: string;
  status: 'healthy' | 'unhealthy' | 'warning' | 'error';
  details: string;
  duration: number;
}
