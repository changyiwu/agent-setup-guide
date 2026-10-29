# ACE-Step 1.5（音樂）

本檔隨 `comfyui` 安裝，由 `SKILL.md`〈模型筆記〉指向。完整說明見 `guides/07-連接-ComfyUI.md` 步驟九。

官方範本 `audio_ace_step_1_5_split`、`audio_ace_step_1_5_checkpoint`、`audio_ace_step1_5_xl_*` 都是**文字轉音樂**。
官方節點另有實驗性的 `ReferenceTimbreAudio`（顯示名 Set Reference Audio），可接一段參考音訊。

## 先判斷適不適合

- **用參考音訊做「保留原旋律」的 cover 能不能用，目前未確定**：實測四版聽起來旋律跑掉、不照歌詞唱（見下方），
  但只試了四版，且同一批測試的 YuE2 事後發現「旋律跑掉」可能只是後段錯位，這邊也還沒排除同樣的誤判。
- 保留旋律換曲風也可看 `models/yue2.md`（能不能逐音照譜同樣未確定，中文確定會被唱成粵語）；要求逐音照譜、唱國語且要穩定交件，目前改用歌聲合成軟體照 MIDI 唱。

## 檔案（`audio_ace_step_1_5_split`，都放得進 16GB）

| 資料夾 | 檔案 | 大小 |
|---|---|---|
| `diffusion_models` | `acestep_v1.5_turbo.safetensors` | 4.79 GB |
| `text_encoders` | `qwen_0.6b_ace15.safetensors` | 1.19 GB |
| `text_encoders` | `qwen_1.7b_ace15.safetensors` | 3.71 GB |
| `vae` | `ace_1.5_vae.safetensors` | 0.34 GB |

來源 Hugging Face `Comfy-Org/ace_step_1.5_ComfyUI_files`（會轉址到 `Comfy-Org/ACE-Step-1.5`）。這個 repo 的 HEAD 不一定帶 `X-Linked-ETag`，
SHA256 改從 `https://huggingface.co/api/models/Comfy-Org/ace_step_1.5_ComfyUI_files/tree/main/split_files/<資料夾>`（`curl -L`）的 `lfs.oid` 取。
XL 版另需 `acestep_v1.5_xl_turbo_bf16`（9.97 GB）與 `qwen_4b_ace15`（8.38 GB）。

## 欄位（`TextEncodeAceStepAudio1.5`）

- `tags`、`lyrics`、`seed`、`bpm`、`duration`（要與 `EmptyAceStep1.5LatentAudio` 的 `seconds` 一致）、`timesignature`（填 `"4"`，不是 `"4/4"`）、
  `language`（有 `zh`、`en`、`ja`…）、`keyscale`（例如 `C major`）
- `generate_audio_codes`：用 LM 先生成音訊語意碼，品質較好但較慢；**接參考音訊時官方說明要關掉**
- 純音樂把 `lyrics` 設為空字串；輸出 FLAC

## 參考音訊 cover 的實測（中文校歌、55 秒，結論：未確定）

- 接法：`LoadAudio` → `VAEEncodeAudio`（用 ACE 的 VAE）→ `ReferenceTimbreAudio` 的 `latent`，`conditioning` 接文字編碼，輸出接 KSampler 的 positive。
  官方程式碼在有參考音訊時會把它轉成 5Hz 語意提示當 cover 來源（`is_covers`），同時當音色參考。
- 試了從空白 latent 生成（兩個 seed）與從原曲 latent 部分重畫（denoise 0.85、0.7），`language=zh`：四版聽起來都**旋律跑掉、不照歌詞唱**。
  樣本只有四版、沒有逐段比對，是不是錯位造成的誤判還沒釐清，要下結論得再測。
- 速度：RTX 5060 Ti 16GB、ComfyUI 0.42.5，turbo 8 步，55 秒每版 2～4 秒（不含首次載入）。
