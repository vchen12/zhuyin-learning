// 郵輪 v5.8.0：站數由家長決定（最多 12）、每站自己的口令、航行動畫、抵港煙火／彩帶、稱讚句型變化、舊資料遷移
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
let pass = 0, fail = 0; const errors = [];
function check(n, c) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n); } }
const TTS_STUB = () => {
  window.__tts = [];
  const stub = { speaking: false, pending: false, paused: false, getVoices() { return []; }, cancel() {}, addEventListener() {},
    speak(u) { window.__tts.push(u.text); stub.speaking = true; setTimeout(() => { stub.speaking = false; try { if (u.onend) u.onend(new Event('end')); } catch (e) {} }, 300); } };
  Object.defineProperty(window, 'speechSynthesis', { value: stub, configurable: true });
};
(async () => {
  const wav = path.resolve(__dirname, 'voyage-test.wav');
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + wav + '%noloop', '--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, permissions: ['microphone'] });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('dialog', d => d.accept());
  await page.addInitScript(TTS_STUB);
  const data = () => page.evaluate(() => JSON.parse(localStorage.getItem('voyage.data')));

  console.log('舊資料遷移（v5.7 以前：固定 5 站 + 一份口令清單）');
  await page.addInitScript(() => { if (!localStorage.getItem('__seeded')) { localStorage.setItem('voyage.data', JSON.stringify({ ship: null, ports: [{ name: '基隆', imgs: [] }, { name: '福岡', imgs: [] }], words: ['哈囉', '再見'] })); localStorage.setItem('__seeded', '1'); } });
  await page.goto(BASE + '/voyage/index.html'); await page.waitForTimeout(700);
  const d0 = await data();
  check('補滿 5 站、口令依序分配、words 移除、v=2', d0.v === 2 && d0.ports.length === 5 && !d0.words && d0.ports.map(p => p.word).join(',') === '哈囉,再見,哈囉,再見,哈囉' && d0.ports[2].name === '韓國釜山');
  check('畫面口令＝第 1 站的詞', (await page.$eval('#promptWord', e => e.textContent)) === '哈囉');

  console.log('家長面板：加站／刪站／每站口令');
  await page.evaluate(() => openPanel()); await page.waitForTimeout(200);
  check('5 個站槽，每槽有站名、口令兩個輸入', (await page.$$eval('#portSlots .slot', s => s.length)) === 5 && (await page.$$eval('#portSlots input[data-field=word]', s => s.length)) === 5 && (await page.$eval('#addPort', e => e.textContent)) === '➕ 加一站（目前 5 站）');
  for (let i = 0; i < 5; i++) await page.click('#addPort');
  await page.waitForTimeout(200);
  const d1 = await data();
  check('加 5 站 → 10 站，新站有預設站名與口令', d1.ports.length === 10 && d1.ports[9].name === '港口 10' && d1.ports[5].word === '開船' && (await page.$$eval('#portSlots .slot', s => s.length)) === 10);
  await page.fill('#portSlots .slot:nth-child(10) input[data-field=name]', '東京'); await page.dispatchEvent('#portSlots .slot:nth-child(10) input[data-field=name]', 'change');
  await page.fill('#portSlots .slot:nth-child(1) input[data-field=word]', '出發囉'); await page.dispatchEvent('#portSlots .slot:nth-child(1) input[data-field=word]', 'change');
  await page.waitForTimeout(200);
  const d2 = await data();
  check('站名與口令改了就存，畫面口令立即更新', d2.ports[9].name === '東京' && d2.ports[0].word === '出發囉' && (await page.$eval('#promptWord', e => e.textContent)) === '出發囉');
  for (let i = 0; i < 2; i++) await page.click('#addPort');
  check('到 12 站後鈕停用', (await data()).ports.length === 12 && await page.$eval('#addPort', e => e.disabled && /最多 12 站/.test(e.textContent)));
  await page.click('#portSlots .slot:nth-child(12) .delPort'); await page.click('#portSlots .slot:nth-child(11) .delPort'); await page.waitForTimeout(200);
  check('刪兩站 → 10 站、鈕恢復', (await data()).ports.length === 10 && !(await page.$eval('#addPort', e => e.disabled)));
  await page.click('#closePanel'); await page.waitForTimeout(300);
  check('航線 10 站、標籤上下交錯、圓點縮小', (await page.$$eval('#route .port', p => p.length)) === 10 && (await page.$$eval('#route .port .label.below', p => p.length)) === 5 && await page.$eval('#route', e => e.classList.contains('many')));
  check('站名／口令欄留白 → 口令用站名', await page.evaluate(() => { data.ports[0].word = ''; showWord(); const ok = document.getElementById('promptWord').textContent === '基隆'; data.ports[0].word = '出發囉'; showWord(); return ok; }));

  console.log('出航：航行動畫 → 抵港煙火／彩帶 → 稱讚句型');
  await page.click('#startBtn');
  const t0 = Date.now(); let sailing = null, sailLeft = [], fx = null, wakeMax = 0, seenCard = false;
  while (Date.now() - t0 < 8000) {
    const s = await page.evaluate(() => ({ sailing: document.body.classList.contains('sailing'), left: parseFloat(document.getElementById('ship').style.left) || 0, done: document.querySelectorAll('.port.done').length,
      fw: document.querySelectorAll('#fx .fxzone .firework').length, confetti: document.querySelectorAll('#fx .confetti').length, card: document.getElementById('portCard').classList.contains('show'),
      wake: getComputedStyle(document.getElementById('wake')).opacity, dolphin: !!document.querySelector('.dolphin'), gull: document.querySelectorAll('.gull').length }));
    if (s.sailing) { if (!sailing) sailing = s; sailLeft.push(s.left); wakeMax = Math.max(wakeMax, parseFloat(s.wake)); }   // 尾浪 opacity 有 .3s 過渡
    if (s.card) seenCard = true;
    if (s.card && s.fw && !fx) fx = s;
    if (s.done >= 1 && seenCard && !s.card) break;   // 靠岸停 0.4 秒才出卡片（v5.9.8）：要等卡片出現過再收
    await page.waitForTimeout(60);
  }
  check('說完詞 → 進入航行動畫（尾浪、海豚、海鷗）', !!sailing && sailing.dolphin && sailing.gull === 2 && wakeMax > 0.5);
  check('航行中船持續前進到港口', sailLeft.length >= 5 && sailLeft[sailLeft.length - 1] > sailLeft[0] && Math.abs(sailLeft[sailLeft.length - 1] - (6 + 10 * 0.88)) < 0.6);
  check('抵港：卡片期間煙火在卡片外區域、彩帶飄落', !!fx && fx.done === 1 && fx.fw > 0 && fx.confetti > 0);
  await page.waitForTimeout(1500);
  const tts = await page.evaluate(() => window.__tts);
  check('稱讚句含「到基隆了」', tts.some(t => /到基隆了/.test(t)));
  check('稱讚語庫 ≥ 24 句、抽 60 次至少 10 種', await page.evaluate(() => { const set = new Set(); for (let i = 0; i < 60; i++) set.add(getEncouragement('correct')); return APP_CONFIG.encouragements.correct.length >= 24 && set.size >= 10; }));
  check('抵港句型 5 種、每種含「到○○了」', await page.evaluate(() => ARRIVAL_PATTERNS.length === 5 && ARRIVAL_PATTERNS.every(f => /到東京了/.test(f('太棒了！', '東京')))));
  await page.waitForTimeout(26000);   // 其餘 4 個詞
  const log = await page.evaluate(() => JSON.parse(localStorage.getItem('voyage.log') || '[]'));
  const arrivals = log.filter(x => x.arrive !== undefined);
  check('10 站航線：5 個詞抵 5 港、沒有終點', arrivals.length === 5 && !(await page.$eval('#finale', e => e.classList.contains('show'))) && (await page.$$eval('.port.done', p => p.length)) === 5);
  console.log('    抵港：', arrivals.map(a => a.name).join(' → '), '｜口令現在：', await page.$eval('#promptWord', e => e.textContent));
  check('口令跟著站走：第 6 站的詞', (await page.$eval('#promptWord', e => e.textContent)) === (await data()).ports[5].word);

  console.log('錯誤：', errors.length ? errors : '無');
  console.log(`\n${pass}/${pass + fail} 通過`);
  await browser.close(); process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
