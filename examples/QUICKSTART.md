# 🚀 快速入門指南

## 5 分鐘設定 MCP VSCode Commands

### 📦 第一步：安裝擴展

```bash
# 1. 克隆專案
git clone https://github.com/louisfghbvc/mcp-vscode-commands.git
cd mcp-vscode-commands

# 2. 安裝與編譯
npm install
npm run compile

# 3. 打包擴展
npx vsce package

# 4. 安裝到 VSCode/Cursor
# 在 VSCode 中：Extensions -> Install from VSIX -> 選擇生成的 .vsix 檔案
```

### ⚡ 第二步：啟動服務

1. **開啟命令面板** (`Ctrl/Cmd + Shift + P`)
2. **執行命令** `Start MCP Server`
3. **看到成功訊息** 🎉

```
✅ MCP SSE 服務器已啟動在 http://127.0.0.1:3234/mcp/sse
✅ 已自動更新 Cursor MCP 配置
```

### 🎯 第三步：在 Cursor 中測試

1. **重新啟動 Cursor**
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

## ✅ 確認設定成功

### 方法 1：檢查 Cursor 配置
```bash
cat ~/.cursor/mcp.json
```

應該看到類似內容：
```json
{
  "servers": {
    "vscode-commands": {
      "url": "http://127.0.0.1:3234/mcp/sse",
      "transport": "sse"
    }
  }
}
```

### 方法 2：測試連線
```bash
node examples/test-sse-server.js
```

### 方法 3：查看擴展狀態
在 VSCode 中執行：`Show MCP Server Status`

## 🎉 完成！

現在你可以在 Cursor 中：
- 📝 **格式化程式碼**
- 💾 **儲存檔案**
- 🔍 **搜尋符號**
- 🖥️ **控制終端**
- ⚙️ **修改設定**
- 和更多 VSCode 功能！

## ❗ 遇到問題？

### Server 沒啟動
```bash
# 檢查 VSCode 開發者控制台
# 重新執行 "Start MCP Server"
```

### Cursor 連不上
```bash
# 確認配置檔案
cat ~/.cursor/mcp.json

# 重新啟動 Cursor
```

### 端口衝突
```bash
# 別擔心！擴展會自動找到可用端口
# 查看實際端口：執行 "Show MCP Server Status"
```

## 📚 下一步

- 📖 閱讀 [完整使用指南](./basic-usage.md)
- 🔧 查看 [進階設定選項](./README-MCP-Setup.md)
- 🧪 使用 [測試工具](./test-sse-server.js) 診斷問題

---

**5 分鐘就能讓 AI 控制你的 VSCode！** 🤖✨
