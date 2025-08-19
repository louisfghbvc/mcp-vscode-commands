import * as vscode from 'vscode';
import { VSCodeCommandsMcpProvider } from './mcp-provider';
import { MigrationUtils } from './migration-utils';

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
        
        // 註冊遷移相關命令
        registerMigrationCommands(context);

        // 檢查遷移需求 (延遲執行避免阻塞啟動)
        setTimeout(async () => {
            await checkMigrationNeeded();
        }, 2000);
        
    } catch (error) {
        console.error('[MCP Extension] ❌ 註冊 MCP Provider 失敗:', error);
        vscode.window.showErrorMessage(
            `MCP Provider 註冊失敗: ${error instanceof Error ? error.message : String(error)}`
        );
    }

    console.log('[MCP Extension] ✅ 擴展啟動完成');
}

/**
 * 註冊遷移相關命令
 */
function registerMigrationCommands(context: vscode.ExtensionContext): void {
    // 清理舊配置命令
    const cleanLegacyConfigCommand = vscode.commands.registerCommand(
        'mcp-vscode-commands.cleanLegacyConfig',
        async () => {
            const migrationInfo = await MigrationUtils.checkLegacyConfig();
            
            if (!migrationInfo.hasLegacyConfig) {
                vscode.window.showInformationMessage('✅ 無需清理，配置已是最新狀態。');
                return;
            }

            const confirmMessage = `即將清理舊的 MCP 配置:\n${migrationInfo.legacyEntries.join(', ')}\n\n這將創建備份文件，是否繼續？`;
            const choice = await vscode.window.showWarningMessage(
                confirmMessage,
                'Yes, Clean Up',
                'Cancel'
            );

            if (choice === 'Yes, Clean Up') {
                await MigrationUtils.performMigration();
            }
        }
    );

    // 顯示遷移狀態報告命令
    const showMigrationReportCommand = vscode.commands.registerCommand(
        'mcp-vscode-commands.showMigrationReport',
        async () => {
            const report = await MigrationUtils.getMigrationReport();
            vscode.window.showInformationMessage(report, { modal: true });
        }
    );

    context.subscriptions.push(cleanLegacyConfigCommand, showMigrationReportCommand);
}

/**
 * 檢查是否需要遷移
 */
async function checkMigrationNeeded(): Promise<void> {
    try {
        const config = vscode.workspace.getConfiguration('mcpVscodeCommands');
        const showMigrationNotifications = config.get<boolean>('showMigrationNotifications', true);
        
        if (!showMigrationNotifications) {
            return;
        }

        const migrationInfo = await MigrationUtils.checkLegacyConfig();
        
        if (migrationInfo.hasLegacyConfig) {
            console.log('[MCP Extension] Legacy config detected, showing migration notification');
            await MigrationUtils.showMigrationNotification(migrationInfo);
        }

    } catch (error) {
        console.warn('[MCP Extension] Migration check failed:', error);
    }
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