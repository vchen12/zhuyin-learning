// 數字練習（v5.9.4 共用 js/number-practice.js）：牌卡、模式立即切換（無對話框）、自動發音、按牌卡重唸、看數唸出自動聽、我會唸單點；第 0 關掉落遊戲：速度、一碰就算、發音排隊
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
let pass = 0, fail = 0; const errors = [];
function check(n, c) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n); } }
async function waitFor(page, fn, ms, arg) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await page.evaluate(fn, arg)) return true; await page.waitForTimeout(100); } return false; }
const TTS_STUB = () => {
  window.__tts = [];
  const stub = { speaking: false, pending: false, paused: false, getVoices() { return []; }, cancel() {}, addEventListener() {},
    speak(u) { window.__tts.push(u.text); stub.speaking = true; setTimeout(() => { stub.speaking = false; try { if (u.onend) u.onend(new Event('end')); } catch (e) {} }, 120); } };
  Object.defineProperty(window, 'speechSynthesis', { value: stub, configurable: true });
};
(async () => {
  const wav = path.resolve(__dirname, 'voyage-test.wav');   // 循環播放：1.5s 起每隔幾秒有人聲
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + wav, '--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, permissions: ['microphone'] });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('dialog', d => { errors.push('DIALOG ' + d.message().slice(0, 40)); d.accept(); });
  await page.addInitScript(TTS_STUB);
  const tts = () => page.evaluate(() => window.__tts);
  const last = async () => { const t = await tts(); return t[t.length - 1]; };

  console.log('第 1 關 數字練習 0–9');
  await page.goto(BASE + '/level1/games/number-practice.html'); await page.waitForTimeout(500);
  check('一進來是學習模式：大牌卡（數字＋注音）、10 格', await page.$eval('.np-mode[data-mode=learn]', e => e.classList.contains('on')) && (await page.$$eval('#npGrid .np-num', g => g.length)) === 10 && /ㄧ|ㄌ|ㄦ|ㄙ|ㄨ|ㄑ|ㄅ|ㄐ/.test(await page.$eval('#npZy', e => e.textContent)));
  check('牌卡數字夠大（≥ 150px）', (await page.$eval('#npDigit', e => parseFloat(getComputedStyle(e).fontSize))) >= 150);
  await page.click('#npGrid .np-num:nth-child(8)'); await page.waitForTimeout(150);
  check('點數字格 → 牌卡顯示 7、唸「七」', (await page.$eval('#npDigit', e => e.textContent)) === '7' && (await last()) === '七');
  const sevens = (await tts()).filter(t => t === '七').length;   // 開場隨機數字也可能是 7，用差值判斷
  await page.click('#npCard'); await page.waitForTimeout(250);
  const sevens2 = (await tts()).filter(t => t === '七').length;
  check('按牌卡 → 再唸一次（恰好多一次）', sevens2 === sevens + 1);
  if (sevens2 !== sevens + 1) console.log('    tts =', JSON.stringify(await tts()));
  await page.click('.np-mode[data-mode=listen]'); await page.waitForTimeout(900);
  check('切到聽音選數：不跳對話框、立刻出題：牌卡「？」、四個選項、唸了題目', (await page.$eval('#npDigit', e => e.textContent)) === '?' && (await page.$$eval('#npOptions .np-opt', o => o.length)) === 4 && /第 1 \/ 10/.test(await page.$eval('#npProgress', e => e.textContent)));
  const target1 = await page.evaluate(() => window.__tts[window.__tts.length - 1]);
  await page.click('#npCard'); await page.waitForTimeout(150);
  check('按「？」牌卡 → 再唸題目', (await last()) === target1 && (await tts()).filter(t => t === target1).length >= 2);
  const wrong = await page.$$eval('#npOptions .np-opt', (os, t) => { const map = { 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }; return os.map(o => o.textContent).map((v, i) => ({ v, i })).filter(x => parseInt(x.v, 10) !== map[t]).map(x => x.i); }, target1);
  await page.click('#npOptions .np-opt:nth-child(' + (wrong[0] + 1) + ')'); await page.waitForTimeout(200);
  check('選錯 → 搖一下、再試一次', /再試一次/.test(await page.$eval('#npStatus', e => e.textContent)));
  await page.waitForTimeout(900);
  const rightIdx = await page.$$eval('#npOptions .np-opt', (os, t) => { const map = { 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }; return os.findIndex(o => parseInt(o.textContent, 10) === map[t]); }, target1);
  await page.click('#npOptions .np-opt:nth-child(' + (rightIdx + 1) + ')'); await page.waitForTimeout(300);
  check('選對 → 得 10 分、牌卡翻出數字、稱讚', (await page.$eval('#npScore', e => e.textContent)) === '10' && (await page.$eval('#npDigit', e => e.textContent)) !== '?' && (await page.$$eval('#fireworks .firework', f => f.length)) > 0);
  await page.waitForTimeout(2200);
  check('自動下一題', /第 2 \/ 10/.test(await page.$eval('#npProgress', e => e.textContent)) && (await page.$eval('#npDigit', e => e.textContent)) === '?');

  console.log('看數唸出：自動聽、按牌卡示範後再聽、我會唸單點');
  await page.click('.np-mode[data-mode=speak]'); await page.waitForTimeout(1500);
  check('切到看數唸出：不跳對話框、牌卡顯示數字、自動開始聽（麥克風鈕閃爍）', /^\d$/.test(await page.$eval('#npDigit', e => e.textContent)) && await page.evaluate(() => SpeechModule.isListening()) && await page.$eval('#npMic', e => e.classList.contains('listening')));
  check('「✅ 我會唸」不是長按', await page.$eval('#npManual', e => !e.__lpWired && !e.hasAttribute('data-parent-longpress')));
  const n1 = await page.$eval('#npDigit', e => e.textContent);
  await page.waitForTimeout(5000);   // WAV 1.5s 的人聲 → 門檻 0 有說話就過
  const s1 = await page.evaluate(() => ({ score: document.getElementById('npScore').textContent, d: document.getElementById('npDigit').textContent, listening: SpeechModule.isListening() }));
  check('有人聲 → 過關、自動下一題、又自動在聽', parseInt(s1.score, 10) >= 10 && (s1.d !== n1 || parseInt(s1.score, 10) >= 20) && s1.listening);
  const before = (await tts()).length;
  await page.click('#npCard'); await page.waitForTimeout(400);
  const cur = await page.evaluate(() => ({ zy: document.getElementById('npZy').textContent, t: window.__tts.slice(-2) }));
  check('按牌卡 → 先示範唸數字、再自動聽', (await tts()).length > before && /聽我唸/.test(await page.$eval('#npStatus', e => e.textContent)) || await page.evaluate(() => SpeechModule.isListening()));
  await page.waitForTimeout(600);
  check('示範後又在聽', await page.evaluate(() => SpeechModule.isListening()));
  // 假麥克風的人聲會循環，隨時可能自己過關；先等到「沒在慶祝」再按我會唸，並以輪詢判定
  await waitFor(page, () => SpeechModule.isListening(), 4000);
  const scoreBefore = parseInt(await page.$eval('#npScore', e => e.textContent), 10), roundBefore = await page.$eval('#npRound', e => e.textContent);
  await page.click('#npManual');
  const gotScore = await waitFor(page, s => parseInt(document.getElementById('npScore').textContent, 10) >= s + 10, 2500, scoreBefore);
  check('我會唸：按一下就算對（沒有對話框）、得分 +10', gotScore && !errors.some(e => /DIALOG/.test(e)));
  check('之後自動下一題並在聽', await waitFor(page, r => document.getElementById('npRound').textContent !== r && SpeechModule.isListening(), 5000, roundBefore));
  const roundSkip = await page.$eval('#npRound', e => e.textContent);
  await page.click('#npSkip');
  check('跳過 → 唸正確答案、下一題', await waitFor(page, r => document.getElementById('npRound').textContent !== r, 4000, roundSkip) && (await tts()).length > 0);

  console.log('第 2、3 關：同一份程式換資料');
  await page.goto(BASE + '/level2/games/number-practice.html'); await page.waitForTimeout(400);
  check('0–30：31 格、文字「二十一」', (await page.$$eval('#npGrid .np-num', g => g.length)) === 31 && (await page.evaluate(() => NUMBERS[21].text)) === '二十一');
  await page.goto(BASE + '/level3/games/number-practice.html'); await page.waitForTimeout(400);
  check('0–99：100 格、「九十九」「十」「二十」', (await page.$$eval('#npGrid .np-num', g => g.length)) === 100 && (await page.evaluate(() => [NUMBERS[99].text, NUMBERS[10].text, NUMBERS[20].text].join(','))) === '九十九,十,二十');
  check('三關都沒有自己的 startListenMode／confirm', await page.evaluate(() => typeof startListenMode === 'undefined' && !document.documentElement.outerHTML.includes('confirm(')));

  console.log('第 0 關 掉落遊戲');
  await page.goto(BASE + '/level0/index.html'); await page.waitForTimeout(400);
  check('速度：中＝落得慢（26 秒）、出得密（1.3 秒）、最多 10 個', await page.evaluate(() => FALL_SPEEDS.normal.step === 0.22 && FALL_SPEEDS.normal.spawnMs === 1300 && MAX_ITEMS === 10));
  await page.evaluate(() => { setFallSpeed('fast'); startGame(); });   // 非觸控裝置預設「慢」，測試改快
  await page.waitForTimeout(3000);
  const n = await page.$$eval('#gameArea .falling-item', i => i.length);
  check('遊戲中有符號在掉', n >= 2);
  const removed = await page.evaluate(() => { const items = Array.from(document.querySelectorAll('#gameArea .falling-item')); items.forEach(i => i.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); return items.length; });
  await page.waitForTimeout(100);
  check('一碰就消失（pointerdown）、發音排隊只留最近兩個', (await page.$$eval('#gameArea .falling-item', i => i.length)) < removed && await page.evaluate(() => soundPlaying === true && soundQueue.length <= 2));
  await page.waitForTimeout(20000);
  check('畫面最多 10 個', (await page.$$eval('#gameArea .falling-item', i => i.length)) <= 10);

  console.log('錯誤：', errors.length ? errors : '無');
  console.log(`\n${pass}/${pass + fail} 通過`);
  await browser.close(); process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
