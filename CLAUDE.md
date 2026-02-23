# 注音符號學習樂園 - Claude Code 專案上下文

## 專案概述

這是一個為**失語症患者**與**學齡前兒童**設計的注音符號學習 Progressive Web App (PWA)。

- **版本**: v3.10.0
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

## 語音辨識系統（v3.8.0 架構）

### VAD (Voice Activity Detection)
- 門檻值: 50（可在設定頁調整）
- 聲音長度檢查: 每字 ≥ 0.4 秒
- 自適應聆聽時間: 單字 10 秒、短句 8 秒、長句 12-15 秒

### 錄音回放功能
- 使用 MediaRecorder API 錄製用戶發音
- 辨識失敗時：先回放用戶錄音 → 再播放正確答案
- 支援所有語音練習遊戲

### 相似度比對
- 使用 Levenshtein 距離演算法
- 位於 `js/config.js` 的 `calculateSimilarity()` 函數

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

### 語音辨識調整
- VAD 門檻: `js/speech-recognition.js` 的 `VAD_THRESHOLD`
- 聆聽時間: 各遊戲 HTML 中的 `CONFIG.listenDuration`
- 相似度門檻: 各遊戲的 `CONFIG.similarityThreshold`

### 詞彙修改
- 資料來源: `js/vocabulary.js`
- 用戶自訂: localStorage 的 `customVocabulary`
- 8 大分類: family, animals, fruits, items, food, actions, body, nature

### 進度系統
- 儲存位置: localStorage
- 過關門檻: 設定頁可調 0-100%
- 快捷模式: 鼓勵(0%)、練習(50%)、挑戰(80%)、精準(90%)

## 版本歷史重點

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
