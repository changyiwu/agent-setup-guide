# YuE2 Music Cover（保留旋律換曲風）

本檔隨 `comfyui` 安裝，由 `SKILL.md`〈模型筆記〉指向。完整說明見 `guides/07-連接-ComfyUI.md` 步驟九。

範本 `audio_yue2_music_cover`（ComfyUI 0.42.5 內建，**不用第三方節點**）：SheetSage2 先把參考錄音的旋律轉成 ABC 譜，
YuE2 再依「ABC 譜＋風格描述＋歌詞」重新演唱與編曲。同系列另有文字轉音樂的 `audio_yue2_text2music`。

## 先判斷適不適合

- **適合**：把一首歌換曲風重新詮釋，旋律「聽得出是原曲」即可。
- **能不能逐音照譜、照詞唱，目前未確定**：前段照得不錯，後段錯位會讓旋律和歌詞聽起來都跑掉，
  可能只是錯位、旋律本身沒跑（見下方實測）。**確定的是中文會被唱成粵語**，要國語只能部分改善。
- 要求旋律一個音都不能改、唱國語（例如校歌）且要穩定交件，目前改用歌聲合成軟體（例如 OpenUtau＋DiffSinger 聲庫）照 MIDI 唱，
  伴奏也照譜做 MIDI 再用音色庫算圖。

## 檔案（都放得進 16GB）

| 資料夾 | 檔案 | 大小 |
|---|---|---|
| `checkpoints` | `yue2_3b_int8_convrot.safetensors` | 3.96 GB |
| `audio_encoders` | `sheetsage2_bf16.safetensors` | 1.39 GB |

來源 Hugging Face `Comfy-Org/YuE2`，`X-Linked-ETag` 就是 SHA256。

## 欄位（範本是子圖，API 格式節點 id 形如 `33:25`）

| 節點 | 欄位 | 說明 |
|---|---|---|
| `LoadAudio`（`45`） | `audio` | 參考錄音，放 ComfyUI 的 input 資料夾；用音質好的檔（16kHz／16kbps 這類低音質錄音轉譜容易錯） |
| `SheetSage2AudioToABC`（`33:41`） | `mode` | `melody`（cover 建議）或 `full` |
| `YuE2GenerateMusic`（`33:25`） | `style`、`lyrics` | 風格描述與歌詞（`[Verse]` `[Chorus]` 等段落標籤） |
| 同上 | `abc` | 預設接 SheetSage 的輸出；**也可直接貼自己寫的 ABC 譜**（此時拿掉 `LoadAudio`／SheetSage 節點） |
| 同上 | `cfg_scale` | 預設 1.0（等於不加強風格引導）；見下方實測 |
| 同上 | `max_duration` | 上限秒數，實際長度由譜決定 |
| `SeedNode`（`33:34`） | `seed` | |
| `SaveAudioAdvanced`（`10`） | `filename_prefix` | 輸出 FLAC，48kHz 立體聲 |

- **速度由 ABC 譜的 `Q:` 決定**，風格描述裡寫 BPM 沒有作用；要改速度就改譜的 `Q:`。
- 同一段參考錄音重跑時，SheetSage 的結果會被快取，只改風格或歌詞每版很快。

## 實測要點（一首文言歌詞的中文校歌，55 秒）

- **中文歌詞容易被唱成粵語**：以下寫法都沒用——風格描述只寫 `Chinese`、開頭寫 `Mandarin Chinese, Mandarin pop`、
  加 `not Cantonese`（**否定句反而可能把 Cantonese 餵進去，不要寫**）、歌詞改簡體。
  照 YuE2 官方國語範例寫風格（`Mandarin` 開頭、`clear expressive Mandarin lead vocal`、「照 ABC 唱、歌詞一字不漏、約一字一音」）也還是粵語。
- 有改善的做法：歌詞改成**帶聲調拼音**或**同音的常見簡體字**（文言字換掉），並把 `cfg_scale` 從 1.0 拉到約 **1.6**，才大致唱成國語（使用者評估約八成）。
  拼音要照目標地區的讀音手寫（例如台灣讀音），不要用轉換工具自動產生。
- `cfg_scale` 1.0 時後段容易亂唱、亂改歌詞；1.3 那版長度暴增 20 秒（多唱）；1.6～2.0 較穩。
- **SheetSage 轉出的音數常多於歌詞字數**（一字多音、轉錯的音；實測 97 個音對 81 字），YuE2 大致一個音起一個字，會越唱越錯位。
  改成照樂譜手寫 ABC（含一字一音的版本）可以修正錯位。
- **旋律照不照譜未確定**：當初聽到旋律、歌詞都跑掉，使用者事後判斷前段是對的，問題可能出在後段錯位，不一定是旋律被改。
  要下結論得先排除錯位（手寫 ABC 的音數與字數一致），再逐段比對。
- **agent 聽不到**，每一版請使用者試聽後再調整。

## 速度（RTX 5060 Ti 16GB、ComfyUI 0.42.5）

- 55 秒、首次（含載入與 SheetSage 轉譜）37.7 秒；之後只改風格或歌詞每版約 15 秒。
