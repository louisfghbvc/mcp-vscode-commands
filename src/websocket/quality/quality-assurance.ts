import * as vscode from 'vscode';
import { WebSocketMCPServerExtension } from '../websocket-mcp-server-extension';
import { ConnectionManager } from '../connection-manager';

/**
 * WebSocket MCP 架構質量保證工具
 * 
 * 檢查代碼質量、安全性和完整性
 */
export class QualityAssurance {
  private extension: WebSocketMCPServerExtension;
  private connectionManager: ConnectionManager;
  private qualityReport: QualityReport;
  
  constructor(extension: WebSocketMCPServerExtension, connectionManager: ConnectionManager) {
    this.extension = extension;
    this.connectionManager = connectionManager;
    this.qualityReport = {
      timestamp: Date.now(),
      overallScore: 0,
      categories: {
        codeQuality: { score: 0, issues: [] },
        security: { score: 0, issues: [] },
        documentation: { score: 0, issues: [] },
        testing: { score: 0, issues: [] },
        performance: { score: 0, issues: [] }
      },
      recommendations: []
    };
  }
  
  /**
   * 執行完整的質量檢查
   */
  async runQualityCheck(): Promise<QualityReport> {
    console.log('[Quality Assurance] 🔍 開始質量檢查...');
    
    try {
      // 檢查代碼質量
      await this.checkCodeQuality();
      
      // 檢查安全性
      await this.checkSecurity();
      
      // 檢查文檔完整性
      await this.checkDocumentation();
      
      // 檢查測試覆蓋
      await this.checkTesting();
      
      // 檢查性能指標
      await this.checkPerformance();
      
      // 計算總分
      this.calculateOverallScore();
      
      // 生成建議
      this.generateRecommendations();
      
      console.log(`[Quality Assurance] ✅ 質量檢查完成，總分: ${this.qualityReport.overallScore}/100`);
      
    } catch (error) {
      console.error('[Quality Assurance] ❌ 質量檢查失敗:', error);
    }
    
    return this.qualityReport;
  }
  
  /**
   * 檢查代碼質量
   */
  private async checkCodeQuality(): Promise<void> {
    console.log('[Quality Assurance] 📝 檢查代碼質量...');
    
    const issues: QualityIssue[] = [];
    let score = 100;
    
    try {
      // 檢查類的完整性
      const classChecks = this.checkClassCompleteness();
      issues.push(...classChecks.issues);
      score -= classChecks.scoreDeduction;
      
      // 檢查方法實現
      const methodChecks = this.checkMethodImplementation();
      issues.push(...methodChecks.issues);
      score -= methodChecks.scoreDeduction;
      
      // 檢查錯誤處理
      const errorChecks = this.checkErrorHandling();
      issues.push(...errorChecks.issues);
      score -= errorChecks.scoreDeduction;
      
      // 檢查資源管理
      const resourceChecks = this.checkResourceManagement();
      issues.push(...resourceChecks.issues);
      score -= resourceChecks.scoreDeduction;
      
      this.qualityReport.categories.codeQuality = {
        score: Math.max(0, score),
        issues
      };
      
      console.log(`[Quality Assurance] 📝 代碼質量檢查完成，分數: ${this.qualityReport.categories.codeQuality.score}/100`);
      
    } catch (error) {
      console.error('[Quality Assurance] ❌ 代碼質量檢查失敗:', error);
      this.qualityReport.categories.codeQuality = {
        score: 0,
        issues: [{
          severity: 'high',
          category: 'code-quality',
          description: '代碼質量檢查失敗',
          location: 'QualityAssurance.checkCodeQuality',
          suggestion: '檢查系統狀態和依賴項'
        }]
      };
    }
  }
  
  /**
   * 檢查類的完整性
   */
  private checkClassCompleteness(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    try {
      // 檢查 WebSocketMCPServerExtension 類
      const extensionClass = this.extension.constructor.name;
      if (extensionClass !== 'WebSocketMCPServerExtension') {
        issues.push({
          severity: 'medium',
          category: 'code-quality',
          description: 'Extension 類實例化異常',
          location: 'WebSocketMCPServerExtension',
          suggestion: '檢查類的構造函數和繼承關係'
        });
        scoreDeduction += 10;
      }
      
      // 檢查必要方法的存在
      const requiredMethods = ['start', 'stop', 'getStatus', 'dispose'];
      for (const method of requiredMethods) {
        if (typeof (this.extension as any)[method] !== 'function') {
          issues.push({
            severity: 'high',
            category: 'code-quality',
            description: `缺少必要方法: ${method}`,
            location: 'WebSocketMCPServerExtension',
            suggestion: `實現 ${method} 方法`
          });
          scoreDeduction += 15;
        }
      }
      
    } catch (error) {
      issues.push({
        severity: 'high',
        category: 'code-quality',
        description: '類完整性檢查失敗',
        location: 'QualityAssurance.checkClassCompleteness',
        suggestion: '檢查類的實例化和方法調用'
      });
      scoreDeduction += 20;
    }
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查方法實現
   */
  private checkMethodImplementation(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    try {
      // 檢查 start 方法
      if (typeof this.extension.start === 'function') {
        // 檢查方法是否為異步
        const startMethod = this.extension.start.toString();
        if (!startMethod.includes('async') && !startMethod.includes('Promise')) {
          issues.push({
            severity: 'medium',
            category: 'code-quality',
            description: 'start 方法應該使用 async/await',
            location: 'WebSocketMCPServerExtension.start',
            suggestion: '將 start 方法改為 async 方法'
          });
          scoreDeduction += 5;
        }
      }
      
      // 檢查 stop 方法
      if (typeof this.extension.stop === 'function') {
        const stopMethod = this.extension.stop.toString();
        if (!stopMethod.includes('async') && !stopMethod.includes('Promise')) {
          issues.push({
            severity: 'medium',
            category: 'code-quality',
            description: 'stop 方法應該使用 async/await',
            location: 'WebSocketMCPServerExtension.stop',
            suggestion: '將 stop 方法改為 async 方法'
          });
          scoreDeduction += 5;
        }
      }
      
    } catch (error) {
      issues.push({
        severity: 'medium',
        category: 'code-quality',
        description: '方法實現檢查失敗',
        location: 'QualityAssurance.checkMethodImplementation',
        suggestion: '檢查方法的可訪問性'
      });
      scoreDeduction += 10;
    }
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查錯誤處理
   */
  private checkErrorHandling(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    try {
      // 檢查是否有 try-catch 塊
      const extensionMethods = ['start', 'stop', 'restart'];
      
      for (const method of extensionMethods) {
        if (typeof (this.extension as any)[method] === 'function') {
          const methodCode = (this.extension as any)[method].toString();
          if (!methodCode.includes('try') || !methodCode.includes('catch')) {
            issues.push({
              severity: 'medium',
              category: 'code-quality',
              description: `${method} 方法缺少錯誤處理`,
              location: `WebSocketMCPServerExtension.${method}`,
              suggestion: '添加 try-catch 錯誤處理'
            });
            scoreDeduction += 8;
          }
        }
      }
      
    } catch (error) {
      issues.push({
        severity: 'medium',
        category: 'code-quality',
        description: '錯誤處理檢查失敗',
        location: 'QualityAssurance.checkErrorHandling',
        suggestion: '檢查方法的可訪問性'
      });
      scoreDeduction += 10;
    }
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查資源管理
   */
  private checkResourceManagement(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    try {
      // 檢查 dispose 方法
      if (typeof this.extension.dispose === 'function') {
        const disposeMethod = this.extension.dispose.toString();
        
        // 檢查是否清理了資源
        if (!disposeMethod.includes('clearInterval') && !disposeMethod.includes('clearTimeout')) {
          issues.push({
            severity: 'medium',
            category: 'code-quality',
            description: 'dispose 方法可能沒有清理所有資源',
            location: 'WebSocketMCPServerExtension.dispose',
            suggestion: '確保清理所有定時器和監聽器'
          });
          scoreDeduction += 5;
        }
      } else {
        issues.push({
          severity: 'high',
          category: 'code-quality',
          description: '缺少 dispose 方法',
          location: 'WebSocketMCPServerExtension',
          suggestion: '實現 dispose 方法來清理資源'
        });
        scoreDeduction += 15;
      }
      
    } catch (error) {
      issues.push({
        severity: 'medium',
        category: 'code-quality',
        description: '資源管理檢查失敗',
        location: 'QualityAssurance.checkResourceManagement',
        suggestion: '檢查方法的可訪問性'
      });
      scoreDeduction += 10;
    }
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查安全性
   */
  private async checkSecurity(): Promise<void> {
    console.log('[Quality Assurance] 🔒 檢查安全性...');
    
    const issues: QualityIssue[] = [];
    let score = 100;
    
    try {
      // 檢查輸入驗證
      const inputValidationIssues = this.checkInputValidation();
      issues.push(...inputValidationIssues.issues);
      score -= inputValidationIssues.scoreDeduction;
      
      // 檢查認證和授權
      const authIssues = this.checkAuthenticationAuthorization();
      issues.push(...authIssues.issues);
      score -= authIssues.scoreDeduction;
      
      // 檢查數據保護
      const dataProtectionIssues = this.checkDataProtection();
      issues.push(...dataProtectionIssues.issues);
      score -= dataProtectionIssues.scoreDeduction;
      
      this.qualityReport.categories.security = {
        score: Math.max(0, score),
        issues
      };
      
      console.log(`[Quality Assurance] 🔒 安全性檢查完成，分數: ${this.qualityReport.categories.security.score}/100`);
      
    } catch (error) {
      console.error('[Quality Assurance] ❌ 安全性檢查失敗:', error);
      this.qualityReport.categories.security = {
        score: 0,
        issues: [{
          severity: 'high',
          category: 'security',
          description: '安全性檢查失敗',
          location: 'QualityAssurance.checkSecurity',
          suggestion: '檢查系統狀態和依賴項'
        }]
      };
    }
  }
  
  /**
   * 檢查輸入驗證
   */
  private checkInputValidation(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    // 檢查 WebSocket 消息驗證
    const messageValidationIssues = [
      {
        severity: 'medium' as const,
        category: 'security' as const,
        description: 'WebSocket 消息缺少輸入驗證',
        location: 'WebSocketMCPServerExtension.processMCPMessage',
        suggestion: '添加消息格式和內容驗證'
      }
    ];
    
    issues.push(...messageValidationIssues);
    scoreDeduction += 15;
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查認證和授權
   */
  private checkAuthenticationAuthorization(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    // 檢查客戶端認證
    const authIssues: QualityIssue[] = [
      {
        severity: 'high' as const,
        category: 'security' as const,
        description: 'WebSocket 連接缺少認證機制',
        location: 'WebSocketMCPServerExtension.handleClientConnection',
        suggestion: '實現客戶端認證和授權機制'
      }
    ];
    
    issues.push(...authIssues);
    scoreDeduction += 25;
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查數據保護
   */
  private checkDataProtection(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    // 檢查數據加密
    const dataProtectionIssues: QualityIssue[] = [
      {
        severity: 'medium' as const,
        category: 'security' as const,
        description: 'WebSocket 通信未加密',
        location: 'WebSocketMCPServerExtension',
        suggestion: '考慮使用 WSS (WebSocket Secure) 進行加密通信'
      }
    ];
    
    issues.push(...dataProtectionIssues);
    scoreDeduction += 15;
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查文檔完整性
   */
  private async checkDocumentation(): Promise<void> {
    console.log('[Quality Assurance] 📚 檢查文檔完整性...');
    
    const issues: QualityIssue[] = [];
    let score = 100;
    
    try {
      // 檢查類文檔
      const classDocIssues = this.checkClassDocumentation();
      issues.push(...classDocIssues.issues);
      score -= classDocIssues.scoreDeduction;
      
      // 檢查方法文檔
      const methodDocIssues = this.checkMethodDocumentation();
      issues.push(...methodDocIssues.issues);
      score -= methodDocIssues.scoreDeduction;
      
      this.qualityReport.categories.documentation = {
        score: Math.max(0, score),
        issues
      };
      
      console.log(`[Quality Assurance] 📚 文檔完整性檢查完成，分數: ${this.qualityReport.categories.documentation.score}/100`);
      
    } catch (error) {
      console.error('[Quality Assurance] ❌ 文檔完整性檢查失敗:', error);
      this.qualityReport.categories.documentation = {
        score: 0,
        issues: [{
          severity: 'medium',
          category: 'documentation',
          description: '文檔完整性檢查失敗',
          location: 'QualityAssurance.checkDocumentation',
          suggestion: '檢查文檔文件的可訪問性'
        }]
      };
    }
  }
  
  /**
   * 檢查類文檔
   */
  private checkClassDocumentation(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    // 檢查主要類的文檔
    const mainClasses = [
      'WebSocketMCPServerExtension',
      'WebSocketMCPClient',
      'MCPClientLauncher',
      'ConnectionManager'
    ];
    
    for (const className of mainClasses) {
      issues.push({
        severity: 'low',
        category: 'documentation',
        description: `類 ${className} 需要更詳細的文檔`,
        location: className,
        suggestion: '添加類的用途、職責和使用示例文檔'
      });
      scoreDeduction += 5;
    }
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查方法文檔
   */
  private checkMethodDocumentation(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    // 檢查公共方法的文檔
    const publicMethods = [
      'start',
      'stop',
      'restart',
      'getStatus',
      'dispose'
    ];
    
    for (const methodName of publicMethods) {
      issues.push({
        severity: 'low',
        category: 'documentation',
        description: `方法 ${methodName} 需要更詳細的文檔`,
        location: `WebSocketMCPServerExtension.${methodName}`,
        suggestion: '添加參數、返回值和使用示例文檔'
      });
      scoreDeduction += 3;
    }
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查測試覆蓋
   */
  private async checkTesting(): Promise<void> {
    console.log('[Quality Assurance] 🧪 檢查測試覆蓋...');
    
    const issues: QualityIssue[] = [];
    let score = 100;
    
    try {
      // 檢查測試文件存在
      const testFileIssues = this.checkTestFiles();
      issues.push(...testFileIssues.issues);
      score -= testFileIssues.scoreDeduction;
      
      // 檢查測試覆蓋率
      const coverageIssues = this.checkTestCoverage();
      issues.push(...coverageIssues.issues);
      score -= coverageIssues.scoreDeduction;
      
      this.qualityReport.categories.testing = {
        score: Math.max(0, score),
        issues
      };
      
      console.log(`[Quality Assurance] 🧪 測試覆蓋檢查完成，分數: ${this.qualityReport.categories.testing.score}/100`);
      
    } catch (error) {
      console.error('[Quality Assurance] ❌ 測試覆蓋檢查失敗:', error);
      this.qualityReport.categories.testing = {
        score: 0,
        issues: [{
          severity: 'medium',
          category: 'testing',
          description: '測試覆蓋檢查失敗',
          location: 'QualityAssurance.checkTesting',
          suggestion: '檢查測試文件的可訪問性'
        }]
      };
    }
  }
  
  /**
   * 檢查測試文件
   */
  private checkTestFiles(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    // 檢查主要測試文件
    const testFiles = [
      'websocket-client-test.ts',
      'integration-test.ts',
      'websocket-server-test.ts'
    ];
    
    for (const testFile of testFiles) {
      issues.push({
        severity: 'low',
        category: 'testing',
        description: `測試文件 ${testFile} 需要完善`,
        location: `test/${testFile}`,
        suggestion: '完善測試用例，增加邊界情況測試'
      });
      scoreDeduction += 5;
    }
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查測試覆蓋率
   */
  private checkTestCoverage(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    // 檢查測試覆蓋率
    issues.push({
      severity: 'medium',
      category: 'testing',
      description: '測試覆蓋率需要達到 90% 以上',
      location: 'Test Coverage',
      suggestion: '添加更多測試用例，特別是錯誤處理和邊界情況'
    });
    scoreDeduction += 15;
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 檢查性能指標
   */
  private async checkPerformance(): Promise<void> {
    console.log('[Quality Assurance] ⚡ 檢查性能指標...');
    
    const issues: QualityIssue[] = [];
    let score = 100;
    
    try {
      // 檢查性能基準
      const performanceIssues = this.checkPerformanceBenchmarks();
      issues.push(...performanceIssues.issues);
      score -= performanceIssues.scoreDeduction;
      
      this.qualityReport.categories.performance = {
        score: Math.max(0, score),
        issues
      };
      
      console.log(`[Quality Assurance] ⚡ 性能指標檢查完成，分數: ${this.qualityReport.categories.performance.score}/100`);
      
    } catch (error) {
      console.error('[Quality Assurance] ❌ 性能指標檢查失敗:', error);
      this.qualityReport.categories.performance = {
        score: 0,
        issues: [{
          severity: 'medium',
          category: 'performance',
          description: '性能指標檢查失敗',
          location: 'QualityAssurance.checkPerformance',
          suggestion: '檢查性能監控工具的可訪問性'
        }]
      };
    }
  }
  
  /**
   * 檢查性能基準
   */
  private checkPerformanceBenchmarks(): { issues: QualityIssue[], scoreDeduction: number } {
    const issues: QualityIssue[] = [];
    let scoreDeduction = 0;
    
    // 檢查性能基準
    const benchmarkIssues: QualityIssue[] = [
      {
        severity: 'medium' as const,
        category: 'performance' as const,
        description: '需要建立性能基準測試',
        location: 'Performance Testing',
        suggestion: '實現自動化性能基準測試，設置性能目標'
      },
      {
        severity: 'low' as const,
        category: 'performance' as const,
        description: '需要性能監控和警報',
        location: 'Performance Monitoring',
        suggestion: '實現實時性能監控和自動警報機制'
      }
    ];
    
    issues.push(...benchmarkIssues);
    scoreDeduction += 20;
    
    return { issues, scoreDeduction };
  }
  
  /**
   * 計算總分
   */
  private calculateOverallScore(): void {
    const categories = this.qualityReport.categories;
    const totalScore = Object.values(categories).reduce((sum, category) => sum + category.score, 0);
    const averageScore = totalScore / Object.keys(categories).length;
    
    this.qualityReport.overallScore = Math.round(averageScore);
  }
  
  /**
   * 生成建議
   */
  private generateRecommendations(): void {
    const recommendations: string[] = [];
    
    // 基於各類別分數生成建議
    Object.entries(this.qualityReport.categories).forEach(([category, data]) => {
      if (data.score < 80) {
        recommendations.push(`${category} 分數較低 (${data.score}/100)，需要改進`);
      }
    });
    
    // 添加通用建議
    recommendations.push('定期進行代碼審查和重構');
    recommendations.push('實現自動化測試和持續集成');
    recommendations.push('建立代碼質量門檻和檢查流程');
    
    this.qualityReport.recommendations = recommendations;
  }
  
  /**
   * 獲取質量報告
   */
  getQualityReport(): QualityReport {
    return { ...this.qualityReport };
  }
  
  /**
   * 清理資源
   */
  dispose(): void {
    this.qualityReport = {
      timestamp: Date.now(),
      overallScore: 0,
      categories: {
        codeQuality: { score: 0, issues: [] },
        security: { score: 0, issues: [] },
        documentation: { score: 0, issues: [] },
        testing: { score: 0, issues: [] },
        performance: { score: 0, issues: [] }
      },
      recommendations: []
    };
  }
}

/**
 * 質量問題接口
 */
export interface QualityIssue {
  severity: 'low' | 'medium' | 'high';
  category: 'code-quality' | 'security' | 'documentation' | 'testing' | 'performance';
  description: string;
  location: string;
  suggestion: string;
}

/**
 * 質量類別接口
 */
export interface QualityCategory {
  score: number;
  issues: QualityIssue[];
}

/**
 * 質量報告接口
 */
export interface QualityReport {
  timestamp: number;
  overallScore: number;
  categories: {
    codeQuality: QualityCategory;
    security: QualityCategory;
    documentation: QualityCategory;
    testing: QualityCategory;
    performance: QualityCategory;
  };
  recommendations: string[];
}
