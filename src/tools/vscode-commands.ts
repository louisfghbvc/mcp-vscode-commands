import * as vscode from 'vscode';
import { CommandExecutionResult, MCPServerConfig } from '../types.js';

export class VSCodeCommandsTools {
    private config: MCPServerConfig;

    constructor(config: MCPServerConfig) {
        this.config = config;
    }

    /**
     * 執行 VSCode 命令
     */
    async executeCommand(commandId: string, args: any[] = []): Promise<CommandExecutionResult> {
        try {
            // 檢查命令是否存在
            const availableCommands = await vscode.commands.getCommands(true);
            if (!availableCommands.includes(commandId)) {
                return {
                    success: false,
                    error: `命令 '${commandId}' 不存在`
                };
            }

            // 執行命令
            const result = await vscode.commands.executeCommand(commandId, ...args);
            
            return {
                success: true,
                result: this.serializeResult(result)
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 列出所有可用的 VSCode 命令
     */
    async listCommands(filter?: string): Promise<CommandExecutionResult> {
        try {
            // 獲取所有命令（包括內建命令）
            const allCommands = await vscode.commands.getCommands(true);
            
            // 過濾命令（如果提供了過濾條件）
            let filteredCommands = allCommands;
            if (filter) {
                const filterLower = filter.toLowerCase();
                filteredCommands = allCommands.filter(cmd => 
                    cmd.toLowerCase().includes(filterLower)
                );
            }

            // 排序命令
            filteredCommands.sort();

            return {
                success: true,
                result: filteredCommands
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 序列化命令執行結果
     * 處理無法 JSON 序列化的對象
     */
    private serializeResult(result: any): any {
        // 處理 undefined
        if (result === undefined) {
            return null;
        }

        // 處理基本類型
        if (result === null || typeof result === 'string' || typeof result === 'number' || typeof result === 'boolean') {
            return result;
        }

        // 處理陣列
        if (Array.isArray(result)) {
            return result.map(item => this.serializeResult(item));
        }

        // 處理 VSCode 特殊對象
        if (result && typeof result === 'object') {
            // VSCode URI 對象
            if (result.scheme && result.path) {
                return {
                    type: 'vscode.Uri',
                    scheme: result.scheme,
                    authority: result.authority,
                    path: result.path,
                    query: result.query,
                    fragment: result.fragment,
                    toString: result.toString()
                };
            }

            // VSCode Range 對象
            if (result.start && result.end) {
                return {
                    type: 'vscode.Range',
                    start: this.serializeResult(result.start),
                    end: this.serializeResult(result.end),
                    toString: result.toString()
                };
            }

            // VSCode Position 對象
            if (typeof result.line === 'number' && typeof result.character === 'number') {
                return {
                    type: 'vscode.Position',
                    line: result.line,
                    character: result.character,
                    toString: result.toString()
                };
            }

            // 嘗試序列化一般對象
            try {
                const serialized: any = {};
                for (const [key, value] of Object.entries(result)) {
                    try {
                        serialized[key] = this.serializeResult(value);
                    } catch {
                        // 如果某個屬性無法序列化，跳過它
                        continue;
                    }
                }
                
                // 如果有構造函數名稱，添加類型資訊
                if (result.constructor && result.constructor.name !== 'Object') {
                    serialized._type = result.constructor.name;
                }

                return serialized;
            } catch {
                // 如果完全無法序列化，返回字符串表示
                return {
                    type: 'Unserializable',
                    toString: result.toString?.() || String(result),
                    constructor: result.constructor?.name || 'Unknown'
                };
            }
        }

        // 處理函數
        if (typeof result === 'function') {
            return {
                type: 'Function',
                name: result.name || 'anonymous',
                toString: result.toString()
            };
        }

        // 最後的備用方案
        return String(result);
    }
}
