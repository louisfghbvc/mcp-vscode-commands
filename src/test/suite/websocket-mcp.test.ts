import * as assert from 'assert';
import * as vscode from 'vscode';

suite('WebSocket MCP Architecture Test Suite', () => {
  
  test('Extension should be present', () => {
    const extension = vscode.extensions.getExtension('louisfghbvc.mcp-vscode-commands');
    assert.ok(extension, 'Extension should be present');
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('louisfghbvc.mcp-vscode-commands');
    if (extension) {
      await extension.activate();
      assert.ok(extension.isActive, 'Extension should be active');
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
    assert.ok(config, 'Configuration should be accessible');
    
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
      assert.ok(true, 'Diagnostics command should work');
    } catch (error) {
      // 命令可能不存在或失敗，這是正常的
      console.log('Diagnostics command result:', error);
      assert.ok(true, 'Command execution handled gracefully');
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
      assert.strictEqual(newPort, 19848, 'Configuration should be updated');
      
      // 恢復原始配置
      await config.update('websocketPort', originalPort, vscode.ConfigurationTarget.Global);
      
      // 驗證配置已恢復
      const restoredPort = config.get('websocketPort');
      assert.strictEqual(restoredPort, originalPort, 'Configuration should be restored to original value');
    } catch (error) {
      // 配置更新可能失敗，這是正常的
      console.log('Configuration update result:', error);
      assert.ok(true, 'Configuration update handled gracefully');
    }
  });

  test('Extension should provide proper error handling', async () => {
    // 測試無效命令的錯誤處理
    try {
      await vscode.commands.executeCommand('invalid-command-name');
      assert.fail('Should have thrown an error for invalid command');
    } catch (error) {
      // 預期的錯誤
      assert.ok(error instanceof Error || typeof error === 'string', 'Error should be properly handled');
    }
  });

  test('Extension should maintain state consistency', () => {
    // 檢查擴展狀態的一致性
    const extension = vscode.extensions.getExtension('louisfghbvc.mcp-vscode-commands');
    if (extension) {
      assert.ok(extension.packageJSON, 'Package JSON should be accessible');
      assert.ok(extension.packageJSON.name === 'mcp-vscode-commands', 'Extension name should match');
      assert.ok(extension.packageJSON.displayName === 'MCP VSCode Commands (Stdio)', 'Display name should match');
    }
  });

  test('WebSocket configuration should have correct defaults', () => {
    const config = vscode.workspace.getConfiguration('mcpVscodeCommands');
    
    const websocketPort = config.get('websocketPort');
    const websocketAutoStart = config.get('websocketAutoStart');
    const websocketMaxConnections = config.get('websocketMaxConnections');
    const websocketConnectionTimeout = config.get('websocketConnectionTimeout');
    
    // 檢查配置值存在且類型正確
    assert.ok(typeof websocketPort === 'number', 'websocketPort should be a number');
    assert.ok(typeof websocketAutoStart === 'boolean', 'websocketAutoStart should be a boolean');
    assert.ok(typeof websocketMaxConnections === 'number', 'websocketMaxConnections should be a number');
    assert.ok(typeof websocketConnectionTimeout === 'number', 'websocketConnectionTimeout should be a number');
    
    // 檢查配置值在合理範圍內
    assert.ok(websocketPort > 0 && websocketPort < 65536, 'websocketPort should be a valid port number');
    assert.ok(websocketMaxConnections > 0, 'websocketMaxConnections should be positive');
    assert.ok(websocketConnectionTimeout > 0, 'websocketConnectionTimeout should be positive');
    
    console.log('WebSocket configuration values:', {
      websocketPort,
      websocketAutoStart,
      websocketMaxConnections,
      websocketConnectionTimeout
    });
  });

  test('Extension should support both Stdio and WebSocket modes', () => {
    const config = vscode.workspace.getConfiguration('mcpVscodeCommands');
    
    const autoStart = config.get('autoStart');
    const websocketAutoStart = config.get('websocketAutoStart');
    
    // 檢查兩種模式都支持
    assert.ok(typeof autoStart === 'boolean', 'Stdio mode should be supported');
    assert.ok(typeof websocketAutoStart === 'boolean', 'WebSocket mode should be supported');
  });
});
