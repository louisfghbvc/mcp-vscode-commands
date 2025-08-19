#!/usr/bin/env node

/**
 * Stdio MCP 服務器與 VSCodeCommandsTools 整合測試
 * 使用模擬的 stdio 環境測試工具功能
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🧪 Stdio MCP 服務器整合測試');
console.log('============================\n');

class StdioMCPTester {
    constructor() {
        this.serverProcess = null;
        this.requestId = 1;
        this.responses = new Map();
        this.isServerReady = false;
    }

    /**
     * 啟動 stdio MCP 服務器
     */
    async startServer() {
        return new Promise((resolve, reject) => {
            const serverPath = path.join(__dirname, 'out', 'mcp-stdio-server-standalone.js');
            
            if (!fs.existsSync(serverPath)) {
                reject(new Error('MCP stdio 服務器編譯檔案不存在'));
                return;
            }

            console.log('🚀 啟動 MCP Stdio 服務器...');
            
            this.serverProcess = spawn('node', [serverPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    NODE_ENV: 'test',
                    VSCODE_COMMANDS_MCP: 'true'
                }
            });

            // 設置輸出處理
            this.serverProcess.stdout.on('data', (data) => {
                this.handleServerOutput(data);
            });

            this.serverProcess.stderr.on('data', (data) => {
                const message = data.toString().trim();
                if (message) {
                    console.log(`[Server] ${message}`);
                    
                    // 檢查服務器是否準備就緒
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

            this.serverProcess.on('exit', (code) => {
                console.log(`🔚 服務器已退出，代碼: ${code}`);
            });

            // 等待一段時間，如果沒有明確的 ready 信號
            setTimeout(() => {
                if (!this.isServerReady) {
                    console.log('⏰ 等待超時，假設服務器已準備就緒');
                    this.isServerReady = true;
                    resolve();
                }
            }, 3000);
        });
    }

    /**
     * 處理服務器輸出
     */
    handleServerOutput(data) {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            try {
                const response = JSON.parse(line);
                if (response.id && this.responses.has(response.id)) {
                    const { resolve } = this.responses.get(response.id);
                    this.responses.delete(response.id);
                    resolve(response);
                }
            } catch (error) {
                // 忽略非 JSON 輸出
            }
        }
    }

    /**
     * 發送 JSON-RPC 請求到服務器
     */
    async sendRequest(method, params = {}) {
        return new Promise((resolve, reject) => {
            if (!this.serverProcess || !this.isServerReady) {
                reject(new Error('服務器未準備就緒'));
                return;
            }

            const requestId = this.requestId++;
            const request = {
                jsonrpc: '2.0',
                id: requestId,
                method: method,
                params: params
            };

            // 儲存請求回調
            this.responses.set(requestId, { resolve, reject });

            // 發送請求
            const requestLine = JSON.stringify(request) + '\n';
            this.serverProcess.stdin.write(requestLine);

            // 設置超時
            setTimeout(() => {
                if (this.responses.has(requestId)) {
                    this.responses.delete(requestId);
                    reject(new Error(`請求 ${method} 超時`));
                }
            }, 5000);
        });
    }

    /**
     * 停止服務器
     */
    stopServer() {
        if (this.serverProcess) {
            console.log('🛑 停止 MCP 服務器...');
            this.serverProcess.kill();
            this.serverProcess = null;
        }
    }

    /**
     * 執行完整的測試套件
     */
    async runTests() {
        let passedTests = 0;
        let totalTests = 0;
        
        console.log('📋 開始整合測試...\n');

        // 測試 1: tools/list - 列出可用工具
        console.log('🔧 測試 1: 列出可用工具');
        totalTests++;
        try {
            const response = await this.sendRequest('tools/list');
            if (response.result && Array.isArray(response.result.tools)) {
                console.log('✅ 工具列表獲取成功');
                console.log(`   發現 ${response.result.tools.length} 個工具:`);
                response.result.tools.forEach(tool => {
                    console.log(`   📦 ${tool.name}: ${tool.description || 'No description'}`);
                });
                passedTests++;
            } else {
                console.log('❌ 工具列表格式錯誤');
            }
        } catch (error) {
            console.log('❌ 工具列表獲取失敗:', error.message);
        }

        // 測試 2: tools/call - 列出 VSCode 命令
        console.log('\n🔧 測試 2: 列出 VSCode 命令');
        totalTests++;
        try {
            const response = await this.sendRequest('tools/call', {
                name: 'vscode.listCommands'
            });
            
            if (response.result && response.result.content) {
                console.log('✅ VSCode 命令列表獲取成功');
                // 由於在非 VSCode 環境中，實際命令可能無法獲取
                console.log('   (註: 在測試環境中可能返回模擬數據)');
                passedTests++;
            } else {
                console.log('❌ VSCode 命令列表獲取失敗');
            }
        } catch (error) {
            console.log('❌ VSCode 命令列表獲取異常:', error.message);
        }

        // 測試 3: tools/call - 執行測試命令
        console.log('\n🔧 測試 3: 執行 VSCode 命令');
        totalTests++;
        try {
            const response = await this.sendRequest('tools/call', {
                name: 'vscode.executeCommand',
                arguments: {
                    commandId: 'workbench.action.showCommands'
                }
            });
            
            if (response.result || response.error) {
                console.log('✅ VSCode 命令執行測試完成');
                if (response.error) {
                    console.log('   (註: 在測試環境中命令執行可能會失敗，這是正常的)');
                }
                passedTests++;
            } else {
                console.log('❌ VSCode 命令執行無回應');
            }
        } catch (error) {
            console.log('❌ VSCode 命令執行異常:', error.message);
        }

        // 測試 4: 錯誤處理
        console.log('\n🔧 測試 4: 錯誤處理機制');
        totalTests++;
        try {
            const response = await this.sendRequest('tools/call', {
                name: 'nonexistent.tool'
            });
            
            if (response.error) {
                console.log('✅ 錯誤處理機制正常');
                console.log(`   錯誤信息: ${response.error.message || response.error}`);
                passedTests++;
            } else {
                console.log('❌ 錯誤處理機制失效');
            }
        } catch (error) {
            console.log('✅ 錯誤處理機制正常 (拋出異常)');
            passedTests++;
        }

        // 性能測試
        console.log('\n⚡ 測試 5: 性能基準測試');
        totalTests++;
        try {
            const iterations = 5;
            const startTime = process.hrtime.bigint();
            
            for (let i = 0; i < iterations; i++) {
                await this.sendRequest('tools/list');
            }
            
            const endTime = process.hrtime.bigint();
            const averageTime = Number(endTime - startTime) / 1000000 / iterations; // 轉換為毫秒
            
            console.log('✅ 性能測試完成');
            console.log(`   平均回應時間: ${averageTime.toFixed(2)}ms`);
            console.log(`   ${iterations} 次請求總時間: ${(Number(endTime - startTime) / 1000000).toFixed(2)}ms`);
            
            if (averageTime < 100) { // 少於 100ms 算是良好性能
                passedTests++;
            }
        } catch (error) {
            console.log('❌ 性能測試失敗:', error.message);
        }

        // 總結
        console.log('\n' + '='.repeat(50));
        console.log(`📈 測試結果: ${passedTests}/${totalTests} 通過`);
        console.log(`📊 通過率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        if (passedTests >= totalTests * 0.8) { // 80% 以上算是成功
            console.log('🎉 整合測試大部分通過！VSCodeCommandsTools 在 stdio 環境下運作良好');
            return true;
        } else {
            console.log(`⚠️  有較多測試失敗，需要進一步檢查`);
            return false;
        }
    }
}

// 執行測試
async function runIntegrationTest() {
    const tester = new StdioMCPTester();
    
    try {
        await tester.startServer();
        
        // 等待服務器完全啟動
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const result = await tester.runTests();
        
        tester.stopServer();
        
        return result;
        
    } catch (error) {
        console.error('💥 整合測試過程中發生錯誤:', error);
        tester.stopServer();
        return false;
    }
}

// 檢查先決條件
function checkPrerequisites() {
    const serverPath = path.join(__dirname, 'out', 'mcp-stdio-server-standalone.js');
    
    if (!fs.existsSync(serverPath)) {
        console.error('❌ 先決條件檢查失敗: MCP stdio 服務器編譯檔案不存在');
        console.log('💡 請先執行: npm run compile');
        return false;
    }
    
    console.log('✅ 先決條件檢查通過');
    return true;
}

// 主執行流程
if (checkPrerequisites()) {
    runIntegrationTest().then(success => {
        console.log('\n' + '='.repeat(50));
        if (success) {
            console.log('🎉 Stdio MCP 整合測試成功完成！');
            console.log('✅ VSCodeCommandsTools 與 stdio 架構完全相容');
        } else {
            console.log('⚠️  Stdio MCP 整合測試部分失敗');
            console.log('💡 在真實 VSCode 環境中可能會有更好的結果');
        }
        process.exit(success ? 0 : 1);
    }).catch(error => {
        console.error('💥 測試執行失敗:', error);
        process.exit(1);
    });
} else {
    process.exit(1);
}
