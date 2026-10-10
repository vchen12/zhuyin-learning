// 郵輪 TTS 測試（v5.6.3）：按「出航」時口令必須在手勢內同步 speak（iOS 才播得出來）；抵港稱讚會排在汽笛後講
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
let pass = 0, fail = 0;
function check(n, c) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n); } }
(async () => {
  const wav = path.resolve(__dirname, 'voyage-test.wav');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + wav + '%noloop', '--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, permissions: ['microphone'] });
  const page = await ctx.newPage();
  // 以假 TTS 記錄每次 speak 的文字、是否在使用者手勢內、時間
  await page.addInitScript(() => {
    window.__tts = [];
    const stub = { speaking: false, pending: false, paused: false, getVoices() { return []; }, cancel() {}, addEventListener() {},
      speak(u) { window.__tts.push({ text: u.text, active: navigator.userActivation.isActive, t: performance.now() }); stub.speaking = true;
        setTimeout(() => { stub.speaking = false; try { if (u.onend) u.onend(new Event('end')); } catch (e) {} }, 400); } };
    Object.defineProperty(window, 'speechSynthesis', { value: stub, configurable: true });
  });
  await page.goto(BASE + '/voyage/index.html'); await page.waitForTimeout(800);
  await page.click('#startBtn');
  const first = await page.evaluate(() => window.__tts[0]);
  check('出航：口令立刻（同步）speak，且在使用者手勢內', first && /跟我說：郵輪/.test(first.text) && first.active === true);
  await page.waitForTimeout(12000);   // WAV 1.5s 詞 1 → 抵港；稱讚在汽笛後 1 秒
  const tts = await page.evaluate(() => window.__tts.map(x => x.text));
  check('抵港後有稱讚（含港名）', tts.some(t => /到基隆了/.test(t)));
  check('稱讚後接下一個口令', tts.some(t => /跟我說：開船/.test(t)));
  console.log('  TTS 順序：', tts.join(' | '));
  await page.evaluate(() => openPanel()); await page.click('#restart'); await page.waitForTimeout(300);
  const after = await page.evaluate(() => window.__tts.map(x => x.text));
  check('重新出航 → 再講開場口令', /說話，船就會開！跟我說：郵輪/.test(after[after.length - 1]));
  console.log(`\n${pass}/${pass + fail} 通過`);
  await browser.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
