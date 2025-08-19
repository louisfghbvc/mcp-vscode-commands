import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * 遷移支援工具
 * 
 * 幫助用戶從舊的 SSE-based MCP 配置遷移到新的 VS Code 原生 MCP
 */

export interface LegacyMCPConfig {
    mcpServers?: {
        'vscode-commands'?: {
            url?: string;
            transport?: string;
        };
    };
    servers?: {
        'vscode-commands'?: any;
    };
}

export interface MigrationInfo {
    hasLegacyConfig: boolean;
    configPath: string;
    legacyEntries: string[];
    isCleanupSafe: boolean;
}

export class MigrationUtils {
    private static readonly CONFIG_PATH = path.join(os.homedir(), '.cursor', 'mcp.json');

    /**
     * 檢查是否存在舊的 MCP 配置
     */
    static async checkLegacyConfig(): Promise<MigrationInfo> {
        const result: MigrationInfo = {
            hasLegacyConfig: false,
            configPath: this.CONFIG_PATH,
            legacyEntries: [],
            isCleanupSafe: true
        };

        try {
            if (!fs.existsSync(this.CONFIG_PATH)) {
                return result;
            }

            const content = await fs.promises.readFile(this.CONFIG_PATH, 'utf-8');
            const config: LegacyMCPConfig = JSON.parse(content);

            // 檢查 mcpServers.vscode-commands (新格式)
            if (config.mcpServers?.['vscode-commands']) {
                result.hasLegacyConfig = true;
                result.legacyEntries.push('mcpServers.vscode-commands');
            }

            // 檢查 servers.vscode-commands (舊格式)
            if (config.servers?.['vscode-commands']) {
                result.hasLegacyConfig = true;
                result.legacyEntries.push('servers.vscode-commands');
            }

            // 檢查是否安全清理 (其他服務器存在)
            const otherServers = Object.keys(config.mcpServers || {}).filter(key => key !== 'vscode-commands');
            const otherLegacyServers = Object.keys(config.servers || {}).filter(key => key !== 'vscode-commands');
            
            result.isCleanupSafe = otherServers.length > 0 || otherLegacyServers.length > 0;

        } catch (error) {
            console.warn('[Migration] Failed to check legacy config:', error);
        }

        return result;
    }

    /**
     * 清理舊的 MCP 配置
     */
    static async cleanupLegacyConfig(createBackup: boolean = true): Promise<boolean> {
        try {
            if (!fs.existsSync(this.CONFIG_PATH)) {
                return true; // 沒有配置文件，清理成功
            }

            const content = await fs.promises.readFile(this.CONFIG_PATH, 'utf-8');
            const config: LegacyMCPConfig = JSON.parse(content);

            // 創建備份
            if (createBackup) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const backupPath = `${this.CONFIG_PATH}.backup-${timestamp}`;
                await fs.promises.copyFile(this.CONFIG_PATH, backupPath);
                console.log('[Migration] Created backup:', backupPath);
            }

            // 移除 vscode-commands 配置
            let modified = false;

            if (config.mcpServers?.['vscode-commands']) {
                delete config.mcpServers['vscode-commands'];
                modified = true;

                // 如果 mcpServers 為空，移除整個對象
                if (Object.keys(config.mcpServers).length === 0) {
                    delete config.mcpServers;
                }
            }

            if (config.servers?.['vscode-commands']) {
                delete config.servers['vscode-commands'];
                modified = true;

                // 如果 servers 為空，移除整個對象
                if (Object.keys(config.servers).length === 0) {
                    delete config.servers;
                }
            }

            if (modified) {
                // 檢查是否整個配置文件為空
                if (Object.keys(config).length === 0) {
                    // 刪除空的配置文件
                    await fs.promises.unlink(this.CONFIG_PATH);
                    console.log('[Migration] Removed empty config file');
                } else {
                    // 寫回修改後的配置
                    await fs.promises.writeFile(
                        this.CONFIG_PATH, 
                        JSON.stringify(config, null, 2), 
                        'utf-8'
                    );
                    console.log('[Migration] Updated config file');
                }
            }

            return true;

        } catch (error) {
            console.error('[Migration] Failed to cleanup legacy config:', error);
            return false;
        }
    }

    /**
     * 顯示遷移通知
     */
    static async showMigrationNotification(migrationInfo: MigrationInfo): Promise<void> {
        if (!migrationInfo.hasLegacyConfig) {
            return;
        }

        const message = `🎉 MCP VSCode Commands 已升級到原生模式！\n\n檢測到舊的配置 (${migrationInfo.legacyEntries.join(', ')})，是否要清理？`;

        const options = ['清理配置', '手動處理', '不再提醒'];
        const choice = await vscode.window.showInformationMessage(message, ...options);

        switch (choice) {
            case '清理配置':
                await this.performMigration();
                break;
            case '不再提醒':
                await this.disableMigrationNotifications();
                break;
            case '手動處理':
            default:
                vscode.window.showInformationMessage(
                    `舊配置位於: ${migrationInfo.configPath}\n您可以稍後使用 "MCP: Clean Legacy Config" 命令進行清理。`
                );
                break;
        }
    }

    /**
     * 執行遷移
     */
    static async performMigration(): Promise<void> {
        try {
            const success = await this.cleanupLegacyConfig(true);
            
            if (success) {
                vscode.window.showInformationMessage(
                    '✅ 遷移完成！舊配置已清理，已創建備份文件。\n\n現在您可以在 VS Code Extensions 視圖中管理 MCP 服務器。'
                );
            } else {
                vscode.window.showErrorMessage(
                    '❌ 遷移失敗。請手動檢查配置文件或聯繫支援。'
                );
            }

        } catch (error) {
            console.error('[Migration] Migration failed:', error);
            vscode.window.showErrorMessage(
                `❌ 遷移過程中出現錯誤: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * 禁用遷移通知
     */
    static async disableMigrationNotifications(): Promise<void> {
        const config = vscode.workspace.getConfiguration('mcpVscodeCommands');
        await config.update('showMigrationNotifications', false, true);
        
        vscode.window.showInformationMessage(
            '📴 已禁用遷移通知。您可以稍後使用 "MCP: Clean Legacy Config" 命令進行手動清理。'
        );
    }

    /**
     * 獲取遷移狀態報告
     */
    static async getMigrationReport(): Promise<string> {
        const migrationInfo = await this.checkLegacyConfig();
        
        if (!migrationInfo.hasLegacyConfig) {
            return '✅ 無需遷移，配置已是最新狀態。';
        }

        const entries = migrationInfo.legacyEntries.join(', ');
        const backupStatus = migrationInfo.isCleanupSafe ? '✅ 安全' : '⚠️ 謹慎操作';
        
        return `🔍 遷移狀態報告:
        
📁 配置文件: ${migrationInfo.configPath}
🔧 發現舊配置: ${entries}
🛡️ 清理安全性: ${backupStatus}

💡 建議: 使用 "MCP: Clean Legacy Config" 命令進行自動清理。`;
    }
}
