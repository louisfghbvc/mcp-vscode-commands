# 🚀 Cursor MCP 配置指南

## 方法一：獨立 MCP 服務器（推薦用於測試）

### 1. 安裝依賴
```bash
cd /home/scratch.louiliu_vlsi_1/sideProject/mcp-vscode-commands
npm install
```

### 2. 配置 Cursor

找到並編輯 Cursor 配置文件：

**macOS/Linux:**
```bash
~/.cursor/claude_desktop_config.json
```

**Windows:**
```bash
%APPDATA%\Cursor\claude_desktop_config.json
```

添加以下配置：

```json
{
  "mcpServers": {
    "vscode-commands": {
      "command": "node",
      "args": ["/home/scratch.louiliu_vlsi_1/sideProject/mcp-vscode-commands/mcp-server-standalone.js"]
    }
  }
}
```

### 3. 測試連接

重新啟動 Cursor，然後在對話中嘗試：

```
請列出可用的 VSCode 命令
```

或

```
請執行 editor.action.formatDocument 命令
```

---

## 方法二：VSCode 擴展 + MCP（完整功能）

### 1. 安裝 VSCode 擴展

```bash
code --install-extension /home/scratch.louiliu_vlsi_1/sideProject/mcp-vscode-commands/mcp-vscode-commands-0.1.0.vsix
```

### 2. 確保 VSCode 運行

- 開啟 VSCode
- 擴展會自動啟動 MCP 服務器

### 3. 配置 Cursor（進階）

如果您想要 Cursor 直接與 VSCode 擴展通信，需要更複雜的設置。

---

## 🧪 測試範例

配置完成後，您可以在 Cursor 中嘗試以下指令：

### 基本命令
- `"請執行 VSCode 的格式化文件命令"`
- `"列出所有包含 'editor' 的 VSCode 命令"`
- `"開啟 VSCode 設定頁面"`

### 進階用法
- `"執行 workbench.action.files.save 命令來儲存文件"`
- `"使用 workbench.action.terminal.new 開啟新終端"`

---

## 🔧 故障排除

### 1. 找不到配置文件
創建目錄和文件：
```bash
mkdir -p ~/.cursor
touch ~/.cursor/claude_desktop_config.json
```

### 2. 權限問題
確保腳本可執行：
```bash
chmod +x /home/scratch.louiliu_vlsi_1/sideProject/mcp-vscode-commands/mcp-server-standalone.js
```

### 3. 路徑問題
使用絕對路徑，並確保 Node.js 已安裝：
```bash
which node
npm --version
```

### 4. 檢查日誌
Cursor 的 MCP 日誌通常在開發者工具中可見。

---

## 📋 可用工具

### `vscode.executeCommand`
- **參數**: `commandId` (必需), `args` (可選)
- **範例**: 
  ```json
  {
    "name": "vscode.executeCommand",
    "arguments": {
      "commandId": "editor.action.formatDocument"
    }
  }
  ```

### `vscode.listCommands`
- **參數**: `filter` (可選)
- **範例**:
  ```json
  {
    "name": "vscode.listCommands", 
    "arguments": {
      "filter": "editor"
    }
  }
  ```

---

## ⚡ 快速開始

1. **複製配置**：
   ```bash
   cp /home/scratch.louiliu_vlsi_1/sideProject/mcp-vscode-commands/examples/cursor-config.json ~/.cursor/claude_desktop_config.json
   ```

2. **重啟 Cursor**

3. **測試**：
   在 Cursor 中輸入：`"請列出可用的 VSCode 命令"`

---

**注意**：獨立服務器版本目前只提供模擬功能。要獲得完整的 VSCode 命令執行能力，需要安裝並運行 VSCode 擴展。
