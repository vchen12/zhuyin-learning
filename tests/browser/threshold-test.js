// 門檻測試（v5.6.4）：門檻 > 0 時，郵輪要辨識說對口令才抵港（說錯提示再說一次）、說話板說對才有回應。
// 以假的 SpeechRecognition 注入辨識結果（Chromium 的真引擎需連 Google，測試環境不可用）。
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
let pass = 0, fail = 0; const errors = [];
function check(n, c) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n); } }
const FAKE_SR = () => {
  class FakeSR { constructor() { this.lang = ''; this.continuous = false; this.interimResults = false; this.maxAlternatives = 1; this._on = false; }
    start() { this._on = true; FakeSR.active = this; setTimeout(() => { if (this.onstart) this.onstart(); }, 0); }
    stop() { this._on = false; setTimeout(() => { if (this.onend) this.onend(); }, 50); }
    abort() { this._on = false; setTimeout(() => { if (this.onend) this.onend(); }, 0); } }
  FakeSR.active = null;
  window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  window.__fakeAsrEmit = (text) => { const r = FakeSR.active; if (!r || !r._on || !r.onresult) return false;
    const alt = { transcript: text, confidence: 0.9 }; const res = [alt]; res.isFinal = true; const results = [res];
    r.onresult({ results: results, resultIndex: 0 }); return true; };
};
(async () => {
  const wav = path.resolve(__dirname, 'voyage-test.wav');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + wav + '%noloop', '--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, permissions: ['microphone'] });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await page.addInitScript(FAKE_SR);
  await page.addInitScript(() => { localStorage.setItem('similarityThreshold', '20'); });
  // ---------- 郵輪 ----------
  await page.goto(BASE + '/voyage/index.html'); await page.waitForTimeout(700);
  check('起始畫面顯示門檻', /門檻 20%/.test(await page.$eval('#modeLine', e => e.textContent)));
  await page.click('#startBtn');
  await page.waitForTimeout(1900);                                     // WAV 詞 1 在 1.5–1.95s：說「郵輪」
  check('辨識會話已開（假引擎 start）', await page.evaluate(() => window.__fakeAsrEmit('郵輪')));
  await page.waitForTimeout(1200);
  const s1 = await page.evaluate(() => ({ done: document.querySelectorAll('.port.done').length, card: document.getElementById('portCard').classList.contains('show') }));
  check('說對「郵輪」→ 抵第 1 港', s1.done === 1 && s1.card);
  await page.waitForTimeout(5300);                                     // 卡片 3.2s 結束 → 口令換「開船」；WAV 詞 2 在 8.2–8.7s，趁說話中送出辨識結果
  check('詞 2 期間辨識會話開著', await page.evaluate(() => window.__fakeAsrEmit('香蕉')));   // 說錯
  await page.waitForTimeout(3000);
  const s2 = await page.evaluate(() => ({ done: document.querySelectorAll('.port.done').length, hint: document.getElementById('voiceHint').textContent, left: parseFloat(document.getElementById('ship').style.left) }));
  check('說錯「香蕉」→ 不抵港、提示再說一次', s2.done === 1 && /聽到「香蕉」/.test(s2.hint) && /開船/.test(s2.hint));
  await page.waitForTimeout(2200);                                     // WAV 詞 3 在 13.5–14.1s
  await page.evaluate(() => window.__fakeAsrEmit('開船'));
  await page.waitForTimeout(1200);
  const s3 = await page.evaluate(() => document.querySelectorAll('.port.done').length);
  check('再說對「開船」→ 抵第 2 港', s3 === 2);
  const log = await page.evaluate(() => JSON.parse(localStorage.getItem('voyage.log') || '[]'));
  check('紀錄有 miss 與 transcript', log.some(x => x.miss === '開船' && x.transcript === '香蕉') && log.some(x => x.word === '郵輪'));
  // ---------- 說話板（門檻 20%） ----------
  await page.goto(BASE + '/board/index.html?set=iwant'); await page.waitForTimeout(700);
  check('說話板起始畫面顯示門檻', /過關門檻 20%/.test(await page.$eval('#startHint', e => e.textContent)));
  await page.click('#startBtn'); await page.waitForTimeout(400); await page.click('.card'); await page.waitForTimeout(1500);
  const opts = await page.evaluate(() => window.__lastListenOpts || null);
  await page.evaluate(() => window.__fakeAsrEmit('我要尿尿'));
  await page.waitForTimeout(2500);
  const b1 = await page.evaluate(() => ({ reward: document.getElementById('focus').classList.contains('reward'), status: document.getElementById('focusStatus').textContent }));
  check('說話板說對 → 報酬', b1.reward);
  console.log('錯誤：', errors.length ? errors : '無');
  console.log(`\n${pass}/${pass + fail} 通過`);
  await browser.close(); process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
