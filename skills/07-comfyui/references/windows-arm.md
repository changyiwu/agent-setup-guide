# Windows on ARM（RTX Spark 等，尚未實機驗證）

`SKILL.md` 步驟 4 驗到 `devices[0].type` 是 `cpu`，或步驟 5 要在統一記憶體的機器上選版本時讀本檔。

## GPU 有沒有用上

- 看步驟 4 的 `devices[0].type`，必須是 `cuda`。ComfyUI Desktop 有 arm64 安裝檔，但它裝的 PyTorch 在 ARM 上
  能不能走 CUDA 沒驗證過；x64 版靠模擬執行時一定只有 CPU（模擬中的程式載不到 ARM64 的 NVIDIA 驅動）。
- 是 `cpu` 的話，GPU 版只剩手動安裝一條路，**先跟使用者說明這是開發者預覽、可能不穩，同意才做**：
  原生 ARM64 的 Python 3.12（`uv python install cpython-3.12-windows-aarch64-none`）＋ NVIDIA 的 Windows on Arm 驅動與 CUDA 預覽版＋
  `--extra-index-url https://pypi.nvidia.com/nvtorch_oot_nightly` 裝 `torch torchvision torchaudio`（PyTorch 官方索引沒有 ARM64 的 CUDA 版）。
- 其他相依可能缺 ARM64 wheel，裝不起來就停下來回報，不要改裝 x64 版硬跑。

## 統一記憶體（RTX Spark）

- `vram_total` 回報的是 CPU 與 GPU 共用的整池，Windows 和其他程式也從這裡拿。
  選版本時把可用量當成「總量減 10 GB 左右」。
- 背景啟動（步驟 1）時加 `--reserve-vram 6 --disable-pinned-memory --disable-async-offload`
  （統一記憶體不需要釘選記憶體與非同步搬移，開著只會同一份資料佔兩次）。
