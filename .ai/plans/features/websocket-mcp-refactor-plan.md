# PRD: WebSocket MCP 架構重構計劃

## 1. Product overview

### 1.1 Document title and version

- PRD: WebSocket MCP 架構重構計劃
- Version: 1.0
- Created: 2025-01-27T00:00:00Z

### 1.2 Product summary

將現有的基於 TCP 橋接的 MCP 架構重構為使用 WebSocket 通信的現代化架構。新架構將 MCP server 作為獨立進程運行，通過 WebSocket 與 VS Code Extension 進行通信，提供更好的進程分離、錯誤隔離和擴展性。

新架構將實現：
- **Cursor** 透過 stdio 連線 MCP server
- **MCP server** 作為中間層，處理 stdio ↔ WebSocket 轉換
- **Extension** 作為 WebSocket client，執行 VSCode 命令並回傳結果

## 2. Goals

### 2.1 Business goals

- 提升系統穩定性和錯誤隔離能力
- 改善架構可維護性和擴展性
- 降低進程間通信的複雜度
- 為未來功能擴展提供更好的基礎

### 2.2 User goals

- 更穩定的 MCP 服務連接
- 更好的錯誤處理和恢復機制
- 更清晰的架構分離和調試能力
- 保持現有的零配置用戶體驗

### 2.3 Non-goals

- 不改變現有的 MCP 工具功能（executeCommand, listCommands）
- 不影響現有用戶的工作流程
- 不增加用戶配置的複雜度
- 不降低現有的性能表現

## 3. User personas

### 3.1 Key user types

- **Cursor 用戶**: 使用 AI agent 協助開發
- **開發者**: 需要穩定可靠的自動化工具
- **系統管理員**: 需要可維護和可擴展的架構

### 3.2 Basic persona details

- **AI 驅動開發者**: 透過 AI agent 自動化 VSCode 操作
- **架構師**: 關注系統設計和可維護性
- **DevOps 工程師**: 需要監控和故障排除能力

### 3.3 Role-based access

- **普通用戶**: 使用 MCP 功能，無需配置
- **開發者**: 可選的診斷和調試功能
- **管理員**: 服務器狀態監控和管理

## 4. Functional requirements

- **WebSocket MCP Server** (Priority: Critical)
  - 獨立進程運行，處理 stdio 輸入輸出
  - 建立 WebSocket server 監聽 Extension 連接
  - 實現 stdio ↔ WebSocket 消息轉換
  - 支援多個 Extension 同時連接

- **WebSocket Client Extension** (Priority: Critical)
  - 啟動 MCP server 進程（spawn）
  - 建立 WebSocket client 連接到 MCP server
  - 處理 MCP server 的 WebSocket 消息
  - 執行 VSCode 命令並回傳結果

- **通信協議** (Priority: High)
  - 定義 WebSocket 消息格式
  - 實現 JSON-RPC 2.0 協議
  - 支援雙向通信和心跳檢測
  - 錯誤處理和重連機制

- **進程管理** (Priority: High)
  - 自動啟動和停止 MCP server
  - 進程健康檢查和監控
  - 崩潰恢復和重啟機制
  - 資源清理和記憶體管理

- **配置和診斷** (Priority: Medium)
  - WebSocket 端口配置
  - 連接狀態監控
  - 性能指標收集
  - 調試日誌和錯誤報告

## 5. User experience

### 5.1 Entry points & first-time user flow

用戶安裝 extension 後：
1. Extension 自動啟動 MCP server 進程
2. Extension 建立 WebSocket 連接到 MCP server
3. MCP server 開始監聽 stdio 輸入
4. 工具立即在 Cursor AI 中可用，無需任何配置

### 5.2 Core experience

- **安裝**: 從 marketplace 安裝 extension
  - 自動啟動 MCP server 進程
  - 自動建立 WebSocket 連接
  - 無縫的服務啟動體驗
- **使用**: 在 Cursor AI 中無縫使用 VSCode 命令
  - 保持現有的快速響應
  - 更穩定的連接和錯誤處理
  - 透明的進程管理
- **管理**: 增強的服務器管理能力
  - 進程狀態監控
  - 自動錯誤恢復
  - 可選的手動控制

### 5.3 Advanced features & edge cases

- 支援多個 Extension 實例同時運行
- 智能進程重啟和故障轉移
- 性能瓶頸檢測和優化建議
- 網路配置和防火牆處理

### 5.4 UI/UX highlights

- 狀態指示器顯示連接狀態
- 診斷面板顯示詳細的系統信息
- 錯誤通知和恢復建議
- 性能指標可視化

## 6. Narrative

作為一個使用 Cursor AI 的開發者，我希望能夠穩定可靠地執行 VSCode 命令來自動化我的開發工作流程。新的 WebSocket 架構將提供更好的進程分離和錯誤處理，讓我在遇到問題時能夠快速恢復，同時保持零配置的簡單使用體驗。這種架構分離也為未來的功能擴展提供了堅實的基礎。

## 7. Success metrics

### 7.1 User-centric metrics

- 命令執行成功率 > 99.5%
- 連接穩定性（無中斷時間）> 99.9%
- 用戶滿意度評分 > 4.5/5.0
- 錯誤恢復時間 < 5 秒

### 7.2 Business metrics

- 系統可用性 > 99.9%
- 維護成本降低 20%
- 新功能開發速度提升 30%
- 用戶支持請求減少 50%

### 7.3 Technical metrics

- WebSocket 連接延遲 < 10ms
- 進程啟動時間 < 500ms
- 記憶體使用量 < 50MB
- CPU 使用率 < 5%

## 8. Technical considerations

### 8.1 Integration points

- **VS Code Extension API**: 執行命令和訪問工作區
- **Model Context Protocol**: 標準化的 AI 工具協議
- **Node.js 進程管理**: spawn, child_process 模組
- **WebSocket 通信**: ws 或 socket.io 庫

### 8.2 Data storage & privacy

- 不存儲用戶數據，所有通信都是臨時的
- 日誌數據僅用於調試和性能監控
- 符合 VS Code 擴展的隱私要求

### 8.3 Scalability & performance

- 支援多個並發連接
- 非阻塞的異步操作
- 智能的資源管理和清理
- 可配置的性能參數

### 8.4 Potential challenges

- WebSocket 連接的穩定性維護
- 進程間通信的錯誤處理
- 跨平台兼容性（Windows, macOS, Linux）
- 防火牆和網路配置問題

## 9. Milestones & sequencing

### 9.1 Project estimate

- **Medium**: 3-4 週

### 9.2 Team size & composition

- **Small Team**: 1-2 人（1 PM/Architect, 1 Eng）

### 9.3 Suggested phases

- **Phase 1**: 架構設計和原型 (1 週)
  - Key deliverables: 技術架構文檔、WebSocket 協議設計、原型實現
- **Phase 2**: 核心功能實現 (2 週)
  - Key deliverables: WebSocket MCP Server、Extension Client、通信協議
- **Phase 3**: 測試和優化 (1 週)
  - Key deliverables: 單元測試、整合測試、性能優化、文檔更新

## 10. User stories

### 10.1 自動啟動 MCP Server

- **ID**: US-001
- **Description**: As a user, I want the MCP server to start automatically when I install the extension so that I don't need to manually configure anything.
- **Acceptance Criteria**:
  - Extension 安裝後自動啟動 MCP server 進程
  - 自動建立 WebSocket 連接
  - 用戶無需任何配置即可使用

### 10.2 穩定連接維護

- **ID**: US-002
- **Description**: As a user, I want stable connections between Cursor and VS Code so that my AI-assisted development workflow is not interrupted.
- **Acceptance Criteria**:
  - WebSocket 連接保持穩定，無意外斷開
  - 自動重連機制在連接中斷時啟動
  - 連接狀態實時顯示給用戶

### 10.3 錯誤恢復和通知

- **ID**: US-003
- **Description**: As a user, I want to be notified of any issues and have them automatically resolved so that I can focus on development without troubleshooting.
- **Acceptance Criteria**:
  - 系統錯誤時自動嘗試恢復
  - 用戶收到清晰的錯誤通知和狀態更新
  - 恢復過程透明且快速

### 10.4 性能監控和診斷

- **ID**: US-004
- **Description**: As a developer, I want to monitor the performance and diagnose issues so that I can optimize the system and troubleshoot problems.
- **Acceptance Criteria**:
  - 提供詳細的性能指標和連接狀態
  - 診斷工具幫助識別問題根源
  - 可配置的日誌級別和監控選項

### 10.5 多實例支援

- **ID**: US-005
- **Description**: As a power user, I want to run multiple instances of the extension so that I can manage different projects independently.
- **Acceptance Criteria**:
  - 支援多個 Extension 實例同時運行
  - 每個實例有獨立的 MCP server 進程
  - 實例間不相互干擾

### 10.6 向後相容性

- **ID**: US-006
- **Description**: As an existing user, I want the new architecture to work with my current setup so that I don't lose any functionality during the transition.
- **Acceptance Criteria**:
  - 所有現有的 MCP 工具功能保持不變
  - 用戶配置和工作流程無需修改
  - 平滑的升級體驗，無數據丟失
