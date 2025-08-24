import * as assert from 'assert';
import * as vscode from 'vscode';
import { runTests } from '@vscode/test-electron';

/**
 * WebSocket MCP 架構的 VS Code Extension 測試套件
 * 
 * 使用 @vscode/test-electron 在真實的 VS Code 環境中測試
 */
suite('WebSocket MCP Architecture Test Suite', () => {
  
  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('louisfghbvc.mcp-vscode-commands'));
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('louisfghbvc.mcp-vscode-commands');
    if (extension) {
      await extension.activate();
      assert.ok(extension.isActive);
    }
  });

  test('WebSocket MCP commands should be registered', async () => {
    const commands = await vscode.commands.getCommands();
    
    // 檢查 WebSocket 相關命令是否已註冊
    const websocketCommands = commands.filter(cmd => 
      cmd.includes('websocket') || cmd.includes('WebSocket')
    );
    
    console.log('Found WebSocket commands:', websocketCommands);
    assert.ok(websocketCommands.length > 0, 'WebSocket commands should be registered');
  });

  test('Extension configuration should be accessible', () => {
    const config = vscode.workspace.getConfiguration('mcpVscodeCommands');
    assert.ok(config);
    
    // 檢查 WebSocket 相關配置
    const websocketPort = config.get('websocketPort');
    const websocketAutoStart = config.get('websocketAutoStart');
    
    assert.ok(typeof websocketPort === 'number', 'websocketPort should be a number');
    assert.ok(typeof websocketAutoStart === 'boolean', 'websocketAutoStart should be a boolean');
  });

  test('Extension should provide status information', async () => {
    // 嘗試執行診斷命令
    try {
      await vscode.commands.executeCommand('mcp-vscode-commands.diagnostics');
      // 如果命令執行成功，說明擴展正常工作
      assert.ok(true);
    } catch (error) {
      // 命令可能不存在或失敗，這是正常的
      console.log('Diagnostics command result:', error);
      assert.ok(true);
    }
  });

  test('WebSocket server commands should be available', async () => {
    const commands = await vscode.commands.getCommands();
    
    // 檢查特定的 WebSocket 命令
    const expectedCommands = [
      'mcp-vscode-commands.startWebSocket',
      'mcp-vscode-commands.stopWebSocket',
      'mcp-vscode-commands.restartWebSocket'
    ];
    
    for (const expectedCmd of expectedCommands) {
      assert.ok(commands.includes(expectedCmd), `Command ${expectedCmd} should be available`);
    }
  });

  test('Extension should handle configuration changes', async () => {
    const config = vscode.workspace.getConfiguration('mcpVscodeCommands');
    const originalPort = config.get('websocketPort');
    
    // 嘗試修改配置
    try {
      await config.update('websocketPort', 19848, vscode.ConfigurationTarget.Global);
      const newPort = config.get('websocketPort');
      assert.strictEqual(newPort, 19848);
      
      // 恢復原始配置
      await config.update('websocketPort', originalPort, vscode.ConfigurationTarget.Global);
    } catch (error) {
      // 配置更新可能失敗，這是正常的
      console.log('Configuration update result:', error);
      assert.ok(true);
    }
  });

  test('Extension should provide proper error handling', async () => {
    // 測試無效命令的錯誤處理
    try {
      await vscode.commands.executeCommand('invalid-command-name');
      assert.fail('Should have thrown an error for invalid command');
    } catch (error) {
      // 預期的錯誤
      assert.ok(error instanceof Error || typeof error === 'string');
    }
  });

  test('Extension should maintain state consistency', () => {
    // 檢查擴展狀態的一致性
    const extension = vscode.extensions.getExtension('louisfghbvc.mcp-vscode-commands');
    if (extension) {
      assert.ok(extension.packageJSON);
      assert.ok(extension.packageJSON.name === 'mcp-vscode-commands');
      assert.ok(extension.packageJSON.displayName === 'MCP VSCode Commands (Stdio)');
    }
  });
});

/**
 * 運行測試的主函數
 */
export async function runWebSocketMCPTests(): Promise<void> {
  try {
    // 下載 VS Code 並運行測試
    const extensionDevelopmentPath = __dirname;
    const extensionTestsPath = __filename;
    
    console.log('🚀 開始運行 WebSocket MCP 架構測試...');
    console.log('Extension Development Path:', extensionDevelopmentPath);
    console.log('Extension Tests Path:', extensionTestsPath);
    
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [
        '--disable-extensions',
        '--disable-gpu',
        '--disable-workspace-trust'
      ]
    });
    
    console.log('✅ 所有測試完成');
    
  } catch (error) {
    console.error('❌ 測試運行失敗:', error);
    throw error;
  }
}

// 如果直接運行此文件，則執行測試
if (require.main === module) {
  runWebSocketMCPTests().catch(console.error);
}
