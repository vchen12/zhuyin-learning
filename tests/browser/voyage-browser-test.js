const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const path = require('path');
(async () => {
  const wav = path.resolve(__dirname, 'voyage-test.wav');
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
           '--use-file-for-fake-audio-capture=' + wav + '%noloop', '--autoplay-policy=no-user-gesture-required',
           '--no-sandbox', '--disable-gpu']
  });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, permissions: ['microphone'] });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', m => { const t = m.text(); if (/❌|錯誤|Error|SpeechModule/.test(t)) logs.push(t); });
  page.on('pageerror', e => logs.push('PAGEERROR ' + e.message));
  await page.goto('http://127.0.0.1:8123/voyage/index.html');
  await page.click('#startBtn');
  const t0 = Date.now();
  const t0abs = await page.evaluate(() => Date.now());
  const samples = [];
  while (Date.now() - t0 < 29000) {
    const s = await page.evaluate(() => ({
      left: parseFloat(document.getElementById('ship').style.left) || 0,
      engine: document.body.classList.contains('engine'),
      done: document.querySelectorAll('.port.done').length,
      finale: document.getElementById('finale').classList.contains('show'),
      overlay: document.getElementById('startOverlay').style.display
    }));
    samples.push(Object.assign({ t: ((Date.now() - t0) / 1000).toFixed(2) }, s));
    await page.waitForTimeout(250);
  }
  await page.screenshot({ path: path.resolve(__dirname, 'voyage-end.png') });
  const log = await page.evaluate(() => JSON.parse(localStorage.getItem('voyage.log') || '[]'));
  await browser.close();

  // 摘要
  let prev = null;
  for (const s of samples) {
    const key = s.done + '|' + s.engine + '|' + s.finale;
    if (key !== prev) { console.log(`t=${s.t}s 船=${s.left.toFixed(1)}% 引擎=${s.engine ? 'ON ' : 'off'} 抵港=${s.done} 終點=${s.finale}`); prev = key; }
  }
  // 敲擊區間由紀錄推導：港 1 卡片結束後 +0.2s 到 詞 2 開始前 0.1s
  const utter = log.filter(x => x.ms), arrivals = log.filter(x => x.arrive !== undefined);
  const rel = ms => (ms - t0abs) / 1000;
  let moved = NaN, engineDuringTap = null, win = null;
  if (arrivals[0] && utter[1]) {
    win = [rel(arrivals[0].t) + 3.2 + 0.2, rel(utter[1].t) - 0.1];
    const inTap = samples.filter(s => s.t >= win[0] && s.t <= win[1]);
    moved = inTap.length ? inTap[inTap.length - 1].left - inTap[0].left : NaN;
    engineDuringTap = inTap.some(s => s.engine);
  }
  console.log(`\n敲擊區間 ${win ? win.map(x => x.toFixed(2) + 's').join('–') : '無法推導'}：船位移 = ${moved.toFixed ? moved.toFixed(2) : moved}%（應 0）；引擎曾啟動 = ${engineDuringTap}（應 false）`);
  console.log(`紀錄：發聲 ${utter.length} 次 [${utter.map(x => x.ms).join(', ')}] ms；抵港 ${arrivals.length} 次；終點畫面出現=${samples.some(s => s.finale)}`);
  if (logs.length) console.log('Console:', logs.join('\n'));
  const ok = arrivals.length === 5 && Math.abs(moved) < 0.01 && engineDuringTap === false && utter.length === 5 && samples.some(s => s.finale);
  console.log(ok ? '\n✅ 瀏覽器測試通過' : '\n❌ 瀏覽器測試未通過');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
