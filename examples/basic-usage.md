# 🛠️ VSCode Commands MCP Tools 使用指南

## 📋 可用工具

### 1. `vscode.listCommands` - 列出命令

列出所有可用的 VSCode 命令，支持過濾。

**參數:**
- `filter` (可選): 過濾字串

**使用範例:**
```json
{
  "name": "vscode.listCommands",
  "arguments": {
    "filter": "editor"
  }
}
```

**回應範例:**
```
✅ 找到 156 個命令:
• editor.action.addCommentLine
• editor.action.blockComment
• editor.action.formatDocument
...
```

### 2. `vscode.executeCommand` - 執行命令

執行指定的 VSCode 命令，可包含參數。

**參數:**
- `commandId`: VSCode 命令 ID (必需)
- `args`: 命令參數數組 (可選)

**使用範例:**

#### 格式化當前文件
```json
{
  "name": "vscode.executeCommand", 
  "arguments": {
    "commandId": "editor.action.formatDocument"
  }
}
```

#### 開啟設定頁面
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "workbench.action.openSettings"
  }
}
```

#### 帶參數的命令
```json
{
  "name": "vscode.executeCommand",
  "arguments": {
    "commandId": "vscode.open",
    "args": ["file:///path/to/file.txt"]
  }
}
```

## 🚀 熱門命令範例

### 📝 編輯器操作
- `editor.action.formatDocument` - 格式化文件
- `editor.action.organizeImports` - 整理 imports
- `editor.action.commentLine` - 切換註解
- `editor.action.duplicateSelection` - 複製選擇內容
- `editor.action.selectAll` - 全選

### 💾 檔案操作
- `workbench.action.files.save` - 保存當前檔案
- `workbench.action.files.saveAll` - 保存所有檔案
- `workbench.action.files.newUntitledFile` - 新建檔案
- `workbench.action.closeActiveEditor` - 關閉當前編輯器

### 🔍 導航與搜尋
- `workbench.action.quickOpen` - 快速開啟檔案 (Ctrl+P)
- `workbench.action.showCommands` - 顯示命令面板 (Ctrl+Shift+P)
- `workbench.action.findInFiles` - 全域搜尋
- `workbench.action.gotoSymbol` - 跳到符號

### 🖥️ 工作區操作
- `workbench.action.toggleSidebarVisibility` - 切換側邊欄
- `workbench.action.togglePanel` - 切換面板
- `workbench.action.terminal.toggleTerminal` - 切換終端
- `workbench.action.terminal.new` - 新建終端

### 🎨 外觀設定
- `workbench.action.selectTheme` - 選擇主題
- `workbench.action.zoomIn` - 放大
- `workbench.action.zoomOut` - 縮小
- `workbench.action.zoomReset` - 重設縮放

## ⚠️ 錯誤處理

當命令執行失敗時，會返回錯誤訊息：

```json
{
  "content": [{
    "type": "text", 
    "text": "❌ 錯誤: 命令 'invalid.command' 不存在"
  }],
  "isError": true
}
```

## 💡 使用技巧

1. **探索命令**: 先用 `vscode.listCommands` 找到想要的命令
2. **過濾搜尋**: 使用 filter 參數縮小搜尋範圍
3. **查看文檔**: 在 [VSCode API 參考](https://code.visualstudio.com/api/references/commands) 查看官方命令列表
4. **測試安全**: 大部分命令都是安全的，不會造成數據損失
5. **組合使用**: 可以組合多個命令完成複雜操作

## 🚀 快速開始

在 Cursor 中嘗試這些對話：

```
請列出所有編輯器相關的命令
```

```
請幫我格式化當前文件
```

```
請執行 workbench.action.openSettings 命令開啟設定
```

```
請新建一個終端
```