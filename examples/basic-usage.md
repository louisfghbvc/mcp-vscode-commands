# MCP VSCode Commands - 基本使用範例

## 安裝和啟動

1. 安裝依賴：
```bash
npm install
```

2. 編譯 TypeScript：
```bash
npm run compile
```

3. 在 VSCode 中開啟此專案，按 F5 開啟擴展開發主機

4. 在新視窗中，擴展會自動啟動 MCP 服務器

## MCP 工具使用

### 1. 列出所有可用命令

**工具名稱**: `vscode.listCommands`

**參數**:
- `filter` (可選): 過濾字串

**範例**:
```json
{
  "name": "vscode.listCommands",
  "arguments": {
    "filter": "editor"
  }
}
```

**回應**:
```json
{
  "content": [{
    "type": "text",
    "text": "✅ 找到 156 個命令:\n• editor.action.addCommentLine\n• editor.action.addCursorsToLineEnds\n• editor.action.blockComment\n..."
  }]
}
```

### 2. 執行 VSCode 命令

**工具名稱**: `vscode.executeCommand`

**參數**:
- `commandId`: 要執行的命令 ID
- `args` (可選): 命令參數陣列

**範例 1 - 格式化文件**:
```json
{
  "name": "vscode.executeCommand", 
  "arguments": {
    "commandId": "editor.action.formatDocument"
  }
}
```

**範例 2 - 開啟設定**:
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "workbench.action.openSettings"
  }
}
```

**範例 3 - 執行帶參數的命令**:
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "vscode.open",
    "args": ["file:///path/to/file.txt"]
  }
}
```

## 常用命令範例

### 編輯器操作
- `editor.action.formatDocument` - 格式化當前文件
- `editor.action.organizeImports` - 整理 imports
- `editor.action.commentLine` - 註解/取消註解行
- `editor.action.duplicateSelection` - 複製選擇的內容

### 工作區操作
- `workbench.action.files.save` - 儲存當前文件
- `workbench.action.files.saveAll` - 儲存所有文件
- `workbench.action.closeActiveEditor` - 關閉當前編輯器
- `workbench.action.openSettings` - 開啟設定

### 導航操作
- `workbench.action.quickOpen` - 快速開啟檔案
- `workbench.action.showCommands` - 顯示命令面板
- `workbench.action.gotoSymbol` - 跳到符號

### 終端操作
- `workbench.action.terminal.new` - 開啟新終端
- `workbench.action.terminal.toggleTerminal` - 切換終端顯示

## 錯誤處理

如果命令執行失敗，會返回錯誤資訊：

```json
{
  "content": [{
    "type": "text", 
    "text": "❌ 錯誤: 命令 'invalid.command' 不存在"
  }],
  "isError": true
}
```

## 調試

查看 VSCode 開發者控制台（Developer Tools）以獲取詳細的日誌資訊。
