#!/usr/bin/env node

/**
 * MCP Client 啟動器
 * 
 * 用於啟動和管理 WebSocket MCP Client 進程
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

/**
 * MCP Client 啟動器類
 */
export class MCPClientLauncher {
  private process: ChildProcess | null = null;
  private clientScript: string;
  private websocketUrl: string;
  private env: Record<string, string>;
  private isRunning: boolean = false;
  private isShuttingDown: boolean = false;
  
  constructor(
    clientScript: string = 'dist/websocket/websocket-mcp-client.js',
    websocketUrl: string = 'ws://localhost:19847',
    env: Record<string, string> = {}
  ) {
    this.clientScript = clientScript;
    this.websocketUrl = websocketUrl;
    this.env = {
      ...process.env,
      WEBSOCKET_URL: websocketUrl,
      ...env
    };
  }
  
  /**
   * 啟動 MCP Client 進程
   */
  async start(): Promise<void> {
    try {
      if (this.isRunning) {
        console.log('[Launcher] MCP Client is already running');
        return;
      }
      
      // 檢查腳本文件是否存在
      if (!fs.existsSync(this.clientScript)) {
        throw new Error(`Client script not found: ${this.clientScript}`);
      }
      
      console.log(`[Launcher] Starting MCP Client: ${this.clientScript}`);
      console.log(`[Launcher] WebSocket URL: ${this.websocketUrl}`);
      
      // 啟動進程
      this.process = spawn('node', [this.clientScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: this.env,
        cwd: process.cwd()
      });
      
      // 設置進程事件處理
      this.setupProcessHandlers();
      
      // 等待進程啟動
      await this.waitForProcessStartup();
      
      this.isRunning = true;
      console.log('[Launcher] ✅ MCP Client started successfully');
      
    } catch (error) {
      console.error('[Launcher] Failed to start MCP Client:', error);
      throw error;
    }
  }
  
  /**
   * 停止 MCP Client 進程
   */
  async stop(): Promise<void> {
    try {
      if (!this.isRunning || !this.process) {
        console.log('[Launcher] MCP Client is not running');
        return;
      }
      
      console.log('[Launcher] Stopping MCP Client...');
      
      // 發送 SIGTERM 信號
      this.process.kill('SIGTERM');
      
      // 等待進程終止
      await this.waitForProcessTermination();
      
      this.isRunning = false;
      this.process = null;
      
      console.log('[Launcher] ✅ MCP Client stopped successfully');
      
    } catch (error) {
      console.error('[Launcher] Error stopping MCP Client:', error);
      
      // 強制終止進程
      if (this.process) {
        this.process.kill('SIGKILL');
        this.process = null;
      }
      
      this.isRunning = false;
    }
  }
  
  /**
   * 重啟 MCP Client 進程
   */
  async restart(): Promise<void> {
    console.log('[Launcher] Restarting MCP Client...');
    await this.stop();
    await this.sleep(1000); // 等待 1 秒
    await this.start();
  }
  
  /**
   * 設置進程事件處理器
   */
  private setupProcessHandlers(): void {
    if (!this.process) return;
    
    // 處理進程輸出
    this.process.stdout?.on('data', (data: Buffer) => {
      console.log(`[MCP Client] ${data.toString().trim()}`);
    });
    
    this.process.stderr?.on('data', (data: Buffer) => {
      console.error(`[MCP Client] ${data.toString().trim()}`);
    });
    
    // 處理進程退出
    this.process.on('exit', (code: number, signal: string) => {
      console.log(`[Launcher] MCP Client process exited: code ${code}, signal ${signal}`);
      this.isRunning = false;
      this.process = null;
      
      if (code !== 0 && !this.isShuttingDown) {
        console.log('[Launcher] Process exited with error, attempting restart...');
        this.restart();
      }
    });
    
    // 處理進程錯誤
    this.process.on('error', (error: Error) => {
      console.error('[Launcher] MCP Client process error:', error);
      this.isRunning = false;
      this.process = null;
    });
  }
  
  /**
   * 等待進程啟動
   */
  private async waitForProcessStartup(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('Process not started'));
        return;
      }
      
      // 檢查進程是否已經啟動
      if (this.process.pid) {
        resolve();
        return;
      }
      
      // 等待進程啟動
      const timeout = setTimeout(() => {
        reject(new Error('Process startup timeout'));
      }, 10000);
      
      this.process.once('spawn', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
  
  /**
   * 等待進程終止
   */
  private async waitForProcessTermination(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }
      
      const timeout = setTimeout(() => {
        resolve();
      }, 5000);
      
      this.process!.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
  
  /**
   * 檢查進程健康狀態
   */
  isHealthy(): boolean {
    return this.isRunning && this.process !== null && this.process.exitCode === null;
  }
  
  /**
   * 獲取進程狀態
   */
  getStatus(): {
    isRunning: boolean;
    pid: number | null;
    exitCode: number | null;
    signal: string | null;
  } {
    return {
      isRunning: this.isRunning,
      pid: this.process?.pid || null,
      exitCode: this.process?.exitCode || null,
      signal: this.process?.killed ? 'SIGTERM' : null
    };
  }
  
  /**
   * 發送信號到進程
   */
  sendSignal(signal: NodeJS.Signals): boolean {
    if (this.process && this.isRunning) {
      try {
        this.process.kill(signal);
        return true;
      } catch (error) {
        console.error(`[Launcher] Failed to send signal ${signal}:`, error);
        return false;
      }
    }
    return false;
  }
  
  /**
   * 工具函數：延遲
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * 清理資源
   */
  dispose(): void {
    this.stop();
  }
}

// 如果直接運行此文件，啟動啟動器
if (require.main === module) {
  const launcher = new MCPClientLauncher();
  
  // 處理命令行參數
  const args = process.argv.slice(2);
  const command = args[0];
  
  async function main() {
    try {
      switch (command) {
        case 'start':
          await launcher.start();
          console.log('[Launcher] MCP Client started. Press Ctrl+C to stop.');
          
          // 保持進程運行
          process.on('SIGINT', async () => {
            console.log('\n[Launcher] Received SIGINT, shutting down...');
            await launcher.stop();
            process.exit(0);
          });
          
          break;
          
        case 'stop':
          await launcher.stop();
          process.exit(0);
          break;
          
        case 'restart':
          await launcher.restart();
          process.exit(0);
          break;
          
        case 'status':
          const status = launcher.getStatus();
          console.log('[Launcher] Status:', status);
          process.exit(0);
          break;
          
        default:
          console.log('Usage: node mcp-client-launcher.js [start|stop|restart|status]');
          console.log('  start   - Start MCP Client');
          console.log('  stop    - Stop MCP Client');
          console.log('  restart - Restart MCP Client');
          console.log('  status  - Show MCP Client status');
          process.exit(1);
      }
    } catch (error) {
      console.error('[Launcher] Error:', error);
      process.exit(1);
    }
  }
  
  main();
}
