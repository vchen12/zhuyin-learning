// 郵輪短詞測試（v5.6.3）：「嘟嘟」這種母音各 120ms、中間有子音的兩音節詞，說完要算一個詞、抵一港
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
(async () => {
  const wav = path.resolve(__dirname, 'dudu-test.wav');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + wav + '%noloop', '--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, permissions: ['microphone'] });
  const page = await ctx.newPage();
  await page.goto(BASE + '/voyage/index.html'); await page.waitForTimeout(600);
  await page.click('#startBtn'); await page.waitForTimeout(10000);
  const log = await page.evaluate(() => JSON.parse(localStorage.getItem('voyage.log') || '[]'));
  const utter = log.filter(x => x.ms), arrivals = log.filter(x => x.arrive !== undefined);
  console.log(`發聲 ${utter.length} 次 [${utter.map(x => x.ms).join(', ')}] ms；抵港 ${arrivals.length} 次`);
  const ok = arrivals.length === 2;
  console.log(ok ? '✅ 短詞測試通過（兩個「嘟嘟」各抵一港）' : '❌ 短詞測試未通過');
  await browser.close(); process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
