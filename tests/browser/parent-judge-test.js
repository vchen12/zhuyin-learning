// 家長判定測試（v5.7.0）：門檻 20%、judgeMode 預設（parent）——郵輪說完出現判定列，按住 👍 才進港、🔁 再一次；說話板說完先判定、👍 才給報酬
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
let pass = 0, fail = 0; const errors = [];
function check(n, c) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n); } }
async function hold(page, sel, ms) { const bb = await (await page.$(sel)).boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); }
async function run(wavName, fn) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.resolve(__dirname, wavName) + '%noloop', '--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, permissions: ['microphone'] });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  await page.addInitScript(() => { localStorage.setItem('similarityThreshold', '20'); });
  await fn(page); await browser.close();
}
(async () => {
  console.log('郵輪');
  await run('voyage-test.wav', async page => {
    await page.goto(BASE + '/voyage/index.html'); await page.waitForTimeout(700);
    check('起始畫面：家長判定', /家長判定/.test(await page.$eval('#modeLine', e => e.textContent)));
    await page.click('#startBtn'); await page.waitForTimeout(4200);               // 詞 1 在 1.5–1.95s，門檻 > 0 時「說完」要等 1.5s（speechEndMs）→ ≈3.5s 出判定列
    const v1 = await page.evaluate(() => ({ show: document.getElementById('verdict').classList.contains('show'), q: document.getElementById('verdictQ').textContent, done: document.querySelectorAll('.port.done').length, left: parseFloat(document.getElementById('ship').style.left) }));
    check('說完 → 判定列出現、問「郵輪」、尚未抵港', v1.show && /郵輪/.test(v1.q) && v1.done === 0);
    await page.click('#verdict .vbtn.ok'); await page.waitForTimeout(300);
    check('輕按 👍 不進港（只提示）', (await page.evaluate(() => document.querySelectorAll('.port.done').length)) === 0 && await page.$eval('#parentHintToast', e => e.style.opacity === '1'));
    await hold(page, '#verdict .vbtn.ok', 1400); await page.waitForTimeout(500);
    const v2 = await page.evaluate(() => ({ show: document.getElementById('verdict').classList.contains('show'), done: document.querySelectorAll('.port.done').length, card: document.getElementById('portCard').classList.contains('show') }));
    check('按住 👍 → 進港、照片', !v2.show && v2.done === 1 && v2.card);
    await page.waitForTimeout(10500);                                                // 詞 2（8.2–8.7s）落在卡片期間被忽略；詞 3 在 13.5–14.1s → ≈15.6s 出判定列
    const v3 = await page.evaluate(() => ({ show: document.getElementById('verdict').classList.contains('show'), q: document.getElementById('verdictQ').textContent }));
    check('第 2 個詞 → 判定列問「開船」', v3.show && /開船/.test(v3.q));
    await page.click('#verdictAgainBtn'); await page.waitForTimeout(400);
    const v4 = await page.evaluate(() => ({ show: document.getElementById('verdict').classList.contains('show'), done: document.querySelectorAll('.port.done').length, hint: document.getElementById('voiceHint').textContent }));
    check('🔁 → 不進港、提示再說一次', !v4.show && v4.done === 1 && /再說一次：開船/.test(v4.hint));
    const log = await page.evaluate(() => JSON.parse(localStorage.getItem('voyage.log') || '[]'));
    check('紀錄 ok / again', log.some(x => x.verdict === 'ok' && x.word === '郵輪') && log.some(x => x.verdict === 'again' && x.word === '開船'));
  });
  console.log('說話板');
  await run('board-test.wav', async page => {
    await page.goto(BASE + '/board/index.html?set=iwant'); await page.waitForTimeout(700);
    check('起始畫面：家長判定', /家長判定/.test(await page.$eval('#startHint', e => e.textContent)));
    await page.click('#startBtn'); await page.waitForTimeout(400); await page.click('.card');
    await page.waitForTimeout(6000);                                                 // 「我要…尿尿」在 1.5–3.25s，靜音 1.5s 後判定
    const b1 = await page.evaluate(() => ({ verdict: document.getElementById('verdict').classList.contains('show'), reward: document.getElementById('focus').classList.contains('reward'), status: document.getElementById('focusStatus').textContent }));
    check('說完 → 先出判定列、還沒給報酬', b1.verdict && !b1.reward && /像「我要尿尿」嗎/.test(b1.status));
    await hold(page, '#verdict .vbtn.ok', 1400); await page.waitForTimeout(200);   // 報酬給了之後 0.7 秒就回卡片格，要馬上看
    const b2 = await page.evaluate(() => ({ reward: document.getElementById('focus').classList.contains('reward'), log: JSON.parse(localStorage.getItem('board.log') || '[]') }));
    check('按住 👍 → 報酬、紀錄 ok', b2.reward && b2.log.some(x => x.verdict === 'ok' && x.basis === 'parent'));
  });
  console.log('錯誤：', errors.length ? errors : '無');
  console.log(`\n${pass}/${pass + fail} 通過`);
  process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
