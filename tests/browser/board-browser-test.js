// 說話板煙霧測試：開 ?set=iwant → 開始 → 點第一張卡 → 假麥克風 WAV（1.5s 起有人聲）→ 應出現報酬與家長判定列 → 按「說對了」→ 回卡片格且紀錄 verdict=ok
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const path = require('path');
(async () => {
  const wav = path.resolve(__dirname, 'board-test.wav');   // node make-wav.js board
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + wav + '%noloop', '--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, permissions: ['microphone'] });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (/❌|Error/.test(m.text())) errs.push(m.text()); });
  await page.goto('http://127.0.0.1:8123/board/index.html?set=iwant');
  await page.waitForSelector('.card');
  const cards = await page.$$eval('.card .lbl', els => els.map(e => e.textContent.trim()));
  console.log('卡片：', cards.join('、'));
  await page.click('#startBtn');                         // 開麥克風（假音軌從此刻起播放）
  await page.waitForTimeout(300);
  await page.click('.card');                             // 點第一張 → 播示範(TTS 無聲音則略過) → 開聽
  await page.waitForSelector('#focus.show');
  const t0 = Date.now();
  let seen = { voiced: false, reward: false, verdict: false, rewardAt: null };
  while (Date.now() - t0 < 9000) {
    const s = await page.evaluate(() => ({ voiced: document.getElementById('focus').classList.contains('voiced'), reward: document.getElementById('focus').classList.contains('reward'), verdict: document.getElementById('verdict').classList.contains('show'), status: document.getElementById('focusStatus').textContent }));
    seen.voiced = seen.voiced || s.voiced; if (s.reward && !seen.reward) seen.rewardAt = Date.now() - t0; seen.reward = seen.reward || s.reward; seen.verdict = seen.verdict || s.verdict;
    if (s.verdict) { await page.screenshot({ path: path.resolve(__dirname, 'board-reward.png') }); break; }
    await page.waitForTimeout(100);
  }
  const status = await page.evaluate(() => document.getElementById('focusStatus').textContent);
  // 「尿尿」約在點卡後 2.95s 說完（音軌 3.25s − 開聽延遲）；報酬必須在說完之後（≥ 3.25s + 1.5s 靜音 − 誤差）
  const rewardAfterSpeech = seen.rewardAt !== null && seen.rewardAt > 4000;
  console.log(`人聲燈=${seen.voiced} 報酬=${seen.reward}（@${seen.rewardAt}ms，說完後才給=${rewardAfterSpeech}） 判定列=${seen.verdict} 狀態="${status}" 耗時=${Date.now() - t0}ms`);
  let verdictOk = false, backToGrid = false;
  if (seen.verdict) {
    { const bb = await (await page.$('#verdict .vbtn.ok')).boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(1400); await page.mouse.up(); }   // 👍 要按住 1.2 秒
    await page.waitForTimeout(1000);
    backToGrid = await page.evaluate(() => !document.getElementById('focus').classList.contains('show'));
    const log = await page.evaluate(() => JSON.parse(localStorage.getItem('board.log') || '[]'));
    verdictOk = log.length > 0 && log[log.length - 1].verdict === 'ok';
    console.log('紀錄：', JSON.stringify(log[log.length - 1]));
  }
  await browser.close();
  if (errs.length) console.log('錯誤：', errs.join('\n'));
  const ok = seen.voiced && seen.reward && rewardAfterSpeech && seen.verdict && verdictOk && backToGrid && errs.length === 0;
  console.log(ok ? '\n✅ 說話板煙霧測試通過' : '\n❌ 說話板煙霧測試未通過');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
