# PRD: VS Code 原生 MCP 遷移計劃

## 1. Product overview

### 1.1 Document title and version

- PRD: VS Code 原生 MCP 遷移計劃
- Version: 1.0

### 1.2 Product summary

將現有的基於 SSE (Server-Sent Events) transport 的 MCP 實作遷移到 VS Code 原生的 MCP extension 架構。目前專案使用獨立的 HTTP 服務器提供 SSE 端點，需要轉換為使用 VS Code 的 MCP server definition provider API，以提供更好的整合體驗和更簡潔的配置管理。

新的實作將利用 VS Code 的內建 MCP 支援，消除對外部 HTTP 服務器的需求，並提供更好的調試和管理體驗。

## 2. Goals

### 2.1 Business goals

- 簡化用戶配置流程，消除手動配置 mcp.json 的需求
- 提供更好的 VS Code 整合體驗
- 利用 VS Code 原生 MCP 功能進行更好的調試和管理
- 減少資源消耗（無需獨立 HTTP 服務器）

### 2.2 User goals

- 更簡單的安裝和配置流程
- 在 VS Code Extensions 視圖中管理 MCP 服務器
- 更好的錯誤診斷和日誌查看
- 無縫的 VS Code agent mode 整合

### 2.3 Non-goals

- 不改變現有的 tool 功能（executeCommand, listCommands）
- 不移除對舊版本的支援（保持向後相容一段時間）
- 不改變 extension 的核心價值主張

## 3. User personas

### 3.1 Key user types

- VS Code 用戶使用 AI agent mode
- 開發者希望透過 AI 自動化 VS Code 操作
- 系統管理員配置團隊開發環境

### 3.2 Basic persona details

- **AI 驅動開發者**: 使用 AI agent 來協助程式開發和專案管理
- **自動化愛好者**: 希望透過 AI 自動化重複性的 VS Code 操作

### 3.3 Role-based access

- **終端用戶**: 安裝 extension 並在 agent mode 中使用工具
- **管理員**: 配置 model access 和 sampling permissions

## 4. Functional requirements

- **VS Code MCP Server Definition Provider** (Priority: critical)
  - 實作 `vscode.lm.registerMcpServerDefinitionProvider` API
  - 提供 stdio transport 配置
  - 支援動態服務器發現

- **內建 MCP Server** (Priority: critical)
  - 移除 HTTP/SSE transport 依賴
  - 實作標準輸入/輸出通信
  - 保持現有工具功能

- **Extension Configuration** (Priority: high)
  - 更新 package.json 以支援 MCP contribution points
  - 添加 mcpServerDefinitionProviders 配置
  - 移除舊的 HTTP 服務器命令

- **Migration Support** (Priority: medium)
  - 提供遷移指南
  - 偵測舊配置並提供清理選項

## 5. User experience

### 5.1 Entry points & first-time user flow

用戶安裝 extension 後，MCP 服務器會自動在 VS Code Extensions 視圖中註冊並可被管理。不再需要手動配置 mcp.json 文件。

### 5.2 Core experience

- **安裝**: 從 VS Code marketplace 安裝 extension
  - Extension 自動註冊 MCP server definition provider
- **配置**: 在 Extensions 視圖中管理 MCP 服務器
  - 查看服務器狀態、日誌和配置
- **使用**: 在 agent mode 中無縫使用 VSCode 命令工具
  - 工具自動在 tools picker 中可用

### 5.3 Advanced features & edge cases

- 支援 VS Code development mode 進行調試
- 處理 extension 升級時的配置遷移
- 錯誤處理和恢復機制

### 5.4 UI/UX highlights

- 使用 VS Code 原生的 MCP 管理界面
- 整合到 Extensions 視圖中
- 提供豐富的狀態指示和日誌查看

## 6. Narrative

開發者安裝 extension 後，可以立即在 VS Code 的 agent mode 中使用 VSCode 命令工具，無需任何額外配置。透過 Extensions 視圖，用戶可以輕鬆管理服務器狀態、查看日誌並配置 model access。整個體驗變得更加流暢和整合化。

## 7. Success metrics

### 7.1 User-centric metrics

- 配置步驟減少 80%（從手動編輯 mcp.json 到零配置）
- 用戶滿意度提升
- 減少配置相關的支援請求

### 7.2 Business metrics

- Extension 下載和活躍用戶增長
- 減少維護成本（移除 HTTP 服務器複雜性）

### 7.3 Technical metrics

- 記憶體使用量減少（無需 HTTP 服務器）
- 啟動時間改善
- 錯誤率降低

## 8. Technical considerations

### 8.1 Integration points

- VS Code MCP server definition provider API
- VS Code Extensions 視圖
- Agent mode tools picker
- Model access 配置系統

### 8.2 Data storage & privacy

- 移除對外部配置文件的依賴
- 使用 VS Code 內建的配置管理
- 無敏感資料處理

### 8.3 Scalability & performance

- 消除 HTTP 服務器開銷
- 使用更高效的 stdio transport
- 減少資源消耗

### 8.4 Potential challenges

- 學習新的 VS Code MCP API
- 確保向後相容性
- 處理 extension 升級時的配置遷移

## 9. Milestones & sequencing

### 9.1 Project estimate

- Medium: 3-5 週

### 9.2 Team size & composition

- Small Team: 1-2 人（1 PM, 1 Eng）

### 9.3 Suggested phases

- **Phase 1: 核心 MCP Provider 實作** (1-2 週)
  - Key deliverables: MCP server definition provider, stdio server 實作
- **Phase 2: Extension 整合和測試** (1-2 週)
  - Key deliverables: 更新 package.json, 整合測試, 文檔更新
- **Phase 3: 遷移支援和部署** (1 週)
  - Key deliverables: 遷移指南, 發佈準備

## 10. User stories

### 10.1 自動化 MCP 服務器註冊

- **ID**: US-001
- **Description**: 作為用戶，我希望安裝 extension 後 MCP 服務器能自動註冊，這樣我就不需要手動配置。
- **Acceptance Criteria**:
  - Extension 安裝後 MCP 服務器自動出現在 Extensions 視圖中
  - 無需編輯任何配置文件
  - 服務器在 agent mode 中立即可用

### 10.2 VS Code 原生管理介面

- **ID**: US-002
- **Description**: 作為用戶，我希望能在 VS Code Extensions 視圖中管理 MCP 服務器，這樣我就能輕鬆查看狀態和日誌。
- **Acceptance Criteria**:
  - 能在 Extensions 視圖中看到 MCP 服務器
  - 可以啟動/停止/重啟服務器
  - 能查看服務器日誌和配置

### 10.3 無縫工具整合

- **ID**: US-003
- **Description**: 作為開發者，我希望 VSCode 命令工具能在 agent mode 中無縫工作，這樣我就能專注於開發而不是配置。
- **Acceptance Criteria**:
  - 工具在 agent mode tools picker 中自動可用
  - executeCommand 和 listCommands 功能正常運作
  - 工具執行結果正確顯示

### 10.4 簡化配置遷移

- **ID**: US-004
- **Description**: 作為現有用戶，我希望能輕鬆從舊的 SSE 配置遷移到新的原生實作，這樣我就不會失去現有的設置。
- **Acceptance Criteria**:
  - 提供清晰的遷移指南
  - 偵測舊的 mcp.json 配置
  - 提供可選的清理工具
