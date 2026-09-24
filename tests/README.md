# 語音模組測試（Node，無需瀏覽器）

```bash
node tests/dsp-test.js   # 單幀人聲／敲擊判別：合成人聲、敲擊、拍手、電源哼聲等 19 案例
node tests/e2e-test.js   # 端到端會話：假麥克風 + 假辨識引擎，10 個情境（約 40 秒）
```

`js/speech-recognition.js` 頂層不觸碰瀏覽器 API，可直接 `require()`；
純函數由 `SpeechModule.__dsp` 匯出。改動人聲偵測參數後務必重跑兩者。
