# 語音模組測試（Node，無需瀏覽器）

```bash
node tests/dsp-test.js   # 單幀人聲／敲擊判別：合成人聲、敲擊、拍手、電源哼聲等 19 案例
node tests/e2e-test.js   # 端到端會話：假麥克風 + 假辨識引擎，15 個情境（約 40 秒）
node tests/speech-game-test.js   # 語音遊戲共用流程 SpeechGame（假 SpeechModule／DOM）
node tests/user-data-test.js     # 使用者資料層 UserData：遷移、家人、字詞、圖片
```

瀏覽器測試（Playwright + Chromium，先在專案根目錄 `python3 -m http.server 8123`）：
`tests/browser/voyage-browser-test.js`（郵輪）、`voyage-photos-test.js`（郵輪照片：IndexedDB、舊資料搬移、?setup=1）、`back-longpress-test.js`（返回鈕長按：輕按只提示、按住才回上一頁）、`voyage-tts-test.js`（出航時口令在手勢內同步 speak、抵港稱讚）、`voyage-shortword-test.js`（`node make-wav.js dudu`；兩音節短詞算一個詞）、`threshold-test.js`（門檻 20%：假辨識引擎，郵輪說對才抵港／說錯提示、說話板說對才回應）、`board-browser-test.js`（說話板）、`settings-browser-test.js`（設定頁：遷移、家人、照片裁切、字詞圖片、還原）。

`js/speech-recognition.js` 頂層不觸碰瀏覽器 API，可直接 `require()`；
純函數由 `SpeechModule.__dsp` 匯出。改動人聲偵測參數後務必重跑兩者。
