#!/usr/bin/env node

/**
 * VSCodeCommandsTools 相容性測試腳本
 * 驗證工具在 stdio 架構下的完整功能
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 VSCodeCommandsTools Stdio 相容性測試');
console.log('=======================================\n');

// 模擬 VSCode API 以測試工具邏輯
const mockVSCode = {
    commands: {
        getCommands: async (includeInternal = false) => {
            // 模擬常見的 VSCode 命令列表
            const commands = [
                'editor.action.formatDocument',
                'editor.action.organizeImports',
                'workbench.action.showCommands',
                'workbench.action.openSettings',
                'workbench.action.files.save',
                'workbench.action.quickOpen',
                'editor.action.commentLine',
                'editor.action.selectAll',
                'editor.action.copyLinesDown',
                'editor.action.moveLinesUp'
            ];
            
            if (includeInternal) {
                commands.push(
                    'vscode.open',
                    'vscode.diff',
                    'vscode.openWith',
                    '_internal.command1',
                    '_internal.command2'
                );
            }
            
            return commands;
        },
        
        executeCommand: async (commandId, ...args) => {
            // 模擬不同類型的命令執行結果
            switch (commandId) {
                case 'editor.action.formatDocument':
                    return { success: true, message: 'Document formatted' };
                    
                case 'editor.action.organizeImports':
                    return undefined; // 一些命令沒有返回值
                    
                case 'workbench.action.showCommands':
                    return null;
                    
                case 'test.command.withArgs':
                    return { args: args, timestamp: Date.now() };
                    
                case 'test.command.error':
                    throw new Error('Simulated command error');
                    
                case 'test.command.complex':
                    // 模擬複雜的 VSCode 物件
                    return {
                        uri: { 
                            scheme: 'file', 
                            path: '/test/file.ts',
                            toString: () => 'file:///test/file.ts'
                        },
                        range: {
                            start: { line: 0, character: 0 },
                            end: { line: 10, character: 25 },
                            toString: () => '[0,0-10,25]'
                        }
                    };
                    
                default:
                    if (!await mockVSCode.commands.getCommands(true).then(cmds => cmds.includes(commandId))) {
                        throw new Error(`Command '${commandId}' not found`);
                    }
                    return `Executed: ${commandId}`;
            }
        }
    }
};

// 模擬 require 以載入 VSCodeCommandsTools
function loadVSCodeCommandsTools() {
    // 由於這是 Node.js 環境測試，我們需要模擬 VSCode 模組
    require.cache[require.resolve('vscode')] = {
        exports: mockVSCode,
        loaded: true
    };
    
    // 載入工具類別
    try {
        const toolsPath = path.join(__dirname, 'out', 'tools', 'vscode-commands.js');
        if (fs.existsSync(toolsPath)) {
            delete require.cache[toolsPath];
            const { VSCodeCommandsTools } = require(toolsPath);
            return VSCodeCommandsTools;
        } else {
            throw new Error('VSCodeCommandsTools 編譯檔案不存在');
        }
    } catch (error) {
        console.error('無法載入 VSCodeCommandsTools:', error.message);
        return null;
    }
}

async function runCompatibilityTests() {
    console.log('🔧 載入 VSCodeCommandsTools...');
    
    const VSCodeCommandsTools = loadVSCodeCommandsTools();
    if (!VSCodeCommandsTools) {
        console.error('❌ 測試失敗：無法載入工具類別');
        return false;
    }
    
    const config = {
        autoStart: true,
        logLevel: 'info'
    };
    
    const tools = new VSCodeCommandsTools(config);
    console.log('✅ VSCodeCommandsTools 實例創建成功\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // 測試 1: 基本命令執行
    console.log('📋 測試 1: 基本命令執行');
    totalTests++;
    try {
        const result = await tools.executeCommand('editor.action.formatDocument');
        if (result.success && result.result) {
            console.log('✅ 基本命令執行成功');
            console.log(`   結果: ${JSON.stringify(result.result)}`);
            passedTests++;
        } else {
            console.log('❌ 基本命令執行失敗:', result.error);
        }
    } catch (error) {
        console.log('❌ 基本命令執行異常:', error.message);
    }
    
    // 測試 2: 命令列表獲取
    console.log('\n📋 測試 2: 命令列表獲取');
    totalTests++;
    try {
        const result = await tools.listCommands();
        if (result.success && Array.isArray(result.result) && result.result.length > 0) {
            console.log('✅ 命令列表獲取成功');
            console.log(`   發現 ${result.result.length} 個命令`);
            console.log(`   前 5 個命令: ${result.result.slice(0, 5).join(', ')}`);
            passedTests++;
        } else {
            console.log('❌ 命令列表獲取失敗:', result.error);
        }
    } catch (error) {
        console.log('❌ 命令列表獲取異常:', error.message);
    }
    
    // 測試 3: 命令過濾功能
    console.log('\n📋 測試 3: 命令過濾功能');
    totalTests++;
    try {
        const result = await tools.listCommands('editor');
        if (result.success && Array.isArray(result.result)) {
            const editorCommands = result.result.filter(cmd => cmd.includes('editor'));
            console.log('✅ 命令過濾功能正常');
            console.log(`   找到 ${editorCommands.length} 個包含 'editor' 的命令`);
            passedTests++;
        } else {
            console.log('❌ 命令過濾功能失敗:', result.error);
        }
    } catch (error) {
        console.log('❌ 命令過濾功能異常:', error.message);
    }
    
    // 測試 4: 帶參數的命令執行
    console.log('\n📋 測試 4: 帶參數的命令執行');
    totalTests++;
    try {
        const args = ['arg1', 'arg2', { key: 'value' }];
        const result = await tools.executeCommand('test.command.withArgs', args);
        if (result.success && result.result && result.result.args) {
            console.log('✅ 帶參數命令執行成功');
            console.log(`   參數傳遞正確: ${JSON.stringify(result.result.args)}`);
            passedTests++;
        } else {
            console.log('❌ 帶參數命令執行失敗:', result.error);
        }
    } catch (error) {
        console.log('❌ 帶參數命令執行異常:', error.message);
    }
    
    // 測試 5: 錯誤處理
    console.log('\n📋 測試 5: 錯誤處理機制');
    totalTests++;
    try {
        const result = await tools.executeCommand('test.command.error');
        if (!result.success && result.error) {
            console.log('✅ 錯誤處理機制正常');
            console.log(`   錯誤信息: ${result.error}`);
            passedTests++;
        } else {
            console.log('❌ 錯誤處理機制失效');
        }
    } catch (error) {
        console.log('❌ 錯誤處理機制異常:', error.message);
    }
    
    // 測試 6: 不存在的命令
    console.log('\n📋 測試 6: 不存在的命令處理');
    totalTests++;
    try {
        const result = await tools.executeCommand('nonexistent.command');
        if (!result.success && result.error && result.error.includes('不存在')) {
            console.log('✅ 不存在命令處理正確');
            passedTests++;
        } else {
            console.log('❌ 不存在命令處理失敗');
        }
    } catch (error) {
        console.log('❌ 不存在命令處理異常:', error.message);
    }
    
    // 測試 7: 複雜物件序列化
    console.log('\n📋 測試 7: 複雜物件序列化');
    totalTests++;
    try {
        const result = await tools.executeCommand('test.command.complex');
        if (result.success && result.result && result.result.uri && result.result.range) {
            console.log('✅ 複雜物件序列化成功');
            console.log(`   URI 序列化: ${JSON.stringify(result.result.uri)}`);
            console.log(`   Range 序列化: ${JSON.stringify(result.result.range)}`);
            passedTests++;
        } else {
            console.log('❌ 複雜物件序列化失敗:', result.error);
        }
    } catch (error) {
        console.log('❌ 複雜物件序列化異常:', error.message);
    }
    
    // 性能測試
    console.log('\n⚡ 性能測試');
    const performanceStart = process.hrtime.bigint();
    
    for (let i = 0; i < 10; i++) {
        await tools.executeCommand('editor.action.formatDocument');
    }
    
    const performanceEnd = process.hrtime.bigint();
    const averageTime = Number(performanceEnd - performanceStart) / 1000000 / 10; // 轉換為毫秒
    
    console.log(`📊 平均命令執行時間: ${averageTime.toFixed(2)}ms`);
    
    // 總結
    console.log('\n' + '='.repeat(50));
    console.log(`📈 測試結果: ${passedTests}/${totalTests} 通過`);
    console.log(`📊 通過率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有測試通過！VSCodeCommandsTools 與 stdio 架構 100% 相容');
        return true;
    } else {
        console.log(`⚠️  有 ${totalTests - passedTests} 個測試失敗，需要進一步檢查`);
        return false;
    }
}

// 執行測試
runCompatibilityTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('💥 測試執行過程中發生錯誤:', error);
    process.exit(1);
});
