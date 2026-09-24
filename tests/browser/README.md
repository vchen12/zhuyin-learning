# 郵輪出航 — 真瀏覽器測試

用合成 WAV 當假麥克風餵給 Chromium，驗證：說詞→船動→抵港、敲擊→船不動、長句只抵一港、五港後出現終點。

```bash
cd tests/browser
node make-wav.js                                  # 產生 voyage-test.wav（26.9 秒時間軸見檔內註解）
(cd ../.. && python3 -m http.server 8123 --bind 127.0.0.1 &)   # 專案根目錄起伺服器
npm i -D playwright  # 或設 PLAYWRIGHT_PATH 指向全域安裝；CHROME_PATH 可指定 Chromium 執行檔
node voyage-browser-test.js                       # 結束時輸出 voyage-end.png 截圖
```
