# 配置指南

## 概述

本文檔詳細介紹了 MCP VSCode Commands 擴展的配置選項、設置方法和最佳實踐。該擴展專注於 WebSocket 模式，提供輕量級、高效的 MCP 服務。

## 🔧 配置選項

### 基本配置

擴展提供以下配置選項，可以在 VS Code 設置中進行配置：

```json
{
  "mcpVscodeCommands.autoStart": true,
  "mcpVscodeCommands.logLevel": "info",
  "mcpVscodeCommands.websocketPort": 19847,
  "mcpVscodeCommands.websocketMaxConnections": 10,
  "mcpVscodeCommands.websocketConnectionTimeout": 30000
}
```

### 配置說明

#### 基本配置

| 配置項 | 類型 | 默認值 | 說明 |
|--------|------|--------|------|
| `autoStart` | boolean | `true` | 是否在擴展啟動時自動啟動 WebSocket MCP 服務器 |
| `logLevel` | string | `"info"` | 日誌等級，可選值：`"info"`, `"warn"`, `"error"`, `"debug"` |

#### WebSocket 配置

| 配置項 | 類型 | 默認值 | 說明 |
|--------|------|--------|------|
| `websocketPort` | number | `19847` | WebSocket 服務器監聽端口 |
| `websocketMaxConnections` | number | `10` | 最大同時連接數 |
| `websocketConnectionTimeout` | number | `30000` | 連接超時時間（毫秒） |

## ⚙️ 配置方法

### 方法 1: VS Code 設置界面

1. 打開 VS Code 設置 (`Ctrl/Cmd + ,`)
2. 搜索 `mcpVscodeCommands`
3. 找到相應的配置項並修改值

### 方法 2: 設置文件

直接編輯 `settings.json` 文件：

```json
{
  "mcpVscodeCommands.autoStart": true,
  "mcpVscodeCommands.websocketAutoStart": false,
  "mcpVscodeCommands.websocketPort": 19847
}
```

### 方法 3: 工作區配置

在項目根目錄創建 `.vscode/settings.json` 文件：

```json
{
  "mcpVscodeCommands.websocketAutoStart": true,
  "mcpVscodeCommands.websocketPort": 19848
}
```

### 方法 4: 命令行配置

使用 VS Code 命令面板配置：

1. 按 `Ctrl/Cmd + Shift + P` 打開命令面板
2. 輸入 `Preferences: Open Settings (JSON)`
3. 添加配置項

## 🚀 配置範例

### 基本使用配置

適合大多數用戶的基本配置：

```json
{
  "mcpVscodeCommands.autoStart": true,
  "mcpVscodeCommands.logLevel": "info"
}
```

### 開發者配置

適合開發和調試的配置：

```json
{
  "mcpVscodeCommands.autoStart": true,
  "mcpVscodeCommands.logLevel": "debug",
  "mcpVscodeCommands.enableDiagnostics": true,
  "mcpVscodeCommands.websocketAutoStart": true,
  "mcpVscodeCommands.websocketPort": 19847,
  "mcpVscodeCommands.websocketMaxConnections": 20
}
```

### 生產環境配置

適合生產環境的穩定配置：

```json
{
  "mcpVscodeCommands.autoStart": true,
  "mcpVscodeCommands.logLevel": "warn",
  "mcpVscodeCommands.enableDiagnostics": false,
  "mcpVscodeCommands.websocketAutoStart": true,
  "mcpVscodeCommands.websocketPort": 19847,
  "mcpVscodeCommands.websocketMaxConnections": 50,
  "mcpVscodeCommands.websocketConnectionTimeout": 60000
}
```

### 多實例配置

適合需要運行多個實例的配置：

```json
{
  "mcpVscodeCommands.autoStart": true,
  "mcpVscodeCommands.websocketAutoStart": true,
  "mcpVscodeCommands.websocketPort": 19847,
  "mcpVscodeCommands.websocketMaxConnections": 100
}
```

## 🔍 配置驗證

### 自動驗證

擴展會自動驗證配置值的有效性：

- 端口號必須在 1-65535 範圍內
- 最大連接數必須大於 0
- 超時時間必須大於 0
- 日誌等級必須是有效值

### 手動驗證

使用診斷命令檢查配置：

1. 按 `Ctrl/Cmd + Shift + P` 打開命令面板
2. 執行 `MCP: Diagnostics` 命令
3. 查看配置信息部分

### 配置錯誤處理

如果配置無效，擴展會：

1. 使用默認值
2. 在輸出面板顯示警告信息
3. 記錄錯誤到日誌

## 🔄 配置動態更新

### 實時更新

大部分配置項支持實時更新，無需重啟擴展：

- 日誌等級
- 診斷模式
- WebSocket 端口（需要重啟服務器）

### 需要重啟的配置

以下配置項修改後需要重啟相應的服務器：

- `websocketPort` - 需要重啟 WebSocket 服務器
- `websocketMaxConnections` - 需要重啟 WebSocket 服務器
- `websocketConnectionTimeout` - 需要重啟 WebSocket 服務器

### 重啟命令

使用以下命令重啟服務器：

- `mcp-vscode-commands.restart` - 重啟 Stdio 服務器
- `mcp-vscode-commands.restartWebSocket` - 重啟 WebSocket 服務器

## 🌍 環境變數配置

### 支持的環境變數

擴展支持通過環境變數進行配置：

```bash
# Stdio 模式配置
export MCP_AUTO_START=true
export MCP_LOG_LEVEL=debug

# WebSocket 模式配置
export MCP_WEBSOCKET_AUTO_START=true
export MCP_WEBSOCKET_PORT=19847
export MCP_WEBSOCKET_MAX_CONNECTIONS=20
export MCP_WEBSOCKET_CONNECTION_TIMEOUT=30000

# 診斷配置
export MCP_ENABLE_DIAGNOSTICS=true
```

### 環境變數優先級

配置優先級從高到低：

1. 工作區設置 (`.vscode/settings.json`)
2. 用戶設置 (`settings.json`)
3. 環境變數
4. 默認值

## 🔐 安全配置

### 端口安全

- 避免使用常見的系統端口 (80, 443, 22, 21 等)
- 建議使用 1024 以上的端口
- 考慮使用隨機端口分配

### 連接限制

- 設置合理的最大連接數
- 配置適當的連接超時時間
- 監控連接活動

### 日誌安全

- 生產環境避免使用 `debug` 日誌等級
- 定期清理日誌文件
- 避免記錄敏感信息

## 📊 配置監控

### 配置狀態檢查

使用診斷命令檢查當前配置：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "mcp-vscode-commands.diagnostics",
  "params": {
    "detailed": true
  }
}
```

### 配置變更通知

擴展會在以下情況顯示通知：

- 配置驗證失敗
- 服務器重啟完成
- 端口衝突解決

### 配置日誌

所有配置變更都會記錄到日誌：

- 配置加載
- 配置驗證
- 配置更新
- 配置錯誤

## 🚨 故障排除

### 常見配置問題

#### 端口被占用

**問題**: WebSocket 服務器啟動失敗，提示端口被占用

**解決方案**:
1. 檢查端口是否被其他程序占用
2. 修改 `websocketPort` 配置
3. 使用 `netstat -an | grep 19847` 檢查端口狀態

#### 配置無效

**問題**: 配置項顯示為無效值

**解決方案**:
1. 檢查配置值範圍
2. 查看輸出面板的錯誤信息
3. 使用診斷命令檢查配置狀態

#### 服務器無法啟動

**問題**: 自動啟動失敗

**解決方案**:
1. 檢查 `autoStart` 配置
2. 查看日誌中的錯誤信息
3. 手動執行啟動命令

### 配置恢復

如果配置出現問題，可以：

1. 重置為默認值
2. 刪除無效的配置項
3. 重新安裝擴展

## 📚 最佳實踐

### 配置管理

1. **版本控制**: 將工作區配置加入版本控制
2. **環境分離**: 為不同環境使用不同的配置
3. **配置備份**: 定期備份重要配置

### 性能優化

1. **連接池**: 根據需求調整最大連接數
2. **超時設置**: 設置合理的連接超時時間
3. **日誌等級**: 生產環境使用較高的日誌等級

### 安全考慮

1. **端口選擇**: 使用非標準端口
2. **訪問控制**: 限制網絡訪問
3. **監控**: 定期檢查連接活動

## 🔗 相關文檔

- [API 參考](./api-reference.md)
- [架構文檔](./architecture.md)
- [故障排除](./troubleshooting.md)
- [開發者指南](./developer-guide.md)
