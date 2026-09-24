# 注音符號學習樂園 - Claude Code 專案上下文

## 專案概述

這是一個為**失語症患者**與**學齡前兒童**設計的注音符號學習 Progressive Web App (PWA)。

- **版本**: v5.1.0
- **開發者**: 陳宜誠律師 & Claude Code
- **技術棧**: 純 HTML/CSS/JavaScript（無框架、無建置工具）
- **授權**: MIT License（音檔為教育部創用 CC）

## 技術架構

### 核心 API
- **Web Speech API**: 語音辨識（SpeechRecognition）
- **Web Speech Synthesis API**: 文字轉語音（TTS）
- **Web Audio API**: VAD 聲音活動偵測
- **localStorage**: 本地儲存進度與設定
- **Service Worker**: PWA 離線快取

### 關鍵檔案
```
js/config.js              - 全域配置、版本號、鼓勵語、相似度計算
js/speech-recognition.js  - 語音辨識核心（VAD、錄音回放、閃爍動畫）
js/vocabulary.js          - 詞彙資料庫（8大分類、80+詞彙）
js/sentence-generator.js  - 句型產生器（從字詞庫動態產生遊戲內容）
js/prevent-zoom.js        - 防止雙擊放大
sw.js                     - Service Worker 快取策略
settings.html             - 設定頁面（字詞庫管理、麥克風測試）
```

## 專案結構

```
├── index.html            # 主選關畫面
├── settings.html         # 設定頁面
├── level0/index.html     # 基礎認識（37 注音符號）
├── level1/games/         # 6 個遊戲（注音基礎）
├── level2/games/         # 7 個遊戲（圖片識字）
├── level3/games/         # 11 個遊戲（句子閱讀）
├── sounds/F1~F37.mp3     # 37 個注音發音
├── images/public/        # 公開圖庫（8 分類）
└── images/private/       # 私人家人照片
```

## 語音辨識系統（v5.0 架構：人聲偵測優先）

### 設計原則
- **判「有沒有人在發聲」不靠能量，靠基頻**：`js/speech-recognition.js` 以時域自相關（NSDF）
  偵測聲帶振動的週期性（F0 70–600Hz）。敲擊、拍打是非週期脈衝，抓不到穩定基頻 → 不算發聲。
  單幀判定另有：McLeod 零交越規則（排除低頻悶響）、包絡衰減比 ≤ 3.5（排除敲擊餘響）、
  連續 N 幀且基頻不亂跳才確認人聲。
- **零死區**：噪音底線在背景持續校準（取 30 百分位），按下麥克風立刻開始聽。
- **即時回應**：確認人聲約 125ms；鼓勵模式在發聲 ≥220ms 時立即過關，不等辨識引擎。
- **說完即判**：靜音 700ms → 呼叫 `recognition.stop()` 強制收尾，最多再等 1.5 秒，不再空等 7 秒。
- **Web Speech API 對孤立單音節不可靠**：單字／注音拼寫目標採 `hybrid` 模式（辨識命中即過；
  辨識無結果但確認人聲且夠長也過）。詞／句在門檻 > 0 時採 `speech` 模式，完全由相似度決定。
- **任何模式下「沒有人聲」一律不過關**（電視聲被辨識到也不過）。

### 判定模式
| 模式 | 條件 | 過關依據 |
|---|---|---|
| voice | 門檻 = 0 | 確認人聲且發聲 ≥ 最低時長 |
| hybrid | 單音節目標且門檻 > 0 | 辨識命中，或確認人聲且夠長 |
| speech | 詞／句且門檻 > 0 | `passesSimilarityThreshold()` |

### 內建 HUD（聲音燈）
聆聽時模組自行在畫面下方顯示音量環與狀態文字（灰＝安靜、橘＝有聲響非人聲、綠＝人聲），
12 個語音遊戲不需修改即可獲得即時回饋。設定頁可關閉。

### 設定（localStorage）
- `similarityThreshold`：過關門檻（0 = 鼓勵模式）
- `voiceSensitivity`：`high` / `normal` / `low`（清晰度門檻、確認幀數、最低音量）
- `singleSyllableMode`：`voice`（預設）/ `strict`
- `showVoiceHud`：`1` / `0`

### 錄音回放
- MediaRecorder 錄下每次嘗試；辨識失敗時遊戲可先回放用戶錄音再播正確答案。

### 測試
- 純 DSP（`SpeechModule.__dsp.analyzeFrame / classifyFrame`）可在 Node 中以合成訊號測試；
  模組頂層不觸碰瀏覽器 API，`require()` 即可載入。
- `mic-test.html` 第 4 項「人聲偵測測試」供實機驗證：說「ㄚ」亮綠燈、敲螢幕不亮。

## 「說話旅行」方向（v5.1 起的原型）

主要使用者是成年語言障礙者（含開發者的兒子，25 歲，有功能性單詞與固定句型）。設計原則：
- **聲音就是搖桿**：一出聲畫面立刻連續反應，不是說完才評分。
- **報酬是他愛的東西**：他自己的家人照片、食物、交通工具、旅行合照；不用卡通與星星。
- **建立在他既有的「看圖說詞」格式上**，內容換成他的生活。
- **家長判定為最終**：系統負責確認真的發聲、立即報酬、記錄；對不對由家長一鍵決定。
- 觸碰螢幕不推進任何進度；家長功能以長按開啟。
- 注音退為構音輔助層（附掛在已會說的詞的首音），不是入口。

`voyage/index.html`（郵輪出航）：持續發聲船前進；一次發聲 ≥250ms 即抵達下一港，港口揭示家人合照＋合成汽笛；
五港後終點。照片由家長在 iPad 上從「照片」選取，縮至 900px 存 localStorage（`voyage.data`）；
每次發聲與抵港寫入 `voyage.log`，家長面板可看今日統計與匯出。喇叭播音（汽笛／TTS）期間關閉麥克風判定。

裝置：主力 iPad 第五代（iPadOS 16.7，全功能）；iPhone 6 Plus（iOS 12.5）僅人聲偵測可用——
**程式碼不得使用 `?.`、`??`**（iOS 13.1 起才支援），`100dvh` 前須有 `100vh` 後備。

## 開發慣例

### 程式碼風格
- 繁體中文註解
- 每個 HTML 檔案是獨立完整的（包含所有 CSS 和 JS）
- 共享功能放在 `js/` 目錄
- 版本號更新在 `js/config.js` 和 `manifest.json`

### UI 設計原則
- 響應式設計（手機/平板/電腦）
- 使用 `100dvh` 解決手機瀏覽器網址列問題
- 固定高度佈局，無需捲動
- 放大的互動按鈕（適合兒童與長者）
- 麥克風按鈕有閃爍動畫引導

### 新增遊戲步驟
1. 在對應 level 的 `games/` 目錄建立 HTML
2. 在 `levelX/index.html` 加入遊戲卡片
3. 在 `sw.js` 的 `urlsToCache` 加入新檔案
4. 更新 `js/config.js` 版本號

## 常見開發任務

### 語音辨識調整（v5.0 統一模組）
- 所有語音遊戲統一使用 `js/speech-recognition.js` 的 `SpeechModule`，callback 契約：
  `onVoiceDetected / onInterim / onResult / onTimeout / onError`（另有選用 `onVoiceLevel / onSpeechEnd`）
- 人聲偵測參數集中在模組常數區與 `SENSITIVITY` 表；改動後務必重跑合成訊號測試
- 相似度門檻: 設定頁的全域設定，由 `config.js` 的 `getSimilarityThreshold()` 讀取

### 詞彙修改
- 資料來源: `js/vocabulary.js`
- 用戶自訂: localStorage 的 `customVocabulary`
- 8 大分類: family, animals, fruits, items, food, actions, body, nature

### 進度系統
- 儲存位置: localStorage
- 過關門檻: 設定頁可調 0-100%
- 快捷模式: 鼓勵(0%)、練習(50%)、挑戰(80%)、精準(90%)

## 版本歷史重點

- **v5.1.0**: 「郵輪出航」原型（聲音即搖桿）、iOS 12 相容性修正（移除 `?.`、時域資料後備）、起音幀清晰度規則、真瀏覽器測試（tests/browser）
- **v5.0.0**: 人聲偵測架構（NSDF 基頻偵測取代能量 VAD，解決「單音節無即時回應」與「敲螢幕過關」；零死區啟動、說完即判、內建聲音燈 HUD、設定頁靈敏度／單音節模式；mic-test 第 4 項）
- **v4.0.0**: 語音辨識系統全面重構（統一核心模組 SpeechModule、動態噪音底線、多候選比對、單音節強化、門檻=0 智慧模式、設定頁字詞庫與圖片裁切整合）
- **v3.12.0**: 失語症深度優化（錄音回放修復、我會唸按鈕、跳過按鈕、自動TTS讀題、單人練習模式、按鈕放大、延長換題時間）
- **v3.11.0**: 字詞庫與所有遊戲連動（sentence-generator.js、8 個遊戲動態化、customImage 支援）
- **v3.10.0**: 失語症可用性全面修復（SW快取補齊、競賽減速、按鈕放大、跳過按鈕、設定頁 Modal 化）
- **v3.9.0**: 語音即時回饋優化（VAD 強化震動、辨識中提示）+ iPad 選單溢出修正
- **v3.8.1**: 所有語音練習加入錄音回放
- **v3.8.0**: 語音辨識系統全面改進（VAD、聲音長度檢查）
- **v3.7.0**: 字詞庫管理系統升級
- **v3.6**: Level 1 遊戲更新，語音辨識升級
- **v3.5**: Safari 相容性修正、麥克風測試
- **v3.4**: 全面 UI 優化（23 個遊戲）

## 已知問題與注意事項

1. **Safari 語音辨識**: iOS Safari 的 Web Speech API 支援有限，需特別處理
2. **麥克風權限**: 首次使用需用戶授權，HTTPS 環境才能使用
3. **Service Worker 更新**: 修改檔案後需更新 `sw.js` 版本號觸發快取更新

## 部署

- **GitHub Pages**: 推薦，直接推送即部署
- **測試**: 本地使用 `python -m http.server 8000` 或 VS Code Live Server

## 對 Claude 的提醒

1. 這是一個教育應用，目標用戶是失語症患者和學齡前兒童
2. 語音功能是核心，任何修改都要考慮語音辨識的穩定性
3. UI 要簡單直觀，按鈕要夠大
4. 保持程式碼簡潔，避免過度工程化
5. 每次修改後記得更新版本號
6. 新功能要同時更新 Service Worker 快取清單
