import * as vscode from 'vscode';
import { VSCodeCommandsMcpProvider } from './mcp-provider';

let mcpProvider: VSCodeCommandsMcpProvider | undefined;

/**
 * Extension 啟動函數
 * 
 * 此函數僅負責註冊 VS Code 原生 MCP Server Definition Provider
 * 移除了所有舊的 HTTP 服務器和手動配置管理代碼
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('[MCP Extension] 啟動 VS Code 原生 MCP 擴展...');
    
    try {
        // 創建並註冊 VS Code 原生 MCP Server Definition Provider
        mcpProvider = new VSCodeCommandsMcpProvider(context);
        const providerRegistration = vscode.lm.registerMcpServerDefinitionProvider(
            'vscodeCommandsProvider',
            mcpProvider
        );
        
        // 確保正確清理資源
        context.subscriptions.push(providerRegistration);
        context.subscriptions.push(mcpProvider);
        
        console.log('[MCP Extension] ✅ VS Code 原生 MCP Server Definition Provider 已註冊');
        console.log('[MCP Extension] 🎉 MCP 服務器將自動在 VS Code Extensions 視圖中可用');
        
        // 可選：顯示用戶通知
        const config = vscode.workspace.getConfiguration('mcpVscodeCommands');
        const showWelcome = config.get<boolean>('showWelcomeMessage', true);
        
        if (showWelcome) {
            vscode.window.showInformationMessage(
                '🎉 MCP VSCode Commands 已升級到原生模式！現在可在 Extensions 視圖中管理 MCP 服務器。',
                'Got it',
                'Don\'t show again'
            ).then(selection => {
                if (selection === 'Don\'t show again') {
                    config.update('showWelcomeMessage', false, true);
                }
            });
        }
        
    } catch (error) {
        console.error('[MCP Extension] ❌ 註冊 MCP Provider 失敗:', error);
        vscode.window.showErrorMessage(
            `MCP Provider 註冊失敗: ${error instanceof Error ? error.message : String(error)}`
        );
    }

    console.log('[MCP Extension] ✅ 擴展啟動完成');
}

/**
 * Extension 停用函數
 * 
 * 清理 MCP provider 資源
 */
export function deactivate() {
    console.log('[MCP Extension] 正在停用擴展...');
    
    if (mcpProvider) {
        mcpProvider.dispose();
        mcpProvider = undefined;
        console.log('[MCP Extension] ✅ MCP Provider 已清理');
    }
    
    console.log('[MCP Extension] ✅ 擴展已停用');
}