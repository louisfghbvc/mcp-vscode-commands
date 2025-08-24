#!/usr/bin/env node

/**
 * VS Code Extension 測試運行器
 * 
 * 使用 @vscode/test-electron 在真實的 VS Code 環境中運行測試
 */

const { runTests } = require('@vscode/test-electron');
const path = require('path');

async function main() {
  try {
    console.log('🧪 開始 VS Code Extension 測試...\n');
    
    // 擴展開發路徑（包含 package.json 的目錄）
    const extensionDevelopmentPath = path.resolve(__dirname);
    
    // 測試文件路徑
    const extensionTestsPath = path.resolve(__dirname, 'out/test/websocket-mcp-test.js');
    
    console.log('📁 Extension Development Path:', extensionDevelopmentPath);
    console.log('📁 Extension Tests Path:', extensionTestsPath);
    console.log('📦 Package.json:', path.join(extensionDevelopmentPath, 'package.json'));
    
    // 檢查文件是否存在
    const fs = require('fs');
    if (!fs.existsSync(path.join(extensionDevelopmentPath, 'package.json'))) {
      throw new Error('package.json not found in extension development path');
    }
    
    if (!fs.existsSync(extensionTestsPath)) {
      console.log('⚠️  測試文件不存在，先編譯項目...');
      
      // 編譯項目
      const { execSync } = require('child_process');
      execSync('npm run compile', { stdio: 'inherit' });
      
      if (!fs.existsSync(extensionTestsPath)) {
        throw new Error('測試文件編譯後仍不存在');
      }
    }
    
    console.log('\n🚀 啟動 VS Code 測試環境...');
    console.log('這可能需要幾分鐘時間來下載 VS Code...\n');
    
    // 運行測試
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        '--disable-extensions',
        '--disable-gpu',
        '--disable-workspace-trust',
        '--disable-telemetry',
        '--skip-welcome',
        '--skip-release-notes'
      ]
    });
    
    console.log('\n✅ 所有 VS Code Extension 測試完成！');
    
  } catch (error) {
    console.error('\n❌ VS Code Extension 測試失敗:', error);
    process.exit(1);
  }
}

// 運行測試
main();
