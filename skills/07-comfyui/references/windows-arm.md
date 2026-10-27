# Windows on ARM（RTX Spark）

`SKILL.md` 步驟 4 驗到 `devices[0].type` 是 `cpu`，或步驟 5 要在統一記憶體的機器上選版本時讀本檔。
2026-10-27 在 RTX Spark N1X（64GB 統一記憶體）實機驗證過連線與啟動；**生成速度與記憶體峰值尚未實測**。

## GPU 有沒有用上

- **先用 ComfyUI Desktop 的 ARM64 版**：`installations.json` 的 `variant` 是 `beta-win-nvidia-arm64`，自帶 Python 3.13 ARM64
  與 NVIDIA nightly 的 CUDA 版 PyTorch（實測 `2.15.0.dev…+cu134`），裝完 `devices[0].type` 直接是 `cuda`，**不必手動裝 PyTorch**。
  確認：`<installPath>\ComfyUI\.venv\Scripts\python.exe -c "import platform,torch;print(platform.machine(),torch.cuda.is_available())"` → `ARM64 True`。
- x64 版靠模擬執行時一定只有 CPU（模擬中的程式載不到 ARM64 的 NVIDIA 驅動）。
- 是 `cpu` 的話，GPU 版只剩手動安裝一條路，**先跟使用者說明這是開發者預覽、可能不穩，同意才做**：
  python.org 的 ARM64 Python 3.12（見下方〈智慧型應用程式控制〉）＋ NVIDIA 的 Windows on Arm 驅動與 CUDA 預覽版＋
  `--extra-index-url https://pypi.nvidia.com/nvtorch_oot_nightly` 裝 `torch torchvision torchaudio`（PyTorch 官方索引沒有 ARM64 的 CUDA 版）。
- 其他相依可能缺 ARM64 wheel，裝不起來就停下來回報，不要改裝 x64 版硬跑。

## 記憶體：看 nvidia-smi，不看 `vram_total`

- RTX Spark 的統一記憶體會**依設定切成系統 RAM 與 VRAM 兩塊**（實測 64GB 切成 32＋32）。
  可用顯存以 `nvidia-smi --query-gpu=memory.total --format=csv` 為準（實測 31232 MiB）。
- **`system-stats` 的 `vram_total` 會高估**：實測回報 46 GB，是 32GB 專用再加上 Windows 從系統 RAM 撥給 GPU 的共用記憶體。
  依它選版本會讓模型跑進共用區、和系統搶同一池。選版本時把可用量當成「nvidia-smi 的值減 6 GB」。
- 背景啟動（步驟 1）時加 `--reserve-vram 6 --disable-pinned-memory --disable-async-offload`
  （統一記憶體不需要釘選記憶體與非同步搬移，開著只會同一份資料佔兩次）。實測帶這三個參數 35 秒起來。

## 智慧型應用程式控制（Smart App Control）

- 開著時，uv 自己下載的 Python（python-build-standalone）裡**沒簽章的 `.pyd` 會被擋**，
  錯誤是 `DLL load failed while importing pyexpat: 應用程式控制原則已封鎖此檔案`；事件檢視器 CodeIntegrity/Operational 有 3077、3033。
  comfy-cli 本身能跑，但其他 uv 工具（如 `nlm`）一 import 就壞。
- 不必關閉它（關了就不能再開，除非重灌）：裝 python.org 有簽章的 ARM64 Python
  （`winget install --id Python.Python.3.13 -e --source winget --architecture arm64 --scope user`），
  `uv tool install` 加 `--python <該 python.exe>`；使用者同意時設使用者環境變數 `UV_PYTHON_PREFERENCE=system` 讓 uv 優先用它。
- ComfyUI Desktop 的 `.venv` 不受影響（實測正常啟動）。
