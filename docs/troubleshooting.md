# 故障排除指南

## 概述

本文檔提供了 MCP VSCode Commands 擴展的常見問題解決方案和故障排除指南。該擴展專注於 WebSocket 模式，提供輕量級、高效的 MCP 服務。

## 🔍 診斷工具

### 使用診斷命令

擴展提供了強大的診斷工具來幫助排查問題：

1. 按 `Ctrl/Cmd + Shift + P` 打開命令面板
2. 執行 `MCP: Diagnostics` 命令
3. 查看詳細的系統狀態信息

### 診斷信息包含

- WebSocket 服務器運行狀態
- 連接統計信息
- 性能指標
- 錯誤日誌
- 配置信息
- 系統資源使用情況

## 🚨 常見問題

### 1. 擴展無法啟動

#### 問題描述
擴展安裝後無法正常啟動，或者啟動時出現錯誤。

#### 可能原因
- VS Code 版本不兼容
- 依賴項缺失
- 權限問題
- 配置錯誤

#### 解決方案

**步驟 1: 檢查 VS Code 版本**
- 確保 VS Code 版本 >= 1.74.0
- 檢查擴展兼容性

**步驟 2: 檢查輸出面板**
1. 按 `Ctrl/Cmd + Shift + U` 打開輸出面板
2. 選擇 "MCP VSCode Commands" 輸出
3. 查看錯誤信息

**步驟 3: 重新安裝擴展**
1. 卸載擴展
2. 重啟 VS Code
3. 重新安裝擴展

**步驟 4: 檢查權限**
- 確保有足夠的系統權限
- 檢查防火牆設置

### 2. WebSocket 服務器啟動失敗

#### 問題描述
WebSocket MCP 服務器無法啟動，提示端口被占用或其他錯誤。

#### 可能原因
- 端口被其他程序占用
- 防火牆阻止
- 權限不足
- 配置錯誤

#### 解決方案

**步驟 1: 檢查端口占用**
```bash
# macOS/Linux
lsof -i :19847

# Windows
netstat -an | findstr 19847
```

**步驟 2: 修改端口配置**
1. 打開 VS Code 設置
2. 搜索 `mcpVscodeCommands.websocketPort`
3. 修改為其他可用端口

**步驟 3: 檢查防火牆**
- 確保防火牆允許該端口
- 檢查網絡安全軟件設置

**步驟 4: 手動啟動服務器**
1. 執行 `mcp-vscode-commands.startWebSocket` 命令
2. 查看錯誤信息

### 3. 連接失敗

#### 問題描述
客戶端無法連接到 MCP 服務器，連接超時或拒絕。

#### 可能原因
- 服務器未運行
- 網絡配置問題
- 認證失敗
- 協議不匹配

#### 解決方案

**步驟 1: 檢查服務器狀態**
1. 執行診斷命令
2. 確認服務器正在運行
3. 檢查端口監聽狀態

**步驟 2: 測試連接**
```bash
# 使用 telnet 測試端口
telnet localhost 19847

# 使用 curl 測試 WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" http://localhost:19847/
```

**步驟 3: 檢查網絡配置**
- 確認 IP 地址和端口
- 檢查路由表
- 驗證 DNS 設置

### 4. 命令執行失敗

#### 問題描述
通過 MCP 執行的 VS Code 命令失敗，返回錯誤或無響應。

#### 可能原因
- 命令不存在
- 參數錯誤
- 權限不足
- VS Code 狀態問題

#### 解決方案

**步驟 1: 檢查命令可用性**
1. 執行 `vscode.listCommands` 查看可用命令
2. 確認命令名稱正確
3. 檢查命令參數

**步驟 2: 檢查 VS Code 狀態**
1. 確認 VS Code 正常工作
2. 檢查工作區狀態
3. 驗證文件權限

**步驟 3: 查看錯誤日誌**
1. 檢查輸出面板的錯誤信息
2. 查看瀏覽器控制台（如果適用）
3. 檢查系統日誌

### 5. 性能問題

#### 問題描述
擴展運行緩慢，響應延遲，或消耗過多資源。

#### 可能原因
- 連接數過多
- 記憶體洩漏
- CPU 使用率過高
- 網絡延遲

#### 解決方案

**步驟 1: 監控資源使用**
1. 使用診斷命令查看性能指標
2. 監控記憶體和 CPU 使用
3. 檢查連接數量

**步驟 2: 優化配置**
```json
{
  "mcpVscodeCommands.websocketMaxConnections": 10,
  "mcpVscodeCommands.websocketConnectionTimeout": 30000,
  "mcpVscodeCommands.logLevel": "warn"
}
```

**步驟 3: 限制連接**
- 減少最大連接數
- 設置合理的超時時間
- 實現連接池管理

### 6. 日誌問題

#### 問題描述
日誌信息不完整，無法查看錯誤詳情，或日誌文件過大。

#### 可能原因
- 日誌等級設置過高
- 日誌文件權限問題
- 磁盤空間不足
- 日誌輪轉配置錯誤

#### 解決方案

**步驟 1: 調整日誌等級**
```json
{
  "mcpVscodeCommands.logLevel": "debug",
  "mcpVscodeCommands.enableDiagnostics": true
}
```

**步驟 2: 檢查日誌文件**
- 確認日誌文件位置
- 檢查文件權限
- 驗證磁盤空間

**步驟 3: 配置日誌輪轉**
- 設置最大文件大小
- 配置保留天數
- 實現自動清理

## 🔧 高級故障排除

### 1. 網絡問題診斷

#### 檢查網絡連接
```bash
# 測試本地連接
ping localhost

# 測試端口連接
nc -zv localhost 19847

# 檢查路由
traceroute google.com
```

#### 檢查防火牆規則
```bash
# macOS
sudo pfctl -s rules

# Linux
sudo iptables -L

# Windows
netsh advfirewall show allprofiles
```

### 2. 系統資源診斷

#### 檢查系統資源
```bash
# 記憶體使用
free -h

# CPU 使用
top -p $(pgrep -f "mcp-vscode")

# 磁盤空間
df -h

# 進程狀態
ps aux | grep mcp
```

#### 性能分析
```bash
# 使用 perf 進行性能分析
sudo perf record -g -p $(pgrep -f "mcp-vscode")
sudo perf report

# 使用 strace 追蹤系統調用
strace -p $(pgrep -f "mcp-vscode")
```

### 3. 協議問題診斷

#### 檢查 JSON-RPC 消息
1. 啟用詳細日誌
2. 捕獲網絡流量
3. 分析消息格式

#### 驗證協議版本
- 確認使用 JSON-RPC 2.0
- 檢查消息 ID 格式
- 驗證錯誤代碼

## 📊 監控和預防

### 1. 健康檢查

#### 定期檢查
- 服務器狀態
- 連接數量
- 性能指標
- 錯誤率

#### 自動化監控
```bash
# 創建監控腳本
#!/bin/bash
curl -s http://localhost:19847/health | jq '.status'
```

### 2. 性能基準

#### 建立基準
- 正常響應時間
- 記憶體使用模式
- CPU 使用率
- 連接處理能力

#### 設置警報
- 響應時間超標
- 記憶體使用過高
- 錯誤率上升
- 連接數異常

### 3. 備份和恢復

#### 配置備份
- 定期備份配置文件
- 版本控制配置變更
- 記錄配置歷史

#### 災難恢復
- 制定恢復計劃
- 測試恢復流程
- 準備備用配置

## 🆘 獲取幫助

### 1. 自助診斷

#### 使用診斷工具
1. 執行 `MCP: Diagnostics` 命令
2. 收集錯誤日誌
3. 檢查配置狀態

#### 查看文檔
- [配置指南](./configuration.md)
- [API 參考](./api-reference.md)
- [架構文檔](./architecture.md)

### 2. 社區支持

#### 報告問題
- 提供詳細的問題描述
- 附上錯誤日誌
- 包含系統信息
- 描述重現步驟

#### 尋求幫助
- GitHub Issues
- 社區論壇
- 開發者文檔

### 3. 專業支持

#### 聯繫開發團隊
- 提交詳細的 bug 報告
- 提供性能問題描述
- 請求功能增強

## 📚 相關資源

### 官方文檔
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

### 工具和腳本
- [診斷腳本](./scripts/diagnostics.js)
- [性能監控工具](./tools/monitor.js)
- [配置驗證器](./tools/validator.js)

### 最佳實踐
- [配置管理](./configuration.md#最佳實踐)
- [安全考慮](./configuration.md#安全配置)
- [性能優化](./architecture.md#性能優化)
