# 🌟 注音符號學習樂園

專為失語症患者與學齡前兒童設計的注音符號學習 App

## ✨ 功能特色

### 第0關：基礎認識
- 37個注音符號（21個聲母 + 16個韻母）
- 點擊播放真人發音
- 學習進度追蹤（localStorage）
- 已掌握符號標記

### 第一關：射擊挑戰
- 語音辨識互動（Web Speech API）
- 大聲唸出注音符號
- 即時發音辨識與回饋
- 錯誤時顯示嘴型提示
- 鼓勵語音提示

### 第二關：圖片識字（開發中）
- 看圖學單字
- 詞彙分類學習

---

## 📱 PWA 支援（v1.1.0 新增）

本 App 支援 PWA（Progressive Web App），可以：

- **iOS/iPad**：Safari 開啟 → 點「分享」→「加入主畫面」
- **Android**：Chrome 開啟 → 點選單 →「加到主畫面」
- **電腦**：Chrome 網址列右側有安裝按鈕

### 離線使用
安裝後可離線使用，所有音檔和頁面都會快取到裝置上。

---

## 🔊 音檔來源

- 來源：教育部《國語注音符號手冊》
- 授權：創用CC 姓名標示 4.0 國際版本
- 格式：MP3（v1.1.0 從 WAV 轉換，檔案大小從 5.2MB 減少到 324KB）

---

## 📁 專案結構

```
zhuyin-learning/
├── index.html          # 主頁（選關畫面）
├── manifest.json       # PWA 設定檔
├── sw.js               # Service Worker（離線快取）
├── level0/
│   └── index.html      # 第0關：基礎認識
├── level1/
│   └── index.html      # 第一關：射擊挑戰
├── level2/
│   └── index.html      # 第二關：圖片識字（開發中）
├── sounds/
│   ├── F1.mp3 ~ F37.mp3  # 注音發音音檔
│   └── ...
└── icons/
    ├── icon-72.png     # App 圖示（各尺寸）
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    ├── icon-512.png
    ├── apple-touch-icon.png  # iOS 專用
    └── icon.svg        # 原始 SVG
```

---

## 🚀 部署方式

### GitHub Pages
1. 將專案 push 到 GitHub
2. 到 Settings → Pages → Source 選擇 main branch
3. 等待部署完成即可存取

---

## 📋 版本紀錄

### v1.1.0（2025-01-14）
- ✅ PWA 支援（manifest.json + Service Worker）
- ✅ 音檔從 WAV 轉換為 MP3（檔案大小減少 94%）
- ✅ 新增各尺寸 App 圖示
- ✅ 支援離線使用
- ✅ 修正 level1 的 viewport meta tag 語法錯誤

### v1.0.0
- 初始版本
- 第0關：基礎認識
- 第一關：射擊挑戰（語音辨識）

---

## 🛠️ 技術細節

- 純 HTML/CSS/JavaScript，無需建置工具
- 使用 Web Speech API 進行語音辨識
- 使用 localStorage 儲存學習進度
- Service Worker 實現離線快取

---

## 📝 授權

MIT License

音檔來源遵循教育部創用CC授權條款。
