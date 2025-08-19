import * as vscode from 'vscode';
import * as path from 'path';

/**
 * VS Code 原生 MCP Server Definition Provider
 * 實作 vscode.lm.registerMcpServerDefinitionProvider API
 */
export class VSCodeCommandsMcpProvider implements vscode.McpServerDefinitionProvider {
    private readonly didChangeEmitter = new vscode.EventEmitter<void>();
    public readonly onDidChangeMcpServerDefinitions = this.didChangeEmitter.event;

    constructor(private readonly context: vscode.ExtensionContext) {}

    /**
     * 提供 MCP 服務器定義
     */
    async provideMcpServerDefinitions(): Promise<vscode.McpServerDefinition[]> {
        const servers: vscode.McpServerDefinition[] = [];

        // 創建 stdio-based MCP server definition
        const serverDefinition = new vscode.McpStdioServerDefinition(
            'VSCode Commands', // label
            'node', // command
            [ // args
                path.join(this.context.extensionPath, 'out', 'mcp-stdio-server.js')
            ],
            { // env
                NODE_ENV: 'production',
                VSCODE_COMMANDS_MCP: 'true'
            },
            this.getExtensionVersion() // version
        );

        servers.push(serverDefinition);

        console.log('[MCP Provider] Providing server definitions:', servers.length);
        return servers;
    }

    /**
     * 解析 MCP 服務器定義 (啟動時調用)
     */
    async resolveMcpServerDefinition(
        server: vscode.McpServerDefinition
    ): Promise<vscode.McpServerDefinition | undefined> {
        console.log('[MCP Provider] Resolving server definition:', server.label);

        if (server.label === 'VSCode Commands') {
            // 檢查必要檔案是否存在
            const serverPath = path.join(this.context.extensionPath, 'out', 'mcp-stdio-server.js');
            
            try {
                // 確保編譯檔案存在
                await vscode.workspace.fs.stat(vscode.Uri.file(serverPath));
                console.log('[MCP Provider] Server file exists:', serverPath);
                
                return server;
            } catch (error) {
                console.error('[MCP Provider] Server file not found:', serverPath, error);
                
                // 顯示錯誤訊息給用戶
                vscode.window.showErrorMessage(
                    'MCP VSCode Commands: 服務器檔案不存在。請重新編譯擴展。',
                    'Compile Extension'
                ).then(selection => {
                    if (selection === 'Compile Extension') {
                        vscode.commands.executeCommand('workbench.action.tasks.runTask', 'tsc: compile');
                    }
                });
                
                return undefined;
            }
        }

        return server;
    }

    /**
     * 獲取擴展版本
     */
    private getExtensionVersion(): string {
        try {
            const packageJson = require(path.join(this.context.extensionPath, 'package.json'));
            return packageJson.version || '0.1.0';
        } catch (error) {
            console.warn('[MCP Provider] Could not read package.json:', error);
            return '0.1.0';
        }
    }

    /**
     * 觸發服務器定義變更事件
     */
    public refreshServers(): void {
        console.log('[MCP Provider] Refreshing server definitions');
        this.didChangeEmitter.fire();
    }

    /**
     * 清理資源
     */
    public dispose(): void {
        this.didChangeEmitter.dispose();
    }
}
