---
name: setup-env
description: 建置 AI Agent 開發環境（Node.js LTS、uv、agent 本體與登入）。說「建置環境」「安裝開發環境」時載入。
---

# 環境建置

完整教學見 `guides/00-環境建置.md`。以下是執行流程。

**本 Skill 不處理 GitHub。** 不檢查 GitHub 帳號、不執行 `gh auth status`、不安裝 Git 或
GitHub CLI —— 那些全部由 `setup-github` Skill 負責。

## 步驟

1. **辨識作業系統**，後續命令依實際系統選擇。不可跨 PowerShell、CMD 與 Bash 混用。
2. **檢查現況**（逐一執行，避免一個失敗就看不到其餘結果）：
   `node --version`、`npm --version`、`uv --version`，加上 agent 本體檢查（見下）。
   Node.js 必須是**仍受官方支援的 LTS**，不要只用「主版本大於 18」判斷。
3. **只補裝缺少的項目**，安裝前先顯示命令並取得確認：
   - Node.js LTS — Windows：`winget install --id OpenJS.NodeJS.LTS --exact --accept-source-agreements --accept-package-agreements`；macOS：`brew install node`；Linux：依官方建議裝目前 LTS
   - uv — Windows：`powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`；macOS/Linux：`curl -LsSf https://astral.sh/uv/install.sh | sh`
   - **Windows on ARM**：winget 一律加 `--architecture arm64 --source winget`，裝完用 `node -p process.arch` 確認是 `arm64`
     （uv 的安裝腳本會自己選 `aarch64-pc-windows-msvc`）。
4. **驗收**：`node --version`、`uv --version` 正常，且 agent 本體能開啟並正常對話。

## Windows 上 uv 的兩個陷阱（裝完就檢查）

- **從 Claude 桌面版（MSIX）執行時，寫進 `%APPDATA%`／`%LOCALAPPDATA%` 的東西會被導向 `…\Packages\Claude_*\LocalCache\`**，
  其他 agent 看不到，uv 裝 Python 還會報 `Missing expected target directory for Python minor version link`。
  取得同意後設使用者環境變數 `UV_PYTHON_INSTALL_DIR=%USERPROFILE%\.local\share\uv\python`、
  `UV_TOOL_DIR=%USERPROFILE%\.local\share\uv\tools`。同理不要在 Claude 桌面版裡 `npm install -g`（會落在 `%APPDATA%\npm` 的導向副本）。
- **開著智慧型應用程式控制時**，uv 下載的 Python 沒簽章的 DLL 會被擋（`應用程式控制原則已封鎖此檔案`）。
  不要叫使用者關掉它：取得同意後用 winget 裝 python.org 的 Python（`Python.Python.3.13`，有簽章），
  設使用者環境變數 `UV_PYTHON_PREFERENCE=system`。確認方法：`Get-ItemProperty HKLM:\SYSTEM\CurrentControlSet\Control\CI\Policy`
  的 `VerifiedAndReputablePolicyState` 為 1 即開啟。

## 依 agent 的本體處理

- **Claude Code**：安裝與設定都可在桌面版 Code 分頁內完成，不需另開終端機。
- **Codex**：Desktop app 由官方下載頁安裝，Sign in with ChatGPT 或 API Key。
  Linux 無 Desktop app，改用 IDE 擴充或 `npm install -g @openai/codex`。
  缺少選用的 CLI（`codex --version`）不算失敗。
- **OpenCode**：`npm install -g opencode-ai`；`opencode auth list` 檢查供應商，
  未登入時請使用者**在互動式終端**執行 `opencode auth login`（代跑會卡住）。
  不要混用 winget / Scoop / Chocolatey / npm 多種來源。
- **Antigravity**：指 **Antigravity 2.0 桌面 App**（獨立 agent 應用，**不是 IDE**）。
  App 本體與登入由 App 自行處理，只需裝 Node.js 與 uv；設定檔在 `~/.gemini/config/`。

## 安全規則

- 每次安裝前先顯示命令並取得使用者確認；已安裝且版本正常的直接跳過。
- 不要一開始就重裝所有工具。
- 安裝後找不到指令時，先重開終端機或 agent 再檢查，不要立刻判定失敗。

## 復原

只針對失敗項目重跑檢查與安裝，不重裝已正常的工具。

## 回報

作業系統、agent 名稱與登入狀態、Node.js 版本（已有／已補裝）、uv 版本（已有／已補裝）、
模型供應商登入狀態（OpenCode）、跳過或失敗項目與原因、仍需使用者手動完成的項目。
