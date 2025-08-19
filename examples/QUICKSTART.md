# 🚀 快速入門指南 (v2.0)

## 30 秒設定 MCP VSCode Commands

> 🎉 **v2.0 零配置體驗**：安裝即用，無需任何手動配置！

## 📦 安裝方式

### 方法 1: VS Code Marketplace (推薦)

1. **開啟 Extensions 視圖** (`Ctrl/Cmd + Shift + X`)
2. **搜尋** "MCP VSCode Commands"
3. **點擊安裝** → **完成！** ✨

### 方法 2: 從原始碼

```bash
# 1. 克隆並編譯
git clone https://github.com/louisfghbvc/mcp-vscode-commands.git
cd mcp-vscode-commands
npm install && npm run compile

# 2. 打包安裝
npx vsce package
# 然後在 VS Code 中：Extensions → Install from VSIX
```

## ✅ 安裝完成！

**就這樣！** 沒有其他步驟了。MCP 服務器已經：
- 🎯 **自動註冊**到 VS Code
- 📊 **出現在 Extensions 視圖**中
- 🚀 **準備就緒**供 AI 使用

## 🎯 在 Cursor 中測試

1. **重新啟動 Cursor** (如果需要)
2. **開始對話並嘗試：**

```
請幫我格式化當前的程式碼
```

```
請列出所有跟編輯器相關的命令
```

```
請開啟 VSCode 設定頁面
```

```
請開啟新的終端
```

## 📊 管理 MCP 服務器

### 在 VS Code Extensions 視圖中：

1. **開啟 Extensions 視圖** (`Ctrl/Cmd + Shift + X`)
2. **找到 "VSCode Commands"** MCP 服務器
3. **右鍵管理**：
   - ▶️ **Start**: 啟動服務器
   - ⏸️ **Stop**: 停止服務器
   - 📊 **Show Output**: 查看日誌
   - ⚙️ **Configure Model Access**: 配置權限

## 🔄 從 v1.x 升級？

如果您之前使用過 SSE 版本：

### 自動遷移
- 📱 **遷移通知**: 擴展會自動檢測舊配置
- ✅ **一鍵清理**: 選擇自動清理選項
- 🧹 **備份安全**: 自動創建配置備份

### 手動清理
```
1. 命令面板 (Ctrl/Cmd + Shift + P)
2. 執行：MCP: Clean Legacy Config
3. 確認清理
```

## ✅ 確認設定成功

### 方法 1: Extensions 視圖檢查
- VS Code Extensions 視圖中應該看到 "VSCode Commands" MCP 服務器

### 方法 2: 遷移報告
```
命令面板 → MCP: Show Migration Report
```

### 方法 3: 直接測試
在 Cursor 中說：
```
請執行 editor.action.formatDocument 格式化文件
```

## 🎉 完成！

現在你可以在 Cursor 中：
- 📝 **格式化程式碼**
- 💾 **儲存檔案**
- 🔍 **搜尋符號**
- 🖥️ **控制終端**
- ⚙️ **修改設定**
- 和更多 VSCode 功能！

## ❗ 遇到問題？

### Extension 無法載入
```bash
# 檢查 VS Code 版本
# 需要 VS Code 1.85.0 或更新版本
```

### MCP 服務器未出現
```bash
# 重新啟動 VS Code/Cursor
# 檢查 Extensions 視圖的 MCP 區段
```

### AI 無法使用工具
```bash
# 在 Extensions 視圖中啟動 MCP 服務器
# 檢查模型存取權限配置
```

### 舊配置衝突
```bash
# 執行：MCP: Clean Legacy Config
# 檢查：MCP: Show Migration Report
```

## 🆕 v2.0 vs v1.x

| 功能 | v1.x (SSE) | v2.0 (原生) |
|------|------------|-------------|
| 配置 | 手動配置 mcp.json | 零配置 |
| 管理 | 命令面板控制 | Extensions 視圖 |
| 安全 | HTTP 服務器 | Stdio transport |
| 啟動 | 手動 Start/Stop | 自動管理 |
| 端口 | 端口衝突風險 | 無端口需求 |

## 📚 下一步

- 📖 閱讀 [完整使用指南](./basic-usage.md)
- 🔧 查看 [設定說明](./README-MCP-Setup.md)
- 🎯 探索 [使用範例](./README.md#使用場景)

---

**30 秒從安裝到使用！Zero Config，Maximum Power！** 🚀✨