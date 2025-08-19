# End-to-End Integration Testing Suite

## 概述 (Overview)

這個 E2E 測試套件為 Cursor MCP Extension 提供全面的整合測試，驗證 Cursor API + Stdio 架構的所有功能和性能指標。

This E2E test suite provides comprehensive integration testing for the Cursor MCP Extension, validating all functionality and performance metrics of the Cursor API + Stdio architecture.

## 測試架構 (Test Architecture)

### 核心組件 (Core Components)

1. **E2ETestSuite** (`e2e-test-suite.ts`)
   - 主測試套件類別，包含所有測試場景
   - Main test suite class containing all test scenarios

2. **MCPTestClient** (`test-runner.ts`)
   - MCP 客戶端，用於與實際的 stdio MCP 服務器通信
   - MCP client for communicating with the actual stdio MCP server

3. **PerformanceBenchmark** (`performance-benchmark.ts`)
   - 性能基準測試，驗證關鍵性能指標
   - Performance benchmarking to validate key performance metrics

4. **TestRunner** (`run-tests.ts`)
   - 命令行測試執行器，支援不同測試模式
   - Command-line test runner supporting different test modes

## 測試類別 (Test Categories)

### 1. 安裝和啟動測試 (Installation & Startup Tests)
- Extension 載入驗證
- MCP 服務器註冊檢查
- 啟動時間性能測試

### 2. MCP 工具功能測試 (MCP Tools Functionality Tests)
- `vscode.executeCommand` 工具測試
- `vscode.listCommands` 工具測試
- 錯誤處理和邊緣案例測試

### 3. Cursor AI 整合測試 (Cursor AI Integration Tests)
- 服務器在 Cursor 中的可見性測試
- AI 工具調用模擬測試
- AI 錯誤處理測試

### 4. 壓力和穩定性測試 (Stress & Stability Tests)
- 並發命令執行測試
- 長期穩定性測試
- 記憶體洩漏檢測

### 5. 性能驗證測試 (Performance Validation Tests)
- 命令延遲測試 (< 25ms)
- 啟動時間測試 (< 1.5s)
- 記憶體使用測試 (< 100MB)
- 吞吐量測試 (> 10 commands/sec)

## 使用方法 (Usage)

### 命令行執行 (Command Line Execution)

```bash
# 執行所有測試
npm run test:e2e

# 只執行功能測試
npm run test:e2e:functional

# 只執行性能測試
npm run test:e2e:performance

# 執行快速測試
npm run test:e2e:quick

# 執行性能基準測試
npm run benchmark
```

### 直接執行 (Direct Execution)

```bash
# 所有測試
npx tsx test/e2e/run-tests.ts

# 指定模式
npx tsx test/e2e/run-tests.ts --mode functional
npx tsx test/e2e/run-tests.ts --mode performance
npx tsx test/e2e/run-tests.ts --mode quick

# 自定義輸出
npx tsx test/e2e/run-tests.ts --output json
npx tsx test/e2e/run-tests.ts --no-save
```

### 說明選項 (Help Options)

```bash
npx tsx test/e2e/run-tests.ts --help
```

## 性能目標 (Performance Targets)

| 指標 (Metric) | 目標 (Target) | 測試方法 (Test Method) |
|---------------|---------------|------------------------|
| 命令延遲 (Command Latency) | < 25ms | 測量 MCP tool call 響應時間 |
| 啟動時間 (Startup Time) | < 1.5s | 測量 extension 啟動到服務可用 |
| 記憶體使用 (Memory Usage) | < 100MB | 監控峰值記憶體使用量 |
| 並發處理 (Concurrent Processing) | > 50 concurrent commands | 壓力測試並發命令執行 |
| 吞吐量 (Throughput) | > 10 commands/sec | 測量每秒命令執行數量 |

## 測試報告 (Test Reports)

### 輸出格式 (Output Formats)

1. **控制台輸出 (Console Output)**
   - 即時測試結果顯示
   - 性能指標摘要

2. **JSON 報告 (JSON Reports)**
   - 詳細的測試結果數據
   - 保存在 `reports/` 目錄

3. **性能報告 (Performance Reports)**
   - `performance-report.json` - 最新的性能數據
   - `reports/performance-report-{timestamp}.json` - 歷史記錄

### 報告內容 (Report Contents)

```json
{
  "timestamp": "2025-08-19T17:25:07Z",
  "environment": {
    "nodeVersion": "v18.x.x",
    "platform": "darwin",
    "arch": "arm64",
    "memory": 16.0,
    "cpus": 8
  },
  "results": [...],
  "summary": {
    "totalTests": 15,
    "passed": 15,
    "failed": 0,
    "overallScore": 100.0
  }
}
```

## CI/CD 整合 (CI/CD Integration)

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:e2e
```

### 本地開發 (Local Development)

```bash
# 安裝依賴
npm install

# 執行快速測試驗證
npm run test:e2e:quick

# 開發時執行完整測試
npm run test:e2e
```

## 測試配置 (Test Configuration)

### 環境要求 (Environment Requirements)

- Node.js >= 18.x
- VSCode >= 1.74.0
- TypeScript >= 4.9.4
- tsx >= 4.6.0

### 測試設定 (Test Settings)

```typescript
const testConfig = {
  vscodeVersion: '1.74.0',
  cursorVersion: 'latest',
  testTimeout: 30000,
  performanceThresholds: {
    commandLatency: 25,    // ms
    startupTime: 1500,     // ms
    memoryLimit: 100       // MB
  }
};
```

## 故障排除 (Troubleshooting)

### 常見問題 (Common Issues)

1. **MCP 服務器啟動失敗**
   ```bash
   # 檢查 TypeScript 編譯
   npm run compile
   
   # 檢查依賴
   npm install
   ```

2. **性能測試失敗**
   - 確保系統資源充足
   - 關閉其他佔用資源的應用程式
   - 檢查網路連接穩定性

3. **測試超時**
   - 增加測試超時時間
   - 檢查 MCP 服務器響應狀態
   - 驗證測試環境配置

### 調試模式 (Debug Mode)

```bash
# 啟用詳細日誌
DEBUG=1 npx tsx test/e2e/run-tests.ts

# 單獨運行特定測試
npx tsx test/e2e/performance-benchmark.ts
```

## 貢獻指南 (Contributing)

### 添加新測試 (Adding New Tests)

1. 在適當的測試套件中添加測試方法
2. 更新性能目標和基準
3. 確保測試可重複執行
4. 添加適當的錯誤處理

### 測試最佳實踐 (Testing Best Practices)

- 測試應該是獨立的和可重複的
- 使用適當的斷言和錯誤訊息
- 包含正面和負面測試場景
- 測量和驗證性能指標

## 版本歷史 (Version History)

- **v1.0.0** - 初始 E2E 測試套件實作
- 支援完整的功能和性能測試
- 包含詳細的報告和基準測試

## 支援 (Support)

如果您遇到問題或有建議，請通過以下方式聯繫：

- GitHub Issues: [mcp-vscode-commands/issues](https://github.com/louisfghbvc/mcp-vscode-commands/issues)
- Email: [維護者郵箱]

---

**注意**: 這個測試套件是 Task 8 的實作成果，提供了完整的端到端整合測試解決方案，確保 Cursor MCP Extension 的品質和性能符合預期標準。
