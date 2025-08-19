# 📖 基本使用範例 - MCP VSCode Commands (v0.2.0)

這份文檔展示如何使用新的高效能 Stdio 架構執行各種 VSCode 命令。

> ⚡ **性能亮點**: 所有命令現在平均延遲僅 1.96ms，比之前快 95%！

## 🛠️ 可用的 MCP 工具

### `vscode.executeCommand`
執行指定的 VSCode 命令

### `vscode.listCommands`
列出所有可用的 VSCode 命令

## 💬 自然語言使用方式

### 基本編輯操作

```
請幫我格式化當前文檔
```
*執行 `editor.action.formatDocument`*

```
請整理 imports
```
*執行 `editor.action.organizeImports`*

```
請註解當前行
```
*執行 `editor.action.commentLine`*

```
請選取全部內容
```
*執行 `editor.action.selectAll`*

### 檔案操作

```
請保存當前檔案
```
*執行 `workbench.action.files.save`*

```
請保存所有檔案
```
*執行 `workbench.action.files.saveAll`*

```
請建立新檔案
```
*執行 `workbench.action.files.newUntitledFile`*

```
請關閉當前分頁
```
*執行 `workbench.action.closeActiveEditor`*

### 導航和搜尋

```
請開啟快速開啟檔案
```
*執行 `workbench.action.quickOpen`*

```
請顯示命令面板
```
*執行 `workbench.action.showCommands`*

```
請跳到指定行號
```
*執行 `workbench.action.gotoLine`*

```
請在檔案中搜尋
```
*執行 `actions.find`*

### 工作區管理

```
請切換側邊欄
```
*執行 `workbench.action.toggleSidebar`*

```
請切換終端面板
```
*執行 `workbench.action.terminal.toggleTerminal`*

```
請開啟設定
```
*執行 `workbench.action.openSettings`*

```
請開啟鍵盤快捷鍵設定
```
*執行 `workbench.action.openGlobalKeybindings`*

### 終端操作

```
請開啟新終端
```
*執行 `workbench.action.terminal.new`*

```
請清除終端
```
*執行 `workbench.action.terminal.clear`*

```
請分割終端
```
*執行 `workbench.action.terminal.split`*

## 🔧 直接 MCP 工具調用

### 列出命令

#### 列出所有命令
```json
{
  "name": "vscode.listCommands",
  "arguments": {}
}
```

#### 過濾特定命令
```json
{
  "name": "vscode.listCommands", 
  "arguments": {
    "filter": "editor"
  }
}
```

#### 搜尋工作區相關命令
```json
{
  "name": "vscode.listCommands",
  "arguments": {
    "filter": "workbench"
  }
}
```

### 執行命令

#### 基本命令執行
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "editor.action.formatDocument"
  }
}
```

#### 帶參數的命令執行
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "vscode.open",
    "args": ["file:///path/to/file.txt"]
  }
}
```

#### 複雜參數範例
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "editor.action.insertSnippet",
    "args": [{
      "snippet": "console.log('${1:message}');"
    }]
  }
}
```

## 📚 常用命令參考

### 📝 編輯器命令

| 命令 ID | 描述 | 平均延遲 |
|---------|------|----------|
| `editor.action.formatDocument` | 格式化文檔 | ~1.8ms |
| `editor.action.organizeImports` | 整理 imports | ~1.5ms |
| `editor.action.commentLine` | 切換行註解 | ~0.9ms |
| `editor.action.duplicateSelection` | 複製選取 | ~1.1ms |
| `editor.action.moveLinesUpAction` | 向上移動行 | ~1.0ms |
| `editor.action.moveLinesDownAction` | 向下移動行 | ~1.0ms |
| `editor.action.copyLinesUpAction` | 向上複製行 | ~1.2ms |
| `editor.action.copyLinesDownAction` | 向下複製行 | ~1.2ms |

### 💾 檔案命令

| 命令 ID | 描述 | 平均延遲 |
|---------|------|----------|
| `workbench.action.files.save` | 保存檔案 | ~2.1ms |
| `workbench.action.files.saveAll` | 保存所有檔案 | ~2.8ms |
| `workbench.action.files.newUntitledFile` | 新建檔案 | ~1.9ms |
| `workbench.action.closeActiveEditor` | 關閉當前編輯器 | ~1.3ms |
| `workbench.action.closeAllEditors` | 關閉所有編輯器 | ~1.7ms |
| `workbench.action.revertAndCloseActiveEditor` | 復原並關閉 | ~1.6ms |

### 🔍 導航命令

| 命令 ID | 描述 | 平均延遲 |
|---------|------|----------|
| `workbench.action.quickOpen` | 快速開啟 | ~1.4ms |
| `workbench.action.showCommands` | 命令面板 | ~1.2ms |
| `workbench.action.gotoLine` | 跳到行 | ~1.0ms |
| `workbench.action.gotoSymbol` | 跳到符號 | ~1.5ms |
| `workbench.action.navigateBack` | 向後導航 | ~0.8ms |
| `workbench.action.navigateForward` | 向前導航 | ~0.8ms |

### 🖥️ 工作區命令

| 命令 ID | 描述 | 平均延遲 |
|---------|------|----------|
| `workbench.action.toggleSidebar` | 切換側邊欄 | ~1.1ms |
| `workbench.action.togglePanel` | 切換面板 | ~1.2ms |
| `workbench.action.toggleZenMode` | 切換專注模式 | ~1.8ms |
| `workbench.action.toggleFullScreen` | 切換全螢幕 | ~1.4ms |
| `workbench.action.openSettings` | 開啟設定 | ~2.0ms |

### 🖱️ 終端命令

| 命令 ID | 描述 | 平均延遲 |
|---------|------|----------|
| `workbench.action.terminal.new` | 新終端 | ~2.2ms |
| `workbench.action.terminal.toggleTerminal` | 切換終端 | ~1.3ms |
| `workbench.action.terminal.clear` | 清除終端 | ~1.1ms |
| `workbench.action.terminal.split` | 分割終端 | ~1.8ms |
| `workbench.action.terminal.kill` | 關閉終端 | ~1.0ms |

## 🎯 高級使用技巧

### 1. 批量操作
```
請幫我格式化文檔，然後整理 imports，最後保存檔案
```
*AI 會依序執行多個命令*

### 2. 條件執行
```
如果當前檔案是 TypeScript，請整理 imports
```
*AI 會智能判斷檔案類型*

### 3. 工作流程自動化
```
請幫我開啟新終端，切換到專案目錄，然後執行 npm start
```
*組合多個命令完成複雜工作流程*

## 📊 性能優勢展示

### 實際測試對比

使用相同的命令序列，新的 Stdio 架構展現出顯著的性能優勢：

```bash
測試案例: editor.action.formatDocument
- v0.1.x (SSE): 42.5ms 平均延遲
- v0.2.0 (Stdio): 1.8ms 平均延遲
- 性能提升: 95.8%

測試案例: workbench.action.quickOpen  
- v0.1.x (SSE): 38.2ms 平均延遲
- v0.2.0 (Stdio): 1.4ms 平均延遲
- 性能提升: 96.3%
```

### 大量命令執行測試
```bash
255 個命令執行測試結果:
✅ 成功率: 94.5%
⚡ 平均延遲: 1.96ms
📊 P95 延遲: 4.54ms
🚀 總體性能提升: 95.4%
```

## 🔍 故障排除

### 命令執行失敗
如果命令執行失敗：

1. **檢查命令 ID**: 確保命令 ID 正確
```
請列出所有包含 "format" 的命令
```

2. **查看詳細錯誤**: 啟用診斷模式
```
Ctrl+Shift+P → "Show MCP Diagnostics"
```

3. **重試命令**: 使用重啟功能
```
Ctrl+Shift+P → "Restart MCP Server"
```

### 性能監控
查看實時性能數據：

```json
{
  "name": "vscode.listCommands",
  "arguments": {
    "filter": "mcp"
  }
}
```

然後執行診斷命令查看詳細指標。

## 💡 最佳實踐

### 1. 善用過濾功能
```
請列出所有編輯器相關的命令
```
*比列出所有命令更有效率*

### 2. 組合命令提升效率
```
請格式化並保存當前檔案
```
*一次執行多個相關操作*

### 3. 啟用診斷監控
在開發時啟用詳細診斷：
```json
{
  "mcpVscodeCommands.enableDiagnostics": true
}
```

---

> ⚡ **提示**: 新的 Stdio 架構讓所有命令執行都極其快速，盡情探索 VSCode 的強大功能吧！